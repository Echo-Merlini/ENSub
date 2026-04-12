<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GateConfig extends Model
{
    protected $fillable = [
        'tenant_id', 'type', 'chain', 'contract_address',
        'collection_slug', 'min_balance', 'max_per_wallet',
    ];

    protected $casts = [
        'min_balance' => 'decimal:18',
        'max_per_wallet' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
