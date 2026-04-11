<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            // Index pour accélérer ST_Distance et ST_Within
            DB::statement('CREATE INDEX rides_pickup_location_index ON rides USING GIST (pickup_location)');
            DB::statement('CREATE INDEX rides_destination_location_index ON rides USING GIST (destination_location)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            //
        });
    }
};
