const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Path to example models
const MODELS_DIR = path.join(__dirname, '..', 'examples');

// Connect to MCP server
const ws = new WebSocket('ws://localhost:3000');

// Load a model file
function loadModelFile(filename) {
  const filePath = path.join(MODELS_DIR, filename);
  return fs.readFileSync(filePath, 'utf8');
}

// Test run_boolsim_command
function testRunBoolSimCommand() {
  const modelContent = loadModelFile('toggle-switch.bnet');
  
  const request = {
    type: 'TOOL_CALL',
    id: 'test-run-command',
    content: {
      name: 'run_boolsim_command',
      parameters: {
        command: 'attractor',
        model_file: modelContent,
        arguments: ''
      }
    }
  };
  
  ws.send(JSON.stringify(request));
}

// Test analyze_boolean_network
function testAnalyzeBooleanNetwork() {
  const modelContent = loadModelFile('simple-cycle.bnet');
  
  const request = {
    type: 'TOOL_CALL',
    id: 'test-analyze-network',
    content: {
      name: 'analyze_boolean_network',
      parameters: {
        model_file: modelContent,
        analysis_type: 'attractors'
      }
    }
  };
  
  ws.send(JSON.stringify(request));
}

// Handle WebSocket connection events
ws.on('open', () => {
  console.log('Connected to BoolSim MCP server');
  
  // Run tests with slight delay to ensure server is ready
  setTimeout(() => {
    console.log('Running test: run_boolsim_command');
    testRunBoolSimCommand();
  }, 1000);
  
  setTimeout(() => {
    console.log('Running test: analyze_boolean_network');
    testAnalyzeBooleanNetwork();
  }, 2000);
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log('Received response:', response);
  
  if (response.type === 'TOOL_RESULT') {
    const result = JSON.parse(response.content);
    console.log(`Test ${response.id} result:`, result);
    
    if (response.id === 'test-analyze-network') {
      // Close connection after all tests are done
      ws.close();
    }
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
}); 