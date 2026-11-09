/**
 * Color tokens of the "Yörünge" design (Figma: Life OS — Yörünge (mobil) › 00 Temeller › Renk değişkenleri).
 * The app is dark only.
 */
export const colors = {
  /** Screen background ("uzay"). */
  space: '#080812',
  /** Card background ("kabin"). */
  cabin: '#17172A',
  /** Raised element on a card: chips, bubbles, the back button ("kabin-2"). */
  cabinRaised: '#20203A',
  /** Hairlines and ghost borders ("çizgi"). */
  line: '#2A2A44',

  /** Primary: the current step, the main action, done ("asit"). */
  acid: '#C6F432',
  /** Text on acid ("asit-mürekkep"). */
  acidInk: '#10140A',
  /** Secondary: Kule / AI, proposals, plans ("nebula"). */
  nebula: '#9B8CFF',
  /** Fill behind nebula-bordered notes ("nebula-mürekkep"). */
  nebulaInk: '#120C33',
  /** Warning: unknowns, unverified, overrun ("sinyal"). */
  signal: '#FF6FAE',
  /** Fill behind signal-bordered notes ("sinyal-mürekkep"). */
  signalInk: '#2E0718',

  /** Main text ("ay"). */
  moon: '#F4F3FF',
  /** Secondary text ("ay-orta"). */
  moonMid: '#9E97C8',
  /** Tertiary text, inactive tabs ("ay-soluk"). */
  moonFaint: '#5A58BC',
} as const;

export type ColorToken = keyof typeof colors;
