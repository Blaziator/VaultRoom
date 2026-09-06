import mongoose from "mongoose";

const AUDIT_EVENT_TYPES = [
  "created",
  "claimed",
  "uploaded",
  "viewed",
  "downloaded",
  "expired",
  "revoked",
];

const auditEventSchema = new mongoose.Schema({

    roomId:{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Room", required: true, 
        index: true 
    },
    type:{ 
        type: String, 
        enum: AUDIT_EVENT_TYPES, 
        required: true 
    },
    actorId:{ 
        type: String, 
        required: true 
    }, 
    timestamp:{ 
        type: Date, 
        default: Date.now 
    },
});

auditEventSchema.index({ roomId: 1, timestamp: 1 });

export default mongoose.model("AuditEvent", auditEventSchema);