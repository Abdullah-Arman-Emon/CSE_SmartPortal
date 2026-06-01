#!/bin/bash

# ================================================================
# CSE Smart Portal Deployment Script for Azure Server
# Domain: logicloop.farefin.com
# Port: 8080
# ================================================================

set -e  # Exit on any error

echo "================================================"
echo "CSE Smart Portal Deployment Script"
echo "Server: 104.215.151.14"
echo "Domain: logicloop.farefin.com"
echo "Port: 8080"
echo "================================================"

# Step 1: Update system
echo ""
echo "[Step 1] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Docker if not present
echo ""
echo "[Step 2] Installing Docker and Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo apt install -y docker.io
    sudo systemctl enable docker
    sudo systemctl start docker
else
    echo "Docker already installed"
fi

if ! command -v docker-compose &> /dev/null; then
    sudo apt install -y docker-compose
else
    echo "Docker Compose already installed"
fi

# Add user to docker group
sudo usermod -aG docker azureuser
echo "User azureuser added to docker group"

# Step 3: Install Git
echo ""
echo "[Step 3] Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
else
    echo "Git already installed"
fi

# Step 4: Clone repository
echo ""
echo "[Step 4] Cloning repository..."
if [ ! -d "/opt/CSE_SmartPortal" ]; then
    cd /opt
    sudo git clone https://github.com/Abdullah-Arman-Emon/CSE_SmartPortal.git
    cd CSE_SmartPortal
    sudo git checkout docker
else
    echo "Repository already exists at /opt/CSE_SmartPortal"
    cd /opt/CSE_SmartPortal
    sudo git pull origin docker
fi

# Step 5: Create .env file
echo ""
echo "[Step 5] Creating .env file..."
sudo tee backend-main/backend-main/.env > /dev/null <<EOF
DATABASE_URL=mysql://root:Password@mysql:3306/csedu
SECRET_KEY=supersecretkey
RESOURCE_HUB=RESOURCES
MYSQL_ROOT_PASSWORD=Password
MYSQL_DATABASE=csedu
VITE_BACKEND_URL=/api
EOF

echo ".env file created successfully"

# Step 6: Build and deploy with Docker Compose
echo ""
echo "[Step 6] Building and deploying Docker containers..."
sudo docker compose down || true
sudo docker compose build --no-cache
sudo docker compose up -d

# Wait for services to be ready
echo ""
echo "[Step 7] Waiting for services to become healthy..."
sleep 30

# Check status
sudo docker compose ps

# Step 8: Test backend API
echo ""
echo "[Step 8] Testing backend API..."
if curl -s http://localhost:8000/docs > /dev/null; then
    echo "✓ Backend is responding"
else
    echo "⚠ Backend may still be starting..."
fi

# Step 9: Display logs
echo ""
echo "[Step 9] Recent logs:"
sudo docker compose logs --tail 20

echo ""
echo "================================================"
echo "Deployment completed!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Configure DNS record:"
echo "   logicloop  A  104.215.151.14"
echo ""
echo "2. Install SSL Certificate (run after DNS is configured):"
echo "   sudo apt install -y certbot python3-certbot-nginx"
echo "   sudo certbot certonly --standalone -d logicloop.farefin.com"
echo ""
echo "3. Update nginx config with SSL (nginx/conf.d/default.conf)"
echo "   Then restart: sudo docker compose restart nginx"
echo ""
echo "4. Test API:"
echo "   curl http://104.215.151.14:8080/api/v1/auth/login"
echo ""
echo "================================================"
