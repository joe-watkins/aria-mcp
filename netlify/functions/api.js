import { tools } from '../../src/tools.js';

/**
 * Stateless JSON-RPC handler for serverless environments
 */
async function handleJsonRpcRequest(request) {
  const { method, params, id } = request;

  try {
    let result;

    if (method === 'initialize') {
      result = {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'aria-mcp', version: '1.0.0' }
      };
    } else if (method === 'tools/list') {
      result = {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    } else if (method === 'tools/call') {
      const tool = tools.find(t => t.name === params.name);
      if (!tool) throw new Error(`Unknown tool: ${params.name}`);
      result = await tool.handler(params.arguments || {});
    } else if (method === 'notifications/initialized') {
      return null; // Notifications don't get responses
    } else if (method === 'ping') {
      result = {};
    } else {
      throw new Error(`Unknown method: ${method}`);
    }

    return { jsonrpc: '2.0', id, result };
  } catch (error) {
    return { jsonrpc: '2.0', id, error: { code: -32603, message: error.message } };
  }
}

/**
 * Netlify Function handler
 */
export const handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id',
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // MCP JSON-RPC requests
  if (event.httpMethod === 'POST') {
    try {
      const request = JSON.parse(event.body);
      
      // Handle batch requests
      if (Array.isArray(request)) {
        const responses = [];
        for (const req of request) {
          const response = await handleJsonRpcRequest(req);
          if (response !== null) responses.push(response);
        }
        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(responses.length === 1 ? responses[0] : responses)
        };
      }
      
      // Single request
      const response = await handleJsonRpcRequest(request);
      if (response === null) {
        return { statusCode: 202, headers: corsHeaders, body: '' };
      }
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: null,
          error: { code: -32700, message: 'Parse error: ' + error.message }
        })
      };
    }
  }

  // Health check (GET)
  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'aria-mcp',
      version: '1.0.0',
      status: 'healthy',
      protocol: 'MCP JSON-RPC 2.0',
      tools: tools.length
    })
  };
};
