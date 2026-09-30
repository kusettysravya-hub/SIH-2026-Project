import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from app.schemas.schemas import (
    DatasetSummary,
    ColumnStat,
    DatasetOption,
    FeatureDistribution,
    FeatureDistributionBin
)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))

DATASET_METADATA = {
    "diabetes.csv": {
        "label": "Dataset 1: Pima Indians Diabetes Dataset (768 rows)",
        "description": (
            "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK) Pima Indians Diabetes Dataset. "
            "768 adult female patients of Pima Indian heritage with 8 physiological diagnostic measurements "
            "(Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age) "
            "and binary Outcome (0/1). Note: Represents a specific historical cohort and is not a general sample of India's population."
        )
    },
    "diabetes_prediction_dataset.csv": {
        "label": "Dataset 2: Comprehensive Clinical Diabetes Dataset (100,000 rows)",
        "description": (
            "Large-Scale Electronic Health Record (EHR) Clinical Diabetes Prediction Dataset containing 100,000 patient records "
            "(100,001 lines with header) across 8 demographic & metabolic features: gender, age, hypertension, heart_disease, "
            "smoking_history, bmi, HbA1c_level, blood_glucose_level, and binary target diabetes (0/1)."
        )
    }
}

FEATURE_UNITS = {
    "Glucose": "mg/dL",
    "blood_glucose_level": "mg/dL",
    "HbA1c_level": "%",
    "BMI": "kg/m²",
    "bmi": "kg/m²",
    "Age": "years",
    "age": "years",
    "BloodPressure": "mm Hg",
    "Insulin": "μU/mL",
    "DiabetesPedigreeFunction": "score"
}

class DatasetService:
    def __init__(self):
        self.data_dir = DATA_DIR
        os.makedirs(self.data_dir, exist_ok=True)
        if os.path.exists(os.path.join(self.data_dir, "diabetes_prediction_dataset.csv")):
            self.active_filename = "diabetes_prediction_dataset.csv"
        else:
            self.active_filename = "diabetes.csv"
        self._cached_dfs: Dict[str, pd.DataFrame] = {}
        self._cached_summaries: Dict[str, DatasetSummary] = {}

    def get_active_filepath(self) -> str:
        return os.path.join(self.data_dir, self.active_filename)

    def detect_target_column(self, df: pd.DataFrame) -> str:
        for candidate in ["Outcome", "diabetes", "target", "label", "Outcome_Class"]:
            if candidate in df.columns:
                return candidate
        return df.columns[-1]

    def load_dataframe(self, filename: Optional[str] = None, force_reload: bool = False) -> pd.DataFrame:
        fname = filename or self.active_filename
        filepath = os.path.join(self.data_dir, fname)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Dataset '{fname}' not found at {filepath}")

        if fname not in self._cached_dfs or force_reload:
            self._cached_dfs[fname] = pd.read_csv(filepath)
            self._cached_summaries.pop(fname, None)
        return self._cached_dfs[fname]

    def list_available_datasets(self) -> List[DatasetOption]:
        options: List[DatasetOption] = []
        if not os.path.exists(self.data_dir):
            return options

        csv_files = sorted([f for f in os.listdir(self.data_dir) if f.endswith(".csv")])
        for fname in csv_files:
            fpath = os.path.join(self.data_dir, fname)
            size_kb = round(os.path.getsize(fpath) / 1024.0, 1)
            try:
                df = self.load_dataframe(fname)
                rows, cols = df.shape
            except Exception:
                rows, cols = 0, 0

            meta = DATASET_METADATA.get(fname, {})
            label = meta.get("label", f"Custom Dataset: {fname} ({rows:,} rows)")
            options.append(DatasetOption(
                filename=fname,
                label=label,
                rows=rows,
                columns=cols,
                size_kb=size_kb,
                is_active=(fname == self.active_filename)
            ))
        return options

    def select_dataset(self, filename: str) -> DatasetSummary:
        fpath = os.path.join(self.data_dir, filename)
        if not os.path.exists(fpath):
            raise ValueError(f"Dataset '{filename}' does not exist in {self.data_dir}")
        self.active_filename = filename
        self.load_dataframe(filename)
        return self.get_summary()

    def _compute_feature_distributions(self, df: pd.DataFrame, target_col: str) -> List[FeatureDistribution]:
        distributions: List[FeatureDistribution] = []
        preferred = ["HbA1c_level", "blood_glucose_level", "Glucose", "bmi", "BMI", "age", "Age"]
        num_cols = [c for c in preferred if c in df.columns and c != target_col]
        if len(num_cols) < 6:
            extra = [c for c in df.columns if c != target_col and pd.api.types.is_numeric_dtype(df[c]) and c not in num_cols]
            num_cols.extend(extra)
        selected_cols = num_cols[:6]

        for col in selected_cols:
            s = df[col].dropna()
            if col in ["Glucose", "BMI", "BloodPressure", "SkinThickness", "Insulin"]:
                s = s[s > 0]
            if s.empty:
                continue

            counts_all, bin_edges = np.histogram(s, bins=6)
            sub_df = df.loc[s.index, [col, target_col]]
            neg_vals = sub_df[sub_df[target_col] == 0][col]
            pos_vals = sub_df[sub_df[target_col] == 1][col]

            neg_counts, _ = np.histogram(neg_vals, bins=bin_edges)
            pos_counts, _ = np.histogram(pos_vals, bins=bin_edges)

            bins_list: List[FeatureDistributionBin] = []
            for i in range(len(bin_edges) - 1):
                low = bin_edges[i]
                high = bin_edges[i + 1]
                if col in ["HbA1c_level", "DiabetesPedigreeFunction"]:
                    label = f"{low:.1f}–{high:.1f}"
                else:
                    label = f"{int(round(low))}–{int(round(high))}"
                bins_list.append(FeatureDistributionBin(
                    bin_label=label,
                    negative_count=int(neg_counts[i]),
                    positive_count=int(pos_counts[i]),
                    total_count=int(neg_counts[i] + pos_counts[i])
                ))

            distributions.append(FeatureDistribution(
                feature=col,
                unit=FEATURE_UNITS.get(col, ""),
                bins=bins_list
            ))

        return distributions

    def get_summary(self) -> DatasetSummary:
        filename = self.active_filename
        if filename in self._cached_summaries:
            cached = self._cached_summaries[filename]
            cached.available_datasets = self.list_available_datasets()
            return cached

        df = self.load_dataframe()
        total_rows, total_columns = df.shape
        duplicate_rows = int(df.duplicated().sum())
        target_column = self.detect_target_column(df)
        feature_names = [col for col in df.columns if col != target_column]

        column_stats: List[ColumnStat] = []
        for col in df.columns:
            s = df[col]
            is_num = pd.api.types.is_numeric_dtype(s)
            zero_count = int((s == 0).sum()) if is_num else 0
            null_count = int(s.isnull().sum())
            mean_val = float(s.mean()) if is_num and not s.empty else None
            min_val = float(s.min()) if is_num and not s.empty else None
            max_val = float(s.max()) if is_num and not s.empty else None
            categories = None
            if not is_num:
                categories = [str(v) for v in s.dropna().unique()[:15]]

            column_stats.append(ColumnStat(
                name=col,
                dtype=str(s.dtype),
                null_count=null_count,
                zero_count=zero_count,
                mean=round(mean_val, 2) if mean_val is not None else None,
                min=round(min_val, 2) if min_val is not None else None,
                max=round(max_val, 2) if max_val is not None else None,
                categories=categories
            ))

        class_dist_raw = df[target_column].value_counts().to_dict()
        class_distribution = {str(k): int(v) for k, v in class_dist_raw.items()}

        feature_distributions = self._compute_feature_distributions(df, target_column)
        preview_records = df.head(10).replace({np.nan: None}).to_dict(orient="records")

        meta = DATASET_METADATA.get(filename, {})
        description = meta.get(
            "description",
            f"User-uploaded clinical dataset ({filename}) with {total_rows:,} records and {len(feature_names)} predictive features."
        )

        summary = DatasetSummary(
            filename=filename,
            total_rows=total_rows,
            total_columns=total_columns,
            duplicate_rows=duplicate_rows,
            target_column=target_column,
            feature_names=feature_names,
            column_stats=column_stats,
            class_distribution=class_distribution,
            feature_distributions=feature_distributions,
            sample_preview=preview_records,
            is_default=(filename in DATASET_METADATA),
            description=description,
            available_datasets=self.list_available_datasets()
        )
        self._cached_summaries[filename] = summary
        return summary

    def save_upload(self, filename: str, content: bytes) -> Dict[str, Any]:
        import io
        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise ValueError(f"Uploaded file is not a valid readable CSV: {str(e)}")

        if df.shape[0] < 10:
            raise ValueError("Dataset is too small; minimum 10 rows required for ML training.")
        if df.shape[1] < 2:
            raise ValueError("Dataset must have at least 1 feature column and 1 target column.")

        safe_name = os.path.basename(filename).replace(" ", "_")
        if not safe_name.endswith(".csv"):
            safe_name += ".csv"

        target_path = os.path.join(self.data_dir, safe_name)
        with open(target_path, "wb") as f:
            f.write(content)

        self.active_filename = safe_name
        self._cached_dfs[safe_name] = df
        self._cached_summaries.pop(safe_name, None)
        return {
            "filename": safe_name,
            "rows": df.shape[0],
            "columns": df.shape[1]
        }

    def reset_to_default(self):
        self.active_filename = "diabetes.csv"
        return self.get_summary()

dataset_service = DatasetService()
