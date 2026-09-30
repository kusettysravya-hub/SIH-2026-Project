import threading
import logging
from typing import Dict, Any, Optional
from app.models.classical_pipeline import ClassicalPipeline
from app.models.quantum_pipeline import QuantumVQCPipeline
from app.services.dataset_service import dataset_service
from app.schemas.schemas import ModelMetrics, ConfusionMatrixData

logger = logging.getLogger(__name__)

class ModelService:
    def __init__(self):
        self.lock = threading.Lock()
        active_ds = dataset_service.active_filename
        self.lr_pipeline = ClassicalPipeline(algorithm="logistic_regression", dataset_name=active_ds)
        self.rf_pipeline = ClassicalPipeline(algorithm="random_forest", dataset_name=active_ds)
        self.qml_pipeline = QuantumVQCPipeline(n_qubits=4, n_layers=2, dataset_name=active_ds)

        self.statuses: Dict[str, str] = {
            "logistic_regression": "not_trained",
            "random_forest": "not_trained",
            "quantum_vqc": "not_trained"
        }
        self.errors: Dict[str, Optional[str]] = {
            "logistic_regression": None,
            "random_forest": None,
            "quantum_vqc": None
        }

        self.sync_with_active_dataset()

    def sync_with_active_dataset(self):
        active_ds = dataset_service.active_filename
        try:
            if self.lr_pipeline.load(active_ds):
                self.statuses["logistic_regression"] = "trained"
            else:
                self.statuses["logistic_regression"] = "not_trained"
        except Exception as e:
            logger.warning(f"Could not load saved Logistic Regression for {active_ds}: {e}")
            self.statuses["logistic_regression"] = "not_trained"

        try:
            if self.rf_pipeline.load(active_ds):
                self.statuses["random_forest"] = "trained"
            else:
                self.statuses["random_forest"] = "not_trained"
        except Exception as e:
            logger.warning(f"Could not load saved Random Forest for {active_ds}: {e}")
            self.statuses["random_forest"] = "not_trained"

        try:
            if self.qml_pipeline.load(active_ds):
                self.statuses["quantum_vqc"] = "trained"
            else:
                self.statuses["quantum_vqc"] = "not_trained"
        except Exception as e:
            logger.warning(f"Could not load saved Quantum VQC for {active_ds}: {e}")
            self.statuses["quantum_vqc"] = "not_trained"

    def train_classical(self, algorithm: str = "logistic_regression", c_reg: float = 1.0, random_state: int = 42) -> ModelMetrics:
        with self.lock:
            self.statuses[algorithm] = "training"
            self.errors[algorithm] = None

        try:
            active_ds = dataset_service.active_filename
            df = dataset_service.load_dataframe()
            target_col = dataset_service.detect_target_column(df)
            pipeline = self.lr_pipeline if algorithm == "logistic_regression" else self.rf_pipeline
            pipeline.train(df, dataset_name=active_ds, target_col=target_col, c_regularization=c_reg, random_state=random_state)
            self.statuses[algorithm] = "trained"
            return self.get_model_metric(algorithm)
        except Exception as e:
            self.statuses[algorithm] = "error"
            self.errors[algorithm] = str(e)
            logger.exception(f"Error training classical model {algorithm}")
            raise RuntimeError(f"Training failed for {algorithm}: {str(e)}")

    def train_quantum(self, n_qubits: int = 4, n_layers: int = 2, steps: int = 25, lr: float = 0.08, random_state: int = 42) -> ModelMetrics:
        with self.lock:
            self.statuses["quantum_vqc"] = "training"
            self.errors["quantum_vqc"] = None

        try:
            active_ds = dataset_service.active_filename
            df = dataset_service.load_dataframe()
            target_col = dataset_service.detect_target_column(df)
            if self.qml_pipeline.n_qubits != n_qubits or self.qml_pipeline.n_layers != n_layers:
                self.qml_pipeline = QuantumVQCPipeline(n_qubits=n_qubits, n_layers=n_layers, dataset_name=active_ds)

            self.qml_pipeline.train(df, dataset_name=active_ds, target_col=target_col, steps=steps, lr=lr, random_state=random_state)
            self.statuses["quantum_vqc"] = "trained"
            return self.get_model_metric("quantum_vqc")
        except Exception as e:
            self.statuses["quantum_vqc"] = "error"
            self.errors["quantum_vqc"] = str(e)
            logger.exception("Error training quantum VQC model")
            raise RuntimeError(f"Quantum training failed: {str(e)}")

    def get_model_metric(self, model_id: str) -> ModelMetrics:
        status = self.statuses.get(model_id, "not_trained")

        if model_id == "logistic_regression":
            p = self.lr_pipeline
            name = "Logistic Regression (Baseline Classical)"
            m_type = "classical"
            hp = {"solver": "lbfgs", "max_iter": 1000, "C": 1.0}
            notes = "Standard linear decision boundary baseline using Scikit-Learn with categorical encoding, median imputation, and feature standardization."
        elif model_id == "random_forest":
            p = self.rf_pipeline
            name = "Random Forest (Non-linear Classical)"
            m_type = "classical"
            hp = {"n_estimators": 100, "max_depth": 6}
            notes = "Non-linear ensemble baseline consisting of 100 decision trees to capture non-linear feature interactions."
        elif model_id == "quantum_vqc":
            p = self.qml_pipeline
            name = f"Variational Quantum Circuit ({p.n_qubits} Qubits)"
            m_type = "quantum"
            hp = {
                "n_qubits": p.n_qubits,
                "n_layers": p.n_layers,
                "encoding": "AngleEmbedding (Bloch Y-rotation)",
                "entanglement": "Circular CNOT",
                "simulator": p.simulator_name
            }
            notes = "Genuine parameterized quantum circuit executed on PennyLane statevector simulator default.qubit with broadcasted angle encoding."
        else:
            raise ValueError(f"Unknown model_id: {model_id}")

        cm_obj = None
        if p.is_trained and p.metrics and "confusion_matrix" in p.metrics:
            c = p.metrics["confusion_matrix"]
            cm_obj = ConfusionMatrixData(
                tn=c["tn"],
                fp=c["fp"],
                fn=c["fn"],
                tp=c["tp"],
                sensitivity_recall=c["sensitivity_recall"],
                specificity=c["specificity"],
                precision=c["precision"]
            )

        features = p.feature_names if hasattr(p, "feature_names") and p.feature_names else getattr(p, "selected_features", [])

        return ModelMetrics(
            model_id=model_id,
            model_name=name,
            model_type=m_type,
            trained=p.is_trained,
            status=status,
            training_time_seconds=p.training_time if p.is_trained else None,
            inference_latency_ms=getattr(p, "inference_latency_ms", None) if p.is_trained else None,
            accuracy=p.metrics.get("accuracy") if (p.is_trained and p.metrics) else None,
            precision=p.metrics.get("precision") if (p.is_trained and p.metrics) else None,
            recall=p.metrics.get("recall") if (p.is_trained and p.metrics) else None,
            f1_score=p.metrics.get("f1_score") if (p.is_trained and p.metrics) else None,
            roc_auc=p.metrics.get("roc_auc") if (p.is_trained and p.metrics) else None,
            confusion_matrix=cm_obj,
            features_used=features,
            hyperparameters=hp,
            notes=notes,
            trained_at=p.trained_at if p.is_trained else None,
            dataset_name=p.dataset_name
        )

    def get_all_metrics(self) -> Dict[str, ModelMetrics]:
        self.sync_with_active_dataset()
        return {
            "logistic_regression": self.get_model_metric("logistic_regression"),
            "random_forest": self.get_model_metric("random_forest"),
            "quantum_vqc": self.get_model_metric("quantum_vqc")
        }

    def predict(self, model_id: str, features: Dict[str, Any]) -> Dict[str, Any]:
        self.sync_with_active_dataset()
        if model_id == "logistic_regression":
            if not self.lr_pipeline.is_trained:
                raise ValueError("Logistic Regression model is not trained on the active dataset yet. Please train it first.")
            return self.lr_pipeline.predict(features)
        elif model_id == "random_forest":
            if not self.rf_pipeline.is_trained:
                raise ValueError("Random Forest model is not trained on the active dataset yet. Please train it first.")
            return self.rf_pipeline.predict(features)
        elif model_id == "quantum_vqc":
            if not self.qml_pipeline.is_trained:
                raise ValueError("Quantum VQC model is not trained on the active dataset yet. Please train it first.")
            return self.qml_pipeline.predict(features)
        else:
            raise ValueError(f"Unknown model_id: {model_id}")

model_service = ModelService()
