// الملف الصوتي غير مرفق عمدًا: ضع تسجيلًا مرخّصًا في public/audio/adhan.mp3
const SRC = '/audio/adhan.mp3';

let audio: HTMLAudioElement | null = null;

export function isPlaying(): boolean {
  return !!audio && !audio.paused;
}

/** يرجع false إذا منع المتصفح التشغيل أو الملف غير موجود */
export async function playAdhan(): Promise<boolean> {
  try {
    if (!audio) audio = new Audio(SRC);
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function stopAdhan(): void {
  if (audio) { audio.pause(); audio.currentTime = 0; }
}

/** المتصفحات تشترط تفاعلًا من المستخدم قبل الصوت: نستدعيها عند نقرة "فعّل الأذان" */
export async function unlockAudio(): Promise<void> {
  try {
    if (!audio) audio = new Audio(SRC);
    audio.muted = true;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
  } catch { /* الملف غير موجود أو ممنوع */ }
}
