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
        'current_location'
    ];

    // Pour simplifier, on va caster la localisation en attendant
    // d'installer une librairie spatiale plus tard
    protected $casts = [
        // 'current_location' => 'string',
    ];

    protected $appends = ['lat', 'lng'];

    // Forcez Laravel à ne pas essayer de deviner le type de current_location
    protected $attributes = [
        'status' => 'offline',
    ];

    public function getLatAttribute()
    {
        // 1. Si on a déjà forcé la valeur (via le controller ou setAttribute)
        if (isset($this->attributes['lat'])) {
            return (float) $this->attributes['lat'];
        }

        // 2. Si current_location est une chaîne binaire (PostgreSQL standard)
        // On essaie d'extraire la valeur si elle existe dans l'objet
        return $this->current_location && method_exists($this->current_location, 'getLat')
            ? $this->current_location->getLat()
            : null;
    }

    public function getLngAttribute()
    {
        if (isset($this->attributes['lng'])) {
            return (float) $this->attributes['lng'];
        }

        return $this->current_location && method_exists($this->current_location, 'getLng')
            ? $this->current_location->getLng()
            : null;
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
