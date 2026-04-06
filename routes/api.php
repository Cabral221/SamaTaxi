<?php

use App\Http\Controllers\Api\RideController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Cette route sera accessible via http://127.0.0.1:8000/api/estimate
Route::post('/estimate', [RideController::class, 'estimate']);
Route::patch('/driver/{id}/location', [RideController::class, 'updateLocation']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
