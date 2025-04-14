#!/bin/bash

# Install dependencies for main project
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd .. 