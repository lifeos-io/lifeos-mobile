import type { Action, Evidence, Idea, WeeklyPlan, WeeklyReviewPreview } from '@/api/types';
import type { ColorToken } from '@/theme';

import { inWeek } from './evidence';

/** "2026-W46" → 46 */
export function weekNumber(isoWeek: string): number {
  return Number(isoWeek.split('-W')[1]);
}

/** The ISO week after `weekStart` (a Monday): "2026-W47". */
export function nextIsoWeek(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 7));
  // ISO week: the Thursday of the week decides the year.
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Energy as the design asks it (Düşük / Orta / Yüksek) on Strategy's 1–5 scale. */
export const energyChoices = [
  { label: 'Düşük', value: 2 },
  { label: 'Orta', value: 3 },
  { label: 'Yüksek', value: 4 },
] as const;

export type Finding = { tone: ColorToken; title: string; detail: string };

/**
 * Kule's findings for the week, at most three. Coach does not produce review findings yet, so the app derives
 * them from the week's numbers with simple rules; when Coach does, this is replaced by its answer.
 */
export function findings(
  plan: WeeklyPlan,
  preview: WeeklyReviewPreview,
  actions: Action[],
  evidence: Evidence[],
  ideas: Idea[],
): Finding[] {
  const result: Finding[] = [];
  const deferred = actions.filter((a) => a.status === 'DEFERRED');
  const week = evidence.filter((e) => inWeek(e.occurredOn, plan.weekStart));
  const outcomes = week.filter((e) => e.level === 'OUTCOME' || e.level === 'IMPACT').length;
  const newIdeas = ideas.filter((i) => inWeek(i.createdAt.slice(0, 10), plan.weekStart));
  const openSteps = preview.actions.planned;

  for (const action of deferred.slice(0, 1)) {
    result.push({
      tone: 'signal',
      title: `${action.title} ertelendi.`,
      detail:
        action.kind === 'INFO_GATHERING'
          ? 'Bir manevra bu bilgiyi bekliyor; en yüksek kaldıraç bu.'
          : 'Haftaya ilk adım olarak taşı ya da bırak.',
    });
  }
  if (outcomes === 0) {
    result.push({
      tone: 'nebula',
      title: 'Bu hafta sonuç düzeyinde telemetri yok.',
      detail: week.length
        ? `${week.length} kayıt var; birini başkasının kullandığı bir sonuca bağla.`
        : 'Bitirdiğin bir adımın ortaya çıkardığını telemetriye yaz.',
    });
  }
  if (openSteps > 0) {
    result.push({
      tone: 'nebula',
      title: `${openSteps} adım hâlâ açık.`,
      detail: 'Haftayı kapatınca açık adımlar bu haftada kalır; gerekirse yeni rotaya yeniden yaz.',
    });
  }
  if (newIdeas.length > 0) {
    result.push({
      tone: 'acid',
      title: `${newIdeas.length} yeni uydu yörüngede kaldı.`,
      detail: 'Rota bozulmadı — sistem çalışıyor.',
    });
  }
  if (result.length === 0) {
    result.push({ tone: 'acid', title: 'Hafta planlandığı gibi geçti.', detail: 'Aynı ritimle devam.' });
  }
  return result.slice(0, 3);
}
