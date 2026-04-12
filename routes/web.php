<?php

use App\Http\Controllers\ClaimController;
use App\Http\Controllers\Api\ClaimApiController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Home'))->name('home');

// Public claim pages
Route::get('/claim/{slug}', [ClaimController::class, 'show'])->name('claim.show');

// Claim API (stateless JSON)
Route::prefix('api/claim/{slug}')->group(function () {
    Route::get('check',  [ClaimApiController::class, 'check']);
    Route::get('mine',   [ClaimApiController::class, 'mine']);
    Route::post('/',     [ClaimApiController::class, 'claim']);
});
