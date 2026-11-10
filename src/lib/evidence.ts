import type {
  Evidence,
  EvidenceLevel,
  EvidenceStrength,
  FeedbackSourceKind,
  LocalDate,
  Phase,
  Reliability,
} from '@/api/types';

export const levels: EvidenceLevel[] = ['ACTIVITY', 'OUTPUT', 'OUTCOME', 'IMPACT'];

export const levelLabels: Record<EvidenceLevel, string> = {
  ACTIVITY: 'Aktivite',
  OUTPUT: 'Çıktı',
  OUTCOME: 'Sonuç',
  IMPACT: 'Etki',
};

/** What a level still missing from a chain would look like. */
export const levelHints: Record<EvidenceLevel, string> = {
  ACTIVITY: 'Zaman verdiğin iş',
  OUTPUT: 'Ortaya çıkan somut şey',
  OUTCOME: 'Başkası kullandı ya da doğruladı',
  IMPACT: 'Aşamanın çıkış kanıtına katkı',
};

/** Strength from weakest to strongest (Strategy's EvidenceStrength). */
export const strengths: EvidenceStrength[] = ['SELF_REPORT', 'PERSONAL_PROJECT', 'WORK_OUTPUT', 'EXTERNAL_FEEDBACK'];

export const strengthLabels: Record<EvidenceStrength, string> = {
  SELF_REPORT: 'Beyan',
  PERSONAL_PROJECT: 'Kişisel proje',
  WORK_OUTPUT: 'İş çıktısı',
  EXTERNAL_FEEDBACK: 'Dış geri bildirim',
};

/** Whether evidence at `level` can build on a parent at `parent`: only on a lower step (Strategy's canBuildOn). */
export function canBuildOn(level: EvidenceLevel, parent: EvidenceLevel): boolean {
  return levels.indexOf(parent) < levels.indexOf(level);
}

export const sourceKindLabels: Record<FeedbackSourceKind, string> = {
  MANAGER: 'Yönetici',
  PEER: 'Ekip arkadaşı',
  CODE_REVIEW: 'Kod incelemesi',
  SELF: 'Kendim',
  OTHER: 'Diğer',
};

export const reliabilityLabels: Record<Reliability, string> = {
  HIGH: 'Yüksek',
  MEDIUM: 'Orta',
  LOW: 'Düşük',
};

/** One step of a chain: the evidence at that level, or nothing yet. */
export type ChainStep = { level: EvidenceLevel; evidence?: Evidence };

/**
 * The latest signal chain: the most recent evidence without a parent, followed through its children
 * (activity → output → outcome → impact). Levels the chain has not reached are left empty.
 */
export function latestChain(evidence: Evidence[]): ChainStep[] | undefined {
  const byRecency = [...evidence].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
  const root = byRecency.find((e) => !e.parentEvidenceId);
  if (!root) return undefined;
  const chain = new Map<EvidenceLevel, Evidence>([[root.level, root]]);
  let current: Evidence | undefined = root;
  while (current) {
    const parentId: string = current.id;
    current = byRecency.find((e) => e.parentEvidenceId === parentId);
    if (current && !chain.has(current.level)) chain.set(current.level, current);
  }
  const start = levels.indexOf(root.level);
  return levels.slice(start).map((level) => ({ level, evidence: chain.get(level) }));
}

/** The strongest evidence recorded for a phase, as 0 (none) to 4. */
export function phaseStrength(phase: Phase, evidence: Evidence[]): number {
  return evidence
    .filter((e) => e.phaseKeys.includes(phase.phaseKey))
    .reduce((best, e) => Math.max(best, strengths.indexOf(e.strength) + 1), 0);
}

/** Whether a date falls in the week starting on `weekStart` (Monday). */
export function inWeek(date: LocalDate, weekStart: LocalDate): boolean {
  const [y, m, d] = weekStart.split('-').map(Number);
  const end = new Date(Date.UTC(y, m - 1, d + 6)).toISOString().slice(0, 10);
  return date >= weekStart && date <= end;
}
