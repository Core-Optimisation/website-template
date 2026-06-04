import type { GlobalConfig } from 'payload';

/** Replaces AstroWind's hardcoded config.yaml (branding, SEO, theme). */
export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  access: { read: () => true },
  fields: [
    { name: 'siteName', type: 'text', required: true },
    { name: 'tagline', type: 'text' },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'favicon', type: 'upload', relationTo: 'media' },
    {
      name: 'defaultSeo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'titleTemplate', type: 'text', admin: { description: 'e.g. %s — My Site' } },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'analytics',
      type: 'group',
      fields: [{ name: 'googleAnalyticsId', type: 'text' }],
    },
    {
      name: 'theme',
      type: 'group',
      fields: [
        { name: 'mode', type: 'select', defaultValue: 'system', options: ['light', 'dark', 'system'] },
        {
          name: 'accentColor',
          type: 'text',
          admin: { description: 'Primary brand colour, hex e.g. #7a8b3a' },
        },
        {
          name: 'headingFont',
          type: 'text',
          admin: { description: 'CSS font-family stack for headings (optional)' },
        },
        {
          name: 'bodyFont',
          type: 'text',
          admin: { description: 'CSS font-family stack for body text (optional)' },
        },
        {
          name: 'radius',
          type: 'select',
          defaultValue: 'md',
          options: ['none', 'sm', 'md', 'lg', 'full'],
          admin: { description: 'Global corner radius scale' },
        },
      ],
    },
  ],
};
