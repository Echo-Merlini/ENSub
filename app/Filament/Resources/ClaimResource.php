<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ClaimResource\Pages;
use App\Models\Claim;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ClaimResource extends Resource
{
    protected static ?string $model = Claim::class;
    protected static ?string $navigationIcon = 'heroicon-o-tag';
    protected static ?string $navigationLabel = 'Claims';
    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('tenant_id')
                ->relationship('tenant', 'name')->required()->searchable(),
            Forms\Components\TextInput::make('wallet_address')->required(),
            Forms\Components\TextInput::make('subdomain')->required(),
            Forms\Components\TextInput::make('full_name')->required(),
            Forms\Components\TextInput::make('tx_hash'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('tenant.name')
                    ->sortable()->searchable()->weight('bold'),
                Tables\Columns\TextColumn::make('full_name')
                    ->searchable()->badge()->color('success')
                    ->label('Subdomain'),
                Tables\Columns\TextColumn::make('wallet_address')
                    ->searchable()->limit(18)
                    ->tooltip(fn ($record) => $record->wallet_address),
                Tables\Columns\TextColumn::make('minted_chains')
                    ->label('L2 Mints')
                    ->formatStateUsing(function ($state) {
                        $names = [
                            8453   => 'Base',
                            10     => 'Optimism',
                            42161  => 'Arbitrum',
                            137    => 'Polygon',
                            59144  => 'Linea',
                            534352 => 'Scroll',
                        ];
                        // Badge mode: called once per element (int); fallback for full array
                        if (is_int($state) || is_numeric($state)) {
                            return $names[(int) $state] ?? "Chain {$state}";
                        }
                        if (!is_array($state) || empty($state)) return '—';
                        return implode(', ', array_map(fn($id) => $names[$id] ?? "Chain $id", $state));
                    })
                    ->badge()->color('info'),
                Tables\Columns\TextColumn::make('tx_hash')
                    ->limit(16)->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()->sortable()->since(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tenant')
                    ->relationship('tenant', 'name'),
            ])
            ->actions([
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
            'index'  => Pages\ListClaims::route('/'),
            'create' => Pages\CreateClaim::route('/create'),
            'edit'   => Pages\EditClaim::route('/{record}/edit'),
        ];
    }
}
