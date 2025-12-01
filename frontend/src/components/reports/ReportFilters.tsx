/**
 * ReportFilters Component
 * Provides date range selection and metric selection for custom reports
 */
import React, { useEffect, useState } from 'react';
import { getAvailableMetrics } from '../../api/reports';
import type { MetricOption, ReportFilters as ReportFiltersType } from '../../types/analytics';

interface Props {
  onFiltersChange: (filters: ReportFiltersType) => void;
  initialFilters?: Partial<ReportFiltersType>;
}

export const ReportFilters: React.FC<Props> = ({ onFiltersChange, initialFilters }) => {
  const [startDate, setStartDate] = useState<string>(
    initialFilters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    initialFilters?.endDate || new Date().toISOString().split('T')[0]
  );
  const [availableMetrics, setAvailableMetrics] = useState<MetricOption[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    initialFilters?.selectedMetrics || []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const metrics = await getAvailableMetrics();
        setAvailableMetrics(metrics);
        // Select all by default if none selected
        if (selectedMetrics.length === 0) {
          setSelectedMetrics(metrics.map((m) => m.key));
        }
      } catch (error) {
        console.error('Failed to load metrics', error);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  useEffect(() => {
    if (!loading) {
      onFiltersChange({
        startDate,
        endDate,
        selectedMetrics,
      });
    }
  }, [startDate, endDate, selectedMetrics, loading, onFiltersChange]);

  const handleMetricToggle = (metricKey: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricKey) ? prev.filter((k) => k !== metricKey) : [...prev, metricKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedMetrics(availableMetrics.map((m) => m.key));
  };

  const handleDeselectAll = () => {
    setSelectedMetrics([]);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Report Filters</h2>

      {/* Date Range */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-2">
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
            className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 mb-2">
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={new Date().toISOString().split('T')[0]}
            className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Metric Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-slate-700">Select Metrics</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Select All
            </button>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-xs text-slate-600 hover:text-slate-800 font-medium"
            >
              Deselect All
            </button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {availableMetrics.map((metric) => (
            <label
              key={metric.key}
              className="flex items-start gap-2 p-3 rounded-2xl border border-slate-200 hover:border-primary/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric.key)}
                onChange={() => handleMetricToggle(metric.key)}
                className="mt-1 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{metric.label}</div>
                {metric.description && (
                  <div className="text-xs text-slate-500 mt-1">{metric.description}</div>
                )}
              </div>
            </label>
          ))}
        </div>
        {selectedMetrics.length === 0 && (
          <p className="text-sm text-amber-600 mt-2">⚠️ No metrics selected. Select at least one metric.</p>
        )}
      </div>
    </div>
  );
};

export default ReportFilters;
