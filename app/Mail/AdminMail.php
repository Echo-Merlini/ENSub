<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $resolvedSubject;
    public string $resolvedBody;

    public function __construct(
        string $subject,
        string $body,
        string $tenantName,
    ) {
        // Manual send: subject/body come directly from the admin form.
        // We still wrap with the DB template layout if available.
        $template = EmailTemplate::forType('admin_manual');

        if ($template) {
            $rendered = $template->render([
                'subject'     => $subject,
                'body'        => nl2br(e($body)),
                'tenant_name' => $tenantName,
            ]);
            $this->resolvedSubject = $subject; // always honour admin-entered subject
            $this->resolvedBody    = $rendered['body'];
        } else {
            $this->resolvedSubject = $subject;
            $this->resolvedBody    = '<p>Hi ' . e($tenantName) . ',</p>' . nl2br(e($body));
        }
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->resolvedSubject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.raw', with: ['htmlBody' => $this->resolvedBody]);
    }
}
