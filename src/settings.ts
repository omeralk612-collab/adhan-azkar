import type { MadhabKey, MethodKey, Place } from './prayer';

export interface City { id: string; name: string; lat: number; lon: number; tz: string; }

export const CITIES: City[] = [
  { id: 'makkah', name: 'مكة المكرمة', lat: 21.4225, lon: 39.8262, tz: 'Asia/Riyadh' },
  { id: 'madinah', name: 'المدينة المنورة', lat: 24.4672, lon: 39.6111, tz: 'Asia/Riyadh' },
  { id: 'riyadh', name: 'الرياض', lat: 24.7136, lon: 46.6753, tz: 'Asia/Riyadh' },
  { id: 'cairo', name: 'القاهرة', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  { id: 'amman', name: 'عمّان', lat: 31.9454, lon: 35.9284, tz: 'Asia/Amman' },
  { id: 'dubai', name: 'دبي', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { id: 'casablanca', name: 'الدار البيضاء', lat: 33.5731, lon: -7.5898, tz: 'Africa/Casablanca' },
  { id: 'istanbul', name: 'إسطنبول', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  { id: 'karachi', name: 'كراتشي', lat: 24.8607, lon: 67.0011, tz: 'Asia/Karachi' },
  { id: 'jakarta', name: 'جاكرتا', lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' }
];

export interface Settings {
  method: MethodKey;
  madhab: MadhabKey;
  /** 'gps' = موقع الجهاز، أو معرّف مدينة من القائمة */
  locationMode: 'gps' | string;
  /** آخر موقع GPS ناجح، لنعمل بلا إنترنت/إذن لاحقًا */
  lastGps: Place | null;
  adhanSound: boolean;
  notifications: boolean;
}

const KEY = 'adhan-app:settings:v1';

export const DEFAULTS: Settings = {
  method: 'UmmAlQura',
  madhab: 'shafi',
  locationMode: 'makkah',
  lastGps: null,
  adhanSound: true,
  notifications: false
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // بيانات تالفة: نرجع للافتراضي بدل أن ينهار التطبيق
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* التخزين ممتلئ أو ممنوع */ }
}

/** يحوّل الإعدادات إلى موقع ومنطقة زمنية للعرض */
export function resolvePlace(s: Settings): { place: Place; tz?: string; label: string } | null {
  if (s.locationMode === 'gps') {
    if (!s.lastGps) return null;
    return { place: s.lastGps, tz: undefined, label: 'موقعك الحالي' };
  }
  const c = CITIES.find(x => x.id === s.locationMode) ?? CITIES[0];
  return { place: { lat: c.lat, lon: c.lon }, tz: c.tz, label: c.name };
}
