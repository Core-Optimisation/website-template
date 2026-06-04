import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';
import { buildConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';

import { getDatabaseAdapter } from './config/db';
import { getStoragePlugins } from './config/media';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Categories } from './collections/Categories';
import { Posts } from './collections/Posts';
import { Pages } from './collections/Pages';
import { Navigation } from './globals/Navigation';
import { SiteSettings } from './globals/SiteSettings';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Single source of truth: load the monorepo-root .env so one file drives both apps.
loadEnv({ path: path.resolve(dirname, '../../../.env') });
// Optional local override.
loadEnv({ path: path.resolve(dirname, '../.env'), override: false });

const webUrl = process.env.WEB_PUBLIC_URL ?? 'http://localhost:4321';
const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const previewSecret = process.env.PREVIEW_SECRET ?? 'change-me-preview-secret';

/**
 * Builds the Astro `/preview` URL the admin iframe loads for a given doc.
 * The shared secret guards the route; the slug selects the draft to render.
 */
const livePreviewUrl = ({
  data,
  collectionConfig,
}: {
  data: Record<string, unknown>;
  collectionConfig?: { slug?: string };
}) => {
  const params = new URLSearchParams({
    collection: collectionConfig?.slug ?? 'pages',
    slug: typeof data?.slug === 'string' && data.slug ? data.slug : 'home',
    secret: previewSecret,
  });
  return `${webUrl}/preview?${params.toString()}`;
};

export default buildConfig({
  serverURL: serverUrl,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: '— SiteForge' },
    livePreview: {
      url: livePreviewUrl,
      collections: ['pages', 'posts'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  editor: lexicalEditor(),
  collections: [Users, Media, Categories, Posts, Pages],
  globals: [Navigation, SiteSettings],
  db: getDatabaseAdapter(),
  plugins: [...getStoragePlugins()],
  secret: process.env.PAYLOAD_SECRET ?? 'CHANGE_ME_DEV_SECRET',
  // Allow the Astro public site to read the API (REST + GraphQL).
  cors: [webUrl, serverUrl].filter(Boolean),
  csrf: [webUrl, serverUrl].filter(Boolean),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp: (await import('sharp')).default,
});
