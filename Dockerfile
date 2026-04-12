# ── Stage 1: Node — build frontend assets ────────────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ── Stage 2: PHP-FPM + Nginx ──────────────────────────────────────────────────
FROM php:8.4-fpm-alpine AS app

# System deps
RUN apk add --no-cache \
    nginx \
    supervisor \
    sqlite \
    sqlite-dev \
    curl \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_sqlite opcache pcntl

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# PHP deps (no dev, no scripts yet)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist

# Copy app source
COPY . .

# Copy built frontend assets from stage 1
COPY --from=frontend /app/public/build ./public/build

# Laravel bootstrap
RUN php artisan config:clear \
 && php artisan storage:link \
 && mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache public/build

# SQLite database file (persistent volume should be mounted at /var/www/html/database)
RUN touch database/database.sqlite \
 && chown www-data:www-data database/database.sqlite

# ── Nginx config ──────────────────────────────────────────────────────────────
RUN rm -f /etc/nginx/http.d/default.conf
COPY docker/nginx.conf /etc/nginx/http.d/ensub.conf

# ── Supervisor config ─────────────────────────────────────────────────────────
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ── PHP opcache tuning ────────────────────────────────────────────────────────
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

EXPOSE 80

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
