#!/bin/bash
# ============================================
# HnH-TV — Let's Encrypt SSL Bootstrap Script
# Run this ONCE on your server to obtain the
# initial certificate. After that, the certbot
# container handles automatic renewal.
# ============================================

set -e

DOMAIN="hnh-tv.duckdns.org"
EMAIL=""  # Optional: add your email for renewal notices
STAGING=0 # Set to 1 to use Let's Encrypt staging (for testing)

if docker compose version > /dev/null 2>&1; then
  COMPOSE="docker compose"
elif docker-compose version > /dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "Error: docker-compose or docker compose not found"
  exit 1
fi

echo "=== HnH-TV SSL Bootstrap ==="
echo "Domain: $DOMAIN"
echo ""

# --- Step 1: Create self-signed certificate so Nginx can start ---
echo ">>> Creating self-signed certificate..."
$COMPOSE run --rm --entrypoint "" certbot sh -c "
  mkdir -p /etc/letsencrypt/live/$DOMAIN &&
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj '/CN=$DOMAIN'
"
echo ">>> Done."

# --- Step 2: Start Nginx (it will use the self-signed cert) ---
echo ">>> Starting Nginx..."
$COMPOSE up -d nginx
echo ">>> Waiting 5 seconds for Nginx to be ready..."
sleep 5

# --- Step 3: Try to get a real certificate from Let's Encrypt ---
echo ">>> Requesting Let's Encrypt certificate..."

# Build certbot command
CERTBOT_CMD="certbot certonly --webroot -w /var/www/certbot"
CERTBOT_CMD="$CERTBOT_CMD -d $DOMAIN"
CERTBOT_CMD="$CERTBOT_CMD --non-interactive --agree-tos"

if [ -n "$EMAIL" ]; then
  CERTBOT_CMD="$CERTBOT_CMD --email $EMAIL"
else
  CERTBOT_CMD="$CERTBOT_CMD --register-unsafely-without-email"
fi

if [ "$STAGING" -eq 1 ]; then
  CERTBOT_CMD="$CERTBOT_CMD --staging"
fi

# Try to get the real cert — if it fails, keep the self-signed one
if $COMPOSE run --rm --entrypoint "" certbot $CERTBOT_CMD; then
  echo ">>> Certificate obtained!"
  echo ">>> Reloading Nginx with real certificate..."
  $COMPOSE exec nginx nginx -s reload
  echo ""
  echo "=== SSL setup complete! ==="
  echo "Your site is now available at: https://$DOMAIN"
else
  echo ""
  echo "============================================"
  echo "WARNING: Could not obtain Let's Encrypt certificate."
  echo "This is likely due to a rate limit."
  echo ""
  echo "HTTPS is still active using a self-signed certificate."
  echo "Your browser will show a security warning, but the"
  echo "connection is still encrypted."
  echo ""
  echo "Re-run this script after the rate limit resets to get"
  echo "a trusted certificate."
  echo "============================================"
  echo ""
  echo ">>> Reloading Nginx with self-signed certificate..."
  $COMPOSE exec nginx nginx -s reload
fi

echo ""
echo "To start everything:  $COMPOSE up -d"
echo "Certbot will auto-renew the certificate every 12 hours."
