import './style.css';
import { registerSW } from 'virtual:pwa-register';
import {
  PRAYER_ORDER, PRAYER_LABELS, METHOD_LABELS,
  getPrayerTimes, getNextPrayer, formatTime, formatCountdown,
  type MethodKey, type PrayerName
} from './prayer';
import {
  CITIES, loadSettings, saveSettings, resolvePlace, type Settings
} from './settings';
import {
  CATEGORY_LABELS, getAzkar, getCount, increment, resetCategory, todayString, type Category
} from './azkar';
import { playAdhan, stopAdhan, unlockAudio } from './adhan-audio';

registerSW({ immediate: true });

type Tab = 'times' | 'azkar' | 'settings';

let settings: Settings = loadSettings();
let tab: Tab = 'times';
let category: Category = defaultCategory();
let notice = '';

// حالة الجدولة: نتذكر الهدف السابق لنعرف متى عبرنا وقت الصلاة
let currentTarget: { name: PrayerName; time: Date } | null = null;
let lastFiredAt = 0;
let renderedDay = todayString();
const FIRE_WINDOW_MS = 3 * 60 * 1000; // نتسامح مع تأخير المؤقّت في الخلفية

const app = document.getElementById('app')!;

// ---------- أدوات صغيرة ----------
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, attrs: Record<string, string> = {}, ...kids: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const kid of kids) el.append(kid);
  return el;
}

function defaultCategory(): Category {
  const hr = new Date().getHours();
  return hr < 12 ? 'morning' : 'evening';
}

function update(patch: Partial<Settings>): void {
  settings = { ...settings, ...patch };
  saveSettings(settings);
  currentTarget = null;
  render();
}

// ---------- الصفحات ----------
function renderTimes(): HTMLElement {
  const loc = resolvePlace(settings);
  const box = h('section', { class: 'view' });

  if (!loc) {
    box.append(
      h('p', { class: 'empty' }, 'لم يُحدَّد موقعك بعد. اختر مدينة أو اسمح للتطبيق بمعرفة موقعك من الإعدادات.')
    );
    return box;
  }

  const now = new Date();
  const times = getPrayerTimes(loc.place, settings.method, settings.madhab, now);
  const next = getNextPrayer(loc.place, settings.method, settings.madhab, now);

  const hero = h('div', { class: 'hero', 'data-next': next.name });
  hero.append(
    h('p', { class: 'hero-label' }, `الصلاة القادمة: ${PRAYER_LABELS[next.name]}`),
    h('p', { class: 'hero-count', id: 'countdown', 'aria-live': 'off' }, formatCountdown(next.time.getTime() - now.getTime())),
    h('p', { class: 'hero-sub' }, `${formatTime(next.time, loc.tz)} — ${loc.label}`)
  );
  box.append(hero);

  const list = h('ul', { class: 'times' });
  for (const name of PRAYER_ORDER) {
    const li = h('li', { class: name === next.name ? 'is-next' : '' },
      h('span', { class: 't-name' }, PRAYER_LABELS[name]),
      h('span', { class: 't-time' }, formatTime(times[name], loc.tz))
    );
    list.append(li);
  }
  box.append(list);

  if (notice) box.append(h('p', { class: 'notice' }, notice));
  return box;
}

function renderAzkar(): HTMLElement {
  const box = h('section', { class: 'view' });

  const chips = h('div', { class: 'chips', role: 'tablist' });
  (Object.keys(CATEGORY_LABELS) as Category[]).forEach(c => {
    const b = h('button', {
      class: 'chip' + (c === category ? ' on' : ''), role: 'tab',
      'aria-selected': String(c === category)
    }, CATEGORY_LABELS[c]);
    b.addEventListener('click', () => { category = c; render(); });
    chips.append(b);
  });
  box.append(chips);

  for (const d of getAzkar(category)) {
    const done = () => getCount(category, d.id) >= d.count;
    const btn = h('button', { class: 'counter' + (done() ? ' done' : '') });
    const paint = () => {
      btn.textContent = done() ? `تم ✓ (${d.count})` : `${getCount(category, d.id)} / ${d.count}`;
      btn.classList.toggle('done', done());
    };
    paint();
    btn.addEventListener('click', () => { increment(category, d); paint(); });

    box.append(
      h('article', { class: 'dhikr' },
        h('p', { class: 'dhikr-text' }, d.text),
        h('p', { class: 'dhikr-src' }, d.source),
        btn
      )
    );
  }

  const reset = h('button', { class: 'link' }, 'تصفير عدّادات هذا القسم');
  reset.addEventListener('click', () => { resetCategory(category); render(); });
  box.append(
    reset,
    h('p', { class: 'fine' }, 'النصوص منقولة مع مصادرها. يُستحسن عرضها على طالب علم موثوق قبل الاعتماد عليها. والله أعلم.')
  );
  return box;
}

function renderSettings(): HTMLElement {
  const box = h('section', { class: 'view form' });

  // الموقع
  const locSel = h('select', { id: 'loc' });
  for (const c of CITIES) locSel.append(new Option(c.name, c.id, false, settings.locationMode === c.id));
  if (settings.lastGps) locSel.append(new Option('موقعي الحالي', 'gps', false, settings.locationMode === 'gps'));
  locSel.addEventListener('change', () => update({ locationMode: locSel.value }));

  const gpsBtn = h('button', { class: 'btn' }, 'استخدم موقعي');
  gpsBtn.addEventListener('click', () => {
    if (!('geolocation' in navigator)) { notice = 'المتصفح لا يدعم تحديد الموقع.'; render(); return; }
    gpsBtn.textContent = 'جارٍ التحديد…';
    navigator.geolocation.getCurrentPosition(
      pos => {
        notice = '';
        update({ locationMode: 'gps', lastGps: { lat: pos.coords.latitude, lon: pos.coords.longitude } });
      },
      () => { notice = 'تعذّر تحديد الموقع. اختر مدينة من القائمة.'; render(); },
      { timeout: 10000, maximumAge: 60 * 60 * 1000 }
    );
  });

  // طريقة الحساب
  const methodSel = h('select', { id: 'method' });
  (Object.keys(METHOD_LABELS) as MethodKey[]).forEach(k =>
    methodSel.append(new Option(METHOD_LABELS[k], k, false, settings.method === k)));
  methodSel.addEventListener('change', () => update({ method: methodSel.value as MethodKey }));

  // العصر
  const madhabSel = h('select', { id: 'madhab' });
  madhabSel.append(
    new Option('الجمهور: ظل الشيء مثله', 'shafi', false, settings.madhab === 'shafi'),
    new Option('الحنفية: ظل الشيء مثليه', 'hanafi', false, settings.madhab === 'hanafi')
  );
  madhabSel.addEventListener('change', () => update({ madhab: madhabSel.value as 'shafi' | 'hanafi' }));

  // الأذان والإشعارات
  const soundCb = h('input', { type: 'checkbox', id: 'sound' });
  soundCb.checked = settings.adhanSound;
  soundCb.addEventListener('change', async () => {
    if (soundCb.checked) await unlockAudio();
    update({ adhanSound: soundCb.checked });
  });

  const notifCb = h('input', { type: 'checkbox', id: 'notif' });
  notifCb.checked = settings.notifications;
  notifCb.addEventListener('change', async () => {
    if (notifCb.checked && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { notifCb.checked = false; notice = 'لم يُمنح إذن الإشعارات.'; }
    }
    update({ notifications: notifCb.checked });
  });

  const testBtn = h('button', { class: 'btn ghost' }, 'جرّب الأذان');
  testBtn.addEventListener('click', async () => {
    await unlockAudio();
    const ok = await playAdhan();
    notice = ok ? '' : 'لم يُشغَّل الصوت. تأكد من وجود الملف public/audio/adhan.mp3.';
    if (!ok) render();
  });
  const stopBtn = h('button', { class: 'btn ghost' }, 'إيقاف');
  stopBtn.addEventListener('click', () => stopAdhan());

  const field = (label: string, ctl: HTMLElement, extra?: HTMLElement) =>
    h('label', { class: 'field' }, h('span', {}, label), ctl, ...(extra ? [extra] : []));

  box.append(
    field('المدينة', locSel),
    gpsBtn,
    field('طريقة الحساب', methodSel),
    field('وقت العصر', madhabSel),
    h('label', { class: 'check' }, soundCb, h('span', {}, 'تشغيل صوت الأذان (والتطبيق مفتوح)')),
    h('label', { class: 'check' }, notifCb, h('span', {}, 'إظهار إشعار عند دخول الوقت (والتطبيق مفتوح)')),
    h('div', { class: 'row' }, testBtn, stopBtn),
    h('p', { class: 'fine' },
      'تنبيه: التطبيق لا يستطيع تنبيهك وهو مغلق تمامًا. هذا يحتاج خادم إشعارات، وهو مؤجَّل. طرق الحساب مسألة اجتهادية، فاختر ما تعتمده بلدك. والله أعلم.'),
  );
  if (notice) box.append(h('p', { class: 'notice' }, notice));
  return box;
}

// ---------- الهيكل العام ----------
function render(): void {
  app.replaceChildren();
  app.append(h('header', { class: 'top' }, h('h1', {}, 'أذان وأذكار')));

  const main = h('main', {});
  main.append(tab === 'times' ? renderTimes() : tab === 'azkar' ? renderAzkar() : renderSettings());
  app.append(main);

  const nav = h('nav', { class: 'tabs' });
  const tabs: [Tab, string][] = [['times', 'المواقيت'], ['azkar', 'الأذكار'], ['settings', 'الإعدادات']];
  for (const [id, label] of tabs) {
    const b = h('button', { class: id === tab ? 'on' : '', 'aria-current': String(id === tab) }, label);
    b.addEventListener('click', () => { tab = id; notice = ''; render(); });
    nav.append(b);
  }
  app.append(nav);
}

// ---------- المؤقّت: العدّ التنازلي + إطلاق الأذان ----------
async function fire(name: PrayerName): Promise<void> {
  if (settings.adhanSound) await playAdhan();
  if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(`حان وقت صلاة ${PRAYER_LABELS[name]}`, { tag: 'adhan', lang: 'ar', dir: 'rtl' });
    } catch { /* الإشعار اختياري */ }
  }
}

function tick(): void {
  const loc = resolvePlace(settings);
  if (!loc) return;
  const now = new Date();

  // تغيّر اليوم: نعيد الرسم ليظهر جدول اليوم الجديد
  if (todayString(now) !== renderedDay) { renderedDay = todayString(now); render(); }

  // هل عبرنا وقت الهدف السابق منذ لحظات؟
  if (currentTarget) {
    const late = now.getTime() - currentTarget.time.getTime();
    if (late >= 0 && late < FIRE_WINDOW_MS && lastFiredAt !== currentTarget.time.getTime()) {
      lastFiredAt = currentTarget.time.getTime();
      void fire(currentTarget.name);
      if (tab === 'times') render();
    }
  }

  const next = getNextPrayer(loc.place, settings.method, settings.madhab, now);
  currentTarget = next;

  const el = document.getElementById('countdown');
  if (el) el.textContent = formatCountdown(next.time.getTime() - now.getTime());
}

render();
tick();
setInterval(tick, 1000);
