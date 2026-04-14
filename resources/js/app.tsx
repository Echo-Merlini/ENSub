import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { useEffect } from 'react'
import VantaBackground from './components/VantaBackground'

// Keeps html.light class in sync with localStorage across all pages
function ThemeSync() {
    useEffect(() => {
        const apply = () => {
            const theme = localStorage.getItem('theme') ?? 'dark'
            document.documentElement.classList.toggle('light', theme === 'light')
        }
        apply()
        window.addEventListener('storage', apply)
        return () => window.removeEventListener('storage', apply)
    }, [])
    return null
}

createInertiaApp({
    title: (title) => `${title} — ENSub`,
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx')
        ),
    setup({ el, App, props }) {
        createRoot(el).render(<><ThemeSync /><VantaBackground /><App {...props} /></>)
    },
    progress: {
        color: '#00ff88',
    },
})
