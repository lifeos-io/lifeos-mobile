import type {
  Action,
  ChangeProposal,
  Decision,
  Evidence,
  Feedback,
  Goal,
  Idea,
  KnowledgeItem,
  StrategyVersion,
  WeeklyPlan,
  WeeklyReview,
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

type IdeaSeed = Pick<Idea, 'title' | 'note' | 'status'> & {
  createdAt: string;
  evaluation?: Omit<Idea['evaluations'][number], 'evaluatedAt'>;
};

const ideaSeeds: IdeaSeed[] = [
  {
    title: 'AI Engineering',
    note: 'Direktörün sözlü yorumu; somut gereksinim değil (henüz).',
    status: 'INBOX',
    createdAt: '2026-11-06T17:00:00Z',
    evaluation: {
      goalFit: 3,
      evidencePotential: 3,
      energy: 2,
      weeklyMinutes: 120,
      verdict: 'PURSUE',
      note: 'Rotaya alınmaz. Tek bir soruya cevap aranır: ekipte AI hangi somut problem için konuşuluyor, sahibi kim? Sonra yer kontrolünde yeniden bakılır.',
    },
  },
  {
    title: 'Yük testi AI triage pilotu',
    note: 'Aşama 3 ile uyumlu · ihtiyaç doğrulanmadı',
    status: 'INBOX',
    createdAt: '2026-11-07T20:00:00Z',
  },
  {
    title: 'Kubernetes',
    note: 'İş ihtiyacı doğrulanmadı · 29 Kas',
    status: 'SHELVED',
    createdAt: '2026-10-22T19:00:00Z',
    evaluation: {
      goalFit: 2,
      evidencePotential: 2,
      energy: 4,
      weeklyMinutes: 180,
      verdict: 'PARK',
      note: 'Ekibin işi şu an K8s gerektirmiyor; 29 Kasım değerlendirmesine kadar park.',
    },
  },
  {
    title: 'Kafka Streams',
    note: 'Hedefe bağı zayıf',
    status: 'SHELVED',
    createdAt: '2026-10-28T21:00:00Z',
    evaluation: {
      goalFit: 1,
      evidencePotential: 2,
      energy: 3,
      weeklyMinutes: 120,
      verdict: 'PARK',
      note: 'Hedefe bağı zayıf; yer kontrolünde yeniden bakılmaz.',
    },
  },
];

export const ideas: Idea[] = ideaSeeds.map(({ evaluation, ...idea }, i) => ({
  ...idea,
  id: `019a6b10-0000-7000-8000-00000000070${i + 1}`,
  goalId: GOAL,
  evaluations: evaluation ? [{ ...evaluation, evaluatedAt: '2026-11-08T10:00:00Z' }] : [],
  activatedAt: null,
  closedAt: null,
  promotedGoalId: null,
  version: evaluation ? 2 : 0,
  updatedAt: '2026-11-08T10:00:00Z',
}));

export const ASSUMPTIONS = {
  noK8sNeed: '019a6b10-0000-7000-8000-000000000511',
  oauthDaily: '019a6b10-0000-7000-8000-000000000512',
  directorRemark: '019a6b10-0000-7000-8000-000000000513',
};

knowledgeItems.push(
  ...(
    [
      [ASSUMPTIONS.noK8sNeed, 'Ekibin işi şu an K8s gerektirmiyor', 'UNVERIFIED'],
      [ASSUMPTIONS.oauthDaily, 'OAuth 2.0 günlük işte kullanılıyor', 'PARTIAL'],
      [ASSUMPTIONS.directorRemark, 'Direktörün yorumu somut gereksinim değil', 'UNVERIFIED'],
    ] as const
  ).map(([id, statement, status]) => ({
    id,
    goalId: GOAL,
    statement,
    kind: 'ASSUMPTION' as const,
    status,
    external: false,
    source: null,
    howToVerify: null,
    verifiedAt: null,
    version: status === 'PARTIAL' ? 1 : 0,
    createdAt: '2026-11-08T09:00:00Z',
    updatedAt: '2026-11-08T09:00:00Z',
  })),
);

export const decisions: Decision[] = [
  {
    id: '019a6b10-0000-7000-8000-000000000a01',
    goalId: GOAL,
    title: "Kubernetes'i park et, OAuth 2.0'a odaklan",
    context: 'Direktör AI’ın önemli olduğunu söyledi; K8s’e ayrılan akşamlar aşama 1’in kanıtına katkı vermiyor.',
    status: 'OPEN',
    alternatives: [
      { label: 'A', description: "K8s'e devam", chosen: false, rejectionReason: 'Elendi · ihtiyaç doğrulanmadı' },
      { label: 'B', description: "Tamamen AI'a geç", chosen: false, rejectionReason: 'Elendi · sinyal somut değil' },
      { label: 'C', description: 'OAuth 2.0 / ÖHVPS', chosen: true, rejectionReason: null },
      { label: 'D', description: 'AI keşfi · 2 sa', chosen: false, rejectionReason: "C'ye eklendi" },
    ],
    assumptionIds: [ASSUMPTIONS.noK8sNeed, ASSUMPTIONS.oauthDaily, ASSUMPTIONS.directorRemark],
    reopenTriggers: [
      { kind: 'DATE', description: 'İlk kontrol', eventType: null, firesOn: '2026-11-15', firedAt: null },
      { kind: 'DATE', description: 'İkinci kontrol', eventType: null, firesOn: '2026-11-22', firedAt: null },
    ],
    expectedOutcome:
      "29 Kasım'a kadar rıza akışını kendi kodumuzda bulup açıklayabilmek ve bir PR'da güvenlikle ilgili gerekçeli yorum yapmak.",
    decidedAt: '2026-11-08T11:00:00Z',
    reviewOn: '2026-11-29',
    outcomeNote: null,
    wouldDecideAgain: null,
    closedAt: null,
    reopenedFromId: null,
    reopenReason: null,
    reopenedAsId: null,
    supersededAt: null,
    falsifiedAssumptionIds: [],
    version: 1,
    createdAt: '2026-11-08T10:30:00Z',
    updatedAt: '2026-11-08T11:00:00Z',
  },
];

export const evidence: Evidence[] = [
  {
    id: '019a6b10-0000-7000-8000-000000000b01',
    title: 'Rıza akışı okuması · 3 sa',
    level: 'ACTIVITY',
    strength: 'SELF_REPORT',
    occurredOn: '2026-11-05',
    parentEvidenceId: null,
    actionId: null,
    feedbackId: null,
    note: 'Ekibin OAuth rıza akışını uçtan uca okudum.',
    goalIds: [GOAL],
    phaseKeys: [PHASE_KEYS.adaptation],
    createdAt: '2026-11-05T20:00:00Z',
  },
  {
    id: '019a6b10-0000-7000-8000-000000000b02',
    title: 'Alışveriş kredisi akış diyagramı',
    level: 'OUTPUT',
    strength: 'WORK_OUTPUT',
    occurredOn: '2026-11-09',
    parentEvidenceId: '019a6b10-0000-7000-8000-000000000b01',
    actionId: null,
    feedbackId: null,
    note: null,
    goalIds: [GOAL],
    phaseKeys: [PHASE_KEYS.adaptation],
    createdAt: '2026-11-09T09:00:00Z',
  },
];

export const weeklyReviews: WeeklyReview[] = [];

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
