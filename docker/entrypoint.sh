#!/bin/sh
set -e

cd /var/www/html

# Ensure database directory and file are writable by www-data
chown -R www-data:www-data /var/www/html/database
chmod 775 /var/www/html/database
[ -f /var/www/html/database/database.sqlite ] && chmod 664 /var/www/html/database/database.sqlite

# Run migrations and seed admin user if missing
php artisan migrate --force
php artisan db:seed --force

# Cache config/routes for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
