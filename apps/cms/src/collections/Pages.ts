import type { CollectionConfig } from 'payload';
import { formatSlug } from '../hooks/slug';
import { pageBlocks } from '../blocks';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', '_status'] },
  // Autosave powers Live Preview: edits stream to a draft version every ~375ms.
  versions: { drafts: { autosave: { interval: 375 } }, maxPerDoc: 25 },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Use "home" for the homepage' },
      hooks: { beforeValidate: [formatSlug('title')] },
    },
    pageBlocks, // 12 blocks from Appendix A
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
};
