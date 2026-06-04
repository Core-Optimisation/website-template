import type { Block, Field } from 'payload';
import {
  headlineFields,
  appearanceFields,
  actionsField,
  callToActionField,
  itemsField,
} from '../fields';

const imageField = (overrides: Partial<Field> = {}): Field =>
  ({ name: 'image', type: 'upload', relationTo: 'media', ...overrides }) as Field;

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    { name: 'variant', type: 'select', defaultValue: 'centered', options: ['centered', 'split'] },
    ...headlineFields,
    { name: 'content', type: 'richText' },
    actionsField,
    imageField(),
    ...appearanceFields,
  ],
};

export const FeaturesBlock: Block = {
  slug: 'features',
  interfaceName: 'FeaturesBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'grid',
      options: ['grid', 'twocol', 'image'],
    },
    ...headlineFields,
    { name: 'columns', type: 'select', defaultValue: '3', options: ['2', '3'] },
    imageField({ admin: { condition: (_, s) => s.variant === 'image' } }),
    itemsField,
    ...appearanceFields,
  ],
};

export const ContentBlock: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  fields: [
    ...headlineFields,
    { name: 'content', type: 'richText' },
    imageField(),
    { name: 'columns', type: 'select', defaultValue: '2', options: ['1', '2'] },
    itemsField,
    callToActionField,
    { name: 'isReversed', type: 'checkbox', defaultValue: false },
    { name: 'isAfterContent', type: 'checkbox', defaultValue: false },
    ...appearanceFields,
  ],
};

export const StepsBlock: Block = {
  slug: 'steps',
  interfaceName: 'StepsBlock',
  fields: [
    { name: 'variant', type: 'select', defaultValue: 'timeline', options: ['timeline', 'twocol'] },
    ...headlineFields,
    itemsField,
    imageField({ admin: { condition: (_, s) => s.variant === 'timeline' } }),
    callToActionField,
    { name: 'isReversed', type: 'checkbox', defaultValue: false },
    ...appearanceFields,
  ],
};

export const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  fields: [
    ...headlineFields,
    {
      name: 'stats',
      type: 'array',
      fields: [
        { name: 'amount', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'description', type: 'text' },
        { name: 'icon', type: 'text' },
      ],
    },
    ...appearanceFields,
  ],
};

export const FaqsBlock: Block = {
  slug: 'faqs',
  interfaceName: 'FaqsBlock',
  fields: [
    ...headlineFields,
    { name: 'columns', type: 'select', defaultValue: '2', options: ['1', '2'] },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'title', type: 'text' }, // question
        { name: 'description', type: 'textarea' }, // answer
        { name: 'icon', type: 'text' },
      ],
    },
    ...appearanceFields,
  ],
};

export const PricingBlock: Block = {
  slug: 'pricing',
  interfaceName: 'PricingBlock',
  fields: [
    ...headlineFields,
    {
      name: 'prices',
      type: 'array',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'subtitle', type: 'text' },
        { name: 'price', type: 'text' },
        { name: 'period', type: 'text' },
        { name: 'items', type: 'array', fields: [{ name: 'description', type: 'text' }] },
        { name: 'hasRibbon', type: 'checkbox', defaultValue: false },
        { name: 'ribbonTitle', type: 'text' },
        callToActionField,
      ],
    },
    ...appearanceFields,
  ],
};

export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  fields: [
    ...headlineFields,
    {
      name: 'testimonials',
      type: 'array',
      fields: [
        { name: 'testimonial', type: 'textarea' },
        { name: 'name', type: 'text' },
        { name: 'job', type: 'text' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    callToActionField,
    ...appearanceFields,
  ],
};

export const BrandsBlock: Block = {
  slug: 'brands',
  interfaceName: 'BrandsBlock',
  fields: [
    ...headlineFields,
    {
      name: 'images',
      type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
    ...appearanceFields,
  ],
};

export const CallToActionBlock: Block = {
  slug: 'callToAction',
  interfaceName: 'CallToActionBlock',
  fields: [...headlineFields, actionsField, ...appearanceFields],
};

export const BlogLatestPostsBlock: Block = {
  slug: 'blogLatestPosts',
  interfaceName: 'BlogLatestPostsBlock',
  fields: [
    { name: 'title', type: 'text' },
    { name: 'information', type: 'textarea' },
    { name: 'count', type: 'number', defaultValue: 4 },
    { name: 'linkText', type: 'text' },
    { name: 'linkUrl', type: 'text' },
    ...appearanceFields,
  ],
};

export const NoteBlock: Block = {
  slug: 'note',
  interfaceName: 'NoteBlock',
  fields: [{ name: 'content', type: 'text' }],
};

export const FormBlock: Block = {
  slug: 'formBlock',
  interfaceName: 'FormBlock',
  fields: [
    ...headlineFields,
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: { description: 'Choose a form built with the Form Builder.' },
    },
    ...appearanceFields,
  ],
};

/** Registered on the Pages `layout` blocks field. */
export const pageBlocks: Field = {
  name: 'layout',
  type: 'blocks',
  blocks: [
    HeroBlock,
    FeaturesBlock,
    ContentBlock,
    StepsBlock,
    StatsBlock,
    FaqsBlock,
    PricingBlock,
    TestimonialsBlock,
    BrandsBlock,
    CallToActionBlock,
    BlogLatestPostsBlock,
    NoteBlock,
    FormBlock,
  ],
};
