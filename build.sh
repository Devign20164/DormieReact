#!/bin/bash

# Install dependencies for main project
npm install --legacy-peer-deps

# Install backend dependencies
cd backend
npm install --legacy-peer-deps
# Ensure express is installed
npm install express --legacy-peer-deps
cd ..

# Install frontend dependencies and build
cd frontend
npm install --legacy-peer-deps
npm run build
# Copy build folder to backend/public for serving
mkdir -p ../backend/public
cp -r build/* ../backend/public/
cd .. 