# AstroWind Widget Props — Source of Truth (Step 0.3)

Enumerated from the cloned `onwidget/astrowind` (`beta.63`, Astro 6.4.2, Tailwind v4).
Verified against `apps/web/src/types.d.ts` and each widget's `Astro.props` destructure.
**Where the master prompt's schema disagrees with this file, the renderer is adjusted — not the widget.**

## Shared base (`Widget` in `types.d.ts`)
```ts
interface Widget { id?: string; isDark?: boolean; bg?: string; classes?: Record<string,...> }
interface Headline { title?: string; subtitle?: string; tagline?: string }
interface Image { src: string; alt?: string }
interface CallToAction { variant?: 'primary'|'secondary'|'tertiary'|'link'; text?: string; href?: string; icon?: string; target?: string }
interface Item { title?: string; description?: string; icon?: string; callToAction?: CallToAction; image?: Image }
```

### Renderer mapping rules derived from this
- `anchorId` → `id`  (widgets use `id`, never `anchorId`).
- `isDark` passes through unchanged.
- `background` (`default | muted | none`) → `bg` raw markup (Step 11). `muted` paints a theme-driven `--aw-color-bg-muted` tint; `default`/`none` leave the widget's transparent default. Mapping is centralised in `SURFACE` in `lib/blocks.ts`.
- Media upload doc → `{ src, alt, width, height }`. Widgets spread `{...image}` into `<Image>` (e.g. `Hero`, `Content`), and Astro requires `width`/`height` for remote images, so all four keys are forwarded. Payload stores `width`/`height` on image uploads.
- `richText` → HTML string for `content` props.
- Remote (CMS) image URLs are passed through un-optimized (CMS host intentionally **not** allow-listed in `astro.config` so static builds stay decoupled from a running CMS).

## Per-widget real props

| Widget | Real props (from source) | Notes |
|---|---|---|
| `Hero` | `title, subtitle, tagline, content, actions, image, id, bg` | `actions: string \| CallToAction[]`; `image` spread into `<Image>` |
| `Hero2` | same as `Hero` | split layout; no `isDark` (uses `bg`) |
| `Features` | `title, subtitle, tagline, image, items, columns, defaultIcon, isBeforeContent, isAfterContent, id, isDark, bg` | `columns: number` |
| `Features2` | `title, subtitle, tagline, items, columns, defaultIcon, id, isDark, bg` | |
| `Features3` | `title, subtitle, tagline, image, items, columns, defaultIcon, isBeforeContent, isAfterContent, id, isDark, bg` | |
| `Content` | `title, subtitle, tagline, content, callToAction, items, columns, image, isReversed, isAfterContent, id, isDark, bg` | |
| `Steps` | `title, subtitle, tagline, items, callToAction, image, isReversed, id, isDark, bg` | |
| `Steps2` | `title, subtitle, tagline, items, callToAction, isReversed, id, isDark, bg` | no `image` |
| `Stats` | `title, subtitle, tagline, stats, id, isDark, bg` | `Stat: { amount, title, icon }` (`amount: number\|string`) |
| `FAQs` | `title, subtitle, tagline, items, columns, id, isDark, bg` | `Item.title` = question, `Item.description` = answer |
| `Pricing` | `title, subtitle, tagline, prices, id, isDark, bg` | `Price: { title, subtitle, description, price, period, items[], callToAction, hasRibbon, ribbonTitle }` |
| `Testimonials` | `title, subtitle, tagline, testimonials, callToAction, id, isDark, bg` | `Testimonial: { title, testimonial, name, job, image }` |
| `Brands` | `title, subtitle, tagline, icons, images, id, isDark, bg` | `images: Image[]` rendered via `image.src` |
| `CallToAction` | `title, subtitle, tagline, actions, callToAction, id, isDark, bg` | |
| `BlogLatestPosts` | `title, linkText, linkUrl, information, count, id, isDark, bg` | reads posts via `findLatestPosts` (we re-point to Payload) |
| `Note` | `icon, title, description` | **No `id`, no `content`.** Map `NoteBlock.content` → `description` |

## Disagreements with master prompt (renderer-side fixes)
1. **Note**: prompt block has `content`; widget wants `description`. Renderer maps `content → description`.
2. **anchorId/background**: prompt uses `anchorId`/`background`; widgets use `id`/`bg`. Renderer maps `anchorId → id`, and `background → bg` markup via the `SURFACE` map (Step 11 design system).
3. **Media**: renderer's `media()` returns `{src, alt, width, height}` (prompt only mentioned `{src, alt}`).
4. **Pricing `price`/`amount`**: widget `Price.price` and `Stat.amount` accept `number | string`; seed/strings pass through fine.
