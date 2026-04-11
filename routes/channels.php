<?php

use App\Models\Ride;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('rides.{rideId}', function ($user, $rideId) {
    $ride = Ride::find($rideId);

    if (!$ride) return false;

    // Récupération des IDs liés à l'utilisateur connecté
    $passengerId = $user->passenger?->id;
    $driverId = $user->driver?->id;

    // Autoriser si l'utilisateur est le passager OU le chauffeur de cette course
    return (int) $passengerId === (int) $ride->passenger_id ||
           (int) $driverId === (int) $ride->driver_id;
});
