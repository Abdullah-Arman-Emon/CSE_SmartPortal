#!/bin/bash

# ================================================================
# SSL Certificate Setup Script for logicloop.farefin.com
# Run this AFTER DNS is configured and main deployment is complete
# ================================================================

set -e

DOMAIN="logicloop.farefin.com"
EMAIL="admin@farefin.com"  # Change to your email if needed

echo "================================================"
echo "SSL Certificate Setup for $DOMAIN"
echo "================================================"
echo ""

# Step 1: Verify DNS
echo "[Step 1] Verifying DNS resolution..."
if nslookup $DOMAIN | grep -q "104.215.151.14"; then
    echo "✓ DNS is properly configured"
else
    echo "⚠ Warning: DNS may not be fully propagated yet"
    echo "  Please wait a few minutes and try again"
    exit 1
fi

# Step 2: Install Certbot
echo ""
echo "[Step 2] Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx python3-certbot-dns-digitalocean
    echo "Certbot installed successfully"
else
    echo "Certbot already installed"
fi

# Step 3: Obtain SSL Certificate
echo ""
echo "[Step 3] Obtaining SSL Certificate from Let's Encrypt..."
sudo certbot certonly \
    --standalone \
    -d $DOMAIN \
    --agree-tos \
    --non-interactive \
    -m $EMAIL \
    --preferred-challenges http

if [ $? -eq 0 ]; then
    echo "✓ SSL Certificate obtained successfully"
else
    echo "✗ Failed to obtain SSL certificate"
    echo "  Make sure port 80 is open and DNS is configured"
    exit 1
fi

# Step 4: Update nginx configuration
echo ""
echo "[Step 4] Updating nginx configuration with SSL..."
cd /opt/CSE_SmartPortal

# Backup original config
sudo cp nginx/conf.d/default.conf nginx/conf.d/default.conf.backup

# Use SSL config
sudo cp nginx/conf.d/default.conf.ssl nginx/conf.d/default.conf

echo "✓ Nginx configuration updated with SSL"

# Step 5: Restart services
echo ""
echo "[Step 5] Restarting nginx container..."
sudo docker compose restart nginx
sleep 5

# Step 6: Verify SSL
echo ""
echo "[Step 6] Verifying SSL certificate..."
if openssl s_client -connect localhost:443 -servername $DOMAIN </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "✓ SSL certificate is valid"
else
    echo "⚠ SSL verification in progress..."
fi

# Step 7: Auto-renewal setup
echo ""
echo "[Step 7] Setting up auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "✓ Auto-renewal enabled"

echo ""
echo "================================================"
echo "SSL Setup Completed!"
echo "================================================"
echo ""
echo "Your site is now accessible at:"
echo "  https://$DOMAIN"
echo ""
echo "Test your deployment:"
echo "  curl https://$DOMAIN/"
echo ""
echo "API Endpoints:"
echo "  POST https://$DOMAIN/api/v1/auth/register"
echo "  POST https://$DOMAIN/api/v1/auth/login"
echo ""
echo "Certificate details:"
sudo certbot certificates
echo ""
echo "Certificate will auto-renew 30 days before expiration"
echo ""
