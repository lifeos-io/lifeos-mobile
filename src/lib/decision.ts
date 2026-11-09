import type { Decision, DecisionDraft, WouldDecideAgain } from '@/api/types';
import type { PillTone } from '@/components';

export const decisionPills: Record<Decision['status'], { label: string; tone: PillTone }> = {
  DRAFT: { label: 'Taslak', tone: 'ghost' },
  OPEN: { label: 'Açık', tone: 'acid' },
  CLOSED: { label: 'Kapandı', tone: 'muted' },
  SUPERSEDED: { label: 'Yerine yenisi geldi', tone: 'muted' },
};

export const wouldDecideAgainLabels: Record<WouldDecideAgain, string> = {
  YES: 'Yine aynısını seçerdim',
  NO: 'Seçmezdim',
  GOOD_CALL_BAD_LUCK: 'Doğru karar, kötü şans',
};

/**
 * A decision's content as a draft request, to save it again with a change. The app writes DATE triggers only;
 * an EVENT trigger is not carried (Strategy's own triggers are not edited here).
 */
export function draftOf(decision: Decision): DecisionDraft {
  return {
    goalId: decision.goalId,
    title: decision.title,
    context: decision.context,
    alternatives: decision.alternatives.map((a) => ({ description: a.description, rejectionReason: a.rejectionReason })),
    assumptionIds: decision.assumptionIds,
    reopenTriggers: decision.reopenTriggers.flatMap((t) =>
      t.kind === 'DATE' && t.firesOn
        ? [{ kind: 'DATE' as const, description: t.description, eventType: null, firesOn: t.firesOn }]
        : [],
    ),
  };
}

/** Drafts first, then open decisions, then closed ones; a superseded decision is reached from its successor. */
export function decisionsInOrder(decisions: Decision[]): Decision[] {
  const order: Record<Decision['status'], number> = { DRAFT: 0, OPEN: 1, CLOSED: 2, SUPERSEDED: 3 };
  return decisions.filter((d) => d.status !== 'SUPERSEDED').sort((a, b) => order[a.status] - order[b.status]);
}
