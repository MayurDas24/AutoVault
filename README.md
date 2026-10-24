# Incubyte Car Dealership Inventory System

A TDD implementation of the supplied car dealership assignment. Work is deliberately split into small milestones. The frontend is still the original React/Vite starter; vehicles, JWT login, authorization and inventory are not implemented yet.

## Stack and local setup

- Backend: Node.js, strict TypeScript, Express 5, PostgreSQL 16, Prisma 6, Zod and bcrypt. JWT login is the next milestone.
- Testing: Vitest and Supertest, including real PostgreSQL integration tests.
- Frontend: React, TypeScript and Vite. Tailwind is installed but not connected yet.

Use Node.js 24 and npm. Install each package separately (`npm ci` inside `backend` and `frontend`). The backend compiler is TypeScript 6.0, matching the frontend's version line and the supported range of TypeScript ESLint.

The existing Docker Compose service exposes PostgreSQL at `localhost:5433`, with the named `incubyte_postgres_data` volume. Keep an existing `backend/.env` intact. For a new checkout only, copy `backend/.env.example` to `backend/.env` and replace the JWT secret with a random value of at least 32 characters. Generate one using `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Compose credentials are for local development only.

From the repository root, `docker compose up -d postgres` starts the existing database service without deleting its volume. Inside `backend`:

```sh
npx prisma generate
npx prisma validate
npx prisma migrate status
# For a new database or pending committed migrations only:
npx prisma migrate deploy
npm run dev
```

The API binds to `http://127.0.0.1:5000` by default. `GET /health` is a process health check, not a database readiness check. `FRONTEND_URL` controls the browser origin allowed by CORS. The app factory has no network listener; `server.ts` owns startup and shutdown.

Inside `frontend`, `npm run dev` starts the existing Vite starter. It is not yet a dealership interface. Production commands are `npm run build` in each package, followed by `npm start` in `backend` or `npm run preview` in `frontend`.

## Registration API

`POST /api/auth/register` accepts an `application/json` object with `name`, `email`, and `password`. The name is trimmed (1–100 characters); email is trimmed, lowercased and validated (at most 254 characters). Passwords require at least 12 characters and at most 72 UTF-8 bytes, with no NUL characters; whitespace is preserved. Additional fields, including `role`, are rejected.

A successful request returns HTTP 201 and `{ "user": { "id": "...", "name": "...", "email": "...", "role": "USER" } }`. Passwords are hashed with bcrypt cost 12 and never returned. Duplicate normalized email returns 409. Other documented statuses are 400 for invalid input, 413 for oversized JSON, 415 for unsupported content, and a sanitized 500 for unexpected failures. Errors use `{ "error": { "code": "...", "message": "..." } }`. This endpoint does not issue a login token yet.

New registrations normalize email before the database unique constraint is applied. Existing mixed-case records, if introduced externally, are not migrated or rewritten. Cross-transaction concurrency tests and request-rate limiting are pending; the current tests verify unique-constraint error handling, not parallel transactions. Complete the next authentication milestone before treating this as a deployable service.

## Verification

Inside `backend`, run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. The build emits application code to `dist/src` without compiling test code into production output. Integration tests require the configured PostgreSQL service; each database test runs in a transaction that is always rolled back. There are no truncates, migration resets, or deletes of existing records.

The Vitest configuration explicitly excludes empty future-feature test scaffolds. These are unfinished work, not passing tests. Remove the corresponding exclusion when implementing each scaffold. Frontend test infrastructure and tests remain a later milestone; its current `npm test` exits with code 1 because there are no tests.

See [the executed test report](docs/test-report.md) for Red/Green results, command failures and remaining limitations. Do not use `prisma migrate reset` or `docker compose down -v` against the existing development setup.

## My AI Usage

Codex was used to inspect the repository and assignment, identify incomplete configuration, write tests before implementation, implement Express startup, centralized error handling and registration, and run the checks recorded in the test report. A parallel Codex agent independently reviewed database test isolation, contributed registration tests, and reviewed the implementation. AI contributions are identified in Git commit trailers.

Observed workflow impact: the first test runs exposed empty scaffolds; package installation exposed an incompatible TypeScript/linter version combination; strict error-type assertions caught an incorrect URL validator before the infrastructure milestone was accepted. This is a factual contribution record written by Codex, not a claim of manual author review or the author's personal reflection. The author should add their own reflection before final submission.

[PROMPTS.md](PROMPTS.md) links to actual exported conversation records, not reconstructed transcripts. Earlier AI conversations, if any, have not been supplied and are not invented. Final application screenshots and deployment/public repository links are pending. Nothing is published or deployed by this milestone.
