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

    // Route pour un chauffeur met à jour sa position
    Route::post('/driver/location', [RideController::class, 'updateLocation']);

    // Route pour créer une course
    Route::post('/rides', [RideController::class, 'store']);

    // Route pour vérifier si le token est toujours valide
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
