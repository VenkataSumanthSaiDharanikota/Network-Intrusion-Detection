import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from backend.config import DATABASE_PATH

def get_connection() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

_db_initialized = False

def ensure_db():
    global _db_initialized
    if not _db_initialized:
        init_db()
        _db_initialized = True

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Table for detection sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS detection_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        timestamp TEXT NOT NULL,
        filename TEXT NOT NULL,
        total_records INTEGER NOT NULL,
        normal_count INTEGER NOT NULL,
        malicious_count INTEGER NOT NULL,
        model_name TEXT NOT NULL,
        model_version TEXT NOT NULL,
        attack_breakdown TEXT,
        avg_confidence REAL
    );
    """)
    
    # Table for individual record predictions per session
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS detection_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        record_index INTEGER NOT NULL,
        protocol_type TEXT,
        service TEXT,
        flag TEXT,
        src_bytes REAL,
        dst_bytes REAL,
        predicted_class TEXT NOT NULL,
        attack_category TEXT NOT NULL,
        confidence REAL NOT NULL,
        FOREIGN KEY (session_id) REFERENCES detection_sessions(session_id)
    );
    """)
    
    # Table for training run history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS training_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        model_name TEXT NOT NULL,
        accuracy REAL NOT NULL,
        precision REAL NOT NULL,
        recall REAL NOT NULL,
        f1_score REAL NOT NULL,
        train_records INTEGER NOT NULL,
        test_records INTEGER NOT NULL,
        details TEXT
    );
    """)
    
    conn.commit()
    conn.close()

def save_detection_session(
    session_id: str,
    filename: str,
    total_records: int,
    normal_count: int,
    malicious_count: int,
    model_name: str,
    model_version: str,
    attack_breakdown: Dict[str, int],
    avg_confidence: float,
    sample_records: Optional[List[Dict[str, Any]]] = None
):
    ensure_db()
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    
    cursor.execute("""
    INSERT INTO detection_sessions 
    (session_id, timestamp, filename, total_records, normal_count, malicious_count, model_name, model_version, attack_breakdown, avg_confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id,
        now_iso,
        filename,
        total_records,
        normal_count,
        malicious_count,
        model_name,
        model_version,
        json.dumps(attack_breakdown),
        avg_confidence
    ))
    
    if sample_records:
        for rec in sample_records:
            cursor.execute("""
            INSERT INTO detection_records
            (session_id, record_index, protocol_type, service, flag, src_bytes, dst_bytes, predicted_class, attack_category, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id,
                rec.get("record_index", 0),
                str(rec.get("protocol_type", "")),
                str(rec.get("service", "")),
                str(rec.get("flag", "")),
                float(rec.get("src_bytes", 0.0)),
                float(rec.get("dst_bytes", 0.0)),
                str(rec.get("predicted_class", "")),
                str(rec.get("attack_category", "")),
                float(rec.get("confidence", 0.0))
            ))
            
    conn.commit()
    conn.close()

def get_all_detection_sessions(limit: int = 50) -> List[Dict[str, Any]]:
    ensure_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM detection_sessions ORDER BY id DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "session_id": r["session_id"],
            "timestamp": r["timestamp"],
            "filename": r["filename"],
            "total_records": r["total_records"],
            "normal_count": r["normal_count"],
            "malicious_count": r["malicious_count"],
            "model_name": r["model_name"],
            "model_version": r["model_version"],
            "attack_breakdown": json.loads(r["attack_breakdown"]) if r["attack_breakdown"] else {},
            "avg_confidence": r["avg_confidence"]
        })
    conn.close()
    return results

def get_detection_session_records(session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    ensure_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM detection_records WHERE session_id = ? ORDER BY record_index ASC LIMIT ?
    """, (session_id, limit))
    rows = cursor.fetchall()
    results = [dict(r) for r in rows]
    conn.close()
    return results

def save_training_run(model_name: str, metrics: Dict[str, Any], train_records: int, test_records: int):
    ensure_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO training_history
    (timestamp, model_name, accuracy, precision, recall, f1_score, train_records, test_records, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.now().isoformat(),
        model_name,
        metrics.get("accuracy", 0.0),
        metrics.get("precision", 0.0),
        metrics.get("recall", 0.0),
        metrics.get("f1_score", 0.0),
        train_records,
        test_records,
        json.dumps(metrics)
    ))
    conn.commit()
    conn.close()

def get_training_history(limit: int = 20) -> List[Dict[str, Any]]:
    ensure_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM training_history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "model_name": r["model_name"],
            "accuracy": r["accuracy"],
            "precision": r["precision"],
            "recall": r["recall"],
            "f1_score": r["f1_score"],
            "train_records": r["train_records"],
            "test_records": r["test_records"],
            "details": json.loads(r["details"]) if r["details"] else {}
        })
    conn.close()
    return results
