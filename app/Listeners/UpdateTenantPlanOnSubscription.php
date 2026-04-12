<?php

namespace App\Listeners;

use App\Models\Tenant;
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
            $tenant->update(['plan' => 'free', 'claim_limit' => 50]);
            return;
        }

        $status = $payload['data']['object']['status'] ?? '';
        if (! in_array($status, ['active', 'trialing'])) return;

        // Determine plan from metadata stored at checkout
        $metadata = $payload['data']['object']['metadata'] ?? [];
        $plan = $metadata['plan'] ?? null;

        if ($plan === 'pro') {
            $tenant->update(['plan' => 'pro', 'claim_limit' => 500]);
        } elseif ($plan === 'business') {
            $tenant->update(['plan' => 'business', 'claim_limit' => 10000]);
        }
    }
}
