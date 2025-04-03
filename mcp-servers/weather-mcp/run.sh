#!/bin/bash

# Install dependencies if they don't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the TypeScript code
echo "Building TypeScript code..."
npm run build

# Run the server
echo "Starting Weather MCP server..."
npm start 