<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DriverResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'phone_number' => $this->phone_number,
            'avatar' => $this->avatar ? asset('storage/' . $this->avatar) : null, // URL complète pour le front React
            'status' => $this->status,
            'account_status' => $this->account_status,
            'service_type' => $this->service_type,

            // Coordonnées pour l'application mobile
            'lat' => $this->lat ? (float) $this->lat : null,
            'lng' => $this->lng ? (float) $this->lng : null,
            'has_coordinates' => !is_null($this->current_location),

            // Infos Véhicule
            'vehicule_make' => $this->vehicule_make,
            'vehicule_model' => $this->vehicule_model,
            'vehicule_plate' => $this->vehicule_plate,

            // Documents administratifs
            'license' => $this->license ? asset('storage/' . $this->license) : null,
            'identity_card' => $this->identity_card,
            'vehicle_registration' => $this->vehicle_registration,
            'verified_at' => $this->verified_at,

            // Comptabilité
            'wallet_balance' => (float) $this->wallet_balance,

            'user' => new UserResource($this->whenLoaded('user')), // Charge la ressource User uniquement si la relation a été chargée
        ];
    }
}
