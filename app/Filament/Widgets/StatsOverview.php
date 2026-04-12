<?php

namespace App\Filament\Widgets;

use App\Models\Claim;
use App\Models\Tenant;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Tenants', Tenant::count())
                ->description('Registered ENS domains')
                ->icon('heroicon-o-globe-alt')
                ->color('success'),

            Stat::make('Active Tenants', Tenant::where('active', true)->count())
                ->description('Currently serving claims')
                ->icon('heroicon-o-check-circle')
                ->color('info'),

            Stat::make('Total Claims', Claim::count())
                ->description('Subdomains issued across all tenants')
                ->icon('heroicon-o-tag')
                ->color('warning'),

            Stat::make('Pro Plans', Tenant::where('plan', 'pro')->count())
                ->description('Paid subscriptions')
                ->icon('heroicon-o-star')
                ->color('success'),
        ];
    }
}
