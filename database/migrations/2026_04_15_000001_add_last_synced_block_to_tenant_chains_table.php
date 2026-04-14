<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_chains', function (Blueprint $table) {
            $table->unsignedBigInteger('last_synced_block')->nullable()->after('enabled');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_chains', function (Blueprint $table) {
            $table->dropColumn('last_synced_block');
        });
    }
};
