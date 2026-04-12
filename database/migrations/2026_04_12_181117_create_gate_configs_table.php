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
        Schema::create('gate_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['nft', 'token', 'open', 'allowlist']);
            $table->string('chain')->default('ethereum');
            $table->string('contract_address')->nullable();
            $table->string('collection_slug')->nullable();   // for ETHscriptions
            $table->decimal('min_balance', 36, 18)->nullable();
            $table->integer('max_per_wallet')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gate_configs');
    }
};
