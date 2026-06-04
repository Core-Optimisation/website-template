// Copies Payload's generated types from apps/cms into packages/shared so the
// public site (and any other workspace package) can import strongly-typed
// content shapes from a single source: `@siteforge/shared`.
import { copyFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../../apps/cms/src/payload-types.ts');
const dest = resolve(here, '../src/payload-types.ts');

try {
  await access(src);
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(src, dest);
  console.log(`[shared] synced types → ${dest}`);
} catch (err) {
  console.warn(
    `[shared] could not sync types from ${src}. ` +
      `Run \`pnpm --filter cms generate:types\` first. (${err.code ?? err.message})`
  );
  process.exitCode = 0; // non-fatal: keep installs/builds green
}
