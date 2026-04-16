<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PlanChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $resolvedSubject;
    public string $resolvedBody;

    public function __construct(Tenant $tenant, string $newPlan, string $previousPlan)
    {
        $typeMap = [
            'pro'      => 'plan_upgraded_pro',
            'business' => 'plan_upgraded_business',
            'free'     => 'plan_cancelled',
        ];

        $templateType = $typeMap[$newPlan] ?? 'plan_cancelled';
        $template     = EmailTemplate::forType($templateType);

        $planLabels = ['free' => 'Free', 'pro' => 'Pro', 'business' => 'Business'];

        $vars = [
            'tenant_name'    => $tenant->name,
            'tenant_domain'  => $tenant->ens_domain,
            'tenant_slug'    => $tenant->slug,
            'new_plan'       => $planLabels[$newPlan] ?? $newPlan,
            'previous_plan'  => $planLabels[$previousPlan] ?? $previousPlan,
            'dashboard_url'  => 'https://ensub.org/manage/' . $tenant->slug,
            'claim_limit'    => match ($newPlan) {
                'pro'      => '500',
                'business' => '10,000',
                default    => '50',
            },
        ];

        if ($template) {
            $rendered = $template->render($vars);
            $this->resolvedSubject = $rendered['subject'];
            $this->resolvedBody    = $rendered['body'];
        } else {
            $this->resolvedSubject = 'Your ENSub plan has changed';
            $this->resolvedBody    = '<p>Your plan is now <strong>' . e($vars['new_plan']) . '</strong>.</p>';
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
