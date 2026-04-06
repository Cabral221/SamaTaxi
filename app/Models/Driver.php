<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
