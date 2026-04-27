<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\PassengerController;
use App\Http\Controllers\Api\RideController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Routes Publiques (Accessibles sans connexion) ---
Route::post('/password/otp', [AuthController::class, 'sendOtp']);
Route::post('/password/reset', [AuthController::class, 'verifyOtp']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// --- Routes Protégées (Nécessitent un Token) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/rides/estimate', [RideController::class, 'estimate']);

    // Routes spécifiques aux chauffeurs*
    Route::post('/driver/location', [DriverController::class, 'updateLocation']);
    Route::post('/driver/profile', [DriverController::class, 'updateProfile']);
    Route::get('/drivers/available-rides', [RideController::class, 'availableRides']);
    Route::post('/rides/{id}/accept', [RideController::class, 'acceptRide']);
    Route::post('/rides/{ride}/start', [RideController::class, 'start']);
    Route::post('/rides/{ride}/complete', [RideController::class, 'completeRide']);
    Route::post('/rides/{ride}/cancel', [RideController::class, 'cancelRide']);
    Route::get('/driver/rides/history', [DriverController::class, 'history']);
    Route::get('/rides/current', [RideController::class, 'current']);
    // Routes spécifiques au passagers
    Route::post('/rides', [RideController::class, 'store']);
    Route::get('/passenger/rides/history', [PassengerController::class, 'history']);
    Route::post('/passenger/profile', [PassengerController::class, 'updateProfile']);

    // Route de deconnexion
    Route::post('/logout', [AuthController::class, 'logout']);
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
            'driver_data' => $isDriver ? $user->driver : null,
            'passenger_data' => $isPassenger ? $user->passenger : null,

        ]);
    });
});
