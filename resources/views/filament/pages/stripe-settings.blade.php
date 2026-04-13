<x-filament-panels::page>

    <div class="grid gap-6">

        {{-- Status --}}
        <x-filament::section heading="Keys & Secrets">
            <div class="divide-y divide-gray-200 dark:divide-white/10">

                <div class="flex items-center justify-between py-3">
                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">Publishable key</p>
                        <p class="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ $publishable_key }}</p>
                    </div>
                    <a href="https://dashboard.stripe.com/apikeys" target="_blank"
                        class="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                        Stripe → API Keys ↗
                    </a>
                </div>

                <div class="flex items-center justify-between py-3">
                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">Secret key</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stored in <code class="font-mono">.env → STRIPE_SECRET</code></p>
                    </div>
                    @if($secret_set)
                        <x-filament::badge color="success">Set</x-filament::badge>
                    @else
                        <x-filament::badge color="danger">Missing</x-filament::badge>
                    @endif
                </div>

                <div class="flex items-center justify-between py-3">
                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">Webhook secret</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stored in <code class="font-mono">.env → STRIPE_WEBHOOK_SECRET</code></p>
                    </div>
                    @if($webhook_set)
                        <x-filament::badge color="success">Set</x-filament::badge>
                    @else
                        <x-filament::badge color="danger">Missing</x-filament::badge>
                    @endif
                </div>

            </div>
        </x-filament::section>

        {{-- Price IDs --}}
        <x-filament::section heading="Price IDs">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Set these in your <code class="font-mono">.env</code> file. Find them in
                <a href="https://dashboard.stripe.com/products" target="_blank"
                    class="text-primary-600 dark:text-primary-400 hover:underline">Stripe → Products ↗</a>
            </p>

            <div class="divide-y divide-gray-200 dark:divide-white/10">

                <div class="flex items-center justify-between py-3">
                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">Pro <span class="text-gray-400 font-normal">$9/mo · 500 claims</span></p>
                        <p class="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">STRIPE_PRICE_PRO</p>
                    </div>
                    <span class="font-mono text-xs {{ str_starts_with($price_pro, 'price_') ? 'text-green-500' : 'text-red-400' }}">
                        {{ $price_pro }}
                    </span>
                </div>

                <div class="flex items-center justify-between py-3">
                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">Business <span class="text-gray-400 font-normal">$29/mo · unlimited claims</span></p>
                        <p class="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">STRIPE_PRICE_BUSINESS</p>
                    </div>
                    <span class="font-mono text-xs {{ str_starts_with($price_business, 'price_') ? 'text-green-500' : 'text-red-400' }}">
                        {{ $price_business }}
                    </span>
                </div>

            </div>
        </x-filament::section>

        {{-- Webhook --}}
        <x-filament::section heading="Webhook">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">Endpoint URL</p>
                    <p class="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ $webhook_url }}</p>
                    <p class="text-xs text-gray-400 mt-1">Events: <code class="font-mono">customer.subscription.created/updated/deleted</code></p>
                </div>
                <a href="https://dashboard.stripe.com/webhooks" target="_blank"
                    class="text-xs text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap ml-4">
                    Stripe → Webhooks ↗
                </a>
            </div>
        </x-filament::section>

        {{-- Quick links --}}
        <x-filament::section heading="Quick links">
            <div class="flex flex-wrap gap-3">
                <a href="https://dashboard.stripe.com/subscriptions" target="_blank"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-white/5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">
                    Subscriptions ↗
                </a>
                <a href="https://dashboard.stripe.com/customers" target="_blank"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-white/5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">
                    Customers ↗
                </a>
                <a href="https://dashboard.stripe.com/products" target="_blank"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-white/5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">
                    Products ↗
                </a>
                <a href="https://dashboard.stripe.com/revenue" target="_blank"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-white/5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">
                    Revenue ↗
                </a>
            </div>
        </x-filament::section>

    </div>

</x-filament-panels::page>
