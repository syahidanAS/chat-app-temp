const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

let users = new Map(); // ws => username

wss.on("connection", (ws) => {
  console.log("Client connected");

  // limit 4 user
  if (wss.clients.size > 4) {
    ws.send(JSON.stringify({
      type: "error",
      message: "Room penuh (max 4 user)"
    }));
    ws.close();
    return;
  }

  ws.on("message", (data) => {
    let msg;

    try {
      msg = JSON.parse(data);
    } catch (e) {
      return;
    }

    // JOIN
    if (msg.type === "join") {
      users.set(ws, msg.username);

      broadcast({
        type: "system",
        message: `${msg.username} masuk chat`
      });

      return;
    }

    // CHAT
    if (msg.type === "chat") {
      const username = users.get(ws) || "Unknown";

      broadcast({
        type: "chat",
        username,
        message: msg.message
      });
    }
  });

  ws.on("close", () => {
    const name = users.get(ws);
    users.delete(ws);

    if (name) {
      broadcast({
        type: "system",
        message: `${name} keluar chat`
      });
    }
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

server.listen(5505, () => {
  console.log("http://localhost:5505");
});