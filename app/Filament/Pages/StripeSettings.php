<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class StripeSettings extends Page
{
    protected static ?string $navigationIcon  = 'heroicon-o-credit-card';
    protected static ?string $navigationLabel = 'Stripe Settings';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?string $title           = 'Stripe Settings';
    protected static ?int    $navigationSort  = 10;

    protected static string $view = 'filament.pages.stripe-settings';

    public function getViewData(): array
    {
        $keyRaw = config('cashier.key', '');
        $masked = $keyRaw ? substr($keyRaw, 0, 8) . str_repeat('•', max(0, strlen($keyRaw) - 8)) : '— not set —';

        return [
            'publishable_key' => $masked,
            'secret_set'      => (bool) config('cashier.secret'),
            'webhook_set'     => (bool) config('cashier.webhook.secret'),
            'price_pro'       => config('services.stripe.price_pro', '— not set —'),
            'price_business'  => config('services.stripe.price_business', '— not set —'),
            'webhook_url'     => url('/stripe/webhook'),
        ];
    }
}
