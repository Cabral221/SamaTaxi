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
        'avatar',
        'account_status', // Le nouveau champ de conformité ('pending', 'active', etc.)
        'status',
        'service_type',   // 'economy' ou 'comfort'
        'current_location',
        'lat',
        'lng',
        'vehicule_make',
        'vehicule_model',
        'vehicule_plate',
        'license',        // Chemin du fichier permis
        'identity_card',  // Chemin CNI
        'vehicle_registration', // Chemin Carte Grise
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
    ];

    protected $appends = ['lat', 'lng', 'avatar_url'];

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

    public function getAvatarUrlAttribute()
    {
        if (!$this->avatar) {
            return null;
        }

        // Si l'avatar commence déjà par http, on le laisse tel quel (cas des seeds ou externes)
        if (str_starts_with($this->avatar, 'http')) {
            return $this->avatar;
        }

        return asset('storage/' . $this->avatar);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rides()
    {
        return $this->hasMany(Ride::class);
    }

    public function isVerified(): bool
    {
        return $this->account_status === 'active';
    }
}
