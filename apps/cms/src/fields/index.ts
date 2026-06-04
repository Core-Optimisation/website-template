import type { Field } from 'payload';

/** Title / subtitle / tagline — the AstroWind "Headline" trio. */
export const headlineFields: Field[] = [
  { name: 'tagline', type: 'text' },
  { name: 'title', type: 'text' },
  { name: 'subtitle', type: 'textarea' },
];

/** Per-block appearance controls. `anchorId` → widget `id` in the renderer. */
export const appearanceFields: Field[] = [
  { name: 'anchorId', type: 'text', admin: { description: 'Optional #anchor id' } },
  { name: 'isDark', type: 'checkbox', defaultValue: false },
  {
    name: 'background',
    type: 'select',
    defaultValue: 'default',
    options: ['default', 'muted', 'none'],
  },
];

/** Array of buttons (CTAs). */
export const actionsField: Field = {
  name: 'actions',
  type: 'array',
  labels: { singular: 'Button', plural: 'Buttons' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'secondary',
      options: ['primary', 'secondary', 'tertiary', 'link'],
    },
    { name: 'text', type: 'text', required: true },
    { name: 'href', type: 'text', required: true },
    { name: 'icon', type: 'text', admin: { description: 'astro-icon name, e.g. tabler:rocket' } },
    { name: 'target', type: 'select', defaultValue: '_self', options: ['_self', '_blank'] },
  ],
};

/** Single call-to-action button group. */
export const callToActionField: Field = {
  name: 'callToAction',
  type: 'group',
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'primary',
      options: ['primary', 'secondary', 'tertiary', 'link'],
    },
    { name: 'text', type: 'text' },
    { name: 'href', type: 'text' },
    { name: 'icon', type: 'text' },
    { name: 'target', type: 'select', defaultValue: '_self', options: ['_self', '_blank'] },
  ],
};

/** Generic title / description / icon item list. */
export const itemsField: Field = {
  name: 'items',
  type: 'array',
  labels: { singular: 'Item', plural: 'Items' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'icon', type: 'text', admin: { description: 'astro-icon name' } },
  ],
};
