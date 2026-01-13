
import asyncio
from app.core.config import get_settings
from app.core.database import Database

async def main():
    print("Loading settings...")
    settings = get_settings()
    print(f"DATABASE_URL present: {bool(settings.database_url)}")
    if settings.database_url:
        print(f"DATABASE_URL length: {len(settings.database_url)}")
        # Mask password
        masked = settings.database_url.replace(settings.database_url.split('@')[0].split(':')[2], '******')
        print(f"DATABASE_URL: {masked}")
    
    print("\nAttempting connection...")
    db = Database()
    await db.connect()
    
    if db.pool:
        print("SUCCESS: Connected to database.")
        print(f"Pool status: {not db.pool._closed}")
        await db.disconnect()
    else:
        print("FAILURE: Could not create pool.")

if __name__ == "__main__":
    asyncio.run(main())
