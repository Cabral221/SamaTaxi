<?php

use App\Models\Ride;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('rides.{rideId}', function ($user, $rideId) {
    // $ride = Ride::find($rideId);

    // if (!$ride) return false;

    // Seul le passager qui a créé la course ou le chauffeur assigné peut écouter
    // return (int) $user->passenger?->id === (int) $ride->passenger_id ||
    //        (int) $user->driver?->id === (int) $ride->driver_id;

    return true;

    // Pour le test, on autorise tout utilisateur connecté
    // return auth()->check();
});
