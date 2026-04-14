<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantChain extends Model
{
    protected $fillable = [
        'tenant_id',
        'chain_id',
        'chain_name',
        'registry_address',
        'registrar_address',
        'enabled',
        'last_synced_block',
    ];

    protected $casts = [
        'chain_id'          => 'integer',
        'enabled'           => 'boolean',
        'last_synced_block' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
