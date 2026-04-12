<?php

namespace App\Models;

use App\Models\Driver;
use App\Models\Passenger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Ride extends Model
{
    protected $fillable = [
        'passenger_id',
        'driver_id',
        'status',
        'pickup_address',
        'destination_address',
        'pickup_location',
        'destination_location',
        'estimated_price',
        'distance_km',
        'started_at',
        'completed_at'
    ];

    protected $appends = [
        'pickup_lat',
        'pickup_lng',
        'destination_lat',
        'destination_lng'
    ];

    // Accesseur prise en charge pour la Latitude (Y)
    public function getPickupLatAttribute() {
        return $this->getCoord($this->pickup_location, 'y');
    }

    // Accesseur prise en charge pour la Longitude (X)
    public function getPickupLngAttribute() {
        return $this->getCoord($this->pickup_location, 'x');
    }

    // Accesseur pour la Latitude (Y) de la destination
    public function getDestinationLatAttribute() {
        return $this->getCoord($this->destination_location, 'y');
    }

    // Accesseur pour Destination Longitude
    public function getDestinationLngAttribute() {
        return $this->getCoord($this->destination_location, 'x');
    }

    /**
     * Calcule la distance entre un point GPS et le pickup_location de CETTE course
     */
    public function getDistance($lat, $lng) {
        // On passe $this->pickup_location en paramètre pour que SQL sache quoi comparer
        // on capte le status pour savoir si on doit comparer à la destination ou au pickup
        $result = DB::select("
            SELECT ST_Distance(
                ST_GeomFromText('POINT($lng $lat)', 4326)::geography,
                ?::geography
            ) as distance_meters",
            [$this->status === 'in_progress' ? $this->destination_location : $this->pickup_location] // On injecte la donnée de l'instance actuelle
        );

        return $result[0]->distance_meters ?? 999999;
    }

    public function passenger()
    {
        return $this->belongsTo(Passenger::class, 'passenger_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    /**
     * Helper pour extraire les coordonnées sans requête SQL additionnelle
     * PostgreSQL renvoie souvent des ressources stream pour PostGIS
     */
    private function parseLocation($location)
    {
        if (!$location) return null;

        // Si c'est déjà un objet ou une chaîne exploitable (selon votre driver)
        // Sinon, on fait une extraction via SQL une seule fois par instance
        // Pour une optimisation maximale, on peut utiliser ST_AsText dans la requête initiale
        return $location;
    }

    /**
     * Méthode centralisée pour éviter la redondance
     */
    protected function getCoord($location, $axis)
    {
        if (!$location) return null;

        // Cache interne pour éviter de répéter la requête sur le même objet
        $cacheKey = md5((string)$location . $axis);
        if (isset($this->attributes[$cacheKey])) return $this->attributes[$cacheKey];

        $func = strtoupper($axis) === 'X' ? 'ST_X' : 'ST_Y';
        $result = DB::select("SELECT $func(?::geometry) as coord", [$location]);

        $val = isset($result[0]) ? (float)$result[0]->coord : null;
        $this->attributes[$cacheKey] = $val;
        return $val;
    }
}
