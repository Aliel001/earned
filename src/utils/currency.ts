import { User } from '../types.js';

export interface CountryConfig {
  code: string;
  country: string;
  currency: string;
  flag: string;
  paymentMethods: string[];
}

export const COUNTRIES: CountryConfig[] = [
  { code: '+257', country: 'Burundi', currency: '', flag: '🇧🇮', paymentMethods: ['Lumicash', 'Ecocash', 'Smart Pesa'] },
  { code: '+250', country: 'Rwanda', currency: 'RWF', flag: '🇷🇼', paymentMethods: ['MTN Mobile Money', 'Airtel Money'] },
  { code: '+256', country: 'Uganda', currency: 'UGX', flag: '🇺🇬', paymentMethods: ['MTN MoMo Uganda', 'Airtel Money'] },
  { code: '+254', country: 'Kenya', currency: 'KES', flag: '🇰🇪', paymentMethods: ['M-Pesa', 'Airtel Money'] },
  { code: '+255', country: 'Tanzania', currency: 'TZS', flag: '🇹🇿', paymentMethods: ['M-Pesa', 'Tigo Pesa', 'Airtel Money'] },
  { code: '+243', country: 'DR Congo', currency: 'CDF', flag: '🇨🇩', paymentMethods: ['Airtel Money', 'Orange Money', 'M-Pesa'] },
];

export function getCurrencyForCountry(countryName?: string, phoneCode?: string, fallbackCurrency?: string): string {
  if (countryName) {
    const c = countryName.trim().toLowerCase();
    if (c.includes('rwanda') || c === 'rw') return 'RWF';
    if (c.includes('burundi') || c === 'bi' || c === 'rn') return '';
    if (c.includes('uganda') || c === 'ug') return 'UGX';
    if (c.includes('kenya') || c === 'ke') return 'KES';
    if (c.includes('tanzania') || c.includes('tanzanie') || c === 'tz') return 'TZS';
    if (c.includes('congo') || c.includes('drc') || c === 'cd') return 'CDF';
  }
  if (phoneCode) {
    const p = phoneCode.trim().replace(/\D/g, '');
    if (p === '250') return 'RWF';
    if (p === '257') return '';
    if (p === '256') return 'UGX';
    if (p === '254') return 'KES';
    if (p === '255') return 'TZS';
    if (p === '243') return 'CDF';
  }
  if (fallbackCurrency && fallbackCurrency.length >= 3) {
    return fallbackCurrency;
  }
  return 'RWF';
}

export function getUserCurrency(user?: User | null, overrideCountry?: string, overrideCode?: string): string {
  if (overrideCountry) {
    return getCurrencyForCountry(overrideCountry, overrideCode);
  }
  if (!user) {
    return getCurrencyForCountry(undefined, overrideCode, 'RWF');
  }
  if (user.wallet?.currency && user.wallet.currency.length >= 3) {
    return user.wallet.currency;
  }
  if (user.country) {
    return getCurrencyForCountry(user.country, user.phone_country_code);
  }
  if (user.phone_country_code) {
    return getCurrencyForCountry(undefined, user.phone_country_code);
  }
  return 'RWF';
}

export function getCountryFlag(countryName?: string, phoneCode?: string): string {
  if (countryName) {
    const c = countryName.trim().toLowerCase();
    if (c.includes('rwanda')) return '🇷🇼';
    if (c.includes('burundi')) return '🇧🇮';
    if (c.includes('uganda')) return '🇺🇬';
    if (c.includes('kenya')) return '🇰🇪';
    if (c.includes('tanzania')) return '🇹🇿';
    if (c.includes('congo') || c.includes('drc')) return '🇨🇩';
  }
  if (phoneCode) {
    const p = phoneCode.trim();
    if (p === '+250' || p === '250') return '🇷🇼';
    if (p === '+257' || p === '257') return '🇧🇮';
    if (p === '+256' || p === '256') return '🇺🇬';
    if (p === '+254' || p === '254') return '🇰🇪';
    if (p === '+255' || p === '255') return '🇹🇿';
    if (p === '+243' || p === '243') return '🇨🇩';
  }
  return '🇧🇮';
}

export function formatMoney(amount: number = 0, currency: string = 'RWF'): string {
  return `${amount.toLocaleString()} ${currency}`;
}
