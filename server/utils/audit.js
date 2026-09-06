import AuditEvent from "../models/AuditEvent.js";
import logger from "./logger.js";

export const recordEvent = async ({ roomId, type, actorId }) => {
  const event = await AuditEvent.create({ roomId, type, actorId });
  logger.info({ event: "audit", type, roomId: String(roomId), actorId });
  return event;
};