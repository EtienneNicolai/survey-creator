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
