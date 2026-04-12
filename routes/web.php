<?php

use App\Http\Controllers\ClaimController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\ClaimApiController;
use App\Http\Controllers\Api\OnboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Home'))->name('home');
Route::get('/start', fn () => Inertia::render('Onboard'))->name('onboard');
Route::get('/pricing', fn () => Inertia::render('Pricing', ['slug' => request()->query('slug')]))->name('pricing');

// Public claim pages
Route::get('/claim/{slug}', [ClaimController::class, 'show'])->name('claim.show');

// Claim API (stateless JSON)
Route::prefix('api/claim/{slug}')->group(function () {
    Route::get('check',  [ClaimApiController::class, 'check']);
    Route::get('mine',   [ClaimApiController::class, 'mine']);
    Route::post('/',     [ClaimApiController::class, 'claim']);
});

// Onboarding API
Route::prefix('api/onboard')->group(function () {
    Route::get('nonce',      [OnboardController::class, 'nonce']);
    Route::post('verify',    [OnboardController::class, 'verify']);
    Route::post('check-ens', [OnboardController::class, 'checkEns']);
    Route::post('create',    [OnboardController::class, 'create']);
});

// Billing API
Route::prefix('api/billing')->group(function () {
    Route::post('upgrade', [BillingController::class, 'upgrade']);
    Route::post('portal',  [BillingController::class, 'portal']);
    Route::get('status',   [BillingController::class, 'status']);
});
