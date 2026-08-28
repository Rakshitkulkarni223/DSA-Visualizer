from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router

app = FastAPI(title="DSA Visualizer Backend")

app.add_middleware(
    CORSMiddleware,
    # Vite falls back to another port (5174, 5175, ...) whenever 5173 is
    # already taken by an unrelated dev server, so a fixed allowlist breaks
    # in practice. Regex-match any localhost/127.0.0.1 port instead --
    # scoped to loopback only, so this stays safe for local dev.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
