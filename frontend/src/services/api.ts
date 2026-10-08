import {
  SystemStatus,
  DatasetStatus,
  SampleFileInfo,
  ModelStatus,
  TrainingState,
  EvaluationMetrics,
  ModelComparisonData,
  FeatureImportanceItem,
  DetectionResult,
  DetectionSession,
  ClassDistributionData,
  ConfusionMatrixData,
  AnalyticsOverview
} from '../types';

const API_BASE = '/api';

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/system/status`);
  if (!res.ok) throw new Error(`Failed to fetch system status: ${res.statusText}`);
  return res.json();
}

export async function fetchDatasetStatus(): Promise<DatasetStatus> {
  const res = await fetch(`${API_BASE}/dataset/status`);
  if (!res.ok) throw new Error(`Failed to fetch dataset status: ${res.statusText}`);
  return res.json();
}

export async function triggerDownloadDataset(): Promise<DatasetStatus> {
  const res = await fetch(`${API_BASE}/dataset/download`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to download dataset: ${res.statusText}`);
  return res.json();
}

export async function triggerPrepareDataset(): Promise<any> {
  const res = await fetch(`${API_BASE}/dataset/prepare`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to prepare dataset: ${res.statusText}`);
  return res.json();
}

export async function fetchDatasetSamples(): Promise<SampleFileInfo[]> {
  const res = await fetch(`${API_BASE}/dataset/samples`);
  if (!res.ok) throw new Error(`Failed to list sample datasets: ${res.statusText}`);
  return res.json();
}

export function getSampleDownloadUrl(filename: string): string {
  return `${API_BASE}/dataset/samples/${filename}`;
}

export async function fetchModelStatus(): Promise<ModelStatus> {
  const res = await fetch(`${API_BASE}/model/status`);
  if (!res.ok) throw new Error(`Failed to fetch model status: ${res.statusText}`);
  return res.json();
}

export async function startModelTraining(mode: string = 'binary', sampleSize?: number): Promise<any> {
  const res = await fetch(`${API_BASE}/model/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, sample_size: sampleSize })
  });
  if (!res.ok) throw new Error(`Failed to start training: ${res.statusText}`);
  return res.json();
}

export async function fetchTrainStatus(): Promise<TrainingState> {
  const res = await fetch(`${API_BASE}/model/train/status`);
  if (!res.ok) throw new Error(`Failed to fetch training status: ${res.statusText}`);
  return res.json();
}

export async function fetchModelMetrics(): Promise<EvaluationMetrics> {
  const res = await fetch(`${API_BASE}/model/metrics`);
  if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.statusText}`);
  return res.json();
}

export async function fetchModelFeatures(): Promise<{ feature_importance: FeatureImportanceItem[] }> {
  const res = await fetch(`${API_BASE}/model/features`);
  if (!res.ok) throw new Error(`Failed to fetch features: ${res.statusText}`);
  return res.json();
}

export async function fetchModelComparison(): Promise<ModelComparisonData> {
  const res = await fetch(`${API_BASE}/model/comparison`);
  if (!res.ok) throw new Error(`Failed to fetch model comparison: ${res.statusText}`);
  return res.json();
}

export async function triggerReloadModel(): Promise<any> {
  const res = await fetch(`${API_BASE}/model/reload`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to reload model: ${res.statusText}`);
  return res.json();
}

export async function uploadTrafficCsv(file: File): Promise<{ success: boolean; data?: DetectionResult; error?: string; validation?: any }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/detection/upload`, {
    method: 'POST',
    body: formData
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.detail || `Upload failed with status ${res.status}`);
  }
  return json;
}

export async function fetchDetectionHistory(limit: number = 50): Promise<DetectionSession[]> {
  const res = await fetch(`${API_BASE}/detection/history?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch detection history: ${res.statusText}`);
  return res.json();
}

export async function fetchDetectionSession(sessionId: string): Promise<{ session: DetectionSession; records: any[] }> {
  const res = await fetch(`${API_BASE}/detection/session/${sessionId}`);
  if (!res.ok) throw new Error(`Failed to fetch session: ${res.statusText}`);
  return res.json();
}

export function getExportCsvUrl(sessionId: string): string {
  return `${API_BASE}/detection/session/${sessionId}/export`;
}

export async function fetchClassDistribution(): Promise<ClassDistributionData> {
  const res = await fetch(`${API_BASE}/analytics/class-distribution`);
  if (!res.ok) throw new Error(`Failed to fetch class distribution: ${res.statusText}`);
  return res.json();
}

export async function fetchConfusionMatrix(): Promise<{ confusion_matrix: ConfusionMatrixData; test_distribution: Record<string, number> }> {
  const res = await fetch(`${API_BASE}/analytics/confusion-matrix`);
  if (!res.ok) throw new Error(`Failed to fetch confusion matrix: ${res.statusText}`);
  return res.json();
}

export async function fetchFeatureImportance(): Promise<{ features: FeatureImportanceItem[] }> {
  const res = await fetch(`${API_BASE}/analytics/feature-importance`);
  if (!res.ok) throw new Error(`Failed to fetch feature importance: ${res.statusText}`);
  return res.json();
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE}/analytics/overview`);
  if (!res.ok) throw new Error(`Failed to fetch analytics overview: ${res.statusText}`);
  return res.json();
}
