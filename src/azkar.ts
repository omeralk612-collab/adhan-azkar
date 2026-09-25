import data from './data/azkar.json';

export type Category = 'morning' | 'evening' | 'afterPrayer';

export interface Dhikr {
  id: string;
  text: string;
  count: number;
  source: string;
  categories: Category[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  morning: 'أذكار الصباح',
  evening: 'أذكار المساء',
  afterPrayer: 'أذكار بعد الصلاة'
};

const ALL = data as Dhikr[];

export function getAzkar(category: Category): Dhikr[] {
  return ALL.filter(d => d.categories.includes(category));
}

/** العدّاد يُصفَّر يوميًا لأن المفتاح يحمل تاريخ اليوم */
function counterKey(category: Category, id: string, day: string): string {
  return `adhan-app:count:${day}:${category}:${id}`;
}

export function todayString(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function getCount(category: Category, id: string, day = todayString()): number {
  try { return Number(localStorage.getItem(counterKey(category, id, day))) || 0; }
  catch { return 0; }
}

/** يزيد العدّ بمقدار واحد ولا يتجاوز العدد المطلوب. يرجع القيمة الجديدة. */
export function increment(category: Category, dhikr: Dhikr, day = todayString()): number {
  const next = Math.min(dhikr.count, getCount(category, dhikr.id, day) + 1);
  try { localStorage.setItem(counterKey(category, dhikr.id, day), String(next)); } catch { /* تجاهل */ }
  return next;
}

export function resetCategory(category: Category, day = todayString()): void {
  for (const d of getAzkar(category)) {
    try { localStorage.removeItem(counterKey(category, d.id, day)); } catch { /* تجاهل */ }
  }
}
