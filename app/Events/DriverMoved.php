<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverMoved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $rideId;
    public $lat;
    public $lng;

    public function __construct($rideId, $lat, $lng)
    {
        $this->rideId = $rideId;
        $this->lat = $lat;
        $this->lng = $lng;
    }

    public function broadcastOn()
    {
        // On diffuse uniquement sur le canal privé de la course
        return new PrivateChannel('rides.' . $this->rideId);
    }

    public function broadcastAs()
    {
        return 'driver.moved';
    }
}
