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
        // Coordonnées approximatives de Dakar (Min/Max pour couvrir la presqu'île)
        $lat = fake()->latitude(14.66, 14.76);
        $lng = fake()->longitude(-17.52, -17.42);

        return [
            'user_id' => User::factory(), // Crée un User pour chaque Driver
            'full_name' => fake()->name(),
            'phone_number' => fake()->phoneNumber(),
            'status' => fake()->randomElement(['available', 'busy', 'offline']),
            'current_location' => DB::raw("ST_GeomFromText('POINT($lng $lat)', 4326)"),
        ];
    }
}
