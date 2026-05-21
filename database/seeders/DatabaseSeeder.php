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
        // 1. Compte Admin Spécifique
        User::factory()->create([
            'name' => 'Admin SamaTaxi',
            'email' => 'admin@samataxi.sn',
            'password' => bcrypt('pass123'),
        ]);

        // 2. Création des 50 chauffeurs via la factory corrigée
        Driver::factory(50)->create();

        // 3. Création des 100 passagers via leur factory
        Passenger::factory(100)->create();

        // 4. Passager Spécifique pour tes tests manuels
        $testPassenger = User::factory()->create([
            'name' => 'Client Test',
            'email' => 'client@samataxi.sn',
            'password' => bcrypt('password'),
        ]);

        Passenger::create([
            'user_id' => $testPassenger->id,
            'phone_number' => '+221770000000',
        ]);

        // 5. Chauffeur Spécifique (Modou Fall) : Forcé à 'active' pour bypasser le sas d'attente
        $testDriver = User::factory()->create([
            'name' => 'Driver Test',
            'email' => 'modou.fall@samataxi.sn',
            'password' => bcrypt('password'),
        ]);

        Driver::factory()->create([
            'user_id' => $testDriver->id,
            'account_status' => 'active', // Assure l'accès immédiat au Radar pour tes tests
            'status' => 'offline', // Par défaut, le chauffeur est hors ligne. Tu pourras le mettre en ligne via l'interface ou les tests.
        ]);
    }
}
