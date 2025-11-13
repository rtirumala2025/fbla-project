/**
 * API client for analytics feature
 * Handles fetching analytics snapshots, weekly summaries, and CSV exports
 */
import { apiRequest } from './httpClient';
import type { AnalyticsCSVResponse, AnalyticsSnapshot, WeeklySummary } from '../types/analytics';

const API_BASE = '/api/analytics';

export async function fetchSnapshot(): Promise<AnalyticsSnapshot> {
  return apiRequest<AnalyticsSnapshot>(`${API_BASE}/snapshot`);
}

export async function fetchWeeklySummary(endDate?: string): Promise<WeeklySummary> {
  const url = endDate ? `${API_BASE}/daily?end_date=${encodeURIComponent(endDate)}` : `${API_BASE}/daily`;
  return apiRequest<WeeklySummary>(url);
}

export async function exportReports(start: string, end: string): Promise<AnalyticsCSVResponse> {
  const url = `${API_BASE}/export?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
  const response = await apiRequest<{ filename: string; content: string }>(url);
  return {
    filename: response.filename || `care-report-${start}-to-${end}.csv`,
    content: response.content,
  };
}

