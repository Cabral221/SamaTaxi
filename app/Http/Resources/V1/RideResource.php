<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RideResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status, // requested, accepted, in_progress, completed, cancelled

            // Adresses textuelles
            'pickup_address' => $this->pickup_address,
            'pickup_lat' => $this->pickup_location ? (float) $this->getPickupLatAttribute() : null,
            'pickup_lng' => $this->pickup_location ? (float) $this->getPickupLngAttribute() : null,
            'destination_address' => $this->destination_address,
            'destination_lat' => $this->destination_location ? (float) $this->getDestinationLatAttribute() : null,
            'destination_lng' => $this->destination_location ? (float) $this->getDestinationLngAttribute() : null,

            // Protection PostGIS : évite d'envoyer l'objet POINT spatial brut
            'has_coordinates' => !is_null($this->pickup_location) && !is_null($this->destination_location),
            'distance_km' => $this->distance_km ? (float) $this->distance_km : null,

            // Données financières
            'estimated_price' => (float) $this->estimated_price,
            'final_price' => $this->final_price ? (float) $this->final_price : null,

            // Timestamps de suivi de la course
            'accepted_at' => $this->accepted_at,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'cancelled_at' => $this->cancelled_at,
            'cancelled_by' => $this->cancelled_by, // ID de l'user qui a annulé

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // ==========================================
            // 👥 RELATIONS FORMATEES POUR LE FRONT (React)
            // ==========================================

            // 1. Le Passager (Client)
            'passenger' => $this->passenger ? new PassengerResource($this->passenger) : null,

            // 2. Le Chauffeur (uniquement s'il y en a un assigné à la course)
            'driver' => $this->driver ? new DriverResource($this->driver) : null,
        ];
    }
}
