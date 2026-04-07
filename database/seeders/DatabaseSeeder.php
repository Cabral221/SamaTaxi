<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\Passenger;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // On crée un compte Admin spécifique pour toi tester
        User::factory()->create([
            'name' => 'Admin SamaTaxi',
            'email' => 'admin@samataxi.sn',
            'password' => bcrypt('pass123'),
        ]);

        // On crée 50 chauffeurs (ce qui créera aussi 50 utilisateurs automatiquement)
        Driver::factory(50)->create();

        // On crée 100 passagers (ce qui créera aussi 100 users automatiquement)
        Passenger::factory(100)->create();

        // Optionnel : Créer un passager spécifique pour tes tests manuels
        $testPassenger = User::factory()->create([
            'name' => 'Client Test',
            'email' => 'client@samataxi.sn',
            'password' => bcrypt('password'),
        ]);

        Passenger::create([
            'user_id' => $testPassenger->id,
            'phone_number' => '+221770000000',
        ]);

        // Optionnel : Créer un chauffeur spécifique pour tes tests manuels
        $testDriver = User::factory()->create([
            'name' => 'Driver Test',
            'email' => 'modou.fall@samataxi.sn',
            'password' => bcrypt('password'),
        ]);

        Driver::create([
            'user_id' => $testDriver->id,
            'phone_number' => '+221771111111',
        ]);

    }
}
