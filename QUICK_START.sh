#!/bin/bash
# ================================================================
# QUICK START - CSE Smart Portal Deployment
# Copy and paste these commands in order
# ================================================================

echo "=========================================="
echo "CSE Smart Portal - Quick Deployment"
echo "=========================================="
echo ""

# STEP 1: SSH into server
echo "[1/6] Connecting to server..."
echo "Command: ssh azureuser@104.215.151.14"
echo "Password: V7UojR7pmwNTwX*4ns3SH_aq"
echo ""
echo "Press Enter to continue..."
read

# STEP 2: Download and run deployment script
echo "[2/6] Running deployment script..."
echo ""
echo "Run these commands on your server:"
echo ""
echo "  cd /tmp"
echo "  curl -O https://raw.githubusercontent.com/Abdullah-Arman-Emon/CSE_SmartPortal/docker/DEPLOYMENT_SCRIPT.sh"
echo "  chmod +x DEPLOYMENT_SCRIPT.sh"
echo "  ./DEPLOYMENT_SCRIPT.sh"
echo ""
echo "Wait for script to complete... (5-10 minutes)"
echo ""

# STEP 3: Configure DNS
echo "[3/6] Configure DNS at your domain registrar"
echo ""
echo "Add this A record:"
echo "  Name:  logicloop"
echo "  Type:  A"
echo "  Value: 104.215.151.14"
echo "  TTL:   3600"
echo ""
echo "Wait 5-15 minutes for DNS to propagate"
echo "Test with: nslookup logicloop.farefin.com"
echo ""
echo "Press Enter to continue..."
read

# STEP 4: Test HTTP
echo "[4/6] Testing HTTP (before SSL)"
echo ""
echo "Test these URLs:"
echo "  http://logicloop.farefin.com:8080/"
echo "  http://104.215.151.14:8080/"
echo ""
echo "Register a user:"
echo "  curl -X POST http://logicloop.farefin.com:8080/api/v1/auth/register \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"role\":\"student\",\"batch\":2026}'"
echo ""

# STEP 5: Install SSL
echo "[5/6] Installing SSL Certificate"
echo ""
echo "On your server, run:"
echo ""
echo "  cd /opt/CSE_SmartPortal"
echo "  curl -O https://raw.githubusercontent.com/Abdullah-Arman-Emon/CSE_SmartPortal/docker/SETUP_SSL.sh"
echo "  chmod +x SETUP_SSL.sh"
echo "  sudo ./SETUP_SSL.sh"
echo ""

# STEP 6: Test HTTPS
echo "[6/6] Testing HTTPS (after SSL)"
echo ""
echo "Your application is now live at:"
echo "  https://logicloop.farefin.com"
echo ""
echo "Test URLs:"
echo "  https://logicloop.farefin.com/"
echo "  https://logicloop.farefin.com/api/v1/auth/register"
echo "  https://logicloop.farefin.com/api/v1/auth/login"
echo ""

echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Useful server commands:"
echo "  sudo docker compose ps                  # Check status"
echo "  sudo docker compose logs -f backend     # View logs"
echo "  sudo docker compose restart             # Restart all"
echo "  sudo certbot certificates               # Check SSL expiry"
echo ""
