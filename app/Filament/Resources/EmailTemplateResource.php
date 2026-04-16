<?php

namespace App\Filament\Resources;

use App\Filament\Resources\EmailTemplateResource\Pages;
use App\Mail\RawHtmlMail;
use App\Models\EmailTemplate;
use App\Models\Tenant;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Mail;

class EmailTemplateResource extends Resource
{
    protected static ?string $model = EmailTemplate::class;
    protected static ?string $navigationIcon  = 'heroicon-o-envelope-open';
    protected static ?string $navigationLabel = 'Email Templates';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?int    $navigationSort  = 5;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Template Info')
                ->schema([
                    Forms\Components\TextInput::make('label')
                        ->required()
                        ->label('Template name'),
                    Forms\Components\TextInput::make('trigger')
                        ->label('Trigger / when sent')
                        ->disabled()
                        ->dehydrated(false),
                    Forms\Components\Toggle::make('active')
                        ->default(true)
                        ->inline(false),
                ])->columns(3),

            Forms\Components\Section::make('Content')
                ->schema([
                    Forms\Components\TextInput::make('subject')
                        ->required()
                        ->columnSpanFull()
                        ->helperText('Supports {placeholders}'),
                    Forms\Components\Textarea::make('body')
                        ->required()
                        ->rows(28)
                        ->columnSpanFull()
                        ->label('Body (HTML)')
                        ->helperText('Full HTML. Available placeholders: {tenant_name}, {tenant_domain}, {tenant_slug}, {new_plan}, {previous_plan}, {claim_limit}, {dashboard_url}, {body} (admin manual only)'),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('label')
                    ->weight('bold')
                    ->searchable(),
                Tables\Columns\TextColumn::make('subject')
                    ->limit(60),
                Tables\Columns\TextColumn::make('trigger')
                    ->label('Trigger')
                    ->color('gray')
                    ->limit(60),
                Tables\Columns\IconColumn::make('active')->boolean(),
                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Last edited')
                    ->since()
                    ->sortable(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('send_test')
                    ->label('Send test')
                    ->icon('heroicon-o-paper-airplane')
                    ->color('gray')
                    ->form([
                        Forms\Components\TextInput::make('email')
                            ->email()
                            ->required()
                            ->label('Send test to'),
                    ])
                    ->action(function (EmailTemplate $record, array $data): void {
                        $vars = [
                            'tenant_name'   => 'Test Project',
                            'tenant_domain' => 'test.eth',
                            'tenant_slug'   => 'test',
                            'new_plan'      => 'Pro',
                            'previous_plan' => 'Free',
                            'claim_limit'   => '500',
                            'dashboard_url' => 'https://ensub.org/manage/test',
                            'body'          => '<p>This is a test message from the ENSub admin panel.</p>',
                        ];

                        $rendered = $record->render($vars);

                        Mail::to($data['email'])
                            ->send(new RawHtmlMail('[TEST] ' . $rendered['subject'], $rendered['body']));

                        Notification::make()
                            ->title('Test email sent')
                            ->body('Sent to ' . $data['email'])
                            ->success()
                            ->send();
                    }),
                Tables\Actions\Action::make('send_all')
                    ->label('Send to all')
                    ->icon('heroicon-o-megaphone')
                    ->color('warning')
                    ->visible(fn (EmailTemplate $record) => $record->type === 'newsletter')
                    ->form(function (EmailTemplate $record) {
                        $count = Tenant::whereNotNull('billing_email')->count();
                        return [
                            Forms\Components\Placeholder::make('info')
                                ->label('')
                                ->content("Will send to {$count} tenant(s) with a notification email set."),
                            Forms\Components\TextInput::make('subject')
                                ->required()
                                ->default($record->subject)
                                ->label('Subject (override)'),
                            Forms\Components\Textarea::make('body_override')
                                ->rows(6)
                                ->label('Body content (replaces {body} placeholder)')
                                ->placeholder('Leave blank to use the template as-is'),
                        ];
                    })
                    ->requiresConfirmation()
                    ->modalHeading('Send newsletter to all tenants')
                    ->modalDescription('This will send a real email to every tenant with a notification email.')
                    ->modalSubmitActionLabel('Send now')
                    ->action(function (EmailTemplate $record, array $data): void {
                        $tenants = Tenant::whereNotNull('billing_email')->get();
                        $sent = 0;

                        foreach ($tenants as $tenant) {
                            $vars = [
                                'tenant_name'   => $tenant->name,
                                'tenant_domain' => $tenant->ens_domain,
                                'tenant_slug'   => $tenant->slug,
                                'dashboard_url' => 'https://ensub.org/manage/' . $tenant->slug,
                                'body'          => $data['body_override']
                                    ? nl2br(e($data['body_override']))
                                    : '',
                            ];

                            $rendered = $record->render($vars);
                            $subject  = $data['subject'] ?: $rendered['subject'];

                            Mail::to($tenant->billing_email)
                                ->send(new RawHtmlMail($subject, $rendered['body']));

                            $sent++;
                        }

                        Notification::make()
                            ->title('Newsletter sent')
                            ->body("Sent to {$sent} tenant(s).")
                            ->success()
                            ->send();
                    }),
            ])
            ->bulkActions([])
            ->paginated(false);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListEmailTemplates::route('/'),
            'edit'  => Pages\EditEmailTemplate::route('/{record}/edit'),
        ];
    }
}
