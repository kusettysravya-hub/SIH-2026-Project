from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.services.dataset_service import dataset_service

app = FastAPI(
    title="Hybrid Quantum Machine Learning Platform API",
    description=(
        "Backend API for Smart India Hackathon Project: "
        "Hybrid Quantum Machine Learning Platform for Early Disease Detection (Type 2 Diabetes Screening). "
        "Integrates Scikit-Learn Classical ML and PennyLane Quantum Variational Circuits (VQC)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration for local Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def startup_event():
    # Warm up dataset
    try:
        dataset_service.load_dataframe()
    except Exception as e:
        print(f"Warning on startup loading dataset: {e}")

@app.get("/")
def root():
    return {
        "project": "Hybrid Quantum Machine Learning Platform for Early Disease Detection",
        "hackathon": "Smart India Hackathon",
        "use_case": "Type 2 Diabetes Risk Screening",
        "status": "online",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
