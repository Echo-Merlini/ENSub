<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title inertia>ENSub</title>
        <script>
            window.__WALLETCONNECT_PROJECT_ID__ = "{{ env('WALLETCONNECT_PROJECT_ID', '') }}";
            window.__ALCHEMY_KEY__ = "{{ env('ALCHEMY_KEY', '') }}";
            // Apply theme before render to avoid flash
            (function(){try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.add('light');}}catch(e){}})();
        </script>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>
