# Executed verification report

Date: 24 October 2026 (Asia/Calcutta). This report records observed command results, not assumed success.

## Initial inspection and baseline

- Prisma `validate`: succeeded; schema valid.
- Prisma `migrate status`: succeeded; one migration, database up to date at `localhost:5433/incubyte_dealership`.
- `git log -5 --oneline`: failed because the initialized repository had no commits.
- Backend `vitest run`: failed, six empty test suites and no tests.
- Backend `tsc --noEmit`: exited 0 with empty source/test placeholders.
- Backend `eslint .`: failed, no ESLint configuration.
- Frontend `vitest run`: exited 1, no test files.
- Frontend `tsc -b`, `eslint .`, `vite build`: completed successfully; Vite built 20 modules.
- Node: v24.19.0. npm was absent from the sandbox PATH; invoking the installed `C:\Program Files\nodejs\npm.cmd` required approval after sandbox access denial and reported npm 10.9.2.

## Checkpoint 1: Express/testing infrastructure

Changed: root `.gitignore`, sanitized `backend/.env.example`, backend package/lock/config files, `src/app.ts`, `src/server.ts`, `src/config/{env,database}.ts`, `src/shared/errors.ts`, `src/middleware/errorHandler.ts`, and `tests/integration/app.test.ts`.

1. Added tests before implementation. Initial run failed six tests; seven negative validator tests passed for the wrong reason (missing function threw). Strengthened those assertions to require `ZodError`.
2. Red: `vitest run tests/integration/app.test.ts` exited 1, **13 failed**, before any app/environment implementation. Commit: `fecccae`.
3. First implementation run: **11 passed, 2 failed**. Invalid URL refinements threw `TypeError` instead of a Zod validation error. Corrected the refinement.
4. Green: `vitest run` exited 0, **13 passed**. `tsc --noEmit`, `eslint .`, and `tsc -p tsconfig.build.json` all exited 0. Commit: `d10f2ba`.

The local baseline commit is `221c34a`. Every AI-assisted commit includes the Codex co-author trailer.

## Tooling findings

Installing TypeScript ESLint initially failed with `ERESOLVE`: TypeScript 7.0.2 exceeded the supported peer range (`>=4.8.4 <6.1.0`). `npm view typescript-eslint@latest version peerDependencies --json` confirmed this also applied to 8.72.0. Installing `typescript@~6.0.3`, `typescript-eslint@^8.72.0`, and `@eslint/js@^10.0.1` succeeded. Prisma packages were not upgraded.

`npm audit --json` exited 1 with **three high-severity findings**, all in the development Prisma CLI chain (`prisma` → `@prisma/config` → `deepmerge-ts`). npm's offered remediation upgrades Prisma to 7.10.1, conflicting with the required Prisma 6 stack. No force upgrade or unverified override was applied. This remains unresolved.

## Checkpoint 2: registration through TDD

Changed: `src/modules/auth/auth.{validation,service,controller,routes}.ts`, `src/app.ts`, `src/middleware/errorHandler.ts`, `tests/helpers/testApp.ts`, `tests/integration/auth.test.ts`, and `vitest.config.ts`. The existing schema and migration already supply all required fields and the unique email constraint; no new migration was needed.

1. The initial registration test harness failed during collection because this installed Vitest version does not expose `describe.sequential`. Changed to `describe(..., { concurrent: false }, ...)` before implementing the endpoint.
2. Red: `vitest run tests/integration/auth.test.ts` exited 1, **26 failed, 3 passed**. The failing feature cases returned 404 because registration was absent. Three JSON middleware cases already passed. Commit: `6822f4d`.
3. Green: the same command exited 0, **29 passed**. Typecheck and lint exited 0. Full backend run then passed **42 tests**; typecheck, lint and production build all exited 0. Implementation commit: `6351972`.
4. Refactor: simplified content-type parsing and repeated registration tests: **29 passed**. Commit: `2a345ef`.
5. Review regression Red: three encoded-body tests each observed 500 instead of 415/415/400 (targeted run: **3 failed, 29 skipped**). A separate environment run observed the example JWT secret incorrectly accepted (**1 failed, 13 passed**). Commit: `5403c98`.
6. Fixed unsupported charset/content encoding and corrupt compressed-body responses, and rejected the example secret. Full backend run: **46 passed**; typecheck, lint and production build all exited 0. Commit: `5bb590a`.

The PostgreSQL tests verify persistence and bcrypt cost 12 inside rollback-only transactions, normalized duplicate-email conflicts, strict input validation, rejection of client-supplied roles/IDs/hashes, safe public responses, and sanitized persistence failures. They prove rollback after both success and a deliberately thrown assertion. They do not claim competing-transaction concurrency coverage. No test performs a truncate, record cleanup delete, migration reset, or schema change.

## Final local checks for this milestone

The following commands were invoked from each package using its local `node_modules/.bin/*.cmd` executables. These are the same tools used by the package scripts.

| Package | Actual command | Observed result |
| --- | --- | --- |
| Backend | `vitest.cmd run` | Exit 0; 2 files, **46 tests passed** |
| Backend | `tsc.cmd --noEmit` | Exit 0 |
| Backend | `eslint.cmd .` | Exit 0 |
| Backend | `tsc.cmd -p tsconfig.build.json` | Exit 0 |
| Backend | `prisma.cmd validate` | Exit 0; schema valid |
| Backend | `prisma.cmd migrate status` | Exit 0; one migration, up to date |
| Frontend | `vitest.cmd run` | **Exit 1; no test files** |
| Frontend | `tsc.cmd -b` | Exit 0 |
| Frontend | `eslint.cmd .` | Exit 0 |
| Frontend | `vite.cmd build` | Exit 0; 20 modules built |

A Node smoke script launched the built `dist/src/server.js` on a temporary local port: `/health` returned 200 with the expected JSON, and empty registration returned 400 `VALIDATION_ERROR`. The script exited 0, stopped its child process, and made no registration writes. This verifies built-server startup and routing; it does not claim graceful signal handling was tested on Windows.

SHA-256 comparisons confirm that the working `backend/.env`, Prisma schema, initial migration SQL, and `docker-compose.yml` match their pre-edit contents. The frontend source and configuration were not changed. Dependencies, local environment files and build output are ignored by Git.

Implementation references: [Express 5 async error handling](https://expressjs.com/en/5x/guide/error-handling/), [Prisma 6 rollback semantics](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions), and [bcrypt's UTF-8 byte limit](https://www.npmjs.com/package/bcrypt).

## Current application status

After the earlier backend-focused verification recorded above, the project has continued through authentication, vehicle inventory APIs and the React frontend. The repository now includes the dashboard, inventory views, vehicle details, account screens and administration UI.

Latest local verification reported by the developer:

- Backend health endpoint: `GET http://127.0.0.1:5000/health` returned `{ "status": "ok" }`.
- Frontend: Vite started and the dashboard loaded in the browser.
- Manual workflows: the developer reports that the inventory CRUD operations are working.
- Local browser integration initially exposed a CORS origin mismatch on port `5174`; the local CORS allow-list was adjusted to include the Vite development origins, after which the developer confirmed the application was working.

These are the latest reported manual checks, not a replacement for the command-level results listed earlier in this document. The earlier automated test counts belong to the earlier backend milestone and should not be presented as the current full-stack test count. Re-run the package scripts before final submission and replace or supplement this report with the actual current output.

## Remaining work before submission

- Re-run backend and frontend tests, type checks, linting and production builds on the final checkout, then record their exact results.
- Review authorization tests for both allowed and forbidden user actions.
- Check the current dependency audit and record any unresolved findings without applying an unreviewed major-version upgrade.
- Add screenshots of the working dashboard, inventory and administration flows if the assignment submission benefits from visual evidence.
- Add the developer's own short reflection on what was learned and what could be improved.
- Review environment configuration and confirm no real credentials, passwords or tokens are committed.

Do not use `prisma migrate reset` or `docker compose down -v` against a database that contains data you want to keep. The application has not been described here as deployed to production.
