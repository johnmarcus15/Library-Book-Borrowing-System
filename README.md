# Library Book Borrowing Management System

Full Stack Development project, Easwari Engineering College, Department of CSE.  
Stack: React + Vite, Node.js + Express, MongoDB + Mongoose, JWT in an HTTP-only cookie.

---

## ⚡ Quick Deploy to Vercel (Live Demo)

This project is configured as a full-stack monorepo ready for instant deployment on [Vercel](https://vercel.com). Both the React Vite frontend and Express serverless backend deploy under a single project with zero CORS issues and full cookie-based authentication support.

### Step 1: Push Code to GitHub
```powershell
git init
git add .
git commit -m "Migrate to Vercel deployment version"
git branch -M main
git remote add origin https://github.com/johnmarcus15/Library-Book-Borrowing-System.git
git push -u origin main
```

### Step 2: Set up a Free Cloud Database (MongoDB Atlas)
1. Sign up for free at [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a free **M0 cluster**.
3. Under **Database Access**, create a user with a password (e.g., `admin`).
4. Under **Network Access**, click **Add IP Address** -> select **Allow Access from Anywhere** (`0.0.0.0/0`) so Vercel's serverless functions can connect.
5. Click **Connect** -> **Drivers** -> Copy your connection string:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/library?retryWrites=true&w=majority`

### Step 3: Deploy on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... -> Project**.
2. Select your repository: `johnmarcus15/Library-Book-Borrowing-System`.
3. In the **Environment Variables** section, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (from Step 2).
   - `JWT_SECRET`: A 32+ character random string (e.g. `f983a54b830d9396e95c10ad8bc9d2e4682051db5e3ea1e0b503ab4e9185a73d`).
   - `NODE_ENV`: `production`
4. Click **Deploy**!
5. Within 1-2 minutes, Vercel gives you your live demo link: `https://<your-project>.vercel.app`.

### Step 4: Initialize Demo Data (One-Click)
Once deployed:
- Visit your live URL and navigate to **Book Catalogue** -> Click **Initialize Demo Catalog (22 Books)**.
- Or visit: `https://<your-project>.vercel.app/api/seed`.
- Demo Logins:
  - **Admin**: `admin@example.com` / `AdminStrongPass#2026`
  - **Member**: `member1@example.com` / `DevOnly#12345` (or click the quick demo buttons on the Login page).

---

```
library-book-borrowing-system/
  api/      Vercel serverless function entrypoint (index.js)
  client/   React app (pages, layouts, components, context, hooks, services, utils)
  server/   Express API (config, models, controllers, services, middleware, routes, scripts, tests)
  vercel.json Vercel monorepo routing & configuration
```

## 1. Prerequisites
- Node.js 18+ (LTS 20 recommended) and npm: https://nodejs.org
- A MongoDB database: **Atlas (cloud)** or **local MongoDB**
- Check versions: `node -v` and `npm -v`

## 2. Database
**Option A: MongoDB Atlas**
1. Create a free cluster at https://cloud.mongodb.com.
2. Database Access: create a user with a password. Network Access: add your IP.
3. Connect > Drivers > copy the URI, e.g. `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/library`.
   Atlas is a replica set, so transactions work: set `USE_TRANSACTIONS=true`.

**Option B: local MongoDB**: install MongoDB Community, then use `mongodb://127.0.0.1:27017/library`.
A standalone local server has **no transactions**, so keep `USE_TRANSACTIONS=false` (see section 8).

## 3. Configure environment (PowerShell)
```powershell
cd server;  Copy-Item .env.example .env; cd ..
cd client;  Copy-Item .env.example .env; cd ..
```
Edit `server/.env`: set `MONGODB_URI`, and a long random `JWT_SECRET`, e.g.
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
Never commit `.env` files. `client/.env` can stay empty in development (Vite proxies `/api` to port 5000).

## 4. Install, seed, create admin
```powershell
cd server; npm install
npm run seed            # 10 books, 3 dev members, sample borrowings (safe to re-run for books/members)
```
Set `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ chars) in `server/.env`, then:
```powershell
npm run admin:create
cd ..\client; npm install
```
Seeded dev members: `member1@example.com` to `member3@example.com`, password `DevOnly#12345` (override with `SEED_PASSWORD`).
**Development only.** The seed script refuses to run when `NODE_ENV=production`.

## 5. Run
Two terminals:
```powershell
cd server; npm run dev     # API on http://localhost:5000
cd client; npm run dev     # site on http://localhost:5173
```
Open http://localhost:5173. Log in as a member, or as the admin you created (redirected to `/admin`).

## 6. Tests
```powershell
cd server
npm test -- tests/fine.test.js      # unit tests, no database needed
$env:MONGODB_URI_TEST="mongodb://127.0.0.1:27017/library_test"; npm test   # all tests
```
The integration tests **need MongoDB and a separate test database**. The name must contain `test`, otherwise the suite refuses to run because it deletes all users, books and borrowings. They cover registration, login, authorization, book validation, borrowing, limits, concurrency, returns, fines and privacy checks.

## 7. API summary
| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `login`, `logout`; `GET /api/auth/me` |
| Books | `GET /api/books` (q, category, available, sort, page, limit), `GET /api/books/categories`, `GET /api/books/:id`; admin: `POST`, `PUT /:id`, `DELETE /:id` |
| Borrowings | `POST /api/borrowings`, `GET /my`, `GET /:id`, `POST /:id/return` (owner or admin) |
| Admin (ADMIN only) | `GET /api/admin/dashboard`, `users`, `users/:id`; `PATCH users/:id/status`; `GET/POST borrowings`; `GET reports` |
All responses look like `{ success, data, pagination? }` or `{ success:false, message, details? }`.

## 8. Design notes
**Schema.** `Borrowing.user` and `Borrowing.book` reference `User` and `Book`. Copy counts live on `Book` (`totalCopies`, `availableCopies`).
**Indexes.** `User.email` and `studentId` unique; `Book.isbn` unique (sparse); `Book` text index on title/author and one on category; `Borrowing` unique partial index on `(user, book)` where status is `BORROWED` (one active loan per title, even under races); index on `(status, dueDate)` for overdue queries.
**Rules** (central config in `server/.env`): `LOAN_DAYS=14`, `MAX_ACTIVE_BORROWINGS=5`, `FINE_PER_DAY=5`.
Fine = started overdue days x rate. None on or before the due date. It grows for unreturned books and **stops at the return date**. Fines are displayed only; no payment gateway.
**Concurrency.** Copies are taken with an atomic conditional update (`availableCopies > 0`), so they cannot be over-allocated, and a return only succeeds while status is `BORROWED`. With `USE_TRANSACTIONS=true` the steps also run in a MongoDB transaction (needs Atlas or a local replica set). With it `false` the code compensates manually; a server crash between two steps could leave counts off by one.
**Security.** bcrypt (cost 12); JWT in an HTTP-only, `SameSite=Strict` cookie (`Secure` in production), so scripts cannot read the token and cross-site requests do not carry it, which is the CSRF protection used. Trade-off: the client and API must be same-site (the Vite proxy or one parent domain). Also: helmet, CORS limited to `CLIENT_URL`, rate limiting on auth, validation, string-only query values, user/role/fine values always derived on the server. Use HTTPS in production.

## 9. Common errors
| Problem | Fix |
|---|---|
| `Missing env var MONGODB_URI` | Create `server/.env` from `.env.example` |
| `MongoDB connection failed` / `ECONNREFUSED` | Start local MongoDB, or check the Atlas URI, password (URL-encode special characters) and IP allow-list |
| `Transaction numbers are only allowed on a replica set` | Set `USE_TRANSACTIONS=false` for standalone MongoDB |
| Login works but you are logged out on refresh | Use the Vite dev server (proxy) or make client and API same-site; check `CLIENT_URL` |
| `Set MONGODB_URI_TEST ...` | Point it at a database named like `library_test` |
| Port 5000 or 5173 in use | Change `PORT` in `server/.env` (and the proxy target in `client/vite.config.js`) |

## 10. Known limitations
Admin dropdowns load only the first 100 members / 50 available books. Archived books cannot be restored from the UI. No online fine payment. Login cookie sessions need a same-site deployment.
