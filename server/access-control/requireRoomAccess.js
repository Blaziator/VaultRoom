import Room from "../models/Room.js";
import DocumentGrant from "../models/DocumentGrant.js";
import AppError from "../utils/AppError.js";
import asyncWrapper from "../utils/asyncWrapper.js";

export const loadRoom = asyncWrapper(async (req, res, next) => {
    const room = await Room.findOne({ publicId: req.params.roomId });
    if (!room) throw new AppError("DENIED", 403);
    req.room = room;
    next();
});

export const requireRoomParticipant = (req, res, next) => {
    const { sub } = req.user;
    const { requesterId, ownerId } = req.room;
    if (sub !== requesterId && sub !== ownerId) {
        throw new AppError("DENIED", 403);
    }
    next();
};

export const loadValidGrant = asyncWrapper(async (req, res, next) => {
    const grant = await DocumentGrant.findOne({
        publicId: req.params.grantId,
        roomId: req.room._id,
    });
    if (!grant) throw new AppError("Document not found", 404);
    if (grant.revokedAt) throw new AppError("Access to this document has been revoked", 403);
    if (grant.expiresAt < new Date()) throw new AppError("Access to this document has expired", 403);

    req.grant = grant;
    next();
});