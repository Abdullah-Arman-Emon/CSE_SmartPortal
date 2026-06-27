@echo off
echo 🚀 Starting Deployment to Live Server (104.215.151.14)...

set USER=azureuser
set IP=104.215.151.14
set DEST_DIR=~/CSE_SmartPortal/

echo ⚠️ Note: Windows does not natively support automatic passwords in scripts. 
echo You will be prompted to paste your password twice.
echo Password: v7UojR7pmwNTw*X4ns3SH_aq
echo.

echo 📦 Transferring files to server (This might take a moment)...
:: Using tar to compress the project, send it over SSH, and extract it on the server (much faster than raw scp -r)
tar.exe -czf deploy_package.tar.gz --exclude=".git" --exclude="node_modules" --exclude="__pycache__" .
scp deploy_package.tar.gz %USER%@%IP%:%DEST_DIR%

echo 🐳 Extracting and rebuilding Docker containers on the server...
ssh %USER%@%IP% "cd %DEST_DIR% && tar -xzf deploy_package.tar.gz && rm deploy_package.tar.gz && docker compose up --build -d"

echo 🧹 Cleaning up local package...
del deploy_package.tar.gz

echo ✅ Deployment Complete! The live server has been updated.
pause
