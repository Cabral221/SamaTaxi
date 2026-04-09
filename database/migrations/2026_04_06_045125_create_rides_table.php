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
        Schema::create('rides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('passenger_id')->constrained('passengers')->onDelete('cascade');
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->onDelete('set null');

            // Statuts : requested, accepted, ongoing, completed, cancelled
            $table->string('status')->default('requested');

            $table->string('pickup_address')->nullable();
            $table->string('destination_address')->nullable();

            // Géographie PostGIS pour l'origine et la destination
            $table->geography('pickup_location', 'point', 4326);
            $table->geography('destination_location', 'point', 4326);
            $table->decimal('distance_km', 8, 2)->nullable();

            $table->decimal('estimated_price', 10, 2);
            $table->decimal('final_price', 10, 2)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rides');
    }
};
