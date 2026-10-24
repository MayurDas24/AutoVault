# AutoVault — Car Dealership Inventory System

AutoVault is a full-stack inventory management app for a car dealership. It brings vehicle stock, pricing, purchases and basic administration into one place, with a dashboard for a quick view of the current inventory.

This project was built in small milestones, with a focus on keeping the backend structured, validating requests, and checking behaviour with automated tests as the features were added.

## What it can do

- **Dashboard:** View total vehicle count, inventory value, low-stock and out-of-stock counts, and recently added vehicles.
- **Inventory:** Browse the catalogue, search vehicles, and open an individual vehicle's details.
- **Purchases and stock:** Purchase an available vehicle and reflect the change in stock.
- **Administration:** Add, edit, restock and remove vehicles through admin-only operations.
- **Accounts and access:** Register and sign in, use token-based authentication, and restrict administration features to users with the appropriate role.
- **API safeguards:** Validate incoming data, return structured errors, and apply standard security middleware.

The dashboard values are calculated from the inventory stored by the backend; they are not hard-coded demo statistics.

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Routing and data fetching | React Router, TanStack Query |
| Backend | Node.js, TypeScript, Express 5 |
| Database | PostgreSQL 16, Prisma 6 |
| Validation and security | Zod, bcrypt, JWT, Helmet, CORS |
| Testing | Vitest, Supertest, Testing Library |

## Project layout

```text
.
├── backend/       # Express API, Prisma schema and migrations, backend tests
├── frontend/      # React application and frontend tests
├── docs/          # Test notes and available AI conversation records
├── docker-compose.yml
├── PROMPTS.md     # AI-assisted development notes and source-record links
└── README.md
```

## Run it locally

### Prerequisites

- Node.js 24 and npm
- Docker Desktop (or a local PostgreSQL instance compatible with the configured connection string)

### 1. Install dependencies

From the repository root:

```powershell
cd backend
npm ci
cd ..\frontend
npm ci
cd ..
```

### 2. Configure environment variables

Create local environment files from the examples if they do not already exist. Keep your existing local configuration if it is already working.

PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
```

Set a private JWT secret in `backend/.env` (at least 32 characters). You can generate a random value with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Check that `DATABASE_URL` matches your local PostgreSQL setup. The supplied Docker Compose configuration exposes PostgreSQL on port `5433`. Do not commit `.env` or `.env.local` files, and do not reuse the example credentials in a deployed environment.

The frontend API base URL is configured through `VITE_API_URL`, normally:

```env
VITE_API_URL=http://127.0.0.1:5000
```

The backend uses `FRONTEND_URL` for the configured frontend origin. During local development, Vite may choose port `5174` if `5173` is already in use. Make sure the backend CORS configuration allows the origin printed by Vite.

### 3. Start the database

From the repository root:

```powershell
docker compose up -d postgres
docker compose ps
```

This starts the PostgreSQL service without removing its data volume. Avoid `docker compose down -v` and `prisma migrate reset` unless you intentionally want to destroy local database data.

### 4. Prepare and start the backend

In a terminal:

```powershell
cd backend
npx prisma generate
npx prisma validate
npx prisma migrate status
npm run dev
```

If this is a new database and committed migrations are pending, review the migration status and then apply them with `npx prisma migrate deploy`. Do not reset the database to fix a migration issue.

By default, the API listens at `http://127.0.0.1:5000`. You can check that the server is responding at:

```text
GET http://127.0.0.1:5000/health
```

A successful response is:

```json
{ "status": "ok" }
```

This endpoint confirms the API process is responding; it is not a full database-readiness check.

### 5. Start the frontend

Open another terminal:

```powershell
cd frontend
npm run dev
```

Open the local URL printed by Vite (often `http://localhost:5173`, or `http://localhost:5174` if the default port is busy).

## API overview

All vehicle routes require a valid authenticated session/token. Administrative changes require an administrator role.

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Create an account | Public |
| POST | `/api/auth/login` | Sign in and receive authentication | Public |
| GET | `/api/auth/me` | Get the current authenticated user | Authenticated |
| GET | `/api/vehicles` | List vehicles | Authenticated |
| GET | `/api/vehicles/search` | Search/filter vehicles | Authenticated |
| GET | `/api/vehicles/:id` | Get vehicle details | Authenticated |
| POST | `/api/vehicles/:id/purchase` | Purchase a vehicle and update stock | Authenticated |
| POST | `/api/vehicles` | Create a vehicle | Administrator |
| PUT | `/api/vehicles/:id` | Update a vehicle | Administrator |
| POST | `/api/vehicles/:id/restock` | Restock a vehicle | Administrator |
| DELETE | `/api/vehicles/:id` | Remove a vehicle | Administrator |
| GET | `/health` | Check API process health | Public |

The API returns structured error responses for invalid requests and failed operations. For exact request fields and response shapes, use the route/controller validation in `backend/src/modules` as the source of truth.

## Tests and quality checks

Run the backend checks from `backend`:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Run the frontend checks from `frontend`:

```powershell
npm test
npm run lint
npm run build
```

The frontend build runs TypeScript project checks before creating the production bundle. Backend integration tests use the configured PostgreSQL database, so make sure the database is running and `DATABASE_URL` is correct.

See [docs/test-report.md](docs/test-report.md) for the recorded test-driven development history and verification notes. That report includes earlier milestone results; rerun the commands above to verify the current checkout after making changes.

## AI-assisted development

AI tools were used as development assistants for repository inspection, planning small milestones, drafting tests and implementation changes, debugging failures, and improving documentation. The project was still checked locally as it was built; a generated suggestion was not treated as proof that a feature or test worked.

The original conversation export is linked from [PROMPTS.md](PROMPTS.md) and stored in [docs/ai-conversation.jsonl](docs/ai-conversation.jsonl). These records represent the available export, not every conversation that may have happened. No missing conversations or personal reflections are invented here.

Before submitting, add a short reflection in your own words about what you learned, what you changed after testing, and what you would improve next. Make sure the final test report matches the results from your current machine.

## Current scope and possible next improvements

The app supports the main local dealership workflows described above. Before using it with real customer or business data, review deployment configuration, rotate all development secrets, configure trusted production origins, and perform a separate security review. Additional improvements could include rate limiting, stronger concurrent-purchase tests, CI automation, and deployment documentation if these are required by the assignment.

---

Built as the Incubyte Car Dealership Inventory System assignment.
