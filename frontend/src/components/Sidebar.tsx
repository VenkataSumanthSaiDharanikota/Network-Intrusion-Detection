import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Activity,
  BarChart3,
  Cpu,
  Layers,
  Database,
  BookOpen,
  ShieldCheck,
  Server
} from 'lucide-react';
import { SystemStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: SystemStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  systemStatus
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'detect', label: 'Detect Traffic', icon: ShieldAlert },
    { id: 'monitoring', label: 'Dataset Monitoring', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'model', label: 'Model', icon: Cpu },
    { id: 'training', label: 'Training Console', icon: Layers },
    { id: 'dataset', label: 'Dataset', icon: Database },
    { id: 'documentation', label: 'Documentation', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-[#0d131f] border-r border-[#1a2333] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Project Branding */}
        <div className="px-5 py-5 border-b border-[#1a2333] flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-1.5">
              <span>NIDS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">PS-33</span>
            </div>
            <div className="text-[11px] text-slate-400 font-normal">Network Intrusion Detection</div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141d2e] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System info footer */}
      <div className="p-4 border-t border-[#1a2333] bg-[#0a0f18] text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-[11px]">Backend API</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${systemStatus?.backend_connected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            <span className={`text-[11px] font-mono ${systemStatus?.backend_connected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {systemStatus?.backend_connected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>IEEE Ignite '26</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
