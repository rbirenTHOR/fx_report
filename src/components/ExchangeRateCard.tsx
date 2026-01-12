import { useRef } from 'react';
import { toPng } from 'html-to-image';
import type { ExchangeRateData } from '../types';
import { filterObservationsByDays } from '../services/fredApi';
import { ExchangeRateChart } from './ExchangeRateChart';

interface ExchangeRateCardProps {
  title: string;
  data: ExchangeRateData | null;
  loading: boolean;
  error: string | null;
  dataSource: string;
  dataSourceUrl: string;
}

export function ExchangeRateCard({
  title,
  data,
  loading,
  error,
  dataSource,
  dataSourceUrl,
}: ExchangeRateCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}_${data?.dataAsOf?.replace(/\//g, '-') || 'export'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="exchange-rate-card loading">
        <div className="card-header">
          <h2>{title}</h2>
        </div>
        <div className="loading-content">Loading data from FRED...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exchange-rate-card error">
        <div className="card-header">
          <h2>{title}</h2>
        </div>
        <div className="error-content">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const last14Days = filterObservationsByDays(data.observations, 14);
  const last30Days = filterObservationsByDays(data.observations, 30);
  const last60Days = filterObservationsByDays(data.observations, 60);
  const last90Days = filterObservationsByDays(data.observations, 90);
  const last120Days = filterObservationsByDays(data.observations, 120);

  return (
    <div className="exchange-rate-card" ref={cardRef}>
      <div className="card-header">
        <h2>{title}</h2>
        <div className="header-right">
          <span className="data-date">Data as of: {data.dataAsOf}</span>
          <div className="thor-logo">
            <svg viewBox="0 0 50 50" width="40" height="40">
              <rect x="5" y="5" width="40" height="40" fill="#4a5d23" rx="5" />
              <text x="25" y="32" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                THOR
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="card-content">
        <div className="metrics-row">
          <div className="metric-box">
            <div className="metric-value">{data.current.toFixed(4)}</div>
            <div className="metric-label">Current</div>
          </div>
          <div className="metric-box">
            <div className="metric-value">{data.priorYear.toFixed(4)}</div>
            <div className="metric-label">Prior Year</div>
          </div>
          <div className="metric-box">
            <div className={`metric-value ${data.yoyChange >= 0 ? 'positive' : 'negative'}`}>
              {data.yoyChange >= 0 ? '' : ''}{data.yoyChange.toFixed(4)}
            </div>
            <div className="metric-label">YOY Change</div>
          </div>
          <div className="export-actions">
            <button onClick={handleExport} className="export-btn" title="Export as PNG">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="data-source">
          <strong>Data Source:</strong> {dataSource}
          <br />
          <a href={dataSourceUrl} target="_blank" rel="noopener noreferrer">
            {dataSourceUrl}
          </a>
          <p className="note">
            <em>Note: Prior year comparison reflects the closest date with reportable data from the prior year.</em>
          </p>
        </div>

        <div className="charts-grid">
          <div className="chart-row">
            <ExchangeRateChart data={last14Days} title="Last 14 Days" />
            <ExchangeRateChart data={last30Days} title="Last 30 Days" />
          </div>
          <div className="chart-row">
            <ExchangeRateChart data={last60Days} title="Last 60 Days" />
            <ExchangeRateChart data={last90Days} title="Last 90 Days" />
          </div>
          <div className="chart-row full-width">
            <ExchangeRateChart data={last120Days} title="Last 120 Days" />
          </div>
        </div>
      </div>
    </div>
  );
}
