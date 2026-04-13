#!/bin/sh
set -e

cd /var/www/html

# Ensure database file is writable by www-data
[ -f /var/www/html/database/database.sqlite ] && chown www-data:www-data /var/www/html/database/database.sqlite && chmod 664 /var/www/html/database/database.sqlite

# Run migrations and seed admin user if missing
php artisan migrate --force
php artisan db:seed --class=Database\\Seeders\\DatabaseSeeder --force

# Cache config/routes for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
