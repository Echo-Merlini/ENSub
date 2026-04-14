import { useEffect, useRef } from 'react'

declare global {
    interface Window {
        VANTA?: {
            NET: (opts: Record<string, unknown>) => { destroy: () => void }
        }
        __VANTA_CONFIG__?: {
            enabled: boolean
            color: string
            color_light: string
            background_color: string
            background_color_light: string
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

function isLight(): boolean {
    return document.documentElement.classList.contains('light')
}

export default function VantaBackground() {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const cfg = window.__VANTA_CONFIG__
        if (!cfg?.enabled || !window.VANTA || !ref.current) return

        document.documentElement.classList.add('vanta-enabled')

        const getEffect = () => {
            const light = isLight()
            return window.VANTA!.NET({
                el: ref.current!,
                color:           hexToInt(light ? cfg.color_light            : cfg.color),
                backgroundColor: hexToInt(light ? cfg.background_color_light : cfg.background_color),
                points:          cfg.points,
                maxDistance:     cfg.max_distance,
                spacing:         cfg.spacing,
                mouseControls:   cfg.mouse_controls,
                touchControls:   cfg.touch_controls,
            })
        }

        let effect = getEffect()

        // Re-init when theme toggles so colors swap
        const onThemeChange = () => {
            effect.destroy()
            effect = getEffect()
        }

        // Watch for class changes on <html>
        const observer = new MutationObserver(onThemeChange)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

        return () => {
            effect.destroy()
            observer.disconnect()
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
