<?php

namespace App\Events;

use App\Models\Ride;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideCancelled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;
    public $canceledBy; // 'driver' ou 'passenger'

    public function __construct(Ride $ride, $canceledBy)
    {
        $this->ride = $ride;
        $this->canceledBy = $canceledBy;
    }

    public function broadcastOn()
    {
        // On utilise le même canal privé que pour le suivi
        return new PrivateChannel('rides.' . $this->ride->id);
    }

    public function broadcastAs()
    {
        return 'ride.canceled';
    }
}
