# Weather MCP Server

A Model Context Protocol server that provides weather forecasts and alerts through the National Weather Service API.

## Features

- Get weather alerts for any US state
- Get weather forecasts for any US location by latitude and longitude

## Prerequisites

- Node.js 18 or higher
- npm or Docker

## Installation

### Using npm

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Start the server
npm start
```

### Using Docker

```bash
# Build the Docker image
docker build -t mcp-weather-mcp .

# Run the container
docker run -it mcp-weather-mcp
```

## Tool Documentation

### get-alerts

Gets active weather alerts for a US state.

**Parameters:**
- `state` (string): Two-letter US state code (e.g., CA, NY)

**Example:**
```json
{
  "state": "TX"
}
```

### get-forecast

Gets the weather forecast for a specific location by coordinates.

**Parameters:**
- `latitude` (number): Latitude of the location
- `longitude` (number): Longitude of the location

**Example:**
```json
{
  "latitude": 38.8977,
  "longitude": -77.0365
}
```

## Integration with Claude for Desktop

To integrate with Claude for Desktop, add this server to your Claude configuration file at `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": [
        "/absolute/path/to/weather-mcp/dist/index.js"
      ]
    }
  }
}
```

## License

MIT 