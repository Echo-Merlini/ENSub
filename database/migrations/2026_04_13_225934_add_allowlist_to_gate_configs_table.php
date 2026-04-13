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
        Schema::table('gate_configs', function (Blueprint $table) {
            // Newline-separated wallet addresses for allowlist gate
            $table->text('allowlist_addresses')->nullable()->after('min_balance');
        });
    }

    public function down(): void
    {
        Schema::table('gate_configs', function (Blueprint $table) {
            $table->dropColumn('allowlist_addresses');
        });
    }
};
