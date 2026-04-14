<?php

namespace App\Events;

use App\Models\Ride;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;

    public function __construct(Ride $ride)
    {
        $this->ride = $ride;
    }

    public function broadcastOn()
    {
        // On diffuse sur un canal privé dédié à cette course spécifique
        return new PrivateChannel('rides.' . $this->ride->id);
    }

    public function broadcastAs()
    {
        return 'ride.completed';
    }
}
