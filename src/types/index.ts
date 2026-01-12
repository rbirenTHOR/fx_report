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
