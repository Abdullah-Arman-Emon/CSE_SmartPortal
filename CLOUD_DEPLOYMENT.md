# CSE Smart Portal - Cloud Deployment Guide

**Deployment Details:**
- **Server IP**: 104.215.151.14
- **Domain**: logicloop.farefin.com
- **Port**: 8080
- **Admin User**: azureuser
- **Password**: V7UojR7pmwNTwX*4ns3SH_aq

---

## Phase 1: Initial Setup & Docker Deployment

### Step 1.1: Connect to Server via SSH
```bash
ssh azureuser@104.215.151.14
# Enter password: V7UojR7pmwNTwX*4ns3SH_aq
```

### Step 1.2: Download Deployment Script
```bash
cd /home/azureuser
wget https://raw.githubusercontent.com/Abdullah-Arman-Emon/CSE_SmartPortal/docker/DEPLOYMENT_SCRIPT.sh
chmod +x DEPLOYMENT_SCRIPT.sh
```

### Step 1.3: Run Deployment Script
```bash
./DEPLOYMENT_SCRIPT.sh
```

This will automatically:
- ✓ Update system packages
- ✓ Install Docker & Docker Compose
- ✓ Clone your GitHub repository
- ✓ Create .env configuration
- ✓ Build Docker images
- ✓ Start all services (mysql, backend, frontend, nginx)

**Expected Output:**
```
NAME             IMAGE                           COMMAND              SERVICE    STATUS
csedu_mysql      mysql:8.0                       docker-entrypoint    mysql      Up ... (healthy)
csedu_backend    cse_smartportal-repo-backend    uvicorn main:app     backend    Up ...
csedu_frontend   cse_smartportal-repo-frontend   /docker-entrypoint   frontend   Up ...
csedu_nginx      nginx:alpine                    /docker-entrypoint   nginx      Up ...
```

### Step 1.4: Test Backend API (HTTP)
```bash
curl -X POST http://104.215.151.14:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","role":"student","batch":2026}'

curl -X POST http://104.215.151.14:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

---

## Phase 2: Configure Domain DNS

### Step 2.1: Add DNS Record
In your domain registrar (farefin.com DNS settings):

**Type:** A Record  
**Name:** logicloop  
**Value:** 104.215.151.14  
**TTL:** 3600 (or lowest available)

### Step 2.2: Verify DNS (wait 5-15 minutes for propagation)
```bash
nslookup logicloop.farefin.com
# Should return: 104.215.151.14
```

### Step 2.3: Test Domain Access (before SSL)
```bash
curl http://logicloop.farefin.com:8080/
```

---

## Phase 3: Install SSL Certificate

### Step 3.1: Download SSL Setup Script
```bash
cd /opt/CSE_SmartPortal
wget https://raw.githubusercontent.com/Abdullah-Arman-Emon/CSE_SmartPortal/docker/SETUP_SSL.sh
chmod +x SETUP_SSL.sh
```

### Step 3.2: Run SSL Setup
```bash
sudo ./SETUP_SSL.sh
```

---

## Access Your Application

| URL | Purpose |
|-----|---------|
| https://logicloop.farefin.com | Frontend (React App) |
| https://logicloop.farefin.com/api/v1/auth/register | Register |
| https://logicloop.farefin.com/api/v1/auth/login | Login |

---

## Useful Commands

### View Logs
```bash
cd /opt/CSE_SmartPortal
sudo docker compose logs -f backend
```

### Restart Services
```bash
sudo docker compose restart
```

### Pull Latest Code
```bash
cd /opt/CSE_SmartPortal
sudo git pull origin docker
sudo docker compose up -d
```

---
