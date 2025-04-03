#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

# Directory containing the AI-MCP-Bio project
PROJECT_DIR="../ai-mcp-bio"
CONTAINERS_DIR="../Containers_ai-mcp-bio"
DATE_STAMP=$(date +"%Y%m%d")
TIME_STAMP=$(date +"%H%M%S")
BUILD_TIME="${DATE_STAMP}-${TIME_STAMP}"

# Image names
FRONTEND_IMAGE="ai-mcp-bio-frontend:latest"
BACKEND_IMAGE="ai-mcp-bio-backend:latest"
POSTGRES_IMAGE="ai-mcp-bio-postgres:14"

# Function to print usage
print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Build AI-MCP-Bio Docker containers"
    echo
    echo "Options:"
    echo "  -h, --help                 Show this help message"
    echo "  -c, --component TYPE       Specify component to build (frontend, backend, or postgres)"
    echo "                             If not specified, all components will be built"
    echo
    echo "Examples:"
    echo "  $0                         # Build all components"
    echo "  $0 -c frontend            # Build only frontend"
    echo "  $0 -c backend             # Build only backend"
    echo "  $0 -c postgres            # Build only postgres"
}

# Function to log messages
log() {
    local log_file=$1
    local message=$2
    echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$log_file"
}

log_success() {
    local log_file=$1
    local message=$2
    echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$log_file"
}

log_error() {
    local log_file=$1
    local message=$2
    echo -e "${RED}[ERROR]${NC} $message" | tee -a "$log_file"
}

# Function to build a specific component
build_component() {
    local component=$1
    local log_file=$2
    local context_dir=""
    local dockerfile=""
    local image_name=""
    local build_args=""

    case $component in
        frontend)
            context_dir="${PROJECT_DIR}/frontend"
            dockerfile="${context_dir}/Dockerfile"
            image_name=$FRONTEND_IMAGE
            ;;
        backend)
            context_dir="${PROJECT_DIR}/backend"
            dockerfile="${context_dir}/Dockerfile"
            image_name=$BACKEND_IMAGE
            ;;
        postgres)
            context_dir="${PROJECT_DIR}"
            dockerfile="${context_dir}/postgres/Dockerfile"
            image_name=$POSTGRES_IMAGE
            ;;
        *)
            log_error "$log_file" "Invalid component: $component"
            return 1
            ;;
    esac

    # Check if Dockerfile exists
    if [ ! -f "$dockerfile" ]; then
        log_error "$log_file" "Dockerfile not found for $component at: $dockerfile"
        return 1
    fi

    log "$log_file" "Building $component image..."
    if docker build -t "$image_name" -f "$dockerfile" "$context_dir" $build_args; then
        log_success "$log_file" "Successfully built $component image: $image_name"
        
        # Export the image
        local tar_name="${component}-${DATE_STAMP}.tar"
        log "$log_file" "Exporting $component image to ${CONTAINERS_DIR}/${tar_name}..."
        if docker save "$image_name" > "${CONTAINERS_DIR}/${tar_name}"; then
            log_success "$log_file" "Successfully exported $component image to ${CONTAINERS_DIR}/${tar_name}"
        else
            log_error "$log_file" "Failed to export $component image"
            return 1
        fi
    else
        log_error "$log_file" "Failed to build $component image"
        return 1
    fi
}

# Parse command line arguments
COMPONENT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_usage
            exit 0
            ;;
        -c|--component)
            if [[ -n "$2" ]]; then
                COMPONENT=$2
                shift 2
            else
                echo -e "${RED}Error: Component argument is missing${NC}"
                print_usage
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

# Check if project directory exists
if [[ ! -d "$PROJECT_DIR" ]]; then
    echo -e "${RED}Error: Project directory not found: $PROJECT_DIR${NC}"
    exit 1
fi

# Create containers directory if it doesn't exist
mkdir -p "${CONTAINERS_DIR}/logs"

# Setup log file
LOG_FILE="${CONTAINERS_DIR}/logs/build-ai-mcp-bio-${BUILD_TIME}.log"
touch "$LOG_FILE"

log "$LOG_FILE" "Starting AI-MCP-Bio build process at $(date)"
log "$LOG_FILE" "Build log: $LOG_FILE"

# Build components based on input
if [[ -z "$COMPONENT" ]]; then
    log "$LOG_FILE" "Building all components..."
    build_component "frontend" "$LOG_FILE"
    build_component "backend" "$LOG_FILE"
    build_component "postgres" "$LOG_FILE"
elif [[ "$COMPONENT" =~ ^(frontend|backend|postgres)$ ]]; then
    build_component "$COMPONENT" "$LOG_FILE"
else
    log_error "$LOG_FILE" "Invalid component. Must be 'frontend', 'backend', or 'postgres'"
    print_usage
    exit 1
fi

# Print summary
echo -e "\n${BLUE}[INFO]${NC} ============================================================="
echo -e "${BLUE}[INFO]${NC} Build Summary"
echo -e "${BLUE}[INFO]${NC} ============================================================="
echo -e "${BLUE}[INFO]${NC} Build log: $LOG_FILE"
echo -e "${BLUE}[INFO]${NC} Container files exported to: $CONTAINERS_DIR"

# Display sizes of exported tar files
echo -e "\n${BLUE}[INFO]${NC} Exported Container Files:"
du -h ${CONTAINERS_DIR}/*.tar 2>/dev/null || echo -e "${YELLOW}[WARNING]${NC} No container tar files found." 