import type { Action, LocalDate, WeeklyPlan } from '@/api/types';

/*
 * ISO weeks ("2026-W46"): weeks start on Monday, and the week holding a year's first Thursday is that year's week 1.
 */

function utc(date: LocalDate): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** The ISO week a day falls in: "2026-W46". */
export function isoWeekOf(date: LocalDate): string {
  const day = utc(date);
  // The Thursday of the week decides the year.
  const thursday = new Date(day);
  thursday.setUTCDate(day.getUTCDate() + 3 - ((day.getUTCDay() + 6) % 7));
  const year = thursday.getUTCFullYear();
  const week = 1 + Math.floor((thursday.getTime() - Date.UTC(year, 0, 1)) / (7 * 86_400_000));
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** The Monday an ISO week starts on. */
export function mondayOf(isoWeek: string): LocalDate {
  const [year, week] = isoWeek.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (week - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

/** "2026-W46" → 46 */
export function weekNumber(isoWeek: string): number {
  return Number(isoWeek.split('-W')[1]);
}

/** The ISO week after `weekStart` (a Monday): "2026-W47". */
export function nextIsoWeek(weekStart: LocalDate): string {
  const next = utc(weekStart);
  next.setUTCDate(next.getUTCDate() + 7);
  return isoWeekOf(next.toISOString().slice(0, 10));
}

/** The time the week's steps take: their estimates, dropped steps aside (what Strategy holds to the capacity). */
export function plannedMinutes(actions: Action[]): number {
  return actions.filter((a) => a.status !== 'DROPPED').reduce((sum, a) => sum + a.estimateMinutes, 0);
}

/**
 * The week to plan when none is active: this week, unless it is already closed (the review is done), then the
 * next one. A draft of that week is picked up where it was left.
 */
export function weekToPlan(plans: WeeklyPlan[], today: LocalDate): { isoWeek: string; draft: WeeklyPlan | null } {
  const thisWeek = isoWeekOf(today);
  const isoWeek =
    plans.find((p) => p.isoWeek === thisWeek)?.status === 'CLOSED' ? nextIsoWeek(mondayOf(thisWeek)) : thisWeek;
  const plan = plans.find((p) => p.isoWeek === isoWeek);
  return { isoWeek, draft: plan?.status === 'DRAFT' ? plan : null };
}
