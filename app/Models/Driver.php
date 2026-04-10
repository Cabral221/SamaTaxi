<?php

namespace App\Models;

use App\Models\Ride;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'phone_number',
        'status',
        'current_location',
        'lat',
        'lng',
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
    ];

    protected $appends = ['lat', 'lng'];

    // Forcez Laravel à ne pas essayer de deviner le type de current_location
    protected $attributes = [
        'status' => 'offline',
    ];

    // Les accesseurs deviennent très simples
    public function getLatAttribute($value)
    {
        return $value;
    }

    public function getLngAttribute($value)
    {
        return $value;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rides()
    {
        return $this->hasMany(Ride::class);
    }
}
