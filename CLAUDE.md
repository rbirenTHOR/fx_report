# FX Reporting App

## Overview
A React/TypeScript Economic Data Dashboard displaying foreign exchange rates and RV industry economic indicators from the FRED (Federal Reserve Economic Data) API.

## Tech Stack
- React 19 + TypeScript
- Vite 7
- Chart.js for visualizations
- date-fns for date formatting
- html-to-image for PNG exports
- Azure Static Web Apps for hosting

## Project Structure
```
fx/
├── src/
│   ├── components/
│   │   ├── ExchangeRateCard.tsx   # Currency exchange rate display
│   │   └── RvIndicatorCard.tsx    # RV industry indicator display
│   ├── services/
│   │   └── fredApi.ts             # FRED API service & indicator configs
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── App.tsx                    # Main app with tab navigation
│   └── App.css                    # Styling
├── api/                           # Azure Functions (FRED API proxy)
│   └── fred/                      # Proxy function for FRED API
├── dist/                          # Build output
└── public/                        # Static assets
```

## Features

### Currency Exchange Rates Tab
- CAD/USD and EUR/USD exchange rates
- Current value, prior year value, YoY change metrics
- 30-day and 90-day trend charts
- Point-in-time date selector
- Export to PNG functionality

### RV Industry Indicators Tab
- 8 key economic indicators relevant to RV industry:
  - PPI: Recreational Vehicle Dealers
  - PPI: RV Dealer Services
  - Consumer Sentiment Index
  - 30-Year Fixed Mortgage Rate
  - Regular Gasoline Price
  - Unemployment Rate
  - Total Vehicle Sales
  - Real Disposable Personal Income
- Configurable time horizon selector (Chart 1 & Chart 2)
  - Options: 90 Days, 180 Days, 1 Year, 2 Years, 3 Years, 5 Years
  - Default: 90 Days / 180 Days
- YoY change with color coding (green=positive, red=negative)
- Inverted indicators support (lower is better for mortgage rates, gas prices, unemployment)
- Export individual cards to PNG

## Development
```bash
npm install
npm run dev     # Start dev server (localhost:5173+)
npm run build   # Build for production
npm run lint    # Run ESLint
```

## Deployment
Deployed to Azure Static Web Apps:
- URL: https://yellow-hill-0cc76f410.1.azurestaticapps.net
- Resource Group: Thor-Rapid-Test
- App Name: fx-reporting

Deploy command:
```bash
npm run build
swa deploy ./dist --api-location ./api --deployment-token <TOKEN> --env production
```

## API
The app uses the FRED API for economic data. Requests are proxied through an Azure Function (`/api/fred/*`) to avoid CORS issues.

### Currency Series
- `DEXCAUS` - CAD/USD exchange rate
- `DEXUSEU` - EUR/USD exchange rate

### RV Industry Series
- `PCU441210441210` - PPI: Recreational Vehicle Dealers
- `PCU4412104412101` - PPI: RV Dealer Services
- `UMCSENT` - Consumer Sentiment Index
- `MORTGAGE30US` - 30-Year Fixed Mortgage Rate
- `GASREGW` - Regular Gasoline Price
- `UNRATE` - Unemployment Rate
- `TOTALSA` - Total Vehicle Sales
- `DSPIC96` - Real Disposable Personal Income

## Configuration
Indicator configurations are defined in `src/services/fredApi.ts` in the `RV_INDICATORS` array. Each indicator includes:
- `seriesId` - FRED series ID
- `name` / `shortName` - Display names
- `description` - Indicator description
- `unit` - Unit of measurement
- `decimals` - Decimal places for display
- `invert` - Whether lower values are "good" (optional)
- `sourceUrl` / `sourceName` - Data source attribution
