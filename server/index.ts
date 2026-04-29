import "./db/init";
import { healthEndpoint } from "./endpoints/health";
import { rootEndpoint } from "./endpoints/root";
import { registerEndpoint, loginEndpoint, validateEndpoint } from "./endpoints/auth";
import { getDictionarySize } from "./words/dictionary";
import { handleWebSocketUpgrade, websocket } from "./websocket";

// CORS wrapper for endpoints
function withCors(handler: (req: Request) => Response | Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const response = await handler(req);
    
    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

const server = Bun.serve({
  port: 5555,
  routes: {
    "/": withCors(rootEndpoint),
    "/health": withCors(healthEndpoint),
    "/api/auth/register": withCors(registerEndpoint),
    "/api/auth/login": withCors(loginEndpoint),
    "/api/auth/validate": withCors(validateEndpoint),
  },
  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      const upgraded = handleWebSocketUpgrade(req, server);
      if (upgraded) {
        return;
      }

      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    return undefined;
  },
  websocket,
  error(error) {
    console.error(error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  },
});

console.log(`Server running at ${server.url}`);
console.log(`Loaded dictionary with ${getDictionarySize()} words`);
