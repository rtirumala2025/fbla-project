# Testing & CI/CD Guide

## Unit Tests & Coverage

- Backend unit tests focus on service helpers and run with `pytest tests/unit`.  
- Coverage threshold is enforced at 85% (current run: ~99%) and reported to `coverage.xml`/`htmlcov/`.  
- Coverage config intentionally targets the unit test suite so it can execute without a database or external services.
- Command summary:
  ```bash
  python -m pip install -r requirements.txt
  pytest tests/unit
  ```

## Playwright End-to-End Tests

- Specs live in `e2e/*.spec.ts` and cover auth, pet interactions, mini-games, finance, and AI flows.
- Tests are skipped by default; enable with environment variables:
  ```bash
  export E2E_ENABLED=true
  export E2E_BASE_URL=http://localhost:3000
  export TEST_USER_EMAIL=...
  export TEST_USER_PASSWORD=...
  cd frontend && npm install --legacy-peer-deps && cd ..
  npx playwright test
  ```
- Provide real selectors/data attributes in the UI to stabilise the flows.

## Frontend Linting & Build

- ESLint configuration lives in `frontend/.eslintrc.cjs`.
- Install dependencies (`npm install --legacy-peer-deps`) and run:
  ```bash
  cd frontend
  npm run lint
  npm run build
  ```

## GitHub Actions Pipeline

- Workflow file: `.github/workflows/ci.yml`
- Jobs:
  1. **frontend** – npm install, ESLint, React build.
  2. **backend** – pip install, pytest unit suite, uploads coverage artifact.
  3. **playwright** – optional smoke run gated by secrets/env.
  4. **deploy** – placeholder step ready for platform-specific commands.

## Deployment Placeholder

- Add real deployment commands to the `deploy` job (e.g., `vercel deploy`, `npm run deploy`, or infrastructure scripts).
- Set required secrets (`PRODUCTION_URL`, API keys, etc.) in repository settings before enabling automatic deploys.

