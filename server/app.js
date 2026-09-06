import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./auth/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import accessCodeRoutes from "./routes/accessCodeRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import logger from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next)=>{
    logger.info({event: "request", method: req.method, path: req.path});
    next();
});

app.get("/health", (req, res)=>{
    res.json({status: "ok"});
});

app.use("/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/rooms", accessCodeRoutes);
app.use("/api/uploads", uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

export default app;