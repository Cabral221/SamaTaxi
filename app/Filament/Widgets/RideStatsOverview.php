<?php

namespace App\Filament\Widgets;

use App\Models\Driver;
use App\Models\Ride;
use Carbon\Carbon;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class RideStatsOverview extends BaseWidget
{
    protected static ?string $pollingInterval = '10s';

    protected function getStats(): array
    {
        // 1. Nombre de courses aujourd'hui
        $todayRides = Ride::whereDate('created_at', Carbon::today())->count();

        // 2. CA Total (Courses terminées)
        $totalRevenue = Ride::where('status', 'completed')->sum('final_price');

        // 3. Chauffeurs en ligne
        $onlineDrivers = Driver::whereIn('status', ['available', 'busy'])->count();

        return [
            Stat::make("Courses aujourd'hui", $todayRides)
                ->description('Demandes reçues depuis minuit')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('warning'),

            Stat::make('Chiffre d’Affaires Total', number_format($totalRevenue, 0, ',', ' ') . ' FCFA')
                ->description('Courses encaissées et terminées')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),

            Stat::make('Chauffeurs en ligne', $onlineDrivers)
                ->description('Actuellement sur le radar')
                ->descriptionIcon('heroicon-m-truck')
                ->color($onlineDrivers > 0 ? 'success' : 'gray'),
        ];
    }
}
