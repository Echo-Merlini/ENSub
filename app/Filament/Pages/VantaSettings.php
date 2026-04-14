<?php

namespace App\Filament\Pages;

use App\Models\VantaSetting;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;

class VantaSettings extends Page implements Forms\Contracts\HasForms
{
    use Forms\Concerns\InteractsWithForms;

    protected static ?string $navigationIcon  = 'heroicon-o-sparkles';
    protected static ?string $navigationLabel = 'Background';
    protected static ?string $title           = 'Animated Background';
    protected static string  $view            = 'filament.pages.vanta-settings';

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill(VantaSetting::instance()->toArray());
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Effect')
                    ->schema([
                        Forms\Components\Toggle::make('enabled')
                            ->label('Enable animated background')
                            ->helperText('When enabled, a live NET mesh covers the entire site.')
                            ->columnSpanFull(),
                    ]),

                Forms\Components\Section::make('Colours')
                    ->schema([
                        Forms\Components\ColorPicker::make('color')
                            ->label('Line & dot colour')
                            ->helperText('Hex, e.g. #c5c5c5'),
                        Forms\Components\ColorPicker::make('background_color')
                            ->label('Background colour')
                            ->helperText('Should match your page bg — dark #0f1117, light #f0f2f5'),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Mesh')
                    ->schema([
                        Forms\Components\TextInput::make('points')
                            ->label('Points density')
                            ->numeric()->step(0.5)->minValue(1)->maxValue(20)
                            ->helperText('Number of connection points (1–20)'),
                        Forms\Components\TextInput::make('max_distance')
                            ->label('Max connection distance')
                            ->numeric()->step(1)->minValue(5)->maxValue(60),
                        Forms\Components\TextInput::make('spacing')
                            ->label('Spacing')
                            ->numeric()->step(1)->minValue(5)->maxValue(60),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Interaction')
                    ->schema([
                        Forms\Components\Toggle::make('mouse_controls')
                            ->label('React to mouse movement'),
                        Forms\Components\Toggle::make('touch_controls')
                            ->label('React to touch'),
                    ])
                    ->columns(2),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        $setting = VantaSetting::instance();
        $setting->update([
            'enabled'          => $data['enabled'] ?? false,
            'color'            => $data['color'],
            'background_color' => $data['background_color'],
            'points'           => $data['points'],
            'max_distance'     => $data['max_distance'],
            'spacing'          => $data['spacing'],
            'mouse_controls'   => $data['mouse_controls'] ?? false,
            'touch_controls'   => $data['touch_controls'] ?? false,
        ]);

        Notification::make()
            ->title('Background settings saved')
            ->success()
            ->send();
    }
}
