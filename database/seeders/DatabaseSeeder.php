<?php

namespace Database\Seeders;

use App\Models\Driver;
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

    }
}
