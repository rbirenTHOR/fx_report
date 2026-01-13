export interface FredObservation {
  date: string;
  value: string;
}

export interface FredResponse {
  observations: FredObservation[];
}

export interface ExchangeRateData {
  current: number;
  priorYear: number;
  yoyChange: number;
  dataAsOf: string;
  observations: { date: Date; value: number }[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

// RV Industry Economic Indicator types
export interface EconomicIndicatorData {
  current: number;
  priorYear: number;
  yoyChange: number;
  yoyPercent: number;
  dataAsOf: string;
  observations: { date: Date; value: number }[];
}

export interface RvIndicatorConfig {
  seriesId: string;
  name: string;
  shortName: string;
  description: string;
  unit: string;
  decimals: number;
  sourceUrl: string;
  sourceName: string;
  invert?: boolean; // For rates where lower is better
}
