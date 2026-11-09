import type { IdeaTransition } from '../mock/strategy';
import type {
  Action,
  ActionStatus,
  ChangeProposal,
  CompleteWeeklyReview,
  CreateGoal,
  CreateKnowledgeItem,
  CreateStrategyVersion,
  CreateAction,
  CreateWeeklyPlan,
  UpdateWeeklyPlan,
  Decision,
  Evidence,
  Feedback,
  Goal,
  Idea,
  KnowledgeItem,
  Profile,
  ProposalStatus,
  StrategyVersion,
  Uuid,
  WeeklyPlan,
  WeeklyReview,
  WeeklyReviewPreview,
} from '../types';

import { q, request } from './http';

/** The Strategy service through the gateway (`/api/strategy/**`); same signatures as `../mock/strategy.ts`. */

const S = '/api/strategy';

export function getProfile(): Promise<Profile> {
  return request('GET', `${S}/me`);
}

export function updateProfile(changes: Partial<Pick<Profile, 'displayName' | 'onboardingCompleted'>>): Promise<Profile> {
  return request('PATCH', `${S}/me`, { body: changes });
}

export function createGoal(goal: CreateGoal): Promise<Goal> {
  return request('POST', `${S}/goals`, { body: goal });
}

export function createKnowledgeItem(goalId: Uuid, item: CreateKnowledgeItem): Promise<KnowledgeItem> {
  return request('POST', `${S}/goals/${q(goalId)}/knowledge-items`, { body: item });
}

export function createStrategyVersion(goalId: Uuid, version: CreateStrategyVersion): Promise<StrategyVersion> {
  return request('POST', `${S}/goals/${q(goalId)}/strategy-versions`, { body: version });
}

export function listGoals(): Promise<Goal[]> {
  return request('GET', `${S}/goals`);
}

export function getCurrentStrategy(goalId: Uuid): Promise<StrategyVersion | null> {
  return request('GET', `${S}/goals/${q(goalId)}/strategy-versions/current`, { nullIf404: true });
}

export function listKnowledgeItems(goalId: Uuid): Promise<KnowledgeItem[]> {
  return request('GET', `${S}/goals/${q(goalId)}/knowledge-items`);
}

export function listWeeklyPlans(): Promise<WeeklyPlan[]> {
  return request('GET', `${S}/weekly-plans`);
}

export function listActions(isoWeek: string): Promise<Action[]> {
  return request('GET', `${S}/weekly-plans/${q(isoWeek)}/actions`);
}

export function createWeeklyPlan(plan: CreateWeeklyPlan): Promise<WeeklyPlan> {
  return request('POST', `${S}/weekly-plans`, { body: plan });
}

export function updateWeeklyPlan(isoWeek: string, changes: UpdateWeeklyPlan): Promise<WeeklyPlan> {
  return request('PATCH', `${S}/weekly-plans/${q(isoWeek)}`, { body: changes });
}

export function activateWeeklyPlan(isoWeek: string): Promise<WeeklyPlan> {
  return request('POST', `${S}/weekly-plans/${q(isoWeek)}/activate`);
}

export function createAction(isoWeek: string, action: CreateAction): Promise<Action> {
  return request('POST', `${S}/weekly-plans/${q(isoWeek)}/actions`, { body: action });
}

export function deleteAction(isoWeek: string, actionId: Uuid): Promise<void> {
  return request('DELETE', `${S}/weekly-plans/${q(isoWeek)}/actions/${q(actionId)}`);
}

export function changeActionStatus(isoWeek: string, actionId: Uuid, version: number, status: ActionStatus): Promise<Action> {
  return request('PUT', `${S}/weekly-plans/${q(isoWeek)}/actions/${q(actionId)}/status`, { body: { version, status } });
}

export function getFeedback(feedbackId: Uuid): Promise<Feedback> {
  return request('GET', `${S}/feedback/${q(feedbackId)}`);
}

export function listEvidence(goalId?: Uuid): Promise<Evidence[]> {
  return request('GET', `${S}/evidence${goalId ? `?goalId=${q(goalId)}` : ''}`);
}

export function listIdeas(): Promise<Idea[]> {
  return request('GET', `${S}/ideas`);
}

export function getIdea(ideaId: Uuid): Promise<Idea> {
  return request('GET', `${S}/ideas/${q(ideaId)}`);
}

export function captureIdea(title: string, note: string | null, goalId: Uuid | null): Promise<Idea> {
  return request('POST', `${S}/ideas`, { body: { title, note, goalId } });
}

export function changeIdea(ideaId: Uuid, transition: IdeaTransition): Promise<Idea> {
  return request('POST', `${S}/ideas/${q(ideaId)}/${transition}`);
}

export function getReviewPreview(isoWeek: string): Promise<WeeklyReviewPreview> {
  return request('GET', `${S}/weekly-plans/${q(isoWeek)}/review/preview`);
}

export function completeReview(isoWeek: string, review: CompleteWeeklyReview): Promise<WeeklyReview> {
  return request('POST', `${S}/weekly-plans/${q(isoWeek)}/review`, { body: review });
}

export function listDecisions(): Promise<Decision[]> {
  return request('GET', `${S}/decisions`);
}

export function getDecision(decisionId: Uuid): Promise<Decision> {
  return request('GET', `${S}/decisions/${q(decisionId)}`);
}

export function listProposals(status?: ProposalStatus): Promise<ChangeProposal[]> {
  return request('GET', `${S}/proposals${status ? `?status=${status}` : ''}`);
}

export function getProposal(proposalId: Uuid): Promise<ChangeProposal> {
  return request('GET', `${S}/proposals/${q(proposalId)}`);
}

export function acceptProposal(proposalId: Uuid): Promise<ChangeProposal> {
  return request('POST', `${S}/proposals/${q(proposalId)}/accept`);
}

export function rejectProposal(proposalId: Uuid, note?: string): Promise<ChangeProposal> {
  return request('POST', `${S}/proposals/${q(proposalId)}/reject`, { body: { note: note ?? null } });
}
