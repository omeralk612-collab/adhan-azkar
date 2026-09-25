import { describe, it, expect } from 'vitest';
import { getPrayerTimes, getNextPrayer, formatCountdown } from '../src/prayer';

const MAKKAH = { lat: 21.4225, lon: 39.8262 };
const DAY = new Date('2026-03-20T12:00:00Z');

describe('حساب المواقيت', () => {
  it('ترتيب الأوقات تصاعدي خلال اليوم', () => {
    const t = getPrayerTimes(MAKKAH, 'UmmAlQura', 'shafi', DAY);
    const seq = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map(d => d.getTime());
    expect([...seq].sort((a, b) => a - b)).toEqual(seq);
  });

  it('العصر عند الحنفية بعد العصر عند الجمهور', () => {
    const s = getPrayerTimes(MAKKAH, 'UmmAlQura', 'shafi', DAY);
    const h = getPrayerTimes(MAKKAH, 'UmmAlQura', 'hanafi', DAY);
    expect(h.asr.getTime()).toBeGreaterThan(s.asr.getTime());
  });

  it('الصلاة القادمة قبل الفجر هي الفجر', () => {
    const t = getPrayerTimes(MAKKAH, 'UmmAlQura', 'shafi', DAY);
    const before = new Date(t.fajr.getTime() - 60_000);
    expect(getNextPrayer(MAKKAH, 'UmmAlQura', 'shafi', before).name).toBe('fajr');
  });

  it('بعد العشاء تكون القادمة فجر الغد', () => {
    const t = getPrayerTimes(MAKKAH, 'UmmAlQura', 'shafi', DAY);
    const after = new Date(t.isha.getTime() + 60_000);
    const next = getNextPrayer(MAKKAH, 'UmmAlQura', 'shafi', after);
    expect(next.name).toBe('fajr');
    expect(next.time.getTime()).toBeGreaterThan(after.getTime());
  });

  it('الشروق لا يُعدّ صلاة قادمة', () => {
    const t = getPrayerTimes(MAKKAH, 'UmmAlQura', 'shafi', DAY);
    const afterFajr = new Date(t.fajr.getTime() + 60_000);
    expect(getNextPrayer(MAKKAH, 'UmmAlQura', 'shafi', afterFajr).name).toBe('dhuhr');
  });

  it('لا ينهار في خط عرض عالٍ', () => {
    const oslo = { lat: 59.91, lon: 10.75 };
    const t = getPrayerTimes(oslo, 'MuslimWorldLeague', 'shafi', new Date('2026-06-21T12:00:00Z'));
    expect(Number.isNaN(t.fajr.getTime())).toBe(false);
    expect(Number.isNaN(t.isha.getTime())).toBe(false);
  });
});

describe('العدّ التنازلي', () => {
  it('يصيغ الساعات والدقائق والثواني', () => {
    expect(formatCountdown(3_723_000)).toBe('01:02:03');
  });
  it('لا يعرض قيمة سالبة', () => {
    expect(formatCountdown(-5000)).toBe('00:00:00');
  });
});
