import express from "express";

import pool from "../db/db.js";

const router = express.Router();

// Create a new presentation
router.post("/", async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await pool.query("INSERT INTO presentations (title) VALUES ($1) RETURNING *", [title]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating presentation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all presentations
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query("SELECT * FROM presentations ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching presentations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single presentation by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM presentations WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Presentation not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching presentation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
