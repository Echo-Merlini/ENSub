<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Laravel\Cashier\Billable;

class Tenant extends Model
{
    use Billable;

    protected $fillable = [
        'name', 'ens_domain', 'owner_address', 'billing_email', 'namestone_api_key',
        'slug', 'logo_url', 'accent_color', 'plan', 'active', 'claim_limit', 'resolver_mode',
    ];

    protected $casts = [
        'active' => 'boolean',
        'claim_limit' => 'integer',
    ];

    protected $hidden = ['namestone_api_key'];

    public function gateConfig(): HasOne
    {
        return $this->hasOne(GateConfig::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    public function chains(): HasMany
    {
        return $this->hasMany(TenantChain::class);
    }

    public function isAtLimit(): bool
    {
        return $this->claims()->count() >= $this->claim_limit;
    }

    // Cashier uses this for Stripe customer email
    public function stripeEmail(): ?string
    {
        return $this->billing_email;
    }

    public function stripeName(): ?string
    {
        return $this->name;
    }

    public function isPro(): bool
    {
        return in_array($this->plan, ['pro', 'business']);
    }
}
