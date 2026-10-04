// Site-wide constants and the canonical order of phases, tools, situations and printables.
// Content files must exist for every slug in every locale; src/lib/content.ts enforces it.
export const SITE_URL = 'https://xn--3ys368f86s.com';
export const SISTER_SITE = 'https://showtellshare.org';

export const PHASES = ['0-12-months', '1-3-years', '3-5-years', '5-7-years', '7-10-years', '10-12-years'] as const;
export type Phase = (typeof PHASES)[number];

export const TOOLS = [
  'connection-time',
  'clear-expectations',
  'specific-praise',
  'planned-ignoring',
  'redirection',
  'choices',
  'when-then',
  'natural-consequences',
  'logical-consequences',
  'time-in',
  'time-out',
  'privilege-removal',
  'problem-solving',
  'routines',
  'family-meetings',
  'repair',
] as const;
export type Tool = (typeof TOOLS)[number];

export const SITUATIONS = [
  'tantrums',
  'public-meltdowns',
  'hitting-biting',
  'sibling-fighting',
  'bedtime',
  'mealtime',
  'screens',
  'lying',
  'defiance',
  'ignores-me',
  'whining',
  'homework',
  'grandparents',
] as const;
export type Situation = (typeof SITUATIONS)[number];

/** Edge cases on the best-proven approach page, in display order (anchor ids). */
export const EDGE_CASES = [
  'refuses-time-out',
  'aggression',
  'public-places',
  'siblings',
  'caregivers-disagree',
  'grandparents',
  'dangerous-behavior',
  'developmental-differences',
  'preteens',
  'not-working',
] as const;

/** Kinds of study recorded for each source in content/sources.yml. */
export const STUDY_TYPES = [
  'meta-analysis',
  'systematic-review',
  'rct',
  'experiment',
  'longitudinal',
  'cross-sectional',
  'pilot',
  'review',
  'position-statement',
  'book',
] as const;
export type StudyType = (typeof STUDY_TYPES)[number];

export const EVIDENCE_LEVELS = ['strong', 'moderate', 'emerging', 'contested'] as const;
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

/** Printable pages, in the order the Printables hub lists them. */
export const PRINTABLES = [
  'age-finder',
  'summary-0-12-months',
  'summary-1-3-years',
  'summary-3-5-years',
  'summary-5-7-years',
  'summary-7-10-years',
  'summary-10-12-years',
  'learning-0-12-months',
  'learning-1-3-years',
  'learning-3-5-years',
  'learning-5-7-years',
  'learning-7-10-years',
  'learning-10-12-years',
  'routine-chart',
  'calm-down-plan',
  'family-rules',
] as const;
export type Printable = (typeof PRINTABLES)[number];
