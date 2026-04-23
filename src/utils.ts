import type { CurrencyKey } from './types';

const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];

export function formatBig(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? value * -1n : value;
  const raw = absolute.toString();

  if (raw.length <= 3) {
    return `${negative ? '-' : ''}${raw}`;
  }

  const group = Math.min(Math.floor((raw.length - 1) / 3), suffixes.length - 1);
  const splitIndex = raw.length - group * 3;
  const whole = raw.slice(0, splitIndex);
  const decimal = raw.slice(splitIndex, splitIndex + 2).padEnd(2, '0');

  return `${negative ? '-' : ''}${whole}.${decimal}${suffixes[group]}`;
}

export function formatCurrencyMap(
  currencies: Partial<Record<CurrencyKey, bigint>>,
): string {
  return Object.entries(currencies)
    .map(([key, value]) => `${labelForCurrency(key as CurrencyKey)} ${formatBig(value ?? 0n)}`)
    .join(' / ');
}

export function labelForCurrency(key: CurrencyKey): string {
  switch (key) {
    case 'gold':
      return '골드';
    case 'scrap':
      return '스크랩';
    case 'aether':
      return '에테르';
  }
}

export function multiplyPercent(base: bigint, percent: number): bigint {
  return (base * BigInt(Math.round(percent * 100))) / 10000n;
}
