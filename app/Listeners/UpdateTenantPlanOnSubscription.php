<?php

namespace App\Listeners;

use App\Mail\PlanChangedMail;
use App\Models\Tenant;
use Illuminate\Support\Facades\Mail;
use Laravel\Cashier\Events\WebhookReceived;

class UpdateTenantPlanOnSubscription
{
    public function handle(WebhookReceived $event): void
    {
        $payload = $event->payload;
        $type = $payload['type'] ?? '';

        // Events that affect subscription state
        if (! in_array($type, [
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted',
        ])) {
            return;
        }

        $stripeCustomerId = $payload['data']['object']['customer'] ?? null;
        if (! $stripeCustomerId) return;

        $tenant = Tenant::where('stripe_id', $stripeCustomerId)->first();
        if (! $tenant) return;

        if ($type === 'customer.subscription.deleted') {
            $previousPlan = $tenant->plan;
            $tenant->update(['plan' => 'free', 'claim_limit' => 50]);
            $this->sendPlanEmail($tenant, 'free', $previousPlan);
            return;
        }

        $status = $payload['data']['object']['status'] ?? '';
        if (! in_array($status, ['active', 'trialing'])) return;

        // Determine plan from metadata stored at checkout
        $metadata = $payload['data']['object']['metadata'] ?? [];
        $plan = $metadata['plan'] ?? null;

        if ($plan === 'pro') {
            $previousPlan = $tenant->plan;
            $tenant->update(['plan' => 'pro', 'claim_limit' => 500]);
            $this->sendPlanEmail($tenant, 'pro', $previousPlan);
        } elseif ($plan === 'business') {
            $previousPlan = $tenant->plan;
            $tenant->update(['plan' => 'business', 'claim_limit' => 10000]);
            $this->sendPlanEmail($tenant, 'business', $previousPlan);
        }
    }

    private function sendPlanEmail(Tenant $tenant, string $newPlan, string $previousPlan): void
    {
        if (! $tenant->billing_email) return;
        if ($newPlan === $previousPlan) return;

        Mail::to($tenant->billing_email)->send(new PlanChangedMail($tenant, $newPlan, $previousPlan));
    }
}
