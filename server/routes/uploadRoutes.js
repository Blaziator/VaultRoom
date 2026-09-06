import express from "express";
import multer from "multer";
import Joi from "joi";
import DocumentRequest from "../models/DocumentRequest.js";
import DocumentGrant from "../models/DocumentGrant.js";
import { requireAuth } from "../auth/session.js";
import { loadRoom, requireRoomParticipant, loadValidGrant } from "../access-control/requireRoomAccess.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import AppError from "../utils/AppError.js";
import { recordEvent } from "../utils/audit.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadMetaSchema = Joi.object({
  expiresAt: Joi.date().greater("now").required(),
});

router.post("/:roomId/requests/:requestId/upload",requireAuth,loadRoom,requireRoomParticipant,upload.single("file"),asyncWrapper(async (req, res) => {
    if (req.user.sub !== req.room.ownerId) throw new AppError("Only the room's owner can upload documents", 403);
    if (!req.file) throw new AppError("No file provided", 400);

    const { error, value } = uploadMetaSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const docRequest = await DocumentRequest.findOne({ publicId: req.params.requestId, roomId: req.room._id });
    if (!docRequest) throw new AppError("Document category not found", 404);

    const grant = await DocumentGrant.create({
      roomId: req.room._id,
      requestId: docRequest._id,
      fileBuffer: req.file.buffer,
      mimetype: req.file.mimetype,
      filename: req.file.originalname,
      expiresAt: value.expiresAt,
    });

    await recordEvent({ roomId: req.room._id, type: "uploaded", actorId: req.user.sub });

    res.status(201).json({ grantId: grant.publicId, filename: grant.filename, expiresAt: grant.expiresAt });
  })
);

router.get("/:roomId/grants/:grantId",requireAuth,loadRoom,requireRoomParticipant,loadValidGrant,asyncWrapper(async (req, res) => {
    await recordEvent({ roomId: req.room._id, type: "viewed", actorId: req.user.sub });
    res.json({
        grantId: req.grant.publicId,
        filename: req.grant.filename,
        mimetype: req.grant.mimetype,
        expiresAt: req.grant.expiresAt,
    });
  })
);

router.get("/:roomId/grants/:grantId/download",requireAuth,loadRoom,requireRoomParticipant,loadValidGrant,asyncWrapper(async (req, res) => {
    const grantWithFile = await DocumentGrant.findById(req.grant._id).select("+fileBuffer");
    const isInline = req.query.mode === "inline"; 

    await recordEvent({ roomId: req.room._id, type: "downloaded", actorId: req.user.sub });

    res.setHeader("Content-Type", grantWithFile.mimetype);
    res.setHeader(
      "Content-Disposition",
      `${isInline ? "inline" : "attachment"}; filename="${grantWithFile.filename}"`
    );
    res.send(grantWithFile.fileBuffer);
  })
);

router.patch("/:roomId/grants/:grantId/revoke",requireAuth,loadRoom,requireRoomParticipant,asyncWrapper(async (req, res) => {
    if (req.user.sub !== req.room.ownerId) throw new AppError("Only the document's owner can revoke access", 403);

    const grant = await DocumentGrant.findOne({ publicId: req.params.grantId, roomId: req.room._id });
    if (!grant) throw new AppError("Document not found", 404);
    if (grant.revokedAt) throw new AppError("Already revoked", 409);

    grant.revokedAt = new Date();
    await grant.save();
    await recordEvent({ roomId: req.room._id, type: "revoked", actorId: req.user.sub });

    res.json({ success: true });
  })
);

export default router;