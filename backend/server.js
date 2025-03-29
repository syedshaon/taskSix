import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import presentationRoutes from "./routes/presentations.js";
import slideRoutes from "./routes/slides.js";
import slideElementRoutes from "./routes/slideElements.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/presentations", presentationRoutes);
app.use("/api/slides", slideRoutes);
app.use("/api/slide-elements", slideElementRoutes(wss)); // Pass WebSocket server

// Store active users with their roles
const activeUsers = new Map();

/**
 * Broadcast a message to all users in a specific presentation.
 */
const broadcast = (presentationId, message, senderWs = null) => {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN && client.presentationId === presentationId && client !== senderWs) {
      client.send(JSON.stringify(message));
    }
  });
};

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === "join_presentation") {
        ws.presentationId = message.presentationId;
        ws.userId = message.userId;
        ws.role = message.role;

        activeUsers.set(ws.userId, { ws, presentationId: ws.presentationId, role: ws.role });

        console.log(`User ${ws.userId} joined presentation ${ws.presentationId} as ${ws.role}`);

        // ✅ Notify others that user joined
        broadcast(ws.presentationId, {
          type: "update_users",
          users: Array.from(activeUsers.values()).filter((u) => u.presentationId === ws.presentationId),
        });
      }
    } catch (error) {
      console.error("Invalid WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`User ${ws.userId} disconnected`);
    activeUsers.delete(ws.userId);

    // ✅ Ensure proper cleanup
    if (ws.presentationId) {
      broadcast(ws.presentationId, {
        type: "update_users",
        users: Array.from(activeUsers.values()).filter((u) => u.presentationId === ws.presentationId),
      });
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
