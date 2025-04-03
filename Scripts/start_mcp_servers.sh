#!/bin/bash

# Color codes for output messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Define the network name for communication between services
NETWORK_NAME="mcp-network"
LOG_FILE="../Logs/mcp_servers_start_$(date +%Y%m%d_%H%M%S).log"

# Create Logs directory if it doesn't exist
mkdir -p ../Logs

# Usage information
usage() {
    echo "Usage: $0 [options] [server-name]"
    echo
    echo "Start MCP server Docker containers."
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message and exit"
    echo "  -a, --all      Start all available MCP server containers (default)"
    echo "  -p, --port     Specify base port (default: 6000, increments by 1 for each server)"
    echo "  server-name    Start only the specified server container"
    echo
    echo "Examples:"
    echo "  $0             # Start all MCP server containers from port 6000"
    echo "  $0 -a          # Start all MCP server containers from port 6000"
    echo "  $0 -p 7000     # Start all with base port 7000"
    echo "  $0 weather-mcp # Start only the weather-mcp server container on port 6000"
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

# Function to start a container for a specific server
start_container() {
    local server_name="$1"
    local port="$2"
    local tag="ai-mcp-bio:$server_name"
    local container_name="${server_name}-server"
    
    log_info "Starting container for $server_name on port $port..."
    
    # Check if the image exists
    if ! docker image inspect "$tag" &>/dev/null; then
        log_error "Docker image $tag not found. Make sure to build and load it first."
        return 1
    fi
    
    # Check if a container with this name is already running
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_info "Container $container_name is already running."
        
        # Get the current port mapping
        local current_port=$(docker port "${container_name}" 3000/tcp | cut -d':' -f2)
        log_info "Currently accessible at http://localhost:${current_port}"
        return 0
    fi
    
    # Check if the container exists but is stopped
    if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_info "Container $container_name exists but is stopped. Removing it first..."
        if ! docker rm "${container_name}" > /dev/null; then
            log_error "Failed to remove existing container $container_name."
            return 1
        fi
        log_info "Successfully removed existing container $container_name."
    fi
    
    # Create and start the container
    if docker run -d --name "${container_name}" \
                 --network "${NETWORK_NAME}" \
                 -p "${port}:3000" \
                 --restart unless-stopped \
                 "${tag}"; then
        log_success "Successfully started $server_name on port $port."
        log_info "Server accessible at http://localhost:${port}"
        return 0
    else
        log_error "Failed to start $server_name container."
        return 1
    fi
}

# Parse command line arguments
start_all=true
specific_server=""
base_port=6000

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        -a|--all)
            start_all=true
            shift
            ;;
        -p|--port)
            if [[ -n "$2" && "$2" =~ ^[0-9]+$ ]]; then
                base_port="$2"
                shift 2
            else
                log_error "Invalid or missing port number after -p/--port."
                usage
                exit 1
            fi
            ;;
        *)
            start_all=false
            specific_server="$1"
            shift
            ;;
    esac
done

# Create a timestamp for this start run
start_timestamp=$(date +%Y-%m-%d_%H-%M-%S)
log_info "Starting MCP server start process at $start_timestamp"

# Ensure Docker network exists
if ! docker network inspect "${NETWORK_NAME}" &>/dev/null; then
    log_info "Creating Docker network: ${NETWORK_NAME}..."
    if ! docker network create "${NETWORK_NAME}"; then
        log_error "Failed to create Docker network: ${NETWORK_NAME}."
        exit 1
    else
        log_success "Created Docker network: ${NETWORK_NAME}."
    fi
fi

# Initialize counters
total_servers=0
successful_starts=0
failed_starts=0
current_port=${base_port}

if [ "$start_all" = true ]; then
    log_info "Starting all available MCP server containers..."
    
    # Get a list of all available MCP server images
    server_images=($(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^ai-mcp-bio:" | cut -d':' -f2))
    
    if [ ${#server_images[@]} -eq 0 ]; then
        log_error "No MCP server images found. Make sure to build and load them first."
        exit 1
    fi
    
    log_info "Found ${#server_images[@]} MCP server images."
    
    # Start each server container
    for server_name in "${server_images[@]}"; do
        ((total_servers++))
        
        if start_container "$server_name" "${current_port}"; then
            ((successful_starts++))
        else
            ((failed_starts++))
        fi
        
        # Increment port for the next server
        ((current_port++))
    done
else
    # Start the specific server container
    ((total_servers++))
    
    # Handle case where user might specify with or without -mcp suffix
    if [[ "$specific_server" != *-mcp ]]; then
        specific_server="${specific_server}-mcp"
    fi
    
    if start_container "$specific_server" "${base_port}"; then
        ((successful_starts++))
    else
        ((failed_starts++))
    fi
fi

# Print summary
log_info "Start process completed"
log_info "Total servers: $total_servers"
log_info "Successfully started: $successful_starts"
log_info "Failed to start: $failed_starts"

# List running containers
log_info "Running MCP server containers:"
docker ps --filter "name=-server" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

# Return appropriate exit code
if [ $failed_starts -gt 0 ]; then
    log_error "Some servers failed to start. Check the log file for details: $LOG_FILE"
    exit 1
else
    log_success "All servers started successfully!"
    exit 0
fi 