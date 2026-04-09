<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideAccepted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;

    /**
     * Create a new event instance.
     */
    public function __construct($ride)
    {
        $this->ride = $ride;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        // Pour le test, on utilise un canal public "rides"
        // Plus tard, on sécurisera avec un PrivateChannel basé sur la ville/zone/passager
        return [
            new Channel('available-rides'), // Pour les autres chauffeurs
            new PrivateChannel('rides.' . $this->ride->id) // Pour LE passager concerné
        ];
    }

    public function broadcastAs(): string
    {
        return 'ride.accepted';
    }
}
