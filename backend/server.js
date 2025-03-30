import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import presentationRoutes from "./routes/presentations.js";
import slideRoutes from "./routes/slides.js";
import slideElementRoutes from "./routes/slideElements.js";
import uploadRoutes from "./routes/uploads.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// API Routes
app.use("/api/presentations", presentationRoutes);
app.use("/api/slides", slideRoutes);
app.use("/api/slide-elements", slideElementRoutes(wss)); // Pass WebSocket server
app.use("/api/uploads", uploadRoutes);

// Store active connections (userId -> { ws, presentationId, role, nickname })
const activeConnections = new Map();

// Store presentation state (presentationId -> { elements, slides, users })
const presentations = new Map();

const broadcastToPresentation = (presentationId, message, excludeUserId = null) => {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN && client.presentationId === presentationId && client.userId !== excludeUserId) {
      client.send(JSON.stringify(message));
    }
  });
};

const updateUsersList = (presentationId) => {
  const users = Array.from(activeConnections.values())
    .filter((user) => user.presentationId === presentationId)
    .map(({ userId, nickname, role }) => ({ userId, nickname, role }));

  broadcastToPresentation(presentationId, {
    type: "users_updated",
    users,
  });
};

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log("Received message:", message.type);

      switch (message.type) {
        case "join_presentation": {
          const { userId, nickname, presentationId, role = "viewer" } = message;

          // Initialize presentation state if not exists
          if (!presentations.has(presentationId)) {
            presentations.set(presentationId, {
              elements: [],
              slides: [],
              currentSlideIndex: 0,
            });
          }

          // Store connection info
          ws.userId = userId;
          ws.presentationId = presentationId;
          activeConnections.set(userId, {
            ws,
            presentationId,
            role,
            nickname,
          });

          // Send current presentation state to the new user
          const presentation = presentations.get(presentationId);
          ws.send(
            JSON.stringify({
              type: "presentation_state",
              slides: presentation.slides,
              currentSlideIndex: presentation.currentSlideIndex,
              elements: presentation.elements,
            })
          );

          // Notify all users in the presentation
          updateUsersList(presentationId);
          break;
        }

        case "add_element": {
          const { presentationId, element } = message;
          const presentation = presentations.get(presentationId);
          if (presentation) {
            presentation.elements = [...presentation.elements, element];
            broadcastToPresentation(
              presentationId,
              {
                type: "element_added",
                element,
              },
              ws.userId
            );
          }
          break;
        }

        case "update_element": {
          const { presentationId, elementId, updates } = message;
          const presentation = presentations.get(presentationId);
          if (presentation) {
            presentation.elements = presentation.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el));
            broadcastToPresentation(
              presentationId,
              {
                type: "element_updated",
                elementId,
                updates,
              },
              ws.userId
            );
          }
          break;
        }

        case "change_slide": {
          const { presentationId, slideIndex } = message;
          const presentation = presentations.get(presentationId);
          if (presentation) {
            presentation.currentSlideIndex = slideIndex;
            broadcastToPresentation(presentationId, {
              type: "slide_changed",
              slideIndex,
            });
          }
          break;
        }

        case "change_role": {
          const { userId, newRole, presentationId } = message;
          const user = activeConnections.get(userId);
          if (user && user.presentationId === presentationId) {
            user.role = newRole;
            if (user.ws.readyState === user.ws.OPEN) {
              user.ws.role = newRole;
              user.ws.send(
                JSON.stringify({
                  type: "role_changed",
                  newRole,
                })
              );
            }
            updateUsersList(presentationId);
          }
          break;
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    if (!ws.userId) return;

    activeConnections.delete(ws.userId);
    if (ws.presentationId) {
      updateUsersList(ws.presentationId);
    }

    console.log(`User ${ws.userId} disconnected`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
