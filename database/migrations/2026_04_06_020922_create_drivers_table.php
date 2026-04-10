<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->string('phone_number')->unique();
            $table->enum('status', ['available', 'busy', 'offline'])->default('offline');
            // Colonne PostGIS pour la position actuelle
            // On utilise 'geography' pour des calculs précis en mètres/kilomètres
            $table->geography('current_location', 'point', 4326)->nullable();
            // 10 chiffres au total, 8 après la virgule pour une précision au centimètre
            $table->decimal('lat', 10, 8)->nullable()->after('current_location');
            $table->decimal('lng', 11, 8)->nullable()->after('lat');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
