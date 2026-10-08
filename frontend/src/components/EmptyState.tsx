import React from 'react';
import { LucideIcon, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = AlertCircle,
  actionText,
  onAction,
  isLoading = false
}) => {
  return (
    <div className="bg-[#101726] border border-[#1a253a] border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center my-4">
      <div className="w-12 h-12 rounded-full bg-[#162136] border border-[#213252] flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          disabled={isLoading}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : actionText}
        </button>
      )}
    </div>
  );
};
