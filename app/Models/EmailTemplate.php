<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $fillable = ['type', 'label', 'trigger', 'subject', 'body', 'active'];

    protected $casts = ['active' => 'boolean'];

    public static function forType(string $type): ?self
    {
        return static::where('type', $type)->where('active', true)->first();
    }

    /**
     * Render the subject and body with simple {placeholder} substitution.
     * Returns ['subject' => ..., 'body' => ...] or null if template inactive/missing.
     */
    public function render(array $vars = []): array
    {
        $search  = array_map(fn ($k) => '{' . $k . '}', array_keys($vars));
        $replace = array_values($vars);

        return [
            'subject' => str_replace($search, $replace, $this->subject),
            'body'    => str_replace($search, $replace, $this->body),
        ];
    }
}
