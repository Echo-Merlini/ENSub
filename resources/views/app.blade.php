<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title inertia>ENSub</title>
        @php $vanta = \App\Models\VantaSetting::frontendConfig(); @endphp
        <script>
            window.__WALLETCONNECT_PROJECT_ID__ = "{{ env('WALLETCONNECT_PROJECT_ID', '') }}";
            window.__ALCHEMY_KEY__ = "{{ env('ALCHEMY_KEY', '') }}";
            window.__VANTA_CONFIG__ = {!! json_encode($vanta) !!};
            // Apply theme before render to avoid flash
            (function(){try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.add('light');}}catch(e){}})();
        </script>
        @if($vanta['enabled'])
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.net.min.js"></script>
        @endif
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>
