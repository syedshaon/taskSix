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

// Store active users with their roles (Map: userId -> { ws, presentationId, role })
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
        const { userId, nickname, presentationId, role } = message;

        // Prevent duplicate users from joining multiple times
        if (activeUsers.has(userId)) {
          console.log(`User ${userId} is already in presentation ${presentationId}`);
          return;
        }

        // Assign properties to WebSocket connection
        ws.userId = userId;
        ws.presentationId = presentationId;
        ws.role = role || "viewer"; // Default to 'viewer' if role is missing

        activeUsers.set(userId, { ws, presentationId, role: ws.role });

        console.log(`User ${userId} joined presentation ${presentationId} as ${ws.role}`);

        // ✅ Notify all users in the same presentation
        broadcast(presentationId, {
          type: "update_users",
          users: Array.from(activeUsers.values())
            .filter((u) => u.presentationId === presentationId)
            .map((u) => ({ userId: u.ws.userId, role: u.role })),
        });
      }
    } catch (error) {
      console.error("Invalid WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    if (!ws.userId || !ws.presentationId) return;

    console.log(`User ${ws.userId} disconnected from presentation ${ws.presentationId}`);

    activeUsers.delete(ws.userId);

    // ✅ Notify remaining users about disconnection
    broadcast(ws.presentationId, {
      type: "update_users",
      users: Array.from(activeUsers.values())
        .filter((u) => u.presentationId === ws.presentationId)
        .map((u) => ({ userId: u.ws.userId, role: u.role })),
    });
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
