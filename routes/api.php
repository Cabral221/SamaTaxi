<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\RideController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Routes Publiques (Accessibles sans connexion) ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// --- Routes Protégées (Nécessitent un Token) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/rides/estimate', [RideController::class, 'estimate']);

    // Routes spécifiques aux chauffeurs*
    Route::post('/driver/location', [DriverController::class, 'updateLocation']);
    Route::get('/drivers/available-rides', [RideController::class, 'availableRides']);
    Route::post('/rides/{id}/accept', [RideController::class, 'acceptRide']);
    Route::post('/rides/{ride}/start', [RideController::class, 'start']);
    Route::post('/rides/{ride}/complete', [RideController::class, 'completeRide']);
    Route::post('/rides/{ride}/cancel', [RideController::class, 'cancelRide']);
    Route::get('/rides/current', [RideController::class, 'current']);
    // Route pour créer une course
    Route::post('/rides', [RideController::class, 'store']);

    // Route pour vérifier si le token est toujours valide
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        // On charge explicitement les relations pour être sûr
        $isDriver = $user->driver()->exists();
        $isPassenger = $user->passenger()->exists();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $isDriver ? 'driver' : ($isPassenger ? 'passenger' : null),
        ]);
    });
});
