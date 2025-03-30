// In your Express server (e.g., server/routes/uploads.js)
import express from "express";

const router = express.Router();
import multer from "multer";
import path from "path";
import fs from "fs/promises";

// const multer = require("multer");
// const path = require("path");
// const fs = require("fs").promises;

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/uploads");
    fs.mkdir(uploadPath, { recursive: true }).then(() => {
      cb(null, uploadPath);
    });
  },
  filename: (req, file, cb) => {
    const elementId = req.body.elementId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${elementId}-${timestamp}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
