import express from "express";
import { generators } from "openid-client";
import { getNamoidClient, generatePkce } from "./namoidClient.js";
import { createSessionCookie } from "./session.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

const router = express.Router();
const pendingLogins = new Map();

router.get("/login",asyncWrapper(async (req, res) => {
    const client = await getNamoidClient();
    const { codeVerifier, codeChallenge } = generatePkce();
    const state = generators.state();

    pendingLogins.set(state, { codeVerifier, createdAt: Date.now() });

    const authorizationUrl = client.authorizationUrl({
        redirect_uri: process.env.NAMOID_CALLBACK_URL,
        scope: "openid profile email",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state,
    });

    res.redirect(authorizationUrl);
  })
);

router.get("/callback",asyncWrapper(async (req, res) => {
    const client = await getNamoidClient();
    const params = client.callbackParams(req);
    const pending = pendingLogins.get(params.state);
    if (!pending) {
      throw new AppError("Invalid or expired login attempt", 400);
    }

    pendingLogins.delete(params.state);

    const tokenSet = await client.callback(
        process.env.NAMOID_CALLBACK_URL,
        params,
        { code_verifier: pending.codeVerifier, state: params.state }
    );

    const claims = tokenSet.claims();

    logger.info({ event: "auth_success", sub: claims.sub });

    createSessionCookie(res, { sub: claims.sub, email: claims.email });

    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  })
);

router.post("/logout",asyncWrapper(async (req, res) => {
    res.clearCookie("vaultroom_session");
    res.json({ success: true });
  })
);

export default router;