/**
 * API client for advanced reporting features
 * Handles PDF exports, cost forecasting, and filtered reports
 */
import { apiRequest } from './httpClient';
import type {
  CostForecast,
  MetricOption,
  PDFExportRequest,
  PDFExportResponse,
  ReportFilters,
} from '../types/analytics';

const API_BASE = '/api/reports';

export async function getAvailableMetrics(): Promise<MetricOption[]> {
  return apiRequest<MetricOption[]>(`${API_BASE}/metrics`);
}

export async function exportPDF(request: PDFExportRequest): Promise<PDFExportResponse> {
  return apiRequest<PDFExportResponse>(`${API_BASE}/export_pdf`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function forecastCost(forecastDays: number = 30): Promise<CostForecast> {
  return apiRequest<CostForecast>(`${API_BASE}/forecast_cost?forecast_days=${forecastDays}`, {
    method: 'POST',
  });
}

export async function getFilteredReport(filters: ReportFilters): Promise<any> {
  // Convert camelCase to snake_case for backend
  return apiRequest(`${API_BASE}/filtered`, {
    method: 'POST',
    body: JSON.stringify({
      start_date: filters.startDate,
      end_date: filters.endDate,
      selected_metrics: filters.selectedMetrics,
    }),
  });
}
