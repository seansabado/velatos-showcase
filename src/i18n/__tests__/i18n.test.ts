import { t, createTranslator } from '../i18n';

describe('i18n t()', () => {
  it('returns translated JA value for known key', () => {
    expect(t('pos.shift.open_button', 'ja')).toBe('シフト開始');
  });

  it('returns translated EN value for known key', () => {
    expect(t('pos.shift.open_button', 'en')).toBe('Open Shift');
  });

  it('returns key for missing translation paths', () => {
    const missing = 'common.action.this_key_is_missing' as unknown as Parameters<typeof t>[0];
    expect(t(missing, 'ja')).toBe('common.action.this_key_is_missing');
  });
});

describe('createTranslator()', () => {
  it('returns locale-bound translator', () => {
    const ja = createTranslator('ja');
    expect(ja.t('common.action.save')).toBe('保存');
  });
});
