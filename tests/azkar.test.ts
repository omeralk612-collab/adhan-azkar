import { describe, it, expect, beforeEach, vi } from 'vitest';
import azkarData from '../src/data/azkar.json';

// بيئة Node بلا localStorage: نحاكيه بذاكرة بسيطة
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k)
});

import { getAzkar, getCount, increment, resetCategory } from '../src/azkar';

beforeEach(() => store.clear());

describe('بيانات الأذكار', () => {
  it('لكل ذكر نص وعدد موجب ومصدر', () => {
    for (const cat of ['morning', 'evening', 'afterPrayer'] as const) {
      const list = getAzkar(cat);
      expect(list.length).toBeGreaterThan(0);
      for (const d of list) {
        expect(d.text.trim()).not.toBe('');
        expect(d.count).toBeGreaterThan(0);
        expect(d.source.trim()).not.toBe('');
      }
    }
  });

  it('المعرّفات غير مكررة', () => {
    const ids = azkarData.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('العدّاد', () => {
  it('يزيد ولا يتجاوز العدد المطلوب', () => {
    const d = getAzkar('morning').find(x => x.count === 3)!;
    for (let i = 0; i < 10; i++) increment('morning', d, '2026-01-01');
    expect(getCount('morning', d.id, '2026-01-01')).toBe(3);
  });

  it('يبدأ من الصفر في يوم جديد', () => {
    const d = getAzkar('morning')[0];
    increment('morning', d, '2026-01-01');
    expect(getCount('morning', d.id, '2026-01-02')).toBe(0);
  });

  it('التصفير يمسح عدّادات القسم', () => {
    const d = getAzkar('afterPrayer')[0];
    increment('afterPrayer', d, '2026-01-01');
    resetCategory('afterPrayer', '2026-01-01');
    expect(getCount('afterPrayer', d.id, '2026-01-01')).toBe(0);
  });
});
