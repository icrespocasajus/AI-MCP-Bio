#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we should also stop MCP servers
STOP_MCP=false
for arg in "$@"; do
    if [ "$arg" == "--with-mcp" ] || [ "$arg" == "-m" ]; then
        STOP_MCP=true
    fi
done

# Usage information
usage() {
    echo "Usage: $0 [options]"
    echo
    echo "Stop AI-MCP-Bio services."
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message and exit"
    echo "  -m, --with-mcp Also stop MCP server containers (optional)"
    echo
    echo "Examples:"
    echo "  $0             # Stop only the main services (frontend, backend, postgres)"
    echo "  $0 --with-mcp  # Stop main services and all MCP servers"
}

# Parse arguments
for arg in "$@"; do
    if [ "$arg" == "--help" ] || [ "$arg" == "-h" ]; then
        usage
        exit 0
    fi
done

echo -e "${BLUE}[INFO]${NC} Stopping AI-MCP-Bio services..."

# Move to the script directory for consistent relative paths
cd "$(dirname "$0")"

# Stop MCP servers only if requested
if [ "$STOP_MCP" = true ]; then
    echo -e "${BLUE}[INFO]${NC} Stopping MCP servers (--with-mcp flag detected)..."
    if ./stop_mcp_servers.sh -r; then
        echo -e "${GREEN}[SUCCESS]${NC} MCP servers stopped and removed successfully!"
    else
        echo -e "${RED}[ERROR]${NC} Some MCP servers failed to stop! Check the logs for details."
    fi
fi

# Stop the main AI-MCP-Bio services
echo -e "${BLUE}[INFO]${NC} Stopping main services (frontend, backend, postgres)..."
if docker-compose -f ../ai-mcp-bio/docker-compose.yml -f ../ai-mcp-bio/docker-compose.override.yml down; then
    echo -e "${GREEN}[SUCCESS]${NC} Main services stopped successfully!"
else
    echo -e "${RED}[ERROR]${NC} Failed to stop main services!"
fi

echo -e "${BLUE}[INFO]${NC} All services shutdown process completed." 