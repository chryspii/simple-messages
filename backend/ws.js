import { WebSocketServer } from "ws";

let wss;

export function startWebSocketServer() {
  if (wss) return;

  wss = new WebSocketServer({ port: 8080 });
  console.log("WebSocket server running on :8080");

  wss.on("connection", () => {
    console.log("WS client connected");
  });
}

export function broadcast(data) {
  if (!wss) return;

  const msg = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === 1) {
      c.send(msg);
    }
  });
}
