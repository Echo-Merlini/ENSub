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
        Schema::create('tenant_chains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('chain_id');
            $table->string('chain_name');
            $table->string('registry_address')->nullable();
            $table->string('registrar_address')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'chain_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_chains');
    }
};
