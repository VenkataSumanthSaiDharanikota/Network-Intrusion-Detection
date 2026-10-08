import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Play
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { DetectionResult, SampleFileInfo } from '../types';
import {
  uploadTrafficCsv,
  fetchDatasetSamples,
  getSampleDownloadUrl,
  getExportCsvUrl
} from '../services/api';

export const DetectPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [validationError, setValidationError] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sampleFiles, setSampleFiles] = useState<SampleFileInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  useEffect(() => {
    fetchDatasetSamples()
      .then(setSampleFiles)
      .catch((err) => console.error('Failed to load sample files:', err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationError(null);
      setErrorMsg(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setIsUploading(true);
    setValidationError(null);
    setErrorMsg(null);

    try {
      const res = await uploadTrafficCsv(file);
      if (res.success && res.data) {
        setDetectionResult(res.data);
        setCurrentPage(1);
      } else {
        if (res.validation) {
          setValidationError(res.validation);
        }
        setErrorMsg(res.error || 'Validation failed on uploaded traffic file.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during inference.');
    } finally {
      setIsUploading(false);
    }
  };

  const loadSampleFile = async (sampleName: string) => {
    setIsUploading(true);
    setValidationError(null);
    setErrorMsg(null);

    try {
      const url = getSampleDownloadUrl(sampleName);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to retrieve sample file from server.');
      const blob = await res.blob();
      const sampleFileObj = new File([blob], sampleName, { type: 'text/csv' });
      setFile(sampleFileObj);

      const uploadRes = await uploadTrafficCsv(sampleFileObj);
      if (uploadRes.success && uploadRes.data) {
        setDetectionResult(uploadRes.data);
        setCurrentPage(1);
      } else {
        if (uploadRes.validation) setValidationError(uploadRes.validation);
        setErrorMsg(uploadRes.error || 'Validation failed on sample traffic file.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load and analyze sample traffic.');
    } finally {
      setIsUploading(false);
    }
  };

  // Filter records
  const filteredRecords = (detectionResult?.records || []).filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.record_index.toString().includes(q) ||
      r.protocol_type.toLowerCase().includes(q) ||
      r.service.toLowerCase().includes(q) ||
      r.flag.toLowerCase().includes(q) ||
      r.predicted_class.toLowerCase().includes(q) ||
      r.attack_category.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 m-0">Detect Traffic</h2>
        <p className="text-xs text-slate-400 m-0 mt-1">
          Upload authentic network flow records to validate column schema and execute genuine ML inference using the trained pipeline.
        </p>
      </div>

      {/* Upload & Sample Selector Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Box (2 cols) */}
        <div className="lg:col-span-2 bg-[#101726] border border-[#1b263b] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-100 m-0 mb-1">Select Network Flow CSV</h3>
          <p className="text-xs text-slate-400 mb-4">
            File must contain the 41 standard network flow features (duration, protocol_type, service, flag, src_bytes, dst_bytes, etc.).
          </p>

          <div className="border-2 border-dashed border-[#22334f] rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors bg-[#0b101a]/50">
            <input
              type="file"
              id="traffic-file-input"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="traffic-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-medium text-slate-200">
                {file ? file.name : 'Click to browse or drag and drop network traffic CSV'}
              </div>
              <div className="text-[11px] text-slate-400">Supports standard CSV / text tables up to 50MB</div>
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-400 font-mono">
              {file ? `${(file.size / 1024).toFixed(1)} KB selected` : 'No file chosen'}
            </div>
            <button
              onClick={handleUploadAndAnalyze}
              disabled={!file || isUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-40"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validating & Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute ML Inference</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pre-packaged Research Test Samples (1 col) */}
        <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-100 m-0">Pre-Packaged Samples</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                1-Click Test
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real extracted flows from the Canadian Institute for Cybersecurity held-out test split.
            </p>

            <div className="space-y-2">
              {sampleFiles.map((sf) => (
                <div
                  key={sf.filename}
                  className="p-2.5 rounded bg-[#0b101a] border border-[#1b263b] hover:border-blue-500/40 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-medium text-slate-200 truncate">{sf.filename}</div>
                    <div className="text-[10px] text-slate-400">{sf.description} ({sf.size_kb} KB)</div>
                  </div>
                  <button
                    onClick={() => loadSampleFile(sf.filename)}
                    disabled={isUploading}
                    className="px-2.5 py-1 rounded bg-[#162136] hover:bg-blue-600 text-slate-200 hover:text-white text-[11px] font-mono transition-colors shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    Test Flow
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1a253a] text-[11px] text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Files are verified NSL-KDD test traces with ground truth labels removed for blind evaluation.</span>
          </div>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
          <div className="flex items-center gap-2 mb-2 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Schema Validation Error — Incompatible Features</span>
          </div>
          <p className="text-xs mb-3 text-rose-200/90">{validationError.error}</p>
          {validationError.missing_columns && (
            <div>
              <div className="text-[11px] font-mono text-rose-400 mb-1">
                Missing required features ({validationError.missing_columns.length}):
              </div>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 bg-[#0d121c] rounded border border-rose-500/20 text-[10px] font-mono text-rose-300">
                {validationError.missing_columns.map((c: string) => (
                  <span key={c} className="px-1.5 py-0.5 rounded bg-rose-500/20">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {errorMsg && !validationError && (
        <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Inference Results Section */}
      {detectionResult && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 m-0">Inference Results</h3>
                <p className="text-xs text-slate-400 m-0">
                  Session ID: <span className="font-mono text-blue-400">{detectionResult.session_id}</span> | Model:{' '}
                  <span className="font-mono text-slate-300">{detectionResult.model_used}</span>
                </p>
              </div>

              <a
                href={getExportCsvUrl(detectionResult.session_id)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#162136] hover:bg-[#1e2d4a] border border-[#233554] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export Predictions CSV</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Analyzed"
                value={detectionResult.total_records.toLocaleString()}
                subtitle={`File: ${detectionResult.filename}`}
                icon={FileText}
              />
              <MetricCard
                title="Normal Traffic"
                value={`${detectionResult.normal_count} (${detectionResult.normal_percentage}%)`}
                subtitle="Classified as legitimate communication"
                icon={ShieldCheck}
                badge="Clean"
                badgeType="success"
              />
              <MetricCard
                title="Malicious Infiltration"
                value={`${detectionResult.malicious_count} (${detectionResult.malicious_percentage}%)`}
                subtitle="Identified anomalous or attack signatures"
                icon={ShieldAlert}
                badge={detectionResult.malicious_count > 0 ? 'Threat Detected' : 'Zero Threats'}
                badgeType={detectionResult.malicious_count > 0 ? 'danger' : 'success'}
              />
              <MetricCard
                title="Mean Confidence"
                value={`${(detectionResult.average_confidence * 100).toFixed(1)}%`}
                subtitle="Scikit-Learn prediction probability"
                icon={CheckCircle}
                badge="Calibrated"
                badgeType="default"
              />
            </div>
          </div>

          {/* Breakdown Badges */}
          <div className="p-4 rounded-lg bg-[#101726] border border-[#1b263b] flex flex-wrap items-center gap-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Category Distribution:
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(detectionResult.attack_breakdown).map(([cat, count]) => {
                const isNorm = cat === 'Normal';
                return (
                  <div
                    key={cat}
                    className={`px-3 py-1 rounded-md text-xs font-mono border flex items-center gap-2 ${
                      isNorm
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Predictions Data Table */}
          <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 m-0">Flow Predictions Table</h3>
                <p className="text-xs text-slate-400 m-0">Showing per-flow classification with original relevant network metrics</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by protocol, service, class..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#0b101a] border border-[#1e2a3f] rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1b263b] text-slate-400 font-mono text-[11px]">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Protocol</th>
                    <th className="pb-2 font-medium">Service</th>
                    <th className="pb-2 font-medium">Flag</th>
                    <th className="pb-2 font-medium">Src Bytes</th>
                    <th className="pb-2 font-medium">Dst Bytes</th>
                    <th className="pb-2 font-medium">Duration</th>
                    <th className="pb-2 font-medium">Verdict</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#162033] text-slate-300 font-mono text-xs">
                  {paginatedRecords.map((r) => (
                    <tr key={r.record_index} className="hover:bg-[#131c2d] transition-colors">
                      <td className="py-2 text-slate-500">{r.record_index}</td>
                      <td className="py-2 font-medium text-blue-400">{r.protocol_type}</td>
                      <td className="py-2 text-slate-300">{r.service}</td>
                      <td className="py-2 text-slate-400">{r.flag}</td>
                      <td className="py-2">{r.src_bytes.toLocaleString()}</td>
                      <td className="py-2">{r.dst_bytes.toLocaleString()}</td>
                      <td className="py-2">{r.duration}</td>
                      <td className="py-2">
                        <StatusBadge
                          label={r.predicted_class}
                          variant={r.predicted_class === 'Normal' ? 'normal' : 'malicious'}
                        />
                      </td>
                      <td className="py-2">
                        <StatusBadge label={r.attack_category} />
                      </td>
                      <td className="py-2 text-right font-medium text-slate-200">
                        {(r.confidence * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {paginatedRecords.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-500">
                        No records matched your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 pt-3 border-t border-[#1a253a] flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-[#131c2d] hover:bg-[#1a263d] disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-[#131c2d] hover:bg-[#1a263d] disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
