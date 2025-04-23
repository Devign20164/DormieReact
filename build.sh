#!/bin/bash

# Install dependencies for main project
npm install --legacy-peer-deps

# Install backend dependencies
cd backend
npm install --legacy-peer-deps
cd ..

# Install frontend dependencies and build
cd frontend
npm install --legacy-peer-deps
npm run build
cd .. 