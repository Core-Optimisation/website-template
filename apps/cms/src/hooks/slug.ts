import type { FieldHook } from 'payload';

/** Lowercase, hyphenated, URL-safe slug from arbitrary text. */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Auto-generate a slug from a source field (default: `title`) when the slug is
 * empty. Existing slugs are preserved so permalinks stay stable.
 */
export const formatSlug =
  (fromField = 'title'): FieldHook =>
  ({ value, data }) => {
    if (typeof value === 'string' && value.length > 0) {
      return slugify(value);
    }
    const fallback = data?.[fromField];
    if (typeof fallback === 'string' && fallback.length > 0) {
      return slugify(fallback);
    }
    return value;
  };
