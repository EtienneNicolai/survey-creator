# Guideline 06 — FastAPI App & Static Serving (Session 5)

## Scope
This session wires all routers into the FastAPI app, configures static file serving for the built
React frontend, and creates the production Procfile.

## Prerequisite
Sessions 1–4 must be complete. All route files must exist before this session runs.

## What to Build

### 1. `backend/src/api/main.py`

```python
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.src.api.routes.auth import router as auth_router
from backend.src.api.routes.surveys import router as surveys_router
from backend.src.api.routes.questions import router as questions_router
from backend.src.api.routes.public import router as public_router
from backend.src.api.routes.results import router as results_router

app = FastAPI(title="Survey Creator")

app.include_router(auth_router)       # prefix="/api/auth" already set in the router
app.include_router(surveys_router)    # prefix="/api/surveys" already set in the router
app.include_router(questions_router)  # no prefix — routes are /api/surveys/{id}/questions/...
app.include_router(public_router)     # /s/{token} routes — no prefix
app.include_router(results_router)    # /api/surveys/{id}/results — no prefix

# Serve the built React frontend (only if it exists — supports dev without a frontend build)
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        index_html = os.path.join(FRONTEND_DIST, "index.html")
        return FileResponse(index_html)
```

**Why the catch-all route comes last?**
FastAPI routes are matched in registration order. The `/{full_path:path}` catch-all must be
registered AFTER all API routes, or it intercepts API calls before they can match.

**Why check `os.path.isdir(FRONTEND_DIST)`?**
During backend-only development (Sessions 1–5), the React build does not exist yet.
Without the guard, the app crashes at startup. With it, the backend works as a pure API
until `npm run build` is run.

### 2. `Procfile` — Railway deployment
```
web: python -m uvicorn backend.src.api.main:app --host 0.0.0.0 --port $PORT
```

**Why `python -m uvicorn`?**
Packages installed to `backend/lib/` are not on the system PATH, but they ARE on `sys.path`
when PYTHONPATH includes `backend/lib/`. The `python -m uvicorn` form resolves through sys.path;
the bare `uvicorn` form would look for an executable on PATH and fail.

### 3. `start.bat` — local development launcher

```bat
@echo off
echo Starting Survey Creator...
cd /d "%~dp0"

echo Setting up Python path...
set PYTHONPATH=%CD%;%CD%\backend\lib

echo Building frontend (if needed)...
if not exist frontend\dist (
    echo No frontend build found, running npm build...
    cd frontend
    call npm run build
    cd ..
)

echo Starting server...
python -m uvicorn backend.src.api.main:app --host 127.0.0.1 --port 8000 --reload

pause
```

This script:
1. Sets PYTHONPATH to include project root and `backend/lib`
2. Builds the frontend if the `dist/` folder does not exist
3. Starts uvicorn with `--reload` for auto-restart on code changes

Users double-click `start.bat` to launch the app. Browser: `http://localhost:8000`

## Testing Session 5
Session 5 should run a quick integration smoke test:
```powershell
$env:PYTHONPATH = "C:\Users\Etien\Documents\Projects\survey-creator;C:\Users\Etien\Documents\Projects\survey-creator\backend\lib"
python -m uvicorn backend.src.api.main:app --host 127.0.0.1 --port 8001 &
# Wait 2 seconds, then:
python -c "
import httpx, time
time.sleep(2)
r = httpx.get('http://localhost:8001/api/auth/me', headers={'Authorization': 'Bearer bad'})
assert r.status_code == 403, f'Expected 403, got {r.status_code}'
print('Smoke test passed')
"
```

## Key Constraints
- The catch-all `/{full_path:path}` must be the LAST route registered
- Check `os.path.isdir(FRONTEND_DIST)` before mounting — app must start without a build
- Do not use `StaticFiles(directory=FRONTEND_DIST, html=True)` as this conflicts with the
  `/s/{token}` route (React Router handles all non-API paths)
- `Procfile` must use `$PORT` — Railway injects this env var; hardcoding 8000 will fail in prod
