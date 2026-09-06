import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../app.js";
import Room from "../models/Room.js";
import DocumentRequest from "../models/DocumentRequest.js";
import DocumentGrant from "../models/DocumentGrant.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.js";
import { makeSessionCookie } from "./testAuth.js";

beforeAll(connectTestDB);
afterAll(disconnectTestDB);
afterEach(clearTestDB);

const createRoomWithGrant = async ({ expiresAt, revokedAt = null }) => {
    const accessCodeHash = await bcrypt.hash("TEST-CODE", 10);
    const room = await Room.create({
        title: "Test room",
        requesterId: "requester-sub",
        ownerId: "owner-sub",
        accessCodeHash,
        claimExpiresAt: new Date(Date.now() + 3600_000),
    });
    const docRequest = await DocumentRequest.create({
        roomId: room._id,
        category: "identity",
        label: "Identity proof",
        required: true,
        reason: "test",
    });
    const grant = await DocumentGrant.create({
        roomId: room._id,
        requestId: docRequest._id,
        fileBuffer: Buffer.from("fake-file-content"),
        mimetype: "text/plain",
        filename: "fake.txt",
        expiresAt,
        revokedAt,
    });
    return { room, grant };
};

describe("Access control", () => {
    it("blocks an authenticated stranger who isn't a room participant", async () => {
        const { room, grant } = await createRoomWithGrant({ expiresAt: new Date(Date.now() + 3600_000) });
        const res = await request(app)
        .get(`/api/rooms/${room.publicId}/grants/${grant.publicId}`)
        .set("Cookie", [makeSessionCookie("some-stranger-sub")]);
        expect(res.status).toBe(403);
    });

    it("blocks access to an expired grant, even for a genuine participant", async () => {
        const { room, grant } = await createRoomWithGrant({ expiresAt: new Date(Date.now() - 60_000) });
        const res = await request(app)
        .get(`/api/rooms/${room.publicId}/grants/${grant.publicId}/download`)
        .set("Cookie", [makeSessionCookie("owner-sub")]);
        expect(res.status).toBe(403);
    });

    it("blocks access to a revoked grant, even for a genuine participant", async () => {
        const { room, grant } = await createRoomWithGrant({
        expiresAt: new Date(Date.now() + 3600_000),
        revokedAt: new Date(),
        });
        const res = await request(app)
        .get(`/api/rooms/${room.publicId}/grants/${grant.publicId}/download`)
        .set("Cookie", [makeSessionCookie("requester-sub")]);
        expect(res.status).toBe(403);
    });

    it("allows a genuine participant to view a valid, unexpired, unrevoked grant", async () => {
        const { room, grant } = await createRoomWithGrant({ expiresAt: new Date(Date.now() + 3600_000) });
        const res = await request(app)
        .get(`/api/rooms/${room.publicId}/grants/${grant.publicId}`)
        .set("Cookie", [makeSessionCookie("owner-sub")]);
        expect(res.status).toBe(200);
    });
});