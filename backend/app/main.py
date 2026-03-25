from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import match, connect, profile

app = FastAPI(title="SuperNetworkAI", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://supernetworkai-app.vercel.app",
        "https://supernetworkai.lovable.app",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(match.router)
app.include_router(connect.router)


@app.get("/")
def health_check():
    return {"status": "ok"}
