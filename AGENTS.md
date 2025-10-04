# Repository Guidelines

## Project Structure & Module Organization
Frontend lives in `src/`, with feature code under `components/`, `pages/`, `routes/`, `services/`, and support utilities in `config/` + `lib/`; the `@/` alias resolves here. Shared types remain in `shared-types/`, static assets in `public/`. Express + Knex backend code sits in `backend/src/`, migrations in `backend/migrations/`, and operational SQL scripts (e.g., `production-migration.sql`) at the repo root.

## Build, Test, and Development Commands
- `npm install && npm run dev` – start the Vite frontend on port 5173.
- `cd backend && npm install && npm run dev` – run the API with Nodemon on 5001; ensure `backend/.env` is populated.
- `npm run build` / `cd backend && npm run build` – output production bundles to each `dist/`.
- `npm run lint` – apply the ESLint + TypeScript ruleset.
- `npm run test`, `test:coverage`, `test:ui` – run Vitest unit, coverage, or component suites.
- `cd backend && npm run test` or `test:coverage` – execute Jest + Supertest checks.
- `npx playwright test` – trigger browser e2e runs after both services are up.

## Coding Style & Naming Conventions
Use TypeScript functional React components, two-space indentation, PascalCase files for components, and camelCase helpers/hooks; keep directories kebab-case. Style UI with Tailwind utilities from `tailwind.config.js` and avoid ad-hoc CSS. Autofix lint issues with `npm run lint -- --fix` when needed.

## Testing Guidelines
Frontend specs live beside sources as `*.test.ts(x)` and rely on Vitest + Testing Library. Backend modules mirror `.spec.ts` files within `backend/src/`. End-to-end Playwright suites live in `tests/e2e/` and follow the `*.e2e.ts` suffix. Run both frontend and backend `test:coverage` targets for risky changes and mention any intentional gaps in PRs.

## Commit & Pull Request Guidelines
Write focused, imperative commits (e.g., “Add scoring threshold guard”) and squash noisy WIP history. Pull requests should summarise changes, link issues, list executed tests, and attach screenshots or logs for behavior shifts. Flag database or infrastructure impacts whenever touching `backend/migrations/` or root SQL utilities and coordinate rollout.

## Security & Configuration Tips
Keep secrets in local env files (`.env`, `backend/env.txt`) and out of version control. Consult `SECURITY_SETUP_GUIDE.md` before altering auth, monitoring, or rate limits. Capture a schema snapshot with `backend/check-db-state.js` before applying migrations, and review Mailgun or Sentry changes against their setup guides.
