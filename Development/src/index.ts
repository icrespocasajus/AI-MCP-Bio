import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import { spawnSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as temp from 'temp';
import { Validator } from 'jsonschema';

// Constants
const PORT = 3001; // Force port 3001
console.log(`Starting server with PORT: ${PORT}, process.env.PORT=${process.env.PORT}`);

// Initialize temp with automatic cleanup
temp.track();
console.log('Temp tracking initialized');

// Interfaces for tool handling
interface Tool {
  name: string;
  description: string;
  parameters: any;
  handler: (args: any) => Promise<string>;
}

// Create Express app and HTTP server
const app = express();
app.use(express.json({ limit: '10mb' }));  // Increase limit for larger requests
console.log('Express app initialized with JSON middleware');

const server = http.createServer(app);
console.log('HTTP server created');

const io = new Server(server);
console.log('Socket.IO server initialized');

const validator = new Validator();
console.log('JSON Schema validator initialized');

// Define tools
const tools: Record<string, Tool> = {};

// Middleware to parse JSON requests
app.use(express.json());

// Handler for run_boolsim_command
const runBoolSimCommand = async (args: { command: string; model_file: string; arguments?: string }): Promise<string> => {
  try {
    console.log('Starting runBoolSimCommand with args:', JSON.stringify(args, null, 2));
    
    // Create temporary directory for the model file
    const tempDir = temp.mkdirSync('boolsim-');
    console.log('Created temp directory:', tempDir);
    
    const modelFilePath = path.join(tempDir, 'model.bnet');
    console.log('Model file path:', modelFilePath);
    
    // Write the model file
    fs.writeFileSync(modelFilePath, args.model_file);
    console.log('Wrote model file with content:', args.model_file);
    
    // Check if the file exists
    if (!fs.existsSync(modelFilePath)) {
      return JSON.stringify({
        success: false,
        error: `Model file was not created at ${modelFilePath}`
      });
    }
    
    // Prepare the BoolSim command (using the correct binary name)
    // boolSim doesn't have subcommands, just options
    const boolSimCommand = `/opt/boolSim/boolSim-1.1.0-Linux/bin/boolSim -f ${modelFilePath} ${args.arguments || ''}`;
    
    console.log(`Executing command: ${boolSimCommand}`);
    
    // Check if the boolSim binary exists
    const boolSimPath = '/opt/boolSim/boolSim-1.1.0-Linux/bin/boolSim';
    try {
      const boolSimStats = fs.statSync(boolSimPath);
      console.log(`boolSim binary exists:`, boolSimStats.isFile(), `Size:`, boolSimStats.size);
    } catch (err) {
      console.error(`Error checking boolSim binary:`, err);
      return JSON.stringify({
        success: false,
        error: `boolSim binary check failed: ${err instanceof Error ? err.message : String(err)}`
      });
    }
    
    // Execute the command with detailed output
    const result = spawnSync('sh', ['-c', boolSimCommand], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for larger outputs
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log('Command execution result:', {
      pid: result.pid,
      status: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error
    });
    
    if (result.error) {
      return JSON.stringify({
        success: false,
        error: result.error.message,
        details: `Error type: ${result.error.name}, Stack: ${result.error.stack}`
      });
    }
    
    if (result.status !== 0) {
      return JSON.stringify({
        success: false,
        error: result.stderr || `Command exited with code ${result.status}`,
        status: result.status
      });
    }
    
    // Try to list the output directory
    try {
      const outputFiles = fs.readdirSync(tempDir);
      console.log('Files in temp directory:', outputFiles);
    } catch (err) {
      console.error('Error listing temp directory:', err);
    }
    
    // Return the successful result
    return JSON.stringify({
      success: true,
      output: result.stdout || 'No output provided by the command',
      command: boolSimCommand,
      temp_dir: tempDir
    });
  } catch (error) {
    console.error('Error executing BoolSim command:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
};

// Handler for analyze_boolean_network
const analyzeBooleanNetwork = async (args: { model_file: string; analysis_type: string; initial_state?: string; output_file?: string }): Promise<string> => {
  try {
    // Create temporary directory for the model file
    const tempDir = temp.mkdirSync('boolsim-analysis-');
    const modelFilePath = path.join(tempDir, 'model.bnet');
    
    // Write the model file
    fs.writeFileSync(modelFilePath, args.model_file);
    
    // Prepare base command
    let boolSimCommand = `/opt/boolSim/boolSim-1.1.0-Linux/bin/boolSim -f ${modelFilePath}`;
    
    // Add options based on analysis type
    if (args.analysis_type === 'attractors') {
      // For attractors, just use the network file as default
      // No additional options needed
    } else if (args.analysis_type === 'reachable' && args.initial_state) {
      // Create initial states file
      const initialStatesFilePath = path.join(tempDir, 'initial_states.txt');
      fs.writeFileSync(initialStatesFilePath, args.initial_state);
      boolSimCommand += ` -i ${initialStatesFilePath}`;
    } else if (args.analysis_type === 'reachable' && !args.initial_state) {
      return JSON.stringify({
        success: false,
        error: 'Initial state is required for reachability analysis'
      });
    }
    
    // Add output file if specified
    if (args.output_file) {
      const outputFilePath = path.join(tempDir, 'output.txt');
      boolSimCommand += ` -o ${outputFilePath}`;
    }
    
    console.log(`Executing command: ${boolSimCommand}`);
    
    // Execute the command
    const result = spawnSync('sh', ['-c', boolSimCommand], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for larger outputs
    });
    
    if (result.error) {
      return JSON.stringify({
        success: false,
        error: result.error.message
      });
    }
    
    if (result.status !== 0) {
      return JSON.stringify({
        success: false,
        error: result.stderr || `Command exited with code ${result.status}`
      });
    }
    
    // If output file was specified, read it
    let output = result.stdout;
    if (args.output_file) {
      const outputFilePath = path.join(tempDir, 'output.txt');
      if (fs.existsSync(outputFilePath)) {
        output = fs.readFileSync(outputFilePath, 'utf8');
      }
    }
    
    // Return the successful result
    return JSON.stringify({
      success: true,
      output: output,
      command: boolSimCommand
    });
  } catch (error) {
    console.error('Error performing BoolSim analysis:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Register tools
tools['run_boolsim_command'] = {
  name: 'run_boolsim_command',
  description: 'Run a BoolSim command and return the output',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The BoolSim command to run (e.g., "attractor", "reachable")'
      },
      model_file: {
        type: 'string',
        description: 'Content of the Boolean network model file'
      },
      arguments: {
        type: 'string',
        description: 'Additional arguments for the BoolSim command'
      }
    },
    required: ['command', 'model_file']
  },
  handler: runBoolSimCommand
};

tools['analyze_boolean_network'] = {
  name: 'analyze_boolean_network',
  description: 'Analyze a Boolean network to find attractors and properties',
  parameters: {
    type: 'object',
    properties: {
      model_file: {
        type: 'string',
        description: 'Content of the Boolean network model file'
      },
      analysis_type: {
        type: 'string',
        description: 'Type of analysis to perform (attractors, reachable, stability)',
        enum: ['attractors', 'reachable', 'stability']
      },
      initial_state: {
        type: 'string',
        description: 'Optional initial state for reachability analysis'
      },
      output_file: {
        type: 'string',
        description: 'Optional output file for the analysis result'
      }
    },
    required: ['model_file', 'analysis_type']
  },
  handler: analyzeBooleanNetwork
};

// HTTP endpoints for each tool
Object.values(tools).forEach(tool => {
  app.post(`/api/${tool.name}`, async (req: Request, res: Response) => {
    try {
      // Validate request
      const validation = validator.validate(req.body, tool.parameters);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: validation.errors.map((e: any) => e.message).join(', ') 
        });
      }

      // Call the tool handler
      const result = await tool.handler(req.body);
      res.json(JSON.parse(result));
    } catch (error) {
      console.error(`Error executing ${tool.name}:`, error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Register tools as socket events
  Object.values(tools).forEach(tool => {
    socket.on(tool.name, async (data: any, callback: (response: any) => void) => {
      try {
        // Validate request
        const validation = validator.validate(data, tool.parameters);
        if (!validation.valid) {
          return callback({ 
            error: 'Invalid request', 
            details: validation.errors.map((e: any) => e.message).join(', ') 
          });
        }

        // Call the tool handler
        const result = await tool.handler(data);
        callback(JSON.parse(result));
      } catch (error) {
        console.error(`Error executing ${tool.name}:`, error);
        callback({ 
          error: 'Internal server error', 
          details: error instanceof Error ? error.message : String(error) 
        });
      }
    });
  });

  // Handle MCP protocol
  socket.on('TOOL_CALL', async (data: any) => {
    try {
      const { id, content } = data;
      const { name, parameters } = content;
      
      if (!tools[name]) {
        socket.emit('TOOL_RESULT', {
          id,
          type: 'TOOL_RESULT',
          content: JSON.stringify({
            success: false,
            error: `Tool '${name}' not found`
          })
        });
        return;
      }
      
      // Validate request
      const validation = validator.validate(parameters, tools[name].parameters);
      if (!validation.valid) {
        socket.emit('TOOL_RESULT', {
          id,
          type: 'TOOL_RESULT',
          content: JSON.stringify({
            success: false,
            error: `Invalid parameters: ${validation.errors.map((e: any) => e.message).join(', ')}`
          })
        });
        return;
      }
      
      // Call the tool handler
      const result = await tools[name].handler(parameters);
      
      socket.emit('TOOL_RESULT', {
        id,
        type: 'TOOL_RESULT',
        content: result
      });
    } catch (error) {
      console.error('Error handling TOOL_CALL:', error);
      socket.emit('ERROR', {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`BoolSim MCP server is running on port ${PORT}`);
  console.log(`Server environment variables: PORT=${process.env.PORT}`);
  console.log('Available endpoints:');
  Object.values(tools).forEach(tool => {
    console.log(`- POST /api/${tool.name}`);
  });
  console.log('WebSocket events:');
  Object.values(tools).forEach(tool => {
    console.log(`- ${tool.name}`);
  });
  console.log('- TOOL_CALL (MCP protocol)');
  
  // Check if boolSim is executable
  try {
    const boolSimPath = '/opt/boolSim/boolSim-1.1.0-Linux/bin/boolSim';
    const boolSimStats = fs.statSync(boolSimPath);
    console.log(`boolSim binary exists:`, boolSimStats.isFile(), `Size:`, boolSimStats.size);
    
    // Test execution
    const result = spawnSync('sh', ['-c', `${boolSimPath} --help`], { encoding: 'utf8' });
    console.log('boolSim test execution status:', result.status);
    console.log('boolSim test execution error:', result.error);
  } catch (err) {
    console.error('Error checking boolSim binary:', err);
  }
}); 