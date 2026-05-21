<?php

namespace App\Http\Resources\V1;

use App\Http\Resources\V1\PassengerResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->driver ? 'driver' : ($this->passenger ? 'passenger' : null),
            // Charge la ressource Driver uniquement si la relation a été demandée
            'driver_data' => $this->relationLoaded('driver') && $this->driver ? new DriverResource($this->driver) : null,
            'passenger_data' => $this->relationLoaded('passenger') && $this->passenger ? new PassengerResource($this->passenger) : null,
        ];
    }
}
