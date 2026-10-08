# System Architecture — Network Intrusion Detection System (NIDS)

## 1. High-Level Architecture Overview

This application adheres to a decoupled client-server architecture designed for high throughput, reproducibility, and local offline deployment without external cloud API dependencies.

```mermaid
graph TD
    User([Security Analyst / Evaluator]) -->|Browser Interface| FE[React + Vite Frontend (Port 5173)]
    FE -->|REST API Requests / Multipart Upload| BE[FastAPI Backend (Port 8000)]
    
    subgraph Backend Services
        BE --> API[FastAPI Route Handlers]
        API --> DM[Dataset Manager]
        API --> TR[Model Trainer & Evaluator]
        API --> INF[Inference Engine]
        API --> DB[(SQLite Database: nids.db)]
    end
    
    subgraph Machine Learning Pipeline
        DM -->|Read Raw Flows| RAW[(NSL-KDD Raw / Slices)]
        TR -->|Fit on Training Data| PP[NIDS Preprocessor Pipeline]
        PP -->|Transformed Vectors| CLF[Candidate Models: LR, RF, HistGB]
        CLF -->|Macro F1 Ranking| CHAMP[Champion Model Selection]
        CHAMP -->|Persist| ART[(Joblib Artifacts: models/)]
        INF -->|Load Artifacts| ART
    end
```

---

## 2. Component Specifications

### 2.1 Frontend Client
- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS with custom dark cybersecurity surface tokens.
- **Visualization**: Recharts for telemetry trendlines, multi-model comparison bars, and feature contribution charts.
- **State Management**: Reactive React hooks with periodic status polling to mirror real backend state without synthetic animation locks.

### 2.2 Backend Application
- **Server**: FastAPI running on Uvicorn ASGI.
- **CORS Configuration**: Wildcard and local origin bindings for smooth local pairing.
- **Lifecycle Management**: Auto-initialization of SQLite tables and automated in-memory warm-up of saved Joblib models upon application boot.

### 2.3 Storage Layer
- **SQLite Database (`backend/database/nids.db`)**:
  - `detection_sessions`: Records session metadata, timestamps, flow tallies, threat ratio, and model version.
  - `detection_records`: Stores individual connection prediction verdicts, attack category mappings, and calibrated probability scores.
  - `training_history`: Stores chronological audit logs of model training runs, evaluated metrics, and training run durations.
- **Joblib Model Store (`models/`)**:
  - `best_model.joblib`: Serialized champion Scikit-Learn classifier.
  - `preprocessor.joblib`: Preprocessing pipeline containing numerical scalers and categorical encoders fitted exclusively on training data.
  - `label_encoder.joblib`: Class index to string label translator.
  - `model_metadata.json`: Model version, training parameters, hyperparameters, and feature catalog.
  - `evaluation_metrics.json`: Full held-out test evaluation report, confusion matrix, and feature importances.
  - `model_comparison.json`: Comparative benchmark of all evaluated candidate models.
