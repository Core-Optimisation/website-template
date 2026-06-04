# THEME.md — Design System (Step 11)

The companion to `WIDGET_PROPS.md`. That file records *what the AstroWind widgets
accept*; this file records *how the brand maps onto them*. Content is theme-agnostic:
swapping themes means rewriting the renderer + components, nothing on the Payload side.

## Token catalogue — `SiteSettings.theme`

Single source of truth: the `theme` group on the `SiteSettings` global
(`apps/cms/src/globals/SiteSettings.ts`). Every token ships a default so existing
seeds keep working.

| Token | Type | Default | Consumed by |
|---|---|---|---|
| `mode` | select `light \| dark \| system` | `system` | Inline mode script in `Layout.astro` → AstroWind `.dark` class + `localStorage.theme` |
| `accentColor` | text (hex) | `#7a8b3a` | `--aw-color-primary`, `--aw-color-secondary`, `--aw-color-accent` |
| `headingFont` | text (CSS font stack) | — (falls back to AstroWind) | `--aw-font-heading` |
| `bodyFont` | text (CSS font stack) | — (falls back to AstroWind) | `--aw-font-sans` |
| `radius` | select `none \| sm \| md \| lg \| full` | `md` | `--aw-radius` (the `btn` utility in `tailwind.css`) |

## The token bridge

`apps/web/src/layouts/Layout.astro` fetches `getSiteSettings()` once and emits a
small `<style is:global define:vars>` block in `<head>`, **after** `CustomStyles`
so it wins the cascade:

```
:root, .dark {
  --aw-color-primary / -secondary / -accent: <accentColor>;
  --aw-radius: <radius mapped from none|sm|md|lg|full>;
}
```

- `accentColor` is set under both `:root` and `.dark` so the brand re-skins in either mode.
- `radius` maps `none→0, sm→.25rem, md→.5rem, lg→1rem, full→9999px`.
- `headingFont` / `bodyFont` emit `--aw-font-heading` / `--aw-font-sans` only when set.
- Tailwind already aliases `--color-primary/-accent` and `--font-*` to these
  `--aw-*` variables (`apps/web/src/assets/styles/tailwind.css`), so every widget
  updates from one global edit. SSR → immediate; static → one rebuild.

Defaults for `--aw-radius`, `--aw-color-bg-muted`, and the other `--aw-*` tokens
live in `apps/web/src/components/CustomStyles.astro` (`:root` and `.dark`).

## Appearance mapping (per-block `appearanceFields`)

Defined in `apps/cms/src/fields/index.ts`, applied in **one seam**:
`appearance()` inside `apps/web/src/lib/blocks.ts`. No per-component theming forks.

| Field | Maps to | Behaviour |
|---|---|---|
| `anchorId` | widget `id` | Emits `#id` on the section for deep links |
| `isDark` | widget `isDark` | Renders one section dark on an otherwise-light page |
| `background` | widget `bg` markup via `SURFACE` | `default`/`none` → transparent default; `muted` → `--aw-color-bg-muted` tint |

## Mode handling

`Layout.astro` drives AstroWind's existing dark-mode mechanism — it does **not**
add a second system:

- `system` → no override; AstroWind/`ApplyColorMode` honours `prefers-color-scheme`
  and the header toggle.
- `light` / `dark` → an inline script sets `localStorage.theme` and toggles the
  `.dark` class on `<html>`, forcing the chosen mode.

## Re-theme checklist (Tier 2 — swap the presentation layer)

Content, collections, globals, media, and the Step 9 seed stay byte-for-byte unchanged.

1. Replace the AstroWind widgets with a new component set in `BlockRenderer.astro`.
2. Rewrite the mappings in `lib/blocks.ts` (`transformBlock`) to map the **same**
   `block.blockType`s to the new components; re-implement the shape helpers
   (`media` → `{src,alt}`, `richTextToHtml`, `appearance`/`SURFACE`, variant selectors).
3. Re-point the token bridge in `Layout.astro` (and `CustomStyles.astro` defaults)
   at the new theme's CSS variables.
4. Use `WIDGET_PROPS.md` as the source of truth for the new prop names.
