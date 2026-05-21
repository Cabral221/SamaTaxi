<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\PassengerController;
use App\Http\Controllers\Api\RideController;
use App\Http\Resources\V1\UserResource; // On importe notre nouvelle ressource propre
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - V1 - SamaTaxi
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // --- Routes Publiques (Accessibles sans connexion) ---
    Route::post('/password/otp', [AuthController::class, 'sendOtp']);
    Route::post('/password/reset', [AuthController::class, 'verifyOtp']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // --- Routes Protégées (Nécessitent un Token Sanctum) ---
    Route::middleware('auth:sanctum')->group(function () {

        // Déconnexion
        Route::post('/logout', [AuthController::class, 'logout']);

        // Route de session unifiée (Zéro bug de timing grâce à la ressource)
        Route::get('/user', function (Request $request) {
            return new UserResource($request->user());
        });

        // Estimation de course (Partagée ou initiée par le passager)
        Route::get('/rides/estimate', [RideController::class, 'estimate']);

        // ==========================================
        // 🚖 ROUTES SPÉCIFIQUES AUX CHAUFFEURS (api/v1/driver/...)
        // ==========================================
        Route::prefix('driver')->group(function () {

            // Actions possibles même si non vérifié (ex: mettre à jour ses infos pour l'examen)
            Route::post('/profile', [DriverController::class, 'updateProfile']);
            Route::get('/rides/history', [DriverController::class, 'history']);

            // Actions BLOCKED tant que l'admin n'a pas validé le compte
            Route::middleware('driver.verified')->group(function () {
                Route::post('/location', [DriverController::class, 'updateLocation']);
                Route::get('/available-rides', [RideController::class, 'availableRides']);
                Route::post('/rides/{id}/accept', [RideController::class, 'acceptRide']);
                Route::post('/rides/{ride}/start', [RideController::class, 'start']);
                Route::post('/rides/{ride}/complete', [RideController::class, 'completeRide']);
                Route::post('/rides/{ride}/cancel', [RideController::class, 'cancelRide']);
                Route::get('/rides/current', [RideController::class, 'current']);
            });
        });

        // ==========================================
        // 📱 ROUTES SPÉCIFIQUES AUX PASSAGERS (api/v1/passenger/...)
        // ==========================================
        Route::prefix('passenger')->group(function () {
            Route::post('/profile', [PassengerController::class, 'updateProfile']);
            Route::post('/rides', [RideController::class, 'store']); // Commander une course
            Route::get('/rides/history', [PassengerController::class, 'history']);
            Route::get('/rides/current', [RideController::class, 'current']);
            Route::post('/rides/{ride}/cancel', [RideController::class, 'cancelRide']);
        });

    });
});
