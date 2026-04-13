<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TenantResource\Pages;
use App\Models\Tenant;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class TenantResource extends Resource
{
    protected static ?string $model = Tenant::class;
    protected static ?string $navigationIcon = 'heroicon-o-globe-alt';
    protected static ?string $navigationLabel = 'Tenants';
    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Project Info')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->required()->placeholder('Pixel Goblins'),
                    Forms\Components\TextInput::make('ens_domain')
                        ->required()->placeholder('pixelgoblins.eth')
                        ->label('ENS Domain'),
                    Forms\Components\TextInput::make('slug')
                        ->required()->placeholder('pixel-goblins')
                        ->helperText('Used in the public claim URL: ensub.org/claim/{slug}'),
                    Forms\Components\TextInput::make('owner_address')
                        ->required()->placeholder('0x...')
                        ->label('Owner Wallet'),
                ])->columns(2),

            Forms\Components\Section::make('Configuration')
                ->schema([
                    Forms\Components\TextInput::make('namestone_api_key')
                        ->password()->revealable()
                        ->label('Namestone API Key'),
                    Forms\Components\TextInput::make('logo_url')
                        ->url()->placeholder('https://...'),
                    Forms\Components\ColorPicker::make('accent_color')
                        ->default('#00ff88'),
                    Forms\Components\Select::make('plan')
                        ->options([
                            'free'     => 'Free',
                            'pro'      => 'Pro ($9/mo)',
                            'business' => 'Business ($29/mo)',
                        ])->default('free')->required(),
                    Forms\Components\TextInput::make('claim_limit')
                        ->numeric()->default(50)->required()
                        ->label('Max Subdomains'),
                    Forms\Components\Toggle::make('active')
                        ->default(true)->inline(false),
                ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()->weight('bold'),
                Tables\Columns\TextColumn::make('ens_domain')
                    ->searchable()->badge()->color('success'),
                Tables\Columns\TextColumn::make('owner_address')
                    ->searchable()->limit(16)->tooltip(fn ($record) => $record->owner_address),
                Tables\Columns\TextColumn::make('plan')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'free'     => 'gray',
                        'pro'      => 'warning',
                        'business' => 'info',
                        default    => 'gray',
                    }),
                Tables\Columns\TextColumn::make('claims_count')
                    ->label('Claims')
                    ->counts('claims')
                    ->sortable(),
                Tables\Columns\TextColumn::make('claim_limit')
                    ->label('Limit')
                    ->sortable(),
                Tables\Columns\IconColumn::make('active')->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()->sortable()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('plan')
                    ->options(['free' => 'Free', 'pro' => 'Pro', 'business' => 'Business']),
                Tables\Filters\TernaryFilter::make('active'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListTenants::route('/'),
            'create' => Pages\CreateTenant::route('/create'),
            'edit'   => Pages\EditTenant::route('/{record}/edit'),
        ];
    }
}
