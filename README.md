# AI Capsule

A private prompt library. Users sign in with GitHub, and can create, view, update and delete their own saved AI prompt records through a protected dashboard.

**Live deployed URL:** https://ai-capsule-4pxq.onrender.com
**Cloud platform:** Render (free-tier Web Service)

---

## Installation & Run Instructions

### Prerequisites
- Node.js (v18+ recommended)
- A GitHub account (for OAuth login)

### 1. Clone the repository
```bash
git clone https://github.com/22026106/ai-capsule.git
cd ai-capsule
```

### 2. Install dependencies
```bash
npm install --prefix client
npm install --prefix server
```

### 3. Set up environment variables
Create a file at `server/.env` with the following (see [Environment Variables](#environment-variables) below for what each one does):
```
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
JWT_SECRET=your_own_long_random_string
CALLBACK_URL=http://localhost:3000/auth/github/callback
```

### 4. Build the React frontend
```bash
npm run build --prefix client
```
This produces `client/dist/`, which the Express server serves as static files.

### 5. Start the server
```bash
node server/index.js
```
Visit `http://localhost:3000`.

---

## API Routes & Frontend–Backend Communication

The React frontend and Express backend are served from the **same origin** (both locally and in production) — Express serves the built React files as static assets, and also exposes the API under `/api` and OAuth under `/auth`. This means the frontend can call the API with plain relative fetches (`fetch('/api/capsules')`) with no CORS configuration needed.

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page, explains AI Capsule, login link |
| `/login` (via `/auth/github`) | Public | Starts GitHub OAuth login |
| `/dashboard` | Protected | Shows the authenticated user's capsule records |
| `/api/health` | Public | Returns `{ "status": "ok" }` |
| `GET /api/capsules` | Protected | Read the authenticated user's own records |
| `POST /api/capsules` | Protected | Create a new record |
| `PUT /api/capsules/:id` | Protected | Update an existing record (only if owned by the user) |
| `DELETE /api/capsules/:id` | Protected | Delete a record (only if owned by the user) |
| `GET /auth/github` | Public | Redirects to GitHub's OAuth authorize page |
| `GET /auth/github/callback` | Public | GitHub redirects here after login; issues the app JWT |

All frontend requests to `/api/*` routes use `fetch(..., { credentials: 'include' })` so the browser attaches the `token` cookie automatically.

---

## OAuth & JWT Implementation

- **Provider used:** GitHub OAuth.
- **Flow:** The user clicks "Log in with GitHub," which sends them to `/auth/github`. This redirects to GitHub's authorization page. After the user approves, GitHub redirects back to `/auth/github/callback` with a temporary code. The server exchanges that code for a GitHub access token, uses it to fetch the user's GitHub profile (id and username), and then **signs its own JWT** using `jsonwebtoken`, containing the GitHub user id.
- **Storage:** The JWT is stored in a cookie named `token`, set with `httpOnly: true` (inaccessible to frontend JavaScript), `secure: true` in production, and `sameSite: 'lax'`. It is **not** stored in `localStorage` and no `Authorization: Bearer` header is used, per the assignment requirement.
- **Verification:** All `/api/capsules` routes are protected by a `requireAuth` Express middleware. It reads the `token` cookie, verifies it with `jsonwebtoken.verify()` against `JWT_SECRET`, and rejects the request with `401 Unauthorized` if the cookie is missing, invalid, tampered with, or expired. On success, the decoded `user_id` is attached to `req.user` and used for all database operations — it is never accepted from the request body.

---

## Environment Variables

Set as environment variables in the deployment platform (or in a local, gitignored `server/.env` file). **No values are included here.**

| Variable | Purpose |
|---|---|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `JWT_SECRET` | Secret key used to sign/verify the application's JWTs |
| `CALLBACK_URL` | The full OAuth callback URL (differs between local dev and the deployed URL) |
| `NODE_ENV` | Set to `production` on Render; used to enable `secure` cookies |
| `PORT` | Set automatically by Render at runtime; the app falls back to `3000` locally |

---

## Database & Ownership

- **Engine:** SQLite (via the `sqlite`/`sqlite3` npm packages).
- **Schema:** A single `capsules` table (see `server/db.js`), matching the structure specified in the assignment brief, with a `user_id` column storing the authenticated user's GitHub id.
- **Ownership:** Every `GET`, `PUT`, and `DELETE` query filters by `user_id`, using the id extracted from the **verified JWT** — never from the request body or URL. `POST` always inserts the authenticated user's id as the owner. This ensures a user can never read, edit, or delete another user's records, even if they guess a record's `id`.
- **Persistence:** ⚠️ On Render's free tier, the filesystem is **ephemeral** — the SQLite database file is reset whenever the service redeploys or restarts after a period of inactivity. This is a known and accepted limitation of the free tier for this assignment; it is **not** persistent storage. Data created during a session may not survive a redeploy.

---

## Required cURL Security Checks

Run against the deployed API before submission:

**Test 1 — no authentication:**
```bash
curl -i https://ai-capsule-4pxq.onrender.com/api/capsules
```
Result obtained:
```
HTTP/2 401
content-type: application/json; charset=utf-8
{"error":"Unauthorized"}
```

**Test 2 — fake/invalid JWT:**
```bash
curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-4pxq.onrender.com/api/capsules
```
Result obtained:
```
HTTP/2 401
content-type: application/json; charset=utf-8
{"error":"Unauthorized"}
```

Both confirm the backend requires a valid, correctly-signed JWT — not merely the presence of a cookie — before granting access to protected capsule data.

---

## Known Limitation

The SQLite database on Render's free tier is stored on an ephemeral filesystem. Any capsules created will be lost if the service is redeployed or restarts after extended inactivity (Render's free instances spin down after a period of no traffic, and the local disk is reset on restart). For a production system, this would be swapped for Render's managed PostgreSQL or another persistent database service.

---

## AI-Assisted Development

**AI tool used:** Claude (Anthropic), used throughout project setup, writing Express routes and middleware, the JWT/OAuth flow, SQLite queries, the React frontend, and diagnosing cloud deployment errors on Render.

**Problem found and corrected in AI-generated/assisted code:**
During deployment, the `sqlite3` package's native binary (compiled during Render's build step) failed at runtime with a `GLIBC` version mismatch (`ERR_DLOPEN_FAILED`), because the build environment and the runtime environment on Render's free tier don't share identical system libraries. This was fixed by adding `npm rebuild sqlite3 --build-from-source` as part of the **build** command (initially it was placed in the start command, which caused deploys to fail a different way — the rebuild took too long and Render's port-detection timed out before the server ever started listening).

**How OAuth login, JWT verification, and protected API behaviour were verified:**
Verified locally and then again against the deployed URL using `curl`: confirmed `GET /api/capsules` returns `401` with no cookie and with a fake cookie value, then confirmed a real cookie obtained via a genuine GitHub login returns `200` with the correct data. All four CRUD operations (`POST`, `GET`, `PUT`, `DELETE`) were also tested directly via `curl` with a real JWT before being tested again through the actual React UI.

**How CRUD behaviour and user data ownership were verified:**
Each route's SQL queries were written to filter/update/delete by `user_id`, matching the id decoded from the verified JWT (`req.user.user_id`), not any value sent by the client. Tested manually by creating, editing, and deleting capsule records both via `curl` and through the deployed browser UI, confirming records persisted correctly and could be modified/removed only when the correct authenticated session was used.

**Implementation/deployment decision made and can explain:**
Chose to serve the React frontend and Express API from a single deployed service (Express serving the built `client/dist` static files, with a catch-all route falling back to `index.html` for client-side routing) rather than deploying frontend and backend separately. This avoids cross-origin cookie and CORS configuration entirely, since the browser sees only one origin — directly following the assignment's recommendation for the simplest deployment path.

---

## Tech Stack Summary

- **Frontend:** React (Vite), React Router
- **Backend:** Node.js, Express 5
- **Database:** SQLite
- **Auth:** GitHub OAuth → application JWT (jsonwebtoken) in an HttpOnly cookie
- **Deployment:** Render (free-tier Web Service)
