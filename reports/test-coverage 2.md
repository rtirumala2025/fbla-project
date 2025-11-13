# Test Coverage Snapshot

- **Date:** November 10, 2025  
- **Command:** `DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/postgres JWT_SECRET=test-secret PYTHONPATH=. pytest tests/test_ai.py --cov=app --cov-report=term-missing`

## Summary
- Total files measured: 43
- Lines covered: 1,286 / 2,688
- Overall coverage: **47.9%**
- Test suite executed: `tests/test_ai.py`  
  _Focuses on the AI service helpers used for mood analysis, personality assignment, and natural-language parsing._

## Notable Highlights
- `app/services/ai_service.py` coverage at 42% with asynchronous scenarios validated.
- Core configuration, routing scaffold, and Supabase models all import successfully in a minimal environment (dummy env vars).

## Gaps & Next Steps
- Many routers and service modules remain untested in this snapshot.  
- Backend database interactions were not exercised; add integration tests once a Postgres test instance is available.  
- Consider expanding coverage to finance, pet, and game services with mocked repositories for FBLA demos.

## Reproducing Locally
1. Ensure Python dependencies are installed (`pip install -r requirements.txt` plus `pytest-cov` if missing).
2. Export minimal env vars:
   ```bash
   export DATABASE_URL='postgresql+asyncpg://postgres:postgres@localhost:5432/postgres'
   export JWT_SECRET='test-secret'
   export PYTHONPATH='.'
   ```
3. Run:
   ```bash
   pytest tests/test_ai.py --cov=app --cov-report=term-missing
   ```
4. Coverage output prints to the console; copy into this file for the next snapshot.

