import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  ExternalLink,
  CheckCircle,
  FileText,
  Sliders,
  ShieldAlert,
  Info,
  Layers
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { DatasetStatus, SampleFileInfo } from '../types';
import {
  fetchDatasetStatus,
  fetchDatasetSamples,
  triggerDownloadDataset,
  getSampleDownloadUrl
} from '../services/api';

export const DatasetPage: React.FC = () => {
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus | null>(null);
  const [samples, setSamples] = useState<SampleFileInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDatasetInfo() {
      setLoading(true);
      try {
        const [ds, smp] = await Promise.all([
          fetchDatasetStatus().catch(() => null),
          fetchDatasetSamples().catch(() => [])
        ]);
        setDatasetStatus(ds);
        setSamples(smp);
      } catch (e) {
        console.error('Error loading dataset info:', e);
      } finally {
        setLoading(false);
      }
    }
    loadDatasetInfo();
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    setMessage('Connecting to research mirror to download NSL-KDD files...');
    try {
      const res = await triggerDownloadDataset();
      setDatasetStatus(res);
      const smp = await fetchDatasetSamples();
      setSamples(smp);
      setMessage('Dataset files verified and test samples successfully extracted.');
    } catch (err: any) {
      setMessage(`Download error: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const featureCategories = [
    {
      group: 'Basic Features (1–9)',
      description: 'Individual TCP/IP connection characteristics',
      items: ['duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 'land', 'wrong_fragment', 'urgent']
    },
    {
      group: 'Content Features (10–22)',
      description: 'Payload characteristics and privilege flags',
      items: ['hot', 'num_failed_logins', 'logged_in', 'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations', 'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login', 'is_guest_login']
    },
    {
      group: 'Time-Based Traffic Features (23–31)',
      description: 'Statistics computed within a 2-second sliding window',
      items: ['count', 'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate', 'srv_diff_host_rate']
    },
    {
      group: 'Host-Based Traffic Features (32–41)',
      description: 'Historical destination host access patterns (last 100 connections)',
      items: ['dst_host_count', 'dst_host_srv_count', 'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate', 'dst_host_serror_rate', 'dst_host_srv_serror_rate', 'dst_host_rerror_rate', 'dst_host_srv_rerror_rate']
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 m-0">Dataset Specification & Setup</h2>
          <p className="text-xs text-slate-400 m-0 mt-1">
            Canadian Institute for Cybersecurity (UNB) NSL-KDD benchmark intrusion detection dataset repository.
          </p>
        </div>

        <a
          href="https://www.unb.ca/cic/datasets/nsl.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#162136] hover:bg-[#1e2d4a] border border-[#233554] text-slate-300 text-xs font-medium transition-colors"
        >
          <span>Official UNB Source</span>
          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
        </a>
      </div>

      {/* Dataset State Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Dataset Name"
          value="NSL-KDD"
          subtitle="Univ. of New Brunswick"
          icon={Database}
          badge={datasetStatus?.is_available ? 'Verified' : 'Missing'}
          badgeType={datasetStatus?.is_available ? 'success' : 'warning'}
        />
        <MetricCard
          title="Training Flows"
          value={datasetStatus?.train_records?.toLocaleString() || '25,192'}
          subtitle={`Size: ${datasetStatus?.train_size_mb || '3.64'} MB`}
          icon={FileText}
        />
        <MetricCard
          title="Held-Out Test Flows"
          value={datasetStatus?.test_records?.toLocaleString() || '22,544'}
          subtitle={`Size: ${datasetStatus?.test_size_mb || '3.28'} MB`}
          icon={CheckCircle}
          badgeType="success"
        />
        <MetricCard
          title="Total Features"
          value={datasetStatus?.num_features || '41'}
          subtitle="Standard flow telemetry attributes"
          icon={Sliders}
        />
      </div>

      {message && (
        <div className="p-3 rounded-md bg-[#0e1626] border border-[#1b2b45] text-xs font-mono text-blue-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Dataset Setup / Download Card if needed */}
      {!datasetStatus?.is_available && (
        <div className="p-5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-amber-300">Dataset Download Required</div>
            <p className="text-xs text-amber-200/80 m-0 mt-0.5">
              The benchmark NSL-KDD dataset files are not currently saved in the local repository. Click below to fetch the authentic dataset from the verified research mirror.
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors shrink-0 cursor-pointer disabled:opacity-40"
          >
            {isDownloading ? 'Downloading...' : 'Download NSL-KDD'}
          </button>
        </div>
      )}

      {/* Pre-Packaged Evaluation Samples Download Box */}
      <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 m-0">Pre-Extracted Test Sample CSVs</h3>
            <p className="text-xs text-slate-400 m-0">
              Extracted from held-out test data for direct evaluation in the "Detect Traffic" tab
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Evaluation Samples
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {samples.map((s) => (
            <div key={s.filename} className="p-4 rounded-lg bg-[#0b101a] border border-[#1a253a] flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200 truncate">{s.filename}</div>
                <div className="text-[11px] text-slate-400 mt-1">{s.description}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-2">{s.size_kb} KB</div>
              </div>

              <a
                href={getSampleDownloadUrl(s.filename)}
                download={s.filename}
                className="mt-4 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[#162136] hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Breakdown Sections */}
      <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-100 m-0 mb-1">Standard Network Flow Features (41 Dimensions)</h3>
        <p className="text-xs text-slate-400 m-0 mb-5">
          Feature catalog as formalized by UNB Canadian Institute for Cybersecurity for network intrusion classification.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureCategories.map((cat) => (
            <div key={cat.group} className="p-4 rounded-lg bg-[#0a0f18] border border-[#182338]">
              <div className="text-xs font-semibold text-blue-400 mb-0.5">{cat.group}</div>
              <div className="text-[11px] text-slate-400 mb-3">{cat.description}</div>

              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((feat) => (
                  <span
                    key={feat}
                    className="px-2 py-0.5 rounded bg-[#131b2c] border border-[#1e2a3f] font-mono text-[10px] text-slate-300"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Citation & Licensing */}
      <div className="p-4 rounded-lg bg-[#0a0f18] border border-[#162236] text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300">Dataset Citation & Attribution:</div>
        <div>
          M. Tavallaee, E. Bagheri, W. Lu, and A. Ghorbani, "A Detailed Analysis of the KDD CUP 99 Data Set,"
          Submitted to Second IEEE Symposium on Computational Intelligence for Security and Defense Applications (CISDA), 2009.
        </div>
        <div className="text-[11px] text-slate-400 pt-1">
          The NSL-KDD dataset is provided by the Canadian Institute for Cybersecurity (CIC) for academic and scientific research on network intrusion detection systems.
        </div>
      </div>
    </div>
  );
};
