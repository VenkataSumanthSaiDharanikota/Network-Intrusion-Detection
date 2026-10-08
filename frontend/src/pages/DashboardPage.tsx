import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Cpu,
  Database,
  ArrowRight,
  TrendingUp,
  Server
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import {
  SystemStatus,
  DatasetStatus,
  ModelStatus,
  EvaluationMetrics,
  DetectionSession,
  ClassDistributionData
} from '../types';
import {
  fetchModelMetrics,
  fetchDetectionHistory,
  fetchClassDistribution
} from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

interface DashboardPageProps {
  systemStatus: SystemStatus | null;
  datasetStatus: DatasetStatus | null;
  modelStatus: ModelStatus | null;
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  systemStatus,
  datasetStatus,
  modelStatus,
  onNavigate
}) => {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [history, setHistory] = useState<DetectionSession[]>([]);
  const [distData, setDistData] = useState<ClassDistributionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        if (modelStatus?.is_trained) {
          const m = await fetchModelMetrics();
          setMetrics(m);
        }
        const hist = await fetchDetectionHistory(10);
        setHistory(hist);
        const dist = await fetchClassDistribution();
        setDistData(dist);
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [modelStatus?.is_trained]);

  const totalDetections = history.reduce((acc, h) => acc + h.total_records, 0);
  const totalMalicious = history.reduce((acc, h) => acc + h.malicious_count, 0);
  const totalNormal = history.reduce((acc, h) => acc + h.normal_count, 0);
  const overallMaliciousRate = totalDetections > 0 ? ((totalMalicious / totalDetections) * 100).toFixed(1) : '0.0';

  // Format attack distribution for bar chart
  const attackChartData = distData?.detection_distribution
    ? Object.entries(distData.detection_distribution).map(([cat, count]) => ({
        name: cat,
        count: count
      }))
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / System Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-[#0e1524] border border-[#1a253a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 m-0">
              IEEE Ignite PS-33 — Autonomous Network Intrusion Detection
            </h2>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              Production ML pipeline evaluating classical classification algorithms on real UNB NSL-KDD network traffic.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('detect')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Analyze Traffic</span>
          </button>
          <button
            onClick={() => onNavigate('training')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#162136] hover:bg-[#1e2d4a] border border-[#233554] text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Retrain Pipeline</span>
          </button>
        </div>
      </div>

      {/* KPI Section 1: System & Pipeline Health */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Pipeline State & Active Model Performance
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Model"
            value={modelStatus?.is_trained ? modelStatus.metadata?.model_name || 'Champion' : 'None'}
            subtitle={modelStatus?.is_trained ? `Evaluated on ${metrics?.test_records?.toLocaleString() || '22,544'} test flows` : 'Model training required'}
            icon={Cpu}
            badge={modelStatus?.is_trained ? 'Champion' : 'Missing'}
            badgeType={modelStatus?.is_trained ? 'success' : 'warning'}
          />
          <MetricCard
            title="Macro F1 Score"
            value={metrics ? (metrics.macro_f1 * 100).toFixed(2) + '%' : '--'}
            subtitle="Academic standard for balanced intrusion detection"
            icon={TrendingUp}
            badge={metrics ? 'Verified' : 'No Data'}
            badgeType={metrics ? 'success' : 'default'}
          />
          <MetricCard
            title="Test Accuracy"
            value={metrics ? (metrics.accuracy * 100).toFixed(2) + '%' : '--'}
            subtitle="Accuracy on unseen held-out test split"
            icon={ShieldCheck}
            badge={metrics ? 'Evaluated' : 'No Data'}
            badgeType={metrics ? 'success' : 'default'}
          />
          <MetricCard
            title="Intrusion Recall"
            value={metrics ? (metrics.recall * 100).toFixed(2) + '%' : '--'}
            subtitle="Malicious traffic detection rate"
            icon={Activity}
            badge={metrics ? 'Optimal' : 'No Data'}
            badgeType={metrics ? 'success' : 'default'}
          />
        </div>
      </div>

      {/* KPI Section 2: Historical Detections */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Traffic Inference Summary
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Sessions Recorded"
            value={history.length}
            subtitle="Saved in local SQLite persistence"
            icon={Database}
          />
          <MetricCard
            title="Flows Analyzed"
            value={totalDetections.toLocaleString()}
            subtitle="Processed through Scikit-Learn pipeline"
            icon={Activity}
          />
          <MetricCard
            title="Normal Flows"
            value={totalNormal.toLocaleString()}
            subtitle="Legitimate connection records"
            icon={ShieldCheck}
            badgeType="success"
          />
          <MetricCard
            title="Malicious Detected"
            value={totalMalicious.toLocaleString()}
            subtitle={`${overallMaliciousRate}% of submitted flows`}
            icon={ShieldAlert}
            badge={totalMalicious > 0 ? 'Threats' : 'Clean'}
            badgeType={totalMalicious > 0 ? 'danger' : 'success'}
          />
        </div>
      </div>

      {/* Main Grid: Detection History & Attack Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection History Table (2 cols) */}
        <div className="lg:col-span-2 bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 m-0">Recent Detection Sessions</h3>
              <p className="text-xs text-slate-400 m-0">Real traffic analysis sessions stored in SQLite</p>
            </div>
            <button
              onClick={() => onNavigate('detect')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>New Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {history.length === 0 ? (
            <EmptyState
              title="No Traffic Analyzed Yet"
              description="No detection sessions found in SQLite history. Upload a traffic CSV to run genuine machine learning inference."
              icon={ShieldAlert}
              actionText="Go to Detect Traffic"
              onAction={() => onNavigate('detect')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1b263b] text-slate-400 font-mono text-[11px]">
                    <th className="pb-2 font-medium">Session</th>
                    <th className="pb-2 font-medium">Filename</th>
                    <th className="pb-2 font-medium">Records</th>
                    <th className="pb-2 font-medium">Normal / Threat</th>
                    <th className="pb-2 font-medium">Model</th>
                    <th className="pb-2 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#162033] text-slate-300 font-mono">
                  {history.map((sess) => {
                    const normPct = sess.total_records > 0 ? ((sess.normal_count / sess.total_records) * 100).toFixed(0) : '0';
                    const malPct = sess.total_records > 0 ? ((sess.malicious_count / sess.total_records) * 100).toFixed(0) : '0';
                    return (
                      <tr key={sess.session_id} className="hover:bg-[#131c2d] transition-colors">
                        <td className="py-2.5 text-blue-400 font-mono text-[11px]">{sess.session_id}</td>
                        <td className="py-2.5 text-slate-200 max-w-[140px] truncate" title={sess.filename}>{sess.filename}</td>
                        <td className="py-2.5">{sess.total_records}</td>
                        <td className="py-2.5">
                          <span className="text-emerald-400">{sess.normal_count} ({normPct}%)</span>
                          {' / '}
                          <span className="text-rose-400">{sess.malicious_count} ({malPct}%)</span>
                        </td>
                        <td className="py-2.5 text-slate-400 text-[11px]">{sess.model_name}</td>
                        <td className="py-2.5 text-slate-400 text-[11px]">
                          {new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attack Category Breakdown Chart (1 col) */}
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 m-0">Detected Attack Categories</h3>
            <p className="text-xs text-slate-400 m-0 mb-4">Cumulative distribution from actual inference</p>

            {attackChartData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No attack categories detected yet. Upload traffic to populate real analytics.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attackChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {attackChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.name === 'Normal' ? '#10b981' : '#f43f5e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#1a253a] flex items-center justify-between text-xs">
            <span className="text-slate-400">Deep Analytics</span>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
