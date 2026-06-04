import type { Page } from '@siteforge/shared';
import { media } from './media';
import { richTextToHtml } from './richtext';

type Block = NonNullable<Page['layout']>[number];

/** Common base props every widget understands. */
function base(block: Record<string, unknown>) {
  return {
    id: (block.anchorId as string) || undefined,
    isDark: (block.isDark as boolean) ?? false,
  };
}

/**
 * Transforms a Payload layout block into the prop object expected by its
 * matching AstroWind widget. Returns the widget key and props, or null when
 * a block type has no mapping.
 */
export function transformBlock(block: Block): { widget: string; props: Record<string, unknown> } | null {
  switch (block.blockType) {
    case 'hero':
      return {
        // centered -> Hero, split -> Hero2
        widget: block.variant === 'split' ? 'Hero2' : 'Hero',
        props: {
          ...base(block),
          tagline: block.tagline,
          title: block.title,
          subtitle: block.subtitle,
          content: richTextToHtml(block.content),
          actions: block.actions ?? [],
          image: media(block.image, block.title ?? ''),
        },
      };
    case 'features':
      return {
        // grid -> Features, twocol -> Features2, image -> Features3
        widget:
          block.variant === 'twocol' ? 'Features2' : block.variant === 'image' ? 'Features3' : 'Features',
        props: {
          ...base(block),
          tagline: block.tagline,
          title: block.title,
          subtitle: block.subtitle,
          image: media(block.image, block.title ?? ''),
          columns: block.columns ? Number(block.columns) : undefined,
          items: block.items ?? [],
        },
      };
    case 'content':
      return {
        widget: 'Content',
        props: {
          ...base(block),
          tagline: block.tagline,
          title: block.title,
          subtitle: block.subtitle,
          content: richTextToHtml(block.content),
          image: media(block.image, block.title ?? ''),
          columns: block.columns ? Number(block.columns) : undefined,
          items: block.items ?? [],
          callToAction: block.callToAction,
          isReversed: block.isReversed ?? false,
          isAfterContent: block.isAfterContent ?? false,
        },
      };
    case 'steps':
      return {
        // timeline -> Steps, twocol -> Steps2 (no image)
        widget: block.variant === 'twocol' ? 'Steps2' : 'Steps',
        props: {
          ...base(block),
          tagline: block.tagline,
          title: block.title,
          subtitle: block.subtitle,
          items: block.items ?? [],
          image: media(block.image, block.title ?? ''),
          callToAction: block.callToAction,
          isReversed: block.isReversed ?? false,
        },
      };
    case 'stats':
      return {
        widget: 'Stats',
        props: {
          ...base(block),
          tagline: block.tagline,
          title: block.title,
          subtitle: block.subtitle,
          stats: block.stats ?? [],
        },
      };
    case 'faqs':
      return {
        widget: 'FAQs',
        props: {
          ...base(block),
          tagline: block.tagline,
          title: block.title,
          subtitle: block.subtitle,
          columns: block.columns ? Number(block.columns) : undefined,
          items: block.items ?? [],
        },
      };
    case 'pricing':
      return {
        widget: 'Pricing',
        props: {
          ...base(block),
          tagline: block.tagline,
          title: block.title,
          subtitle: block.subtitle,
          prices: (block.prices ?? []).map((p: Record<string, unknown>) => ({
            ...p,
            items: (p.items as Array<Record<string, unknown>> | undefined) ?? [],
          })),
        },
      };
    case 'testimonials':
      return {
        widget: 'Testimonials',
        props: {
          ...base(block),
          tagline: block.tagline,
          title: block.title,
          subtitle: block.subtitle,
          callToAction: block.callToAction,
          testimonials: (block.testimonials ?? []).map((t: Record<string, unknown>) => ({
            testimonial: t.testimonial,
            name: t.name,
            job: t.job,
            image: media(t.image as never, String(t.name ?? '')),
          })),
        },
      };
    case 'brands':
      return {
        widget: 'Brands',
        props: {
          ...base(block),
          tagline: block.tagline,
          title: block.title,
          subtitle: block.subtitle,
          images: (block.images ?? [])
            .map((i: Record<string, unknown>) => media(i.image as never))
            .filter(Boolean),
        },
      };
    case 'callToAction':
      return {
        widget: 'CallToAction',
        props: {
          ...base(block),
          tagline: block.tagline,
          title: block.title,
          subtitle: block.subtitle,
          actions: block.actions ?? [],
        },
      };
    case 'blogLatestPosts':
      return {
        widget: 'BlogLatestPosts',
        props: {
          ...base(block),
          title: block.title,
          information: block.information,
          count: block.count ?? 4,
          linkText: block.linkText,
          linkUrl: block.linkUrl,
        },
      };
    case 'note':
      return {
        widget: 'Note',
        props: {
          // Note widget has no id; map content -> description.
          title: block.title,
          icon: block.icon,
          description: block.content,
        },
      };
    default:
      return null;
  }
}
