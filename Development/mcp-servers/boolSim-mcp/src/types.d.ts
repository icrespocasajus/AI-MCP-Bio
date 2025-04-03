declare module '@mcp/server' {
  export class MCPServer {
    constructor(options: { name: string; description?: string });
    addTool(tool: any): void;
    start(options: { transport: string }): Promise<void>;
  }

  export function createTool(options: {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<string>;
  }): any;
}

declare module '@mcp/protocol' {
  // Add any types you need from @mcp/protocol here
} 