#!/bin/bash

# Remove package-lock.json and node_modules
echo "Removing package-lock.json and node_modules..."
rm -rf frontend/package-lock.json frontend/node_modules

# Install npm packages
cd frontend
echo "Installing npm packages..."
npm install

# Build and bring up Docker containers
cd ..
echo "Building and starting Docker containers..."
docker compose up --build
