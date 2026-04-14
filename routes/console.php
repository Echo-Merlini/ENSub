<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Sync L2 mints from on-chain events every 15 minutes
Schedule::command('l2:sync')->everyFifteenMinutes()->withoutOverlapping();
