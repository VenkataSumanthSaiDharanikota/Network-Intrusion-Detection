import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Layers,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  TrendingUp,
  Award,
  Sliders,
  ArrowRight
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { EmptyState } from '../components/EmptyState';
import {
  ModelStatus,
  EvaluationMetrics,
  ModelComparisonData,
  FeatureImportanceItem
} from '../types';
import {
  fetchModelStatus,
  fetchModelMetrics,
  fetchModelComparison,
  fetchModelFeatures,
  triggerReloadModel
} from '../services/api';

interface ModelPageProps {
  onNavigateToTraining: () => void;
}

export const ModelPage: React.FC<ModelPageProps> = ({ onNavigateToTraining }) => {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [comparison, setComparison] = useState<ModelComparisonData | null>(null);
  const [features, setFeatures] = useState<FeatureImportanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [reloadMsg, setReloadMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [st, m, comp, feat] = await Promise.all([
          fetchModelStatus().catch(() => null),
          fetchModelMetrics().catch(() => null),
          fetchModelComparison().catch(() => null),
          fetchModelFeatures().then((r) => r.feature_importance).catch(() => [])
        ]);
        setModelStatus(st);
        setMetrics(m);
        setComparison(comp);
        setFeatures(feat);
      } catch (e) {
        console.error('Error loading model page:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleReload = async () => {
    setIsReloading(true);
    setReloadMsg(null);
    try {
      await triggerReloadModel();
      setReloadMsg('Model artifacts reloaded into active memory successfully.');
      const st = await fetchModelStatus();
      setModelStatus(st);
    } catch (e: any) {
      setReloadMsg(`Reload failed: ${e.message}`);
    } finally {
      setIsReloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
        Loading model parameters and comparison matrices...
      </div>
    );
  }

  if (!modelStatus?.is_trained) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState
          title="No Trained Model Found"
          description="The Network Intrusion Detection model pipeline has not been executed yet. Train and compare models on the UNB NSL-KDD dataset."
          icon={Cpu}
          actionText="Open Training Console"
          onAction={onNavigateToTraining}
        />
      </div>
    );
  }

  const meta = modelStatus.metadata;
  const classificationReport = metrics?.classification_report || {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100 m-0">Active Machine Learning Model</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Champion Model
            </span>
          </div>
          <p className="text-xs text-slate-400 m-0 mt-1">
            Persisted via Joblib and Scikit-Learn Pipeline. Reloadable across application lifecycles without retraining.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            disabled={isReloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#162136] hover:bg-[#1e2d4a] border border-[#233554] text-slate-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Reload Artifacts</span>
          </button>
          <button
            onClick={onNavigateToTraining}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Retrain Models</span>
          </button>
        </div>
      </div>

      {reloadMsg && (
        <div className="p-3 rounded-md bg-[#0e1626] border border-[#1b2b45] text-xs text-emerald-300 flex items-center gap-2 font-mono">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reloadMsg}</span>
        </div>
      )}

      {/* Model Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Algorithm"
          value={meta.model_name}
          subtitle={`Version: ${meta.version}`}
          icon={Cpu}
          badge="Selected"
          badgeType="success"
        />
        <MetricCard
          title="Training Dataset"
          value={`${meta.train_samples.toLocaleString()} flows`}
          subtitle={meta.dataset_name}
          icon={Database}
        />
        <MetricCard
          title="Held-Out Test Set"
          value={`${meta.test_samples.toLocaleString()} flows`}
          subtitle="Zero data-leakage evaluation"
          icon={CheckCircle}
          badgeType="success"
        />
        <MetricCard
          title="Pipeline Features"
          value={`${meta.num_features} raw / ${meta.num_transformed_features} encoded`}
          subtitle="Numerical scaling + One-hot"
          icon={Sliders}
        />
      </div>

      {/* Champion Selection Rationale Banner */}
      <div className="p-4 rounded-lg bg-[#0e1626] border border-[#1c2d48] text-xs leading-relaxed">
        <div className="flex items-center gap-2 mb-1 text-slate-200 font-semibold">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Champion Selection Methodology (Academic Standard)</span>
        </div>
        <p className="text-slate-300 m-0">
          {meta.selection_criteria ||
            'Champion model selected based on the highest Macro F1-Score on the held-out test split. In network intrusion detection, standard accuracy can be biased by majority normal traffic; Macro F1 ensures high penalization for missed minority attacks (e.g., Probe and privilege escalation attempts).'}
        </p>
      </div>

      {/* Multi-Algorithm Comparison Table */}
      {comparison && (
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 m-0">Classical Model Comparison Benchmark</h3>
              <p className="text-xs text-slate-400 m-0">
                All models evaluated strictly on identical held-out test dataset ({meta.test_samples} flows)
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Evaluated: {new Date(comparison.evaluated_at).toLocaleDateString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1b263b] text-slate-400 font-mono text-[11px]">
                  <th className="pb-2 font-medium">Model</th>
                  <th className="pb-2 font-medium">Architecture Description</th>
                  <th className="pb-2 font-medium">Accuracy</th>
                  <th className="pb-2 font-medium">Precision</th>
                  <th className="pb-2 font-medium">Recall</th>
                  <th className="pb-2 font-medium">Macro F1</th>
                  <th className="pb-2 font-medium">Weighted F1</th>
                  <th className="pb-2 font-medium text-right">Train Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162033] text-slate-300 font-mono text-xs">
                {comparison.models.map((m) => {
                  const isBest = m.model_name === comparison.selected_model;
                  return (
                    <tr key={m.model_name} className={`hover:bg-[#131c2d] transition-colors ${isBest ? 'bg-blue-500/5' : ''}`}>
                      <td className="py-3 font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>{m.model_name}</span>
                        {isBest && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            BEST
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-400 font-sans max-w-xs">{m.description}</td>
                      <td className="py-3">{(m.accuracy * 100).toFixed(2)}%</td>
                      <td className="py-3">{(m.precision * 100).toFixed(2)}%</td>
                      <td className="py-3">{(m.recall * 100).toFixed(2)}%</td>
                      <td className="py-3 text-emerald-400 font-bold">{(m.macro_f1 * 100).toFixed(2)}%</td>
                      <td className="py-3">{(m.weighted_f1 * 100).toFixed(2)}%</td>
                      <td className="py-3 text-right text-slate-400">{m.training_time_sec}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Classification Report Table */}
      {metrics && metrics.classification_report && (
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-100 m-0 mb-1">Held-Out Classification Report</h3>
          <p className="text-xs text-slate-400 m-0 mb-4">
            Per-class precision, recall, and harmonic F1-score computed by Scikit-Learn
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1b263b] text-slate-400 font-mono text-[11px]">
                  <th className="pb-2 font-medium">Class / Metric</th>
                  <th className="pb-2 font-medium">Precision</th>
                  <th className="pb-2 font-medium">Recall</th>
                  <th className="pb-2 font-medium">F1-Score</th>
                  <th className="pb-2 font-medium text-right">Support (Count)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162033] text-slate-300 font-mono text-xs">
                {Object.entries(classificationReport).map(([key, val]: [string, any]) => {
                  if (typeof val !== 'object' || val === null || !val.support) return null;
                  const isAvg = key.includes('avg');
                  return (
                    <tr key={key} className={isAvg ? 'bg-[#0d1422] font-semibold text-slate-200' : 'hover:bg-[#131c2d]'}>
                      <td className="py-2.5 capitalize">{key}</td>
                      <td className="py-2.5">{(val.precision * 100).toFixed(2)}%</td>
                      <td className="py-2.5">{(val.recall * 100).toFixed(2)}%</td>
                      <td className="py-2.5 text-blue-400 font-bold">{(val['f1-score'] * 100).toFixed(2)}%</td>
                      <td className="py-2.5 text-right text-slate-400">{val.support.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feature Importance Table */}
      {features.length > 0 && (
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 m-0">Feature Importance Ranking</h3>
              <p className="text-xs text-slate-400 m-0">Top predictive network flow features identified by the model</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Top {features.length} Features</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1b263b] text-slate-400 font-mono text-[11px]">
                  <th className="pb-2 font-medium">Rank</th>
                  <th className="pb-2 font-medium">Feature Name</th>
                  <th className="pb-2 font-medium">Importance Value</th>
                  <th className="pb-2 font-medium">Contribution (%)</th>
                  <th className="pb-2 font-medium">Relative Weight Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162033] text-slate-300 font-mono text-xs">
                {features.map((f) => (
                  <tr key={f.rank} className="hover:bg-[#131c2d] transition-colors">
                    <td className="py-2 text-slate-500">#{f.rank}</td>
                    <td className="py-2 font-medium text-blue-400">{f.feature}</td>
                    <td className="py-2">{f.importance.toFixed(5)}</td>
                    <td className="py-2 font-bold text-slate-200">{f.percentage}%</td>
                    <td className="py-2 w-48">
                      <div className="w-full bg-[#162033] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, f.percentage * 2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
