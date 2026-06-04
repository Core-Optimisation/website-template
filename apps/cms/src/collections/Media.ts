import type { CollectionConfig } from 'payload';

/**
 * Media uploads. Local-disk by default (`upload.staticDir`); the S3 plugin
 * (config/media.ts) transparently redirects this same collection to a bucket
 * when MEDIA_ADAPTER=s3. Public read so the Astro site can fetch images.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  upload: {
    staticDir: process.env.MEDIA_DIR ?? 'media',
    mimeTypes: ['image/*'],
  },
  fields: [{ name: 'alt', type: 'text' }],
};
