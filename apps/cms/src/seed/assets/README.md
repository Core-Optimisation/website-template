# Seed assets

Drop royalty-free demo images here to use them in the seed instead of the
auto-generated solid-colour placeholders.

Expected filenames (all optional — missing files become coloured placeholders):

| File            | Used for                         |
| --------------- | -------------------------------- |
| `hero.jpg`      | Home / About hero, blog cover    |
| `dining.jpg`    | Long-table dining content blocks |
| `producers.jpg` | Producer Stories post cover      |
| `logo.png`      | SiteSettings logo                |
| `sponsor-1.png` | Sponsor brand logo               |
| `sponsor-2.png` | Sponsor brand logo               |
| `sponsor-3.png` | Sponsor brand logo               |
| `sponsor-4.png` | Sponsor brand logo               |

The seed (`pnpm --filter cms seed`) uploads whatever exists here through
Payload's local upload adapter, so each becomes a real Media doc with alt text.
If a file is absent, a 1200×800 solid-colour PNG is generated so the seed never
fails.
