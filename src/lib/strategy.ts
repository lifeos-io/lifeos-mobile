import type {
  Action,
  EffortAllocation,
  EffortCategory,
  Evidence,
  Idea,
  KnowledgeStatus,
  Phase,
  StrategyVersion,
} from '@/api/types';
import type { PillTone } from '@/components';

import { clauses, effortLabels } from './format';

/**
 * How many of a phase's exit clauses have telemetry: the phase's evidence at outcome level or above, one per
 * clause at most.
 */
export function exitTelemetry(phase: Phase, evidence: Evidence[]): { met: number; needed: number } {
  const needed = clauses(phase.exitCriteria).length;
  const outcomes = evidence.filter(
    (e) => e.phaseKeys.includes(phase.phaseKey) && (e.level === 'OUTCOME' || e.level === 'IMPACT'),
  );
  return { met: Math.min(needed, outcomes.length), needed };
}

/** The phase being worked on, if any. */
export function activePhase(version: StrategyVersion | null | undefined): Phase | undefined {
  return version?.phases.find((phase) => phase.status === 'ACTIVE');
}

/**
 * The step to do next: the first open information-gathering step (a decision or an assumption waits on its
 * answer), else the first open step.
 */
export function focusAction(actions: Action[]): Action | undefined {
  const open = actions.filter((action) => action.status === 'PLANNED');
  return open.find((action) => action.kind === 'INFO_GATHERING') ?? open[0];
}

const ideaOrder: Partial<Record<Idea['status'], number>> = { ACTIVE: 0, INBOX: 1, SHELVED: 2 };

/** Ideas still in orbit (not dropped or promoted). */
export function inOrbit(ideas: Idea[]): Idea[] {
  return ideas
    .filter((idea) => ideaOrder[idea.status] !== undefined)
    .sort((a, b) => ideaOrder[a.status]! - ideaOrder[b.status]! || pursued(b) - pursued(a));
}

function pursued(idea: Idea): number {
  return idea.evaluations.at(-1)?.verdict === 'PURSUE' ? 1 : 0;
}

/** Where an idea stands, in a word: "aktif", "keşif" (pursue proposed), "park"; nothing while unevaluated. */
export function ideaStance(idea: Idea): 'aktif' | 'keşif' | 'park' | undefined {
  if (idea.status === 'ACTIVE') return 'aktif';
  if (idea.status === 'SHELVED') return 'park';
  return idea.evaluations.at(-1)?.verdict === 'PURSUE' ? 'keşif' : undefined;
}

/** Ideas in orbit as orbit labels: "AI Engineering · keşif". */
export function ideasInOrbit(ideas: Idea[]): { key: string; label: string }[] {
  return inOrbit(ideas).map((idea) => ({
    key: idea.id,
    label: [shortTitle(idea.title), ideaStance(idea)].filter(Boolean).join(' · '),
  }));
}

function shortTitle(title: string): string {
  const words = title.split(' ');
  return words.length <= 2 ? title : words.slice(0, 2).join(' ');
}

/** The category whose share a revision raises the most: "Domain ağırlığı artsın mı?". */
export function effortQuestion(from: EffortAllocation, to: EffortAllocation): string | undefined {
  const categories = Object.keys(to) as EffortCategory[];
  const [biggest] = categories
    .map((category) => ({ category, delta: to[category] - (from[category] ?? 0) }))
    .sort((a, b) => b.delta - a.delta);
  return biggest && biggest.delta > 0 ? `${effortLabels[biggest.category]} ağırlığı artsın mı?` : undefined;
}

/** Exit-criteria clauses a revision adds, per phase: "Aşama 1 kriterine: …". */
export function addedCriteria(
  current: Phase[],
  revised: Pick<Phase, 'phaseKey' | 'exitCriteria'>[],
): string[] {
  return revised.flatMap((phase) => {
    const before = current.find((candidate) => candidate.phaseKey === phase.phaseKey);
    if (!before) return [];
    const known = new Set(clauses(before.exitCriteria));
    return clauses(phase.exitCriteria)
      .filter((clause) => !known.has(clause))
      .map((clause) => `Aşama ${before.ordinal} kriterine: ${clause}`);
  });
}

/** Whether a revision keeps every phase's title and dates. */
export function samePhases(current: Phase[], revised: Pick<Phase, 'phaseKey' | 'title' | 'startsOn' | 'endsOn'>[]) {
  return (
    current.length === revised.length &&
    revised.every((phase) => {
      const before = current.find((candidate) => candidate.phaseKey === phase.phaseKey);
      return (
        before && before.title === phase.title && before.startsOn === phase.startsOn && before.endsOn === phase.endsOn
      );
    })
  );
}

export function sameEffort(a: EffortAllocation, b: EffortAllocation): boolean {
  return (Object.keys(a) as EffortCategory[]).every((category) => a[category] === b[category]);
}

/** A knowledge item's status as a pill: "DOĞRULANMADI", "KISMEN"… */
export const knowledgePills: Record<KnowledgeStatus, { label: string; tone: PillTone }> = {
  UNVERIFIED: { label: 'Doğrulanmadı', tone: 'signal' },
  PARTIAL: { label: 'Kısmen', tone: 'acid' },
  VERIFIED: { label: 'Doğrulandı', tone: 'acid' },
  FALSIFIED: { label: 'Yanlışlandı', tone: 'signal' },
};
