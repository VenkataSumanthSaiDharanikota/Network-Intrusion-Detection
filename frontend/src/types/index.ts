export interface SystemStatus {
  backend_connected: boolean;
  app_version: string;
  os: string;
  python_version: string;
  dataset_available: boolean;
  dataset_name: string;
  model_trained: boolean;
  total_historical_sessions: number;
  total_historical_records_analyzed: number;
  total_historical_malicious_detected: number;
  system_time: string;
}

export interface DatasetStatus {
  dataset_name: string;
  dataset_url: string;
  is_available: boolean;
  train_file: string | null;
  test_file: string | null;
  train_records: number;
  test_records: number;
  total_records: number;
  num_features: number;
  train_size_mb: number;
  test_size_mb: number;
  class_distribution: Record<string, number>;
  setup_required: boolean;
}

export interface SampleFileInfo {
  filename: string;
  size_kb: number;
  description: string;
}

export interface TrainingState {
  is_training: boolean;
  current_step: string;
  progress_percent: number;
  error: string | null;
  last_completed: string | null;
}

export interface ModelMetadata {
  model_name: string;
  version: string;
  mode: string;
  trained_at: string;
  dataset_name: string;
  train_samples: number;
  test_samples: number;
  num_features: number;
  num_transformed_features: number;
  classes: string[];
  selection_criteria: string;
  hyperparameters: Record<string, string>;
}

export interface ModelStatus {
  is_trained: boolean;
  metadata: ModelMetadata;
  training_state: TrainingState;
}

export interface FeatureImportanceItem {
  rank: number;
  feature: string;
  importance: number;
  percentage: number;
}

export interface ConfusionMatrixData {
  matrix: number[][];
  labels: string[];
}

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  macro_f1: number;
  weighted_f1: number;
  macro_precision: number;
  macro_recall: number;
  confusion_matrix: ConfusionMatrixData;
  classification_report: Record<string, any>;
  test_distribution: Record<string, number>;
  test_records: number;
  feature_importance?: FeatureImportanceItem[];
}

export interface ModelComparisonItem {
  model_name: string;
  description: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  macro_f1: number;
  weighted_f1: number;
  training_time_sec: number;
}

export interface ModelComparisonData {
  selected_model: string;
  selection_criteria: string;
  evaluated_at: string;
  models: ModelComparisonItem[];
}

export interface DetectionRecord {
  record_index: number;
  protocol_type: string;
  service: string;
  flag: string;
  src_bytes: number;
  dst_bytes: number;
  duration: number;
  predicted_class: "Normal" | "Malicious";
  attack_category: string;
  confidence: number;
}

export interface DetectionResult {
  status: string;
  session_id: string;
  filename: string;
  model_used: string;
  model_version: string;
  total_records: number;
  normal_count: number;
  malicious_count: number;
  normal_percentage: number;
  malicious_percentage: number;
  average_confidence: number;
  attack_breakdown: Record<string, number>;
  records: DetectionRecord[];
}

export interface DetectionSession {
  id: number;
  session_id: string;
  timestamp: string;
  filename: string;
  total_records: number;
  normal_count: number;
  malicious_count: number;
  model_name: string;
  model_version: string;
  attack_breakdown: Record<string, number>;
  avg_confidence: number;
}

export interface ClassDistributionData {
  dataset_distribution: Record<string, number>;
  detection_distribution: Record<string, number>;
  total_historical_detected: number;
}

export interface AnalyticsOverview {
  total_sessions: number;
  total_records_analyzed: number;
  total_normal: number;
  total_malicious: number;
  malicious_rate_pct: number;
  model_accuracy: number | null;
  model_macro_f1: number | null;
  model_precision: number | null;
  model_recall: number | null;
}
