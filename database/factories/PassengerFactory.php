<?php

namespace Database\Factories;

use App\Models\Passenger;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Passenger>
 */
class PassengerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // On crée un utilisateur pour chaque passager
            'user_id' => User::factory(),
            'phone_number' => $this->faker->phoneNumber
        ];
    }
}
