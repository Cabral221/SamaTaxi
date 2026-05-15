<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DriverResource\Pages;
use App\Filament\Resources\DriverResource\Pages\CreateDriver;
use App\Filament\Resources\DriverResource\Pages\EditDriver;
use App\Filament\Resources\DriverResource\Pages\ListDrivers;
use App\Filament\Resources\DriverResource\RelationManagers;
use App\Models\Driver;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class DriverResource extends Resource
{
    protected static ?string $model = Driver::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Identité & Compte')
                    ->schema([
                        // Affichage de l'avatar
                        Forms\Components\FileUpload::make('avatar')
                            ->label('Photo de profil')
                            ->avatar()
                            ->directory('avatars')
                            ->columnSpanFull(),

                        Forms\Components\Select::make('user_id')
                            ->relationship('user', 'name')
                            ->label('Nom de l\'utilisateur')
                            ->searchable()
                            ->required(),

                        // Affichage de l'email (Via la relation)
                        Forms\Components\TextInput::make('user_email') // On change le nom pour ne pas créer de conflit
                            ->label('Adresse Email')
                            ->formatStateUsing(fn ($record) => $record?->user?->email) // On récupère l'email manuellement
                            ->placeholder(fn ($record) => $record?->user?->email)
                            ->disabled() // On garde le disabled pour la sécurité
                            ->dehydrated(false), // Évite d'essayer d'enregistrer ce champ dans la table drivers

                        Forms\Components\TextInput::make('phone_number')
                            ->label('Téléphone')
                            ->tel()
                            ->required(),
                    ])->columns(2),

                Forms\Components\Section::make('Véhicule & Statut')
                    ->schema([
                        Forms\Components\Select::make('account_status')
                            ->label('Statut du compte')
                            ->options([
                                'pending' => 'En attente',
                                'active' => 'Activé',
                                'suspended' => 'Suspendu',
                                'rejected' => 'Refusé',
                            ])->required(),

                        Forms\Components\Select::make('service_type')
                            ->label('Gamme de service')
                            ->options([
                                'economy' => 'Économique',
                                'comfort' => 'Confort',
                            ])->required(),

                        Forms\Components\TextInput::make('vehicule_make')
                            ->label('Marque (ex: Toyota)'),

                        Forms\Components\TextInput::make('vehicule_model')
                            ->label('Modèle (ex: Corolla)'),

                        Forms\Components\TextInput::make('vehicule_plate')
                            ->label('Plaque d\'immatriculation'),
                    ])->columns(2),

                Forms\Components\Section::make('Pièces Justificatives')
                    ->schema([
                        Forms\Components\FileUpload::make('license')
                            ->label('Permis de conduire (Scan)')
                            ->directory('documents')
                            ->openable()
                            ->downloadable(),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('avatar')
                    ->label('Photo')
                    ->circular(),

                TextColumn::make('user.name')
                    ->label('Nom')
                    ->searchable()
                    ->sortable(),

                // On remplace l'email par le téléphone ici
                TextColumn::make('phone_number')
                    ->label('Téléphone')
                    ->searchable()
                    ->copyable(), // Petit bonus : permet de copier le numéro d'un clic

                TextColumn::make('vehicule_model')
                    ->label('Véhicule')
                    ->description(fn (Driver $record): string => $record->vehicule_make ?? ''),

                TextColumn::make('account_status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'active' => 'success',
                        'pending' => 'warning',
                        'rejected' => 'danger',
                        'suspended' => 'gray',
                    })
                    ->label('Statut'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('account_status')
                    ->options([
                        'pending' => 'En attente',
                        'active' => 'Actif',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListDrivers::route('/'),
            'create' => CreateDriver::route('/create'),
            'edit' => EditDriver::route('/{record}/edit'),
        ];
    }

    public static function getGlobalSearchEloquentQuery(): Builder
    {
        return parent::getGlobalSearchEloquentQuery()->with(['user']);
    }
}
