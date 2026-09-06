import jwt from "jsonwebtoken";

export const makeSessionCookie = (sub, email = "test@example.com") => {
    const token = jwt.sign({ sub, email }, process.env.SESSION_SECRET, { expiresIn: "1h" });
    return `vaultroom_session=${token}`;
};