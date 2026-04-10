<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RideAccepted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;
    public $driverPosition; // Nouvel objet à la racine

    /**
     * Create a new event instance.
     */
    public function __construct($ride)
    {
        $this->ride = $ride;

        // On extrait manuellement les données pour être sûr qu'elles ne soient pas null
        // On utilise l'objet driver lié à la course
        $this->driverPosition = [
            'lat' => (float) $ride->driver->lat,
            'lng' => (float) $ride->driver->lng,
        ];

        // TEST DE DÉBOGAGE (Côté Serveur) :
        Log::info("Coords du driver avant envoi : " . $this->driverPosition['lat'] . ", " . $this->driverPosition['lng']);
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

    /**
     * 🔥 LA SOLUTION EST ICI
     * On définit manuellement ce qui est envoyé au WebSocket
     * pour éviter que Laravel ne recharge une version "vide" du driver.
     */
    public function broadcastWith()
    {
        return [
            'ride' => $this->ride->load(['driver.user', 'passenger.user']),
            'driverPosition' => $this->driverPosition // Envoyé côte à côte
        ];
    }
}
