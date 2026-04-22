<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ride;
use App\Events\DriverMoved; // Ton nouvel événement
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        $driver = $user->driver;

        // Validation
        $request->validate([
            'avatar' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone_number' => 'required|string|max:20',
            'license' => 'nullable|mimes:pdf,jpg,jpeg,png|max:5120',
            'vehicule_make' => 'required|string|max:255',
            'vehicule_plate' => 'required|unique:drivers,vehicule_plate,' . $driver->id,
        ]);

        // 1. Update User Table
        $user->update(['name' => $request->full_name, 'email' => $request->email]);

        // 2. Handle Avatar Upload
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('drivers/avatars', 'public');
            $driver->avatar = '/storage/' . $avatarPath;
        }

        // 3. Handle License Document Upload
        if ($request->hasFile('license')) {
            $licensePath = $request->file('license')->store('drivers/licenses', 'public');
            $driver->license = '/storage/' . $licensePath;
        }

        // 4. Update Driver Table (les autres champs)
        $driver->update([
            'phone_number' => $request->phone_number,
            'vehicule_make' => $request->vehicule_make,
            'vehicule_model' => $request->vehicule_model,
            'vehicule_plate' => $request->vehicule_plate,
        ]);

        return response()->json(['success' => true, 'driver' => $driver]);
    }

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
            'lat' => $request->lat,
            'lng' => $request->lng,
            'current_location' => DB::raw("ST_GeomFromText('POINT({$request->lng} {$request->lat})', 4326)")
        ]);

        $response = [
            'success' => true,
            'message' => 'Position mise à jour'
        ];

        // 2. Logique liée à la course active
        $activeRide = Ride::where('driver_id', $driver->id)
            ->whereIn('status', ['accepted', 'in_progress']) // Courses actives
            ->first();

        if ($activeRide) {
            // Distance pour le chauffeur (calculée via ton modèle Ride)
            $distance = $activeRide->getDistance($request->lat, $request->lng);

            $response['activehicule_ride_context'] = [
                'distance_to_pickup' => round($distance),
                'is_nearby' => $distance <= 150
            ];

            // 🔥 DIFFUSION TEMPS RÉEL : On prévient le passager que le chauffeur bouge
            broadcast(new DriverMoved($activeRide->id, $request->lat, $request->lng))->toOthers();
        }

        return response()->json($response);
    }

}
