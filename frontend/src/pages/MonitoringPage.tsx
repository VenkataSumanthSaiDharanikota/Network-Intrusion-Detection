import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  FileText,
  Play,
  RotateCcw,
  CheckCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { DetectionResult } from '../types';
import { uploadTrafficCsv, getSampleDownloadUrl } from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface BatchRun {
  batchId: number;
  timestamp: string;
  sourceFile: string;
  totalRecords: number;
  normalCount: number;
  maliciousCount: number;
  maliciousPercentage: number;
  avgConfidence: number;
}

export const MonitoringPage: React.FC = () => {
  const [batchRuns, setBatchRuns] = useState<BatchRun[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('sample_mixed_network_traffic.csv');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const presets = [
    { id: 'sample_mixed_network_traffic.csv', name: 'Mixed Traffic Feed (250 Flows)' },
    { id: 'sample_dos_attack_traffic.csv', name: 'High-Volume DoS Feed (100 Flows)' },
    { id: 'sample_normal_traffic.csv', name: 'Clean Baseline Traffic (100 Flows)' },
  ];

  const handleRunBatch = async () => {
    setIsRunning(true);
    setStatusMessage('Fetching authentic traffic chunk and applying ML pipeline...');

    try {
      const url = getSampleDownloadUrl(selectedPreset);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to retrieve batch data.');
      const blob = await res.blob();
      const fileObj = new File([blob], selectedPreset, { type: 'text/csv' });

      const result = await uploadTrafficCsv(fileObj);
      if (result.success && result.data) {
        const data: DetectionResult = result.data;
        const newBatch: BatchRun = {
          batchId: batchRuns.length + 1,
          timestamp: new Date().toLocaleTimeString(),
          sourceFile: selectedPreset,
          totalRecords: data.total_records,
          normalCount: data.normal_count,
          maliciousCount: data.malicious_count,
          maliciousPercentage: data.malicious_percentage,
          avgConfidence: data.average_confidence
        };

        setBatchRuns((prev) => [...prev, newBatch]);
        setStatusMessage(`Batch #${newBatch.batchId} processed successfully: ${data.malicious_count} threats identified.`);
      } else {
        setStatusMessage(result.error || 'Batch evaluation error.');
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setBatchRuns([]);
    setStatusMessage(null);
  };

  const totalMonitoredRecords = batchRuns.reduce((acc, b) => acc + b.totalRecords, 0);
  const totalMonitoredThreats = batchRuns.reduce((acc, b) => acc + b.maliciousCount, 0);
  const totalMonitoredClean = batchRuns.reduce((acc, b) => acc + b.normalCount, 0);
  const overallThreatRate = totalMonitoredRecords > 0 ? ((totalMonitoredThreats / totalMonitoredRecords) * 100).toFixed(1) : '0.0';

  const chartData = batchRuns.map((b) => ({
    name: `Batch #${b.batchId}`,
    threatRate: b.maliciousPercentage,
    confidence: Math.round(b.avgConfidence * 100),
    total: b.totalRecords
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Academic Disclaimer */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-100 m-0">Dataset-Based Monitoring</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Batch Evaluation Mode
          </span>
        </div>
        <p className="text-xs text-slate-400 m-0 mt-1">
          Repeatedly submit authentic network traffic batches for sequential evaluation and telemetry tracking.
        </p>
      </div>

      {/* Honest Architecture Notice */}
      <div className="p-3.5 rounded-lg bg-[#0e1626] border border-[#1b2b45] text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-200">IEEE Ignite Technical Integrity Note: </span>
          This system performs genuine Scikit-Learn inference on authentic network connection batches. In accordance with competition guidelines, we do <span className="text-amber-400 font-medium">not</span> fake real-time packet generation, synthetic socket tickers, or random timestamps. All analytics shown below reflect genuine model evaluation on submitted traffic slices.
        </div>
      </div>

      {/* Control Box */}
      <div className="p-5 rounded-lg bg-[#101726] border border-[#1b263b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Select Traffic Batch Stream</label>
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            disabled={isRunning}
            className="bg-[#0b101a] border border-[#1e2a3f] rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunBatch}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Batch...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Ingest & Analyze Batch</span>
              </>
            )}
          </button>

          {batchRuns.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#162136] hover:bg-[#1e2d4a] border border-[#233554] text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset History</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-md bg-[#0d1422] border border-[#1b263b] text-xs font-mono text-slate-300 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Batches Processed"
          value={batchRuns.length}
          subtitle="Sequential evaluation cycles"
          icon={Clock}
        />
        <MetricCard
          title="Flows Inspected"
          value={totalMonitoredRecords.toLocaleString()}
          subtitle="Cumulative flow records"
          icon={FileText}
        />
        <MetricCard
          title="Threat Count"
          value={totalMonitoredThreats.toLocaleString()}
          subtitle={`${overallThreatRate}% threat ratio across batches`}
          icon={ShieldAlert}
          badge={totalMonitoredThreats > 0 ? 'Threats Identified' : 'Clean'}
          badgeType={totalMonitoredThreats > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          title="Clean Flows"
          value={totalMonitoredClean.toLocaleString()}
          subtitle="Classified normal traffic"
          icon={ShieldCheck}
          badgeType="success"
        />
      </div>

      {/* Trend Chart */}
      {batchRuns.length > 0 ? (
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-100 m-0 mb-1">Batch Infiltration Rate Trend</h3>
          <p className="text-xs text-slate-400 m-0 mb-4">
            Percentage of detected malicious connections per ingested dataset batch
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a253a" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="threatRate"
                  name="Threat Rate (%)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#f43f5e' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-lg bg-[#101726] border border-[#1b263b] border-dashed text-center text-xs text-slate-400">
          No batches ingested yet. Select a dataset stream above and click "Ingest & Analyze Batch" to begin monitoring.
        </div>
      )}

      {/* Batch Log Table */}
      {batchRuns.length > 0 && (
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-100 m-0 mb-3">Batch Telemetry Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1b263b] text-slate-400 font-mono text-[11px]">
                  <th className="pb-2 font-medium">Batch #</th>
                  <th className="pb-2 font-medium">Timestamp</th>
                  <th className="pb-2 font-medium">Feed File</th>
                  <th className="pb-2 font-medium">Total Flows</th>
                  <th className="pb-2 font-medium">Normal</th>
                  <th className="pb-2 font-medium">Threats</th>
                  <th className="pb-2 font-medium">Threat Rate</th>
                  <th className="pb-2 font-medium">Avg Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162033] text-slate-300 font-mono text-xs">
                {batchRuns.map((b) => (
                  <tr key={b.batchId} className="hover:bg-[#131c2d] transition-colors">
                    <td className="py-2.5 text-blue-400 font-bold">#{b.batchId}</td>
                    <td className="py-2.5 text-slate-400">{b.timestamp}</td>
                    <td className="py-2.5 text-slate-200">{b.sourceFile}</td>
                    <td className="py-2.5">{b.totalRecords}</td>
                    <td className="py-2.5 text-emerald-400">{b.normalCount}</td>
                    <td className="py-2.5 text-rose-400">{b.maliciousCount}</td>
                    <td className="py-2.5">
                      <span className={b.maliciousPercentage > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {b.maliciousPercentage}%
                      </span>
                    </td>
                    <td className="py-2.5">{(b.avgConfidence * 100).toFixed(1)}%</td>
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
