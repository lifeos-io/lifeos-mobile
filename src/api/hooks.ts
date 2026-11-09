import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { coach } from './coach';
import { strategy, type IdeaTransition } from './strategy';
import type { Action, ActionStatus, CompleteWeeklyReview, CreateGoal, Uuid } from './types';

/** Query keys, one per endpoint. */
export const keys = {
  profile: ['me'] as const,
  conversations: ['conversations'] as const,
  messages: (conversationId: Uuid) => ['conversations', conversationId, 'messages'] as const,
  goals: ['goals'] as const,
  currentStrategy: (goalId: Uuid) => ['goals', goalId, 'strategy', 'current'] as const,
  knowledge: (goalId: Uuid) => ['goals', goalId, 'knowledge'] as const,
  weeklyPlans: ['weekly-plans'] as const,
  actions: (isoWeek: string) => ['weekly-plans', isoWeek, 'actions'] as const,
  feedback: (id: Uuid) => ['feedback', id] as const,
  evidence: (goalId: Uuid) => ['evidence', goalId] as const,
  ideas: ['ideas'] as const,
  idea: (id: Uuid) => ['ideas', id] as const,
  reviewPreview: (isoWeek: string) => ['weekly-plans', isoWeek, 'review', 'preview'] as const,
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
    mutationFn: (transition: IdeaTransition) => strategy.changeIdea(id, transition),
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

export function useReviewPreview(isoWeek: string | undefined) {
  return useQuery({
    queryKey: keys.reviewPreview(isoWeek ?? ''),
    queryFn: () => strategy.getReviewPreview(isoWeek!),
    enabled: !!isoWeek,
  });
}

/** Completing the review closes the week: everything about weeks is refetched. */
export function useCompleteReview(isoWeek: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CompleteWeeklyReview) => strategy.completeReview(isoWeek, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.weeklyPlans }),
  });
}

export function useProfile() {
  return useQuery({ queryKey: keys.profile, queryFn: strategy.getProfile });
}

/**
 * Onboarding's "Görevi başlat": the goal, its constraints as known facts of the goal (so Coach sees them), then
 * the profile marked onboarded.
 */
export function useStartMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goal, constraints }: { goal: CreateGoal; constraints: string[] }) => {
      const created = await strategy.createGoal(goal);
      for (const statement of constraints) {
        await strategy.createKnowledgeItem(created.id, {
          statement,
          kind: 'FACT',
          status: 'VERIFIED',
          external: false,
          source: 'Kısıt',
        });
      }
      await strategy.updateProfile({ onboardingCompleted: true });
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

/** The conversation Kule shows: the most recently active one, started when there is none. */
export function useCurrentConversation() {
  return useQuery({
    queryKey: keys.conversations,
    queryFn: async () => (await coach.listConversations())[0] ?? (await coach.startConversation()),
  });
}

export function useMessages(conversationId: Uuid | undefined) {
  return useQuery({
    queryKey: keys.messages(conversationId ?? ''),
    queryFn: () => coach.listMessages(conversationId!),
    enabled: !!conversationId,
  });
}

/**
 * Sending to Kule: the user's message shows at once, the answer grows as its pieces arrive, and the stored
 * messages replace both when it is done. `stop` abandons the answer (nothing is stored for it).
 */
export function useChat(conversationId: Uuid | undefined) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<{ question: string; answer: string } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const send = useCallback(
    async (content: string) => {
      if (!conversationId || abort.current) return;
      const controller = new AbortController();
      abort.current = controller;
      setError(null);
      setPending({ question: content, answer: '' });
      try {
        await coach.sendMessage(conversationId, content, {
          signal: controller.signal,
          onDelta: (text) => setPending((current) => current && { ...current, answer: current.answer + text }),
        });
      } catch (e) {
        setError(e);
      } finally {
        abort.current = null;
        await queryClient.invalidateQueries({ queryKey: keys.messages(conversationId) });
        setPending(null);
      }
    },
    [conversationId, queryClient],
  );

  const stop = useCallback(() => abort.current?.abort(), []);

  return { send, stop, pending, error, streaming: pending !== null };
}

