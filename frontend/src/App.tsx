import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { DetectPage } from './pages/DetectPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModelPage } from './pages/ModelPage';
import { TrainingPage } from './pages/TrainingPage';
import { DatasetPage } from './pages/DatasetPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { SystemStatus, DatasetStatus, ModelStatus } from './types';
import { fetchSystemStatus, fetchDatasetStatus, fetchModelStatus } from './services/api';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const loadGlobalState = async () => {
    setIsRefreshing(true);
    setConnectionError(null);
    try {
      const [sys, ds, ms] = await Promise.all([
        fetchSystemStatus(),
        fetchDatasetStatus().catch(() => null),
        fetchModelStatus().catch(() => null)
      ]);
      setSystemStatus(sys);
      setDatasetStatus(ds);
      setModelStatus(ms);
    } catch (err: any) {
      console.warn('Backend connection warning:', err);
      setConnectionError(
        'Unable to communicate with FastAPI backend on port 8000. Ensure "uvicorn backend.main:app" is running.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadGlobalState();
    // Periodic telemetry ping every 20 seconds
    const interval = setInterval(loadGlobalState, 20000);
    return () => clearInterval(interval);
  }, []);

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Security Operations Dashboard',
      subtitle: 'Live system telemetry, active model performance, and detection overview'
    },
    detect: {
      title: 'Analyze Network Traffic',
      subtitle: 'Upload network connection CSV files for schema validation and ML inference'
    },
    monitoring: {
      title: 'Dataset-Based Traffic Monitoring',
      subtitle: 'Sequential ingestion and continuous batch evaluation of network flows'
    },
    analytics: {
      title: 'Cybersecurity Analytics & Evaluation',
      subtitle: 'Detailed confusion matrices, multi-model benchmarks, and feature importance'
    },
    model: {
      title: 'Model Inspection & Artifacts',
      subtitle: 'Champion model architecture, hyperparameters, and classification reports'
    },
    training: {
      title: 'Model Training Console',
      subtitle: 'Execute multi-algorithm training, comparison, and automated model selection'
    },
    dataset: {
      title: 'Dataset Specification',
      subtitle: 'Canadian Institute for Cybersecurity (UNB) NSL-KDD benchmark metadata and samples'
    },
    documentation: {
      title: 'Technical Documentation',
      subtitle: 'Architecture specifications, ML methodology, and RESTful API reference'
    }
  };

  const currentMeta = pageMeta[activeTab] || {
    title: 'Network Intrusion Detection System',
    subtitle: 'IEEE Ignite Problem Statement 33'
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          systemStatus={systemStatus}
          datasetStatus={datasetStatus}
          modelStatus={modelStatus}
          onRefresh={loadGlobalState}
          isRefreshing={isRefreshing}
        />

        {connectionError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{connectionError}</span>
            </div>
            <button
              onClick={loadGlobalState}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-mono cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        <main className="flex-1 pb-12">
          {activeTab === 'dashboard' && (
            <DashboardPage
              systemStatus={systemStatus}
              datasetStatus={datasetStatus}
              modelStatus={modelStatus}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'detect' && <DetectPage />}

          {activeTab === 'monitoring' && <MonitoringPage />}

          {activeTab === 'analytics' && <AnalyticsPage />}

          {activeTab === 'model' && (
            <ModelPage onNavigateToTraining={() => setActiveTab('training')} />
          )}

          {activeTab === 'training' && (
            <TrainingPage onNavigateToModel={() => setActiveTab('model')} />
          )}

          {activeTab === 'dataset' && <DatasetPage />}

          {activeTab === 'documentation' && <DocumentationPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
