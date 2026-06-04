# Step 10 — Live Preview (themed, near-real-time editing)

> Self-contained add-on to the SiteForge master prompt. Paste into your AI coding agent after Steps 0–9. It wires up Payload Live Preview against the AstroWind theme, reusing the existing `resolveBlock()` seam so there is **no duplicate render logic**.

---

## Goal
Give content editors a **Live Preview** tab in the Payload admin that renders the *actual AstroWind theme* in an iframe and updates as they edit block fields — the closest thing to a WYSIWYG page builder, without coupling content to design.

## Why it matters
Today the flow is "edit blocks → build → look." This closes the loop: edit on the left, watch the themed page redraw on the right. It reuses `apps/web/src/lib/blocks.ts` (the single coupling point), so the preview is pixel-identical to production.

## Design note (how it actually works)
Astro isn't React, so we don't patch the DOM field-by-field. Instead the preview route is **server-rendered from draft data through `resolveBlock()`**, and a tiny client script **debounce-refetches that route and swaps the `#preview-root` HTML** whenever Payload signals a change. One renderer, themed output, near-real-time.

---

## Prerequisites
- Drafts must be enabled on `pages` and `posts` (see Appendix B). Step 10 also turns on **autosave** so the draft persists as the editor types.
- Cross-origin admin cookies won't reach the Astro server, so the preview route reads drafts using a **server-to-server API key**, and is guarded by a **preview secret**.

## Env vars (add to both apps' `.env`)
| Var | App | Example | Purpose |
|---|---|---|---|
| `FRONTEND_URL` | cms | `http://localhost:4321` | Base URL Payload points the iframe at |
| `PREVIEW_SECRET` | cms + web | `dev-preview-9f3a…` | Guards the `/preview` route |
| `CMS_URL` | web | `http://localhost:3000` | Server-side draft fetch (private) |
| `PUBLIC_CMS_URL` | web | `http://localhost:3000` | Client needs admin origin for postMessage |
| `CMS_API_KEY` | web | *(generated below)* | Lets the SSR route read drafts |

---

## Task 1 — Enable drafts + autosave, and an API-key user
In `apps/cms/src/collections/Pages.ts` and `Posts.ts`:
```ts
versions: {
  drafts: {
    autosave: { interval: 375 }, // persists draft as the editor types
  },
  maxPerDoc: 25,
},
```
In `apps/cms/src/collections/Users.ts`, enable API keys:
```ts
auth: {
  useAPIKey: true,
},
```
Then in the admin, open (or seed) a service user, tick **Enable API Key**, save, and copy the key into `CMS_API_KEY` on the web app. Give this user read access to `pages`/`posts` (the existing authenticated read rule is enough).

## Task 2 — Payload Live Preview config
In `apps/cms/src/payload.config.ts`, inside `admin`:
```ts
admin: {
  // …existing admin config…
  livePreview: {
    url: ({ data, collectionConfig }) => {
      const base = process.env.FRONTEND_URL ?? 'http://localhost:4321'
      const collection = collectionConfig?.slug ?? 'pages'
      const slug = data?.slug ?? 'home'
      const secret = process.env.PREVIEW_SECRET ?? ''
      return `${base}/preview?collection=${collection}&slug=${encodeURIComponent(slug)}&secret=${secret}`
    },
    collections: ['pages', 'posts'],
    breakpoints: [
      { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
      { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
      { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
    ],
  },
}
```
This adds a **Live Preview** tab to every `pages` and `posts` document, with a responsive breakpoint switcher.

## Task 3 — Astro SSR adapter + preview route
AstroWind builds static by default; the preview must be dynamic. Add an SSR adapter (`@astrojs/node` for local/self-host, or `@astrojs/netlify` if previewing on Netlify) in `apps/web/astro.config.ts`, then create an **on-demand** route:

```astro
---
// apps/web/src/pages/preview.astro
export const prerender = false

import PageLayout from '~/layouts/PageLayout.astro'
import { resolveBlock } from '~/lib/blocks' // the single coupling seam

const { searchParams } = new URL(Astro.request.url)
const secret     = searchParams.get('secret')
const collection = searchParams.get('collection') ?? 'pages'
const slug       = searchParams.get('slug') ?? 'home'

if (secret !== import.meta.env.PREVIEW_SECRET) {
  return new Response('Unauthorized', { status: 401 })
}

const res = await fetch(
  `${import.meta.env.CMS_URL}/api/${collection}` +
  `?where[slug][equals]=${encodeURIComponent(slug)}&draft=true&depth=2&limit=1`,
  { headers: { Authorization: `users API-Key ${import.meta.env.CMS_API_KEY}` } }
)
const { docs } = await res.json()
const doc = docs?.[0]
if (!doc) return new Response('Not found', { status: 404 })

const blocks = doc.layout ?? doc.blocks ?? []
---

<PageLayout>
  <main id="preview-root">
    {blocks.map((block) => resolveBlock(block))}
  </main>

  <script>
    import { subscribe, ready } from '@payloadcms/live-preview'

    const serverURL = import.meta.env.PUBLIC_CMS_URL
    let timer

    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        const html = await (await fetch(window.location.href)).text()
        const next = new DOMParser()
          .parseFromString(html, 'text/html')
          .querySelector('#preview-root')
        const cur = document.querySelector('#preview-root')
        if (next && cur) cur.innerHTML = next.innerHTML
      }, 250)
    }

    const unsubscribe = subscribe({ serverURL, callback: refresh })
    ready({ serverURL })
    window.addEventListener('beforeunload', () => unsubscribe())
  </script>
</PageLayout>
```
Install the client lib:
```bash
pnpm --filter web add @payloadcms/live-preview
```

> Adjust `doc.layout ?? doc.blocks` to whatever your blocks field is actually named in Appendix B, and match the `PageLayout` / `~` alias to AstroWind's conventions. `resolveBlock()` is reused verbatim — no second renderer.

---

## Acceptance criteria
- Opening a page or post in the admin shows a **Live Preview** tab rendering the AstroWind theme.
- Editing a block field updates the iframe within ~½ second (autosave → debounced refetch → HTML swap).
- The mobile/tablet/desktop breakpoint buttons resize the preview.
- Hitting `/preview` without the correct `secret` returns **401**.
- Published output is unchanged — preview only ever reads `draft=true`.

## Notes & honest caveats
- **Why refetch instead of live DOM-patching:** the React `useLivePreview` hook does in-place field updates, but it needs a React frontend. With Astro we get the same *result* (themed, near-real-time) by re-rendering server-side through the one seam — simpler and zero render-logic duplication.
- **Security:** keep `CMS_API_KEY` server-only (no `PUBLIC_` prefix). The `PREVIEW_SECRET` stops anyone guessing the route; the API key stops anyone reading drafts.
- **Hosting fit:** the preview route needs SSR, so on Netlify it runs as a function — fine for the *frontend*; the CMS still needs the persistent-disk host from the hosting discussion.
