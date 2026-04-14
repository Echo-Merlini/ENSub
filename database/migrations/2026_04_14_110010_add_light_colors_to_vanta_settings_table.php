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
        Schema::table('vanta_settings', function (Blueprint $table) {
            $table->string('color_light', 7)->default('#555555')->after('color');
            $table->string('background_color_light', 7)->default('#f0f2f5')->after('background_color');
        });
    }

    public function down(): void
    {
        Schema::table('vanta_settings', function (Blueprint $table) {
            $table->dropColumn(['color_light', 'background_color_light']);
        });
    }
};
