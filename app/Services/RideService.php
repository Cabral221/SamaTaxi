<?php

namespace App\Services;

class RideService
{
    /**
     * Calcule le prix estimé d'une course
     * Base : 500 FCFA + 300 FCFA/km
     */
    public static function estimatePrice($distanceInKm)
    {
        $baseFare = 500;
        $pricePerKm = 200;

        $total = $baseFare + ($distanceInKm * $pricePerKm);

        // On arrondit à la dizaine supérieure pour que ce soit propre en FCFA
        return ceil($total / 10) * 10;
    }

    public static function isInsideServiceArea($lat, $lng)
    {
        // Centre de Dakar (environ Place de l'Indépendance)
        $dakarCenterLat = 14.6667;
        $dakarCenterLng = -17.4333;
        $maxRadiusKm = 40; // On couvre Dakar + Banlieue + Diamniadio

        // Formule simplifiée (ou on peut utiliser PostGIS plus tard)
        $distance = self::calculateDistance($lat, $lng, $dakarCenterLat, $dakarCenterLng);

        return $distance <= $maxRadiusKm;
    }

    private static function calculateDistance($lat1, $lon1, $lat2, $lon2) {
        $theta = $lon1 - $lon2;
        $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
        $dist = acos($dist);
        $dist = rad2deg($dist);
        return $dist * 60 * 1.1515 * 1.609344; // Conversion en KM
    }

    public function requestRide($pickupLocation, $dropoffLocation)
    {
        // Logique pour trouver un conducteur disponible
        // et créer une course
    }

    public function completeRide($rideId)
    {
        // Logique pour marquer une course comme terminée
        // et calculer le coût de la course
    }
}


