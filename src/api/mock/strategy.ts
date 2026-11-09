import { today } from '@/lib/format';
import { mondayOf, plannedMinutes } from '@/lib/week';

import * as db from './db';
import { respond } from './respond';
import {
  ApiError,
  type Action,
  type ActionStatus,
  type ChangeProposal,
  type CompleteWeeklyReview,
  type CreateGoal,
  type CreateKnowledgeItem,
  type CreateStrategyVersion,
  type CreateAction,
  type CreateWeeklyPlan,
  type CloseDecision,
  type Decide,
  type DecisionDraft,
  type UpdateWeeklyPlan,
  type Decision,
  type Evidence,
  type Feedback,
  type Goal,
  type Idea,
  type KnowledgeItem,
  type LocalDate,
  type Profile,
  type ProposalStatus,
  type StrategyVersion,
  type Uuid,
  type WeeklyPlan,
  type WeeklyReview,
  type WeeklyReviewPreview,
} from '../types';

/*
 * The Strategy service's endpoints the app uses, answered from the mock data (EXPO_PUBLIC_DATA=mock). Each function
 * names its endpoint; `../live/strategy.ts` calls the same endpoints through the gateway with the same signatures.
 */

class NotFound extends Error {}

function find<T extends { id: Uuid }>(items: T[], id: Uuid, what: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) {
    throw new NotFound(`${what} not found.`);
  }
  return item;
}

function randomId(): Uuid {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return 'xxxxxxxx-xxxx-7xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, hex);
}

/** GET /api/strategy/me */
export function getProfile(): Promise<Profile> {
  return respond(db.profile);
}

/** PATCH /api/strategy/me {onboardingCompleted, …} */
export function updateProfile(changes: Partial<Pick<Profile, 'displayName' | 'onboardingCompleted'>>): Promise<Profile> {
  Object.assign(db.profile, changes);
  if (changes.onboardingCompleted && !db.profile.onboardingCompletedAt) {
    db.profile.onboardingCompletedAt = new Date().toISOString();
  }
  return respond(db.profile);
}

/** POST /api/strategy/goals → 201; a new goal goes last in the priority order. */
export function createGoal(request: CreateGoal): Promise<Goal> {
  const now = new Date().toISOString();
  const goal: Goal = {
    id: randomId(),
    ...request,
    whyItMatters: request.whyItMatters ?? '',
    successDefinition: request.successDefinition ?? '',
    status: 'ACTIVE',
    priority: db.goals.length + 1,
    version: 0,
    createdAt: now,
    updatedAt: now,
  };
  db.goals.push(goal);
  return respond(goal);
}

/** POST /api/strategy/goals/{goalId}/knowledge-items → 201 */
export function createKnowledgeItem(goalId: Uuid, item: CreateKnowledgeItem): Promise<KnowledgeItem> {
  const now = new Date().toISOString();
  const created: KnowledgeItem = {
    id: randomId(),
    goalId,
    ...item,
    verifiedAt: item.status === 'VERIFIED' ? now : null,
    version: 0,
    createdAt: now,
    updatedAt: now,
  };
  db.knowledgeItems.push(created);
  return respond(created);
}

/** GET /api/strategy/goals */
export function listGoals(): Promise<Goal[]> {
  return respond([...db.goals].sort((a, b) => a.priority - b.priority));
}

/** GET /api/strategy/goals/{goalId}/strategy-versions/current */
export function getCurrentStrategy(goalId: Uuid): Promise<StrategyVersion | null> {
  return respond(db.strategyVersions.find((v) => v.goalId === goalId && v.current) ?? null);
}

/**
 * POST /api/strategy/goals/{goalId}/strategy-versions → 201: the goal's next version becomes current. Checks what
 * Strategy checks (StrategyVersionServiceImpl.validate) with its error codes.
 */
export function createStrategyVersion(goalId: Uuid, request: CreateStrategyVersion): Promise<StrategyVersion> {
  const goal = find(db.goals, goalId, 'Goal');
  const versions = db.strategyVersions.filter((v) => v.goalId === goalId);
  const current = versions.find((v) => v.current);
  if ((current?.versionNo ?? null) !== request.expectedCurrentVersionNo) {
    return Promise.reject(new ApiError('CONCURRENT_MODIFICATION', 'The strategy was revised in the meantime.'));
  }
  const total = Object.values(request.effortAllocation).reduce((sum, n) => sum + n, 0);
  const carried = new Set(current?.phases.map((phase) => phase.phaseKey));
  const invalid =
    (current && !request.changeReason?.trim()) ||
    total !== 100 ||
    request.phases.filter((phase) => phase.status === 'ACTIVE').length > 1 ||
    request.phases.some(
      (phase) =>
        (phase.phaseKey && !carried.has(phase.phaseKey)) ||
        phase.endsOn < phase.startsOn ||
        phase.startsOn < goal.windowStart ||
        phase.endsOn > goal.windowEnd,
    );
  if (invalid) {
    return Promise.reject(new ApiError('VALIDATION_FAILED', 'Request validation failed'));
  }
  const created: StrategyVersion = {
    id: randomId(),
    goalId,
    versionNo: (current?.versionNo ?? 0) + 1,
    summary: request.summary.trim(),
    changeReason: request.changeReason?.trim() || 'İlk strateji.',
    sourceProposalId: null,
    current: true,
    createdAt: new Date().toISOString(),
    phases: request.phases.map((phase, i) => ({ ...phase, phaseKey: phase.phaseKey ?? randomId(), ordinal: i + 1 })),
    effortAllocation: request.effortAllocation,
  };
  versions.forEach((v) => (v.current = false));
  db.strategyVersions.push(created);
  return respond(created);
}

/** GET /api/strategy/goals/{goalId}/knowledge-items */
export function listKnowledgeItems(goalId: Uuid): Promise<KnowledgeItem[]> {
  return respond(db.knowledgeItems.filter((item) => item.goalId === goalId));
}

/** GET /api/strategy/weekly-plans */
export function listWeeklyPlans(): Promise<WeeklyPlan[]> {
  return respond([...db.weeklyPlans].sort((a, b) => b.isoWeek.localeCompare(a.isoWeek)));
}

/** GET /api/strategy/weekly-plans/{isoWeek}/actions */
export function listActions(isoWeek: string): Promise<Action[]> {
  const plan = db.weeklyPlans.find((p) => p.isoWeek === isoWeek);
  return respond(
    db.actions.filter((a) => a.weeklyPlanId === plan?.id).sort((a, b) => a.sortOrder - b.sortOrder),
  );
}

function capacityExceeded(plannedMinutes: number, capacity: number) {
  return new ApiError(
    'STRATEGY_CAPACITY_EXCEEDED',
    `The week's actions would take ${plannedMinutes} minutes but the week has only ${capacity}.`,
  );
}

/** POST /api/strategy/weekly-plans → 201: a DRAFT week; one plan per ISO week. */
export function createWeeklyPlan(request: CreateWeeklyPlan): Promise<WeeklyPlan> {
  if (db.weeklyPlans.some((p) => p.isoWeek === request.isoWeek)) {
    return Promise.reject(new ApiError('STRATEGY_PLAN_EXISTS', `There is already a plan for ${request.isoWeek}.`));
  }
  const capacity = request.capacityMinutes ?? db.profile.defaultWeeklyMinutes;
  const allocated = request.allocations.reduce((sum, a) => sum + a.allocatedMinutes, 0);
  if (allocated > capacity) {
    return Promise.reject(capacityExceeded(allocated, capacity));
  }
  const now = new Date().toISOString();
  const plan: WeeklyPlan = {
    id: randomId(),
    isoWeek: request.isoWeek,
    weekStart: mondayOf(request.isoWeek),
    capacityMinutes: capacity,
    allocatedMinutes: allocated,
    headline: request.headline,
    status: 'DRAFT',
    activatedAt: null,
    closedAt: null,
    version: 0,
    allocations: request.allocations.map((a) => ({ ...a, strategyVersionId: null })),
    createdAt: now,
    updatedAt: now,
  };
  db.weeklyPlans.push(plan);
  return respond(plan);
}

/** PATCH /api/strategy/weekly-plans/{isoWeek}: draft and active weeks; the steps must still fit. */
export function updateWeeklyPlan(isoWeek: string, request: UpdateWeeklyPlan): Promise<WeeklyPlan> {
  const plan = weekOf(isoWeek);
  if (plan.version !== request.version) {
    return Promise.reject(new ApiError('CONCURRENT_MODIFICATION', 'The plan was changed in the meantime.'));
  }
  if (plan.status === 'CLOSED') {
    return Promise.reject(new ApiError('STRATEGY_PLAN_STATUS', `Week is ${plan.status}.`));
  }
  const capacity = request.capacityMinutes ?? plan.capacityMinutes;
  const allocations = request.allocations ?? plan.allocations;
  const allocated = allocations.reduce((sum, a) => sum + a.allocatedMinutes, 0);
  const planned = plannedMinutes(db.actions.filter((a) => a.weeklyPlanId === plan.id));
  if (allocated > capacity || planned > capacity) {
    return Promise.reject(capacityExceeded(Math.max(allocated, planned), capacity));
  }
  Object.assign(plan, {
    capacityMinutes: capacity,
    headline: request.headline ?? plan.headline,
    allocations: allocations.map((a) => ({ strategyVersionId: null, ...a })),
    allocatedMinutes: allocated,
    version: plan.version + 1,
    updatedAt: new Date().toISOString(),
  });
  return respond(plan);
}

/** POST /api/strategy/weekly-plans/{isoWeek}/activate: one active week at a time. */
export function activateWeeklyPlan(isoWeek: string): Promise<WeeklyPlan> {
  const plan = weekOf(isoWeek);
  const active = db.weeklyPlans.find((p) => p.status === 'ACTIVE' && p.id !== plan.id);
  if (active) {
    return Promise.reject(
      new ApiError('STRATEGY_PLAN_ALREADY_ACTIVE', `The plan for ${active.isoWeek} is still active.`),
    );
  }
  if (plan.status !== 'DRAFT') {
    return Promise.reject(new ApiError('STRATEGY_PLAN_STATUS', `Week is ${plan.status}.`));
  }
  const now = new Date().toISOString();
  Object.assign(plan, { status: 'ACTIVE', activatedAt: now, version: plan.version + 1, updatedAt: now });
  return respond(plan);
}

/** POST /api/strategy/weekly-plans/{isoWeek}/actions → 201: draft or active week, within the capacity. */
export function createAction(isoWeek: string, request: CreateAction): Promise<Action> {
  const plan = weekOf(isoWeek);
  if (plan.status === 'CLOSED') {
    return Promise.reject(new ApiError('STRATEGY_PLAN_STATUS', `Week is ${plan.status}.`));
  }
  const weekActions = db.actions.filter((a) => a.weeklyPlanId === plan.id);
  const planned = plannedMinutes(weekActions) + request.estimateMinutes;
  if (planned > plan.capacityMinutes) {
    return Promise.reject(capacityExceeded(planned, plan.capacityMinutes));
  }
  const now = new Date().toISOString();
  const action: Action = {
    id: randomId(),
    weeklyPlanId: plan.id,
    ...request,
    status: 'PLANNED',
    deferredCount: 0,
    sortOrder: Math.max(0, ...weekActions.map((a) => a.sortOrder)) + 1,
    completedAt: null,
    version: 0,
    createdAt: now,
    updatedAt: now,
  };
  db.actions.push(action);
  return respond(action);
}

/** DELETE /api/strategy/weekly-plans/{isoWeek}/actions/{actionId} → 204: only a draft week's steps. */
export function deleteAction(isoWeek: string, actionId: Uuid): Promise<void> {
  const plan = weekOf(isoWeek);
  if (plan.status !== 'DRAFT') {
    return Promise.reject(new ApiError('STRATEGY_PLAN_STATUS', `Week is ${plan.status}.`));
  }
  db.actions.splice(db.actions.indexOf(find(db.actions, actionId, 'Action')), 1);
  return respond(undefined);
}

/** PUT /api/strategy/weekly-plans/{isoWeek}/actions/{actionId}/status {version, status}: only in the active week. */
export function changeActionStatus(
  isoWeek: string,
  actionId: Uuid,
  version: number,
  status: ActionStatus,
): Promise<Action> {
  const action = find(db.actions, actionId, 'Action');
  if (action.version !== version) {
    return Promise.reject(new ApiError('CONCURRENT_MODIFICATION', 'The action was changed in the meantime.'));
  }
  if (weekOf(isoWeek).status !== 'ACTIVE') {
    return Promise.reject(new ApiError('STRATEGY_PLAN_STATUS', 'Actions change status only in the active week.'));
  }
  if (status === 'DEFERRED' && action.status !== 'DEFERRED') {
    action.deferredCount += 1;
  }
  action.status = status;
  action.completedAt = status === 'DONE' ? new Date().toISOString() : null;
  action.version += 1;
  action.updatedAt = new Date().toISOString();
  return respond(action);
}

/** GET /api/strategy/feedback/{feedbackId} */
export function getFeedback(feedbackId: Uuid): Promise<Feedback> {
  return respond(find(db.feedback, feedbackId, 'Feedback'));
}

/** GET /api/strategy/evidence?goalId= */
export function listEvidence(goalId?: Uuid): Promise<Evidence[]> {
  return respond(db.evidence.filter((e) => !goalId || e.goalIds.includes(goalId)));
}

/** GET /api/strategy/ideas */
export function listIdeas(): Promise<Idea[]> {
  return respond(db.ideas);
}

/** GET /api/strategy/ideas/{ideaId} */
export function getIdea(ideaId: Uuid): Promise<Idea> {
  return respond(find(db.ideas, ideaId, 'Idea'));
}

/** POST /api/strategy/ideas {title, note, goalId} → 201 */
export function captureIdea(title: string, note: string | null, goalId: Uuid | null): Promise<Idea> {
  const now = new Date().toISOString();
  const idea: Idea = {
    id: randomId(),
    goalId,
    title,
    note,
    status: 'INBOX',
    evaluations: [],
    activatedAt: null,
    closedAt: null,
    promotedGoalId: null,
    version: 0,
    createdAt: now,
    updatedAt: now,
  };
  db.ideas.unshift(idea);
  return respond(idea);
}

export type IdeaTransition = 'activate' | 'shelve' | 'reopen' | 'drop';

const transitions: Record<IdeaTransition, { from: Idea['status'][]; to: Idea['status'] }> = {
  activate: { from: ['INBOX', 'SHELVED'], to: 'ACTIVE' },
  shelve: { from: ['INBOX', 'ACTIVE'], to: 'SHELVED' },
  reopen: { from: ['SHELVED'], to: 'INBOX' },
  drop: { from: ['INBOX', 'ACTIVE', 'SHELVED'], to: 'DROPPED' },
};

/** POST /api/strategy/ideas/{ideaId}/activate|shelve|reopen|drop, with Strategy's rules and 409 codes. */
export function changeIdea(ideaId: Uuid, transition: IdeaTransition): Promise<Idea> {
  const idea = find(db.ideas, ideaId, 'Idea');
  const { from, to } = transitions[transition];
  if (!from.includes(idea.status)) {
    return Promise.reject(new ApiError('STRATEGY_IDEA_STATUS', `Idea is ${idea.status}.`));
  }
  if (transition === 'activate') {
    if (idea.evaluations.at(-1)?.verdict !== 'PURSUE') {
      return Promise.reject(new ApiError('STRATEGY_IDEA_NOT_PURSUED', 'Latest verdict is not PURSUE.'));
    }
    if (db.ideas.filter((other) => other.status === 'ACTIVE').length >= 2) {
      return Promise.reject(new ApiError('STRATEGY_ACTIVE_IDEA_LIMIT', 'At most 2 active ideas.'));
    }
  }
  const now = new Date().toISOString();
  Object.assign(idea, {
    status: to,
    activatedAt: transition === 'activate' ? now : idea.activatedAt,
    closedAt: to === 'DROPPED' ? now : null,
    version: idea.version + 1,
    updatedAt: now,
  });
  return respond(idea);
}

function weekOf(isoWeek: string): WeeklyPlan {
  const plan = db.weeklyPlans.find((p) => p.isoWeek === isoWeek);
  if (!plan) {
    throw new NotFound('Weekly plan not found.');
  }
  return plan;
}

/** The numbers Strategy counts for a week (WeeklyReviewServiceImpl.tally / goalOutcomes / evidenceCount). */
function tally(plan: WeeklyPlan) {
  const weekActions = db.actions.filter((a) => a.weeklyPlanId === plan.id);
  const count = (status: Action['status']) => weekActions.filter((a) => a.status === status).length;
  const doneMinutes = (list: Action[]) =>
    list.filter((a) => a.status === 'DONE').reduce((sum, a) => sum + a.estimateMinutes, 0);
  const weekEnd = addDays(plan.weekStart, 6);
  return {
    capacityMinutes: plan.capacityMinutes,
    actions: {
      planned: count('PLANNED'),
      done: count('DONE'),
      deferred: count('DEFERRED'),
      dropped: count('DROPPED'),
      plannedMinutes: weekActions.filter((a) => a.status !== 'DROPPED').reduce((sum, a) => sum + a.estimateMinutes, 0),
      doneMinutes: doneMinutes(weekActions),
    },
    goals: plan.allocations.map((allocation) => ({
      goalId: allocation.goalId,
      allocatedMinutes: allocation.allocatedMinutes,
      doneMinutes: doneMinutes(weekActions.filter((a) => a.goalIds.includes(allocation.goalId))),
    })),
    evidenceCount: db.evidence.filter((e) => e.occurredOn >= plan.weekStart && e.occurredOn <= weekEnd).length,
  };
}

function addDays(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** GET /api/strategy/weekly-plans/{isoWeek}/review/preview: live numbers, nothing stored. */
export function getReviewPreview(isoWeek: string): Promise<WeeklyReviewPreview> {
  const plan = weekOf(isoWeek);
  return respond({ isoWeek, weekStart: plan.weekStart, ...tally(plan) });
}

/** POST /api/strategy/weekly-plans/{isoWeek}/review → 201; writing it closes the week. Only the ACTIVE week. */
export function completeReview(isoWeek: string, request: CompleteWeeklyReview): Promise<WeeklyReview> {
  const plan = weekOf(isoWeek);
  if (plan.status !== 'ACTIVE') {
    return Promise.reject(new ApiError('STRATEGY_PLAN_STATUS', `Week is ${plan.status}.`));
  }
  const now = new Date().toISOString();
  const review: WeeklyReview = {
    id: randomId(),
    weeklyPlanId: plan.id,
    isoWeek,
    ...tally(plan),
    ...request,
    completedAt: now,
  };
  db.weeklyReviews.push(review);
  Object.assign(plan, { status: 'CLOSED', closedAt: now, version: plan.version + 1, updatedAt: now });
  return respond(review);
}

/** GET /api/strategy/decisions */
export function listDecisions(): Promise<Decision[]> {
  return respond(db.decisions);
}

const labels = 'ABCDEF';

function decisionOf(id: Uuid): Decision {
  return find(db.decisions, id, 'Decision');
}

function requireDecision(decision: Decision, status: Decision['status'], version?: number): ApiError | null {
  if (version !== undefined && decision.version !== version) {
    return new ApiError('CONCURRENT_MODIFICATION', 'The decision was changed in the meantime.');
  }
  if (decision.status !== status) {
    return new ApiError('STRATEGY_DECISION_STATUS', `Decision is ${decision.status}.`);
  }
  return null;
}

function draftContent(draft: DecisionDraft) {
  return {
    goalId: draft.goalId,
    title: draft.title.trim(),
    context: draft.context?.trim() || null,
    alternatives: draft.alternatives.map((a, i) => ({
      label: labels[i],
      description: a.description.trim(),
      chosen: false,
      rejectionReason: a.rejectionReason?.trim() || null,
    })),
    assumptionIds: draft.assumptionIds,
    reopenTriggers: draft.reopenTriggers.map((t) => ({ ...t, firedAt: null })),
  };
}

/** POST /api/strategy/decisions → 201: a DRAFT. */
export function createDecision(draft: DecisionDraft): Promise<Decision> {
  const now = new Date().toISOString();
  const decision: Decision = {
    id: randomId(),
    ...draftContent(draft),
    status: 'DRAFT',
    expectedOutcome: null,
    decidedAt: null,
    reviewOn: null,
    outcomeNote: null,
    wouldDecideAgain: null,
    closedAt: null,
    reopenedFromId: null,
    reopenReason: null,
    reopenedAsId: null,
    supersededAt: null,
    falsifiedAssumptionIds: [],
    version: 0,
    createdAt: now,
    updatedAt: now,
  };
  db.decisions.unshift(decision);
  return respond(decision);
}

/** PUT /api/strategy/decisions/{decisionId}: replaces a draft's content. */
export function updateDecision(decisionId: Uuid, draft: DecisionDraft & { version: number }): Promise<Decision> {
  const decision = decisionOf(decisionId);
  const error = requireDecision(decision, 'DRAFT', draft.version);
  if (error) return Promise.reject(error);
  Object.assign(decision, draftContent(draft), {
    version: decision.version + 1,
    updatedAt: new Date().toISOString(),
  });
  return respond(decision);
}

/**
 * POST /api/strategy/decisions/{decisionId}/decide: at least two options, a reason for each one not chosen, a
 * review date ahead. Deciding a reopened draft supersedes its OPEN original.
 */
export function decideDecision(decisionId: Uuid, request: Decide): Promise<Decision> {
  const decision = decisionOf(decisionId);
  const error = requireDecision(decision, 'DRAFT', request.version);
  if (error) return Promise.reject(error);
  const known = decision.alternatives.some((a) => a.label === request.chosenLabel);
  const unexplained = decision.alternatives.some(
    (a) => a.label !== request.chosenLabel && !a.rejectionReason?.trim(),
  );
  if (decision.alternatives.length < 2 || !known || unexplained || request.reviewOn <= today()) {
    return Promise.reject(new ApiError('VALIDATION_FAILED', 'Request validation failed'));
  }
  const now = new Date().toISOString();
  Object.assign(decision, {
    status: 'OPEN',
    alternatives: decision.alternatives.map((a) => ({ ...a, chosen: a.label === request.chosenLabel })),
    expectedOutcome: request.expectedOutcome.trim(),
    reviewOn: request.reviewOn,
    decidedAt: now,
    version: decision.version + 1,
    updatedAt: now,
  });
  const original = decision.reopenedFromId ? db.decisions.find((d) => d.id === decision.reopenedFromId) : null;
  if (original?.status === 'OPEN') {
    Object.assign(original, { status: 'SUPERSEDED', supersededAt: now, version: original.version + 1 });
  }
  return respond(decision);
}

/** POST /api/strategy/decisions/{decisionId}/close: an OPEN decision, with what came of it. */
export function closeDecision(decisionId: Uuid, request: CloseDecision): Promise<Decision> {
  const decision = decisionOf(decisionId);
  const error = requireDecision(decision, 'OPEN', request.version);
  if (error) return Promise.reject(error);
  const now = new Date().toISOString();
  Object.assign(decision, {
    status: 'CLOSED',
    outcomeNote: request.outcomeNote.trim(),
    wouldDecideAgain: request.wouldDecideAgain,
    closedAt: now,
    version: decision.version + 1,
    updatedAt: now,
  });
  return respond(decision);
}

/** POST /api/strategy/decisions/{decisionId}/reopen → 201: a new draft from an OPEN or CLOSED decision, once. */
export function reopenDecision(decisionId: Uuid, reason: string): Promise<Decision> {
  const original = decisionOf(decisionId);
  if (original.reopenedAsId) {
    return Promise.reject(new ApiError('STRATEGY_DECISION_ALREADY_REOPENED', 'Already reopened.'));
  }
  if (original.status !== 'OPEN' && original.status !== 'CLOSED') {
    return Promise.reject(new ApiError('STRATEGY_DECISION_STATUS', `Decision is ${original.status}.`));
  }
  const now = new Date().toISOString();
  const draft: Decision = {
    ...structuredClone(original),
    id: randomId(),
    status: 'DRAFT',
    alternatives: original.alternatives.map((a) => ({ ...a, chosen: false })),
    reopenTriggers: original.reopenTriggers.map((t) => ({ ...t, firedAt: null })),
    expectedOutcome: null,
    decidedAt: null,
    reviewOn: null,
    outcomeNote: null,
    wouldDecideAgain: null,
    closedAt: null,
    reopenedFromId: original.id,
    reopenReason: reason.trim(),
    reopenedAsId: null,
    supersededAt: null,
    version: 0,
    createdAt: now,
    updatedAt: now,
  };
  original.reopenedAsId = draft.id;
  db.decisions.unshift(draft);
  return respond(draft);
}

/** GET /api/strategy/decisions/{decisionId} */
export function getDecision(decisionId: Uuid): Promise<Decision> {
  return respond(find(db.decisions, decisionId, 'Decision'));
}

/** GET /api/strategy/proposals?status= */
export function listProposals(status?: ProposalStatus): Promise<ChangeProposal[]> {
  return respond(db.proposals.filter((p) => !status || p.status === status));
}

/** GET /api/strategy/proposals/{proposalId} */
export function getProposal(proposalId: Uuid): Promise<ChangeProposal> {
  return respond(find(db.proposals, proposalId, 'Proposal'));
}

/** POST /api/strategy/proposals/{proposalId}/accept: the revision becomes the goal's new strategy version. */
export function acceptProposal(proposalId: Uuid): Promise<ChangeProposal> {
  const proposal = find(db.proposals, proposalId, 'Proposal');
  const versions = db.strategyVersions.filter((v) => v.goalId === proposal.goalId);
  const next: StrategyVersion = {
    id: randomId(),
    goalId: proposal.goalId,
    versionNo: Math.max(0, ...versions.map((v) => v.versionNo)) + 1,
    summary: proposal.revision.summary,
    changeReason: proposal.revision.changeReason,
    sourceProposalId: proposal.id,
    current: true,
    createdAt: new Date().toISOString(),
    phases: proposal.revision.phases.map((phase, i) => ({ ...phase, ordinal: i + 1 })),
    effortAllocation: proposal.revision.effortAllocation,
  };
  versions.forEach((v) => (v.current = false));
  db.strategyVersions.push(next);
  Object.assign(proposal, {
    status: 'ACCEPTED',
    applicable: false,
    decidedAt: new Date().toISOString(),
    appliedStrategyVersionId: next.id,
  });
  return respond(proposal);
}

/** POST /api/strategy/proposals/{proposalId}/reject {note} */
export function rejectProposal(proposalId: Uuid, note?: string): Promise<ChangeProposal> {
  const proposal = find(db.proposals, proposalId, 'Proposal');
  Object.assign(proposal, {
    status: 'REJECTED',
    applicable: false,
    decisionNote: note ?? null,
    decidedAt: new Date().toISOString(),
  });
  return respond(proposal);
}
