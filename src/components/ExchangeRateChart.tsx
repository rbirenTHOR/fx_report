import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ExchangeRateChartProps {
  data: { date: Date; value: number }[];
  title: string;
}

export function ExchangeRateChart({ data, title }: ExchangeRateChartProps) {
  if (data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-title">{title}</div>
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  // Calculate min/max for better Y-axis scaling
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || 0.01;

  const chartData = {
    labels: data.map((d) => format(d.date, 'MMM d')),
    datasets: [
      {
        data: values,
        borderColor: '#1a5276',
        backgroundColor: 'rgba(26, 82, 118, 0.08)',
        borderWidth: 2,
        pointRadius: data.length > 60 ? 0 : data.length > 30 ? 2 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#1a5276',
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
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
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
          label: (item: any) => {
            return `Rate: ${item.raw.toFixed(4)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 5,
          font: { size: 10 },
          color: '#666',
        },
        border: {
          display: false,
        },
      },
      y: {
        display: true,
        position: 'right' as const,
        min: minValue - padding,
        max: maxValue + padding,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          maxTicksLimit: 4,
          font: { size: 9 },
          color: '#888',
          callback: (value: any) => value.toFixed(2),
        },
        border: {
          display: false,
        },
      },
    },
  };

  // Get first and last values for display
  const firstValue = data[0]?.value;
  const lastValue = data[data.length - 1]?.value;
  const change = lastValue - firstValue;
  const changeClass = change >= 0 ? 'up' : 'down';

  return (
    <div className="chart-container">
      <div className="chart-header">
        <span className="chart-title">{title}</span>
        <span className={`chart-change ${changeClass}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(4)}
        </span>
      </div>
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
      <div className="chart-footer">
        <span className="chart-value">{firstValue.toFixed(4)}</span>
        <span className="chart-arrow">→</span>
        <span className="chart-value">{lastValue.toFixed(4)}</span>
      </div>
    </div>
  );
}
