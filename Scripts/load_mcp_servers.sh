#!/bin/bash

# Color codes for output messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Define the directory containing MCP server container files
CONTAINERS_DIR="../Containers_mcp-servers"
LOG_FILE="../Logs/mcp_servers_load_$(date +%Y%m%d_%H%M%S).log"

# Create Logs directory if it doesn't exist
mkdir -p ../Logs

# Usage information
usage() {
    echo "Usage: $0 [options] [server-name]"
    echo
    echo "Load MCP server Docker containers."
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message and exit"
    echo "  -a, --all      Load all MCP server containers (default)"
    echo "  server-name    Load only the specified server container"
    echo
    echo "Examples:"
    echo "  $0             # Load all MCP server containers"
    echo "  $0 -a          # Load all MCP server containers"
    echo "  $0 weather-mcp  # Load only the weather-mcp server container"
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

# Function to load a container from a file
load_container() {
    local container_file="$1"
    local server_name="$(echo $(basename "$container_file") | cut -d'-' -f1)"
    
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
specific_server=""

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
            specific_server="$1"
            shift
            ;;
    esac
done

# Check if containers directory exists
if [ ! -d "$CONTAINERS_DIR" ]; then
    log_error "Containers directory not found: $CONTAINERS_DIR"
    log_info "Make sure to run build_mcp_servers.sh before attempting to load containers"
    exit 1
fi

# Create a timestamp for this load run
load_timestamp=$(date +%Y-%m-%d_%H-%M-%S)
log_info "Starting MCP server load process at $load_timestamp"

# Initialize counters
total_loaded=0
successful_loads=0
failed_loads=0

if [ "$load_all" = true ]; then
    log_info "Loading all MCP server containers..."
    
    # Get a list of unique server names from container files
    server_names=()
    for file in "$CONTAINERS_DIR"/*-mcp*.tar; do
        if [ -f "$file" ]; then
            server_name="$(echo $(basename "$file") | cut -d'-' -f1)-mcp"
            if [[ ! " ${server_names[@]} " =~ " ${server_name} " ]]; then
                server_names+=("$server_name")
            fi
        fi
    done
    
    if [ ${#server_names[@]} -eq 0 ]; then
        log_error "No container files found in $CONTAINERS_DIR"
        exit 1
    fi
    
    log_info "Found containers for ${#server_names[@]} MCP servers"
    
    # Load the most recent container for each server
    for server_name in "${server_names[@]}"; do
        ((total_loaded++))
        
        # Find the most recent container file for this server
        latest_file=$(ls -t "$CONTAINERS_DIR/${server_name%-mcp}"*.tar 2>/dev/null | head -n1)
        
        if [ -n "$latest_file" ]; then
            if load_container "$latest_file"; then
                ((successful_loads++))
            else
                ((failed_loads++))
            fi
        else
            log_error "No container file found for $server_name"
            ((failed_loads++))
        fi
    done
else
    # Load the specific server container
    ((total_loaded++))
    
    # Handle case where user might specify with or without -mcp suffix
    if [[ "$specific_server" != *-mcp ]]; then
        search_name="${specific_server}-mcp"
    else
        search_name="$specific_server"
    fi
    
    # Find the most recent container file for this server
    latest_file=$(ls -t "$CONTAINERS_DIR/${search_name%-mcp}"*.tar 2>/dev/null | head -n1)
    
    if [ -n "$latest_file" ]; then
        if load_container "$latest_file"; then
            ((successful_loads++))
        else
            ((failed_loads++))
        fi
    else
        log_error "No container file found for $search_name"
        ((failed_loads++))
    fi
fi

# Print summary
log_info "Load process completed"
log_info "Total servers: $total_loaded"
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