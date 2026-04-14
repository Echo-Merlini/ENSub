import { useEffect, useRef } from 'react'

declare global {
    interface Window {
        VANTA?: {
            NET: (opts: Record<string, unknown>) => { destroy: () => void }
        }
        __VANTA_CONFIG__?: {
            enabled: boolean
            color: string
            background_color: string
            points: number
            max_distance: number
            spacing: number
            mouse_controls: boolean
            touch_controls: boolean
        }
    }
}

function hexToInt(hex: string): number {
    return parseInt(hex.replace('#', ''), 16)
}

export default function VantaBackground() {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const cfg = window.__VANTA_CONFIG__
        if (!cfg?.enabled || !window.VANTA || !ref.current) return

        document.documentElement.classList.add('vanta-enabled')

        const effect = window.VANTA.NET({
            el: ref.current,
            color: hexToInt(cfg.color),
            backgroundColor: hexToInt(cfg.background_color),
            points: cfg.points,
            maxDistance: cfg.max_distance,
            spacing: cfg.spacing,
            mouseControls: cfg.mouse_controls,
            touchControls: cfg.touch_controls,
        })

        return () => {
            effect.destroy()
            document.documentElement.classList.remove('vanta-enabled')
        }
    }, [])

    const cfg = window.__VANTA_CONFIG__
    if (!cfg?.enabled) return null

    return (
        <div
            ref={ref}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                pointerEvents: 'none',
            }}
        />
    )
}
