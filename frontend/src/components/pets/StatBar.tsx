/**
 * StatBar Component
 * Reusable stat bar component with color-coded ranges:
 * - Red: < 30
 * - Yellow: 30-70
 * - Green: > 70
 */
import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
}

export const StatBar: React.FC<StatBarProps> = ({ 
  label, 
  value, 
  icon,
  className = '' 
}) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));
  
  // Determine color based on value
  const getBarColor = (val: number): string => {
    if (val < 30) return 'bg-red-500';
    if (val <= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const barColor = getBarColor(clampedValue);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-600">
          {Math.round(clampedValue)}%
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={Math.round(clampedValue)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${Math.round(clampedValue)}%`}
        />
      </div>
    </div>
  );
};

export default StatBar;

