#!/bin/bash

# Install dependencies if they don't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Check if boolSim is available
if ! command -v boolSim &> /dev/null; then
  echo "Warning: boolSim is not found in PATH. Make sure it's installed and available."
  echo "For Docker deployment, the boolSim-1.1.0-Linux-libc2.12.tar file should be in the ./boolSim directory."
fi

# Build the TypeScript code
echo "Building TypeScript code..."
npm run build

# Run the server
echo "Starting BoolSim MCP server..."
npm start 