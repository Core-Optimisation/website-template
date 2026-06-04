import type { Navigation } from '@siteforge/shared';

export interface HeaderData {
  links: Array<{ text: string; href?: string; links?: Array<{ text?: string; href?: string }> }>;
  actions: Array<Record<string, unknown>>;
}

export interface FooterData {
  links: Array<{ title?: string; links: Array<{ text?: string; href?: string }> }>;
  secondaryLinks: Array<{ text?: string; href?: string }>;
  socialLinks: Array<{ ariaLabel?: string; icon?: string; href?: string }>;
  footNote: string;
}

/** Maps the Payload Navigation global into AstroWind Header props. */
export function toHeaderData(nav: Navigation | null): HeaderData {
  const header = nav?.header;
  return {
    links: (header?.links ?? []).map((l) => ({
      text: l.text,
      href: l.href ?? undefined,
      links: (l.submenu ?? []).map((s) => ({ text: s.text ?? undefined, href: s.href ?? undefined })),
    })),
    actions: (header?.actions ?? []).map((a) => ({ ...a })),
  };
}

/** Maps the Payload Navigation global into AstroWind Footer props. */
export function toFooterData(nav: Navigation | null): FooterData {
  const footer = nav?.footer;
  return {
    links: (footer?.columns ?? []).map((c) => ({
      title: c.title ?? undefined,
      links: (c.links ?? []).map((l) => ({ text: l.text ?? undefined, href: l.href ?? undefined })),
    })),
    secondaryLinks: (footer?.legalLinks ?? []).map((l) => ({
      text: l.text ?? undefined,
      href: l.href ?? undefined,
    })),
    socialLinks: (footer?.socialLinks ?? []).map((s) => ({
      ariaLabel: s.label ?? undefined,
      icon: s.icon ?? undefined,
      href: s.href ?? undefined,
    })),
    footNote: footer?.note ?? '',
  };
}
