import type {
  Action,
  ChangeProposal,
  Evidence,
  Feedback,
  Goal,
  Idea,
  KnowledgeItem,
  StrategyVersion,
  WeeklyPlan,
} from '../types';

/**
 * The mock backend's data: one user in week 2026-W46, eight days into phase 1 of the goal "Kadrolu pozisyon"
 * (the scenario of the Figma file). Mutations in `src/api/*.ts` change these arrays in memory; a reload resets them.
 */

const GOAL = '019a6b10-0000-7000-8000-000000000001';
const V2 = '019a6b10-0000-7000-8000-000000000102';
const PLAN = '019a6b10-0000-7000-8000-000000000201';
export const PHASE_KEYS = {
  adaptation: '019a6b10-0000-7000-8000-000000000301',
  independence: '019a6b10-0000-7000-8000-000000000302',
  impact: '019a6b10-0000-7000-8000-000000000303',
  opportunity: '019a6b10-0000-7000-8000-000000000304',
};
const FEEDBACK_DOMAIN = '019a6b10-0000-7000-8000-000000000401';

const created = '2026-11-01T08:00:00Z';

export const goals: Goal[] = [
  {
    id: GOAL,
    title: 'Kadrolu pozisyon',
    domain: 'CAREER',
    whyItMatters: "Outsource'tan in-house yazılım geliştiriciliğe geçmek",
    successDefinition: 'Ekipte kadrolu yazılım geliştirici olarak imzalanmış bir teklif',
    windowStart: '2027-05-01',
    windowEnd: '2027-11-30',
    status: 'ACTIVE',
    priority: 1,
    version: 3,
    createdAt: created,
    updatedAt: '2026-11-01T09:00:00Z',
  },
];

const phasesV2 = [
  {
    phaseKey: PHASE_KEYS.adaptation,
    ordinal: 1,
    title: 'Adaptasyon',
    startsOn: '2026-11-01',
    endsOn: '2026-12-15',
    exitCriteria: 'Kredi API akışını yardımsız açıklamak; ilk 2 görevi büyük revizyonsuz kapatmak',
    status: 'ACTIVE' as const,
  },
  {
    phaseKey: PHASE_KEYS.independence,
    ordinal: 2,
    title: 'Bağımsız üretkenlik',
    startsOn: '2026-12-16',
    endsOn: '2027-02-15',
    exitCriteria: 'Orta boy bir görevi destek almadan bitirmek; 1 yazılı yönetici geri bildirimi',
    status: 'UPCOMING' as const,
  },
  {
    phaseKey: PHASE_KEYS.impact,
    ordinal: 3,
    title: 'Görünür etki',
    startsOn: '2027-02-16',
    endsOn: '2027-05-15',
    exitCriteria: 'Ekibin gerçekten kullandığı, sahiplendiğin bir iyileştirme',
    status: 'UPCOMING' as const,
  },
  {
    phaseKey: PHASE_KEYS.opportunity,
    ordinal: 4,
    title: 'Fırsat değerlendirme',
    startsOn: '2027-05-16',
    endsOn: '2027-11-30',
    exitCriteria: 'Geçiş kanalı netleşmiş; değerlendirmeye hazırlığı ya da dış alternatif listesi',
    status: 'UPCOMING' as const,
  },
];

export const strategyVersions: StrategyVersion[] = [
  {
    id: V2,
    goalId: GOAL,
    versionNo: 2,
    summary: 'Önce ekipte güvenilirlik, sonra görünür etki; geçişi 2027 içinde masaya getirmek.',
    changeReason: 'İlk hafta: aşamalar işe başlama tarihine göre kaydırıldı.',
    sourceProposalId: null,
    current: true,
    createdAt: '2026-11-01T09:00:00Z',
    phases: phasesV2,
    effortAllocation: { TECHNICAL: 70, DOMAIN: 20, OTHER: 10 },
  },
];

export const knowledgeItems: KnowledgeItem[] = [
  ['Kadro açma politikası ve zamanlama', 'İK ile tanışma toplantısında sor'],
  ['Sözleşmede geçişi kısıtlayan madde var mı?', 'Sözleşmenin ilgili maddesini oku'],
  ['Yöneticinin "iyi performans" tanımı', 'Salı 1:1’inde sor'],
].map(([statement, howToVerify], i) => ({
  id: `019a6b10-0000-7000-8000-00000000050${i + 1}`,
  goalId: GOAL,
  statement,
  kind: 'UNKNOWN' as const,
  status: 'UNVERIFIED' as const,
  external: true,
  source: null,
  howToVerify,
  verifiedAt: null,
  version: 0,
  createdAt: created,
  updatedAt: created,
}));

export const weeklyPlans: WeeklyPlan[] = [
  {
    id: PLAN,
    isoWeek: '2026-W46',
    weekStart: '2026-11-09',
    capacityMinutes: 240,
    allocatedMinutes: 230,
    headline: 'İşine odaklan, beklentiyi netleştir, dinlen.',
    status: 'ACTIVE',
    activatedAt: '2026-11-09T06:30:00Z',
    closedAt: null,
    version: 1,
    allocations: [{ goalId: GOAL, strategyVersionId: V2, allocatedMinutes: 230 }],
    createdAt: '2026-11-08T18:00:00Z',
    updatedAt: '2026-11-09T06:30:00Z',
  },
];

export const actions: Action[] = [
  {
    title: 'Kredi akışını çiz, doğrulat',
    why: 'telemetri üretir',
    expectedEvidence: 'Ekibin onayladığı akış diyagramı',
    kind: 'EVIDENCE' as const,
    estimateMinutes: 180,
  },
  {
    title: 'Yöneticine beklentiyi sor',
    why: 'bir manevra bu veriyi bekliyor',
    expectedEvidence: 'Yöneticinin "iyi performans" tanımı, kendi cümleleriyle',
    kind: 'INFO_GATHERING' as const,
    estimateMinutes: 30,
  },
  {
    title: 'PR öğrenimini telemetriye yaz',
    why: 'ilk dış sinyal',
    expectedEvidence: 'Bir PR yorumundan çıkan ders',
    kind: 'EVIDENCE' as const,
    estimateMinutes: 20,
  },
].map((action, i) => ({
  ...action,
  id: `019a6b10-0000-7000-8000-00000000060${i + 1}`,
  weeklyPlanId: PLAN,
  goalIds: [GOAL],
  phaseKey: PHASE_KEYS.adaptation,
  status: 'PLANNED' as const,
  deferredCount: 0,
  sortOrder: i,
  completedAt: null,
  version: 0,
  createdAt: '2026-11-08T18:00:00Z',
  updatedAt: '2026-11-08T18:00:00Z',
}));

export const feedback: Feedback[] = [
  {
    id: FEEDBACK_DOMAIN,
    sourceKind: 'MANAGER',
    sourceLabel: 'Yönetici',
    content: 'Teknik olarak iyisin ama domain bilgini güçlendirmelisin.',
    reliability: 'HIGH',
    receivedOn: '2026-11-08',
    createdAt: '2026-11-08T15:00:00Z',
  },
];

export const ideas: Idea[] = [
  { title: 'AI Engineering', note: 'Kaynak: direktörün sözlü yorumu', status: 'ACTIVE' as const },
  { title: 'Yük testi AI triage pilotu', note: 'Aşama 3 ile uyumlu · ihtiyaç doğrulanmadı', status: 'INBOX' as const },
  { title: 'Kubernetes', note: 'İş ihtiyacı doğrulanmadı', status: 'SHELVED' as const },
  { title: 'Kafka Streams', note: 'Hedefe bağı zayıf', status: 'SHELVED' as const },
].map((idea, i) => ({
  ...idea,
  id: `019a6b10-0000-7000-8000-00000000070${i + 1}`,
  goalId: GOAL,
  evaluations: [],
  activatedAt: idea.status === 'ACTIVE' ? '2026-11-08T10:00:00Z' : null,
  closedAt: null,
  promotedGoalId: null,
  version: 1,
  createdAt: '2026-10-25T10:00:00Z',
  updatedAt: '2026-11-08T10:00:00Z',
}));

export const evidence: Evidence[] = [];

export const proposals: ChangeProposal[] = [
  {
    id: '019a6b10-0000-7000-8000-000000000801',
    recommendationId: '019a6b10-0000-7000-8000-000000000901',
    kind: 'STRATEGY_REVISION',
    goalId: GOAL,
    basedOnVersionNo: 2,
    rationale: 'Belirsiz: "domain" kapsamı. Ekibin kendi tanımıyla netleşmeli.',
    sources: [{ type: 'FEEDBACK', id: FEEDBACK_DOMAIN }],
    revision: {
      summary: 'Hedef aynı; haftalık yakıtın daha büyük kısmı domain bilgisine.',
      changeReason: [
        'Her hafta 20 dk domain sözlüğü, ekibin kendi tanımıyla',
        '6 Aralık: yöneticiye "ilerleme görüyor musun?"',
      ].join('\n'),
      phases: phasesV2.map(({ ordinal: _ordinal, ...phase }) =>
        phase.phaseKey === PHASE_KEYS.adaptation
          ? { ...phase, exitCriteria: `${phase.exitCriteria}; kredi durumlarını iş diliyle anlatabilmek` }
          : phase,
      ),
      effortAllocation: { TECHNICAL: 35, DOMAIN: 50, OTHER: 15 },
    },
    status: 'PENDING',
    applicable: true,
    decisionNote: null,
    decidedAt: null,
    appliedStrategyVersionId: null,
    createdAt: '2026-11-08T16:00:00Z',
  },
];
