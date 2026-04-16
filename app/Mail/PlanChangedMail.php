<?php

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PlanChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Tenant $tenant,
        public string $newPlan,
        public string $previousPlan,
    ) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->newPlan) {
            'free'     => 'Your ENSub plan has been cancelled',
            'pro'      => 'Welcome to ENSub Pro!',
            'business' => 'Welcome to ENSub Business!',
            default    => 'Your ENSub plan has changed',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.plan-changed');
    }
}
