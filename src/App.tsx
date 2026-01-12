import { useState, useEffect } from 'react';
import { ExchangeRateCard } from './components/ExchangeRateCard';
import { getExchangeRateData, SERIES_IDS } from './services/fredApi';
import type { ExchangeRateData } from './types';
import './App.css';

function App() {
  const [cadData, setCadData] = useState<ExchangeRateData | null>(null);
  const [eurData, setEurData] = useState<ExchangeRateData | null>(null);
  const [cadLoading, setCadLoading] = useState(true);
  const [eurLoading, setEurLoading] = useState(true);
  const [cadError, setCadError] = useState<string | null>(null);
  const [eurError, setEurError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      // Fetch CAD/USD data
      try {
        const cad = await getExchangeRateData(SERIES_IDS.CAD_USD, 150);
        setCadData(cad);
      } catch (err) {
        setCadError(err instanceof Error ? err.message : 'Failed to fetch CAD data');
      } finally {
        setCadLoading(false);
      }

      // Fetch EUR/USD data
      try {
        const eur = await getExchangeRateData(SERIES_IDS.EUR_USD, 150);
        setEurData(eur);
      } catch (err) {
        setEurError(err instanceof Error ? err.message : 'Failed to fetch EUR data');
      } finally {
        setEurLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="app">
      <h1 className="app-title">Currency Exchange Rates Dashboard</h1>
      <p className="app-subtitle">Live data from Federal Reserve Economic Data (FRED)</p>

      <div className="cards-container">
        <ExchangeRateCard
          title="CAD - USD Exchange Rates"
          data={cadData}
          loading={cadLoading}
          error={cadError}
          dataSource="Exchange Rates.org"
          dataSourceUrl="https://exchange-rates.org"
        />

        <ExchangeRateCard
          title="EUR - USD Exchange Rate"
          data={eurData}
          loading={eurLoading}
          error={eurError}
          dataSource="European Central Bank (ECB)"
          dataSourceUrl="https://data.ecb.europa.eu/main-figures/ecb-interest-rates-and-exchange-rates/exchange-rates"
        />
      </div>
    </div>
  );
}

export default App;
