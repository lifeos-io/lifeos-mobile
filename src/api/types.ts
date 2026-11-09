/**
 * Response shapes of the Strategy service (`lifeos-strategy-service`, `<module>/dto/*Response.java`), as JSON:
 * UUIDs and instants are strings, `LocalDate` is "YYYY-MM-DD". Keep them in step with the backend records.
 */

export type Uuid = string;
/** "2026-11-09" */
export type LocalDate = string;
/** "2026-11-09T07:00:00Z" */
export type Instant = string;

// goal/dto/GoalResponse
export type GoalDomain = 'CAREER' | 'LEARNING' | 'FINANCE' | 'HEALTH' | 'OTHER';
export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'ACHIEVED' | 'ABANDONED';

export type Goal = {
  id: Uuid;
  title: string;
  domain: GoalDomain;
  whyItMatters: string;
  successDefinition: string;
  windowStart: LocalDate;
  windowEnd: LocalDate;
  status: GoalStatus;
  priority: number;
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
};

// strategyversion/dto/StrategyVersionResponse
export type EffortCategory = 'TECHNICAL' | 'DOMAIN' | 'OTHER';
export type PhaseStatus = 'UPCOMING' | 'ACTIVE' | 'DONE';
export type EffortAllocation = Record<EffortCategory, number>;

export type Phase = {
  phaseKey: Uuid;
  ordinal: number;
  title: string;
  startsOn: LocalDate;
  endsOn: LocalDate;
  /** Clauses separated by ";". */
  exitCriteria: string;
  status: PhaseStatus;
};

export type StrategyVersion = {
  id: Uuid;
  goalId: Uuid;
  versionNo: number;
  summary: string;
  changeReason: string | null;
  sourceProposalId: Uuid | null;
  current: boolean;
  createdAt: Instant;
  phases: Phase[];
  effortAllocation: EffortAllocation;
};

// strategyversion/dto/CreateStrategyVersionRequest
export type CreateStrategyVersion = {
  /** The current version's number, or null for the goal's first strategy (a mismatch is a 409). */
  expectedCurrentVersionNo: number | null;
  summary: string;
  /** Required when revising. */
  changeReason: string | null;
  /** A phase carried over from the current version keeps its key; a new one has none. */
  phases: (Omit<Phase, 'ordinal' | 'phaseKey'> & { phaseKey: Uuid | null })[];
  effortAllocation: EffortAllocation;
};

// knowledge/dto/CreateKnowledgeItemRequest
export type CreateKnowledgeItem = Pick<KnowledgeItem, 'statement' | 'kind' | 'status' | 'external' | 'source' | 'howToVerify'>;

// knowledge/dto/KnowledgeItemResponse
export type KnowledgeKind = 'FACT' | 'ASSUMPTION' | 'UNKNOWN';
export type KnowledgeStatus = 'UNVERIFIED' | 'PARTIAL' | 'VERIFIED' | 'FALSIFIED';

export type KnowledgeItem = {
  id: Uuid;
  goalId: Uuid;
  statement: string;
  kind: KnowledgeKind;
  status: KnowledgeStatus;
  external: boolean;
  source: string | null;
  howToVerify: string | null;
  verifiedAt: Instant | null;
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
};

// weeklyplan/dto/WeeklyPlanResponse
export type WeeklyPlanStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export type WeeklyPlan = {
  id: Uuid;
  /** "2026-W46" */
  isoWeek: string;
  weekStart: LocalDate;
  capacityMinutes: number;
  allocatedMinutes: number;
  headline: string | null;
  status: WeeklyPlanStatus;
  activatedAt: Instant | null;
  closedAt: Instant | null;
  version: number;
  allocations: { goalId: Uuid; strategyVersionId: Uuid | null; allocatedMinutes: number }[];
  createdAt: Instant;
  updatedAt: Instant;
};

// weeklyplan/dto/CreateWeeklyPlanRequest, UpdateWeeklyPlanRequest, AllocationRequest
export type Allocation = { goalId: Uuid; allocatedMinutes: number };

export type CreateWeeklyPlan = {
  isoWeek: string;
  /** Null takes the profile's default. */
  capacityMinutes: number | null;
  headline: string | null;
  allocations: Allocation[];
};

/** Only the fields present change; `allocations` replaces the whole split. */
export type UpdateWeeklyPlan = {
  version: number;
  capacityMinutes?: number;
  headline?: string;
  allocations?: Allocation[];
};

// action/dto/CreateActionRequest
export type CreateAction = {
  title: string;
  why: string | null;
  expectedEvidence: string | null;
  kind: ActionKind;
  estimateMinutes: number;
  goalIds: Uuid[];
  phaseKey: Uuid | null;
};

// action/dto/ActionResponse
export type ActionKind = 'DOMAIN' | 'TECHNICAL' | 'INFO_GATHERING' | 'EVIDENCE' | 'REST' | 'OTHER';
export type ActionStatus = 'PLANNED' | 'DONE' | 'DEFERRED' | 'DROPPED';

export type Action = {
  id: Uuid;
  weeklyPlanId: Uuid;
  goalIds: Uuid[];
  phaseKey: Uuid | null;
  title: string;
  why: string | null;
  expectedEvidence: string | null;
  kind: ActionKind;
  estimateMinutes: number;
  status: ActionStatus;
  deferredCount: number;
  sortOrder: number;
  completedAt: Instant | null;
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
};

// feedback/dto/FeedbackResponse
export type FeedbackSourceKind = 'MANAGER' | 'PEER' | 'CODE_REVIEW' | 'SELF' | 'OTHER';
export type Reliability = 'HIGH' | 'MEDIUM' | 'LOW';

export type Feedback = {
  id: Uuid;
  sourceKind: FeedbackSourceKind;
  sourceLabel: string | null;
  content: string;
  reliability: Reliability;
  receivedOn: LocalDate;
  createdAt: Instant;
};

// idea/dto/IdeaResponse
export type IdeaStatus = 'INBOX' | 'ACTIVE' | 'SHELVED' | 'DROPPED' | 'PROMOTED';
export type IdeaVerdict = 'PURSUE' | 'PARK' | 'DROP';

export type Idea = {
  id: Uuid;
  goalId: Uuid | null;
  title: string;
  note: string | null;
  status: IdeaStatus;
  evaluations: {
    goalFit: number;
    evidencePotential: number;
    energy: number;
    weeklyMinutes: number;
    verdict: IdeaVerdict;
    note: string | null;
    evaluatedAt: Instant;
  }[];
  activatedAt: Instant | null;
  closedAt: Instant | null;
  promotedGoalId: Uuid | null;
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
};

// evidence/dto/EvidenceResponse
export type EvidenceLevel = 'ACTIVITY' | 'OUTPUT' | 'OUTCOME' | 'IMPACT';
export type EvidenceStrength = 'SELF_REPORT' | 'PERSONAL_PROJECT' | 'WORK_OUTPUT' | 'EXTERNAL_FEEDBACK';

export type Evidence = {
  id: Uuid;
  title: string;
  level: EvidenceLevel;
  strength: EvidenceStrength;
  occurredOn: LocalDate;
  parentEvidenceId: Uuid | null;
  actionId: Uuid | null;
  feedbackId: Uuid | null;
  note: string | null;
  goalIds: Uuid[];
  phaseKeys: Uuid[];
  createdAt: Instant;
};

// weeklyreview/dto/WeeklyReviewPreviewResponse, WeeklyReviewResponse, CompleteWeeklyReviewRequest
export type ReviewActions = {
  planned: number;
  done: number;
  deferred: number;
  dropped: number;
  plannedMinutes: number;
  doneMinutes: number;
};

export type WeeklyReviewPreview = {
  isoWeek: string;
  weekStart: LocalDate;
  capacityMinutes: number;
  actions: ReviewActions;
  goals: { goalId: Uuid; allocatedMinutes: number; doneMinutes: number }[];
  evidenceCount: number;
};

export type CompleteWeeklyReview = {
  /** 1–5 */
  energy: number;
  wentWell: string | null;
  gotStuck: string | null;
  lesson: string | null;
  nextWeekFocus: string | null;
};

export type WeeklyReview = Omit<WeeklyReviewPreview, 'weekStart'> &
  CompleteWeeklyReview & {
    id: Uuid;
    weeklyPlanId: Uuid;
    completedAt: Instant;
  };

// decision/dto/DecisionResponse
export type DecisionStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'SUPERSEDED';

export type Decision = {
  id: Uuid;
  goalId: Uuid | null;
  title: string;
  context: string | null;
  status: DecisionStatus;
  alternatives: { label: string; description: string; chosen: boolean; rejectionReason: string | null }[];
  assumptionIds: Uuid[];
  reopenTriggers: {
    kind: 'DATE' | 'EVENT';
    description: string;
    eventType: string | null;
    firesOn: LocalDate | null;
    firedAt: Instant | null;
  }[];
  expectedOutcome: string | null;
  decidedAt: Instant | null;
  reviewOn: LocalDate | null;
  outcomeNote: string | null;
  wouldDecideAgain: WouldDecideAgain | null;
  closedAt: Instant | null;
  reopenedFromId: Uuid | null;
  reopenReason: string | null;
  reopenedAsId: Uuid | null;
  supersededAt: Instant | null;
  /** Assumptions found false since the decision (computed on read). */
  falsifiedAssumptionIds: Uuid[];
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
};

export type WouldDecideAgain = 'YES' | 'NO' | 'GOOD_CALL_BAD_LUCK';

// decision/dto/DecisionDraftRequest (POST creates a draft; PUT replaces a draft's content with `version`)
export type DecisionDraft = {
  goalId: Uuid | null;
  title: string;
  context: string | null;
  /** Labelled A, B, C… in this order by Strategy. */
  alternatives: { description: string; rejectionReason: string | null }[];
  assumptionIds: Uuid[];
  reopenTriggers: { kind: 'DATE'; description: string; eventType: null; firesOn: LocalDate }[];
};

// decision/dto/DecideRequest, CloseDecisionRequest
export type Decide = { version: number; chosenLabel: string; expectedOutcome: string; reviewOn: LocalDate };
export type CloseDecision = { version: number; outcomeNote: string; wouldDecideAgain: WouldDecideAgain };

/**
 * A failed call. `code` is the problem detail's error code (e.g. "STRATEGY_ACTIVE_IDEA_LIMIT", "NOT_FOUND"), or
 * one of the app's own: "UNAUTHENTICATED", "NETWORK", "ABORTED".
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

// proposal/dto/ChangeProposalResponse
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED';
export type ProposalSourceType = 'FEEDBACK' | 'EVIDENCE' | 'WEEKLY_REVIEW' | 'DECISION' | 'KNOWLEDGE_ITEM';

export type ChangeProposal = {
  id: Uuid;
  recommendationId: Uuid;
  kind: 'STRATEGY_REVISION';
  goalId: Uuid;
  basedOnVersionNo: number | null;
  rationale: string;
  sources: { type: ProposalSourceType; id: Uuid }[];
  revision: {
    summary: string;
    /** One change per line. */
    changeReason: string;
    phases: Omit<Phase, 'ordinal'>[];
    effortAllocation: EffortAllocation;
  };
  status: ProposalStatus;
  applicable: boolean;
  decisionNote: string | null;
  decidedAt: Instant | null;
  appliedStrategyVersionId: Uuid | null;
  createdAt: Instant;
};

// profile/dto/ProfileResponse
export type Profile = {
  userId: Uuid;
  displayName: string | null;
  timezone: string;
  locale: string;
  defaultWeeklyMinutes: number;
  onboardingCompleted: boolean;
  onboardingCompletedAt: Instant | null;
};

// goal/dto/CreateGoalRequest
export type CreateGoal = {
  title: string;
  domain: GoalDomain;
  whyItMatters: string | null;
  successDefinition: string | null;
  windowStart: LocalDate;
  windowEnd: LocalDate;
};

/*
 * Coach service (`lifeos-coach-service`, conversation/dto): conversations and their messages. Sending a message
 * answers with a server-sent event stream: `delta` {text} pieces, then `done` with the stored MessageResponse, or
 * `error` {code, detail}.
 */
export type Conversation = { id: Uuid; title: string; createdAt: Instant; updatedAt: Instant };

export type MessageRole = 'USER' | 'ASSISTANT';

export type Message = { id: Uuid; role: MessageRole; content: string; createdAt: Instant };
