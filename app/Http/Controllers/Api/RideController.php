<?php

namespace App\Http\Controllers\Api;

use App\Events\RideRequested;
use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\Ride;
use App\Services\RideService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RideController extends Controller
{

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
        ]);

        // 2. Création de la course
        $ride = Ride::create([
            'passenger_id' => $passenger->id,
            'pickup_location' => DB::raw("ST_GeomFromText('POINT({$validated['pickup_lng']} {$validated['pickup_lat']})', 4326)"),
            'destination_location' => DB::raw("ST_GeomFromText('POINT({$validated['destination_lng']} {$validated['destination_lat']})', 4326)"),
            'estimated_price' => $validated['price'],
            'distance_km' => $validated['distance_km'],
            'status' => 'requested', // Statut initial : En attente
        ]);

        // 3. Émettre un événement pour notifier les chauffeurs disponibles
        event(new RideRequested($ride));

        // 4. Retourner la réponse au Frontend
        return response()->json([
            'success' => true,
            'message' => 'Demande de course envoyée !',
            'ride' => $ride
        ], 201);
    }

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
        $rides = Ride::where('status', 'requested')
            ->whereNull('driver_id')
            ->whereRaw("ST_Distance($driverPoint, pickup_location) <= ?", [$radius])
            ->select('*')
            ->selectRaw("ST_Distance($driverPoint, pickup_location) as distance_to_pickup")
            ->orderBy('distance_to_pickup')
            ->get();

        Return response()->json([
            'success' => true,
            'count' => $rides->count(),
            'available_rides' => $rides
        ]);

    }

    public function acceptRide(Request $request, $id)
    {
        // 1. Récupérer le chauffeur connecté
        $driver = auth()->user()->driver;
        if (!$driver) {
            return response()->json(['message' => 'Accès refusé. Vous n\'êtes pas un chauffeur.'], 403);
        }


        // 2. Accepter la course (Mise à jour atomique)
        // On ajoute la condition 'status' => 'requested' directement dans l'UPDATE SQL
        $updated = Ride::where('id', $id)
            ->where('status', 'requested') // Sécurité : la ligne doit encore être libre
            ->update([
                'driver_id' => $driver->id,
                'status' => 'accepted'
            ]);

        // Si $updated est égal à 0, cela veut dire qu'un autre chauffeur a été plus rapide !
        if (!$updated) {
            return response()->json([
                'message' => 'Désolé, un autre chauffeur vient d\'accepter cette course.'
            ], 409); // Code 409 : Conflict
        }

        // On recharge le modèle pour avoir les relations (passenger, user)
        $ride = Ride::with('passenger.user')->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Course acceptée ! En route vers le client.',
            'ride' => $ride->load('passenger.user') // Charger les infos du passager pour le chauffeur
        ]);
    }

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

    public function updateLocation(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        // 1. On récupère l'utilisateur connecté via le Token
        $user = $request->user();

        // 2. On vérifie que cet utilisateur est bien un chauffeur
        $driver = $user->driver;

        if (!$driver) {
            return response()->json(['message' => 'Accès refusé. Vous n\'êtes pas un chauffeur.'], 403);
        }

        // 3. Mise à jour de SA position uniquement
        $driver->update([
            'current_location' => DB::raw("ST_GeomFromText('POINT({$request->lng} {$request->lat})', 4326)")
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Position de ' . $driver->user->name . ' mise à jour avec succès.'
        ]);
    }
}
