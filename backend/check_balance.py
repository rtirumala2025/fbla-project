import os
import asyncio
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
USER_ID = "6f71641d-c1e5-49c8-845c-38f14bd1f192"

async def check_balance():
    print(f"Connecting to {DATABASE_URL}")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        row = await conn.fetchrow("SELECT id, balance FROM finance_wallets WHERE user_id = $1", USER_ID)
        if row:
            print(f"Wallet Found: ID={row['id']}, Balance={row['balance']}")
            if row['balance'] == 0:
                print("Balance is 0. Updating to 500...")
                await conn.execute("UPDATE finance_wallets SET balance = 500 WHERE user_id = $1", USER_ID)
                print("Balance updated to 500.")
            else:
                print("Balance is not 0.")
        else:
            print("No wallet found for this user.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_balance())
