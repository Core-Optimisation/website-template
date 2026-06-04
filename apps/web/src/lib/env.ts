/**
 * Resolves SiteForge environment configuration shared by build and SSR.
 * Values originate from the monorepo-root `.env` (loaded in astro.config.ts).
 */
export type RenderMode = 'static' | 'ssr';

export function getServerUrl(): string {
  return (
    process.env.PAYLOAD_PUBLIC_SERVER_URL ??
    process.env.PUBLIC_PAYLOAD_SERVER_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function getApiUrl(): string {
  return `${getServerUrl()}/api`;
}

export function getRenderMode(): RenderMode {
  return process.env.RENDER_MODE === 'ssr' ? 'ssr' : 'static';
}

/** Optional API token used to read drafts when RENDER_MODE=ssr (preview). */
export function getApiToken(): string | undefined {
  return process.env.PAYLOAD_API_TOKEN || undefined;
}
