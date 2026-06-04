import type { CollectionConfig } from 'payload';

/** Payload's built-in auth collection. Admins authenticate here. */
export const Users: CollectionConfig = {
  slug: 'users',
  // useAPIKey lets the Astro preview route read drafts with a per-user key.
  auth: { useAPIKey: true },
  admin: { useAsTitle: 'email' },
  fields: [{ name: 'name', type: 'text' }],
};
