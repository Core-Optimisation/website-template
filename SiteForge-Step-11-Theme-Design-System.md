# Step 11 — Theme / Design System

> **Where this fits:** This step extends the SiteForge master prompt. It assumes Steps 0–9 (scaffold, content model, block renderer, pages/nav/settings, blog, media, deploy, seed) and Appendices A–C are in place. Step 11 turns the *implicit* theming already present in the build — the `SiteSettings.theme` global, the per-block `appearanceFields`, and the `resolveBlock()` seam — into an **explicit, documented design system** so a site can be restyled or fully re-themed **without touching content**.

## Guiding principle (restated for theming)

**Swapping themes = rewriting the renderer + components, nothing else.** Payload owns the content model; Astro owns presentation. Content authors stack blocks; the theme decides how those blocks *look*. The only coupling point is `resolveBlock()` (`apps/web/src/lib/blocks.ts`). Everything in this step is built so that:

- **Content is theme-agnostic.** A `hero` block is the same data whether it renders in AstroWind, a future custom theme, or a different framework entirely.
- **Theme decisions live in two places only:** the `SiteSettings.theme` global (site-wide tokens) and the per-block `appearanceFields` (local overrides). Authors never edit CSS; designers never edit content.
- **Restyle ≠ rebuild.** Changing the accent colour, dark/light mode, or section backgrounds is a config change. Replacing the *entire* look is a renderer + component swap — and the content, collections, and seed data survive untouched.

---

## Step 11.1 — The theme token source of truth (`SiteSettings.theme`)

The `SiteSettings` global (Appendix B) already carries a `theme` group. Treat it as the **single source of truth** for site-wide design tokens. Keep its shape, and extend it only with tokens the AstroWind widgets can actually consume (reconcile against `WIDGET_PROPS.md` from Step 0).

```ts
// Global: SiteSettings — theme group (extends Appendix B)
{ name: 'theme', type: 'group', fields: [
  { name: 'mode',        type: 'select', defaultValue: 'system',
    options: ['light','dark','system'] },
  { name: 'accentColor', type: 'text',
    admin: { description: 'Primary brand colour, hex e.g. #7a8b3a' } },
  // Optional extensions — only add tokens a widget/Tailwind layer reads:
  { name: 'headingFont', type: 'text',
    admin: { description: 'CSS font-family stack for headings (optional)' } },
  { name: 'bodyFont',    type: 'text',
    admin: { description: 'CSS font-family stack for body (optional)' } },
  { name: 'radius',      type: 'select', defaultValue: 'md',
    options: ['none','sm','md','lg','full'],
    admin: { description: 'Global corner radius scale' } },
]}
```

**Rule of restraint:** do not add a token unless a widget or the Tailwind layer reads it. An unused token is a lie in the admin UI. The seed (Step 9) sets `theme.mode: "system"` and `theme.accentColor: "#7a8b3a"` (olive/green); any new token must ship a sensible default so existing seeds keep working.

---

## Step 11.2 — How tokens reach the browser (the token bridge)

Tailwind CSS v4 is configured via CSS custom properties (`@theme` / `:root` variables), which makes it a natural target for runtime tokens. Bridge `SiteSettings.theme` → CSS variables → Tailwind utilities in **one place** so widgets stay declarative.

1. **Fetch once.** The Payload client (`apps/web/src/lib/payload.ts`, Step 3) already fetches `SiteSettings`. Read `theme` alongside branding.
2. **Emit CSS variables in the layout head.** In AstroWind's base layout (the `<head>` you wired in Step 5), render a small `<style>` block that maps tokens to custom properties:

```astro
---
// apps/web/src/layouts/Layout.astro (or AstroWind's base layout)
import { getSiteSettings } from '@/lib/payload';
const { theme } = await getSiteSettings();
const accent = theme?.accentColor ?? '#7a8b3a';
const radius = { none:'0', sm:'.25rem', md:'.5rem', lg:'1rem', full:'9999px' }[theme?.radius ?? 'md'];
---
<style is:global define:vars={{ accent, radius }}>
  :root {
    --aw-color-accent: var(--accent);
    --aw-radius: var(--radius);
  }
</style>
```

3. **Mode (light/dark/system).** Map `theme.mode` to AstroWind's existing dark-mode mechanism (it ships a class/`data-theme` toggle). `system` → respect `prefers-color-scheme`; `light`/`dark` → force the class and skip the toggle. Do **not** invent a second dark-mode system — drive AstroWind's.
4. **Tailwind consumes the variables.** In `tailwind.config`/CSS, point the accent/radius utilities at `--aw-color-accent` / `--aw-radius` so every widget that uses the brand colour updates from one global edit.

**Net effect:** changing `accentColor` in the admin re-skins buttons, links, and accents across every page with no rebuild in SSR mode, and a single rebuild in static mode.

---

## Step 11.3 — Per-block appearance overrides (`appearanceFields`)

Every block imports `appearanceFields` (Appendix A) — the **local** counterpart to the global theme:

```ts
export const appearanceFields = [
  { name: 'anchorId',   type: 'text',
    admin: { description: 'Optional #anchor id' } },
  { name: 'isDark',     type: 'checkbox', defaultValue: false },
  { name: 'background', type: 'select', defaultValue: 'default',
    options: ['default','muted','none'] },
];
```

Contract for the renderer:

- **`anchorId` → widget `id`.** Already handled by `base(block)` in `resolveBlock()`. Lets authors deep-link sections (e.g. `#sponsors`, `#newsletter` from the seed).
- **`isDark` → widget dark treatment.** Pass through to the AstroWind widget's dark/inverse prop (verify the exact prop name in `WIDGET_PROPS.md`; AstroWind widgets commonly accept an `isDark` or a `bg`/`classes` hook). A single block can be dark on an otherwise-light page.
- **`background` → section surface.** Map `default | muted | none` to AstroWind's background/`bg` convention (muted = the soft section tint; none = transparent, lets the page background show). Centralise this mapping in one helper so every block is consistent.

These three fields give authors **safe, bounded** appearance control — they can vary rhythm (alternating muted/none sections, an occasional dark band) without ever being able to break the design, because the *options are the design system*.

---

## Step 11.4 — Wire appearance into `resolveBlock()`

Appearance handling belongs in the **one seam**, not scattered across components. Extend the renderer's shared helpers so every block inherits theming uniformly:

```ts
// apps/web/src/lib/blocks.ts — shared appearance helper
const appearance = (b) => ({
  id:      b.anchorId || undefined,        // anchorId → widget id
  isDark:  b.isDark || undefined,          // local dark override
  bg:      b.background ?? 'default',       // surface token (map in widget layer)
});

// fold it into every case via spread, replacing the old base():
case 'features': {
  const C = block.variant === 'twocol' ? Features2
          : block.variant === 'image'  ? Features3 : Features;
  return { Component: C, props: { ...appearance(block),
    title: block.title, subtitle: block.subtitle, tagline: block.tagline,
    columns: Number(block.columns), items: block.items,
    image: media(block.image) } };
}
```

**Renderer contract (theming addendum):** every block converts Payload appearance fields → AstroWind appearance props in `resolveBlock()`. If a widget's real prop names differ (per `WIDGET_PROPS.md`), adjust **here** — never fork the widget. The block schema, the seam, and the widget stay independently swappable.

---

## Step 11.5 — Swapping or replacing a theme

Two tiers, by effort:

**Tier 1 — Restyle (config only, no code).**
- Change `theme.accentColor`, `theme.mode`, fonts, or `radius` in `SiteSettings`.
- Toggle per-section `isDark` / `background` on individual blocks.
- Result: new look, same components. Static build → one rebuild; SSR → immediate.

**Tier 2 — Re-theme (swap the presentation layer).**
- Replace AstroWind's widgets with a new component set (or a different framework's components).
- Rewrite `resolveBlock()` to map the **same** `block.blockType`s to the new components, and re-implement the four shape helpers (`media` → `{src,alt}`, `html` → richText→HTML, `appearance` → new props, variant selectors).
- Re-point the token bridge (Step 11.2) at the new theme's variables.
- **Untouched:** all Payload collections, globals, blocks, posts, pages, media, and the Step 9 seed. Content has zero awareness that the theme changed.

This is the payoff of the decoupling principle: the renderer is the membrane. Everything on the Payload side of it is portable; everything on the Astro side is replaceable.

---

## Step 11.6 — Document the design system (`apps/web/THEME.md`)

Produce a short `apps/web/THEME.md` so the next developer (or the agent on a future run) can re-theme confidently. It must record:

- **Token catalogue:** every `SiteSettings.theme` field, its type, default, and which widget(s)/CSS variable consume it.
- **The token bridge:** where `theme` → CSS variables happens (the layout head), and which Tailwind utilities read them.
- **Appearance mapping:** how `isDark` and `background` (default/muted/none) translate to AstroWind props/classes.
- **Mode handling:** how `theme.mode` drives AstroWind's dark-mode toggle.
- **Re-theme checklist:** the Tier 2 steps above, plus a pointer to `WIDGET_PROPS.md` as the source of truth for prop names.

Treat `THEME.md` as the design-system counterpart to `WIDGET_PROPS.md`: one records *what the widgets accept*, the other records *how the brand maps onto them*.

---

## Acceptance criteria (Step 11)

- Editing `SiteSettings.theme.accentColor` re-skins brand accents site-wide (one rebuild in static mode, immediate in SSR) with **no content or component edits**.
- `theme.mode` of `light` / `dark` / `system` correctly drives AstroWind's dark-mode behaviour; `system` honours `prefers-color-scheme`.
- A single block set to `isDark: true` renders dark on an otherwise-light page; `background: muted | none` changes that section's surface — all via the admin, no CSS.
- `anchorId` continues to emit a working `#id` on the rendered section (deep links from nav/seed resolve).
- All appearance handling flows through `resolveBlock()`; no per-component theming forks exist.
- A documented Tier 2 re-theme (swap widgets + rewrite the renderer mappings) yields a visually different site while **every Payload collection, global, and the Step 9 seed remain byte-for-byte unchanged**.
- `apps/web/THEME.md` exists and accurately maps every theme token to its consumer.
