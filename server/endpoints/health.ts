export function healthEndpoint() {
  return Response.json({
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
  });
}
