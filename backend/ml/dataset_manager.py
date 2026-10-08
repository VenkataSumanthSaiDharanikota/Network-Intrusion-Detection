import os
import urllib.request
import ssl
from typing import Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np

from backend.config import (
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    SAMPLES_DATA_DIR,
    ALL_COLUMNS,
    FEATURE_COLUMNS,
    DATASET_NAME,
    DATASET_URL,
    DATASET_GITHUB_MIRROR,
    DATASET_TEST_MIRROR,
    ATTACK_CATEGORIES
)

TRAIN_FILE = RAW_DATA_DIR / "KDDTrain+.txt"
TEST_FILE = RAW_DATA_DIR / "KDDTest+.txt"

def get_dataset_status() -> Dict[str, Any]:
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    SAMPLES_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    train_exists = TRAIN_FILE.exists()
    test_exists = TEST_FILE.exists()
    is_available = train_exists and test_exists
    
    record_count = 0
    test_record_count = 0
    train_size_mb = 0.0
    test_size_mb = 0.0
    class_distribution = {}
    
    if train_exists:
        train_size_mb = round(TRAIN_FILE.stat().st_size / (1024 * 1024), 2)
        try:
            # Quick row count
            with open(TRAIN_FILE, "r", encoding="utf-8", errors="ignore") as f:
                record_count = sum(1 for _ in f)
        except Exception:
            pass
            
    if test_exists:
        test_size_mb = round(TEST_FILE.stat().st_size / (1024 * 1024), 2)
        try:
            with open(TEST_FILE, "r", encoding="utf-8", errors="ignore") as f:
                test_record_count = sum(1 for _ in f)
        except Exception:
            pass

    # Check if pre-computed summary exists
    summary_file = PROCESSED_DATA_DIR / "dataset_summary.json"
    if summary_file.exists():
        import json
        with open(summary_file, "r") as f:
            saved_summary = json.load(f)
            class_distribution = saved_summary.get("class_distribution", {})

    return {
        "dataset_name": DATASET_NAME,
        "dataset_url": DATASET_URL,
        "is_available": is_available,
        "train_file": str(TRAIN_FILE.name) if train_exists else None,
        "test_file": str(TEST_FILE.name) if test_exists else None,
        "train_records": record_count,
        "test_records": test_record_count,
        "total_records": record_count + test_record_count,
        "num_features": len(FEATURE_COLUMNS),
        "train_size_mb": train_size_mb,
        "test_size_mb": test_size_mb,
        "class_distribution": class_distribution,
        "setup_required": not is_available
    }

def download_dataset(force: bool = False) -> Dict[str, Any]:
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    train_exists = TRAIN_FILE.exists() and TRAIN_FILE.stat().st_size > 100000
    test_exists = TEST_FILE.exists() and TEST_FILE.stat().st_size > 100000
    
    if not (train_exists and test_exists) or force:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        headers = {"User-Agent": "Mozilla/5.0 (NIDS Research Client)"}
        
        # 1. Download Train dataset
        req_train = urllib.request.Request(DATASET_GITHUB_MIRROR, headers=headers)
        with urllib.request.urlopen(req_train, timeout=30, context=ctx) as resp, open(TRAIN_FILE, "wb") as f:
            f.write(resp.read())
            
        # 2. Download Test dataset
        req_test = urllib.request.Request(DATASET_TEST_MIRROR, headers=headers)
        with urllib.request.urlopen(req_test, timeout=30, context=ctx) as resp, open(TEST_FILE, "wb") as f:
            f.write(resp.read())
            
    # Generate sample evaluation CSVs from the test set for user testing
    prepare_dataset_and_samples()
    
    return get_dataset_status()

def load_raw_dataset() -> Tuple[pd.DataFrame, pd.DataFrame]:
    if not TRAIN_FILE.exists() or not TEST_FILE.exists():
        raise FileNotFoundError(
            f"Dataset files not found in {RAW_DATA_DIR}. Please download or prepare dataset first."
        )
        
    train_df = pd.read_csv(TRAIN_FILE, header=None, names=ALL_COLUMNS)
    test_df = pd.read_csv(TEST_FILE, header=None, names=ALL_COLUMNS)
    return train_df, test_df

def prepare_dataset_and_samples() -> Dict[str, Any]:
    train_df, test_df = load_raw_dataset()
    
    # Map labels to attack category
    train_df["attack_category"] = train_df["label"].map(
        lambda l: ATTACK_CATEGORIES.get(str(l).lower().strip(), "Other")
    )
    test_df["attack_category"] = test_df["label"].map(
        lambda l: ATTACK_CATEGORIES.get(str(l).lower().strip(), "Other")
    )
    
    # Binary label: 0 for normal, 1 for malicious
    train_df["is_malicious"] = (train_df["label"] != "normal").astype(int)
    test_df["is_malicious"] = (test_df["label"] != "normal").astype(int)
    
    # Compute class distribution
    class_distribution = train_df["attack_category"].value_counts().to_dict()
    
    # Save processed summaries
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    import json
    with open(PROCESSED_DATA_DIR / "dataset_summary.json", "w") as f:
        json.dump({
            "class_distribution": class_distribution,
            "train_samples": len(train_df),
            "test_samples": len(test_df),
            "feature_columns": FEATURE_COLUMNS
        }, f, indent=2)
        
    # Create sample CSVs in data/samples/ for user to upload & test inference
    SAMPLES_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Normal traffic sample (100 records)
    normal_records = test_df[test_df["label"] == "normal"].head(100)
    normal_csv_path = SAMPLES_DATA_DIR / "sample_normal_traffic.csv"
    normal_records[FEATURE_COLUMNS].to_csv(normal_csv_path, index=False)
    
    # 2. DoS attack traffic sample (100 records)
    dos_records = test_df[test_df["attack_category"] == "DoS"].head(100)
    dos_csv_path = SAMPLES_DATA_DIR / "sample_dos_attack_traffic.csv"
    dos_records[FEATURE_COLUMNS].to_csv(dos_csv_path, index=False)
    
    # 3. Mixed traffic sample (250 records: normal, dos, probe, r2l, u2r)
    mixed_records = test_df.sample(n=min(250, len(test_df)), random_state=42)
    mixed_csv_path = SAMPLES_DATA_DIR / "sample_mixed_network_traffic.csv"
    mixed_records[FEATURE_COLUMNS].to_csv(mixed_csv_path, index=False)
    
    return {
        "status": "ready",
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "class_distribution": class_distribution,
        "sample_files": [
            str(normal_csv_path.name),
            str(dos_csv_path.name),
            str(mixed_csv_path.name)
        ]
    }
