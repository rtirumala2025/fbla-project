/**
 * Reports Page
 * Advanced reporting with date-range filters, custom metrics, and PDF export
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ReportFilters } from '../../components/reports/ReportFilters';
import { ReportView } from '../../components/reports/ReportView';
import { ForecastChart } from '../../components/reports/ForecastChart';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { fetchSnapshot } from '../../api/analytics';
import { exportPDF, forecastCost, getFilteredReport } from '../../api/reports';
import type { AnalyticsSnapshot, CostForecast, ReportFilters as ReportFiltersType } from '../../types/analytics';

export const ReportsPage: React.FC = () => {
  const toast = useToast();
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [forecast, setForecast] = useState<CostForecast | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [filters, setFilters] = useState<ReportFiltersType>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    selectedMetrics: [],
  });

  const loadSnapshot = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchSnapshot();
      setSnapshot(response);
    } catch (error: any) {
      console.error('Failed to load analytics snapshot', error);
      toast.error(error?.message || 'Unable to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const handleFiltersChange = useCallback((newFilters: ReportFiltersType) => {
    setFilters(newFilters);
    // Reload data if filters changed significantly
    if (snapshot) {
      loadSnapshot();
    }
  }, [snapshot, loadSnapshot]);

  const handleExportPDF = async () => {
    if (!snapshot) return;
    setExportingPDF(true);
    try {
      const start = filters.startDate;
      const end = filters.endDate;
      if (!start || !end) {
        throw new Error('Please select a valid date range');
      }
      // Convert date strings to proper format for backend
      const exportData = await exportPDF({
        start_date: start,  // ISO date string (YYYY-MM-DD)
        end_date: end,      // ISO date string (YYYY-MM-DD)
        selected_metrics: filters.selectedMetrics,
        include_charts: true,
        include_forecast: showForecast && forecast !== null,
      });
      
      // Decode base64 and create blob
      const binaryString = atob(exportData.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = exportData.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exported successfully.');
    } catch (error: any) {
      console.error('PDF export failed', error);
      toast.error(error?.message || 'Unable to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleLoadForecast = async () => {
    if (showForecast && forecast) {
      setShowForecast(false);
      return;
    }
    setLoadingForecast(true);
    try {
      const forecastData = await forecastCost(30);
      setForecast(forecastData);
      setShowForecast(true);
    } catch (error: any) {
      console.error('Failed to load forecast', error);
      toast.error(error?.message || 'Unable to load cost forecast');
    } finally {
      setLoadingForecast(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-6 pb-16 print-content">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:flex-row md:items-center md:justify-between no-print">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Custom Reports</h1>
            <p className="text-sm text-slate-500">
              Generate detailed analytics reports with custom date ranges and metric selection.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handlePrint}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary print-button"
            >
              Print
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
            >
              {exportingPDF ? 'Generating PDF…' : 'Export PDF'}
            </button>
            <button
              onClick={handleLoadForecast}
              disabled={loadingForecast}
              className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
            >
              {loadingForecast ? 'Loading…' : showForecast ? 'Hide Forecast' : 'Show Forecast'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="no-print">
          <ReportFilters onFiltersChange={handleFiltersChange} initialFilters={filters} />
        </div>

        {/* Report View */}
        <ReportView snapshot={snapshot} filters={filters} loading={loading} />

        {/* Cost Forecast Section */}
        {showForecast && forecast && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">AI-Enhanced Cost Forecast</h2>
            <ForecastChart forecast={forecast} />
          </div>
        )}

        {/* Print Footer */}
        <div className="print-footer no-print">
          Generated on {new Date().toLocaleDateString()} | Virtual Pet Care Reports
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
