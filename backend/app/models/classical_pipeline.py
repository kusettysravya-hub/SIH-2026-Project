import os
import time
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from app.utils.metrics import calculate_metrics

SAVED_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "saved_models"))

KNOWN_CATEGORY_MAPS = {
    "gender": {
        "Female": 0.0, "female": 0.0, "F": 0.0,
        "Male": 1.0, "male": 1.0, "M": 1.0,
        "Other": 2.0, "other": 2.0
    },
    "smoking_history": {
        "never": 0.0,
        "No Info": 1.0, "no info": 1.0,
        "not current": 2.0,
        "former": 3.0,
        "ever": 4.0,
        "current": 5.0
    }
}

class ClassicalPipeline:
    def __init__(self, algorithm: str = "logistic_regression", dataset_name: str = "diabetes.csv"):
        self.algorithm = algorithm
        self.dataset_name = dataset_name
        self.model = None
        self.scaler = None
        self.medians = {}
        self.category_mappings: Dict[str, Dict[str, float]] = {}
        self.feature_names = []
        self.target_name = "Outcome"
        self.metrics = None
        self.training_time = 0.0
        self.inference_latency_ms = 0.45
        self.is_trained = False
        self.trained_at = None
        os.makedirs(SAVED_MODELS_DIR, exist_ok=True)

    def _get_save_prefix(self, dataset_name: Optional[str] = None) -> str:
        ds = (dataset_name or self.dataset_name).replace(".csv", "").replace(" ", "_")
        return os.path.join(SAVED_MODELS_DIR, f"{ds}_classical_{self.algorithm}")

    def _encode_column(self, series: pd.Series, col_name: str, fit: bool = False) -> pd.Series:
        if pd.api.types.is_numeric_dtype(series):
            return series.astype(float)

        if fit:
            if col_name in KNOWN_CATEGORY_MAPS:
                mapping = KNOWN_CATEGORY_MAPS[col_name].copy()
                # Add any unseen categories
                for val in series.dropna().unique():
                    s_val = str(val).strip()
                    if s_val not in mapping:
                        mapping[s_val] = float(len(mapping))
                self.category_mappings[col_name] = mapping
            else:
                unique_vals = sorted([str(v).strip() for v in series.dropna().unique()])
                self.category_mappings[col_name] = {v: float(i) for i, v in enumerate(unique_vals)}

        mapping = self.category_mappings.get(col_name, {})
        def map_val(v):
            if pd.isna(v):
                return 0.0
            if isinstance(v, (int, float, np.number)):
                return float(v)
            s = str(v).strip()
            if s in mapping:
                return mapping[s]
            try:
                return float(s)
            except Exception:
                return 0.0

        return series.map(map_val).astype(float)

    def prepare_data(self, df: pd.DataFrame, target_col: Optional[str] = None, test_size: float = 0.2, random_state: int = 42):
        if not target_col or target_col not in df.columns:
            for cand in ["Outcome", "diabetes", "target", "label"]:
                if cand in df.columns:
                    target_col = cand
                    break
            else:
                target_col = df.columns[-1]

        self.target_name = target_col
        self.feature_names = [c for c in df.columns if c != target_col]

        X = df[self.feature_names].copy()
        y = df[target_col].copy().astype(int)

        # Encode any categorical columns before splitting/scaling
        self.category_mappings = {}
        for col in self.feature_names:
            if not pd.api.types.is_numeric_dtype(X[col]):
                X[col] = self._encode_column(X[col], col, fit=True)

        # Stratified train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )

        # Handle physiological zero values in training split for Pima columns
        zero_sensitive_cols = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "bmi", "blood_glucose_level", "HbA1c_level"]
        self.medians = {}
        for col in self.feature_names:
            if col in zero_sensitive_cols:
                non_zero = X_train[col][X_train[col] > 0]
                median_val = float(non_zero.median()) if not non_zero.empty else float(X_train[col].median())
                self.medians[col] = median_val
                X_train[col] = X_train[col].replace(0, median_val)
                X_test[col] = X_test[col].replace(0, median_val)
            else:
                self.medians[col] = float(X_train[col].median())

        # Fill any NaNs with training median
        for col in self.feature_names:
            X_train[col] = X_train[col].fillna(self.medians[col])
            X_test[col] = X_test[col].fillna(self.medians[col])

        # Fit Scaler on training data only
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        return X_train_scaled, X_test_scaled, y_train.values, y_test.values

    def train(self, df: pd.DataFrame, dataset_name: str = "diabetes.csv", target_col: Optional[str] = None, c_regularization: float = 1.0, random_state: int = 42) -> Dict[str, Any]:
        self.dataset_name = dataset_name
        start_time = time.time()
        X_train, X_test, y_train, y_test = self.prepare_data(df, target_col, test_size=0.2, random_state=random_state)

        if self.algorithm == "logistic_regression":
            self.model = LogisticRegression(
                C=c_regularization,
                max_iter=1000,
                random_state=random_state,
                solver="lbfgs"
            )
        elif self.algorithm == "random_forest":
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=6,
                random_state=random_state,
                n_jobs=-1
            )
        else:
            raise ValueError(f"Unsupported classical algorithm: {self.algorithm}")

        self.model.fit(X_train, y_train)
        self.training_time = round(time.time() - start_time, 4)

        # Measure single-sample inference latency
        t0 = time.perf_counter()
        _ = self.model.predict_proba(X_test[:1])
        self.inference_latency_ms = round(max((time.perf_counter() - t0) * 1000, 0.12), 2)

        # Evaluate on held-out test data
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]

        eval_metrics = calculate_metrics(y_test, y_pred, y_prob)
        self.metrics = eval_metrics
        self.is_trained = True
        self.trained_at = datetime.now().isoformat()

        # Save artifacts
        self.save()

        return {
            "algorithm": self.algorithm,
            "dataset_name": self.dataset_name,
            "training_time_seconds": self.training_time,
            "inference_latency_ms": self.inference_latency_ms,
            "metrics": self.metrics,
            "test_samples": len(y_test),
            "features_used": self.feature_names
        }

    def save(self):
        prefix = self._get_save_prefix()
        bundle = {
            "algorithm": self.algorithm,
            "dataset_name": self.dataset_name,
            "model": self.model,
            "scaler": self.scaler,
            "medians": self.medians,
            "category_mappings": self.category_mappings,
            "feature_names": self.feature_names,
            "target_name": self.target_name,
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
        # Fallback to legacy path if needed
        if not os.path.exists(path) and self.dataset_name == "diabetes.csv":
            legacy_path = os.path.join(SAVED_MODELS_DIR, f"classical_{self.algorithm}_bundle.joblib")
            if os.path.exists(legacy_path):
                path = legacy_path

        if not os.path.exists(path):
            self.is_trained = False
            self.metrics = None
            return False
        try:
            bundle = joblib.load(path)
            self.algorithm = bundle["algorithm"]
            self.dataset_name = bundle.get("dataset_name", self.dataset_name)
            self.model = bundle["model"]
            self.scaler = bundle["scaler"]
            self.medians = bundle["medians"]
            self.category_mappings = bundle.get("category_mappings", {})
            self.feature_names = bundle["feature_names"]
            self.target_name = bundle["target_name"]
            self.metrics = bundle["metrics"]
            self.training_time = bundle["training_time"]
            self.trained_at = bundle["trained_at"]
            if "inference_latency_ms" in bundle and bundle["inference_latency_ms"]:
                self.inference_latency_ms = float(bundle["inference_latency_ms"])
            else:
                t0 = time.perf_counter()
                dummy = np.zeros((1, len(self.feature_names)))
                _ = self.model.predict_proba(dummy)
                self.inference_latency_ms = round(max((time.perf_counter() - t0) * 1000, 0.15), 2)
            self.is_trained = True
            return True
        except Exception:
            self.is_trained = False
            return False

    def predict(self, feature_input: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_trained or self.model is None:
            raise RuntimeError(f"Classical model '{self.algorithm}' is not trained for dataset '{self.dataset_name}'.")

        start_time = time.perf_counter()
        vector = []
        raw_display_values = []
        zero_sensitive = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "bmi", "blood_glucose_level", "HbA1c_level"]

        for f in self.feature_names:
            raw_val = feature_input.get(f, self.medians.get(f, 0.0))
            raw_display_values.append(raw_val)

            if f in self.category_mappings:
                mapping = self.category_mappings[f]
                if isinstance(raw_val, str) and raw_val.strip() in mapping:
                    num_val = mapping[raw_val.strip()]
                else:
                    try:
                        num_val = float(raw_val)
                    except Exception:
                        num_val = self.medians.get(f, 0.0)
            else:
                try:
                    num_val = float(raw_val)
                except Exception:
                    num_val = self.medians.get(f, 0.0)
                if f in zero_sensitive and (num_val <= 0 or pd.isna(num_val)):
                    num_val = self.medians.get(f, 0.0)

            vector.append(float(num_val))

        vector_df = pd.DataFrame([vector], columns=self.feature_names)
        vector_scaled = self.scaler.transform(vector_df)

        pred_class = int(self.model.predict(vector_scaled)[0])
        prob = float(self.model.predict_proba(vector_scaled)[0, 1])

        latency_ms = round(max((time.perf_counter() - start_time) * 1000, 0.15), 2)

        if prob < 0.35:
            risk_level = "Low Risk"
        elif prob < 0.65:
            risk_level = "Moderate Risk"
        else:
            risk_level = "High Risk"

        confidence_score = round(abs(prob - 0.5) * 2 * 100, 1)

        contributions = []
        if self.algorithm == "logistic_regression" and hasattr(self.model, "coef_"):
            coefs = self.model.coef_[0]
            impacts = coefs * vector_scaled[0]
            for idx, f in enumerate(self.feature_names):
                imp = float(impacts[idx])
                desc = "Increases screening risk score" if imp > 0 else "Reduces screening risk score"
                contributions.append({
                    "feature": f,
                    "value": raw_display_values[idx],
                    "weight_or_impact": round(imp, 4),
                    "importance_description": desc
                })
        elif self.algorithm == "random_forest" and hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
            for idx, f in enumerate(self.feature_names):
                imp = float(importances[idx])
                contributions.append({
                    "feature": f,
                    "value": raw_display_values[idx],
                    "weight_or_impact": round(imp, 4),
                    "importance_description": f"Ensemble tree split importance: {round(imp*100, 1)}%"
                })

        contributions.sort(key=lambda x: abs(x["weight_or_impact"]), reverse=True)

        ds_label = (
            "Clinical Diabetes Dataset (100,000 rows)"
            if "100" in self.dataset_name or "prediction" in self.dataset_name
            else "Pima Indians Diabetes (768 rows)" if self.dataset_name == "diabetes.csv"
            else self.dataset_name
        )

        explainability_method = (
            "Standardized Linear Log-Odds Contribution (beta_i * z_i)"
            if self.algorithm == "logistic_regression"
            else "Random Forest Gini Impurity Feature Importance"
        )

        return {
            "model_id": self.algorithm,
            "model_name": "Logistic Regression (Classical)" if self.algorithm == "logistic_regression" else "Random Forest (Classical)",
            "model_type": "classical",
            "predicted_class": pred_class,
            "predicted_label": "High Risk" if pred_class == 1 else "Low Risk",
            "probability": round(prob, 4),
            "risk_level": risk_level,
            "confidence_score": confidence_score,
            "latency_ms": latency_ms,
            "feature_contributions": contributions,
            "explainability_method": explainability_method,
            "dataset_version": ds_label,
            "disclaimer": "This prototype is intended for screening support and research demonstration only. It does not provide a medical diagnosis."
        }

