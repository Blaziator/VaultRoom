import express from "express";
import Joi from "joi";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Room from "../models/Room.js";
import DocumentRequest from "../models/DocumentRequest.js";
import DocumentGrant from "../models/DocumentGrant.js";
import { requireAuth } from "../auth/session.js";
import { loadRoom, requireRoomParticipant } from "../access-control/requireRoomAccess.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import AppError from "../utils/AppError.js";
import { recordEvent } from "../utils/audit.js";
import AuditEvent from "../models/AuditEvent.js";

const router = express.Router();
const CLAIM_WINDOW_HOURS = 72;

const createRoomSchema = Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    categories: Joi.array()
        .items(
        Joi.object({
            category: Joi.string().trim().min(2).max(60).required(),
            label: Joi.string().trim().min(2).max(100).required(),
            required: Joi.boolean().default(true),
            reason: Joi.string().trim().min(3).max(300).required(),
        })
        )
        .min(1)
        .max(10)
        .required(),
});

const generateAccessCode = () =>
  crypto.randomBytes(6).toString("hex").toUpperCase().match(/.{1,4}/g).join("-");

router.post("/",requireAuth,asyncWrapper(async (req, res) => {
    const { error, value } = createRoomSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const accessCode = generateAccessCode();
    const accessCodeHash = await bcrypt.hash(accessCode, 10);

    const room = await Room.create({
        title: value.title,
        requesterId: req.user.sub,
        accessCodeHash,
        claimExpiresAt: new Date(Date.now() + CLAIM_WINDOW_HOURS * 60 * 60 * 1000),
    });

    await DocumentRequest.insertMany(value.categories.map((c) => ({ ...c, roomId: room._id })));
    await recordEvent({ roomId: room._id, type: "created", actorId: req.user.sub });

    res.status(201).json({ roomId: room.publicId, accessCode, claimExpiresAt: room.claimExpiresAt });
  })
);

router.get("/",requireAuth,asyncWrapper(async (req, res) => {
    const { sub } = req.user;
    const [created, shared] = await Promise.all([
        Room.find({ requesterId: sub, archivedAt: null }).sort({ createdAt: -1 }),
        Room.find({ ownerId: sub, archivedAt: null }).sort({ createdAt: -1 }),
    ]);
    res.json({ created, shared });
  })
);

router.get("/:roomId",requireAuth,loadRoom,asyncWrapper(async (req, res) => {
    const { sub } = req.user;
    const room = req.room;
    const isParticipant = sub === room.requesterId || sub === room.ownerId;

    if (!isParticipant) {
        if (!room.ownerId && room.claimExpiresAt > new Date()) {
            return res.json({ status: "unclaimed", requiresAccessCode: true, title: room.title });
        }
        throw new AppError("You don't have access to this room", 403);
    }

    const requests = await DocumentRequest.find({ roomId: room._id });
    const grants = await DocumentGrant.find({ roomId: room._id }); // fileBuffer excluded by schema default

    res.json({
        status: "active",
        room: {
          id: room.publicId,
          title: room.title,
          claimed: !!room.ownerId,
          isRequester: sub === room.requesterId,
          isOwner: sub === room.ownerId,
        },
        requests,
        grants,
    });
  })
);

router.get("/:roomId/timeline",requireAuth,loadRoom,requireRoomParticipant,asyncWrapper(async (req, res) => {
    const events = await AuditEvent.find({ roomId: req.room._id }).sort({ timestamp: 1 });
    const timeline = events.map((e) => ({
      type: e.type,
      actor: e.actorId === req.user.sub ? "you" : "the other party",
      timestamp: e.timestamp,
    }));
    res.json(timeline);
  })
);

router.patch("/:roomId",requireAuth,loadRoom,requireRoomParticipant,asyncWrapper(async (req, res) => {
    if (req.user.sub !== req.room.requesterId) throw new AppError("Only the requester can edit this room", 403);
    if (req.room.ownerId) throw new AppError("This room can no longer be edited — an owner has already claimed it", 409);

    const { error, value } = createRoomSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    req.room.title = value.title;
    await req.room.save();
    await DocumentRequest.deleteMany({ roomId: req.room._id });
    await DocumentRequest.insertMany(value.categories.map((c) => ({ ...c, roomId: req.room._id })));

    res.json({ success: true });
  })
);

router.patch("/:roomId/archive",requireAuth,loadRoom,requireRoomParticipant,asyncWrapper(async (req, res) => {
    if (req.user.sub !== req.room.requesterId) throw new AppError("Only the requester can archive this room", 403);
    req.room.archivedAt = new Date();
    await req.room.save();
    res.json({ success: true });
  })
);

router.delete("/:roomId",requireAuth,loadRoom,requireRoomParticipant,asyncWrapper(async (req, res) => {
    if (req.user.sub !== req.room.requesterId) throw new AppError("Only the requester can delete this room", 403);
    if (req.room.ownerId) throw new AppError("Claimed rooms can only be archived, not deleted, to preserve the audit trail", 409);

    await DocumentRequest.deleteMany({ roomId: req.room._id });
    await req.room.deleteOne();
    res.json({ success: true });
  })
);

export default router;