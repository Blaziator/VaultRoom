import mongoose from "mongoose";
import crypto from "crypto";

const roomSchema = new mongoose.Schema({
    publicId:{
        type: String,
        unique: true,
        default: ()=> crypto.randomUUID(),
    },
    title:{
        type: String,
        required: true,
        trim: true
    },
    requesterId:{
        type: String,
        required: true,
        index: true
    },
    ownerId:{
        type: String,
        default: null,
        index: true
    },
    accessCodeHash:{
        type: String,
        required: true
    },

    claimExpiresAt:{
        type: Date,
        required: true
    },
    archivedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

export default mongoose.model("Room", roomSchema);