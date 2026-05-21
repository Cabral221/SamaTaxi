<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FlotteDriverMoved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $driver_id;
    public $driver_name;
    public $lat;
    public $lng;

    public function __construct($driverId, $driverName, $lat, $lng)
    {
        $this->driver_id = $driverId;
        $this->driver_name = $driverName;
        $this->lat = $lat;
        $this->lng = $lng;
    }

    public function broadcastOn()
    {
        // Un canal public pour que l'admin (et le radar général) puisse écouter tout le monde d'un coup
        return new Channel('global-drivers');
    }

    public function broadcastAs()
    {
        return 'driver.movedGlobal';
    }
}
