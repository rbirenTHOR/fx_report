# Economic Data Dashboard

A React/TypeScript dashboard for visualizing foreign exchange rates and RV industry economic indicators using data from the Federal Reserve Economic Data (FRED) API.

## Features

### Currency Exchange Rates
- Real-time CAD/USD and EUR/USD exchange rates
- Year-over-year comparisons
- Interactive 30-day and 90-day trend charts
- Point-in-time historical data viewing

### RV Industry Indicators
- 8 key economic indicators affecting the RV industry
- Configurable time horizons (90 days to 5 years)
- Color-coded YoY changes (positive/negative)
- Individual card export to PNG

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7
- **Charts**: Chart.js with react-chartjs-2
- **Styling**: CSS with responsive design
- **Data**: FRED API (Federal Reserve Economic Data)
- **Hosting**: Azure Static Web Apps

## Live Demo

https://yellow-hill-0cc76f410.1.azurestaticapps.net

## Data Sources

All data is sourced from the Federal Reserve Bank of St. Louis FRED API:
- Exchange rates (daily)
- Producer Price Indices (monthly)
- Consumer Sentiment (monthly)
- Mortgage rates (weekly)
- Gas prices (weekly)
- Unemployment rate (monthly)
- Vehicle sales (monthly)
- Disposable income (monthly)

## License

MIT
