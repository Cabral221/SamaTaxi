<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PassengerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'phone_number' => $this->phone_number,
            'avatar' => $this->avatar ? asset('storage/' . $this->avatar) : null,
            'user' => new UserResource($this->whenLoaded('user')), // Charge la ressource User uniquement si la relation a été chargée
        ];
    }
}
