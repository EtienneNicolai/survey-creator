# Guideline 03 — Auth Layer (Session 2)

## Scope
This session owns `backend/src/auth/` and the `/api/auth` routes.

## Prerequisite
Session 1 must be complete — `models.py` and `database.py` must exist.

## What to Build

### 1. `backend/src/auth/hashing.py`
Password hashing and verification using passlib.

```python
from passlib.context import CryptContext

_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return _ctx.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return _ctx.verify(plain, hashed)
```

### 2. `backend/src/auth/jwt.py`
JWT token creation and decoding.

```python
import jwt
import os
from datetime import datetime, timedelta, timezone

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except jwt.PyJWTError:
        return None
```

**Why `timezone.utc`?**
`datetime.utcnow()` is deprecated in Python 3.12+. Use `datetime.now(timezone.utc)` instead.
PyJWT validates the `exp` claim automatically — an expired token returns None from `decode_token`.

### 3. `backend/src/auth/dependencies.py`
The `get_current_user` FastAPI dependency. Used by all authenticated routes.

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.src.data.database import get_db
from backend.src.data.models import User
from backend.src.auth.jwt import decode_token

bearer = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
```

### 4. `backend/src/api/routes/auth.py`
Three auth routes: register, login, me.

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from backend.src.data.database import get_db
from backend.src.data.models import User
from backend.src.auth.hashing import hash_password, verify_password
from backend.src.auth.jwt import create_token
from backend.src.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=body.email, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_token(user.id))

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_token(user.id))

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email}
```

## Key Constraints
- `SECRET_KEY` must come from the environment — the default `"dev-secret-change-in-production"`
  is only for local development. Set a real secret in Railway environment variables.
- Never log or return the password hash
- `decode_token` returns `None` on any error (expired, malformed, wrong signature) — never raises
- `pydantic.EmailStr` requires the `email-validator` package — add it to requirements.txt or
  use plain `str` for the email field (plain `str` is fine for a portfolio project)
- Do not import from `backend/src/api/routes/surveys.py` or any other route file

## __init__.py files to create
- `backend/src/auth/__init__.py` (empty)
- `backend/src/api/__init__.py` (empty)
- `backend/src/api/routes/__init__.py` (empty)

## Files to Create
- `backend/src/auth/__init__.py` (empty)
- `backend/src/auth/hashing.py`
- `backend/src/auth/jwt.py`
- `backend/src/auth/dependencies.py`
- `backend/src/api/__init__.py` (empty)
- `backend/src/api/routes/__init__.py` (empty)
- `backend/src/api/routes/auth.py`
- `backend/tests/test_auth.py`

## Tests
See `guidelines/08-testing.md`. Tests cover: register new user returns token, duplicate email rejected,
login with correct credentials returns token, login with wrong password rejected, /me with valid token
returns user, /me with invalid token returns 401.
