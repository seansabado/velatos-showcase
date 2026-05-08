// src/i18n/i18n.ts
// Type-safe internationalization loader — fake/demo implementation

import ja from './ja.json';
import en from './en.json';

export type Locale = 'ja' | 'en';

// In production: this type is generated from the JA translation file at build time
// to catch missing keys at compile time.
export type TranslationKey =
  | 'pos.shift.open_button'
  | 'pos.shift.close_button'
  | 'pos.shift.suspended_label'
  | 'pos.shift.confirm_close'
  | 'pos.shift.open_success'
  | 'pos.shift.close_success'
  | 'pos.order.new_button'
  | 'pos.order.confirm_button'
  | 'pos.order.cancel_button'
  | 'pos.order.void_button'
  | 'pos.order.void_reason.label'
  | 'pos.order.void_reason.placeholder'
  | 'pos.order.payment.cash'
  | 'pos.order.payment.card'
  | 'pos.order.payment.total_label'
  | 'pos.order.payment.tax_label'
  | 'pos.order.payment.subtotal_label'
  | 'manager.dashboard.title'
  | 'manager.dashboard.transactions_today'
  | 'manager.dashboard.gross_revenue'
  | 'manager.dashboard.open_exceptions'
  | 'manager.exception.approve_button'
  | 'manager.exception.reject_button'
  | 'manager.daily_close.button'
  | 'manager.daily_close.confirm'
  | 'staff.punch.in_button'
  | 'staff.punch.out_button'
  | 'staff.punch.success_in'
  | 'staff.punch.success_out'
  | 'staff.punch.geofence_warning'
  | 'staff.schedule.title'
  | 'staff.schedule.no_schedule'
  | 'common.error.network'
  | 'common.error.unauthorized'
  | 'common.error.not_found'
  | 'common.status.loading'
  | 'common.status.saving'
  | 'common.status.offline'
  | 'common.status.syncing'
  | 'common.action.save'
  | 'common.action.cancel'
  | 'common.action.confirm'
  | 'common.action.back';

const dictionaries: Record<Locale, Record<string, unknown>> = { ja, en };

/**
 * Retrieves a translation string by dot-notation key.
 * Falls back to the key itself if the translation is missing,
 * making gaps visible during QA without crashing.
 *
 * @example
 * t('pos.shift.open_button', 'ja') // → "シフト開始"
 * t('pos.shift.open_button', 'en') // → "Open Shift"
 */
export function t(key: TranslationKey, locale: Locale = 'ja'): string {
  const parts = key.split('.');
  let node: unknown = dictionaries[locale];

  for (const part of parts) {
    if (typeof node !== 'object' || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }

  return typeof node === 'string' ? node : key;
}

/**
 * Creates a locale-bound translation function.
 * Useful for passing to child components without threading locale everywhere.
 *
 * @example
 * const { t } = useTranslation('ja');
 * t('pos.shift.open_button') // → "シフト開始"
 */
export function createTranslator(locale: Locale): { t: (key: TranslationKey) => string } {
  return { t: (key) => t(key, locale) };
}
