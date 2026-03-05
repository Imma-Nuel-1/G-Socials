// ============================================
// UPLOAD ROUTES — Production
// ============================================

import { Router } from "express";
import type { Response } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { authenticate } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendSuccess, sendError } from "../lib/response.js";
import prisma from "../lib/prisma.js";
import { audit } from "../lib/audit.js";

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "./uploads");
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760") }, // 10MB default
});

router.use(authenticate);

// POST /api/upload/image
router.post(
  "/image",
  upload.single("image"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    // Track in DB
    const record = await prisma.fileUpload.create({
      data: {
        userId: req.userId!,
        filename: req.file.filename,
        storagePath: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      },
    });

    await audit({
      userId: req.userId!,
      action: "file.upload",
      entity: "FileUpload",
      entityId: record.id,
      metadata: { mimeType: req.file.mimetype, size: req.file.size },
      ipAddress: req.ip,
    });

    sendSuccess(
      res,
      {
        id: record.id,
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
      201,
    );
  }),
);

// POST /api/upload/media (multiple)
router.post(
  "/media",
  upload.array("media", 10),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return sendError(res, "No files uploaded", 400);
    }

    const records = await Promise.all(
      files.map(async (file) => {
        const fileUrl = `/uploads/${file.filename}`;
        const record = await prisma.fileUpload.create({
          data: {
            userId: req.userId!,
            filename: file.filename,
            storagePath: file.path,
            mimeType: file.mimetype,
            size: file.size,
            url: fileUrl,
          },
        });
        return {
          id: record.id,
          url: fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        };
      }),
    );

    sendSuccess(res, records, 201);
  }),
);

export default router;
