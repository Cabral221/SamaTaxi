<?php

namespace App\Events;

use App\Models\Ride;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;

    public function __construct(Ride $ride)
    {
        // On charge les relations nécessaires pour que le client ait tout (driver, user, etc.)
        $this->ride = $ride->load(['driver.user', 'passenger.user']);
    }

    public function broadcastOn(): array
    {
        // ERREUR CORRIGÉE : Le canal doit correspondre à celui écouté par Echo
        // Dans ton JS, tu écoutes : window.Echo.private(`rides.${ride.id}`)
        return [
            new PrivateChannel('rides.' . $this->ride->id),
        ];
    }

    /**
     * Nom de l'événement côté JS (sans le namespace PHP)
     */
    public function broadcastAs(): string
    {
        return 'ride.started';
    }
}
