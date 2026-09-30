import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File
import pennylane as qml

from app.schemas.schemas import (
    HealthResponse,
    DatasetSummary,
    DatasetSelectRequest,
    DatasetUploadResponse,
    ModelMetrics,
    ClassicalTrainRequest,
    QuantumTrainRequest,
    PredictionRequest,
    PredictionResponse,
    AllModelsResponse
)
from app.services.dataset_service import dataset_service
from app.services.model_service import model_service

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["System"])
def get_health():
    """Health check endpoint confirming backend and PennyLane simulator availability."""
    try:
        pl_ver = qml.__version__
        dev = qml.device("default.qubit", wires=2)
        ready = True
    except Exception:
        pl_ver = "unavailable"
        ready = False

    return HealthResponse(
        status="healthy",
        pennylane_version=pl_ver,
        simulator_device="default.qubit",
        quantum_ready=ready,
        timestamp=datetime.datetime.now().isoformat()
    )

@router.get("/dataset/info", response_model=DatasetSummary, tags=["Dataset"])
def get_dataset_info():
    """Retrieves dataset summary statistics, column null/zero counts, class balance, sample rows, and available datasets."""
    try:
        return dataset_service.get_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dataset info: {str(e)}")

@router.post("/dataset/select", response_model=DatasetSummary, tags=["Dataset"])
def select_dataset(req: DatasetSelectRequest):
    """Switches the active dataset between available preloaded or uploaded CSV files."""
    try:
        summary = dataset_service.select_dataset(req.filename)
        model_service.sync_with_active_dataset()
        return summary
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error selecting dataset: {str(e)}")

@router.post("/dataset/upload", response_model=DatasetUploadResponse, tags=["Dataset"])
async def upload_dataset(file: UploadFile = File(...)):
    """Uploads and validates a CSV dataset (up to 50 MB) for training and comparison."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")

    # 50 MB limit to support 100,000+ row clinical datasets
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds limit of 50 MB.")

    try:
        res = dataset_service.save_upload(file.filename, content)
        model_service.sync_with_active_dataset()
        return DatasetUploadResponse(
            message=f"Successfully loaded and validated {res['filename']}",
            filename=res["filename"],
            rows=res["rows"],
            columns=res["columns"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving dataset: {str(e)}")

@router.post("/dataset/reset", response_model=DatasetSummary, tags=["Dataset"])
def reset_dataset():
    """Resets dataset to the default benchmark."""
    try:
        summary = dataset_service.reset_to_default()
        model_service.sync_with_active_dataset()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/models/train/classical", response_model=ModelMetrics, tags=["Models"])
def train_classical_model(req: ClassicalTrainRequest):
    """
    Trains a Classical Machine Learning model (Logistic Regression or Random Forest)
    on held-out test data and returns genuine performance metrics.
    """
    if req.algorithm not in ["logistic_regression", "random_forest"]:
        raise HTTPException(status_code=400, detail=f"Invalid algorithm: {req.algorithm}")

    try:
        metrics = model_service.train_classical(
            algorithm=req.algorithm,
            c_reg=req.c_regularization,
            random_state=req.random_state
        )
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/models/train/quantum", response_model=ModelMetrics, tags=["Models"])
def train_quantum_model(req: QuantumTrainRequest):
    """
    Trains a Variational Quantum Circuit (VQC) with PennyLane default.qubit simulator
    using Angle Embedding and parameterized entangling layers.
    """
    if req.n_qubits < 2 or req.n_qubits > 6:
        raise HTTPException(status_code=400, detail="n_qubits must be between 2 and 6 for laptop simulation.")
    if req.steps < 5 or req.steps > 100:
        raise HTTPException(status_code=400, detail="steps must be between 5 and 100.")

    try:
        metrics = model_service.train_quantum(
            n_qubits=req.n_qubits,
            n_layers=req.n_layers,
            steps=req.steps,
            lr=req.learning_rate,
            random_state=req.random_state
        )
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/metrics", response_model=AllModelsResponse, tags=["Models"])
def get_all_metrics():
    """Returns training status, actual performance metrics, and confusion matrices for all models on the active dataset."""
    try:
        all_metrics = model_service.get_all_metrics()
        df = dataset_service.load_dataframe()
        total_rows = int(len(df))
        test_samples = int(round(total_rows * 0.2))
        return AllModelsResponse(
            dataset_name=dataset_service.active_filename,
            total_rows=total_rows,
            total_test_samples=test_samples,
            models=all_metrics
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def run_prediction(req: PredictionRequest):
    """
    Executes real-time risk screening inference on patient diagnostic parameters
    using the specified trained Classical or Quantum model.
    """
    try:
        res = model_service.predict(req.model_id, req.features)
        return PredictionResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=400, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
