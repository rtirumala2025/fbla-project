/**
 * TrendChart Component
 * Displays trend data as an area chart
 */
import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendSeries } from '../../types/analytics';

type Props = {
  series: TrendSeries;
  color?: string;
};

const TrendChartComponent: React.FC<Props> = ({ series, color = '#6366F1' }) => {
  const data = React.useMemo(() => 
    series.points.map((point) => ({
    name: new Date(point.timestamp).toLocaleDateString(),
    value: point.value,
    })),
    [series.points]
  );
  
  const gradientId = React.useMemo(() => `trend-${series.label.replace(/\s+/g, '-').toLowerCase()}`, [series.label]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft" style={{ contain: 'layout style paint', willChange: 'auto' }}>
      <h3 className="text-sm font-semibold text-slate-700 capitalize">{series.label}</h3>
      <div className="mt-4 h-56" style={{ minHeight: '224px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%" debounce={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor={color} stopOpacity={0.9} />
                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => value.toFixed(1)} />
            <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

TrendChartComponent.displayName = 'TrendChart';

export const TrendChart = React.memo(TrendChartComponent);

export default TrendChart;

