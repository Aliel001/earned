import { User } from '../types.js';

export interface CountryConfig {
  code: string;
  country: string;
  currency: string;
  flag: string;
  paymentMethods: string[];
}

export interface SupportedCountry {
  code: 'RW' | 'BI' | 'KE' | 'UG' | 'TZ' | 'CD';
  name: string;
  currency: 'RWF' | 'BIF' | 'KES' | 'UGX' | 'TZS' | 'CDF';
  currencyName: string;
  phoneCode: string;
  phonePlaceholder: string;
  flag: string;
}

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  { code: 'RW', name: 'Rwanda', currency: 'RWF', currencyName: 'Rwandan Franc', phoneCode: '+250', phonePlaceholder: '78 123 4567', flag: '🇷🇼' },
  { code: 'BI', name: 'Burundi', currency: 'BIF', currencyName: 'Burundian Franc', phoneCode: '+257', phonePlaceholder: '69 11 22 33', flag: '🇧🇮' },
  { code: 'KE', name: 'Kenya', currency: 'KES', currencyName: 'Kenyan Shilling', phoneCode: '+254', phonePlaceholder: '712 345 678', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', currencyName: 'Ugandan Shilling', phoneCode: '+256', phonePlaceholder: '772 123 456', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', currencyName: 'Tanzanian Shilling', phoneCode: '+255', phonePlaceholder: '754 123 456', flag: '🇹🇿' },
  { code: 'CD', name: 'DR Congo', currency: 'CDF', currencyName: 'Congolese Franc', phoneCode: '+243', phonePlaceholder: '812 345 678', flag: '🇨🇩' },
];

export const COUNTRIES: CountryConfig[] = [
  { code: '+250', country: 'Rwanda', currency: 'RWF', flag: '🇷🇼', paymentMethods: ['MTN Mobile Money', 'Airtel Money'] },
  { code: '+257', country: 'Burundi', currency: 'BIF', flag: '🇧🇮', paymentMethods: ['Lumicash', 'Ecocash', 'Smart Pesa'] },
  { code: '+254', country: 'Kenya', currency: 'KES', flag: '🇰🇪', paymentMethods: ['M-Pesa', 'Airtel Money'] },
  { code: '+256', country: 'Uganda', currency: 'UGX', flag: '🇺🇬', paymentMethods: ['MTN MoMo Uganda', 'Airtel Money'] },
  { code: '+255', country: 'Tanzania', currency: 'TZS', flag: '🇹🇿', paymentMethods: ['M-Pesa', 'Tigo Pesa', 'Airtel Money'] },
  { code: '+243', country: 'DR Congo', currency: 'CDF', flag: '🇨🇩', paymentMethods: ['Airtel Money', 'Orange Money', 'M-Pesa'] },
];

export function getCurrencyForCountry(countryNameOrCode?: string, phoneCode?: string, fallbackCurrency?: string): string {
  if (countryNameOrCode) {
    const c = countryNameOrCode.trim().toLowerCase();
    if (c === 'rw' || c.includes('rwanda')) return 'RWF';
    if (c === 'bi' || c.includes('burundi') || c === 'rn') return 'BIF';
    if (c === 'ke' || c.includes('kenya')) return 'KES';
    if (c === 'ug' || c.includes('uganda')) return 'UGX';
    if (c === 'tz' || c.includes('tanzania') || c.includes('tanzanie')) return 'TZS';
    if (c === 'cd' || c.includes('congo') || c.includes('drc') || c.includes('democratic republic')) return 'CDF';
  }
  if (phoneCode) {
    const p = phoneCode.trim().replace(/\D/g, '');
    if (p === '250') return 'RWF';
    if (p === '257') return 'BIF';
    if (p === '254') return 'KES';
    if (p === '256') return 'UGX';
    if (p === '255') return 'TZS';
    if (p === '243') return 'CDF';
  }
  if (fallbackCurrency && fallbackCurrency.length >= 3) {
    return fallbackCurrency;
  }
  return 'RWF';
}

export function getCountryCode(countryNameOrCode?: string, phoneCode?: string): 'RW' | 'BI' | 'KE' | 'UG' | 'TZ' | 'CD' {
  if (countryNameOrCode) {
    const c = countryNameOrCode.trim().toLowerCase();
    if (c === 'rw' || c.includes('rwanda')) return 'RW';
    if (c === 'bi' || c.includes('burundi') || c === 'rn') return 'BI';
    if (c === 'ke' || c.includes('kenya')) return 'KE';
    if (c === 'ug' || c.includes('uganda')) return 'UG';
    if (c === 'tz' || c.includes('tanzania') || c.includes('tanzanie')) return 'TZ';
    if (c === 'cd' || c.includes('congo') || c.includes('drc')) return 'CD';
  }
  if (phoneCode) {
    const p = phoneCode.trim().replace(/\D/g, '');
    if (p === '250') return 'RW';
    if (p === '257') return 'BI';
    if (p === '254') return 'KE';
    if (p === '256') return 'UG';
    if (p === '255') return 'TZ';
    if (p === '243') return 'CD';
  }
  return 'RW';
}

export function getCountryName(countryNameOrCode?: string, phoneCode?: string): string {
  if (countryNameOrCode) {
    const c = countryNameOrCode.trim().toLowerCase();
    if (c === 'rw' || c.includes('rwanda')) return 'Rwanda';
    if (c === 'bi' || c.includes('burundi') || c === 'rn') return 'Burundi';
    if (c === 'ke' || c.includes('kenya')) return 'Kenya';
    if (c === 'ug' || c.includes('uganda')) return 'Uganda';
    if (c === 'tz' || c.includes('tanzania') || c.includes('tanzanie')) return 'Tanzania';
    if (c === 'cd' || c.includes('congo') || c.includes('drc')) return 'DR Congo';
  }
  if (phoneCode) {
    const p = phoneCode.trim().replace(/\D/g, '');
    if (p === '250') return 'Rwanda';
    if (p === '257') return 'Burundi';
    if (p === '254') return 'Kenya';
    if (p === '256') return 'Uganda';
    if (p === '255') return 'Tanzania';
    if (p === '243') return 'DR Congo';
  }
  return 'Rwanda';
}

export function getUserCurrency(user?: User | null, overrideCountry?: string, overrideCode?: string): string {
  if (overrideCountry) {
    return getCurrencyForCountry(overrideCountry, overrideCode);
  }
  if (!user) {
    return getCurrencyForCountry(undefined, overrideCode, 'RWF');
  }
  if (user.currency && user.currency.length >= 3) {
    return user.currency;
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

export function getCountryFlag(countryNameOrCode?: string, phoneCode?: string): string {
  if (countryNameOrCode) {
    const c = countryNameOrCode.trim().toLowerCase();
    if (c === 'rw' || c.includes('rwanda')) return '🇷🇼';
    if (c === 'bi' || c.includes('burundi') || c === 'rn') return '🇧🇮';
    if (c === 'ke' || c.includes('kenya')) return '🇰🇪';
    if (c === 'ug' || c.includes('uganda')) return '🇺🇬';
    if (c === 'tz' || c.includes('tanzania') || c.includes('tanzanie')) return '🇹🇿';
    if (c === 'cd' || c.includes('congo') || c.includes('drc')) return '🇨🇩';
  }
  if (phoneCode) {
    const p = phoneCode.trim().replace(/\D/g, '');
    if (p === '250') return '🇷🇼';
    if (p === '257') return '🇧🇮';
    if (p === '254') return '🇰🇪';
    if (p === '256') return '🇺🇬';
    if (p === '255') return '🇹🇿';
    if (p === '243') return '🇨🇩';
  }
  return '🇷🇼';
}

export function formatMoney(amount: number = 0, currency: string = 'RWF'): string {
  return `${amount.toLocaleString()} ${currency}`;
}
