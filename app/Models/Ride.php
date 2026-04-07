<?php

namespace App\Models;

use App\Models\Passenger;
use Illuminate\Database\Eloquent\Model;

class Ride extends Model
{
    protected $fillable = [
        'passenger_id',
        'driver_id',
        'pickup_location',
        'destination_location',
        'price',
        'distance_km',
        'status'
    ];

    public function passenger()
    {
        return $this->belongsTo(Passenger::class, 'passenger_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }
}
