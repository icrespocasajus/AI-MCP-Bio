#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we should also start MCP servers
START_MCP=false
for arg in "$@"; do
    if [ "$arg" == "--with-mcp" ] || [ "$arg" == "-m" ]; then
        START_MCP=true
    fi
done

# Usage information
usage() {
    echo "Usage: $0 [options]"
    echo
    echo "Start AI-MCP-Bio services."
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message and exit"
    echo "  -m, --with-mcp Also start MCP server containers (optional)"
    echo
    echo "Examples:"
    echo "  $0             # Start only the main services (frontend, backend, postgres)"
    echo "  $0 --with-mcp  # Start main services and all MCP servers"
}

# Parse arguments
for arg in "$@"; do
    if [ "$arg" == "--help" ] || [ "$arg" == "-h" ]; then
        usage
        exit 0
    fi
done

echo -e "${BLUE}[INFO]${NC} Starting AI-MCP-Bio services..."

# Move to the script directory for consistent relative paths
cd "$(dirname "$0")"

# Start the main AI-MCP-Bio services using docker-compose from the ai-mcp-bio directory
echo -e "${BLUE}[INFO]${NC} Starting main services (frontend, backend, postgres)..."
if docker-compose -f ../ai-mcp-bio/docker-compose.yml -f ../ai-mcp-bio/docker-compose.override.yml up -d; then
    echo -e "${GREEN}[SUCCESS]${NC} Main services started successfully!"
    echo -e "${BLUE}[INFO]${NC} Frontend available at: http://localhost:3001"
    echo -e "${BLUE}[INFO]${NC} Backend API available at: http://localhost:3000"
else
    echo -e "${RED}[ERROR]${NC} Failed to start main services!"
    exit 1
fi

# Start MCP servers only if requested
if [ "$START_MCP" = true ]; then
    echo -e "${BLUE}[INFO]${NC} Starting MCP servers (--with-mcp flag detected)..."
    if ./start_mcp_servers.sh -p 6000; then
        echo -e "${GREEN}[SUCCESS]${NC} MCP servers started successfully!"
        echo -e "${BLUE}[INFO]${NC} MCP servers are accessible starting from port 6000"
    else
        echo -e "${RED}[ERROR]${NC} Some MCP servers failed to start! Check the logs for details."
    fi
fi

echo -e "${BLUE}[INFO]${NC} All services startup process completed." 