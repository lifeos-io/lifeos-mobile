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
