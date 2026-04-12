#!/bin/sh
set -e

cd /var/www/html

# Run migrations
php artisan migrate --force

# Cache config/routes for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
