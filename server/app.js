import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser);

app.use((req, res, next)=>{
    logger.info({event: "request", method: req.method, path: req.path});
    next();
});

app.get("/health", (req, res)=>{
    res.json({status: "ok"});
});

app.use(errorHandler);


export default app;