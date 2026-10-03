// Content collections. One source tree per locale: src/content/<locale>/<collection>/<slug>.mdx
// Entry ids are "<locale>/<slug>".
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { EVIDENCE_LEVELS, PHASES, SITUATIONS, TOOLS } from './lib/site';

const idFor = (collection: string) => ({ entry }: { entry: string }) => {
  const m = new RegExp(`^([^/]+)/${collection}/(.+)\\.mdx$`).exec(entry);
  if (!m) throw new Error(`Unexpected content path: ${entry}`);
  return `${m[1]}/${m[2]}`;
};

const loader = (collection: string) =>
  glob({ base: './src/content', pattern: `*/${collection}/*.mdx`, generateId: idFor(collection) });

const phaseEnum = z.enum(PHASES);
const toolEnum = z.enum(TOOLS);
const situationEnum = z.enum(SITUATIONS);

/** Meta description: plain text, short enough for search results. */
const description = z.string().min(40).max(200);

const phases = defineCollection({
  loader: loader('phases'),
  schema: z.object({
    description,
    lede: z.string(),
    start: z.array(z.string()).min(3).max(5),
    image: z.string(),
    summary: z.object({
      normal: z.array(z.string()).min(3).max(5),
      works: z.array(z.string()).min(3).max(6),
      backfires: z.array(z.string()).min(2).max(5),
      say: z.array(z.string()).min(3).max(6),
    }),
    tools: z.array(toolEnum).min(3),
    situations: z.array(situationEnum).min(2),
  }),
});

const learning = defineCollection({
  loader: loader('learning'),
  schema: z.object({
    description,
    lede: z.string(),
    start: z.array(z.string()).min(3).max(5),
    image: z.string(),
    summary: z.object({
      everyday: z.array(z.string()).min(3).max(6),
      talk: z.array(z.string()).min(2).max(5),
      avoid: z.array(z.string()).min(2).max(4),
    }),
  }),
});

const tools = defineCollection({
  loader: loader('tools'),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    description,
    ages: z.array(phaseEnum).min(1),
    evidence: z.enum(EVIDENCE_LEVELS),
    image: z.string(),
    related: z.array(toolEnum).default([]),
    situations: z.array(situationEnum).default([]),
  }),
});

const situations = defineCollection({
  loader: loader('situations'),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    description,
    ages: z.array(phaseEnum).min(1),
    now: z.array(z.string()).min(3).max(6),
    image: z.string(),
    tools: z.array(toolEnum).min(1),
    related: z.array(situationEnum).default([]),
  }),
});

const pages = defineCollection({
  loader: loader('pages'),
  schema: z
    .object({
      title: z.string(),
      description,
      lede: z.string().optional(),
      image: z.string().optional(),
    })
    .loose(),
});

export const collections = { phases, learning, tools, situations, pages };
