import { useState, useEffect } from 'react';
import { ExchangeRateCard } from './components/ExchangeRateCard';
import { RvIndicatorCard } from './components/RvIndicatorCard';
import {
  getExchangeRateData,
  getLatestAvailableDate,
  getEconomicIndicatorData,
  SERIES_IDS,
  RV_INDICATORS,
} from './services/fredApi';
import type { ExchangeRateData, EconomicIndicatorData } from './types';
import './App.css';

type TabType = 'currency' | 'rv';

function formatDateForDisplay(dateStr: string): string {
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
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('currency');

  // Currency exchange rate state
  const [cadData, setCadData] = useState<ExchangeRateData | null>(null);
  const [eurData, setEurData] = useState<ExchangeRateData | null>(null);
  const [cadLoading, setCadLoading] = useState(true);
  const [eurLoading, setEurLoading] = useState(true);
  const [cadError, setCadError] = useState<string | null>(null);
  const [eurError, setEurError] = useState<string | null>(null);

  // RV indicators state
  const [rvData, setRvData] = useState<Record<string, EconomicIndicatorData | null>>({});
  const [rvLoading, setRvLoading] = useState<Record<string, boolean>>({});
  const [rvErrors, setRvErrors] = useState<Record<string, string | null>>({});
  const [rvDataFetched, setRvDataFetched] = useState(false);

  // Shared state
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
        const today = formatDateForInput(new Date());
        setMaxAvailableDate(today);
        setSelectedDate(today);
      } finally {
        setInitializing(false);
      }
    }

    initializeLatestDate();
  }, []);

  // Fetch currency data when selected date changes
  useEffect(() => {
    if (!selectedDate || initializing) return;

    async function fetchCurrencyData() {
      setCadLoading(true);
      setEurLoading(true);
      setCadError(null);
      setEurError(null);

      const endDate = parseLocalDate(selectedDate);

      try {
        const cad = await getExchangeRateData(SERIES_IDS.CAD_USD, 150, endDate);
        setCadData(cad);
      } catch (err) {
        setCadError(err instanceof Error ? err.message : 'Failed to fetch CAD data');
      } finally {
        setCadLoading(false);
      }

      try {
        const eur = await getExchangeRateData(SERIES_IDS.EUR_USD, 150, endDate);
        setEurData(eur);
      } catch (err) {
        setEurError(err instanceof Error ? err.message : 'Failed to fetch EUR data');
      } finally {
        setEurLoading(false);
      }
    }

    fetchCurrencyData();
  }, [selectedDate, initializing]);

  // Fetch RV data when tab is switched to RV or date changes
  useEffect(() => {
    if (!selectedDate || initializing || activeTab !== 'rv') return;
    if (rvDataFetched && Object.keys(rvData).length > 0) return; // Already fetched

    async function fetchRvData() {
      const endDate = parseLocalDate(selectedDate);

      // Initialize loading states
      const loadingState: Record<string, boolean> = {};
      RV_INDICATORS.forEach((ind) => {
        loadingState[ind.seriesId] = true;
      });
      setRvLoading(loadingState);
      setRvErrors({});

      // Fetch all indicators in parallel
      const results = await Promise.allSettled(
        RV_INDICATORS.map(async (indicator) => {
          const data = await getEconomicIndicatorData(indicator.seriesId, 365, endDate);
          return { seriesId: indicator.seriesId, data };
        })
      );

      const newData: Record<string, EconomicIndicatorData | null> = {};
      const newErrors: Record<string, string | null> = {};
      const newLoading: Record<string, boolean> = {};

      results.forEach((result, index) => {
        const seriesId = RV_INDICATORS[index].seriesId;
        newLoading[seriesId] = false;

        if (result.status === 'fulfilled') {
          newData[seriesId] = result.value.data;
          newErrors[seriesId] = null;
        } else {
          newData[seriesId] = null;
          newErrors[seriesId] = result.reason?.message || 'Failed to fetch data';
        }
      });

      setRvData(newData);
      setRvErrors(newErrors);
      setRvLoading(newLoading);
      setRvDataFetched(true);
    }

    fetchRvData();
  }, [selectedDate, initializing, activeTab, rvDataFetched, rvData]);

  // Reset RV data fetched flag when date changes
  useEffect(() => {
    setRvDataFetched(false);
  }, [selectedDate]);

  const displayDate = selectedDate ? formatDateForDisplay(selectedDate) : '';

  if (initializing) {
    return (
      <div className="app">
        <h1 className="app-title">Economic Data Dashboard</h1>
        <p className="app-subtitle">Loading latest available data...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="app-title">Economic Data Dashboard</h1>
      <p className="app-subtitle">Live data from Federal Reserve Economic Data (FRED)</p>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'currency' ? 'active' : ''}`}
          onClick={() => setActiveTab('currency')}
        >
          Currency Exchange Rates
        </button>
        <button
          className={`tab-button ${activeTab === 'rv' ? 'active' : ''}`}
          onClick={() => setActiveTab('rv')}
        >
          RV Industry Indicators
        </button>
      </div>

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

      {/* Currency Tab Content */}
      {activeTab === 'currency' && (
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
      )}

      {/* RV Industry Tab Content */}
      {activeTab === 'rv' && (
        <div className="cards-container rv-cards">
          <div className="rv-intro">
            <h2>Key Economic Indicators for the RV Industry</h2>
            <p>
              These indicators help assess market conditions affecting recreational vehicle demand,
              including consumer confidence, financing costs, fuel prices, and overall economic health.
            </p>
          </div>

          {RV_INDICATORS.map((indicator) => (
            <RvIndicatorCard
              key={indicator.seriesId}
              config={indicator}
              data={rvData[indicator.seriesId] || null}
              loading={rvLoading[indicator.seriesId] ?? true}
              error={rvErrors[indicator.seriesId] || null}
              selectedDate={parseLocalDate(selectedDate)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
