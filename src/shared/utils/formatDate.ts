// src/shared/utils/formatDate.ts
// Date/time formatting utility — always displays in JST (Asia/Tokyo) by default

type Locale = 'ja' | 'en';

/**
 * Formats an ISO 8601 UTC timestamp for display.
 *
 * @example
 * formatDate('2026-04-25T09:00:00Z', 'Asia/Tokyo', 'ja')
 * // → "2026年4月25日 18:00"
 *
 * formatDate('2026-04-25T09:00:00Z', 'Asia/Tokyo', 'en')
 * // → "Apr 25, 2026 6:00 PM"
 */
export function formatDate(
  isoString: string,
  timezone: string = 'Asia/Tokyo',
  locale: Locale = 'ja'
): string {
  const date = new Date(isoString);
  const localeTag = locale === 'ja' ? 'ja-JP' : 'en-US';

  return date.toLocaleString(localeTag, {
    timeZone: timezone,
    year: 'numeric',
    month: locale === 'ja' ? 'long' : 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date-only string (YYYY-MM-DD) for display.
 *
 * @example
 * formatDateOnly('2026-04-25', 'ja') // → "2026年4月25日"
 * formatDateOnly('2026-04-25', 'en') // → "Apr 25, 2026"
 */
export function formatDateOnly(dateString: string, locale: Locale = 'ja'): string {
  const date = new Date(dateString + 'T00:00:00');
  const localeTag = locale === 'ja' ? 'ja-JP' : 'en-US';

  return date.toLocaleDateString(localeTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Returns a short time string in local timezone.
 *
 * @example
 * formatTime('2026-04-25T09:30:00Z', 'Asia/Tokyo') // → "18:30"
 */
export function formatTime(isoString: string, timezone: string = 'Asia/Tokyo'): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ja-JP', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  });
}
