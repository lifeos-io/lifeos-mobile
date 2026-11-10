import type { EffortCategory, LocalDate } from '@/api/types';

const monthsShort = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const monthsLong = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

function parts(date: LocalDate) {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month: month - 1, day };
}

/** Today in the device's time zone, as a LocalDate. */
export function today(): LocalDate {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const a = parts(from);
  const b = parts(to);
  return Math.round((Date.UTC(b.year, b.month, b.day) - Date.UTC(a.year, a.month, a.day)) / 86_400_000);
}

/** "8 Kas" */
export function dayMonth(date: LocalDate): string {
  const { day, month } = parts(date);
  return `${day} ${monthsShort[month]}`;
}

/** "Kas – Ara" */
export function monthRange(from: LocalDate, to: LocalDate): string {
  return `${monthsShort[parts(from).month]} – ${monthsShort[parts(to).month]}`;
}

/** "Mayıs – Kasım 2027", or "Kasım 2026 – Mayıs 2027" across years. */
export function longMonthRange(from: LocalDate, to: LocalDate): string {
  const a = parts(from);
  const b = parts(to);
  return a.year === b.year
    ? `${monthsLong[a.month]} – ${monthsLong[b.month]} ${b.year}`
    : `${monthsLong[a.month]} ${a.year} – ${monthsLong[b.month]} ${b.year}`;
}

/** A duration: "30 dk", "3 sa", "1 sa 30 dk". */
export function duration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} dk`;
  return rest === 0 ? `${hours} sa` : `${hours} sa ${rest} dk`;
}

/** The clock-like fuel figure: "3:50", "4". */
export function clock(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}` : `${hours}:${String(rest).padStart(2, '0')}`;
}

export const effortLabels: Record<EffortCategory, string> = {
  TECHNICAL: 'Teknik',
  DOMAIN: 'Domain',
  OTHER: 'Diğer',
};

/** Exit criteria are stored as clauses separated by ";". */
export function clauses(text: string): string[] {
  return text
    .split(';')
    .map((clause) => clause.trim())
    .filter(Boolean);
}

/** "Bugün", "Dün" or "7 Kas": a recent day in the past. */
export function pastDay(date: LocalDate, now: LocalDate = today()): string {
  const ago = daysBetween(date, now);
  return ago === 0 ? 'Bugün' : ago === 1 ? 'Dün' : dayMonth(date);
}
