import { DEMO_TIMEZONE } from '../data/demoData';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export function formatPaise(paise: number): string {
  return currencyFormatter.format(paise / 100);
}

export function formatCampusDate(isoOrDate: string): string {
  const normalized = isoOrDate.length === 10 ? `${isoOrDate}T00:00:00+05:30` : isoOrDate;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: DEMO_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(normalized));
}

export function formatShortDate(isoOrDate: string): string {
  const normalized = isoOrDate.length === 10 ? `${isoOrDate}T00:00:00+05:30` : isoOrDate;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: DEMO_TIMEZONE,
    day: 'numeric',
    month: 'short',
  }).format(new Date(normalized));
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime}–${endTime} IST`;
}

export function formatPercentage(numerator: number, denominator: number, decimals = 1): string {
  if (denominator <= 0) return '—';
  return `${((numerator / denominator) * 100).toFixed(decimals)}%`;
}
