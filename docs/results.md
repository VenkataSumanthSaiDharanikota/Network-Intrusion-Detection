# Benchmark Results & Model Evaluation Report

This document details the rigorous evaluation of the Network Intrusion Detection System (NIDS) classifiers on the held-out test split of the NSL-KDD benchmark dataset.

---

## 1. Benchmark Dataset Overview

- **Dataset**: Canadian Institute for Cybersecurity (CIC) NSL-KDD Benchmark
- **Training Set (`KDDTrain+.txt`)**: 25,192 records
- **Held-Out Test Set (`KDDTest+.txt`)**: 22,544 records
  - **Normal Connections**: 12,833 flows (56.9%)
  - **Malicious Connections**: 9,711 flows (43.1%)
- **Feature Dimensionality**: 41 network flow attributes (38 numeric, 3 categorical)
- **Zero-Leakage Enforcement**: All scalers and encoders are fitted strictly on the training partition and evaluated out-of-sample on the test partition.

---

## 2. Multi-Algorithm Model Comparison

All three candidate models were trained on the identical training set and evaluated on the 22,544 test records:

| Model Algorithm | Accuracy | Precision | Recall | Macro F1 | Weighted F1 | Training Time | Verdict |
|---|---|---|---|---|---|---|---|
| **Logistic Regression (L2)** | 75.08% | 64.73% | 92.61% | 0.7502 | 0.7486 | 0.77s | Linear Baseline |
| **Random Forest (100 Trees)** | 77.11% | 65.86% | 97.30% | 0.7700 | 0.7679 | 0.65s | Non-Linear Ensemble |
| **HistGradientBoosting** | **78.86%** | **67.74%** | **97.22%** | **0.7881** | **0.7866** | **2.05s** | **Champion Selected** |

### Selection Rationale
In network intrusion detection, false negatives (failing to alert on active attacks) carry far higher operational consequences than false positives. **HistGradientBoosting** achieved the highest **Macro F1-Score (0.7881)** and an outstanding **97.22% Recall** on malicious intrusions, while maintaining fast sub-millisecond per-flow inference latency.

---

## 3. Champion Model Detailed Performance

- **Champion Architecture**: Histogram-based Gradient Boosted Decision Trees (`HistGradientBoostingClassifier`)
- **Evaluated Test Records**: 22,544
- **Overall Accuracy**: **78.86%**
- **Macro F1-Score**: **0.7881**
- **Weighted F1-Score**: **0.7866**
- **Macro Precision**: **82.30%**
- **Macro Recall**: **81.09%**

### 3.1 Confusion Matrix (Held-out Test Set)

```
                     Predicted Normal     Predicted Malicious
Actual Normal            8,337                   4,496
Actual Malicious           270                   9,441
```

- **True Negatives (Normal correctly identified)**: 8,337
- **False Positives (Normal flagged as malicious)**: 4,496
- **False Negatives (Malicious attacks missed)**: 270 (only 2.78% of all attacks missed!)
- **True Positives (Malicious attacks detected)**: 9,441 (97.22% detection rate)

### 3.2 Classification Report

| Class | Precision | Recall | F1-Score | Support (Records) |
|---|---|---|---|---|
| **Normal** | 0.9686 (96.86%) | 0.6497 (64.97%) | 0.7777 | 12,833 |
| **Malicious** | 0.6774 (67.74%) | 0.9722 (97.22%) | 0.7985 | 9,711 |
| **Macro Average** | **0.8230** | **0.8109** | **0.7881** | **22,544** |
| **Weighted Average** | **0.8432** | **0.7886** | **0.7866** | **22,544** |

---

## 4. Feature Importance Analysis

Feature permutation importance demonstrates the network flow metrics that contribute most strongly to threat verdicts:

| Rank | Feature | Description | Importance | Contribution |
|---|---|---|---|---|
| 1 | `src_bytes` | Source-to-destination byte volume | 0.6654 | **66.54%** |
| 2 | `dst_host_serror_rate` | SYN error rate across destination host connections | 0.0940 | **9.40%** |
| 3 | `dst_bytes` | Destination-to-source payload byte count | 0.0827 | **8.27%** |
| 4 | `duration` | Total elapsed duration of connection (seconds) | 0.0564 | **5.64%** |
| 5 | `hot` | Number of "hot" indicator access calls | 0.0338 | **3.38%** |
| 6 | `flag_s0` | Connection SYN attempt with no reply (SYN flood) | 0.0338 | **3.38%** |
| 7 | `dst_host_srv_serror_rate` | SYN error rate to the specific destination port | 0.0263 | **2.63%** |
| 8 | `service_ecr_i` | ICMP echo-request traffic service flag | 0.0075 | **0.75%** |

---

## 5. UI Output Screenshots

The system provides interactive visualization and diagnostic reports across its web frontend:

### Dashboard Telemetry & System Status
![Dashboard](screenshots/01_dashboard.png)

### Real-Time Detection Output (250 Flows Analyzed)
![Detection Output](screenshots/02_detection_results.png)

### Model Comparison & Confusion Matrix Analytics
![Analytics](screenshots/03_analytics_confusion_matrix.png)

### Model Management & Champion Specification
![Model Management](screenshots/04_model_evaluation.png)

### Dataset Telemetry & Benchmark Inspection
![Dataset Telemetry](screenshots/05_dataset_telemetry.png)
