import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"], // Force WebSocket over polling for real-time performance
  reconnectionAttempts: 5, // Try reconnecting up to 5 times
  reconnectionDelay: 1000, // Wait 1 second before attempting to reconnect
});

export default socket;
