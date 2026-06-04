import type { GlobalConfig } from 'payload';
import { actionsField } from '../fields';

/** Replaces AstroWind's hardcoded navigation.ts (header + footer). */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  access: { read: () => true },
  fields: [
    {
      name: 'header',
      type: 'group',
      fields: [
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'text', type: 'text', required: true },
            { name: 'href', type: 'text' },
            {
              name: 'submenu',
              type: 'array',
              fields: [
                { name: 'text', type: 'text' },
                { name: 'href', type: 'text' },
              ],
            },
          ],
        },
        actionsField, // header CTA buttons
      ],
    },
    {
      name: 'footer',
      type: 'group',
      fields: [
        {
          name: 'columns',
          type: 'array',
          fields: [
            { name: 'title', type: 'text' },
            {
              name: 'links',
              type: 'array',
              fields: [
                { name: 'text', type: 'text' },
                { name: 'href', type: 'text' },
              ],
            },
          ],
        },
        {
          name: 'socialLinks',
          type: 'array',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'icon', type: 'text', admin: { description: 'astro-icon name' } },
            { name: 'href', type: 'text' },
          ],
        },
        { name: 'note', type: 'text' },
        {
          name: 'legalLinks',
          type: 'array',
          fields: [
            { name: 'text', type: 'text' },
            { name: 'href', type: 'text' },
          ],
        },
      ],
    },
  ],
};
