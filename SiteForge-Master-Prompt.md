# MASTER PROMPT — "SiteForge": A WordPress-like Website Builder (Payload CMS v3 + AstroWind)

You are an expert full-stack engineer. Build a self-hosted, WordPress-like website-building package as a **monorepo**. The CMS is **Payload v3** (Next.js headless CMS with built-in auth, admin UI, REST + GraphQL, and its own database). The public site is **Astro**, bootstrapped from the **AstroWind** template (`onwidget/astrowind`). Content authors edit pages by stacking **blocks** in Payload's admin; the Astro site renders those blocks using AstroWind's existing widgets. Themes/templates are **swappable** because the only coupling point is a block renderer.

## Guiding principles
- **Self-hosted, no external SaaS.** Auth, database, and media all live in the project. Runs on a single VPS or any Node host.
- **Portable by default.** SQLite + local-disk media so a site's entire state is one file + one folder (the backup unit). Postgres + S3 are swap-in options behind one config file each.
- **Decoupled.** Payload owns the content model; Astro owns presentation. The block renderer maps one to the other. Swapping themes = rewriting the renderer + components, nothing else.
- **Honest reconciliation.** AstroWind's exact widget prop names must be verified against the cloned repo (Step 0). Where this prompt's schemas and the real widget props disagree, **the cloned widget wins** — adjust the renderer, not the widget.

## Tech stack (pin these)
- Monorepo: **pnpm workspaces + Turborepo**
- CMS: **Payload v3** on **Next.js App Router**, Node 20
- DB: **@payloadcms/db-sqlite** (Drizzle) default; **@payloadcms/db-postgres** optional
- Media: Payload **local-disk upload adapter** default; S3 adapter optional
- Site: **AstroWind** (Astro v6 + Tailwind CSS v4)
- Process/deploy: **pm2 + Nginx** on a VPS, and a **Docker Compose** path with named volumes

## Monorepo layout
```
siteforge/
  apps/
    cms/                 # Payload v3 inside Next.js (admin + API)
    web/                 # AstroWind-derived public site
  packages/
    shared/              # shared TS types (generated Payload types re-exported)
  nginx/                 # reverse-proxy reference config
  docker-compose.yml
  turbo.json
  pnpm-workspace.yaml
  package.json
  .env.example
```

---

## Step 0 — Scaffold & reconcile (do this first)
1. Init the monorepo (pnpm workspaces + Turborepo). Add `apps/cms`, `apps/web`, `packages/shared`.
2. **Clone AstroWind into `apps/web`** (`onwidget/astrowind`). Get it building and serving its demo content unchanged. Confirm Astro v6 + Tailwind v4.
3. **Enumerate the real widget set.** Open `apps/web/src/components/widgets/` and list every widget file and its **actual prop interface**. Produce a short `WIDGET_PROPS.md` in `apps/web` recording each widget's real props. **Treat this file as the source of truth** for Appendix A's renderer — fix any mismatch in the renderer.
4. Init Payload v3 in `apps/cms` with the SQLite adapter and local-disk media. Get the admin UI + first admin user working.
5. Wire `payload generate:types` to emit types; re-export them from `packages/shared`.

## Step 1 — Environment & config
- Root `.env.example` with: `DATABASE_URI`, `PAYLOAD_SECRET`, `PAYLOAD_PUBLIC_SERVER_URL`, `WEB_PUBLIC_URL`, `MEDIA_DIR`, `RENDER_MODE=static|ssr`, `DB_ADAPTER=sqlite|postgres`, `MEDIA_ADAPTER=local|s3`.
- One config file each for the DB swap and media swap, selected by env var. No code changes required to switch.

## Step 2 — Payload content model
Implement the collections, globals, and blocks defined in **Appendix A** (blocks) and **Appendix B** (Posts, Categories, Navigation, SiteSettings). Enable **drafts/versions** on Pages and Posts. Enable access control so only authenticated users hit the admin; public API reads are read-only for published docs.

## Step 3 — Data fetching in Astro
- A small typed Payload client in `apps/web/src/lib/payload.ts` (REST or GraphQL) that fetches published Pages by slug, Posts, Navigation, SiteSettings.
- Respect `RENDER_MODE`: **static** → `getStaticPaths` over all published slugs at build; **ssr** → Node adapter, fetch per request, with a draft-preview bypass.

## Step 4 — Block renderer (the coupling point)
Implement `apps/web/src/lib/blocks.ts` per **Appendix A**'s skeleton: a `resolveBlock(block)` that switches on `block.blockType`, returns `{ Component, props }`, applies variant logic, and converts Payload shapes → AstroWind prop shapes (Media→`{src,alt}`, richText→HTML, `anchorId`→widget `id`). A `[...slug].astro` route maps the page's `layout` array through the renderer.

## Step 5 — Pages, nav, settings
- Dynamic page route renders blocks. Header/Footer read the **Navigation** global; site-wide meta/branding read **SiteSettings**. Replace AstroWind's `config.yaml`/`navigation.ts` hardcoding with these globals.

## Step 6 — Blog refactor (highest effort)
Replace AstroWind's markdown content collection (`src/data/post/`) with **Payload Posts**:
- Permalinks, categories, tags, author, excerpt, cover image, body (richText→HTML).
- Re-implement list pagination, category/tag archives, related posts, and RSS against Payload data. Keep AstroWind's blog components/layout; only change the data source.

## Step 7 — Media
Local-disk uploads served by Payload (or by Astro in static builds by copying/proxying). Renderer adapts a Media doc to `{src, alt}`. Document the S3 swap.

## Step 8 — Deploy
- **VPS path:** Node 20 + pnpm + pm2 (cms + web processes) behind Nginx (reverse proxy, TLS). Document build vs runtime for both render modes.
- **Docker path:** `docker-compose.yml` with named volumes for the SQLite file and media dir. **Backup unit = SQLite file + media folder.**
- README: first-run setup, creating the admin, switching DB/media adapters, switching render mode, backup/restore.

## Step 9 — Seed data (demo: a food festival site)
Provide a seed script `apps/cms/src/seed/index.ts`, runnable via `pnpm --filter cms seed`, that idempotently populates a complete working demo so the build is visibly functional on first run. The demo models a real-world **annual food festival** site — multiple content pages built from blocks, a populated nav/footer, branded site settings, sponsor logos, and a few blog "food stories." Use the structure below (modeled on a real festival site: Dungarvan / West Waterford, 24–26 April 2026). All copy here is demo placeholder text you may use verbatim or lightly edit.

### Seed behavior
- **Idempotent:** look up each doc by `slug` (or global slug); upsert rather than duplicate. Safe to re-run.
- **Order:** Media → Categories → Posts → Pages → Navigation global → SiteSettings global. (Pages reference uploaded media; nav references page slugs.)
- **Media:** ship a handful of royalty-free placeholder images in `apps/cms/src/seed/assets/` (hero, producers, dining, sponsor logos x4) and upload them through Payload's local adapter so they become real Media docs with `alt` text. If assets are absent, generate simple solid-colour placeholders so the seed never fails.
- **Publish:** set every seeded Page and Post to `_status: 'published'` and a `publishedAt` in the past.
- After seeding, log the created homepage URL and admin URL.

### Site structure to create
**SiteSettings (global):**
- `siteName`: "Waterford Festival of Food"
- `tagline`: "Ireland's longest-running food festival — Dungarvan & West Waterford"
- `logo` / `favicon`: seeded media
- `defaultSeo.titleTemplate`: "%s — Waterford Festival of Food"
- `defaultSeo.metaDescription`: "A weekend celebrating the food, producers and landscapes of West Waterford. 24–26 April 2026."
- `theme.mode`: "system"; `theme.accentColor`: "#7a8b3a" (olive/green)

**Navigation (global):**
- Header links: `About`(/about), `Programme`(/programme), `Plan Your Visit`(/plan-your-visit), `Volunteer`(/volunteer)
- Header CTA button: text "View 2026 Programme", href "/programme", variant "primary"
- Footer columns:
  - "Explore" → Programme, Plan Your Visit, About, Volunteer
  - "Festival" → Sponsors (/#sponsors), Newsletter (/#newsletter), Culture Underground guide (https://cultureunderground.ie)
- Footer social: Instagram, Facebook (placeholder hrefs)
- Footer note: "An annual celebration of the food, producers and landscapes of Waterford, based in Dungarvan."
- Footer legal links: Terms (/terms), Cookies (/cookies)

**Categories:** "Producer Stories", "Festival News", "Recipes"

**Posts (3, published):**
1. "Meet the Producers Behind the Festival" — category Producer Stories; excerpt about local growers, fishers and artisan makers of West Waterford; richText body (2–3 paragraphs of demo prose); cover image = producers media.
2. "Your Weekend Guide to Dungarvan" — category Festival News; excerpt about food trails, harbour-town atmosphere and the live Culture Underground event guide; body demo prose.
3. "A Long-Table Dinner in the Comeraghs" — category Recipes; excerpt about long-table dining experiences against the Comeragh Mountains backdrop; body demo prose.

### Pages (each built from Appendix A blocks)

**Home** (`slug: "home"`):
1. `hero` — variant `centered`; tagline "24–26 April 2026"; title "Waterford Festival of Food"; subtitle "Ireland's longest-running food festival returns to Dungarvan and West Waterford this April."; actions: [ {text:"View 2026 Programme", href:"/programme", variant:"primary"}, {text:"Plan Your Visit", href:"/plan-your-visit", variant:"secondary"} ]; image: hero media; anchorId "top".
2. `note` — content "Ticket sales commence Friday 20th March 2026, with a second release on Tuesday 24th March."
3. `content` — title "A weekend of food, place and people"; richText: 1–2 paragraphs (chefs, producers, growers and food lovers gather for dining experiences, markets, tastings, talks and family activities across the region); image: dining media; isReversed false.
4. `features` — variant `grid`; columns "3"; tagline "What's on"; title "Explore the festival"; items: [ {title:"Food Trails", description:"Self-guided trails through Dungarvan's eateries and producers.", icon:"tabler:map-2"}, {title:"Markets & Tastings", description:"Artisan markets, cooking demos and producer tastings.", icon:"tabler:basket"}, {title:"Long-Table Dining", description:"Communal dining experiences set against the Comeraghs.", icon:"tabler:tools-kitchen-2"}, {title:"Talks & Demos", description:"Hear from chefs and growers behind the region's food.", icon:"tabler:microphone"}, {title:"Farm Visits", description:"Get close to where the food is grown and made.", icon:"tabler:plant-2"}, {title:"Family Events", description:"Activities for all ages across the festival weekend.", icon:"tabler:mood-kid"} ].
5. `content` — title "Taste Waterford"; richText about the people and stories behind the region's food; callToAction {text:"Discover food stories", href:"/blog", variant:"primary"}; isAfterContent true.
6. `content` — anchorId "culture-underground"; title "Live event guide — Culture Underground"; richText: explore a live, mobile-friendly event guide; find events, venue directions and what's-on-now over the weekend at cultureunderground.ie; callToAction {text:"Open the live guide", href:"https://cultureunderground.ie", variant:"secondary", target:"_blank"}.
7. `blogLatestPosts` — title "Festival stories"; information "News, producer profiles and recipes from the festival."; count 3; linkText "All stories"; linkUrl "/blog".
8. `brands` — anchorId "sponsors"; title "Festival Sponsors"; subtitle "Made possible with the support of our sponsors."; images: 4 sponsor-logo media.
9. `callToAction` — anchorId "newsletter"; title "Festival Newsletter"; subtitle "Stay up to date with festival announcements."; actions: [ {text:"Sign Up", href:"/#newsletter", variant:"primary"} ].

**About** (`slug: "about"`):
1. `hero` — variant `split`; tagline "About"; title "Celebrating West Waterford's food culture"; subtitle "Set against the backdrop of Dungarvan and the Comeragh Mountains."; image: hero media.
2. `content` — richText: 2 paragraphs on the festival being Ireland's longest-running food festival, bringing chefs, producers, growers and food lovers together each April for dining, markets, talks, tastings, food trails and family events.
3. `stats` — stats: [ {amount:"15+", title:"Years running"}, {amount:"3", title:"Festival days"}, {amount:"50+", title:"Producers & venues"} ].
4. `callToAction` — title "Want to get involved?"; subtitle "Volunteers help make the festival happen."; actions: [ {text:"Volunteer with us", href:"/volunteer", variant:"primary"} ].

**Programme** (`slug: "programme"`):
1. `hero` — variant `centered`; tagline "24–26 April 2026"; title "2026 Programme"; subtitle "Three days of dining, markets, talks and trails across Dungarvan and West Waterford."
2. `steps` — variant `timeline`; title "Festival weekend"; items: [ {title:"Friday 24 April — Opening & Long-Table Dinner", description:"The festival opens with a communal dining experience.", icon:"tabler:glass-full"}, {title:"Saturday 25 April — Markets, Demos & Trails", description:"Artisan markets, cooking demonstrations and self-guided food trails.", icon:"tabler:basket"}, {title:"Sunday 26 April — Farm Visits & Family Day", description:"Producer visits and family-friendly activities to close the weekend.", icon:"tabler:plant-2"} ].
3. `faqs` — columns "2"; title "Programme FAQs"; items: [ {title:"When do tickets go on sale?", description:"Ticket sales commence Friday 20th March 2026, with a second release on Tuesday 24th March."}, {title:"Where do events take place?", description:"Across Dungarvan town and the surrounding West Waterford countryside."}, {title:"Is there a live event guide?", description:"Yes — a mobile-friendly guide is available via Culture Underground at cultureunderground.ie."}, {title:"Are events family friendly?", description:"Many events are suitable for all ages, including farm visits and a family day."} ].

**Plan Your Visit** (`slug: "plan-your-visit"`):
1. `hero` — variant `centered`; tagline "Plan Your Visit"; title "Getting to Dungarvan"; subtitle "A harbour town on Ireland's south-east coast, in the heart of West Waterford."
2. `content` — title "Where to find us"; richText: demo travel/parking/accommodation guidance; image: dining media.
3. `features` — variant `twocol`; columns "2"; title "Good to know"; items: [ {title:"Getting here", description:"By car via the N25; regional bus links to Dungarvan.", icon:"tabler:car"}, {title:"Where to stay", description:"Hotels, guesthouses and B&Bs in and around the town.", icon:"tabler:bed"}, {title:"Accessibility", description:"Many venues are accessible; check the live guide for details.", icon:"tabler:accessible"}, {title:"Live guide", description:"Use Culture Underground for venue directions and what's-on-now.", icon:"tabler:map-pin"} ].

**Volunteer** (`slug: "volunteer"`):
1. `hero` — variant `centered`; tagline "Volunteer"; title "Be part of the festival"; subtitle "Volunteers are at the heart of the Waterford Festival of Food."
2. `content` — richText: demo copy on what volunteering involves and why people get involved.
3. `callToAction` — title "Register your interest"; subtitle "We'll be in touch with roles and times."; actions: [ {text:"Sign up to volunteer", href:"/#newsletter", variant:"primary"} ].

### Seed file shape (implement)
```ts
// apps/cms/src/seed/index.ts
import payload from 'payload';

export async function seed() {
  // 1. Media — upload assets from ./assets, capture returned IDs
  const heroImg     = await upsertMedia('hero.jpg', 'Festival crowd in Dungarvan');
  const diningImg   = await upsertMedia('dining.jpg', 'Long-table dining experience');
  const producersImg= await upsertMedia('producers.jpg', 'Local food producers');
  const sponsors    = await Promise.all(
    ['sponsor-1.png','sponsor-2.png','sponsor-3.png','sponsor-4.png']
      .map((f,i) => upsertMedia(f, `Festival sponsor ${i+1}`)));

  // 2. Categories
  const cats = await upsertCategories(['Producer Stories','Festival News','Recipes']);

  // 3. Posts (published) — bodies as richText, cover images from media
  await upsertPosts(/* 3 posts per spec, referencing cats + media */);

  // 4. Pages (published) — layout arrays of blocks per spec above
  await upsertPage('home', /* blocks... */);
  await upsertPage('about', /* blocks... */);
  await upsertPage('programme', /* blocks... */);
  await upsertPage('plan-your-visit', /* blocks... */);
  await upsertPage('volunteer', /* blocks... */);

  // 5 & 6. Globals
  await setNavigation(/* header links + CTA + footer per spec */);
  await setSiteSettings(/* branding + SEO + theme per spec */);
}

// upsertX helpers: find by slug; if exists, update; else create. Always idempotent.
```

- Wire a `seed` script in `apps/cms/package.json` that boots Payload (init config) then calls `seed()`.
- Document in the README: `pnpm --filter cms seed` populates the demo; deleting the SQLite file + re-running resets it.

## Acceptance criteria
- Fresh clone → `.env` from example → one bootstrap command → admin UI live, first admin creatable.
- Running the seed produces a working multi-page festival site (Home, About, Programme, Plan Your Visit, Volunteer), populated nav/footer, sponsors, newsletter CTA, and 3 blog posts — all rendered through AstroWind widgets.
- Author can build a page from all Appendix A blocks and publish; the Astro site renders it via AstroWind widgets.
- Blog fully driven by Payload (archives, pagination, RSS, related).
- Swapping `DB_ADAPTER`, `MEDIA_ADAPTER`, and `RENDER_MODE` each works via env only.
- Backing up the SQLite file + media folder fully captures site state.

---

## Appendix A — Block ↔ AstroWind Widget Mapping & Payload Schema

> **Reconcile against Step 0's `WIDGET_PROPS.md`.** Confidence on exact AstroWind prop names is ~80%; where they differ, fix the renderer, not the widget.

### Reusable field groups (define once in `apps/cms/src/fields/`, import into blocks)
```ts
export const headlineFields = [
  { name: 'tagline',  type: 'text' },
  { name: 'title',    type: 'text' },
  { name: 'subtitle', type: 'textarea' },
];

export const appearanceFields = [
  { name: 'anchorId',   type: 'text', admin: { description: 'Optional #anchor id' } },
  { name: 'isDark',     type: 'checkbox', defaultValue: false },
  { name: 'background', type: 'select', defaultValue: 'default', options: ['default','muted','none'] },
];

export const actionsField = {
  name: 'actions', type: 'array', labels: { singular: 'Button', plural: 'Buttons' },
  fields: [
    { name: 'variant', type: 'select', defaultValue: 'secondary', options: ['primary','secondary','tertiary','link'] },
    { name: 'text',   type: 'text', required: true },
    { name: 'href',   type: 'text', required: true },
    { name: 'icon',   type: 'text', admin: { description: 'astro-icon name, e.g. tabler:rocket' } },
    { name: 'target', type: 'select', defaultValue: '_self', options: ['_self','_blank'] },
  ],
};

export const callToActionField = {
  name: 'callToAction', type: 'group',
  fields: [
    { name: 'variant', type: 'select', defaultValue: 'primary', options: ['primary','secondary','tertiary','link'] },
    { name: 'text', type: 'text' }, { name: 'href', type: 'text' },
    { name: 'icon', type: 'text' }, { name: 'target', type: 'select', defaultValue: '_self', options: ['_self','_blank'] },
  ],
};

export const itemsField = {
  name: 'items', type: 'array', labels: { singular: 'Item', plural: 'Items' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'icon', type: 'text', admin: { description: 'astro-icon name' } },
  ],
};
```

### Mapping table
| Block (`blockType`) | AstroWind widget(s) | Variant selector → widget |
|---|---|---|
| `hero` | Hero, Hero2 | `centered`→Hero, `split`→Hero2 |
| `features` | Features, Features2, Features3 | `grid`→Features, `twocol`→Features2, `image`→Features3 |
| `content` | Content | — |
| `steps` | Steps, Steps2 | `timeline`→Steps, `twocol`→Steps2 |
| `stats` | Stats | — |
| `faqs` | FAQs | — |
| `pricing` | Pricing | — |
| `testimonials` | Testimonials | — |
| `brands` | Brands | — |
| `callToAction` | CallToAction | — |
| `blogLatestPosts` | BlogLatestPosts | — |
| `note` | Note | — |

### Per-block Payload schemas
```ts
// HeroBlock
{ slug: 'hero', fields: [
  { name: 'variant', type: 'select', defaultValue: 'centered', options: ['centered','split'] },
  ...headlineFields,
  { name: 'content', type: 'richText' },
  actionsField,
  { name: 'image', type: 'upload', relationTo: 'media' },
  ...appearanceFields,
]}

// FeaturesBlock
{ slug: 'features', fields: [
  { name: 'variant', type: 'select', defaultValue: 'grid', options: ['grid','twocol','image'] },
  ...headlineFields,
  { name: 'columns', type: 'select', defaultValue: '3', options: ['2','3'] },
  { name: 'image', type: 'upload', relationTo: 'media',
    admin: { condition: (_, s) => s.variant === 'image' } },
  itemsField,
  ...appearanceFields,
]}

// ContentBlock
{ slug: 'content', fields: [
  ...headlineFields,
  { name: 'content', type: 'richText' },
  { name: 'image', type: 'upload', relationTo: 'media' },
  { name: 'columns', type: 'select', defaultValue: '2', options: ['1','2'] },
  itemsField,
  callToActionField,
  { name: 'isReversed', type: 'checkbox', defaultValue: false },
  { name: 'isAfterContent', type: 'checkbox', defaultValue: false },
  ...appearanceFields,
]}

// StepsBlock
{ slug: 'steps', fields: [
  { name: 'variant', type: 'select', defaultValue: 'timeline', options: ['timeline','twocol'] },
  ...headlineFields,
  itemsField,
  { name: 'image', type: 'upload', relationTo: 'media',
    admin: { condition: (_, s) => s.variant === 'timeline' } },
  callToActionField,
  { name: 'isReversed', type: 'checkbox', defaultValue: false },
  ...appearanceFields,
]}

// StatsBlock
{ slug: 'stats', fields: [
  ...headlineFields,
  { name: 'stats', type: 'array', fields: [
    { name: 'amount', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text' },
  ]},
  ...appearanceFields,
]}

// FaqsBlock
{ slug: 'faqs', fields: [
  ...headlineFields,
  { name: 'columns', type: 'select', defaultValue: '2', options: ['1','2'] },
  { name: 'items', type: 'array', fields: [
    { name: 'title', type: 'text' },          // question
    { name: 'description', type: 'textarea' }, // answer
    { name: 'icon', type: 'text' },
  ]},
  ...appearanceFields,
]}

// PricingBlock
{ slug: 'pricing', fields: [
  ...headlineFields,
  { name: 'prices', type: 'array', fields: [
    { name: 'title', type: 'text' },
    { name: 'subtitle', type: 'text' },
    { name: 'price', type: 'text' },
    { name: 'period', type: 'text' },
    { name: 'items', type: 'array', fields: [ { name: 'description', type: 'text' } ] },
    { name: 'hasRibbon', type: 'checkbox', defaultValue: false },
    { name: 'ribbonTitle', type: 'text' },
    callToActionField,
  ]},
  ...appearanceFields,
]}

// TestimonialsBlock
{ slug: 'testimonials', fields: [
  ...headlineFields,
  { name: 'testimonials', type: 'array', fields: [
    { name: 'testimonial', type: 'textarea' },
    { name: 'name', type: 'text' },
    { name: 'job', type: 'text' },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ]},
  callToActionField,
  ...appearanceFields,
]}

// BrandsBlock
{ slug: 'brands', fields: [
  ...headlineFields,
  { name: 'images', type: 'array', fields: [ { name: 'image', type: 'upload', relationTo: 'media' } ] },
  ...appearanceFields,
]}

// CallToActionBlock
{ slug: 'callToAction', fields: [
  ...headlineFields,
  actionsField,
  ...appearanceFields,
]}

// BlogLatestPostsBlock
{ slug: 'blogLatestPosts', fields: [
  { name: 'title', type: 'text' },
  { name: 'information', type: 'textarea' },
  { name: 'count', type: 'number', defaultValue: 4 },
  { name: 'linkText', type: 'text' },
  { name: 'linkUrl', type: 'text' },
  ...appearanceFields,
]}

// NoteBlock
{ slug: 'note', fields: [ { name: 'content', type: 'text' } ]}
```

### Register blocks on Pages
```ts
export const pageBlocks = {
  name: 'layout', type: 'blocks',
  blocks: [
    HeroBlock, FeaturesBlock, ContentBlock, StepsBlock, StatsBlock,
    FaqsBlock, PricingBlock, TestimonialsBlock, BrandsBlock,
    CallToActionBlock, BlogLatestPostsBlock, NoteBlock,
  ],
};
```

### Renderer skeleton (`apps/web/src/lib/blocks.ts`)
```ts
import Hero from '@/components/widgets/Hero.astro';
import Hero2 from '@/components/widgets/Hero2.astro';
import Features from '@/components/widgets/Features.astro';
import Features2 from '@/components/widgets/Features2.astro';
import Features3 from '@/components/widgets/Features3.astro';
import Content from '@/components/widgets/Content.astro';
import Steps from '@/components/widgets/Steps.astro';
import Steps2 from '@/components/widgets/Steps2.astro';
import Stats from '@/components/widgets/Stats.astro';
import FAQs from '@/components/widgets/FAQs.astro';
import Pricing from '@/components/widgets/Pricing.astro';
import Testimonials from '@/components/widgets/Testimonials.astro';
import Brands from '@/components/widgets/Brands.astro';
import CallToAction from '@/components/widgets/CallToAction.astro';
import BlogLatestPosts from '@/components/widgets/BlogLatestPosts.astro';
import Note from '@/components/widgets/Note.astro';

// --- shape helpers (Payload → AstroWind) ---
const media = (m) => m ? { src: m.url ?? m.filename, alt: m.alt ?? '' } : undefined;
const html  = (rt) => renderRichTextToHtml(rt);        // implement against Payload richText
const base  = (b) => ({ id: b.anchorId || undefined }); // anchorId → widget id

export function resolveBlock(block) {
  switch (block.blockType) {
    case 'hero':
      return { Component: block.variant === 'split' ? Hero2 : Hero,
        props: { ...base(block), tagline: block.tagline, title: block.title,
          subtitle: block.subtitle, content: html(block.content),
          actions: block.actions, image: media(block.image) } };

    case 'features': {
      const C = block.variant === 'twocol' ? Features2
              : block.variant === 'image'  ? Features3 : Features;
      return { Component: C, props: { ...base(block), title: block.title,
        subtitle: block.subtitle, tagline: block.tagline,
        columns: Number(block.columns), items: block.items, image: media(block.image) } };
    }

    case 'content':
      return { Component: Content, props: { ...base(block), title: block.title,
        subtitle: block.subtitle, tagline: block.tagline, content: html(block.content),
        image: media(block.image), columns: Number(block.columns), items: block.items,
        callToAction: block.callToAction, isReversed: block.isReversed,
        isAfterContent: block.isAfterContent } };

    case 'steps':
      return { Component: block.variant === 'twocol' ? Steps2 : Steps,
        props: { ...base(block), title: block.title, subtitle: block.subtitle,
          tagline: block.tagline, items: block.items, image: media(block.image),
          callToAction: block.callToAction, isReversed: block.isReversed } };

    case 'stats':
      return { Component: Stats, props: { ...base(block), title: block.title,
        subtitle: block.subtitle, tagline: block.tagline, stats: block.stats } };

    case 'faqs':
      return { Component: FAQs, props: { ...base(block), title: block.title,
        subtitle: block.subtitle, tagline: block.tagline,
        columns: Number(block.columns), items: block.items } };

    case 'pricing':
      return { Component: Pricing, props: { ...base(block), title: block.title,
        subtitle: block.subtitle, tagline: block.tagline,
        prices: block.prices.map(p => ({ ...p,
          items: p.items, callToAction: p.callToAction })) } };

    case 'testimonials':
      return { Component: Testimonials, props: { ...base(block), title: block.title,
        subtitle: block.subtitle, tagline: block.tagline,
        testimonials: block.testimonials.map(t => ({ ...t, image: media(t.image) })),
        callToAction: block.callToAction } };

    case 'brands':
      return { Component: Brands, props: { ...base(block), title: block.title,
        subtitle: block.subtitle, tagline: block.tagline,
        images: block.images.map(i => media(i.image)) } };

    case 'callToAction':
      return { Component: CallToAction, props: { ...base(block), title: block.title,
        subtitle: block.subtitle, tagline: block.tagline, actions: block.actions } };

    case 'blogLatestPosts':
      return { Component: BlogLatestPosts, props: { ...base(block), title: block.title,
        information: block.information, count: block.count,
        linkText: block.linkText, linkUrl: block.linkUrl } };

    case 'note':
      return { Component: Note, props: { ...base(block), content: block.content } };

    default:
      return null; // unknown block: skip (and warn in dev)
  }
}
```

**Renderer contract:** every block converts Payload shapes to AstroWind prop shapes — Media upload→`{src,alt}`, richText→HTML for `content`, `anchorId`→widget `id`. If a widget's real prop names differ (per `WIDGET_PROPS.md`), adjust here.

---

## Appendix B — Non-block Collections & Globals

```ts
// Collection: Media (upload)
{ slug: 'media', upload: { staticDir: process.env.MEDIA_DIR ?? 'media' },
  fields: [ { name: 'alt', type: 'text' } ] }

// Collection: Categories
{ slug: 'categories', admin: { useAsTitle: 'title' }, fields: [
  { name: 'title', type: 'text', required: true },
  { name: 'slug', type: 'text', required: true, unique: true,
    admin: { description: 'URL segment, e.g. tutorials' } },
  { name: 'description', type: 'textarea' },
]}

// Collection: Posts (drafts/versions ON)
{ slug: 'posts', admin: { useAsTitle: 'title' },
  versions: { drafts: true },
  access: { read: ({ req }) => req.user ? true : { _status: { equals: 'published' } } },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'excerpt', type: 'textarea' },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'body', type: 'richText', required: true },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    { name: 'tags', type: 'array', fields: [ { name: 'tag', type: 'text' } ] },
    { name: 'publishedAt', type: 'date' },
    { name: 'seo', type: 'group', fields: [
      { name: 'metaTitle', type: 'text' },
      { name: 'metaDescription', type: 'textarea' },
      { name: 'ogImage', type: 'upload', relationTo: 'media' },
    ]},
  ]}

// Collection: Pages (drafts/versions ON; hosts the block layout)
{ slug: 'pages', admin: { useAsTitle: 'title' },
  versions: { drafts: true },
  access: { read: ({ req }) => req.user ? true : { _status: { equals: 'published' } } },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true,
      admin: { description: 'Use "home" or "/" for the homepage' } },
    pageBlocks, // from Appendix A
    { name: 'seo', type: 'group', fields: [
      { name: 'metaTitle', type: 'text' },
      { name: 'metaDescription', type: 'textarea' },
      { name: 'ogImage', type: 'upload', relationTo: 'media' },
    ]},
  ]}

// Global: Navigation (replaces AstroWind navigation.ts)
{ slug: 'navigation', fields: [
  { name: 'header', type: 'group', fields: [
    { name: 'links', type: 'array', fields: [
      { name: 'text', type: 'text', required: true },
      { name: 'href', type: 'text' },
      { name: 'submenu', type: 'array', fields: [
        { name: 'text', type: 'text' }, { name: 'href', type: 'text' },
      ]},
    ]},
    actionsField, // header CTA buttons
  ]},
  { name: 'footer', type: 'group', fields: [
    { name: 'columns', type: 'array', fields: [
      { name: 'title', type: 'text' },
      { name: 'links', type: 'array', fields: [
        { name: 'text', type: 'text' }, { name: 'href', type: 'text' },
      ]},
    ]},
    { name: 'socialLinks', type: 'array', fields: [
      { name: 'label', type: 'text' },
      { name: 'icon', type: 'text', admin: { description: 'astro-icon name' } },
      { name: 'href', type: 'text' },
    ]},
    { name: 'note', type: 'text' },
    { name: 'legalLinks', type: 'array', fields: [
      { name: 'text', type: 'text' }, { name: 'href', type: 'text' },
    ]},
  ]},
]}

// Global: SiteSettings (replaces AstroWind config.yaml)
{ slug: 'siteSettings', fields: [
  { name: 'siteName', type: 'text', required: true },
  { name: 'tagline', type: 'text' },
  { name: 'logo', type: 'upload', relationTo: 'media' },
  { name: 'favicon', type: 'upload', relationTo: 'media' },
  { name: 'defaultSeo', type: 'group', fields: [
    { name: 'metaTitle', type: 'text' },
    { name: 'titleTemplate', type: 'text', admin: { description: 'e.g. %s — My Site' } },
    { name: 'metaDescription', type: 'textarea' },
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
  ]},
  { name: 'analytics', type: 'group', fields: [
    { name: 'googleAnalyticsId', type: 'text' },
  ]},
  { name: 'theme', type: 'group', fields: [
    { name: 'mode', type: 'select', defaultValue: 'system', options: ['light','dark','system'] },
    { name: 'accentColor', type: 'text' },
  ]},
]}
```

**Notes for the agent:**
- `users` is Payload's built-in auth collection — don't redefine it; just reference it (`relationTo: 'users'`).
- Add a `slugField` hook to auto-generate slugs from titles where empty.
- The Astro blog routes (Step 6) read `posts` + `categories`; Header/Footer read `navigation`; `<head>`/branding read `siteSettings`. Map each AstroWind hardcoded source to its global.
- The Step 9 seed must satisfy these schemas exactly — every seeded block's fields map to an Appendix A block; every page/post/global maps to Appendix B.
