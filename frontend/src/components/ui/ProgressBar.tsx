import React from 'react';

type Props = {
  value: number;
  label: string;
  accessibleLabel?: string;
  color?: string;
};

export const ProgressBar: React.FC<Props> = ({ value, label, accessibleLabel, color = 'from-indigo-500 to-sky-400' }) => (
  <div className="space-y-1" role="group" aria-label={accessibleLabel ?? label}>
    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
      <span>{label}</span>
      <span>{Math.round(value)}%</span>
    </div>
    <div className="h-2 w-full rounded-full bg-slate-200" aria-hidden="true">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  </div>
);

export default ProgressBar;

