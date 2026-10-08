import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  Info
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { EmptyState } from '../components/EmptyState';
import {
  EvaluationMetrics,
  ModelComparisonData,
  FeatureImportanceItem,
  ClassDistributionData
} from '../types';
import {
  fetchModelMetrics,
  fetchModelComparison,
  fetchModelFeatures,
  fetchClassDistribution
} from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  CartesianGrid
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [comparison, setComparison] = useState<ModelComparisonData | null>(null);
  const [features, setFeatures] = useState<FeatureImportanceItem[]>([]);
  const [distData, setDistData] = useState<ClassDistributionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAllAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const [m, comp, feat, dist] = await Promise.all([
          fetchModelMetrics().catch(() => null),
          fetchModelComparison().catch(() => null),
          fetchModelFeatures().then((res) => res.feature_importance).catch(() => []),
          fetchClassDistribution().catch(() => null)
        ]);
        setMetrics(m);
        setComparison(comp);
        setFeatures(feat);
        setDistData(dist);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    }
    loadAllAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
        Loading telemetry and analytical metrics...
      </div>
    );
  }

  if (!metrics && !comparison) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState
          title="No Analytics Data Available"
          description="Model evaluation and analytics require a trained model. Please visit the Training Console to run the multi-algorithm training pipeline."
          icon={BarChart3}
        />
      </div>
    );
  }

  // Prepare comparison chart data
  const comparisonChartData = comparison?.models.map((m) => ({
    name: m.model_name,
    Accuracy: Number((m.accuracy * 100).toFixed(1)),
    'Macro F1': Number((m.macro_f1 * 100).toFixed(1)),
    Recall: Number((m.recall * 100).toFixed(1)),
    'Latency (s)': m.training_time_sec
  })) || [];

  // Prepare feature importance chart data (top 10)
  const topFeatures = features.slice(0, 10).map((f) => ({
    name: f.feature,
    percentage: f.percentage,
    importance: f.importance
  }));

  // Prepare dataset class distribution
  const datasetClasses = distData?.dataset_distribution
    ? Object.entries(distData.dataset_distribution).map(([name, count]) => ({
        name,
        count
      }))
    : [];

  const cm = metrics?.confusion_matrix;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 m-0">Cybersecurity & Model Analytics</h2>
        <p className="text-xs text-slate-400 m-0 mt-1">
          Rigorous performance evaluation, multi-algorithm benchmarking, and feature contributions computed on the held-out test split.
        </p>
      </div>

      {/* Top Analytical KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Accuracy"
          value={metrics ? `${(metrics.accuracy * 100).toFixed(2)}%` : '--'}
          subtitle="Overall correct classification rate"
          icon={ShieldCheck}
          badgeType="success"
        />
        <MetricCard
          title="Macro F1-Score"
          value={metrics ? `${(metrics.macro_f1 * 100).toFixed(2)}%` : '--'}
          subtitle="Unweighted harmonic mean across classes"
          icon={TrendingUp}
          badge="Balanced"
          badgeType="success"
        />
        <MetricCard
          title="Intrusion Recall"
          value={metrics ? `${(metrics.recall * 100).toFixed(2)}%` : '--'}
          subtitle="True positive intrusion detection rate"
          icon={ShieldAlert}
          badgeType="default"
        />
        <MetricCard
          title="Weighted F1-Score"
          value={metrics ? `${(metrics.weighted_f1 * 100).toFixed(2)}%` : '--'}
          subtitle="Class-support weighted F1-Score"
          icon={Layers}
          badgeType="default"
        />
      </div>

      {/* Grid 1: Model Comparison & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Comparison Bar Chart */}
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 m-0">Candidate Model Comparison</h3>
              <p className="text-xs text-slate-400 m-0">
                Evaluation on identical 22,544 held-out test flows (Scikit-Learn)
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Multi-Model
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a253a" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Accuracy" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Macro F1" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Recall" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Confusion Matrix Grid */}
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 m-0">Held-Out Confusion Matrix</h3>
                <p className="text-xs text-slate-400 m-0">
                  Actual test set classification outcomes (Predicted vs True)
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ground Truth
              </span>
            </div>

            {cm && cm.matrix ? (
              <div className="mt-4 flex flex-col items-center">
                <div className="w-full max-w-sm border border-[#1e2a3f] rounded-lg overflow-hidden bg-[#0a0f18]">
                  <div className="grid grid-cols-3 bg-[#131b2c] border-b border-[#1e2a3f] text-center font-mono text-[11px] py-2 text-slate-300 font-medium">
                    <div>True \ Pred</div>
                    {cm.labels.map((l) => (
                      <div key={l} className="capitalize">{l}</div>
                    ))}
                  </div>

                  {cm.matrix.map((row, rIdx) => (
                    <div
                      key={rIdx}
                      className={`grid grid-cols-3 text-center font-mono text-xs py-3 border-b border-[#162033] last:border-b-0 ${
                        rIdx % 2 === 0 ? 'bg-[#0e1626]' : 'bg-[#0a0f18]'
                      }`}
                    >
                      <div className="font-semibold text-slate-400 text-[11px] self-center capitalize">
                        {cm.labels[rIdx]}
                      </div>
                      {row.map((val, cIdx) => {
                        const isDiagonal = rIdx === cIdx;
                        return (
                          <div
                            key={cIdx}
                            className={`p-2 rounded m-1 font-bold ${
                              isDiagonal
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                : val > 0
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                                : 'text-slate-500'
                            }`}
                          >
                            {val.toLocaleString()}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-center gap-6 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
                    <span>Diagonal: Correct Decisions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40" />
                    <span>Off-Diagonal: Classification Errors</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">Confusion matrix not available.</div>
            )}
          </div>

          <div className="pt-3 border-t border-[#1a253a] text-[11px] text-slate-400">
            Total verified test flows evaluated: <span className="font-mono text-slate-200">{metrics?.test_records?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Grid 2: Feature Importance & Dataset Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance Bar Chart */}
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 m-0">Top Model Feature Contributions</h3>
              <p className="text-xs text-slate-400 m-0">
                Calculated directly from champion model decisions
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Importance Ranking
            </span>
          </div>

          {topFeatures.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topFeatures}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a253a" horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={10} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="percentage" fill="#6366f1" radius={[0, 3, 3, 0]}>
                    {topFeatures.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index < 3 ? '#6366f1' : '#818cf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">Feature importance data not computed.</div>
          )}

          <div className="mt-2 p-2.5 rounded bg-[#0a0f18] border border-[#1b253a] text-[11px] text-slate-400 leading-relaxed">
            <span className="text-slate-300 font-semibold">Technical Interpretation: </span>
            Feature importance scores measure individual feature utility within the decision boundary. Features such as <span className="text-blue-400 font-mono">src_bytes</span> and <span className="text-blue-400 font-mono">dst_host_serror_rate</span> indicate traffic anomalies characteristic of SYN floods and port scanning.
          </div>
        </div>

        {/* Dataset Class Distribution */}
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 m-0">UNB NSL-KDD Class Composition</h3>
              <p className="text-xs text-slate-400 m-0">
                Ground-truth traffic distribution across the Canadian Institute for Cybersecurity benchmark
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              UNB Dataset
            </span>
          </div>

          <div className="space-y-3">
            {datasetClasses.map((item) => {
              const total = datasetClasses.reduce((acc, c) => acc + c.count, 0);
              const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
              const isNormal = item.name === 'Normal';
              return (
                <div key={item.name} className="p-3 rounded bg-[#0b101a] border border-[#1a253a]">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-medium text-slate-200">{item.name} Traffic</span>
                    <span className="font-mono text-slate-400">
                      {item.count.toLocaleString()} flows ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#162033] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isNormal ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#1a253a] flex items-center justify-between text-xs text-slate-400">
            <span>Total benchmark records:</span>
            <span className="font-mono text-slate-200">
              {datasetClasses.reduce((acc, c) => acc + c.count, 0).toLocaleString()} flows
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
