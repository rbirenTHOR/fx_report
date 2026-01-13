import { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import type { EconomicIndicatorData, RvIndicatorConfig } from '../types';
import { filterObservationsByDays } from '../services/fredApi';

interface RvIndicatorCardProps {
  config: RvIndicatorConfig;
  data: EconomicIndicatorData | null;
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  chart1Days?: number;
  chart2Days?: number;
}

function formatValue(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

function formatChange(value: number, decimals: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// Determine if change is "good" based on invert flag
function isPositiveChange(change: number, invert?: boolean): boolean {
  return invert ? change <= 0 : change >= 0;
}

// Helper to format days as label
function formatDaysLabel(days: number): string {
  if (days < 365) return days + ' Days';
  const years = Math.round(days / 365);
  return years === 1 ? '1 Year' : years + ' Years';
}

interface IndicatorChartProps {
  data: { date: Date; value: number }[];
  title: string;
  decimals: number;
  unit: string;
}

function IndicatorChart({ data, title, decimals, unit }: IndicatorChartProps) {
  if (data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <span className="chart-title">{title}</span>
        </div>
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || maxValue * 0.05;

  const chartData = {
    labels: data.map((d) => format(d.date, 'MMM d')),
    datasets: [
      {
        data: values,
        borderColor: '#5a6b2c',
        backgroundColor: 'rgba(90, 107, 44, 0.08)',
        borderWidth: 2,
        pointRadius: data.length > 60 ? 0 : data.length > 30 ? 2 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#5a6b2c',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: (items: any[]) => {
            if (items.length > 0) {
              const idx = items[0].dataIndex;
              return format(data[idx].date, 'MMM d, yyyy');
            }
            return '';
          },
          label: (item: any) => `${item.raw.toFixed(decimals)} ${unit}`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { maxTicksLimit: 5, font: { size: 10 }, color: '#666' },
        border: { display: false },
      },
      y: {
        display: true,
        position: 'right' as const,
        min: minValue - padding,
        max: maxValue + padding,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          maxTicksLimit: 4,
          font: { size: 9 },
          color: '#888',
          callback: (value: any) => value.toFixed(decimals > 2 ? 2 : decimals),
        },
        border: { display: false },
      },
    },
  };

  const firstValue = data[0]?.value;
  const lastValue = data[data.length - 1]?.value;
  const change = lastValue - firstValue;
  const changeClass = change >= 0 ? 'up' : 'down';

  return (
    <div className="chart-container">
      <div className="chart-header">
        <span className="chart-title">{title}</span>
        <span className={`chart-change ${changeClass}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(decimals)}
        </span>
      </div>
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
      <div className="chart-footer">
        <span className="chart-value">{firstValue.toFixed(decimals)}</span>
        <span className="chart-arrow">→</span>
        <span className="chart-value">{lastValue.toFixed(decimals)}</span>
      </div>
    </div>
  );
}

export function RvIndicatorCard({
  config,
  data,
  loading,
  error,
  selectedDate,
  chart1Days = 90,
  chart2Days = 180,
}: RvIndicatorCardProps) {
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
      link.download = `${config.shortName.replace(/\s+/g, '_')}_${data?.dataAsOf?.replace(/\//g, '-') || 'export'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="rv-indicator-card loading">
        <div className="card-header rv-header">
          <h2>{config.name}</h2>
        </div>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <span>Loading {config.shortName}...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rv-indicator-card error">
        <div className="card-header rv-header">
          <h2>{config.name}</h2>
        </div>
        <div className="error-content">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const isGood = isPositiveChange(data.yoyChange, config.invert);
  const chart1Data = filterObservationsByDays(data.observations, chart1Days, selectedDate);
  const chart2Data = filterObservationsByDays(data.observations, chart2Days, selectedDate);

  return (
    <div className="rv-indicator-card" ref={cardRef}>
      <div className="card-header rv-header">
        <div className="rv-header-left">
          <h2>{config.name}</h2>
          <p className="rv-description">{config.description}</p>
        </div>
        <div className="header-right">
          <span className="data-date">As of: {data.dataAsOf}</span>
        </div>
      </div>

      <div className="card-content">
        <div className="metrics-row">
          <div className="metric-box">
            <div className="metric-value">
              {formatValue(data.current, config.decimals)}
            </div>
            <div className="metric-label">Current ({config.unit})</div>
          </div>
          <div className="metric-box">
            <div className="metric-value">
              {formatValue(data.priorYear, config.decimals)}
            </div>
            <div className="metric-label">Prior Year</div>
          </div>
          <div className="metric-box">
            <div className={`metric-value ${isGood ? 'positive' : 'negative'}`}>
              {formatChange(data.yoyChange, config.decimals)}
            </div>
            <div className="metric-label">YOY Change</div>
          </div>
          <div className="metric-box">
            <div className={`metric-value pct ${isGood ? 'positive' : 'negative'}`}>
              {formatPercent(data.yoyPercent)}
            </div>
            <div className="metric-label">YOY %</div>
          </div>
          <div className="export-actions">
            <button onClick={handleExport} className="export-btn" title="Export as PNG">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="data-source">
          <span className="source-label">Source:</span> {config.sourceName}
          {' | '}
          <a href={config.sourceUrl} target="_blank" rel="noopener noreferrer">
            View on FRED
          </a>
        </div>

        <div className="charts-grid">
          <div className="chart-row">
            <IndicatorChart
              data={chart1Data}
              title={formatDaysLabel(chart1Days)}
              decimals={config.decimals}
              unit={config.unit}
            />
            <IndicatorChart
              data={chart2Data}
              title={formatDaysLabel(chart2Days)}
              decimals={config.decimals}
              unit={config.unit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
