import { generateId, generateRef } from '../id';

describe('generateId', () => {
  it('returns UUID v4-style string', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('generateRef', () => {
  it('returns expected pattern with prefix and date', () => {
    const ref = generateRef('ORD');
    expect(ref).toMatch(/^ORD-\d{8}-[A-Z0-9]{4}$/);
  });

  it('creates unique refs across close calls in practice', () => {
    const a = generateRef('RMA');
    const b = generateRef('RMA');
    expect(a).not.toBe(b);
  });
});
