import { getServerUrl } from './env';
import type { Media } from '@siteforge/shared';

export interface ResolvedImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

type MediaInput = number | Media | null | undefined;

/**
 * Normalises a Payload media field (relation id or populated doc) into the
 * `{ src, alt, width, height }` shape AstroWind widgets spread into <Image>.
 * Relative upload URLs are made absolute against the CMS server URL so static
 * builds can fetch them.
 */
export function media(input: MediaInput, fallbackAlt = ''): ResolvedImage | undefined {
  if (!input || typeof input === 'number') return undefined;
  const url = input.url ?? input.thumbnailURL;
  if (!url) return undefined;
  const src = url.startsWith('http') ? url : `${getServerUrl()}${url}`;
  return {
    src,
    alt: input.alt ?? fallbackAlt,
    width: input.width ?? undefined,
    height: input.height ?? undefined,
  };
}

/** Returns just the absolute URL of a media field, or undefined. */
export function mediaUrl(input: MediaInput): string | undefined {
  return media(input)?.src;
}
