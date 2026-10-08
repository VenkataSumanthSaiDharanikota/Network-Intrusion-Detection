import React from 'react';
import { Database, Cpu, Wifi, RefreshCw } from 'lucide-react';
import { SystemStatus, ModelStatus, DatasetStatus } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  systemStatus: SystemStatus | null;
  datasetStatus: DatasetStatus | null;
  modelStatus: ModelStatus | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  systemStatus,
  datasetStatus,
  modelStatus,
  onRefresh,
  isRefreshing
}) => {
  return (
    <header className="h-16 border-b border-[#1a2333] bg-[#0d131f]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-sm font-semibold text-slate-100 m-0 tracking-tight">{title}</h1>
        <p className="text-[11px] text-slate-400 m-0">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#131b2a] border border-[#1e2a3f] text-xs">
          <Wifi className={`w-3.5 h-3.5 ${systemStatus?.backend_connected ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span className="text-[11px] text-slate-300 font-mono">
            {systemStatus?.backend_connected ? '127.0.0.1:8000' : 'Disconnected'}
          </span>
        </div>

        {/* Dataset Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#131b2a] border border-[#1e2a3f] text-xs">
          <Database className={`w-3.5 h-3.5 ${datasetStatus?.is_available ? 'text-blue-400' : 'text-amber-400'}`} />
          <span className="text-[11px] text-slate-300">
            {datasetStatus?.is_available ? 'NSL-KDD (47,736 rows)' : 'Dataset Missing'}
          </span>
        </div>

        {/* Model Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#131b2a] border border-[#1e2a3f] text-xs">
          <Cpu className={`w-3.5 h-3.5 ${modelStatus?.is_trained ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-[11px] text-slate-300 font-medium">
            {modelStatus?.is_trained
              ? `${modelStatus.metadata?.model_name || 'Champion'} v${modelStatus.metadata?.version || '1.0'}`
              : 'Untrained'}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded bg-[#131b2a] hover:bg-[#1a253a] border border-[#1e2a3f] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Refresh System Status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
