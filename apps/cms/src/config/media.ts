import { s3Storage } from '@payloadcms/storage-s3';
import type { Plugin } from 'payload';

/**
 * Media storage adapter selection — swap with one env var, no code change.
 *   MEDIA_ADAPTER=local (default, portable: the media/ folder is the backup unit)
 *   MEDIA_ADAPTER=s3    (set S3_* vars; works with AWS S3 or any S3-compatible store)
 *
 * For `local`, no plugin is needed — the Media collection's `upload.staticDir`
 * serves files straight from disk. For `s3`, this returns the storage plugin
 * that transparently redirects the same Media collection to the bucket.
 */
export function getStoragePlugins(): Plugin[] {
  const adapter = (process.env.MEDIA_ADAPTER ?? 'local').toLowerCase();

  if (adapter === 's3') {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      throw new Error('MEDIA_ADAPTER=s3 but S3_BUCKET is not set.');
    }
    return [
      s3Storage({
        collections: { media: true },
        bucket,
        config: {
          region: process.env.S3_REGION,
          endpoint: process.env.S3_ENDPOINT || undefined,
          forcePathStyle: Boolean(process.env.S3_ENDPOINT), // needed for MinIO/R2-style endpoints
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
          },
        },
      }),
    ];
  }

  return [];
}
