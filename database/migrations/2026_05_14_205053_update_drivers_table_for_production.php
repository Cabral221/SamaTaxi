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
        Schema::table('drivers', function (Blueprint $table) {
            // 1. STATUT ADMINISTRATIF (Point 3 de ta liste)
            // On garde 'status' pour la dispo, mais on ajoute 'account_status'
            $table->enum('account_status', ['pending', 'active', 'suspended', 'rejected'])
                ->default('pending')
                ->after('user_id');

            // 2. GAMME DE VÉHICULE (Point 10)
            $table->enum('service_type', ['economy', 'comfort'])
                ->default('economy')
                ->after('vehicule_model');

            // 3. DOCUMENTS (Point 3)
            $table->string('identity_card')->nullable(); // Recto/Verso ou ID unique
            $table->string('vehicle_registration')->nullable(); // Carte grise
            $table->timestamp('verified_at')->nullable();

            // 4. FINANCES (Point 8)
            // On prépare le terrain pour le système de commission
            $table->decimal('wallet_balance', 10, 2)->default(0.00);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['account_status', 'service_type', 'identity_card', 'vehicle_registration', 'verified_at', 'wallet_balance']);
        });
    }
};
