/**
 * Type definitions for the application
 */

export interface PortfolioItem {
  ticker: string;
  account: string;
  totalCost: number;
  numberOfShares: number;
  currency: 'USD' | 'CAD';
  dividendYield: number;
  sector: string;
}

export interface AimDataItem {
  id: number;
  ticker: string;
  targetPercent: number; // e.g., 0.071 for 7.1%
  currency: 'USD' | 'CAD';
  completed: boolean;
  notes: string;
}

export interface InitialAimDataRaw {
  ticker: string;
  amountCAD: number;
  currency: 'USD' | 'CAD';
  completed: boolean;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface Holding {
  numberOfShares: number;
  costPerShare: number;
  currency: 'USD' | 'CAD';
}

export interface FinancialData {
  isLoading: boolean;
  error?: string;
  currentPrice?: number;
  priceHistory24h?: number[];
  newsSentiment?: {
    sentiment: 'Positive' | 'Neutral' | 'Negative' | 'N/A';
    summary: string;
  };
  analystRatings?: {
    recommendation: string;
    targetLow: number | null;
    targetAverage: number | null;
    targetHigh: number | null;
  };
  keyMetrics?: {
    beta: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
  };
  upcomingEvents?: {
    nextEarningsDate: string | null;
  };
  sector?: string;
}

export interface EditingField {
  id: number | string;
  field: 'ticker' | 'targetPercent' | 'numberOfShares' | 'costPerShare' | 'notes';
}

export interface SummaryCard {
  isSummary: true;
  id: string;
}

export type CardData = SummaryCard | AimDataItem;

// Type guard functions
export const isSummaryCard = (card: CardData): card is SummaryCard => {
  return 'isSummary' in card && card.isSummary === true;
};

export const isAimDataItem = (card: CardData): card is AimDataItem => {
  return !('isSummary' in card);
};

export interface SparklineProps {
  data: number[] | undefined;
  width?: number;
  height?: number;
  stroke?: string;
}

export interface RangeBarProps {
  low: number | null | undefined;
  high: number | null | undefined;
  current: number | null | undefined;
  average?: number | null;
  width?: number | string;
}
