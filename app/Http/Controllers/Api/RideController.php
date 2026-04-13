<?php

namespace App\Http\Controllers\Api;

use App\Events\RideAccepted;
use App\Events\RideCancelled;
use App\Events\RideCompleted;
use App\Events\RideRequested;
use App\Events\RideStarted;
use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\Ride;
use App\Services\RideService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RideController extends Controller
{
    // Commande de Course
    public function store(Request $request)
    {
        // On récupère le profil passager de l'utilisateur connecté
        $passenger = auth()->user()->passenger;

        if (!$passenger) {
            return response()->json(['message' => 'Profil passager introuvable'], 403);
        }

        // 1. Validation des données entrantes
        $validated = $request->validate([
            'pickup_lat' => 'required|numeric',
            'pickup_lng' => 'required|numeric',
            'destination_lat' => 'required|numeric',
            'destination_lng' => 'required|numeric',
            'price' => 'required|numeric',
            'distance_km' => 'required|numeric',
            'pickup_address' => 'nullable|string', // Nouvelle colonne
            'destination_address' => 'nullable|string', // Nouvelle colonne
        ]);

        // 2. Création de la course
        $ride = Ride::create([
            'passenger_id' => $passenger->id,
            'pickup_location' => DB::raw("ST_GeomFromText('POINT({$validated['pickup_lng']} {$validated['pickup_lat']})', 4326)"),
            'destination_location' => DB::raw("ST_GeomFromText('POINT({$validated['destination_lng']} {$validated['destination_lat']})', 4326)"),
            'pickup_address' => $validated['pickup_address'] ?? null, // Stockage de l'adresse texte
            'destination_address' => $validated['destination_address'] ?? null, // Stockage de l'adresse texte
            'estimated_price' => $validated['price'],
            'distance_km' => $validated['distance_km'],
            'status' => 'requested', // Statut initial : En attente
        ]);


        // 🔥 LA CORRECTION EST ICI :
        // On recharge le ride depuis la base pour transformer le DB::raw en vrai binaire lisible
        $ride = Ride::find($ride->id);

        // 3. Émettre un événement pour notifier les chauffeurs disponibles
        event(new RideRequested($ride));

        // 4. Retourner la réponse au Frontend
        return response()->json([
            'success' => true,
            'message' => 'Demande de course envoyée !',
            'ride' => $ride
        ], 201);
    }

    // Endpoint pour les chauffeurs : Voir les courses disponibles à proximité
    public function availableRides(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $lat = $request->lat;
        $lng = $request->lng;
        // Rayon de recherche (ex : 5000 m -- 5km)
        $radius = 50000;

        // On définit le point géographique une seule fois pour plus de clarté
        // Note le ::geography à la fin de la chaîne SQL pour forcer le type géographique et éviter les erreurs de distance
        $driverPoint = "ST_GeomFromText('POINT($lng $lat)', 4326)::geography";

        $rides = Ride::with('passenger.user') // Ajout de la relation pour avoir le nom du client dans le radar
            ->where('status', 'requested')
            ->whereNull('driver_id')
            ->whereRaw("ST_Distance($driverPoint, pickup_location) <= ?", [$radius])
            ->select('*')
            // Optimisation : On récupère les points en texte pour éviter les requêtes N+1 des accesseurs
            ->selectRaw("ST_AsText(pickup_location) as pickup_wkt")
            ->selectRaw("ST_AsText(destination_location) as destination_wkt")
            ->selectRaw("ST_Distance($driverPoint, pickup_location) as distance_to_pickup")
            ->orderBy('distance_to_pickup')
            ->get();

        return response()->json([
            'success' => true,
            'count' => $rides->count(),
            'available_rides' => $rides // Grâce aux $appends dans Ride.php, pickup_lat et pickup_lng seront inclus ici
        ]);

    }

    // Endpoint pour les chauffeurs : Accepter une course
    public function acceptRide(Request $request, $id)
    {
        $driver = auth()->user()->driver;
        if (!$driver) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        // Optionnel : On peut aussi mettre à jour le statut du chauffeur pour qu'il n'apparaisse plus dans les recherches
        $driver->update(['status' => 'busy']);

        // Mise à jour du statut
        $updated = Ride::where('id', $id)
            ->where('status', 'requested')
            ->update([
                'driver_id' => $driver->id,
                'status' => 'accepted',
                'accepted_at' => now()
            ]);

        if (!$updated) {
            return response()->json(['message' => 'Désolé, course déjà prise.'], 409);
        }

        // 2. LA CLÉ : Utiliser refresh() ou un fresh() avec les relations
        // On recharge la course ET on force le rechargement de la relation driver
        $ride = Ride::with(['passenger.user', 'driver.user'])->find($id);


        // Pour être 100% certain que le driver est à jour avec les colonnes lat/lng
        $ride->driver->refresh();



        // On émet l'événement pour le client (Navigation.jsx)
        event(new RideAccepted($ride));

        return response()->json([
            'success' => true,
            'message' => 'Course acceptée !',
            'ride' => $ride
        ]);
    }

    // Endpoint pour les chauffeurs : Démarrer la course (passer en in_progress)
    public function start(Ride $ride)
    {
        // Passer le statut à 'in_progress'
        $ride->update([
            'status' => 'in_progress',
            'started_at' => now()
        ]);
        $ride->refresh(); // On recharge pour être sûr d'avoir les dernières données

        // Diffuser l'événement pour que le client change aussi de vue
        event(new RideStarted($ride));

        return response()->json(['success' => true, 'ride' => $ride]);
    }

    public function completeRide(Ride $ride)
    {
        // 1. Vérification de sécurité
        // Seul le chauffeur assigné à cette course peut la terminer
        if ($ride->driver_id !== auth()->user()->driver->id) {
            return response()->json(['message' => 'Action non autorisée'], 403);
        }

        // 2. Mise à jour de la course
        $ride->update([
            'status' => 'completed',
            'completed_at' => now(),
            'final_price' => $ride->estimated_price // Pour l'instant on garde le prix estimé
        ]);

        // 3. Libération du chauffeur
        // On repasse son statut à 'available' pour qu'il reçoive de nouvelles courses
        $ride->driver->update(['status' => 'available']);
        $ride->refresh();

        // 4. Notification (Optionnel)
        // On peut émettre un événement pour que le passager reçoive un reçu ou une alerte
        event(new RideCompleted($ride));

        return response()->json([
            'success' => true,
            'message' => 'Course terminée. Merci !',
            'ride' => $ride
        ]);
    }

    // Endpoint pour l'estimation de course + radar client
    public function estimate(Request $request)
    {
        $validated = $request->validate([
            'distance_km' => 'required|numeric',
            'lat' => 'required|numeric', // Latitude du client (ex: Almadies)
            'lng' => 'required|numeric', // Longitude du client
        ]);

        if (!RideService::isInsideServiceArea($request->lat, $request->lng)) {
            return response()->json([
                'success' => false,
                'message' => "Désolé, SamaTaxi n'est pas encore disponible dans cette zone."
            ], 403);
        }

        // 1. Calcul du prix (notre service de hier)
        $price = RideService::estimatePrice($request->distance_km);

        // 2. Recherche des 5 chauffeurs les plus proches via PostGIS
        // On prépare le point WKT (Well-Known Text) proprement
        $pointWkt = "POINT({$request->lng} {$request->lat})";

        // On utilise ST_DistanceSphere pour obtenir la distance en mètres
        $nearbyDrivers = Driver::where('status', 'available')
            ->select('id', 'phone_number', 'status', 'user_id')
            // On utilise ST_AsText pour éviter le bug de sérialisation binaire
            ->selectRaw("ST_AsText(current_location) as location_text")
            ->selectRaw(
                "ST_Distance(current_location, ST_GeographyFromText(?)) as distance_m",
                ["SRID=4326;$pointWkt"]
            )
            ->orderBy('distance_m')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'estimation' => [
                'price' => $price,
                'currency' => 'XOF',
                'distance_trip_km' => $request->distance_km
            ],
            'available_drivers' => $nearbyDrivers
        ]);
    }

    public function cancelRide(Request $request, Ride $ride)
    {
        $user = auth()->user();
        // 1. Vérification : l'utilisateur est-il lié à la course ?
        $isDriver = ($user->driver && $ride->driver_id === $user->driver->id);
        $isPassenger = ($user->passenger && $ride->passenger_id === $user->passenger->id);

        if (!$isDriver && !$isPassenger) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        // 2. Mise à jour de la course
        $ride->update([
            'status' => 'cancelled',
            'cancelled_by' => $user->id, // On stocke l'ID de l'USER
            'completed_at' => now()
        ]);
        // 3. Libérer le chauffeur si nécessaire
        if ($ride->driver) {
            $ride->driver->update(['status' => 'available']);
        }
        // 4. Déterminer le rôle pour l'événement (pour l'UI React)
        $role = $isDriver ? 'driver' : 'passenger';
        // 🔥 Diffusion de l'annulation
        event(new RideCancelled($ride, $role));

        return response()->json([
            'success' => true,
            'message' => 'Course annulée',
            'canceled_by' => $role
        ]);
    }

}
