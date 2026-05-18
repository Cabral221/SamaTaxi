<?php

namespace Database\Factories;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;

/**
 * @extends Factory<Driver>
 */
class DriverFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Coordonnées approximatives de Dakar
        $lat = fake()->latitude(14.66, 14.76);
        $lng = fake()->longitude(-17.52, -17.42);

        return [
            'user_id' => User::factory(),
            // numerify('########') va remplacer chaque '#' par un chiffre aléatoire
            'phone_number' => '+2217' . fake()->numerify('########'),
            'status' => fake()->randomElement(['available', 'busy', 'offline']),
            'account_status' => fake()->randomElement(['active', 'pending']),
            'current_location' => DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)"),
        ];
    }
}
