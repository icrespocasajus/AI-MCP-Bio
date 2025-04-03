#!/bin/bash

# Color codes for output messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Define the directory containing MCP servers
MCP_SERVERS_DIR="../mcp-servers"
CONTAINERS_DIR="../Containers_mcp-servers"
LOG_FILE="../Logs/mcp_servers_build_$(date +%Y%m%d_%H%M%S).log"

# Create Logs directory if it doesn't exist
mkdir -p ../Logs

# Create Containers directory if it doesn't exist
mkdir -p "$CONTAINERS_DIR"

# Usage information
usage() {
    echo "Usage: $0 [options] [server-name]"
    echo
    echo "Build MCP server Docker containers."
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message and exit"
    echo "  -a, --all      Build all MCP server containers (default)"
    echo "  server-name    Build only the specified server container"
    echo
    echo "Examples:"
    echo "  $0             # Build all MCP server containers"
    echo "  $0 -a          # Build all MCP server containers"
    echo "  $0 weather-mcp  # Build only the weather-mcp server container"
}

# Logging functions
log_info() {
    echo -e "${YELLOW}[INFO] $1${NC}"
    echo "[INFO] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
    echo "[SUCCESS] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
    echo "[ERROR] $1" >> "$LOG_FILE"
}

# Function to build a container from a server directory
build_container() {
    local server_dir="$1"
    local server_name="$(basename "$server_dir")"
    local dockerfile="$server_dir/Dockerfile"
    local tag="ai-mcp-bio:$server_name"
    local image_file="$CONTAINERS_DIR/$server_name-$(date +%Y%m%d_%H%M%S).tar"
    
    log_info "Building container for $server_name..."
    
    # Check if Dockerfile exists
    if [ ! -f "$dockerfile" ]; then
        log_error "Dockerfile not found for $server_name at $dockerfile"
        return 1
    fi
    
    # Special handling for weather-mcp
    if [ "$server_name" == "weather-mcp" ]; then
        # Navigate to the server directory
        pushd "$server_dir" > /dev/null
        
        log_info "Installing dependencies for $server_name..."
        npm install || {
            log_error "Failed to install npm dependencies for $server_name"
            popd > /dev/null
            return 1
        }
        
        popd > /dev/null
    fi
    
    # Build the Docker image
    docker build -t "$tag" "$server_dir" || {
        log_error "Failed to build Docker image for $server_name"
        return 1
    }
    
    # Save the Docker image to a file
    log_info "Saving Docker image for $server_name to $image_file..."
    docker save -o "$image_file" "$tag" || {
        log_error "Failed to save Docker image for $server_name"
        return 1
    }
    
    log_success "Successfully built and saved Docker image for $server_name"
    return 0
}

# Parse command line arguments
build_all=true
specific_server=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        -a|--all)
            build_all=true
            shift
            ;;
        *)
            build_all=false
            specific_server="$1"
            shift
            ;;
    esac
done

# Check if MCP servers directory exists
if [ ! -d "$MCP_SERVERS_DIR" ]; then
    log_error "Directory not found: $MCP_SERVERS_DIR"
    exit 1
fi

# Initialize counters
total_servers=0
successful_builds=0
failed_builds=0

# Create a timestamp for this build run
build_timestamp=$(date +%Y-%m-%d_%H-%M-%S)
log_info "Starting MCP server build process at $build_timestamp"

# Find MCP server directories (using loop for better POSIX compatibility)
server_dirs=()
if [ "$build_all" = true ]; then
    log_info "Finding all MCP server directories in $MCP_SERVERS_DIR..."
    for dir in "$MCP_SERVERS_DIR"/*-mcp; do
        if [ -d "$dir" ]; then
            server_dirs+=("$dir")
        fi
    done
    
    if [ ${#server_dirs[@]} -eq 0 ]; then
        log_error "No MCP server directories found in $MCP_SERVERS_DIR"
        exit 1
    fi
    
    log_info "Found ${#server_dirs[@]} MCP server directories"
else
    # Check if the specified server exists
    if [ ! -d "$MCP_SERVERS_DIR/$specific_server" ]; then
        log_error "Server directory not found: $MCP_SERVERS_DIR/$specific_server"
        exit 1
    fi
    
    server_dirs=("$MCP_SERVERS_DIR/$specific_server")
    log_info "Building only $specific_server"
fi

# Build each server
for server_dir in "${server_dirs[@]}"; do
    ((total_servers++))
    
    if build_container "$server_dir"; then
        ((successful_builds++))
    else
        ((failed_builds++))
    fi
done

# Print summary
log_info "Build process completed"
log_info "Total servers: $total_servers"
log_info "Successful builds: $successful_builds"
log_info "Failed builds: $failed_builds"

# Return appropriate exit code
if [ $failed_builds -gt 0 ]; then
    log_error "Some builds failed. Check the log file for details: $LOG_FILE"
    exit 1
else
    log_success "All builds successful!"
    exit 0
fi 