import os
import time
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from app.utils.metrics import calculate_metrics

# PennyLane imports
import pennylane as qml
from pennylane import numpy as pnp

SAVED_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "saved_models"))

class QuantumVQCPipeline:
    def __init__(self, n_qubits: int = 4, n_layers: int = 2, dataset_name: str = "diabetes.csv"):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.dataset_name = dataset_name
        self.selected_features = ["Glucose", "BMI", "Age", "DiabetesPedigreeFunction"]
        self.scaler = None
        self.medians = {}
        self.weights = None
        self.out_weights = None
        self.bias = 0.0
        self.metrics = None
        self.training_time = 0.0
        self.inference_latency_ms = 3.2
        self.is_trained = False
        self.trained_at = None
        self.simulator_name = "default.qubit"
        os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
        self._init_qnode()

    def _init_qnode(self):
        self.dev = qml.device(self.simulator_name, wires=self.n_qubits)

        @qml.qnode(self.dev, interface="autograd", diff_method="backprop")
        def vqc_circuit(weights, x):
            # 1. State preparation via Angle Embedding (supports broadcasted 2D batch or 1D sample)
            qml.AngleEmbedding(x, wires=range(self.n_qubits), rotation="Y")

            # 2. Parameterized Variational Layers
            for l in range(weights.shape[0]):
                for i in range(self.n_qubits):
                    qml.RY(weights[l, i, 0], wires=i)
                    qml.RZ(weights[l, i, 1], wires=i)
                # Circular CNOT entangling topology
                for i in range(self.n_qubits):
                    qml.CNOT(wires=[i, (i + 1) % self.n_qubits])

            # 3. Multi-qubit Measurement: Pauli-Z expectation value across all wires
            return [qml.expval(qml.PauliZ(i)) for i in range(self.n_qubits)]

        self.qnode = vqc_circuit

    def _get_save_prefix(self, dataset_name: Optional[str] = None) -> str:
        ds = (dataset_name or self.dataset_name).replace(".csv", "").replace(" ", "_")
        return os.path.join(SAVED_MODELS_DIR, f"{ds}_quantum_vqc")

    def _select_best_features(self, df: pd.DataFrame, target_col: str) -> List[str]:
        # Priority 1: 100k Clinical Diabetes Dataset core biomarkers
        clinical_100k_cols = ["HbA1c_level", "blood_glucose_level", "bmi", "age"]
        if all(c in df.columns for c in clinical_100k_cols):
            return clinical_100k_cols[:self.n_qubits]

        # Priority 2: Pima Indians Diabetes Dataset core biomarkers
        pima_cols = ["Glucose", "BMI", "Age", "DiabetesPedigreeFunction"]
        if all(c in df.columns for c in pima_cols):
            return pima_cols[:self.n_qubits]

        # Fallback: first n_qubits numeric columns
        num_cols = [c for c in df.columns if c != target_col and pd.api.types.is_numeric_dtype(df[c])]
        if len(num_cols) >= self.n_qubits:
            return num_cols[:self.n_qubits]
        other_cols = [c for c in df.columns if c != target_col]
        return other_cols[:self.n_qubits]

    def prepare_data(self, df: pd.DataFrame, target_col: Optional[str] = None, test_size: float = 0.2, random_state: int = 42):
        if not target_col or target_col not in df.columns:
            for cand in ["Outcome", "diabetes", "target", "label"]:
                if cand in df.columns:
                    target_col = cand
                    break
            else:
                target_col = df.columns[-1]

        self.selected_features = self._select_best_features(df, target_col)

        X = df[self.selected_features].copy()
        for col in self.selected_features:
            if not pd.api.types.is_numeric_dtype(X[col]):
                X[col] = pd.factorize(X[col])[0].astype(float)

        y = df[target_col].copy().astype(int)

        # Stratified split identical to classical
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )

        # Handle physiological zeros
        self.medians = {}
        for col in self.selected_features:
            non_zero = X_train[col][X_train[col] > 0]
            med = float(non_zero.median()) if not non_zero.empty else float(X_train[col].median())
            self.medians[col] = med
            X_train[col] = X_train[col].replace(0, med).fillna(med)
            X_test[col] = X_test[col].replace(0, med).fillna(med)

        # Scale features into [0, pi] for Bloch sphere angle embedding
        self.scaler = MinMaxScaler(feature_range=(0.0, np.pi))
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        return X_train_scaled, X_test_scaled, y_train.values, y_test.values

    def _forward(self, weights, out_weights, bias, x):
        # Supports both single sample (shape (n_qubits,)) and batch (shape (N, n_qubits))
        z_expectations = pnp.stack(self.qnode(weights, x), axis=-1)
        logits = pnp.dot(z_expectations, out_weights) + bias
        probs = 1.0 / (1.0 + pnp.exp(-logits))
        return pnp.clip(probs, 1e-6, 1.0 - 1e-6)

    def _loss(self, weights, out_weights, bias, X_batch, y_batch):
        probs = self._forward(weights, out_weights, bias, X_batch)
        return -pnp.mean(y_batch * pnp.log(probs) + (1.0 - y_batch) * pnp.log(1.0 - probs))

    def train(self, df: pd.DataFrame, dataset_name: str = "diabetes.csv", target_col: Optional[str] = None, steps: int = 35, lr: float = 0.15, random_state: int = 42) -> Dict[str, Any]:
        self.dataset_name = dataset_name
        start_time = time.time()
        np.random.seed(random_state)

        X_train, X_test, y_train, y_test = self.prepare_data(df, target_col, test_size=0.2, random_state=random_state)

        initial_weights = np.random.uniform(-0.5, 0.5, (self.n_layers, self.n_qubits, 2))
        weights = pnp.array(initial_weights, requires_grad=True)
        out_weights = pnp.array([-2.0] * self.n_qubits, requires_grad=True)
        pos_ratio = float(np.clip(np.mean(y_train), 0.05, 0.95))
        init_bias = float(np.log(pos_ratio / (1.0 - pos_ratio)))
        bias = pnp.array(init_bias, requires_grad=True)

        # Representative training subsample preserving dataset class distribution
        sample_size = min(1000, len(X_train))
        sampled_indices = np.random.choice(len(X_train), sample_size, replace=False)

        X_sub = pnp.array(X_train[sampled_indices], requires_grad=False)
        y_sub = pnp.array(y_train[sampled_indices], requires_grad=False)

        opt = qml.AdamOptimizer(stepsize=max(lr, 0.12))
        actual_steps = max(steps, 35)

        for _ in range(actual_steps):
            weights, out_weights, bias = opt.step(
                lambda w, ow, b: self._loss(w, ow, b, X_sub, y_sub),
                weights, out_weights, bias
            )

        self.weights = weights
        self.out_weights = out_weights
        self.bias = float(bias)
        self.training_time = round(time.time() - start_time, 4)

        # Measure single-sample quantum circuit inference latency
        t0 = time.perf_counter()
        _ = self._forward(self.weights, self.out_weights, self.bias, X_test[0])
        self.inference_latency_ms = round(max((time.perf_counter() - t0) * 1000, 0.8), 2)

        # Vectorized evaluation on held-out test set
        test_probs = np.asarray(self._forward(self.weights, self.out_weights, self.bias, X_test), dtype=float)
        test_preds = (test_probs >= 0.5).astype(int)

        eval_metrics = calculate_metrics(y_test, test_preds, test_probs)
        self.metrics = eval_metrics
        self.is_trained = True
        self.trained_at = datetime.now().isoformat()

        self.save()

        return {
            "algorithm": "quantum_vqc",
            "dataset_name": self.dataset_name,
            "simulator": self.simulator_name,
            "n_qubits": self.n_qubits,
            "n_layers": self.n_layers,
            "training_time_seconds": self.training_time,
            "inference_latency_ms": self.inference_latency_ms,
            "metrics": self.metrics,
            "test_samples": len(y_test),
            "features_used": self.selected_features
        }

    def save(self):
        prefix = self._get_save_prefix()
        bundle = {
            "dataset_name": self.dataset_name,
            "n_qubits": self.n_qubits,
            "n_layers": self.n_layers,
            "selected_features": self.selected_features,
            "scaler": self.scaler,
            "medians": self.medians,
            "weights": np.array(self.weights),
            "out_weights": np.array(self.out_weights),
            "bias": self.bias,
            "metrics": self.metrics,
            "training_time": self.training_time,
            "inference_latency_ms": self.inference_latency_ms,
            "trained_at": self.trained_at
        }
        joblib.dump(bundle, f"{prefix}_bundle.joblib")

    def load(self, dataset_name: Optional[str] = None) -> bool:
        if dataset_name:
            self.dataset_name = dataset_name
        path = f"{self._get_save_prefix(self.dataset_name)}_bundle.joblib"
        if not os.path.exists(path):
            self.is_trained = False
            self.metrics = None
            return False
        try:
            bundle = joblib.load(path)
            if "out_weights" not in bundle:
                self.is_trained = False
                return False
            self.dataset_name = bundle.get("dataset_name", self.dataset_name)
            self.n_qubits = bundle["n_qubits"]
            self.n_layers = bundle["n_layers"]
            self.selected_features = bundle["selected_features"]
            self.scaler = bundle["scaler"]
            self.medians = bundle["medians"]
            self.weights = pnp.array(bundle["weights"], requires_grad=False)
            self.out_weights = pnp.array(bundle["out_weights"], requires_grad=False)
            self.bias = bundle["bias"]
            self.metrics = bundle["metrics"]
            self.training_time = bundle["training_time"]
            self.trained_at = bundle["trained_at"]
            self.is_trained = True
            self._init_qnode()
            if "inference_latency_ms" in bundle and bundle["inference_latency_ms"]:
                self.inference_latency_ms = float(bundle["inference_latency_ms"])
            else:
                t0 = time.perf_counter()
                dummy = np.full((self.n_qubits,), np.pi / 2.0)
                _ = self._forward(self.weights, self.out_weights, self.bias, dummy)
                self.inference_latency_ms = round(max((time.perf_counter() - t0) * 1000, 0.8), 2)
            return True
        except Exception:
            self.is_trained = False
            return False

    def predict(self, feature_input: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_trained or self.weights is None or self.out_weights is None:
            raise RuntimeError(f"Quantum VQC model is not trained for dataset '{self.dataset_name}'.")

        start_time = time.perf_counter()
        vector = []
        for f in self.selected_features:
            raw_val = feature_input.get(f, self.medians.get(f, 0.0))
            try:
                val = float(raw_val)
            except Exception:
                val = self.medians.get(f, 0.0)
            if (val <= 0 or pd.isna(val)) and f in self.medians:
                val = self.medians[f]
            vector.append(float(val))

        vector_df = pd.DataFrame([vector], columns=self.selected_features)
        vector_scaled = self.scaler.transform(vector_df)[0]

        z_vals = np.asarray(self.qnode(self.weights, vector_scaled), dtype=float)
        prob = float(self._forward(self.weights, self.out_weights, self.bias, vector_scaled))
        pred_class = 1 if prob >= 0.5 else 0
        latency_ms = round(max((time.perf_counter() - start_time) * 1000, 0.8), 2)

        if prob < 0.35:
            risk_level = "Low Risk"
        elif prob < 0.65:
            risk_level = "Moderate Risk"
        else:
            risk_level = "High Risk"

        confidence_score = round(abs(prob - 0.5) * 2 * 100, 1)

        contributions = []
        for idx, f in enumerate(self.selected_features):
            angle = float(vector_scaled[idx])
            z_exp = float(z_vals[idx]) if idx < len(z_vals) else 0.0
            contributions.append({
                "feature": f,
                "value": float(vector[idx]),
                "weight_or_impact": round(angle, 4),
                "importance_description": f"Qubit q{idx} Ry({round(np.degrees(angle), 1)} deg) | <Z{idx}> = {round(z_exp, 3)}"
            })

        contributions.sort(key=lambda x: x["weight_or_impact"], reverse=True)

        ds_label = (
            "Clinical Diabetes Dataset (100,000 rows)"
            if "100" in self.dataset_name or "prediction" in self.dataset_name
            else "Pima Indians Diabetes (768 rows)" if self.dataset_name == "diabetes.csv"
            else self.dataset_name
        )

        return {
            "model_id": "quantum_vqc",
            "model_name": f"Variational Quantum Circuit ({self.n_qubits} Qubits, default.qubit)",
            "model_type": "quantum",
            "predicted_class": pred_class,
            "predicted_label": "High Risk" if pred_class == 1 else "Low Risk",
            "probability": round(prob, 4),
            "risk_level": risk_level,
            "confidence_score": confidence_score,
            "latency_ms": latency_ms,
            "feature_contributions": contributions,
            "explainability_method": "Bloch Sphere Ry(theta) Angle Encoding & Pauli-Z Wire Readout",
            "dataset_version": ds_label,
            "disclaimer": "This prototype is intended for screening support and research demonstration only. It does not provide a medical diagnosis."
        }

