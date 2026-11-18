const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const TR_DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const TR_DAYS_FULL = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getActiveDate(offsetDays = 0): Date {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  if (offsetDays !== 0) {
    now.setDate(now.getDate() + offsetDays);
  }
  return now;
}

export function getActiveDateKey(offsetDays = 0): string {
  return toDateKey(getActiveDate(offsetDays));
}

export function addDaysToKey(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function formatTurkishDate(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}, ${TR_DAYS_FULL[d.getDay()]}`;
}

export function formatShortTurkishDate(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function getShortDayName(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return TR_DAYS_SHORT[d.getDay()];
}

export function getLast7DateKeys(todayKey: string): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    keys.push(addDaysToKey(todayKey, -i));
  }
  return keys;
}

export function computeStreak(
  completedDateSet: Set<string>,
  todayKey: string,
): number {
  let streak = 0;
  let cursor = todayKey;

  // If today isn't completed yet, start checking from yesterday so streak isn't broken mid-day
  if (!completedDateSet.has(cursor)) {
    cursor = addDaysToKey(cursor, -1);
  }

  while (completedDateSet.has(cursor)) {
    streak += 1;
    cursor = addDaysToKey(cursor, -1);
    if (streak > 3650) break;
  }

  return streak;
}
