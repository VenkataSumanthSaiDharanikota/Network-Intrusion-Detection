import React from 'react';
import {
  BookOpen,
  Code,
  ShieldAlert,
  Cpu,
  Database,
  Layers,
  CheckCircle,
  ExternalLink,
  Lock
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  const apiEndpoints = [
    { method: 'GET', path: '/api/health', desc: 'System health check and version status' },
    { method: 'GET', path: '/api/system/status', desc: 'System telemetry, backend status, and historical counters' },
    { method: 'GET', path: '/api/dataset/status', desc: 'Dataset availability, file sizes, and record distributions' },
    { method: 'POST', path: '/api/dataset/download', desc: 'Download authentic NSL-KDD benchmark from research mirror' },
    { method: 'GET', path: '/api/dataset/samples', desc: 'List verified sample evaluation CSV files' },
    { method: 'GET', path: '/api/model/status', desc: 'Active champion model status and metadata' },
    { method: 'POST', path: '/api/model/train', desc: 'Initiate background training and multi-algorithm evaluation' },
    { method: 'GET', path: '/api/model/metrics', desc: 'Champion evaluation metrics and confusion matrix' },
    { method: 'GET', path: '/api/model/comparison', desc: 'Benchmark comparison between Logistic Regression, Random Forest, and HistGradientBoosting' },
    { method: 'POST', path: '/api/detection/upload', desc: 'Upload traffic CSV, validate schema, and execute ML inference' },
    { method: 'GET', path: '/api/detection/history', desc: 'Retrieve historical detection sessions from local SQLite' },
    { method: 'GET', path: '/api/detection/session/{id}/export', desc: 'Export prediction results as a downloadable CSV' },
    { method: 'GET', path: '/api/analytics/class-distribution', desc: 'Dataset and historical detection distribution analytics' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-slate-100 m-0">System Documentation & Technical Specifications</h2>
        </div>
        <p className="text-xs text-slate-400 m-0 mt-1">
          Complete engineering reference for IEEE Ignite Problem Statement 33 — Network Intrusion Detection System.
        </p>
      </div>

      {/* 1. Problem Statement */}
      <section className="bg-[#101726] border border-[#1b263b] rounded-lg p-5 space-y-3">
        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">1. Problem Statement Overview</div>
        <h3 className="text-sm font-semibold text-slate-100 m-0">Problem Statement 33 — Network Intrusion Detection</h3>
        <p className="text-xs text-slate-300 leading-relaxed m-0">
          <span className="italic font-medium text-slate-200">
            "Develop a classification or anomaly detection system that identifies potentially malicious network activity using an appropriately sourced network traffic dataset."
          </span>
        </p>
        <p className="text-xs text-slate-400 leading-relaxed m-0">
          Modern enterprise computer networks face continuous threats ranging from automated port scanners and denial-of-service (DoS) floods to stealthy privilege escalation attacks. This system implements an end-to-end, production-grade Machine Learning pipeline trained and evaluated on authentic flow telemetry from the University of New Brunswick (UNB) NSL-KDD benchmark.
        </p>
      </section>

      {/* 2. System Architecture */}
      <section className="bg-[#101726] border border-[#1b263b] rounded-lg p-5 space-y-4">
        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">2. System Architecture</div>
        <p className="text-xs text-slate-300 leading-relaxed m-0">
          The architecture cleanly decouples the analytical Machine Learning backend from the responsive user interface, using local SQLite persistence for detection sessions.
        </p>

        {/* Architecture Diagram */}
        <div className="p-4 rounded-lg bg-[#0a0f18] border border-[#162236] font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
          <pre>{`
  +--------------------------------------------------------------------------+
  |                   React + TypeScript + Tailwind Frontend                 |
  |   Dashboard  |  Detect Traffic  |  Dataset Monitoring  |  Analytics      |
  +--------------------------------------------------------------------------+
                                       | HTTP REST API
                                       v
  +--------------------------------------------------------------------------+
  |                         FastAPI Backend (Port 8000)                      |
  |  /api/system  |  /api/dataset  |  /api/model  |  /api/detection  |  /db   |
  +--------------------------------------------------------------------------+
            |                                         |
            v                                         v
  +--------------------+                    +--------------------------------+
  |  SQLite Database   |                    |   Scikit-Learn ML Pipeline     |
  | - Sessions Log     |                    | - DataCleaner (Inf/NaN removal)|
  | - Threat Telemetry |                    | - ColumnTransformer            |
  | - Training History |                    |   * Median SimpleImputer       |
  +--------------------+                    |   * StandardScaler (Flows)     |
                                            |   * OneHotEncoder (Protocols)  |
                                            | - Candidate Classifiers:       |
                                            |   * Logistic Regression        |
                                            |   * Random Forest (100 trees)  |
                                            |   * HistGradientBoosting       |
                                            +--------------------------------+
          `}</pre>
        </div>
      </section>

      {/* 3. Machine Learning Pipeline */}
      <section className="bg-[#101726] border border-[#1b263b] rounded-lg p-5 space-y-4">
        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">3. Machine Learning Pipeline & Zero Leakage</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded bg-[#0b101a] border border-[#1a253a]">
            <div className="text-xs font-semibold text-slate-200 mb-1">1. Preprocessing Pipeline</div>
            <p className="text-[11px] text-slate-400 leading-relaxed m-0">
              Numeric attributes undergo median imputation and standard normalization. Categorical fields (<span className="font-mono text-blue-400">protocol_type</span>, <span className="font-mono text-blue-400">service</span>, <span className="font-mono text-blue-400">flag</span>) use one-hot encoding with <span className="font-mono text-blue-400">handle_unknown='ignore'</span> to gracefully ingest novel network services.
            </p>
          </div>

          <div className="p-3.5 rounded bg-[#0b101a] border border-[#1a253a]">
            <div className="text-xs font-semibold text-slate-200 mb-1">2. Zero Data Leakage</div>
            <p className="text-[11px] text-slate-400 leading-relaxed m-0">
              The preprocessing pipeline is fitted strictly on the 25,192 training records. The held-out test split (22,544 records) and user-uploaded inference files are strictly transformed using the saved preprocessor artifact without fitting.
            </p>
          </div>

          <div className="p-3.5 rounded bg-[#0b101a] border border-[#1a253a]">
            <div className="text-xs font-semibold text-slate-200 mb-1">3. Champion Model Selection</div>
            <p className="text-[11px] text-slate-400 leading-relaxed m-0">
              Candidate models are trained and compared. The champion model is selected using the <span className="text-emerald-400 font-semibold">Macro F1-Score</span> to guarantee balanced sensitivity across both majority normal traffic and minority attack classes.
            </p>
          </div>
        </div>
      </section>

      {/* 4. API Endpoints Table */}
      <section className="bg-[#101726] border border-[#1b263b] rounded-lg p-5 space-y-3">
        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">4. RESTful API Architecture</div>
        <p className="text-xs text-slate-400 m-0 mb-2">
          FastAPI endpoints serving live telemetry, model inspection, and inference:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-[#1b263b] text-slate-400 text-[11px]">
                <th className="pb-2 font-medium w-20">Method</th>
                <th className="pb-2 font-medium w-64">Endpoint</th>
                <th className="pb-2 font-medium font-sans">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#162033] text-slate-300 text-xs">
              {apiEndpoints.map((ep) => (
                <tr key={ep.path} className="hover:bg-[#131c2d]">
                  <td className="py-2 text-blue-400 font-bold">{ep.method}</td>
                  <td className="py-2 text-slate-200">{ep.path}</td>
                  <td className="py-2 text-slate-400 font-sans">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Technical Integrity & Ethics */}
      <section className="bg-[#101726] border border-[#1b263b] rounded-lg p-5 space-y-3">
        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">5. Integrity & Cybersecurity Ethics</div>
        <div className="p-3 rounded bg-[#0a0f18] border border-[#1a253a] text-xs text-slate-400 leading-relaxed space-y-2">
          <p className="m-0">
            <span className="text-slate-200 font-semibold">No Synthetic/Fake Data Rule: </span>
            This implementation strictly rejects Math.random() counters, artificial attack tickers, or hardcoded predictions. All percentages, confusion matrices, and detection rates are mathematically derived from genuine Scikit-Learn models executing on authentic UNB NSL-KDD network flows.
          </p>
          <p className="m-0">
            <span className="text-slate-200 font-semibold">Ethical Use: </span>
            This Network Intrusion Detection System is developed for defensive perimeter inspection, educational security analysis, and academic benchmarking under IEEE Ignite guidelines.
          </p>
        </div>
      </section>
    </div>
  );
};
