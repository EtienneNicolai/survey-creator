"""
Run this before starting any session to verify all dependencies are installed.
Usage:
    $env:PYTHONPATH = "<project root>;<project root>\backend\lib"
    python check.py
All lines should print OK. psycopg2 may show FAIL on Windows without PostgreSQL client libs
installed — that is acceptable for local development (only needed on Railway).
"""

checks = [
    ("fastapi", "from fastapi import FastAPI; FastAPI()"),
    ("uvicorn", "import uvicorn"),
    ("sqlalchemy", "from sqlalchemy import Column, Integer, String"),
    ("alembic", "import alembic"),
    ("passlib[bcrypt]", "from passlib.context import CryptContext; CryptContext(schemes=['bcrypt'])"),
    ("PyJWT", "import jwt; jwt.encode({'sub': '1'}, 'key', algorithm='HS256')"),
    ("python-multipart", "from multipart.multipart import parse_options_header"),
    ("pytest", "import pytest"),
    ("httpx", "import httpx"),
    ("python-dotenv", "from dotenv import load_dotenv"),
    ("psycopg2-binary", "import psycopg2"),
]

all_ok = True
for name, code in checks:
    try:
        exec(code)
        print(f"  OK  {name}")
    except Exception as e:
        print(f"  FAIL  {name}: {e}")
        if name != "psycopg2-binary":
            all_ok = False

print()
if all_ok:
    print("All required dependencies OK. Ready to start sessions.")
else:
    print("Some dependencies missing. Run: python -m pip install --target=backend\\lib -r requirements.txt")
