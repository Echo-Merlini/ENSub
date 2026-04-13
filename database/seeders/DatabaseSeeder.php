<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Auto-create admin user if none exists
        if (! User::where('email', env('ADMIN_EMAIL', 'merloproductions@gmail.com'))->exists()) {
            User::create([
                'name'     => env('ADMIN_NAME', 'Tiago'),
                'email'    => env('ADMIN_EMAIL', 'merloproductions@gmail.com'),
                'password' => bcrypt(env('ADMIN_PASSWORD', 'ENSub2026!')),
            ]);
        }
    }
}
