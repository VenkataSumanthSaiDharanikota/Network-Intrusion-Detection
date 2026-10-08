import React, { useState, useEffect } from 'react';
import {
  Layers,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Cpu,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import {
  DatasetStatus,
  ModelStatus,
  TrainingState,
  ModelComparisonData
} from '../types';
import {
  fetchDatasetStatus,
  fetchModelStatus,
  startModelTraining,
  fetchTrainStatus,
  fetchModelComparison,
  triggerDownloadDataset
} from '../services/api';

interface TrainingPageProps {
  onNavigateToModel: () => void;
}

export const TrainingPage: React.FC<TrainingPageProps> = ({ onNavigateToModel }) => {
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [trainState, setTrainState] = useState<TrainingState | null>(null);
  const [comparison, setComparison] = useState<ModelComparisonData | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>('binary');
  const [sampleLimit, setSampleLimit] = useState<string>('all');
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    async function loadState() {
      try {
        const [ds, ms, ts, comp] = await Promise.all([
          fetchDatasetStatus().catch(() => null),
          fetchModelStatus().catch(() => null),
          fetchTrainStatus().catch(() => null),
          fetchModelComparison().catch(() => null)
        ]);
        setDatasetStatus(ds);
        setModelStatus(ms);
        setTrainState(ts);
        setComparison(comp);
      } catch (err) {
        console.error('Error loading training page state:', err);
      }
    }
    loadState();
  }, []);

  // Poll training status if training is currently running
  useEffect(() => {
    let interval: any = null;
    if (trainState?.is_training) {
      interval = setInterval(async () => {
        try {
          const st = await fetchTrainStatus();
          setTrainState(st);
          if (!st.is_training) {
            // Training just finished, reload model status and comparison
            const [ms, comp] = await Promise.all([
              fetchModelStatus(),
              fetchModelComparison().catch(() => null)
            ]);
            setModelStatus(ms);
            setComparison(comp);
            setStatusMessage('Training completed successfully!');
          }
        } catch (e) {
          console.error('Error checking train status:', e);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trainState?.is_training]);

  const handleStartTraining = async () => {
    setIsTriggering(true);
    setStatusMessage(null);
    try {
      const sampleSize = sampleLimit === 'all' ? undefined : parseInt(sampleLimit, 10);
      const res = await startModelTraining(selectedMode, sampleSize);
      setStatusMessage(res.message);
      // Immediately check status
      const st = await fetchTrainStatus();
      setTrainState(st);
    } catch (err: any) {
      setStatusMessage(`Training failed to start: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDownloadDataset = async () => {
    setIsTriggering(true);
    setStatusMessage('Downloading authentic NSL-KDD dataset from research mirror...');
    try {
      const ds = await triggerDownloadDataset();
      setDatasetStatus(ds);
      setStatusMessage('Dataset downloaded and test samples prepared successfully.');
    } catch (err: any) {
      setStatusMessage(`Dataset download failed: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 m-0">Model Training Console</h2>
        <p className="text-xs text-slate-400 m-0 mt-1">
          Execute classical machine learning algorithms on the verified UNB NSL-KDD benchmark, benchmark real performance metrics, and automatically persist the champion.
        </p>
      </div>

      {/* Dataset Verification Card */}
      <div className="p-5 rounded-lg bg-[#101726] border border-[#1b263b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-100 m-0">Training Dataset Verification</h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                datasetStatus?.is_available
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
              }`}
            >
              {datasetStatus?.is_available ? 'Verified Ready' : 'Download Required'}
            </span>
          </div>
          <p className="text-xs text-slate-400 m-0">
            {datasetStatus?.is_available
              ? `${datasetStatus.dataset_name} (${datasetStatus.train_records.toLocaleString()} train flows, ${datasetStatus.test_records.toLocaleString()} test flows, 41 features)`
              : 'Authentic NSL-KDD dataset files not detected in local data/raw directory.'}
          </p>
        </div>

        {!datasetStatus?.is_available && (
          <button
            onClick={handleDownloadDataset}
            disabled={isTriggering}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-40"
          >
            {isTriggering ? 'Downloading...' : 'Fetch Official Dataset'}
          </button>
        )}
      </div>

      {/* Configuration & Launch Card */}
      <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-100 m-0 mb-1">Training Parameters</h3>
        <p className="text-xs text-slate-400 m-0 mb-4">
          Select target classification task and flow volume. Candidate models evaluated: Logistic Regression, Random Forest, HistGradientBoosting.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Classification Objective</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMode('binary')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedMode === 'binary'
                    ? 'bg-blue-600/15 border-blue-500/40 text-slate-100'
                    : 'bg-[#0b101a] border-[#1e2a3f] text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-semibold">Binary Classification</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Normal vs Malicious</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('multiclass')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedMode === 'multiclass'
                    ? 'bg-blue-600/15 border-blue-500/40 text-slate-100'
                    : 'bg-[#0b101a] border-[#1e2a3f] text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-semibold">Multiclass (5 Categories)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Normal, DoS, Probe, R2L, U2R</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Training Data Scope</label>
            <select
              value={sampleLimit}
              onChange={(e) => setSampleLimit(e.target.value)}
              className="w-full bg-[#0b101a] border border-[#1e2a3f] rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Full Standard Split (25,192 training records)</option>
              <option value="15000">Fast Benchmark (15,000 stratified samples)</option>
              <option value="5000">Rapid Test (5,000 stratified samples)</option>
            </select>
            <div className="mt-1 text-[11px] text-slate-400">
              Evaluation is always executed on the full 22,544 held-out test split.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#1a253a]">
          <div className="text-xs text-slate-400">
            {trainState?.is_training ? (
              <span className="text-blue-400 font-mono flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                <span>{trainState.current_step}</span>
              </span>
            ) : trainState?.last_completed ? (
              <span className="text-slate-400 text-[11px]">
                Last completed: {new Date(trainState.last_completed).toLocaleTimeString()}
              </span>
            ) : (
              <span>Ready to train</span>
            )}
          </div>

          <button
            onClick={handleStartTraining}
            disabled={!datasetStatus?.is_available || trainState?.is_training || isTriggering}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-40"
          >
            {trainState?.is_training ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Training Models...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Training & Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Progress Bar */}
      {trainState?.is_training && (
        <div className="p-4 rounded-lg bg-[#0e1626] border border-[#1b2b45] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">{trainState.current_step}</span>
            <span className="font-mono text-blue-400">{trainState.progress_percent}%</span>
          </div>
          <div className="w-full bg-[#162033] h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${trainState.progress_percent}%` }}
            />
          </div>
        </div>
      )}

      {statusMessage && !trainState?.is_training && (
        <div className="p-3 rounded-md bg-[#0e1626] border border-[#1b2b45] text-xs text-blue-300 font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Latest Comparison Results */}
      {comparison && (
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100 m-0">Latest Training Comparison Matrix</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
                  Champion: {comparison.selected_model}
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0 mt-0.5">
                Decision rule: Champion selected by highest Macro F1 score to minimize false negatives on minority attack classes.
              </p>
            </div>

            <button
              onClick={onNavigateToModel}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect Full Model</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1b263b] text-slate-400 font-mono text-[11px]">
                  <th className="pb-2 font-medium">Model</th>
                  <th className="pb-2 font-medium">Accuracy</th>
                  <th className="pb-2 font-medium">Precision</th>
                  <th className="pb-2 font-medium">Recall</th>
                  <th className="pb-2 font-medium">Macro F1</th>
                  <th className="pb-2 font-medium">Weighted F1</th>
                  <th className="pb-2 font-medium text-right">Training Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162033] text-slate-300 font-mono text-xs">
                {comparison.models.map((m) => {
                  const isBest = m.model_name === comparison.selected_model;
                  return (
                    <tr key={m.model_name} className={`hover:bg-[#131c2d] ${isBest ? 'bg-blue-500/5' : ''}`}>
                      <td className="py-2.5 font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>{m.model_name}</span>
                        {isBest && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            BEST
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">{(m.accuracy * 100).toFixed(2)}%</td>
                      <td className="py-2.5">{(m.precision * 100).toFixed(2)}%</td>
                      <td className="py-2.5">{(m.recall * 100).toFixed(2)}%</td>
                      <td className="py-2.5 text-emerald-400 font-bold">{(m.macro_f1 * 100).toFixed(2)}%</td>
                      <td className="py-2.5">{(m.weighted_f1 * 100).toFixed(2)}%</td>
                      <td className="py-2.5 text-right text-slate-400">{m.training_time_sec}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
