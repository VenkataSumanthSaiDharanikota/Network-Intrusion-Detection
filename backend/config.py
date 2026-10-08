from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
SAMPLES_DATA_DIR = DATA_DIR / "samples"
MODELS_DIR = BASE_DIR / "models"
DATABASE_PATH = BASE_DIR / "backend" / "database" / "nids.db"

# Model filenames
MODEL_FILE = MODELS_DIR / "best_model.joblib"
PREPROCESSOR_FILE = MODELS_DIR / "preprocessor.joblib"
LABEL_ENCODER_FILE = MODELS_DIR / "label_encoder.joblib"
METADATA_FILE = MODELS_DIR / "model_metadata.json"
METRICS_FILE = MODELS_DIR / "evaluation_metrics.json"
COMPARISON_FILE = MODELS_DIR / "model_comparison.json"

# Dataset Source Definitions
DATASET_NAME = "NSL-KDD (Canadian Institute for Cybersecurity, UNB)"
DATASET_URL = "https://www.unb.ca/cic/datasets/nsl.html"
DATASET_GITHUB_MIRROR = "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/KDDTrain%2B_20Percent.txt"
DATASET_TEST_MIRROR = "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/KDDTest%2B.txt"

# NSL-KDD Feature Column Names (41 network flow features + label + difficulty)
FEATURE_COLUMNS = [
    "duration", "protocol_type", "service", "flag", "src_bytes",
    "dst_bytes", "land", "wrong_fragment", "urgent", "hot",
    "num_failed_logins", "logged_in", "num_compromised", "root_shell",
    "su_attempted", "num_root", "num_file_creations", "num_shells",
    "num_access_files", "num_outbound_cmds", "is_host_login",
    "is_guest_login", "count", "srv_count", "serror_rate",
    "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate",
    "diff_srv_rate", "srv_diff_host_rate", "dst_host_count",
    "dst_host_srv_count", "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate", "dst_host_srv_serror_rate", "dst_host_rerror_rate",
    "dst_host_srv_rerror_rate"
]

ALL_COLUMNS = FEATURE_COLUMNS + ["label", "difficulty_level"]

# Categorical vs Numerical feature separation for preprocessing
CATEGORICAL_FEATURES = ["protocol_type", "service", "flag"]
NUMERICAL_FEATURES = [col for col in FEATURE_COLUMNS if col not in CATEGORICAL_FEATURES]

# Canonical Attack Mapping to 5 Major Categories (Normal, DoS, Probe, R2L, U2R)
ATTACK_CATEGORIES = {
    "normal": "Normal",
    # DoS Attacks
    "neptune": "DoS",
    "smurf": "DoS",
    "back": "DoS",
    "teardrop": "DoS",
    "pod": "DoS",
    "land": "DoS",
    "mailbomb": "DoS",
    "apache2": "DoS",
    "processtable": "DoS",
    "udpstorm": "DoS",
    # Probe Attacks
    "ipsweep": "Probe",
    "portsweep": "Probe",
    "nmap": "Probe",
    "satan": "Probe",
    "saint": "Probe",
    "mscan": "Probe",
    # R2L (Remote-to-Local) Attacks
    "warezclient": "R2L",
    "guess_passwd": "R2L",
    "warezmaster": "R2L",
    "imap": "R2L",
    "ftp_write": "R2L",
    "multihop": "R2L",
    "phf": "R2L",
    "spy": "R2L",
    "sendmail": "R2L",
    "named": "R2L",
    "snmpgetattack": "R2L",
    "snmpguess": "R2L",
    "worm": "R2L",
    "xlock": "R2L",
    "xsnoop": "R2L",
    # U2R (User-to-Root) Attacks
    "buffer_overflow": "U2R",
    "loadmodule": "U2R",
    "rootkit": "U2R",
    "perl": "U2R",
    "sqlattack": "U2R",
    "xterm": "U2R",
    "ps": "U2R"
}

# Supported classification modes: "binary" (Normal vs Malicious) or "multiclass" (Normal, DoS, Probe, R2L, U2R)
DEFAULT_CLASSIFICATION_MODE = "binary"

APP_VERSION = "1.0.0"
API_PREFIX = "/api"
