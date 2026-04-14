<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Claim extends Model
{
    protected $fillable = [
        'tenant_id', 'wallet_address', 'subdomain', 'full_name', 'tx_hash', 'minted_chains',
    ];

    protected $casts = [
        'minted_chains' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
