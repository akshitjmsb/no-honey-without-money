/**
 * Portfolio data - in production, this would come from an API
 */

import type { PortfolioItem, InitialAimDataRaw } from '../types';

export const portfolioData: PortfolioItem[] = [
  { ticker: 'AMZN', account: 'TFSA', totalCost: 2962.94, numberOfShares: 16, currency: 'USD', dividendYield: 0.00, sector: 'Consumer Discretionary' },
  { ticker: 'ATD', account: 'TFSA', totalCost: 811.74, numberOfShares: 10, currency: 'CAD', dividendYield: 0.88, sector: 'Consumer Staples' },
  { ticker: 'BEP.UN', account: 'TFSA', totalCost: 2137.93, numberOfShares: 65, currency: 'CAD', dividendYield: 7.21, sector: 'Utilities' },
  { ticker: 'BLK', account: 'TFSA', totalCost: 330.28, numberOfShares: 0.42, currency: 'USD', dividendYield: 2.54, sector: 'Financials' },
  { ticker: 'BN', account: 'TFSA', totalCost: 1801.59, numberOfShares: 33, currency: 'CAD', dividendYield: 0.85, sector: 'Financials' },
  { ticker: 'CNQ', account: 'TFSA', totalCost: 1189.72, numberOfShares: 14, currency: 'CAD', dividendYield: 4.15, sector: 'Energy' },
  { ticker: 'DOO', account: 'TFSA', totalCost: 1279.81, numberOfShares: 14, currency: 'CAD', dividendYield: 0.00, sector: 'Consumer Discretionary' },
  { ticker: 'EIF', account: 'TFSA', totalCost: 929.69, numberOfShares: 28, currency: 'CAD', dividendYield: 7.45, sector: 'Industrials' },
  { ticker: 'FTS', account: 'TFSA', totalCost: 582.20, numberOfShares: 11, currency: 'CAD', dividendYield: 4.41, sector: 'Utilities' },
  { ticker: 'HD', account: 'TFSA', totalCost: 381.67, numberOfShares: 1.15, currency: 'USD', dividendYield: 2.51, sector: 'Consumer Discretionary' },
  { ticker: 'LMT', account: 'TFSA', totalCost: 1218.64, numberOfShares: 2.65, currency: 'USD', dividendYield: 2.78, sector: 'Industrials' },
  { ticker: 'POW', account: 'TFSA', totalCost: 982.76, numberOfShares: 24, currency: 'CAD', dividendYield: 5.23, sector: 'Financials' },
  { ticker: 'T', account: 'TFSA', totalCost: 1926.43, numberOfShares: 87, currency: 'CAD', dividendYield: 6.51, sector: 'Communication Services' },
  { ticker: 'VOO', account: 'TFSA', totalCost: 1267.30, numberOfShares: 2.64, currency: 'USD', dividendYield: 1.34, sector: 'ETF' },
  { ticker: 'WELL', account: 'TFSA', totalCost: 1426.46, numberOfShares: 356, currency: 'CAD', dividendYield: 0.00, sector: 'Health Care' },
  { ticker: 'ATD', account: 'FHSA', totalCost: 813.84, numberOfShares: 11, currency: 'CAD', dividendYield: 0.88, sector: 'Consumer Staples' },
  { ticker: 'BEP.UN', account: 'FHSA', totalCost: 1198.42, numberOfShares: 36, currency: 'CAD', dividendYield: 7.21, sector: 'Utilities' },
  { ticker: 'BRK.B', account: 'FHSA', totalCost: 835.54, numberOfShares: 2, currency: 'USD', dividendYield: 0.00, sector: 'Financials' },
  { ticker: 'BYD', account: 'FHSA', totalCost: 4049.48, numberOfShares: 30, currency: 'CAD', dividendYield: 1.45, sector: 'Industrials' },
  { ticker: 'CNQ', account: 'FHSA', totalCost: 1295.13, numberOfShares: 15, currency: 'CAD', dividendYield: 4.15, sector: 'Energy' },
  { ticker: 'DOO', account: 'FHSA', totalCost: 404.48, numberOfShares: 4.5, currency: 'CAD', dividendYield: 0.00, sector: 'Consumer Discretionary' },
  { ticker: 'FTS', account: 'FHSA', totalCost: 557.33, numberOfShares: 11, currency: 'CAD', dividendYield: 4.41, sector: 'Utilities' },
  { ticker: 'GOOG', account: 'FHSA', totalCost: 1671.88, numberOfShares: 9.5, currency: 'USD', dividendYield: 0.56, sector: 'Communication Services' },
  { ticker: 'GRT.UN', account: 'FHSA', totalCost: 2207.16, numberOfShares: 170, currency: 'CAD', dividendYield: 6.83, sector: 'Real Estate' },
  { ticker: 'LMT', account: 'FHSA', totalCost: 1468.23, numberOfShares: 3.2, currency: 'USD', dividendYield: 2.78, sector: 'Industrials' },
  { ticker: 'NA', account: 'FHSA', totalCost: 1115.65, numberOfShares: 10, currency: 'CAD', dividendYield: 3.89, sector: 'Financials' },
  { ticker: 'T', account: 'FHSA', totalCost: 1002.14, numberOfShares: 45, currency: 'CAD', dividendYield: 6.51, sector: 'Communication Services' },
  { ticker: 'V', account: 'FHSA', totalCost: 836.35, numberOfShares: 3, currency: 'USD', dividendYield: 0.73, sector: 'Fintech' },
  { ticker: 'WELL', account: 'FHSA', totalCost: 550.50, numberOfShares: 137, currency: 'CAD', dividendYield: 0.00, sector: 'Health Care' },
  { ticker: 'XGD', account: 'FHSA', totalCost: 509.59, numberOfShares: 25, currency: 'CAD', dividendYield: 0.00, sector: 'ETF' },
  { ticker: 'XRE', account: 'FHSA', totalCost: 536.02, numberOfShares: 33, currency: 'CAD', dividendYield: 4.88, sector: 'ETF' },
  { ticker: 'ZWT', account: 'FHSA', totalCost: 560.36, numberOfShares: 46, currency: 'CAD', dividendYield: 8.12, sector: 'ETF' },
  { ticker: 'CLOV', account: 'Trady', totalCost: 1958.38, numberOfShares: 1958, currency: 'USD', dividendYield: 0.00, sector: 'Health Care' },
  { ticker: 'CNQ', account: 'Trady', totalCost: 1125.04, numberOfShares: 13, currency: 'CAD', dividendYield: 4.15, sector: 'Energy' },
  { ticker: 'DOO', account: 'Trady', totalCost: 1579.40, numberOfShares: 17, currency: 'CAD', dividendYield: 0.00, sector: 'Consumer Discretionary' },
  { ticker: 'GOOG', account: 'Trady', totalCost: 1923.80, numberOfShares: 11, currency: 'USD', dividendYield: 0.56, sector: 'Communication Services' },
  { ticker: 'GRT.UN', account: 'Trady', totalCost: 1739.00, numberOfShares: 133, currency: 'CAD', dividendYield: 6.83, sector: 'Real Estate' },
  { ticker: 'T', account: 'Trady', totalCost: 1646.05, numberOfShares: 75, currency: 'CAD', dividendYield: 6.51, sector: 'Communication Services' },
  { ticker: 'UBER', account: 'Trady', totalCost: 638.81, numberOfShares: 9, currency: 'USD', dividendYield: 0.00, sector: 'Industrials' },
  { ticker: 'UNH', account: 'Trady', totalCost: 771.34, numberOfShares: 1.57, currency: 'USD', dividendYield: 1.51, sector: 'Health Care' }
];

export const initialAimDataRaw: InitialAimDataRaw[] = [
  { ticker: 'IBIT', amountCAD: 5150.00, currency: 'USD', completed: false }, 
  { ticker: 'BRK.B', amountCAD: 4950.00, currency: 'USD', completed: false },
  { ticker: 'CSU', amountCAD: 2900.00, currency: 'CAD', completed: false }, 
  { ticker: 'IFC', amountCAD: 3500.00, currency: 'CAD', completed: false },
  { ticker: 'HD', amountCAD: 3400.00, currency: 'USD', completed: false }, 
  { ticker: 'BLK', amountCAD: 2900.00, currency: 'USD', completed: false },
  { ticker: 'AMZN', amountCAD: 3750.00, currency: 'USD', completed: false }, 
  { ticker: 'GOOGL', amountCAD: 2600.00, currency: 'USD', completed: false },
  { ticker: 'T', amountCAD: 2600.00, currency: 'CAD', completed: false }, 
  { ticker: 'V', amountCAD: 2450.00, currency: 'USD', completed: false },
  { ticker: 'SBUX', amountCAD: 2400.00, currency: 'USD', completed: false }, 
  { ticker: 'BYD', amountCAD: 2400.00, currency: 'CAD', completed: false },
  { ticker: 'ATD', amountCAD: 1650.00, currency: 'CAD', completed: false }, 
  { ticker: 'ASML', amountCAD: 2250.00, currency: 'USD', completed: false },
  { ticker: 'FTS', amountCAD: 2150.00, currency: 'CAD', completed: false }, 
  { ticker: 'BN', amountCAD: 2100.00, currency: 'CAD', completed: false },
  { ticker: 'EQB', amountCAD: 2050.00, currency: 'CAD', completed: false }, 
  { ticker: 'LMT', amountCAD: 1950.00, currency: 'USD', completed: false },
  { ticker: 'NA', amountCAD: 1950.00, currency: 'CAD', completed: false }, 
  { ticker: 'BEP.UN', amountCAD: 1800.00, currency: 'CAD', completed: false },
  { ticker: 'CP', amountCAD: 1750.00, currency: 'CAD', completed: false }, 
  { ticker: 'XGD', amountCAD: 500.00, currency: 'CAD', completed: false },
  { ticker: 'CASH', amountCAD: 15350.00, currency: 'CAD', completed: false }
];

export const initialTargetInvestment = 72500;
