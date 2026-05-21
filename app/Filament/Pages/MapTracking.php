<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class MapTracking extends Page
{
    // L'icône qui apparaîtra dans le menu latéral gauche de l'admin
    protected static ?string $navigationIcon = 'heroicon-o-map';

    // Le titre de la page dans le menu et en haut de l'écran
    protected static ?string $navigationLabel = 'Suivi Temps Réel';
    protected static ?string $title = 'Carte de Tracking Chauffeurs';

    // Le fichier Blade associé à cette page
    protected static string $view = 'filament.pages.map-tracking';
}
