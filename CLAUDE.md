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
├── dist/                          # Build output (generated)
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
  - **Defaults: Chart 1 = 1 Year (365 days), Chart 2 = 3 Years (1095 days)**
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

---

## Azure Deployment Guide

### Production URL
- **Live Site**: https://yellow-hill-0cc76f410.1.azurestaticapps.net
- **Resource Group**: Thor-Rapid-Test
- **App Name**: fx-reporting
- **Region**: Central US

### Prerequisites

1. **Azure CLI** - Must be installed and accessible
   - Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   - Default install location on Windows: `C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd`

2. **SWA CLI** - Azure Static Web Apps CLI
   ```bash
   npm install -g @azure/static-web-apps-cli
   ```

3. **Zscaler/VPN** - **MUST BE DISABLED** before deploying (see Troubleshooting)

### Step-by-Step Deployment

#### Step 1: Disable Security Software
**CRITICAL**: Before deploying, disable Zscaler or any corporate VPN/proxy that intercepts TLS traffic. These will cause the deployment to hang indefinitely.

#### Step 2: Build the Application
```bash
npm run build
```
This creates the `dist/` folder with production assets.

#### Step 3: Login to Azure CLI
```bash
# On Windows with Git Bash, you may need the full path:
export PATH="$PATH:/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin"

# Then login:
az login
```
A browser window will open for authentication.

#### Step 4: Deploy to Azure
```bash
# Make sure Azure CLI is in PATH first (see Step 3)
export PATH="$PATH:/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin"

# Deploy with app name and resource group (RECOMMENDED METHOD)
swa deploy ./dist --api-location ./api --app-name fx-reporting --resource-group Thor-Rapid-Test --env production --api-language node --api-version 18
```

#### Alternative: Deploy with Deployment Token
If Azure CLI authentication doesn't work, you can use a deployment token:

```bash
# Get the deployment token
az staticwebapp secrets list --name fx-reporting --resource-group Thor-Rapid-Test --query "properties.apiKey" -o tsv

# Deploy with token
swa deploy ./dist --api-location ./api --deployment-token <YOUR_TOKEN> --env production
```

### Quick Deploy Command (Copy-Paste Ready)
```bash
# Complete deployment in one command block
export PATH="$PATH:/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin" && \
cd /c/Users/rbiren/Desktop/fx_report_fresh && \
npm run build && \
swa deploy ./dist --api-location ./api --app-name fx-reporting --resource-group Thor-Rapid-Test --env production --api-language node --api-version 18
```

---

## Troubleshooting Deployment

### Issue: "Could not load StaticSitesClient metadata from remote"
**Cause**: Network connectivity issue - usually Zscaler or corporate VPN blocking Azure endpoints.

**Solution**:
1. Disable Zscaler completely (not just pause)
2. Disconnect from corporate VPN
3. Retry deployment

### Issue: "Azure CLI could not be found"
**Cause**: Azure CLI is installed but not in PATH.

**Solution**: Add Azure CLI to PATH before running swa commands:
```bash
export PATH="$PATH:/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin"
```

### Issue: Deployment hangs at "Preparing deployment. Please wait..."
**Causes**:
1. **Zscaler/VPN** - Most common cause. Disable it.
2. **Wrong folder** - Deploying source code instead of build output
3. **Network timeout** - Corporate firewall blocking

**Solutions**:
1. Disable Zscaler/VPN
2. Ensure you're deploying `./dist` NOT `.` (current directory)
3. The `./dist` folder should only contain: `index.html`, `assets/`, and optionally `vite.svg`

### Issue: NODE_TLS_REJECT_UNAUTHORIZED warning
**Cause**: Zscaler sets this environment variable to bypass certificate validation.

**Note**: This warning alone doesn't cause failures, but indicates Zscaler may be active. If deployment hangs, disable Zscaler.

### Issue: Authentication popup doesn't appear
**Cause**: SWA CLI can't find Azure CLI for authentication.

**Solution**: Use the `--app-name` and `--resource-group` flags with Azure CLI in PATH:
```bash
export PATH="$PATH:/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin"
swa deploy ./dist --api-location ./api --app-name fx-reporting --resource-group Thor-Rapid-Test --env production
```

---

## What NOT To Do (Deployment Anti-Patterns)

### DO NOT deploy the root folder
```bash
# WRONG - Will try to upload node_modules (thousands of files)
swa deploy . --deployment-token <TOKEN>

# CORRECT - Deploy only the build output
swa deploy ./dist --deployment-token <TOKEN>
```

### DO NOT deploy with Zscaler/VPN enabled
The deployment will hang indefinitely at "Preparing deployment" with no error message. Always disable security software that intercepts TLS traffic before deploying.

### DO NOT use `swa deploy` without Azure CLI in PATH
If Azure CLI isn't found, authentication will fail. Always set the PATH first:
```bash
export PATH="$PATH:/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin"
```

### DO NOT skip the build step
Always run `npm run build` before deploying. The `dist/` folder must be fresh and match your source code.

### DO NOT use relative paths for Azure CLI on Windows
The Azure CLI on Windows is installed at a specific location. Use the full path or add it to PATH.

---

## API Configuration

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

## Indicator Configuration

Indicator configurations are defined in `src/services/fredApi.ts` in the `RV_INDICATORS` array. Each indicator includes:
- `seriesId` - FRED series ID
- `name` / `shortName` - Display names
- `description` - Indicator description
- `unit` - Unit of measurement
- `decimals` - Decimal places for display
- `invert` - Whether lower values are "good" (optional)
- `sourceUrl` / `sourceName` - Data source attribution

## Chart Default Configuration

Time horizon defaults are set in `src/App.tsx`:
- `chart1Days` - Default: 365 (1 Year)
- `chart2Days` - Default: 1095 (3 Years)

To change defaults, modify the `useState` initial values in `App.tsx`:
```typescript
const [chart1Days, setChart1Days] = useState<number>(365);  // Chart 1 default
const [chart2Days, setChart2Days] = useState<number>(1095); // Chart 2 default
```
