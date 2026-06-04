import { getApiToken, getApiUrl, getRenderMode } from './env';
import type { Media, Navigation, Page, Post, SiteSetting, Category, Form, Redirect, Search } from '@siteforge/shared';

interface QueryOptions {
  /** Include drafts (only honoured in ssr mode with an API token). */
  draft?: boolean;
  depth?: number;
}

function authHeaders(): Record<string, string> {
  const token = getApiToken();
  if (token && getRenderMode() === 'ssr') {
    return { Authorization: `users API-Key ${token}` };
  }
  return {};
}

async function api<T>(path: string, opts: QueryOptions = {}): Promise<T | null> {
  const url = new URL(`${getApiUrl()}${path}`);
  url.searchParams.set('depth', String(opts.depth ?? 2));
  if (opts.draft && getRenderMode() === 'ssr') {
    url.searchParams.set('draft', 'true');
  }
  try {
    const res = await fetch(url.toString(), {
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(`[payload] ${res.status} ${res.statusText} for ${url.pathname}`);
      }
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[payload] request failed for ${path}:`, (err as Error).message);
    return null;
  }
}

interface ListResult<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/* ------------------------------- Globals -------------------------------- */

export async function getNavigation(opts?: QueryOptions): Promise<Navigation | null> {
  return api<Navigation>('/globals/navigation', opts);
}

export async function getSiteSettings(opts?: QueryOptions): Promise<SiteSetting | null> {
  return api<SiteSetting>('/globals/siteSettings', opts);
}

/* -------------------------------- Pages --------------------------------- */

export async function getPageBySlug(slug: string, opts?: QueryOptions): Promise<Page | null> {
  const where = `where[slug][equals]=${encodeURIComponent(slug)}&limit=1`;
  const result = await api<ListResult<Page>>(`/pages?${where}`, opts);
  return result?.docs?.[0] ?? null;
}

export async function getAllPages(opts?: QueryOptions): Promise<Page[]> {
  const result = await api<ListResult<Page>>('/pages?limit=1000', opts);
  return result?.docs ?? [];
}

/* -------------------------------- Posts --------------------------------- */

export async function getPosts(
  params: { limit?: number; page?: number; category?: string; tag?: string } = {},
  opts?: QueryOptions
): Promise<ListResult<Post>> {
  const search = new URLSearchParams();
  search.set('limit', String(params.limit ?? 100));
  search.set('page', String(params.page ?? 1));
  search.set('sort', '-publishedAt');
  if (params.category) search.set('where[category.slug][equals]', params.category);
  if (params.tag) search.set('where[tags.tag][equals]', params.tag);
  const result = await api<ListResult<Post>>(`/posts?${search.toString()}`, opts);
  return (
    result ?? {
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }
  );
}

export async function getPostBySlug(slug: string, opts?: QueryOptions): Promise<Post | null> {
  const where = `where[slug][equals]=${encodeURIComponent(slug)}&limit=1`;
  const result = await api<ListResult<Post>>(`/posts?${where}`, opts);
  return result?.docs?.[0] ?? null;
}

export async function getCategories(opts?: QueryOptions): Promise<Category[]> {
  const result = await api<ListResult<Category>>('/categories?limit=1000', opts);
  return result?.docs ?? [];
}

/* -------------------------------- Forms --------------------------------- */

export async function getFormById(id: number | string, opts?: QueryOptions): Promise<Form | null> {
  return api<Form>(`/forms/${id}`, opts);
}

export async function getFormByTitle(title: string, opts?: QueryOptions): Promise<Form | null> {
  const where = `where[title][equals]=${encodeURIComponent(title)}&limit=1`;
  const result = await api<ListResult<Form>>(`/forms?${where}`, opts);
  return result?.docs?.[0] ?? null;
}

/* -------------------------------- Search -------------------------------- */

export async function getSearchDocs(opts?: QueryOptions): Promise<Search[]> {
  const result = await api<ListResult<Search>>('/search?limit=1000&sort=-priority', opts);
  return result?.docs ?? [];
}

/* ------------------------------- Redirects ------------------------------ */

export async function getRedirects(opts?: QueryOptions): Promise<Redirect[]> {
  const result = await api<ListResult<Redirect>>('/redirects?limit=1000', { depth: 1, ...opts });
  return result?.docs ?? [];
}

export type { Media, Navigation, Page, Post, SiteSetting, Category, Form, Redirect, Search, ListResult };
