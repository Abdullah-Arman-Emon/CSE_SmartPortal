# CSE SmartPortal Deployment Guide

## What was fixed

The deployment has been updated to support both local development and remote server deployment:

1. **Frontend Backend URL** — Changed from hardcoded `http://localhost:8080/api` to `/api` (same-origin proxy path)
   - This allows the frontend to work on any domain without hardcoding
   - The nginx reverse proxy at `/api/` redirects to the backend

2. **Nginx Authorization Header** — Added forwarding of Bearer tokens
   - Ensures JWT tokens passed from the frontend reach the FastAPI backend
   - Login and signup now work through the proxy

3. **Docker Compose** — Removed obsolete `version:` field

## Deployment Steps for Azure Server

### Prerequisites
- Docker and Docker Compose installed on the server
- Ports 8080–8090 open (as mentioned)
- SSH access to the server with admin user `azureuser`

### Step 1: Pull the Latest Code

```bash
# SSH into the server
ssh azureuser@104.215.151.14

# Navigate to the project
cd /path/to/CSE_SmartPortal-docker

# Pull the latest fixes from the docker branch
git pull origin docker
```

### Step 2: Create Environment File

Create a `.env` file in the project root (this file is ignored by git for security):

```bash
cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=Password
MYSQL_DATABASE=csedu
SECRET_KEY=supersecretkey
RESOURCE_HUB=RESOURCES
VITE_BACKEND_URL=/api
EOF
```

### Step 3: Build and Start Services

```bash
# Build images without cache (ensures latest fixes)
docker compose build --no-cache frontend backend

# Start all services in the background
docker compose up -d

# Check status
docker compose ps
```

### Step 4: Verify Deployment

Test the deployed app using curl or your browser:

```bash
# Register a test user
curl -X POST http://104.215.151.14:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "role": "student",
    "batch": 27
  }'

# Login with the test user
curl -X POST http://104.215.151.14:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

Expected response for login:
```json
{
  "id": 1,
  "email": "test@example.com",
  "role": "student",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 5: Monitor Logs

If you encounter issues, check the logs:

```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f frontend
```

## Troubleshooting

### 502 Bad Gateway Error
- Check that all containers are running: `docker compose ps`
- Verify backend is healthy: `docker compose logs backend`
- Ensure nginx can reach the backend service on the internal network

### Login/Signup Returns 401
- Check that the Authorization header is being forwarded in nginx (it should be in the latest version)
- Verify the JWT token is in the response from `/api/v1/auth/login`

### Database Connection Issues
- Ensure MySQL container is healthy: `docker compose ps` (should show `(healthy)`)
- Check MySQL logs: `docker compose logs mysql`
- Verify database credentials in `.env` match the MySQL service configuration

## SSL/HTTPS Configuration (Optional but Recommended)

For production, enable HTTPS using Let's Encrypt (Certbot):

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx configuration to use SSL
# Then restart: docker compose up -d nginx
```

Reference: https://docs.digitalocean.com/support/how-to-install-an-ssl-certificate-on-a-droplet/

## API Endpoints

### Auth Endpoints (via nginx proxy)
- **Register**: `POST /api/v1/auth/register`
- **Login**: `POST /api/v1/auth/login`
- **Get User from Token**: `GET /api/v1/auth/get/user/from-token` (requires Authorization header)
- **Change Password**: `POST /api/v1/auth/password_change`

### Frontend
- **Main App**: `http://104.215.151.14:8080/` (or your domain)
- **Login**: `http://104.215.151.14:8080/login`
- **Signup**: `http://104.215.151.14:8080/signup`

## Key Configuration Files

- **`.env`** — Environment variables (MySQL credentials, backend URL)
- **`docker-compose.yml`** — Service orchestration (backend, frontend, mysql, nginx)
- **`nginx/conf.d/default.conf`** — Reverse proxy routing
- **`Frontend-main/Frontend-main/frontend/Dockerfile`** — Frontend build configuration
- **`backend-main/backend-main/Dockerfile`** — Backend build configuration

## Questions or Issues?

Contact the development team for support. All changes are documented in the git commit history.
