import type { FredResponse, ExchangeRateData } from '../types';

const FRED_API_KEY = 'f146204c260b5bdc521ac704bf795d27';
const FRED_BASE_URL = '/api/fred/series/observations';

// Parse YYYY-MM-DD as local date to avoid timezone issues
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Format date as YYYY-MM-DD in local time
function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// FRED series IDs
export const SERIES_IDS = {
  CAD_USD: 'DEXCAUS', // Canada / U.S. Foreign Exchange Rate (CAD per USD, we need to invert)
  EUR_USD: 'DEXUSEU', // U.S. / Euro Foreign Exchange Rate (USD per EUR)
};

export async function fetchFredData(
  seriesId: string,
  startDate: string,
  endDate: string
): Promise<FredResponse> {
  const url = `${FRED_BASE_URL}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&observation_start=${startDate}&observation_end=${endDate}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FRED API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getLatestAvailableDate(seriesId: string): Promise<Date> {
  // Fetch recent data to find the latest available date
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Look back 30 days

  const response = await fetchFredData(
    seriesId,
    formatDateForApi(startDate),
    formatDateForApi(endDate)
  );

  // Filter out missing values and find the latest date
  const validObservations = response.observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => parseLocalDate(obs.date))
    .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

  if (validObservations.length === 0) {
    throw new Error('No data available');
  }

  return validObservations[0];
}

export async function getExchangeRateData(
  seriesId: string,
  daysBack: number = 120,
  asOfDate?: Date
): Promise<ExchangeRateData> {
  const endDate = asOfDate || new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - daysBack - 30); // Extra buffer for weekends/holidays

  // Also fetch prior year data
  const priorYearEnd = new Date(endDate);
  priorYearEnd.setFullYear(priorYearEnd.getFullYear() - 1);
  const priorYearStart = new Date(priorYearEnd);
  priorYearStart.setDate(priorYearStart.getDate() - 14);

  const [currentData, priorYearData] = await Promise.all([
    fetchFredData(
      seriesId,
      formatDateForApi(startDate),
      formatDateForApi(endDate)
    ),
    fetchFredData(
      seriesId,
      formatDateForApi(priorYearStart),
      formatDateForApi(priorYearEnd)
    ),
  ]);

  // Filter out missing values and parse (use local date parsing to avoid timezone issues)
  const observations = currentData.observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      date: parseLocalDate(obs.date),
      value: parseFloat(obs.value),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const priorYearObservations = priorYearData.observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      date: parseLocalDate(obs.date),
      value: parseFloat(obs.value),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first

  const currentValue = observations[observations.length - 1]?.value || 0;
  const priorYearValue = priorYearObservations[0]?.value || 0;
  const yoyChange = currentValue - priorYearValue;

  const latestDate = observations[observations.length - 1]?.date || new Date();

  return {
    current: currentValue,
    priorYear: priorYearValue,
    yoyChange,
    dataAsOf: latestDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }),
    observations,
  };
}

export function filterObservationsByDays(
  observations: { date: Date; value: number }[],
  days: number,
  asOfDate?: Date
): { date: Date; value: number }[] {
  if (observations.length === 0) return [];

  const latestDate = asOfDate || observations[observations.length - 1].date;
  const cutoffDate = new Date(latestDate);
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return observations.filter((obs) => obs.date >= cutoffDate && obs.date <= latestDate);
}
