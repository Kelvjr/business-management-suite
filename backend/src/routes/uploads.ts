import { Router } from "express";
import multer from "multer";
import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const uploadDirectory = resolve(process.cwd(), "uploads");
mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({ destination: uploadDirectory, filename: (_req, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: 10_000_000 },
  fileFilter: (_req, file, callback) => callback(null, ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.mimetype)),
});

export const uploadsRouter = Router();
uploadsRouter.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a JPG, PNG, WebP, or PDF file under 10 MB." });
  res.status(201).json({ data: { name: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, url: `/uploads/${req.file.filename}` } });
});
