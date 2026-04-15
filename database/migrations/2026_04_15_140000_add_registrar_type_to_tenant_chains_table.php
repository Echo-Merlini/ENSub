<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_chains', function (Blueprint $table) {
            $table->string('registrar_type', 16)->default('open')->after('registrar_address');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_chains', function (Blueprint $table) {
            $table->dropColumn('registrar_type');
        });
    }
};
