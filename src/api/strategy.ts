import * as db from './mock/db';
import { respond } from './mock/respond';
import {
  ApiError,
  type Action,
  type ActionStatus,
  type ChangeProposal,
  type Decision,
  type Evidence,
  type Feedback,
  type Goal,
  type Idea,
  type KnowledgeItem,
  type ProposalStatus,
  type StrategyVersion,
  type Uuid,
  type WeeklyPlan,
} from './types';

/*
 * The Strategy service's endpoints the app uses, answered from the mock data. Each function names its endpoint;
 * connecting the app swaps the body for a request through the gateway and keeps the signature.
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

/** GET /api/strategy/goals */
export function listGoals(): Promise<Goal[]> {
  return respond([...db.goals].sort((a, b) => a.priority - b.priority));
}

/** GET /api/strategy/goals/{goalId}/strategy-versions/current */
export function getCurrentStrategy(goalId: Uuid): Promise<StrategyVersion | null> {
  return respond(db.strategyVersions.find((v) => v.goalId === goalId && v.current) ?? null);
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

/** PUT /api/strategy/weekly-plans/{isoWeek}/actions/{actionId}/status {version, status} */
export function changeActionStatus(
  _isoWeek: string,
  actionId: Uuid,
  version: number,
  status: ActionStatus,
): Promise<Action> {
  const action = find(db.actions, actionId, 'Action');
  if (action.version !== version) {
    return Promise.reject(new Error('CONCURRENT_MODIFICATION'));
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

/** GET /api/strategy/decisions */
export function listDecisions(): Promise<Decision[]> {
  return respond(db.decisions);
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
