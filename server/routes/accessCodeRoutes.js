import express from "express";
import Joi from "joi";
import bcrypt from "bcryptjs";
import { requireAuth } from "../auth/session.js";
import { loadRoom } from "../access-control/requireRoomAccess.js";
import { claimRateLimiter } from "../middleware/rateLimiter.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import AppError from "../utils/AppError.js";
import { recordEvent } from "../utils/audit.js";

const router = express.Router();

const claimSchema = Joi.object({
  accessCode: Joi.string().trim().min(6).max(20).required(),
});

router.post("/:roomId/claim",requireAuth,claimRateLimiter,loadRoom,asyncWrapper(async (req, res)=>{
    const { error, value } = claimSchema.validate(req.body);
    if (error) throw new AppError("Invalid code", 400);

    const room = req.room;
    const { sub } = req.user;

    if (room.ownerId && room.ownerId === sub) {
      return res.json({ success: true, roomId: room.publicId }); // already the bound owner
    }
    if (sub === room.requesterId) throw new AppError("Invalid code or room", 403);

    const genericDenial = () => { throw new AppError("Invalid code or room", 403); };

    if (room.ownerId) genericDenial();
    if (room.claimExpiresAt < new Date()) genericDenial();

    const isMatch = await bcrypt.compare(value.accessCode, room.accessCodeHash);
    if (!isMatch) genericDenial();

    room.ownerId = sub;
    await room.save();
    await recordEvent({ roomId: room._id, type: "claimed", actorId: sub });

    res.json({ success: true, roomId: room.publicId });
  })
);

export default router;