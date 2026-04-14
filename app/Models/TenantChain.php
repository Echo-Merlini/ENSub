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
    ];

    protected $casts = [
        'chain_id' => 'integer',
        'enabled'  => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
