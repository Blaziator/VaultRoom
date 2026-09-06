import jwt from "jsonwebtoken";

const COOKIE_NAME = "vaultroom_session";

export const createSessionCookie = (res, payload) => {
  const token = jwt.sign(payload, process.env.SESSION_SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    req.user = jwt.verify(token, process.env.SESSION_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
};