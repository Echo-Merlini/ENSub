<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VantaSetting extends Model
{
    protected $fillable = [
        'enabled',
        'color',
        'color_light',
        'background_color',
        'background_color_light',
        'points',
        'max_distance',
        'spacing',
        'mouse_controls',
        'touch_controls',
    ];

    protected $casts = [
        'enabled'        => 'boolean',
        'mouse_controls' => 'boolean',
        'touch_controls' => 'boolean',
        'points'         => 'float',
        'max_distance'   => 'float',
        'spacing'        => 'float',
    ];

    /** Get the singleton row, creating it with defaults if missing. */
    public static function instance(): self
    {
        return static::firstOrCreate([], [
            'enabled'                => false,
            'color'                  => '#c5c5c5',
            'color_light'            => '#555555',
            'background_color'       => '#0f1117',
            'background_color_light' => '#f0f2f5',
            'points'                 => 6,
            'max_distance'           => 22,
            'spacing'                => 19,
            'mouse_controls'         => true,
            'touch_controls'         => true,
        ]);
    }

    /** Return the config array for the frontend. */
    public static function frontendConfig(): array
    {
        $s = static::instance();
        return [
            'enabled'                => $s->enabled,
            'color'                  => $s->color,
            'color_light'            => $s->color_light,
            'background_color'       => $s->background_color,
            'background_color_light' => $s->background_color_light,
            'points'                 => $s->points,
            'max_distance'           => $s->max_distance,
            'spacing'                => $s->spacing,
            'mouse_controls'         => $s->mouse_controls,
            'touch_controls'         => $s->touch_controls,
        ];
    }
}
