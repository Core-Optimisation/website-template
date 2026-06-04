import type { CollectionConfig } from 'payload';
import { formatSlug } from '../hooks/slug';

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'title' },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL segment, e.g. tutorials' },
      hooks: { beforeValidate: [formatSlug('title')] },
    },
    { name: 'description', type: 'textarea' },
  ],
};
