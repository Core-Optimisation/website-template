import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';
import { buildConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder';
import { redirectsPlugin } from '@payloadcms/plugin-redirects';
import { searchPlugin } from '@payloadcms/plugin-search';
import { sentryPlugin } from '@payloadcms/plugin-sentry';
import * as Sentry from '@sentry/nextjs';

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

// Sentry only activates when a DSN is provided, keeping local/dev builds quiet.
const sentryEnabled = Boolean(process.env.SENTRY_DSN);

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

const documentUrl = ({ doc, collectionSlug }: { doc: Record<string, unknown>; collectionSlug?: string }) => {
  const slug = typeof doc?.slug === 'string' ? doc.slug : undefined;

  if (!slug) return webUrl;

  if (collectionSlug === 'pages') {
    return slug === 'home' ? webUrl : `${webUrl}/${slug}`;
  }

  if (collectionSlug === 'posts') {
    return `${webUrl}/blog/${slug}`;
  }

  return webUrl;
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
  plugins: [
    seoPlugin({
      collections: ['pages', 'posts'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => (typeof doc?.title === 'string' ? doc.title : 'SiteForge'),
      generateDescription: ({ doc }) => (typeof doc?.excerpt === 'string' ? doc.excerpt : ''),
      generateImage: ({ doc }) => {
        const image = doc?.coverImage;

        if (typeof image === 'number' || typeof image === 'string') return image;
        if (image && typeof image === 'object' && 'id' in image) return { id: image.id as number | string };

        return '';
      },
      generateURL: ({ doc, collectionConfig }) =>
        documentUrl({ doc, collectionSlug: collectionConfig?.slug }),
    }),
    // Build forms in the admin and collect submissions; confirmations can
    // redirect to any Page.
    formBuilderPlugin({
      redirectRelationships: ['pages'],
      fields: {
        text: true,
        textarea: true,
        select: true,
        email: true,
        state: true,
        country: true,
        checkbox: true,
        number: true,
        message: true,
        payment: false,
      },
    }),
    // Manage 301/302 redirects for pages and posts from the admin.
    redirectsPlugin({
      collections: ['pages', 'posts'],
    }),
    // Maintain a denormalised `search` collection for fast public site search.
    searchPlugin({
      collections: ['pages', 'posts'],
      defaultPriorities: {
        pages: 10,
        posts: 20,
      },
      searchOverrides: {
        fields: ({ defaultFields }) => [
          ...defaultFields,
          { name: 'slug', type: 'text', admin: { readOnly: true } },
          { name: 'excerpt', type: 'textarea', admin: { readOnly: true } },
        ],
      },
      beforeSync: ({ originalDoc, searchDoc }) => ({
        ...searchDoc,
        slug: typeof originalDoc?.slug === 'string' ? originalDoc.slug : '',
        excerpt:
          typeof originalDoc?.excerpt === 'string'
            ? originalDoc.excerpt
            : (originalDoc?.meta?.description ?? ''),
      }),
    }),
    // Forward Payload server errors to Sentry when a DSN is configured.
    sentryPlugin({
      enabled: sentryEnabled,
      Sentry,
      options: {
        captureErrors: [400, 403, 404],
        debug: process.env.NODE_ENV !== 'production',
      },
    }),
    ...getStoragePlugins(),
  ],
  secret: process.env.PAYLOAD_SECRET ?? 'CHANGE_ME_DEV_SECRET',
  // Allow the Astro public site to read the API (REST + GraphQL).
  cors: [webUrl, serverUrl].filter(Boolean),
  csrf: [webUrl, serverUrl].filter(Boolean),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp: (await import('sharp')).default,
});
