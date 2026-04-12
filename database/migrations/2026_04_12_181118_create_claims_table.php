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
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('wallet_address')->index();
            $table->string('subdomain');
            $table->string('full_name');                    // subdomain.ens_domain
            $table->string('tx_hash')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'subdomain']);
            $table->unique(['tenant_id', 'wallet_address']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claims');
    }
};
