import mongoose from "mongoose";
import crypto from "crypto";

const documentRequestSchema = new mongoose.Schema(
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
    category:{ 
        type: String, 
        required: true, 
        trim: true 
    },
    label:{ 
        type: String, 
        required: true, 
        trim: true 
    },
    required:{ 
        type: Boolean, 
        default: true 
    },
    reason:{ 
        type: String, 
        required: true, 
        trim: true 
    },
  },
  { timestamps: true }
);

export default mongoose.model("DocumentRequest", documentRequestSchema);