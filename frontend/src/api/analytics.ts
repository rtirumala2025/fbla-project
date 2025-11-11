import type { AnalyticsCSVResponse, AnalyticsSnapshot, WeeklySummary } from '../types/analytics';

const API_BASE = '/api/analytics';

interface RequestOptions {
  token: string;
}

const headers = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export async function fetchSnapshot(options: RequestOptions): Promise<AnalyticsSnapshot> {
  const response = await fetch(`${API_BASE}/snapshot`, {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function fetchWeeklySummary(options: RequestOptions, endDate?: string): Promise<WeeklySummary> {
  const url = new URL(`${API_BASE}/daily`, window.location.origin);
  if (endDate) url.searchParams.set('end_date', endDate);
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function exportReports(
  options: RequestOptions,
  start: string,
  end: string,
): Promise<AnalyticsCSVResponse> {
  const url = new URL(`${API_BASE}/export`, window.location.origin);
  url.searchParams.set('start', start);
  url.searchParams.set('end', end);
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const content = await response.text();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="(.+)"/);
  return {
    filename: filenameMatch ? filenameMatch[1] : `care-report-${start}-to-${end}.csv`,
    content,
  };
}

