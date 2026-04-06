<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    protected $fillable = [
        'full_name',
        'phone_number',
        'status',
        'current_location'
    ];

    // Pour simplifier, on va caster la localisation en attendant
    // d'installer une librairie spatiale plus tard
    protected $casts = [
        // 'current_location' => 'string',
    ];
}
