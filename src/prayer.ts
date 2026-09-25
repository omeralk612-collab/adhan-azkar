import {
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  HighLatitudeRule,
  Madhab,
  PrayerTimes
} from 'adhan';

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type MethodKey =
  | 'UmmAlQura' | 'MuslimWorldLeague' | 'Egyptian' | 'Karachi'
  | 'NorthAmerica' | 'Dubai' | 'Qatar' | 'Kuwait' | 'Turkey' | 'Singapore';
export type MadhabKey = 'shafi' | 'hanafi';

export const PRAYER_ORDER: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر',
  asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء'
};

export const METHOD_LABELS: Record<MethodKey, string> = {
  UmmAlQura: 'أم القرى (مكة المكرمة)',
  MuslimWorldLeague: 'رابطة العالم الإسلامي',
  Egyptian: 'الهيئة المصرية العامة للمساحة',
  Karachi: 'جامعة العلوم الإسلامية بكراتشي',
  NorthAmerica: 'أمريكا الشمالية (ISNA)',
  Dubai: 'دبي',
  Qatar: 'قطر',
  Kuwait: 'الكويت',
  Turkey: 'رئاسة الشؤون الدينية التركية',
  Singapore: 'سنغافورة'
};

export interface Place { lat: number; lon: number; }
export type PrayerMap = Record<PrayerName, Date>;

function buildParams(method: MethodKey, madhab: MadhabKey, place: Place): CalculationParameters {
  const params = CalculationMethod[method]();
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  // في المدن البعيدة شمالًا/جنوبًا قد لا يغيب الشفق، فنطبّق قاعدة الخطوط العليا
  params.highLatitudeRule = HighLatitudeRule.recommended(new Coordinates(place.lat, place.lon));
  return params;
}

export function getPrayerTimes(
  place: Place, method: MethodKey, madhab: MadhabKey, date: Date
): PrayerMap {
  const coords = new Coordinates(place.lat, place.lon);
  const t = new PrayerTimes(coords, date, buildParams(method, madhab, place));
  return {
    fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr,
    asr: t.asr, maghrib: t.maghrib, isha: t.isha
  };
}

/**
 * الصلاة القادمة (بدون الشروق لأنه ليس صلاة).
 * بعد العشاء نرجع فجر الغد.
 */
export function getNextPrayer(
  place: Place, method: MethodKey, madhab: MadhabKey, now: Date
): { name: PrayerName; time: Date } {
  const today = getPrayerTimes(place, method, madhab, now);
  for (const name of PRAYER_ORDER) {
    if (name === 'sunrise') continue;
    if (today[name].getTime() > now.getTime()) return { name, time: today[name] };
  }
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const t = getPrayerTimes(place, method, madhab, tomorrow);
  return { name: 'fajr', time: t.fajr };
}

export function formatTime(d: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('ar-u-nu-latn', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone
  }).format(d);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
