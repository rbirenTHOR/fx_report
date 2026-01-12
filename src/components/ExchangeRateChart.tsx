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
} from 'chart.js';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ExchangeRateChartProps {
  data: { date: Date; value: number }[];
  title: string;
  showLabels?: boolean;
}

export function ExchangeRateChart({
  data,
  title,
  showLabels = true,
}: ExchangeRateChartProps) {
  // Sample data points for labels (show ~8-10 labels max)
  const labelInterval = Math.max(1, Math.floor(data.length / 10));

  const chartData = {
    labels: data.map((d) => format(d.date, 'MMM dd')),
    datasets: [
      {
        data: data.map((d) => d.value),
        borderColor: '#1f4e79',
        backgroundColor: '#1f4e79',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#1f4e79',
        tension: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
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
          font: {
            size: 10,
          },
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        radius: 3,
      },
    },
  };

  return (
    <div className="chart-container">
      <div className="chart-title">{title}</div>
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
        {showLabels && (
          <div className="chart-labels">
            {data.map((point, index) => {
              if (index % labelInterval === 0 || index === data.length - 1) {
                return (
                  <div
                    key={index}
                    className="data-label"
                    style={{
                      left: `${(index / (data.length - 1)) * 100}%`,
                    }}
                  >
                    {point.value.toFixed(4)}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
