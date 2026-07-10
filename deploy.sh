#!/bin/bash

echo "🚀 Starting Deployment to Live Server (104.215.151.14)..."

# Server details
USER="azureuser"
IP="104.215.151.14"
PASSWORD="v7UojR7pmwNTw*X4ns3SH_aq"
DEST_DIR="~/CSE_SmartPortal/"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass is not installed. Please install it first (e.g., sudo apt-get install sshpass)."
    exit 1
fi

echo "📦 Syncing files to server..."
# Using rsync to smartly sync only changed files, ignoring git and heavy node_modules
sshpass -p "$PASSWORD" rsync -avz -e "ssh -o StrictHostKeyChecking=no" \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '__pycache__' \
    ./ $USER@$IP:$DEST_DIR

echo "🐳 Rebuilding and restarting Docker containers on the server..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $USER@$IP "cd $DEST_DIR && docker compose up --build -d"

echo "✅ Deployment Complete! The live server has been updated."
