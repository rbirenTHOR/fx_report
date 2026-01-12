import type { FredResponse, ExchangeRateData } from '../types';

const FRED_API_KEY = 'f146204c260b5bdc521ac704bf795d27';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

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

export async function getExchangeRateData(
  seriesId: string,
  daysBack: number = 120
): Promise<ExchangeRateData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack - 30); // Extra buffer for weekends/holidays

  // Also fetch prior year data
  const priorYearEnd = new Date();
  priorYearEnd.setFullYear(priorYearEnd.getFullYear() - 1);
  const priorYearStart = new Date(priorYearEnd);
  priorYearStart.setDate(priorYearStart.getDate() - 14);

  const [currentData, priorYearData] = await Promise.all([
    fetchFredData(
      seriesId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ),
    fetchFredData(
      seriesId,
      priorYearStart.toISOString().split('T')[0],
      priorYearEnd.toISOString().split('T')[0]
    ),
  ]);

  // Filter out missing values and parse
  const observations = currentData.observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      date: new Date(obs.date),
      value: parseFloat(obs.value),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const priorYearObservations = priorYearData.observations
    .filter((obs) => obs.value !== '.')
    .map((obs) => ({
      date: new Date(obs.date),
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
  days: number
): { date: Date; value: number }[] {
  if (observations.length === 0) return [];

  const latestDate = observations[observations.length - 1].date;
  const cutoffDate = new Date(latestDate);
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return observations.filter((obs) => obs.date >= cutoffDate);
}
