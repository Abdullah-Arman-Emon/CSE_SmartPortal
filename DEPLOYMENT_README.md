# 🚀 CSE Smart Portal - Complete Deployment Manual

## 📋 Deployment Information

| Item | Details |
|------|---------|
| **Server IP** | 104.215.151.14 |
| **Domain** | logicloop.farefin.com |
| **Port** | 8080 (HTTP), 443 (HTTPS) |
| **SSH User** | azureuser |
| **SSH Password** | V7UojR7pmwNTwX*4ns3SH_aq |
| **GitHub Repository** | https://github.com/Abdullah-Arman-Emon/CSE_SmartPortal |
| **Deployment Branch** | docker |

---

## 📁 Files Created for Deployment

| File | Purpose |
|------|---------|
| `DEPLOYMENT_SCRIPT.sh` | Automated initial setup (Docker, packages, etc.) |
| `SETUP_SSL.sh` | SSL certificate installation and configuration |
| `docker-compose.prod.yml` | Production environment overrides |
| `nginx/conf.d/default.conf.ssl` | nginx config with SSL support |
| `CLOUD_DEPLOYMENT.md` | Detailed deployment guide |
| `QUICK_START.sh` | Interactive quick start walkthrough |

---

## ⚡ Quick Deployment (3 Steps)

### Step 1: Connect to Server
```bash
ssh azureuser@104.215.151.14
# Password: V7UojR7pmwNTwX*4ns3SH_aq
```

### Step 2: Run Deployment Script
```bash
cd /tmp
curl -O https://raw.githubusercontent.com/Abdullah-Arman-Emon/CSE_SmartPortal/docker/DEPLOYMENT_SCRIPT.sh
chmod +x DEPLOYMENT_SCRIPT.sh
./DEPLOYMENT_SCRIPT.sh
```

This automatically:
- ✅ Installs Docker & Docker Compose
- ✅ Clones your GitHub repository
- ✅ Sets up environment variables
- ✅ Builds and starts all services
- ✅ Configures MySQL database

### Step 3: Configure DNS & SSL
1. **Add DNS Record** (in domain registrar):
   - Type: A Record
   - Name: `logicloop`
   - Value: `104.215.151.14`
   - TTL: 3600

2. **Wait 5-15 minutes** for DNS propagation

3. **Run SSL Setup Script**:
```bash
cd /opt/CSE_SmartPortal
curl -O https://raw.githubusercontent.com/Abdullah-Arman-Emon/CSE_SmartPortal/docker/SETUP_SSL.sh
chmod +x SETUP_SSL.sh
sudo ./SETUP_SSL.sh
```

---

## 🧪 Test Your Deployment

### Before SSL (HTTP)
```bash
# Test signup
curl -X POST http://104.215.151.14:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student1@example.com",
    "password": "SecurePass123!",
    "role": "student",
    "batch": 2026
  }'

# Expected Response:
# {
#   "id": 1,
#   "email": "student1@example.com",
#   "role": "student"
# }

# Test login
curl -X POST http://104.215.151.14:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student1@example.com",
    "password": "SecurePass123!"
  }'

# Expected Response:
# {
#   "id": 1,
#   "email": "student1@example.com",
#   "role": "student",
#   "access_token": "eyJ..."
# }
```

### After SSL (HTTPS)
```bash
# Same commands but with HTTPS
curl -X POST https://logicloop.farefin.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"student2@example.com","password":"SecurePass123!","role":"student","batch":2026}'

# Access in browser
https://logicloop.farefin.com
```

---

## 🛠️ Server Management Commands

### View Service Status
```bash
cd /opt/CSE_SmartPortal
sudo docker compose ps
```

**Expected Output:**
```
NAME             IMAGE                STATUS           PORTS
csedu_mysql      mysql:8.0           Up (healthy)     3306
csedu_backend    cse_smartportal...  Up               8000
csedu_frontend   cse_smartportal...  Up               80
csedu_nginx      nginx:alpine        Up               0.0.0.0:8080->80, 443->443
```

### View Logs
```bash
# All services
sudo docker compose logs -f

# Specific service
sudo docker compose logs -f backend
sudo docker compose logs -f nginx
sudo docker compose logs -f mysql
```

### Restart Services
```bash
# Restart all
sudo docker compose restart

# Restart specific
sudo docker compose restart nginx
sudo docker compose restart backend
```

### Update Code
```bash
cd /opt/CSE_SmartPortal
sudo git pull origin docker
sudo docker compose up -d --build
```

### Check SSL Certificate
```bash
sudo certbot certificates
# Shows expiration date (auto-renews 30 days before expiration)
```

### Renew SSL Certificate (manual)
```bash
sudo certbot renew
sudo docker compose restart nginx
```

---

## 📍 Access Points

| URL | Purpose |
|-----|---------|
| https://logicloop.farefin.com | Frontend Application |
| https://logicloop.farefin.com/api/v1/auth/register | User Registration |
| https://logicloop.farefin.com/api/v1/auth/login | User Login |
| https://logicloop.farefin.com/api/docs | API Documentation |

---

## 🔐 Security

✅ **HTTPS/TLS**: All traffic encrypted  
✅ **Auto SSL Renewal**: Certificate auto-renews 30 days before expiry  
✅ **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options configured  
✅ **HTTP Redirect**: All HTTP traffic redirects to HTTPS  
✅ **Environment Secrets**: All passwords in .env (not in git)  

---

## ❓ Troubleshooting

### Services won't start
```bash
# Check for errors
sudo docker compose logs

# Clean up and restart
sudo docker compose down -v
sudo docker compose up -d
```

### DNS not resolving
```bash
# Test DNS
nslookup logicloop.farefin.com
dig logicloop.farefin.com

# May take 5-15 minutes to propagate
```

### SSL certificate won't install
```bash
# Make sure DNS is configured first
nslookup logicloop.farefin.com

# Check if port 80 is accessible
sudo netstat -tulpn | grep :80
```

### Backend returns 502 Bad Gateway
```bash
# Backend might not be healthy
sudo docker compose logs backend

# Restart backend
sudo docker compose restart backend
```

---

## 📞 Support Resources

- **GitHub**: https://github.com/Abdullah-Arman-Emon/CSE_SmartPortal
- **Branch**: docker
- **Deployment Guide**: See `CLOUD_DEPLOYMENT.md` in repository
- **Server SSH**: azureuser@104.215.151.14

---

## 📝 Deployment Checklist

- [ ] Server IP noted: 104.215.151.14
- [ ] SSH credentials saved: azureuser / V7UojR7pmwNTwX*4ns3SH_aq
- [ ] DEPLOYMENT_SCRIPT.sh executed
- [ ] Services running (docker compose ps shows all 4 healthy)
- [ ] HTTP test successful (signup/login working)
- [ ] DNS record added at domain registrar
- [ ] DNS propagated (nslookup returns correct IP)
- [ ] SETUP_SSL.sh executed successfully
- [ ] HTTPS test successful (can access https://logicloop.farefin.com)
- [ ] SSL certificate shows in: sudo certbot certificates

---

**Status**: ✅ Ready for Production Deployment

Generated: June 2, 2026
