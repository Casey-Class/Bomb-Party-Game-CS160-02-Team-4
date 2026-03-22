import { healthEndpoint } from "./endpoints/health";
import { rootEndpoint } from "./endpoints/root";

const server = Bun.serve({
  port: 5555,
  routes: {
    "/": rootEndpoint,
    "/health": healthEndpoint,
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
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
