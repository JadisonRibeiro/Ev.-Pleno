const numberFmt = new Intl.NumberFormat('pt-BR');
const percentFmt = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '–';
  return numberFmt.format(n);
}

export function formatPercent(value: number, total: number): string {
  if (!total) return '—';
  return percentFmt.format(value / total);
}

/** Retorna string tipo "12,4%" usando um pct já calculado 0–100. */
export function formatPct(pct: number): string {
  if (!Number.isFinite(pct)) return '—';
  return `${numberFmt.format(Math.round(pct * 10) / 10)}%`;
}
