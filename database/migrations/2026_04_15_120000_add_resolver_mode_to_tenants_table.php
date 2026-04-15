<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // 'namestone' = offchain Namestone resolver (default)
            // 'l1resolver' = Durin L1Resolver active, on-chain CCIP-Read resolution
            $table->string('resolver_mode', 16)->default('namestone')->after('namestone_api_key');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('resolver_mode');
        });
    }
};
