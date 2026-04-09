<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ride;
use App\Events\DriverMoved; // Ton nouvel événement
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    public function updateLocation(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $driver = auth()->user()->driver;
        if (!$driver) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // 1. Mise à jour de la position dans la DB
        $driver->update([
            'current_location' => DB::raw("ST_GeomFromText('POINT({$request->lng} {$request->lat})', 4326)")
        ]);

        $response = [
            'success' => true,
            'message' => 'Position mise à jour'
        ];

        // 2. Logique liée à la course active
        $activeRide = Ride::where('driver_id', $driver->id)
            ->whereIn('status', ['accepted', 'arrived'])
            ->first();

        if ($activeRide) {
            // Distance pour le chauffeur (calculée via ton modèle Ride)
            $distance = $activeRide->getDistanceToPickup($request->lat, $request->lng);

            $response['active_ride_context'] = [
                'distance_to_pickup' => round($distance),
                'is_nearby' => $distance <= 150
            ];

            // 🔥 DIFFUSION TEMPS RÉEL : On prévient le passager que le chauffeur bouge
            broadcast(new DriverMoved($activeRide->id, $request->lat, $request->lng))->toOthers();
        }

        return response()->json($response);
    }

}
