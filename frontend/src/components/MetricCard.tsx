import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeType?: 'default' | 'success' | 'danger' | 'warning';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'default'
}) => {
  const badgeColors = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  };

  return (
    <div className="bg-[#101726] border border-[#1b263b] rounded-lg p-4 transition-colors hover:border-[#273854]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-7 h-7 rounded bg-[#162033] border border-[#22324e] flex items-center justify-center text-slate-400">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl font-bold font-mono text-slate-100 tracking-tight">{value}</div>
        {badge && (
          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${badgeColors[badgeType]}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-[11px] text-slate-400 truncate font-normal">
          {subtitle}
        </div>
      )}
    </div>
  );
};
