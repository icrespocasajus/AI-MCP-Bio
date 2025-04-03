# AI-MCP-Bio Platform Scripts

This directory contains scripts for building, deploying, and managing the AI-MCP-Bio platform containers.

## Build Scripts

### `build-all-servers.sh`

The primary build script for building and exporting all server containers in the platform.

**Features:**
- Builds MCP servers (weather-mcp, etc.) with Alpine Linux base
- Builds AI-MCP-Bio servers if available
- Exports all containers as uncompressed tar files to their respective directories:
  - `Containers_mcp-servers/` for MCP servers
  - `Containers_ai-mcp-bio/` for AI-MCP-Bio servers
- Organizes build logs within their respective container directories:
  - `Containers_mcp-servers/logs/` for MCP build logs
  - `Containers_ai-mcp-bio/logs/` for AI-MCP-Bio build logs
- Includes detailed logging and error handling
- Automatically compiles TypeScript if needed

**Usage:**
```bash
./Scripts/build-all-servers.sh
```

**Requirements:**
- Docker and Docker Compose installed
- `jq` command-line JSON processor

### `build-and-export-containers.sh`

Alternative script with similar functionality to build-all-servers.sh, but exports compressed tar.gz files.

**Usage:**
```bash
./Scripts/build-and-export-containers.sh
```

### `build-docker-images.sh`

Legacy script for building Docker images. Use build-all-servers.sh instead for more features and better error handling.

## Runtime Scripts

### `start.sh`

Starts all containers with custom port mappings:
- Frontend: http://localhost:3001
- Backend: http://localhost:3002
- PostgreSQL: localhost:3003

**Usage:**
```bash
./Scripts/start.sh
```

### `stop.sh`

Stops all containers and cleans up temporary configuration files.

**Usage:**
```bash
./Scripts/stop.sh
```

## Common Tasks

### Building for Production

To build all containers for production deployment:

```bash
./Scripts/build-all-servers.sh
```

### Importing Containers on Another System

After building, transfer the tar files and import them:

```bash
# Import MCP server container
docker load < Containers_mcp-servers/weather-mcp-server-20240401.tar

# Import AI-MCP-Bio containers
docker load < Containers_ai-mcp-bio/backend-latest-20240401.tar
```

### Development Build

For development builds with additional debug information:

```bash
DEBUG=true ./Scripts/build-all-servers.sh
```

## Port Configuration

The runtime scripts use the following port configuration:

| Service    | Port |
|------------|------|
| Frontend   | 3001 |
| Backend    | 3002 |
| PostgreSQL | 3003 |

To modify these ports, edit the `POSTGRES_PORT`, `BACKEND_PORT`, and `FRONTEND_PORT` variables in `start.sh`. 