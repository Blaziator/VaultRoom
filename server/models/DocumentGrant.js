import mongoose from "mongoose";
import crypto from "crypto";

const documentGrantSchema = new mongoose.Schema(
  {
    publicId:{
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    roomId:{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Room", 
        required: true, 
        index: true 
    },
    requestId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "DocumentRequest",
        required: true 
    },
    fileBuffer:{ 
        type: Buffer, 
        required: true,
        select: false
    },
    mimetype:{ 
        type: String, 
        required: true 
    },
    filename:{ 
        type: String, 
        required: true 
    },
    expiresAt:{ 
        type: Date, 
        required: true 
    },
    revokedAt:{ 
        type: Date, 
        default: null 
    },
    uploadedAt:{ 
        type: Date, 
        default: Date.now 
    },
  },
  { timestamps: true }
);

export default mongoose.model("DocumentGrant", documentGrantSchema);