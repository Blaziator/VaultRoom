# VaultRoom

**[Powered by NamoID](https://namoid.in)** ·
[NamoID documentation](https://docs.namoid.in) ·
[Challenge catalog](https://challenges.namoid.in)

> Built on the NamoID identity platform for the **NamoID Community Challenges** program.

This repository is a contributor-owned response to the
`safer-document-room` problem statement. It was created from the official
[NamoID challenge template](https://github.com/namoidhq/namoid-challenge-template).

This project is an independent community build. It is not an official
NamoID product, security recommendation, or endorsement.

## NamoID integration

VaultRoom registers a **Web application (confidential client)** in a NamoID Test environment.
Authentication uses the standard OIDC Authorization Code flow with PKCE: the React frontend starts
the flow via a direct navigation to the Express backend's `/auth/login`, which redirects to
NamoID's hosted sign-in page. NamoID redirects back to the registered callback,
`/auth/callback`, on the Express server (not the frontend) — the backend exchanges the code,
validates the signed ID token, and issues its own HttpOnly, `sameSite`/`secure`-aware session
cookie to the browser. NamoID's own tokens never reach client-side JavaScript.

User journey: a requester signs in and creates a room with document categories and reasons. They
share the room link plus a separately-generated access code with the document owner over their
existing channel (e.g. WhatsApp). The owner signs in via the same NamoID flow — including signing
up on the spot if they've never used the app before — then enters the access code to claim the
room, after which they can upload mock documents with an expiry date. The requester can then view
or download those documents until the owner revokes access or the expiry passes.

## Community project metadata

- **Challenge ID:** `safer-document-room`
- **Contributor:** Bhavya Kumawat
- **Live demo:** [VaultRoom](https://vault-room-seven.vercel.app/)
- **Final commit:** 6794447812a01fe8da61bae57aeb02de2c8a7dcf
- **Time spent:** 6 hours
- **License:** MIT

## Start here

1. Create your repository using **[Use this template](https://github.com/namoidhq/namoid-challenge-template/generate)**.
2. In the new repository, run:

```bash
npm run setup -- --challenge=safer-document-room --name="Your Name" --title="Your Project" --repo=https://github.com/you/project
npm run check
```

Replace `safer-document-room` with the ID shown in the selected problem statement.
Setup removes
the remaining template placeholders and records machine-readable attribution in
[`namoid-challenge.json`](./namoid-challenge.json).

3. [Create an application in the NamoID Console](https://console.namoid.in/login).
4. Configure its callback URL and integrate NamoID Hosted Auth into your POC.
5. Build, test, deploy, and submit the pinned commit.

## Run locally

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```
Requires `.env` files in both `server/` and `client/` — see `.env.example`.

The client runs at `http://localhost:5173`, the server at `http://localhost:3000`.

## What works

Full NamoID Hosted Auth integration (sign-in and sign-up); room creation with per-category document
requests; access-code-based owner claiming with rate-limiting against guessing; file upload, inline
view, download, and revocation; expiry enforcement on every access, not just at render time; a
sanitized activity timeline; automated tests for unauthorized and expired/revoked access.

## Known limitations

Editing a room's request definition before it's claimed is supported by the backend but has no
frontend form yet. Uploaded file MIME types are trusted as reported by the browser, not verified
against actual file content. The OIDC login state is held in server memory, which is fine for a
single instance but wouldn't scale horizontally without moving it to Redis or the database.

## AI and external resources

Claude (Anthropic) was used throughout for architecture discussion and ChatGPT was used for CSS.

## NamoID attribution

Keep the factual challenge attribution in this README,
`namoid-challenge.json`, and the deployed page. You may change the surrounding
design and implementation. Attribution must not imply that NamoID authored,
audited, or endorses your solution.

## Submit to the catalog

Commit and push the exact version you want reviewed, then copy its full SHA:

```bash
git push
git rev-parse HEAD
```

Open the [Submit a community build](https://github.com/namoidhq/namoid-challenges/issues/new?template=community-build.yml)
form and paste the 40-character SHA into **Pinned commit SHA**. This identifies
one immutable version even if you continue changing the repository later. You
can request a catalog update or removal later.
