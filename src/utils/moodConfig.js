// Mood levels for the post-class mood check (1 = worst, 5 = best)
export const MOOD_LEVELS = [
  { value: 1, emoji: '😣', label: 'ไม่โอเคมาก', tone: 'text-rose-600 dark:text-rose-400' },
  { value: 2, emoji: '🙁', label: 'ไม่ค่อยโอเค', tone: 'text-orange-600 dark:text-orange-400' },
  { value: 3, emoji: '😐', label: 'เฉย ๆ / ปกติ', tone: 'text-amber-600 dark:text-amber-400' },
  { value: 4, emoji: '🙂', label: 'ดี', tone: 'text-lime-600 dark:text-lime-400' },
  { value: 5, emoji: '🤩', label: 'ดีจนเซอร์ไพรส์', tone: 'text-emerald-600 dark:text-emerald-400' },
];

export function getMoodLevel(value) {
  const num = Number(value);
  return MOOD_LEVELS.find((m) => m.value === num) || null;
}
