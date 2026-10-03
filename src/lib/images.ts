// AI illustrations. content/images.yml lists every image (id, page, prompt, trilingual alt, size).
// The images workflow writes src/assets/ai/<id>.png; until a file exists, <AiImage> renders a
// placeholder. No code changes are needed when images land.
import YAML from 'yaml';
import { z } from 'astro/zod';
import type { ImageMetadata } from 'astro';
import raw from '../../content/images.yml?raw';

const ImageEntry = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  page: z.string(),
  prompt: z.string().min(20),
  alt: z.object({ en: z.string().min(5), 'zh-hans': z.string().min(2), 'zh-hant': z.string().min(2) }),
  size: z.enum(['4:3', '1:1', '3:2', '16:9']),
});
const ImagesFile = z.object({ style: z.string(), images: z.array(ImageEntry) });

export type ImageEntry = z.infer<typeof ImageEntry>;

const file = ImagesFile.parse(YAML.parse(raw));
const byId = new Map<string, ImageEntry>();
for (const img of file.images) {
  if (byId.has(img.id)) throw new Error(`Duplicate image id in content/images.yml: ${img.id}`);
  byId.set(img.id, img);
}

const assets = import.meta.glob<ImageMetadata>('/src/assets/ai/*.png', { eager: true, import: 'default' });

export function getImageEntry(id: string): ImageEntry {
  const entry = byId.get(id);
  if (!entry) throw new Error(`Unknown image id "${id}". Add it to content/images.yml.`);
  return entry;
}

export function getAiAsset(id: string): ImageMetadata | undefined {
  return assets[`/src/assets/ai/${id}.png`];
}

export function aspect(size: ImageEntry['size']): number {
  const [w, h] = size.split(':').map(Number);
  return w / h;
}
