# Engineering decisions

## Scope
Completed: NamoID Hosted Auth (OIDC, Authorization Code + PKCE) via a confidential Express backend-for-frontend, HttpOnly JWT session cookie, room creation with per-category document requests, access-code-based owner claiming (bcrypt-hashed, rate-limited), file upload/view/download stored as MongoDB Buffers, revocation, and a full audit timeline. Left out: production deployment (running locally/demo recording only, given the timebox), magic-byte file-type verification, and the "bulk collection across many owners" scenario the PS explicitly defers to future
versions.

## Architecture
React (Vite) frontend + Express backend. The frontend only starts the NamoID redirect; Express is the confidential client that exchanges the authorization code, validates the ID token, and issues its own HttpOnly session cookie — the frontend never sees NamoID tokens directly. A room is strictly two-party: whoever creates it is the requester; whoever later submits the correct access code is
bound as the owner. Every document category (DocumentRequest) can have one DocumentGrant, storing the file as a MongoDB Buffer with its own expiry and revocation timestamp, avoiding a filesystem/cloud-storage dependency for these mock files. Every state-changing action writes an AuditEvent, which both powers the UI timeline and is emitted through Winston for logging.

## Security and privacy
Secrets (NamoID Client Secret, session signing key, DB URI) live only in `.env`, gitignored; `.env.example` holds fake placeholders. Sessions are
HttpOnly, signed JWTs — never exposed to client-side JS. The access code is bcrypt-hashed at rest, rate-limited (5 attempts/15 min) against guessing, and single-use once a room is claimed. Access control never relies on ID obscurity alone: every room/grant/file route re-checks session + room participancy + expiry + revocation on every request, regardless of whether the requester knows a valid-looking ID. Logs and audit events record only event type, room ID, and actor ID — never file bytes, filenames-as-secrets, or download URLs. Known gap: uploaded file `mimetype` is trusted as reported by the browser and served back verbatim on download without magic-byte verification — acceptable for mock demo files, not for production.

## Testing
Jest + Supertest against an in-memory MongoDB instance. Prioritized exactly what the PS calls out: unauthorized access (an authenticated user who isn't a room participant is blocked) and expired/revoked access (a genuine participant is still blocked once a grant expires or is revoked) — since these are the two edge cases most likely to be silently broken by a small logic slip, and are explicitly named as required in the submission checklist.

## With another hour
Deploy to Render (backend) and Vercel (frontend) with a separate Live NamoID application and its own registered callback URL; add magic-byte file-type validation on upload; surface the room-level claim-expiry countdown in the UI; add an end-to-end test covering the full claim → upload → revoke flow in one pass rather than isolated unit tests.