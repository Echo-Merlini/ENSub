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
        Schema::create('vanta_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('enabled')->default(false);
            $table->string('color', 7)->default('#c5c5c5');
            $table->string('background_color', 7)->default('#0f1117');
            $table->float('points')->default(6);
            $table->float('max_distance')->default(22);
            $table->float('spacing')->default(19);
            $table->boolean('mouse_controls')->default(true);
            $table->boolean('touch_controls')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vanta_settings');
    }
};
