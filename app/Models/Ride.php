<?php

namespace App\Models;

use App\Models\Driver;
use App\Models\Passenger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Ride extends Model
{
    protected $fillable = [
        'passenger_id',
        'driver_id',
        'status',
        'pickup_location',
        'destination_location',
        'estimated_price',
        'distance_km',
        'started_at',
        'completed_at'
    ];

    protected $appends = ['pickup_lat', 'pickup_lng'];

    // Accesseur pour la Latitude (Y)
    public function getPickupLatAttribute()
    {
        if (!$this->pickup_location || is_object($this->pickup_location)) {
            return null;
        }

        // On utilise ST_Y directement.
        // Si pickup_location est une ressource stream (Postgres), on la convertit.
        $result = DB::select("SELECT ST_Y(?::geometry) as lat", [$this->pickup_location]);

        return isset($result[0]) ? (float)$result[0]->lat : null;
    }

    // Accesseur pour la Longitude (X)
    public function getPickupLngAttribute()
    {
        if (!$this->pickup_location || is_object($this->pickup_location)) {
            return null;
        }

        $result = DB::select("SELECT ST_X(?::geometry) as lng", [$this->pickup_location]);

        return isset($result[0]) ? (float)$result[0]->lng : null;
    }

    public function passenger()
    {
        return $this->belongsTo(Passenger::class, 'passenger_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }
}
