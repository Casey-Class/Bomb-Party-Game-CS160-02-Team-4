import "./db/init";
import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { registerEndpoint, loginEndpoint, validateEndpoint } from "./endpoints/auth";
import { healthEndpoint } from "./endpoints/health";
import { profileEndpoint } from "./endpoints/profile";
import { rootEndpoint } from "./endpoints/root";
import { ensureUploadDirectories } from "./lib/uploads";
import { getDictionarySize } from "./words/dictionary";
import { handleWebSocketUpgrade, websocket } from "./websocket";

const uploadRoot = join(import.meta.dir, "uploads");

async function staticUploadHandler(req: Request) {
  const url = new URL(req.url);
  const relativePath = url.pathname.replace(/^\/uploads\//, "");
  const filePath = resolve(uploadRoot, relativePath);

  if (!filePath.startsWith(`${uploadRoot}/`) && filePath !== uploadRoot) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(Bun.file(filePath));
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

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

    try {
      const response = await handler(req);

      if (!response) {
        return new Response("Internal Server Error: No response from handler", {
          status: 500,
          headers: corsHeaders,
        });
      }

      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (err) {
      console.error("CORS Wrapper Error:", err);
      return new Response("Internal Server Error", {
        status: 500,
        headers: corsHeaders,
      });
    }
  };
}

const server = Bun.serve({
  port: 5555,
  hostname: "0.0.0.0",
  routes: {
    "/": withCors(rootEndpoint),
    "/health": withCors(healthEndpoint),
    "/api/auth/register": withCors(registerEndpoint),
    "/api/auth/login": withCors(loginEndpoint),
    "/api/auth/validate": withCors(validateEndpoint),
    "/api/auth/profile": withCors(profileEndpoint),
    "/uploads/*": withCors(staticUploadHandler),
  },
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/uploads/")) {
      return withCors(staticUploadHandler)(req);
    }

    if (url.pathname === "/ws") {
      const upgraded = await handleWebSocketUpgrade(req, server);
      if (upgraded) return;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
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

await ensureUploadDirectories();
console.log(`Server running at ${server.url}`);
console.log(`Loaded dictionary with ${getDictionarySize()} words`);
