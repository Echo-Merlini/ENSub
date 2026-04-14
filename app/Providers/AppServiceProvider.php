<?php

namespace App\Providers;

use App\Listeners\UpdateTenantPlanOnSubscription;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Events\WebhookReceived;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Behind Traefik reverse proxy — force HTTPS so asset URLs are generated correctly
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        Event::listen(WebhookReceived::class, UpdateTenantPlanOnSubscription::class);
    }
}
