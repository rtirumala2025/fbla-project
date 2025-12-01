/**
 * ForecastChart Component
 * Displays cost forecast with actual vs predicted comparison
 */
import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import type { CostForecast, ForecastDataPoint } from '../../types/analytics';

interface Props {
  forecast: CostForecast;
  actualData?: Array<{ date: string; cost: number }>;
}

export const ForecastChart: React.FC<Props> = ({ forecast, actualData = [] }) => {
  // Combine actual and forecast data
  const chartData = React.useMemo(() => {
    const data: any[] = [];

    // Add actual data points
    actualData.forEach((point) => {
      data.push({
        date: new Date(point.date).toLocaleDateString(),
        actual: point.cost,
        predicted: null,
        lower: null,
        upper: null,
      });
    });

    // Add forecast points
    forecast.forecast_points.forEach((point) => {
      data.push({
        date: new Date(point.date).toLocaleDateString(),
        actual: null,
        predicted: point.predicted_cost,
        lower: point.confidence_interval_lower,
        upper: point.confidence_interval_upper,
      });
    });

    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [forecast, actualData]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Cost Forecast</h3>
      <p className="text-xs text-slate-500 mb-4">
        {forecast.forecast_period_start} to {forecast.forecast_period_end}
      </p>
      <div className="h-64" style={{ minHeight: '256px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (value === null || value === undefined) return 'N/A';
                return [`$${value.toFixed(2)}`, name === 'predicted' ? 'Predicted' : name === 'actual' ? 'Actual' : name];
              }}
            />
            <Legend />
            {actualData.length > 0 && (
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#6366f1"
                fill="url(#actualGradient)"
                strokeWidth={2}
                name="Actual"
              />
            )}
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#f97316"
              fill="url(#forecastGradient)"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Predicted"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Current Avg Daily Cost:</span>
          <span className="font-semibold text-slate-900">
            ${forecast.current_average_daily_cost.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Predicted Avg Daily Cost:</span>
          <span className="font-semibold text-orange-600">
            ${forecast.predicted_average_daily_cost.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Total Predicted Cost:</span>
          <span className="font-semibold text-slate-900">
            ${forecast.total_predicted_cost.toFixed(2)}
          </span>
        </div>
      </div>
      {forecast.insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Insights</h4>
          <ul className="space-y-1">
            {forecast.insights.map((insight, idx) => (
              <li key={idx} className="text-xs text-slate-600">
                • {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ForecastChart;
