import type { FredResponse, ExchangeRateData, EconomicIndicatorData, RvIndicatorConfig } from '../types';

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

// RV Industry Economic Indicators - FRED Series
export const RV_INDICATORS: RvIndicatorConfig[] = [
  {
    seriesId: 'UMCSENT',
    name: 'Consumer Sentiment Index',
    shortName: 'Consumer Sentiment',
    description: 'University of Michigan Consumer Sentiment - key indicator for discretionary purchases like RVs',
    unit: 'Index',
    decimals: 1,
    sourceUrl: 'https://fred.stlouisfed.org/series/UMCSENT',
    sourceName: 'University of Michigan',
  },
  {
    seriesId: 'MORTGAGE30US',
    name: '30-Year Fixed Mortgage Rate',
    shortName: 'Mortgage Rate',
    description: 'Average 30-year fixed rate mortgage - affects RV financing and home equity loans used for RV purchases',
    unit: '%',
    decimals: 2,
    sourceUrl: 'https://fred.stlouisfed.org/series/MORTGAGE30US',
    sourceName: 'Freddie Mac',
    invert: true,
  },
  {
    seriesId: 'GASREGW',
    name: 'Regular Gasoline Price',
    shortName: 'Gas Price',
    description: 'U.S. Regular Conventional Gas Price - major factor in RV operating costs',
    unit: '$/gal',
    decimals: 3,
    sourceUrl: 'https://fred.stlouisfed.org/series/GASREGW',
    sourceName: 'EIA',
    invert: true,
  },
  {
    seriesId: 'UNRATE',
    name: 'Unemployment Rate',
    shortName: 'Unemployment',
    description: 'Civilian Unemployment Rate - affects consumer confidence and purchasing power',
    unit: '%',
    decimals: 1,
    sourceUrl: 'https://fred.stlouisfed.org/series/UNRATE',
    sourceName: 'Bureau of Labor Statistics',
    invert: true,
  },
  {
    seriesId: 'TOTALSA',
    name: 'Total Vehicle Sales',
    shortName: 'Vehicle Sales',
    description: 'Total Vehicle Sales (millions of units) - indicates overall vehicle demand trends',
    unit: 'M units',
    decimals: 2,
    sourceUrl: 'https://fred.stlouisfed.org/series/TOTALSA',
    sourceName: 'Bureau of Economic Analysis',
  },
  {
    seriesId: 'DSPIC96',
    name: 'Real Disposable Personal Income',
    shortName: 'Disposable Income',
    description: 'Real Disposable Personal Income - purchasing power available for discretionary items',
    unit: 'B$',
    decimals: 0,
    sourceUrl: 'https://fred.stlouisfed.org/series/DSPIC96',
    sourceName: 'Bureau of Economic Analysis',
  },
];

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

// Fetch economic indicator data for RV industry tab
export async function getEconomicIndicatorData(
  seriesId: string,
  daysBack: number = 365,
  asOfDate?: Date
): Promise<EconomicIndicatorData> {
  const endDate = asOfDate || new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - daysBack - 60); // Extra buffer

  // Also fetch prior year data for YoY comparison
  const priorYearEnd = new Date(endDate);
  priorYearEnd.setFullYear(priorYearEnd.getFullYear() - 1);
  const priorYearStart = new Date(priorYearEnd);
  priorYearStart.setDate(priorYearStart.getDate() - 60);

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

  // Filter out missing values and parse
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
  const yoyPercent = priorYearValue !== 0 ? ((currentValue - priorYearValue) / priorYearValue) * 100 : 0;

  const latestDate = observations[observations.length - 1]?.date || new Date();

  return {
    current: currentValue,
    priorYear: priorYearValue,
    yoyChange,
    yoyPercent,
    dataAsOf: latestDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }),
    observations,
  };
}
