<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    /**
     * POST /api/billing/upgrade
     * Creates a Stripe Checkout session for the given plan.
     *
     * Body: { slug, plan, email, success_url, cancel_url }
     */
    public function upgrade(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug'        => 'required|string|exists:tenants,slug',
            'plan'        => 'required|in:pro,business',
            'email'       => 'required|email',
            'success_url' => 'required|url',
            'cancel_url'  => 'required|url',
        ]);

        $tenant = Tenant::where('slug', $validated['slug'])->firstOrFail();

        // Store billing email
        $tenant->update(['billing_email' => $validated['email']]);

        $priceId = match ($validated['plan']) {
            'pro'      => config('services.stripe.price_pro'),
            'business' => config('services.stripe.price_business'),
        };

        $checkoutParams = [
            'success_url' => $validated['success_url'],
            'cancel_url'  => $validated['cancel_url'],
            // metadata on the session itself (for reference)
            'metadata' => [
                'tenant_slug' => $tenant->slug,
                'plan' => $validated['plan'],
            ],
            // subscription_data.metadata is what gets copied onto the subscription
            // object — this is what the webhook listener reads
            'subscription_data' => [
                'metadata' => [
                    'tenant_slug' => $tenant->slug,
                    'plan' => $validated['plan'],
                ],
            ],
        ];
        // Do NOT pass customer_email here — Cashier's checkout() internally calls
        // createOrGetStripeCustomer() which sets stripe_id and passes `customer`,
        // and Stripe rejects requests that have both `customer` and `customer_email`.

        $checkout = $tenant
            ->newSubscription('default', $priceId)
            ->allowPromotionCodes()
            ->checkout($checkoutParams);

        return response()->json(['url' => $checkout->url]);
    }

    /**
     * POST /api/billing/portal
     * Returns Stripe Customer Portal URL for managing subscription.
     *
     * Body: { slug, return_url }
     */
    public function portal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug'       => 'required|string|exists:tenants,slug',
            'return_url' => 'required|url',
        ]);

        $tenant = Tenant::where('slug', $validated['slug'])->firstOrFail();

        if (! $tenant->stripe_id) {
            return response()->json(['error' => 'No active subscription'], 404);
        }

        $url = $tenant->billingPortalUrl($validated['return_url']);

        return response()->json(['url' => $url]);
    }

    /**
     * GET /api/billing/status?slug=xxx
     */
    public function status(Request $request): JsonResponse
    {
        $slug = $request->query('slug', '');
        $tenant = Tenant::where('slug', $slug)->first();

        if (! $tenant) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json([
            'plan'          => $tenant->plan,
            'subscribed'    => $tenant->subscribed('default'),
            'on_trial'      => $tenant->onTrial('default'),
            'trial_ends_at' => $tenant->trial_ends_at,
        ]);
    }
}
