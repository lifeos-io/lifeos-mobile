import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as strategy from './strategy';
import type { Action, ActionStatus, Uuid } from './types';

/** Query keys, one per endpoint. */
export const keys = {
  goals: ['goals'] as const,
  currentStrategy: (goalId: Uuid) => ['goals', goalId, 'strategy', 'current'] as const,
  knowledge: (goalId: Uuid) => ['goals', goalId, 'knowledge'] as const,
  weeklyPlans: ['weekly-plans'] as const,
  actions: (isoWeek: string) => ['weekly-plans', isoWeek, 'actions'] as const,
  feedback: (id: Uuid) => ['feedback', id] as const,
  evidence: (goalId: Uuid) => ['evidence', goalId] as const,
  ideas: ['ideas'] as const,
  idea: (id: Uuid) => ['ideas', id] as const,
  decisions: ['decisions'] as const,
  decision: (id: Uuid) => ['decisions', id] as const,
  proposals: ['proposals'] as const,
  proposal: (id: Uuid) => ['proposals', id] as const,
};

/** The goal the screens are about: the active one with the highest priority. */
export function useMainGoal() {
  return useQuery({
    queryKey: keys.goals,
    queryFn: strategy.listGoals,
    select: (goals) => goals.find((goal) => goal.status === 'ACTIVE') ?? null,
  });
}

export function useCurrentStrategy(goalId: Uuid | undefined) {
  return useQuery({
    queryKey: keys.currentStrategy(goalId ?? ''),
    queryFn: () => strategy.getCurrentStrategy(goalId!),
    enabled: !!goalId,
  });
}

export function useKnowledgeItems(goalId: Uuid | undefined) {
  return useQuery({
    queryKey: keys.knowledge(goalId ?? ''),
    queryFn: () => strategy.listKnowledgeItems(goalId!),
    enabled: !!goalId,
  });
}

/** The week being worked on: the active plan, if there is one. */
export function useActiveWeek() {
  return useQuery({
    queryKey: keys.weeklyPlans,
    queryFn: strategy.listWeeklyPlans,
    select: (plans) => plans.find((plan) => plan.status === 'ACTIVE') ?? null,
  });
}

export function useActions(isoWeek: string | undefined) {
  return useQuery({
    queryKey: keys.actions(isoWeek ?? ''),
    queryFn: () => strategy.listActions(isoWeek!),
    enabled: !!isoWeek,
  });
}

export function useChangeActionStatus(isoWeek: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, status }: { action: Action; status: ActionStatus }) =>
      strategy.changeActionStatus(isoWeek, action.id, action.version, status),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.actions(isoWeek) }),
  });
}

export function useFeedback(id: Uuid | undefined) {
  return useQuery({
    queryKey: keys.feedback(id ?? ''),
    queryFn: () => strategy.getFeedback(id!),
    enabled: !!id,
  });
}

export function useEvidence(goalId: Uuid | undefined) {
  return useQuery({
    queryKey: keys.evidence(goalId ?? ''),
    queryFn: () => strategy.listEvidence(goalId),
    enabled: !!goalId,
  });
}

export function useIdeas() {
  return useQuery({ queryKey: keys.ideas, queryFn: strategy.listIdeas });
}

export function useIdea(id: Uuid) {
  return useQuery({ queryKey: keys.idea(id), queryFn: () => strategy.getIdea(id) });
}

export function useCaptureIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, note, goalId }: { title: string; note: string | null; goalId: Uuid | null }) =>
      strategy.captureIdea(title, note, goalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.ideas }),
  });
}

export function useChangeIdea(id: Uuid) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transition: strategy.IdeaTransition) => strategy.changeIdea(id, transition),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.ideas }),
  });
}

/** Knowledge items by ID, for a decision's assumptions. */
export function useKnowledgeById(goalId: Uuid | null | undefined) {
  return useQuery({
    queryKey: keys.knowledge(goalId ?? ''),
    queryFn: () => strategy.listKnowledgeItems(goalId!),
    enabled: !!goalId,
    select: (items) => new Map(items.map((item) => [item.id, item])),
  });
}

export function useDecisions() {
  return useQuery({ queryKey: keys.decisions, queryFn: strategy.listDecisions });
}

export function useDecision(id: Uuid) {
  return useQuery({ queryKey: keys.decision(id), queryFn: () => strategy.getDecision(id) });
}

export function usePendingProposals() {
  return useQuery({
    queryKey: keys.proposals,
    queryFn: () => strategy.listProposals(),
    select: (proposals) => proposals.filter((p) => p.status === 'PENDING' && p.applicable),
  });
}

export function useProposal(id: Uuid) {
  return useQuery({ queryKey: keys.proposal(id), queryFn: () => strategy.getProposal(id) });
}

export function useDecideProposal(id: Uuid) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (decision: { accept: true } | { accept: false; note?: string }) =>
      decision.accept ? strategy.acceptProposal(id) : strategy.rejectProposal(id, decision.note),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.proposals }),
        queryClient.invalidateQueries({ queryKey: keys.goals }),
      ]),
  });
}
