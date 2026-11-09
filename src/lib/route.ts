import type { LocalDate, PhaseStatus } from '@/api/types';

/*
 * Drawing a route: phases follow each other without gaps, so each phase is edited by its end date only. The first
 * starts with the goal's window; each next one starts the day after the previous one ends.
 */

function toUtc(date: LocalDate): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtc(date: Date): LocalDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** `date` moved by whole months, keeping the day where the month has it (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: LocalDate, months: number): LocalDate {
  const d = toUtc(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return fromUtc(d);
}

export function minDate(a: LocalDate, b: LocalDate): LocalDate {
  return a < b ? a : b;
}

export function maxDate(a: LocalDate, b: LocalDate): LocalDate {
  return a > b ? a : b;
}

/** A phase's status follows the calendar: the one holding today is ACTIVE, earlier ones DONE. */
export function phaseStatus(startsOn: LocalDate, endsOn: LocalDate, today: LocalDate): PhaseStatus {
  if (endsOn < today) return 'DONE';
  return startsOn <= today ? 'ACTIVE' : 'UPCOMING';
}

/** The start of each phase, given where the route starts and each phase's end. */
export function phaseStarts(routeStart: LocalDate, ends: LocalDate[]): LocalDate[] {
  return ends.map((_, i) => (i === 0 ? routeStart : addDays(ends[i - 1], 1)));
}

/** Exit criteria are stored as clauses separated by ";" and edited one per line. */
export function clausesToLines(text: string): string {
  return text
    .split(';')
    .map((clause) => clause.trim())
    .filter(Boolean)
    .join('\n');
}

export function linesToClauses(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim().replace(/;+$/, ''))
    .filter(Boolean)
    .join('; ');
}
