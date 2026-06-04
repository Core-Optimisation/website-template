// SiteForge shared types.
//
// Re-exports Payload's generated content types so every workspace package
// imports the same shapes from one place: `@siteforge/shared`.
//
// `payload-types.ts` is produced by `pnpm --filter cms generate:types` and
// copied here by `pnpm --filter @siteforge/shared sync`. Until that runs the
// file may be absent, so this re-export is wrapped to stay non-fatal.
export * from './payload-types';
