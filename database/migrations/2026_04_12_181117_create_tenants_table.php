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
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ens_domain')->unique();
            $table->string('owner_address')->index();
            $table->string('namestone_api_key')->nullable();
            $table->string('slug')->unique();
            $table->string('logo_url')->nullable();
            $table->string('accent_color')->default('#00ff88');
            $table->string('plan')->default('free');
            $table->boolean('active')->default(true);
            $table->integer('claim_limit')->default(50);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
