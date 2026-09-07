# Engineering decisions

## Scope

Completed within the 6-hour timebox: full NamoID Hosted Auth integration (OIDC, Authorization
Code + PKCE, server-side token exchange), room creation with per-category document requests,
access-code-based owner claiming (not email-gating — chosen because the requester often doesn't
know the owner's account email in advance), file upload/view/download/revoke, a sanitized audit
timeline, and automated tests for unauthorized and expired/revoked access.

Left out: magic-byte file-type validation, and a dedicated bulk/multi-owner collection flow
(explicitly out of scope — see "Where this could go next" in the problem statement itself).

## Architecture

Confidential backend-for-frontend pattern: React (Vite) frontend only starts the NamoID redirect;
Express is the confidential OAuth client that exchanges the authorization code, validates the ID
token server-side (via `openid-client`, since NamoID's flow is standard OIDC), and issues its own
HttpOnly JWT session cookie. NamoID's own tokens never reach the browser.

Data flow: Requester creates a Room (MongoDB) with a bcrypt-hashed access code and a short claim
window. The room link + code are shared out-of-band (e.g. WhatsApp), mirroring the existing
workflow this app replaces. Any authenticated NamoID user can open the link, but only the first
person to submit the correct code is bound as the room's owner — permanently, and the code is
spent on use. Every subsequent access check re-verifies session + room participancy + grant
expiry/revocation on every request; nothing is cached as "already authorized."

Document bytes are stored directly in MongoDB (`Buffer`, `select: false` by default) rather than
external storage — files are small, fictional/mock documents, and this avoids a dependency on
persistent disk, which Render's free tier doesn't guarantee across deploys.

## Security and privacy

Secrets (NamoID client secret, session signing key, Mongo URI) live only in environment variables,
never committed. The session cookie is HttpOnly, `secure` and `sameSite: none` in production.
Access codes are hashed with bcrypt, never stored or logged in plaintext, and the claim endpoint is
rate-limited (5 attempts / 15 min) to resist brute-forcing the code. Room and grant IDs exposed in
URLs are randomly generated UUIDs, not sequential Mongo IDs — though the actual enforcement is
always the session + participant check, not ID secrecy. Denial responses (wrong code, no access)
are deliberately generic and identical regardless of the real reason, to avoid confirming whether a
room/code exists. Audit logs (Winston + a MongoDB `AuditEvent` collection) record event type, room,
and actor only — never file contents, the access code, or a grant's download URL.

Before production: validate uploaded file bytes against their declared MIME type (currently
trusted as reported by the browser); move the in-memory OIDC `state`/PKCE verifier store to Redis
or the database for multi-instance deployments; replace the frontend's error-message string
matching for 401s with a proper status-code check.

## Testing

Automated tests (Jest + Supertest + `mongodb-memory-server`) cover exactly what the challenge
explicitly requires: unauthorized access (an authenticated user who isn't a room participant is
blocked from viewing a valid grant) and expired/revoked access (a genuine participant is still
blocked once a grant's expiry has passed or it's been revoked). These were prioritized over broader
coverage because they directly validate the core security guarantee the entire problem statement is
about — that a URL or a valid session alone is never sufficient for access.

## With another hour

Add magic-byte file validation on upload, replace the generic frontend auth-error handling with
explicit HTTP status checks instead of string matching, and build a frontend form for the room-edit
endpoint that already exists server-side.