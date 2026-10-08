import numpy as np
import pandas as pd
from typing import List, Tuple, Optional
import joblib

from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

from backend.config import (
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    FEATURE_COLUMNS,
    PREPROCESSOR_FILE
)

class DataCleaner(BaseEstimator, TransformerMixin):
    """
    Cleans raw network traffic data:
    - Replaces +/- np.inf with np.nan
    - Strips whitespace from string/categorical fields
    - Ensures valid numerical types
    """
    def __init__(self, categorical_cols: List[str], numerical_cols: List[str]):
        self.categorical_cols = categorical_cols
        self.numerical_cols = numerical_cols
        
    def fit(self, X, y=None):
        return self
        
    def transform(self, X):
        df = X.copy()
        if not isinstance(df, pd.DataFrame):
            df = pd.DataFrame(df)
            
        # Clean numerical columns
        for col in self.numerical_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                df[col] = df[col].replace([np.inf, -np.inf], np.nan)
                
        # Clean categorical columns
        for col in self.categorical_cols:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip().str.lower()
                
        return df

class NIDSPreprocessor:
    """
    Genuine Scikit-Learn preprocessing pipeline for Network Intrusion Detection:
    - Independent pipelines for numerical and categorical variables
    - Median imputation + StandardScaler for numerical flow features
    - Constant imputation + OneHotEncoder(handle_unknown='ignore') for protocol/service/flag
    - Fully reusable for inference without data leakage
    """
    def __init__(self):
        self.categorical_features = CATEGORICAL_FEATURES
        self.numerical_features = NUMERICAL_FEATURES
        self.feature_columns = FEATURE_COLUMNS
        self.pipeline: Optional[Pipeline] = None
        self.transformed_feature_names: List[str] = []
        
    def _build_pipeline(self) -> Pipeline:
        num_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        cat_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        preprocessor = ColumnTransformer(transformers=[
            ('num', num_transformer, self.numerical_features),
            ('cat', cat_transformer, self.categorical_features)
        ])
        
        full_pipeline = Pipeline(steps=[
            ('cleaner', DataCleaner(self.categorical_features, self.numerical_features)),
            ('col_transform', preprocessor)
        ])
        
        return full_pipeline

    def fit(self, X: pd.DataFrame) -> 'NIDSPreprocessor':
        # Select and order required feature columns
        X_features = X[self.feature_columns].copy()
        self.pipeline = self._build_pipeline()
        self.pipeline.fit(X_features)
        
        # Extract transformed feature names
        col_transformer = self.pipeline.named_steps['col_transform']
        cat_names = col_transformer.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(self.categorical_features)
        self.transformed_feature_names = list(self.numerical_features) + list(cat_names)
        
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        if self.pipeline is None:
            raise RuntimeError("Preprocessor must be fitted or loaded before calling transform.")
        X_features = X[self.feature_columns].copy()
        return self.pipeline.transform(X_features)

    def fit_transform(self, X: pd.DataFrame) -> np.ndarray:
        self.fit(X)
        return self.transform(X)

    def save(self, filepath=PREPROCESSOR_FILE):
        PREPROCESSOR_FILE.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            'pipeline': self.pipeline,
            'transformed_feature_names': self.transformed_feature_names,
            'feature_columns': self.feature_columns,
            'categorical_features': self.categorical_features,
            'numerical_features': self.numerical_features
        }, filepath)

    @classmethod
    def load(cls, filepath=PREPROCESSOR_FILE) -> 'NIDSPreprocessor':
        if not filepath.exists():
            raise FileNotFoundError(f"Preprocessor artifact not found at {filepath}")
        data = joblib.load(filepath)
        instance = cls()
        instance.pipeline = data['pipeline']
        instance.transformed_feature_names = data['transformed_feature_names']
        instance.feature_columns = data['feature_columns']
        instance.categorical_features = data['categorical_features']
        instance.numerical_features = data['numerical_features']
        return instance
