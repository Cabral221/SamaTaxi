<?php

namespace App\Models;

use App\Models\Ride;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Passenger extends Model
{

    use HasFactory;

    protected $fillable = [
        'user_id',
        'phone_number',
        'avatar',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rides()
    {
        return $this->hasMany(Ride::class);
    }
}
