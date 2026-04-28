import "./db/init";
import { healthEndpoint } from "./endpoints/health";
import { rootEndpoint } from "./endpoints/root";
import { registerEndpoint, loginEndpoint, validateEndpoint } from "./endpoints/auth";
import { getDictionarySize } from "./words/dictionary";
import { handleWebSocketUpgrade, websocket } from "./websocket";

const server = Bun.serve({
  port: 5555,
  routes: {
    "/": rootEndpoint,
    "/health": healthEndpoint,
    "/api/auth/register": registerEndpoint,
    "/api/auth/login": loginEndpoint,
    "/api/auth/validate": validateEndpoint,
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

    return new Response("Not Found", { status: 404 });
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
