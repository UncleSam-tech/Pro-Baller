export type CurrencyCode = 'GBP' | 'EUR' | 'USD' | 'NGN' | 'BRL' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  // Exchange rate relative to 1 GBP
  ratePerGBP: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', ratePerGBP: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', ratePerGBP: 1.18 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', ratePerGBP: 1.28 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', ratePerGBP: 1_850.0 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', ratePerGBP: 7.15 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', ratePerGBP: 198.0 },
};

/**
 * Converts an amount in GBP to target currency and formats it
 */
export function formatCurrency(amountGBP: number, targetCurrency: CurrencyCode = 'GBP'): string {
  const cfg = CURRENCIES[targetCurrency] || CURRENCIES.GBP;
  const converted = Math.round(amountGBP * cfg.ratePerGBP);

  if (targetCurrency === 'NGN') {
    if (converted >= 1_000_000_000) {
      return `${cfg.symbol}${(converted / 1_000_000_000).toFixed(2)} Billion`;
    }
    if (converted >= 1_000_000) {
      return `${cfg.symbol}${(converted / 1_000_000).toFixed(1)} Million`;
    }
    return `${cfg.symbol}${converted.toLocaleString()}`;
  }

  if (converted >= 1_000_000) {
    return `${cfg.symbol}${(converted / 1_000_000).toFixed(2)}M`;
  }
  if (converted >= 10_000) {
    return `${cfg.symbol}${converted.toLocaleString()}`;
  }
  return `${cfg.symbol}${converted.toLocaleString()}`;
}

/**
 * Returns the default currency for a country
 */
export function getCountryCurrency(country: string): CurrencyCode {
  switch (country.toLowerCase()) {
    case 'england':
    case 'united kingdom':
    case 'scotland':
    case 'wales':
      return 'GBP';
    case 'spain':
    case 'france':
    case 'germany':
    case 'italy':
    case 'netherlands':
    case 'portugal':
      return 'EUR';
    case 'nigeria':
      return 'NGN';
    case 'united states':
    case 'usa':
      return 'USD';
    case 'brazil':
      return 'BRL';
    case 'japan':
      return 'JPY';
    default:
      return 'GBP';
  }
}
