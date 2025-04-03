#!/bin/bash

# Color codes for output messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

LOG_FILE="../Logs/mcp_servers_stop_$(date +%Y%m%d_%H%M%S).log"

# Create Logs directory if it doesn't exist
mkdir -p ../Logs

# Usage information
usage() {
    echo "Usage: $0 [options] [server-name]"
    echo
    echo "Stop MCP server Docker containers."
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message and exit"
    echo "  -a, --all      Stop all running MCP server containers (default)"
    echo "  -r, --remove   Remove the containers after stopping them"
    echo "  server-name    Stop only the specified server container"
    echo
    echo "Examples:"
    echo "  $0             # Stop all MCP server containers"
    echo "  $0 -a          # Stop all MCP server containers"
    echo "  $0 -r          # Stop and remove all MCP server containers"
    echo "  $0 weather-mcp # Stop only the weather-mcp server container"
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

# Function to stop a container
stop_container() {
    local container_name="$1"
    local should_remove="$2"
    
    log_info "Stopping container $container_name..."
    
    # Check if the container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_info "Container $container_name is not running."
        
        # Check if it exists at all
        if ! docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
            log_error "Container $container_name does not exist."
            return 1
        else
            log_info "Container $container_name exists but is already stopped."
            
            # If remove flag is set, remove the container
            if [ "$should_remove" = true ]; then
                log_info "Removing container $container_name..."
                if docker rm "$container_name" > /dev/null; then
                    log_success "Successfully removed container $container_name."
                else
                    log_error "Failed to remove container $container_name."
                    return 1
                fi
            fi
            
            return 0
        fi
    fi
    
    # Stop the container
    if docker stop "$container_name" > /dev/null; then
        log_success "Successfully stopped container $container_name."
        
        # If remove flag is set, remove the container
        if [ "$should_remove" = true ]; then
            log_info "Removing container $container_name..."
            if docker rm "$container_name" > /dev/null; then
                log_success "Successfully removed container $container_name."
            else
                log_error "Failed to remove container $container_name."
                return 1
            fi
        fi
        
        return 0
    else
        log_error "Failed to stop container $container_name."
        return 1
    fi
}

# Parse command line arguments
stop_all=true
specific_server=""
remove_containers=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        -a|--all)
            stop_all=true
            shift
            ;;
        -r|--remove)
            remove_containers=true
            shift
            ;;
        *)
            stop_all=false
            specific_server="$1"
            shift
            ;;
    esac
done

# Create a timestamp for this stop run
stop_timestamp=$(date +%Y-%m-%d_%H-%M-%S)
log_info "Starting MCP server stop process at $stop_timestamp"

# Initialize counters
total_containers=0
successful_stops=0
failed_stops=0

if [ "$stop_all" = true ]; then
    log_info "Stopping all running MCP server containers..."
    
    # Get a list of all running MCP server containers
    container_names=($(docker ps --format '{{.Names}}' | grep -E '.*-mcp-server$'))
    
    if [ ${#container_names[@]} -eq 0 ]; then
        log_info "No running MCP server containers found."
        exit 0
    fi
    
    log_info "Found ${#container_names[@]} running MCP server containers."
    
    # Stop each container
    for container_name in "${container_names[@]}"; do
        ((total_containers++))
        
        if stop_container "$container_name" "$remove_containers"; then
            ((successful_stops++))
        else
            ((failed_stops++))
        fi
    done
else
    # Stop the specific server container
    ((total_containers++))
    
    # Handle case where user might specify with or without -mcp suffix or -server suffix
    if [[ "$specific_server" != *-mcp ]]; then
        specific_server="${specific_server}-mcp"
    fi
    
    if [[ "$specific_server" != *-server ]]; then
        specific_server="${specific_server}-server"
    fi
    
    if stop_container "$specific_server" "$remove_containers"; then
        ((successful_stops++))
    else
        ((failed_stops++))
    fi
fi

# Print summary
log_info "Stop process completed"
log_info "Total containers: $total_containers"
log_info "Successfully stopped: $successful_stops"
log_info "Failed to stop: $failed_stops"

# List remaining running containers
log_info "Remaining running MCP server containers:"
docker ps --filter "name=-server" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}" || echo "None"

# Return appropriate exit code
if [ $failed_stops -gt 0 ]; then
    log_error "Some containers failed to stop. Check the log file for details: $LOG_FILE"
    exit 1
else
    log_success "All specified containers stopped successfully!"
    exit 0
fi 