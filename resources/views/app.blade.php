<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title inertia>ENSub</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
        <script>window.__WALLETCONNECT_PROJECT_ID__ = "{{ env('WALLETCONNECT_PROJECT_ID', '') }}";</script>
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>
