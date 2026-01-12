import { useState, useEffect } from 'react';
import { ExchangeRateCard } from './components/ExchangeRateCard';
import { getExchangeRateData, getLatestAvailableDate, SERIES_IDS } from './services/fredApi';
import type { ExchangeRateData } from './types';
import './App.css';

function formatDateForDisplay(dateStr: string): string {
  // Parse YYYY-MM-DD without timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr: string): Date {
  // Parse YYYY-MM-DD as local date, not UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function App() {
  const [cadData, setCadData] = useState<ExchangeRateData | null>(null);
  const [eurData, setEurData] = useState<ExchangeRateData | null>(null);
  const [cadLoading, setCadLoading] = useState(true);
  const [eurLoading, setEurLoading] = useState(true);
  const [cadError, setCadError] = useState<string | null>(null);
  const [eurError, setEurError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [maxAvailableDate, setMaxAvailableDate] = useState<string>('');
  const [initializing, setInitializing] = useState(true);

  // On mount, determine the latest available date from FRED
  useEffect(() => {
    async function initializeLatestDate() {
      try {
        const latestDate = await getLatestAvailableDate(SERIES_IDS.CAD_USD);
        const dateStr = formatDateForInput(latestDate);
        setMaxAvailableDate(dateStr);
        setSelectedDate(dateStr);
      } catch (err) {
        console.error('Failed to get latest date:', err);
        // Fallback to today
        const today = formatDateForInput(new Date());
        setMaxAvailableDate(today);
        setSelectedDate(today);
      } finally {
        setInitializing(false);
      }
    }

    initializeLatestDate();
  }, []);

  // Fetch data when selected date changes
  useEffect(() => {
    if (!selectedDate || initializing) return;

    async function fetchData() {
      setCadLoading(true);
      setEurLoading(true);
      setCadError(null);
      setEurError(null);

      const endDate = parseLocalDate(selectedDate);

      // Fetch CAD/USD data
      try {
        const cad = await getExchangeRateData(SERIES_IDS.CAD_USD, 150, endDate);
        setCadData(cad);
      } catch (err) {
        setCadError(err instanceof Error ? err.message : 'Failed to fetch CAD data');
      } finally {
        setCadLoading(false);
      }

      // Fetch EUR/USD data
      try {
        const eur = await getExchangeRateData(SERIES_IDS.EUR_USD, 150, endDate);
        setEurData(eur);
      } catch (err) {
        setEurError(err instanceof Error ? err.message : 'Failed to fetch EUR data');
      } finally {
        setEurLoading(false);
      }
    }

    fetchData();
  }, [selectedDate, initializing]);

  const displayDate = selectedDate ? formatDateForDisplay(selectedDate) : '';

  if (initializing) {
    return (
      <div className="app">
        <h1 className="app-title">Currency Exchange Rates Dashboard</h1>
        <p className="app-subtitle">Loading latest available data...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="app-title">Currency Exchange Rates Dashboard</h1>
      <p className="app-subtitle">Live data from Federal Reserve Economic Data (FRED)</p>

      <div className="date-selector">
        <label>Point in Time: </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={maxAvailableDate}
        />
        <span className="date-hint">(Latest available: {formatDateForDisplay(maxAvailableDate)})</span>
      </div>

      <div className="cards-container">
        <ExchangeRateCard
          title="CAD - USD Exchange Rates"
          data={cadData}
          loading={cadLoading}
          error={cadError}
          dataSource="Exchange Rates.org"
          dataSourceUrl="https://exchange-rates.org"
          asOfDate={displayDate}
          selectedDate={parseLocalDate(selectedDate)}
        />

        <ExchangeRateCard
          title="EUR - USD Exchange Rate"
          data={eurData}
          loading={eurLoading}
          error={eurError}
          dataSource="European Central Bank (ECB)"
          dataSourceUrl="https://data.ecb.europa.eu/main-figures/ecb-interest-rates-and-exchange-rates/exchange-rates"
          asOfDate={displayDate}
          selectedDate={parseLocalDate(selectedDate)}
        />
      </div>
    </div>
  );
}

export default App;
