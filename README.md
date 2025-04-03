# AI-MCP-Bio

An AI-Powered Model Context Protocol Platform for Advanced Bioinformatics

## Overview

AI-MCP-Bio is a next-generation scientific computing platform that bridges artificial intelligence with specialized bioinformatics tools through a secure Model Context Protocol (MCP) framework. The platform enables AI assistants to directly interact with bioinformatics tools, databases, and computational workflows through a standardized interface.

## Core Concepts

### Model Context Protocol (MCP)

MCP allows AI assistants to securely interact with external tools and services through:

- **Tool Registration**: A system for registering and managing external tools
- **Authentication**: Secure connections between AI assistants and tools
- **Function Calling**: Standardized methods for AI assistants to invoke tools
- **Result Handling**: Processing and returning results to the AI assistant

### Specialized Bioinformatics Focus

Unlike general-purpose platforms, AI-MCP-Bio focuses on:

- **High-Performance Computing**: Integration with HPC clusters for computationally intensive tasks
- **Scientific Workflows**: Support for complex, multi-step bioinformatics pipelines
- **Large Datasets**: Efficient handling of genomic and proteomic data
- **Specialized Visualizations**: Generation of scientific visualizations and reports
- **Data Security**: Enhanced protocols for sensitive biological data

## Architecture

- **Microservices-based**: Containerized components for scalability and modularity
- **Core Technology**: TypeScript-based Node.js backend with PostgreSQL
- **Authentication**: JWT, OAuth2 support
- **Deployment**: Docker-based with container orchestration
- **Connectivity**: RESTful API services between components

## Key Components

- **Frontend**: React-based web interface for interacting with models and visualizing results
- **Backend**: NestJS API server that coordinates MCP communication and model workflows
- **MCP Servers**: Specialized servers for different biological domains:
  - BoolSim MCP: Boolean network simulation server for systems biology
  - Weather MCP: Example demonstration server for the MCP architecture

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for development)
- PostgreSQL (for data storage)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/icrespocasajus/AI-MCP-Bio.git
   cd AI-MCP-Bio
   ```

2. Start the core application:
   ```
   ./Scripts/start.sh
   ```

3. Start specialized MCP servers:
   ```
   ./Scripts/start_mcp_servers.sh
   ```

## Development

The project is organized into several key directories:

- `/ai-mcp-bio`: Core application components
  - `/frontend`: React-based UI for interacting with the platform
  - `/backend`: NestJS server implementing the MCP protocol
  - `/postgres`: Database configuration and initialization
- `/mcp-servers`: Individual MCP server implementations for different biological domains
- `/Development`: Development resources and test implementations
  - `/boolSim`: Boolean network simulation tools
  - `/mcp-servers`: Development versions of MCP servers
- `/Scripts`: Utility scripts for building, running, and managing containers
- `/Documentation`: Project documentation and implementation plans

## Implementation Roadmap

The project is being implemented in phases:

1. **Phase 1: Foundation** (Current)
   - Core MCP server implementation
   - Authentication service
   - API documentation
   - Container orchestration foundation

2. **Phase 2: Tool Integration**
   - Standardized tool registration
   - Bioinformatics tool adapters
   - Result formatting services

3. **Phase 3: Workflow Engine**
   - Scientific workflow integration
   - Job queuing and resource management
   - Data lifecycle management

4. **Phase 4: Advanced Features**
   - Interactive sessions
   - Collaboration features
   - Security enhancements

## License

[MIT License](LICENSE)
