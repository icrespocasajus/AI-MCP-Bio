# BoolSim MCP Server

An MCP (Model Context Protocol) server that provides Boolean network simulation functionality using BoolSim.

## Features

- Run any BoolSim command with custom arguments
- Analyze Boolean networks for attractors
- Perform reachability analysis from specific states
- Evaluate stability properties of Boolean networks

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- BoolSim installed on the system (for local development)

## Installation

### Local Development

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the TypeScript code:
   ```
   npm run build
   ```
4. Start the server:
   ```
   npm start
   ```

### Using Docker

1. Ensure that the BoolSim tar file (`boolSim-1.1.0-Linux-libc2.12.tar`) is available in the `./boolSim` directory
2. Build and start the Docker container:
   ```
   docker-compose up -d
   ```
   This will build the Docker image with BoolSim installed and start the MCP server.

## BoolSim Installation

The Docker container automatically installs BoolSim from the provided tar file. The installation process:

1. Creates a directory at `/opt/boolSim` in the container
2. Extracts the BoolSim tar file into this directory
3. Adds the BoolSim binaries to the system PATH

For local development, you need to install BoolSim manually and ensure the `boolSim` command is available in your PATH.

## MCP Tools

The server provides the following MCP tools:

### 1. `run_boolsim_command`

Run any BoolSim command with custom arguments.

**Parameters:**
- `command` (required): The BoolSim command to run (e.g., "attractor", "reachable")
- `model_file` (required): Content of the Boolean network model file
- `arguments` (optional): Additional arguments for the BoolSim command

**Example:**
```json
{
  "command": "attractor",
  "model_file": "targets, factors\nA, B\nB, !A\n",
  "arguments": "--method=sat"
}
```

### 2. `analyze_boolean_network`

Analyze a Boolean network to find attractors and properties.

**Parameters:**
- `model_file` (required): Content of the Boolean network model file
- `analysis_type` (required): Type of analysis to perform (attractors, reachable, stability)
- `initial_state` (optional, required for 'reachable' analysis): Initial state for reachability analysis

**Example:**
```json
{
  "model_file": "targets, factors\nA, B\nB, !A\n",
  "analysis_type": "attractors"
}
```

## Development

- `npm run dev`: Run the server in development mode using ts-node
- `npm run lint`: Run ESLint to check code quality
- `npm test`: Run Jest tests

## Docker Configuration

The project includes a Dockerfile and docker-compose.yml for containerized deployment:

- The Dockerfile builds a Node.js Alpine container with BoolSim installed from the provided tar file
- The docker-compose.yml file configures the service with appropriate ports and volumes

## License

MIT 