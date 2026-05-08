// src/shared/utils/id.ts
// Simple ID generation utilities

/**
 * Generates a UUID v4-style identifier.
 * In production: use the platform's native UUID generator.
 * This is a demo implementation using Math.random().
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a short human-readable reference code.
 * Used for order numbers, RMA case IDs, etc.
 *
 * @example
 * generateRef('ORD') // → "ORD-20260425-A3F7"
 */
export function generateRef(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}
