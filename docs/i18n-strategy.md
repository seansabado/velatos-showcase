# Internationalization Strategy

The platform targets the Japanese retail market as the primary locale, with English as a secondary locale for back-office and developer surfaces.

---

## Design Decisions

| Decision | Rationale |
|---|---|
| **Japanese as default** | All customer-facing and staff-facing UI defaults to JA. EN is for admin/developer contexts. |
| **Key-based, not string-based** | Translation keys are structural identifiers, not English sentences. Avoids accidental English leakage. |
| **Type-safe keys** | Keys are typed as a union — typos are caught at compile time, not runtime. |
| **No bilingual mixing in data layer** | Stored data is language-neutral (ISO codes, numeric IDs). Localization is presentation-only. |
| **Date/time: Asia/Tokyo** | All timestamps stored in UTC, displayed in JST. Currency: JPY (¥), no decimal. |

---

## Key Naming Convention

```
{surface}.{screen}.{element}[.{state}]

Examples:
  pos.shift.open_button          → "シフト開始"
  pos.order.confirm_button       → "確認"
  pos.order.void_reason.label    → "返品理由"
  manager.dashboard.title        → "ダッシュボード"
  staff.punch.success_message    → "打刻完了"
  common.error.network           → "通信エラーが発生しました"
  common.status.loading          → "読み込み中..."
```

---

## Fake Translation Files

### Japanese (`src/i18n/ja.json`) — excerpt

```json
{
  "pos": {
    "shift": {
      "open_button": "シフト開始",
      "close_button": "シフト終了",
      "suspended_label": "一時停止中",
      "confirm_close": "シフトを終了しますか？"
    },
    "order": {
      "new_button": "新規注文",
      "confirm_button": "確認",
      "cancel_button": "キャンセル",
      "void_reason": {
        "label": "返品理由",
        "placeholder": "理由を入力してください"
      },
      "payment": {
        "cash": "現金",
        "card": "カード",
        "total_label": "合計"
      }
    }
  },
  "manager": {
    "dashboard": {
      "title": "ダッシュボード",
      "transactions_today": "本日の取引数",
      "gross_revenue": "売上合計",
      "open_exceptions": "未処理の例外"
    }
  },
  "common": {
    "error": {
      "network": "通信エラーが発生しました",
      "unauthorized": "アクセス権限がありません",
      "not_found": "データが見つかりません"
    },
    "status": {
      "loading": "読み込み中...",
      "saving": "保存中...",
      "offline": "オフライン"
    }
  }
}
```

### English (`src/i18n/en.json`) — excerpt

```json
{
  "pos": {
    "shift": {
      "open_button": "Open Shift",
      "close_button": "Close Shift",
      "suspended_label": "Suspended",
      "confirm_close": "Are you sure you want to close this shift?"
    },
    "order": {
      "new_button": "New Order",
      "confirm_button": "Confirm",
      "cancel_button": "Cancel",
      "void_reason": {
        "label": "Void Reason",
        "placeholder": "Enter reason"
      },
      "payment": {
        "cash": "Cash",
        "card": "Card",
        "total_label": "Total"
      }
    }
  },
  "manager": {
    "dashboard": {
      "title": "Dashboard",
      "transactions_today": "Transactions Today",
      "gross_revenue": "Gross Revenue",
      "open_exceptions": "Open Exceptions"
    }
  },
  "common": {
    "error": {
      "network": "A network error occurred",
      "unauthorized": "You do not have permission to access this",
      "not_found": "Record not found"
    },
    "status": {
      "loading": "Loading...",
      "saving": "Saving...",
      "offline": "Offline"
    }
  }
}
```

---

## Type-Safe Loader Pattern

```typescript
// src/i18n/i18n.ts

type Locale = 'ja' | 'en';

// Type-safe key access using dot-notation string literal types
// In production: generated from the JA translation file shape
type TranslationKey =
  | 'pos.shift.open_button'
  | 'pos.shift.close_button'
  | 'pos.order.confirm_button'
  | 'manager.dashboard.title'
  | 'common.error.network'
  | 'common.status.loading'
  | 'common.status.offline';
  // ... full list generated at build time

function t(key: TranslationKey, locale: Locale = 'ja'): string {
  // Traverse the nested object using the dot-notation key
  const parts = key.split('.');
  const dict = locale === 'ja' ? ja : en;
  let node: unknown = dict;
  for (const part of parts) {
    if (typeof node !== 'object' || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : key;
}
```

---

## Currency and Date Formatting

```typescript
// JPY — no decimal places
formatCurrency(1500, 'JPY') // → "¥1,500"

// JST display
formatDate('2026-04-25T09:00:00Z', 'Asia/Tokyo') // → "2026年4月25日 18:00"

// Relative time (Japanese)
formatRelative(new Date(), pastDate, 'ja') // → "3時間前"
```

---

## What We Avoid

- **Mixed-language UI** — strings never partially translate within a single screen.
- **English keys as fallback in JA UI** — missing JA key surfaces the key identifier (e.g., `pos.shift.open_button`) rather than English text, making gaps visible during QA.
- **Hardcoded locale in components** — locale is provided via React context; components never call `new Date().toLocaleString('ja-JP')` directly.
