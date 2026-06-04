import type { AstroIntegration } from 'astro';
import { writeFile, appendFile, access } from 'node:fs/promises';
import { getRedirects } from '../lib/payload';

/**
 * Build-time integration that materialises the Payload Redirects collection
 * into a Netlify-style `dist/_redirects` file (also honoured by many static
 * hosts). Runs only for static builds via the `astro:build:done` hook.
 */
export default function payloadRedirects(): AstroIntegration {
  return {
    name: 'payload-redirects',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        try {
          const redirects = await getRedirects();
          const lines: string[] = [];

          for (const r of redirects) {
            if (!r.from || !r.to) continue;

            let to = '';
            if (r.to.type === 'custom') {
              to = r.to.url ?? '';
            } else if (r.to.reference && typeof r.to.reference.value === 'object') {
              const ref = r.to.reference;
              const slug =
                ref.value && typeof ref.value === 'object' ? ((ref.value as { slug?: string }).slug ?? '') : '';
              if (ref.relationTo === 'posts') {
                // Posts resolve to a root-level `/slug` permalink in this project.
                to = slug ? `/${slug}` : '/';
              } else {
                to = slug && slug !== 'home' ? `/${slug}` : '/';
              }
            }

            if (!to) continue;
            const from = r.from.startsWith('/') || r.from.startsWith('http') ? r.from : `/${r.from}`;
            lines.push(`${from}  ${to}  301`);
          }

          const target = new URL('_redirects', dir);
          const content = lines.length ? lines.join('\n') + '\n' : '';

          // Preserve any existing _redirects emitted by other tooling.
          let exists = false;
          try {
            await access(target);
            exists = true;
          } catch {
            exists = false;
          }

          if (exists) {
            if (content) await appendFile(target, content);
          } else {
            await writeFile(target, content);
          }

          logger.info(`Wrote ${lines.length} redirect(s) to _redirects`);
        } catch (err) {
          logger.warn(`Skipped _redirects generation: ${(err as Error).message}`);
        }
      },
    },
  };
}
