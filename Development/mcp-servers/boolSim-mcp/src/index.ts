import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import { spawnSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as temp from 'temp';
import { Validator } from 'jsonschema';

// Constants
const PORT = process.env.PORT || 3050;

// Initialize temp with automatic cleanup
temp.track();

// Interfaces for tool handling
interface Tool {
  name: string;
  description: string;
  parameters: any;
  handler: (args: any) => Promise<string>;
}

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const validator = new Validator();

// Define tools
const tools: Record<string, Tool> = {};

// Middleware to parse JSON requests
app.use(express.json());

// Handler for run_boolsim_command
const runBoolSimCommand = async (args: { command: string; model_file: string; arguments?: string }): Promise<string> => {
  try {
    // Create temporary directory for the model file
    const tempDir = temp.mkdirSync('boolsim-');
    const modelFilePath = path.join(tempDir, 'model.bnet');
    
    // Write the model file
    fs.writeFileSync(modelFilePath, args.model_file);
    
    // Prepare the BoolSim command (using the correct binary name)
    const boolSimCommand = `boolSim ${args.command} ${modelFilePath} ${args.arguments || ''}`;
    
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
    
    // Return the successful result
    return JSON.stringify({
      success: true,
      output: result.stdout,
      command: boolSimCommand
    });
  } catch (error) {
    console.error('Error executing BoolSim command:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Handler for analyze_boolean_network
const analyzeBooleanNetwork = async (args: { model_file: string; analysis_type: string; initial_state?: string }): Promise<string> => {
  try {
    // Create temporary directory for the model file
    const tempDir = temp.mkdirSync('boolsim-analysis-');
    const modelFilePath = path.join(tempDir, 'model.bnet');
    
    // Write the model file
    fs.writeFileSync(modelFilePath, args.model_file);
    
    let boolSimCommand = '';
    
    // Determine which command to run based on analysis type (using the correct binary name)
    if (args.analysis_type === 'attractors') {
      boolSimCommand = `boolSim attractor ${modelFilePath}`;
    } else if (args.analysis_type === 'reachable') {
      if (!args.initial_state) {
        return JSON.stringify({
          success: false,
          error: 'Initial state is required for reachability analysis'
        });
      }
      boolSimCommand = `boolSim reachable ${modelFilePath} --initial-state="${args.initial_state}"`;
    } else if (args.analysis_type === 'stability') {
      boolSimCommand = `boolSim stability ${modelFilePath}`;
    }
    
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
    
    // Return the successful result
    return JSON.stringify({
      success: true,
      output: result.stdout,
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
  console.log('Available endpoints:');
  Object.values(tools).forEach(tool => {
    console.log(`- POST /api/${tool.name}`);
  });
  console.log('WebSocket events:');
  Object.values(tools).forEach(tool => {
    console.log(`- ${tool.name}`);
  });
  console.log('- TOOL_CALL (MCP protocol)');
}); 