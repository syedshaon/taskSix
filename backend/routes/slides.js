import express from "express";
import pool from "../db/db.js";

const router = express.Router();

// Middleware to check if user is the creator
async function checkCreator(req, res, next) {
  const userId = req.user?.id || req.query.userId;
  const { presentationId } = req.params;

  if (!userId) return res.status(401).json({ error: "User ID is required" });

  try {
    const result = await pool.query("SELECT role FROM user_roles WHERE user_id = $1 AND presentation_id = $2", [userId, presentationId]);

    if (!result.rows.length || result.rows[0].role !== "creator") {
      return res.status(403).json({ error: "Only the creator can perform this action." });
    }

    next();
  } catch (err) {
    console.error("Error checking user role:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Middleware to check if user is an editor or creator
async function checkEditor(req, res, next) {
  const userId = req.user?.id || req.query.userId;
  const { presentationId } = req.params;

  if (!userId) return res.status(401).json({ error: "User ID is required" });

  try {
    const result = await pool.query("SELECT role FROM user_roles WHERE user_id = $1 AND presentation_id = $2", [userId, presentationId]);

    if (!result.rows.length || (result.rows[0].role !== "creator" && result.rows[0].role !== "editor")) {
      return res.status(403).json({ error: "Only editors or the creator can modify slides." });
    }

    next();
  } catch (err) {
    console.error("Error checking user role:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// 📌 Add a new slide (Creator Only)
router.post("/", checkCreator, async (req, res) => {
  const { presentation_id, position, background_color, transition_type } = req.body;

  if (!presentation_id || position === undefined) {
    return res.status(400).json({ error: "Presentation ID and position are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO slides (presentation_id, position, background_color, transition_type) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [presentation_id, position, background_color || "#FFFFFF", transition_type || "none"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding slide:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 📌 Get all slides in a presentation (Anyone can view)
router.get("/:presentationId", async (req, res) => {
  const { presentationId } = req.params;

  try {
    const result = await pool.query("SELECT * FROM slides WHERE presentation_id = $1 ORDER BY position ASC", [presentationId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching slides:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 📌 Update a slide (Editor or Creator Only)
router.put("/:id/:presentationId", checkEditor, async (req, res) => {
  const { id } = req.params;
  const { position, background_color, transition_type } = req.body;

  try {
    const result = await pool.query(
      `UPDATE slides 
       SET position = COALESCE($1, position), 
           background_color = COALESCE($2, background_color), 
           transition_type = COALESCE($3, transition_type) 
       WHERE id = $4 
       RETURNING *`,
      [position, background_color, transition_type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Slide not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error updating slide:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 📌 Delete a slide (Creator Only)
router.delete("/:id/:presentationId", checkCreator, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM slides WHERE id = $1", [id]);
    res.json({ message: "Slide deleted successfully" });
  } catch (err) {
    console.error("Error deleting slide:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
