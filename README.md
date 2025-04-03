# AI-MCP-Bio

A project integrating AI with Model Connection Pattern (MCP) for biological simulations.

## Overview

AI-MCP-Bio is a platform that connects biological simulation models with AI capabilities through the Model Connection Pattern architecture. The system enables real-time interaction between different biological models and provides a unified interface for researchers.

## Key Components

- **Frontend**: React-based web interface for interacting with models
- **Backend**: NestJS API server that coordinates model communications
- **MCP Servers**: Specialized servers for different biological models
  - BoolSim MCP: Boolean network simulation server
  - Weather MCP: Example server demonstrating API structure

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for development)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/icrespocasajus/AI-MCP-Bio.git
   cd AI-MCP-Bio
   ```

2. Start the application:
   ```
   ./Scripts/start.sh
   ```

3. Start MCP servers:
   ```
   ./Scripts/start_mcp_servers.sh
   ```

## Development

The project is organized into several directories:

- `/ai-mcp-bio`: Main application code (frontend, backend, postgres)
- `/mcp-servers`: Individual MCP server implementations
- `/Development`: Development resources and test implementations
- `/Scripts`: Utility scripts for building and running containers
- `/Documentation`: Project documentation

## License

[MIT License](LICENSE)
