import React from 'react';

interface StatusBadgeProps {
  label: string;
  variant?: 'normal' | 'malicious' | 'dos' | 'probe' | 'r2l' | 'u2r' | 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant }) => {
  const norm = (label || '').toLowerCase();
  let v = variant;
  if (!v) {
    if (norm === 'normal') v = 'normal';
    else if (norm.includes('dos') || norm.includes('neptune') || norm.includes('smurf')) v = 'dos';
    else if (norm.includes('probe') || norm.includes('portsweep') || norm.includes('ipsweep') || norm.includes('satan')) v = 'probe';
    else if (norm.includes('r2l') || norm.includes('warez') || norm.includes('passwd')) v = 'r2l';
    else if (norm.includes('u2r') || norm.includes('buffer')) v = 'u2r';
    else if (norm.includes('malicious')) v = 'malicious';
    else v = 'neutral';
  }

  const styles: Record<string, string> = {
    normal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    malicious: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    dos: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    probe: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    r2l: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    u2r: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${styles[v] || styles.neutral}`}>
      {label}
    </span>
  );
};
