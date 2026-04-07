<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RideController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Routes Publiques (Accessibles sans connexion) ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/estimate', [RideController::class, 'estimate']);

// --- Routes Protégées (Nécessitent un Token) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Routes spécifiques aux chauffeurs*
    Route::post('/driver/location', [RideController::class, 'updateLocation']);
    Route::get('/drivers/available-rides', [RideController::class, 'availableRides']);
    Route::post('/rides/{id}/accept', [RideController::class, 'acceptRide']);

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
