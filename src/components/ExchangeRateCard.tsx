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
  asOfDate: string;
  selectedDate: Date;
}

// Format number with exactly 4 decimal places
function formatRate(value: number): string {
  return value.toFixed(4);
}

// Format change with +/- sign
function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(4)}`;
}

// Calculate percentage change
function formatPercentChange(current: number, prior: number): string {
  if (prior === 0) return 'N/A';
  const pctChange = ((current - prior) / prior) * 100;
  const sign = pctChange >= 0 ? '+' : '';
  return `${sign}${pctChange.toFixed(2)}%`;
}

export function ExchangeRateCard({
  title,
  data,
  loading,
  error,
  dataSource,
  dataSourceUrl,
  asOfDate,
  selectedDate,
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
      link.download = `${title.replace(/\s+/g, '_')}_${asOfDate.replace(/\//g, '-')}.png`;
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
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <span>Loading data from FRED...</span>
        </div>
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

  const last14Days = filterObservationsByDays(data.observations, 14, selectedDate);
  const last30Days = filterObservationsByDays(data.observations, 30, selectedDate);
  const last60Days = filterObservationsByDays(data.observations, 60, selectedDate);
  const last90Days = filterObservationsByDays(data.observations, 90, selectedDate);
  const last120Days = filterObservationsByDays(data.observations, 120, selectedDate);

  return (
    <div className="exchange-rate-card" ref={cardRef}>
      <div className="card-header">
        <h2>{title}</h2>
        <div className="header-right">
          <span className="data-date">Data as of: {asOfDate}</span>
          <div className="thor-logo">
            <svg viewBox="0 0 50 50" width="36" height="36">
              <rect x="5" y="5" width="40" height="40" fill="#4a5d23" rx="6" />
              <text x="25" y="30" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">
                THOR
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="card-content">
        <div className="metrics-row">
          <div className="metric-box">
            <div className="metric-value">{formatRate(data.current)}</div>
            <div className="metric-label">Current Rate</div>
          </div>
          <div className="metric-box">
            <div className="metric-value">{formatRate(data.priorYear)}</div>
            <div className="metric-label">Prior Year</div>
          </div>
          <div className="metric-box">
            <div className={`metric-value ${data.yoyChange >= 0 ? 'positive' : 'negative'}`}>
              {formatChange(data.yoyChange)}
            </div>
            <div className="metric-label">YOY Change</div>
          </div>
          <div className="metric-box">
            <div className={`metric-value pct ${data.yoyChange >= 0 ? 'positive' : 'negative'}`}>
              {formatPercentChange(data.current, data.priorYear)}
            </div>
            <div className="metric-label">YOY %</div>
          </div>
          <div className="export-actions">
            <button onClick={handleExport} className="export-btn" title="Export as PNG">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="data-source">
          <span className="source-label">Source:</span> {dataSource}
          {' | '}
          <a href={dataSourceUrl} target="_blank" rel="noopener noreferrer">
            View source
          </a>
          <p className="note">
            Prior year comparison reflects the closest trading day with available data.
          </p>
        </div>

        <div className="charts-grid">
          <div className="chart-row">
            <ExchangeRateChart data={last14Days} title="14 Days" />
            <ExchangeRateChart data={last30Days} title="30 Days" />
          </div>
          <div className="chart-row">
            <ExchangeRateChart data={last60Days} title="60 Days" />
            <ExchangeRateChart data={last90Days} title="90 Days" />
          </div>
          <div className="chart-row full-width">
            <ExchangeRateChart data={last120Days} title="120 Days" />
          </div>
        </div>
      </div>
    </div>
  );
}
