# Alembic Migrations

Alembic is configured to generate and apply database migrations for the Virtual Pet backend. The configuration reads the `DATABASE_URL` from the environment. Run migrations with:

```bash
alembic upgrade head
```

Generate a new revision with:

```bash
alembic revision -m "add new table"
```

Revision scripts are stored under `alembic/versions/`.
