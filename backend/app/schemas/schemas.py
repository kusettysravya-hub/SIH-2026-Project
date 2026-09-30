from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class HealthResponse(BaseModel):
    status: str
    pennylane_version: str
    simulator_device: str
    quantum_ready: bool
    timestamp: str

class ColumnStat(BaseModel):
    name: str
    dtype: str
    null_count: int
    zero_count: int
    mean: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    categories: Optional[List[str]] = None

class DatasetOption(BaseModel):
    filename: str
    label: str
    rows: int
    columns: int
    size_kb: float
    is_active: bool

class FeatureDistributionBin(BaseModel):
    bin_label: str
    negative_count: int
    positive_count: int
    total_count: int

class FeatureDistribution(BaseModel):
    feature: str
    unit: str
    bins: List[FeatureDistributionBin]

class DatasetSummary(BaseModel):
    filename: str
    total_rows: int
    total_columns: int
    duplicate_rows: int = 0
    target_column: str
    feature_names: List[str]
    column_stats: List[ColumnStat]
    class_distribution: Dict[str, int]
    feature_distributions: List[FeatureDistribution] = Field(default_factory=list)
    sample_preview: List[Dict[str, Any]]
    is_default: bool
    description: str
    available_datasets: List[DatasetOption] = Field(default_factory=list)

class DatasetSelectRequest(BaseModel):
    filename: str

class DatasetUploadResponse(BaseModel):
    message: str
    filename: str
    rows: int
    columns: int

class ConfusionMatrixData(BaseModel):
    tn: int
    fp: int
    fn: int
    tp: int
    sensitivity_recall: float
    specificity: float
    precision: float

class ModelMetrics(BaseModel):
    model_id: str
    model_name: str
    model_type: str # "classical" | "quantum"
    trained: bool
    status: str # "not_trained" | "training" | "trained" | "error"
    training_time_seconds: Optional[float] = None
    inference_latency_ms: Optional[float] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    confusion_matrix: Optional[ConfusionMatrixData] = None
    features_used: List[str] = Field(default_factory=list)
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None
    trained_at: Optional[str] = None
    dataset_name: Optional[str] = None

class ClassicalTrainRequest(BaseModel):
    algorithm: str = "logistic_regression" # "logistic_regression" | "random_forest"
    c_regularization: float = 1.0
    random_state: int = 42

class QuantumTrainRequest(BaseModel):
    n_qubits: int = 4
    n_layers: int = 2
    steps: int = 35
    learning_rate: float = 0.15
    random_state: int = 42

class PredictionRequest(BaseModel):
    model_id: str # "logistic_regression" | "random_forest" | "quantum_vqc"
    features: Dict[str, Any]

class FeatureContribution(BaseModel):
    feature: str
    value: Any
    weight_or_impact: float
    importance_description: str

class PredictionResponse(BaseModel):
    model_id: str
    model_name: str
    model_type: str
    predicted_class: int
    predicted_label: str
    probability: float
    risk_level: str # "Low Risk", "Moderate Risk", "High Risk"
    confidence_score: float
    latency_ms: float
    feature_contributions: List[FeatureContribution] = Field(default_factory=list)
    explainability_method: str = ""
    dataset_version: str
    disclaimer: str

class AllModelsResponse(BaseModel):
    dataset_name: str
    total_rows: int
    total_test_samples: int
    models: Dict[str, ModelMetrics]
