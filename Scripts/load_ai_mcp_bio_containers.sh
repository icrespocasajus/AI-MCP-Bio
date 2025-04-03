#!/bin/bash

# Color codes for output messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Define the directory containing AI-MCP-Bio container files
CONTAINERS_DIR="../Containers_ai-mcp-bio"
LOG_FILE="../Logs/ai_mcp_bio_load_$(date +%Y%m%d_%H%M%S).log"

# Create Logs directory if it doesn't exist
mkdir -p ../Logs

# Usage information
usage() {
    echo "Usage: $0 [options] [container-name]"
    echo
    echo "Load AI-MCP-Bio Docker containers."
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message and exit"
    echo "  -a, --all      Load all AI-MCP-Bio containers (default)"
    echo "  container-name Load only the specified container"
    echo
    echo "Examples:"
    echo "  $0             # Load all AI-MCP-Bio containers"
    echo "  $0 -a          # Load all AI-MCP-Bio containers"
    echo "  $0 frontend    # Load only the frontend container"
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

# Function to stop and remove existing containers and images
cleanup_container() {
    local container_name="$1"
    log_info "Stopping and removing existing container: $container_name"
    docker stop "$container_name" 2>/dev/null || true
    docker rm "$container_name" 2>/dev/null || true
    docker rmi "$container_name" 2>/dev/null || true
}

# Function to load a container from a file
load_container() {
    local container_file="$1"
    local container_name="$(basename "$container_file" .tar)"
    
    cleanup_container "$container_name"
    log_info "Loading container from file: $container_file"
    
    if docker load < "$container_file"; then
        log_success "Successfully loaded Docker image from $container_file"
        return 0
    else
        log_error "Failed to load Docker image from $container_file"
        return 1
    fi
}

# Parse command line arguments
load_all=true
specific_container=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        -a|--all)
            load_all=true
            shift
            ;;
        *)
            load_all=false
            specific_container="$1"
            shift
            ;;
    esac
done

# Check if containers directory exists
if [ ! -d "$CONTAINERS_DIR" ]; then
    log_error "Containers directory not found: $CONTAINERS_DIR"
    log_info "Make sure to run build_ai_mcp_bio_containers.sh before attempting to load containers"
    exit 1
fi

# Create a timestamp for this load run
load_timestamp=$(date +%Y-%m-%d_%H-%M-%S)
log_info "Starting AI-MCP-Bio container load process at $load_timestamp"

# Initialize counters
total_loaded=0
successful_loads=0
failed_loads=0

if [ "$load_all" = true ]; then
    log_info "Loading all AI-MCP-Bio containers..."
    
    # Get a list of container files
    container_files=("$CONTAINERS_DIR"/*.tar)
    
    if [ ${#container_files[@]} -eq 0 ]; then
        log_error "No container files found in $CONTAINERS_DIR"
        exit 1
    fi
    
    log_info "Found ${#container_files[@]} container files"
    
    # Load each container
    for container_file in "${container_files[@]}"; do
        ((total_loaded++))
        if load_container "$container_file"; then
            ((successful_loads++))
        else
            ((failed_loads++))
        fi
    done
else
    # Load the specific container
    ((total_loaded++))
    
    # Find the container file for this specific container
    container_file=$(ls -t "$CONTAINERS_DIR/${specific_container}"*.tar 2>/dev/null | head -n1)
    
    if [ -n "$container_file" ]; then
        if load_container "$container_file"; then
            ((successful_loads++))
        else
            ((failed_loads++))
        fi
    else
        log_error "No container file found for $specific_container"
        ((failed_loads++))
    fi
fi

# Print summary
log_info "Load process completed"
log_info "Total containers: $total_loaded"
log_info "Successful loads: $successful_loads"
log_info "Failed loads: $failed_loads"

# List loaded images
log_info "Loaded Docker images:"
docker images | grep 'ai-mcp-bio'

# Return appropriate exit code
if [ $failed_loads -gt 0 ]; then
    log_error "Some loads failed. Check the log file for details: $LOG_FILE"
    exit 1
else
    log_success "All loads successful!"
    exit 0
fi 