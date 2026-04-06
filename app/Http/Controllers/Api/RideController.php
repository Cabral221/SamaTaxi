<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Services\RideService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RideController extends Controller
{
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

        // 1. Calcul du prix
        $price = RideService::estimatePrice($validated['distance_km']);

        // 2. Recherche du chauffeur le plus proche avec PostGIS
        // On cherche un chauffeur "available" à proximité des coordonnées reçues
        $point = "POINT(" . $validated['lng'] . " " . $validated['lat'] . ")";

        $nearestDriver = Driver::where('status', 'available')
            ->select('full_name', 'phone_number')
            ->selectRaw(
                "ST_Distance(current_location, ST_GeomFromText(?, 4326)::geography) as distance_to_client",
                [$point]
            )
            ->orderBy('distance_to_client')
            ->first();

        return response()->json([
            'success' => true,
            'estimate' => [
                'price' => $price,
                'currency' => 'FCFA',
                'distance_trip' => $validated['distance_km'] . ' km'
            ],
            'nearest_driver' => $nearestDriver ? [
                'name' => $nearestDriver->full_name,
                'distance_away' => round($nearestDriver->distance_to_client / 1000, 2) . ' km'
            ] : 'Aucun chauffeur disponible'
        ]);
    }

    public function updateLocation(Request $request, $id)
    {
        $validated = $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $driver = Driver::findOrFail($id);

        // On met à jour la position en SQL brut pour PostGIS
        $driver->update([
            'current_location' => DB::raw("ST_GeomFromText('POINT({$validated['lng']} {$validated['lat']})', 4326)")
        ]);

        return response()->json(['success' => true, 'message' => 'Position mise à jour']);
    }
}
