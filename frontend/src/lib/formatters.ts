// =============================================================================
// MooOS v2 — Shared Formatters
// =============================================================================
// One implementation of each formatter. Import from here, never re-implement.
// =============================================================================

/**
 * Format number as Rupiah currency.
 * formatRp(5200)     → "Rp 5.200"
 * formatRp(2600000)  → "Rp 2.600.000"
 */
export function formatRp(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number as Rupiah with compact notation for large numbers.
 * formatRpCompact(2600000)   → "Rp2,6jt"
 * formatRpCompact(145000000) → "Rp145jt"
 */
export function formatRpCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp${(value / 1_000_000_000).toFixed(1).replace('.0', '')}M`;
  }
  if (value >= 1_000_000) {
    return `Rp${(value / 1_000_000).toFixed(1).replace('.0', '')}jt`;
  }
  if (value >= 1_000) {
    return `Rp${(value / 1_000).toFixed(1).replace('.0', '')}rb`;
  }
  return formatRp(value);
}

/**
 * Format weight in kilograms.
 * formatKg(2300)  → "2.300 kg"
 * formatKg(0.5)   → "0,5 kg"
 */
export function formatKg(value: number): string {
  return `${new Intl.NumberFormat('id-ID').format(value)} kg`;
}

/**
 * Format volume in litres.
 * formatLiter(320) → "320 liter"
 */
export function formatLiter(value: number): string {
  return `${new Intl.NumberFormat('id-ID').format(value)} liter`;
}

/**
 * Format ISO date string to Indonesian locale.
 * formatDate("2026-07-10T08:00:00Z") → "10 Juli 2026"
 */
export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoString));
}

/**
 * Format ISO date string to short format.
 * formatDateShort("2026-07-10T08:00:00Z") → "10 Jul 2026"
 */
export function formatDateShort(isoString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoString));
}

/**
 * Format ISO datetime string to time only.
 * formatTime("2026-07-10T08:30:00Z") → "08:30"
 */
export function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString));
}

/**
 * Format ISO datetime string to full datetime.
 * formatDateTime("2026-07-10T08:30:00Z") → "10 Juli 2026, 08:30"
 */
export function formatDateTime(isoString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString));
}

/**
 * Format a number with dot separator (Indonesian convention).
 * formatNumber(1234) → "1.234"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Relative time formatter.
 * formatRelativeTime("2026-07-10T08:00:00Z") → "2 jam lalu"
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;

  return formatDate(isoString);
}
