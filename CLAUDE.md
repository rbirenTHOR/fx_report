# FX Reporting App

## Overview
A React/TypeScript app displaying foreign exchange rate data from the FRED (Federal Reserve Economic Data) API.

## Tech Stack
- React 19 + TypeScript
- Vite 7
- Chart.js for visualizations
- Azure Static Web Apps for hosting

## Project Structure
```
fx/
├── src/
│   ├── components/     # React components
│   ├── services/       # API services (fredApi.ts)
│   └── types/          # TypeScript types
├── api/                # Azure Functions (FRED API proxy)
│   └── fred/           # Proxy function for FRED API
├── dist/               # Build output
└── public/             # Static assets
```

## Development
```bash
npm install
npm run dev     # Start dev server (localhost:5173)
npm run build   # Build for production
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
The app uses the FRED API for exchange rate data. Requests are proxied through an Azure Function (`/api/fred/*`) to avoid CORS issues.

Series used:
- `DEXCAUS` - CAD/USD exchange rate
- `DEXUSEU` - EUR/USD exchange rate
