import express from "express";
import pool from "../db/db.js";

const router = express.Router();

export default function slideElementRoutes(wss) {
  // ✅ Add a new slide element
  router.post("/", async (req, res) => {
    const { slide_id, type, content, position, size, properties } = req.body;

    if (!slide_id || !type || !["text", "image", "shape"].includes(type)) {
      return res.status(400).json({ error: "Invalid slide ID or element type" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO slide_elements (slide_id, type, content, position, size, properties)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [slide_id, type, content || "", position || '{"x": 0, "y": 0}', size || '{"width": 100, "height": 100}', properties || "{}"]
      );

      const newElement = result.rows[0];

      // ✅ Broadcast update via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "element_added", element: newElement }));
        }
      });

      res.status(201).json(newElement);
    } catch (err) {
      console.error("Error adding slide element:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ✅ Get all elements in a slide
  router.get("/:slideId", async (req, res) => {
    const { slideId } = req.params;

    try {
      const result = await pool.query("SELECT * FROM slide_elements WHERE slide_id = $1 ORDER BY created_at ASC", [slideId]);

      res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching slide elements:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ✅ Update a slide element
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { content, position, size, properties } = req.body;

    try {
      const result = await pool.query(
        `UPDATE slide_elements 
         SET content = COALESCE($1, content), 
             position = COALESCE($2, position), 
             size = COALESCE($3, size), 
             properties = COALESCE($4, properties),
             updated_at = NOW()
         WHERE id = $5 
         RETURNING *`,
        [content, position, size, properties, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Slide element not found" });
      }

      const updatedElement = result.rows[0];

      // ✅ Broadcast update
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "element_updated", element: updatedElement }));
        }
      });

      res.status(200).json(updatedElement);
    } catch (err) {
      console.error("Error updating slide element:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ✅ Delete a slide element
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query("DELETE FROM slide_elements WHERE id = $1 RETURNING *", [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Slide element not found" });
      }

      const deletedElement = result.rows[0];

      // ✅ Broadcast deletion
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "element_deleted", elementId: deletedElement.id }));
        }
      });

      res.status(200).json({ message: "Slide element deleted successfully" });
    } catch (err) {
      console.error("Error deleting slide element:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
