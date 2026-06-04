/**
 * PM2 process definitions for a self-hosted SiteForge deployment.
 *
 *   pm2 start ecosystem.config.cjs
 *
 * - "siteforge-cms": the Payload admin + REST/GraphQL API (Next.js) on :3000.
 * - "siteforge-web": only used when RENDER_MODE=ssr (Astro Node server on :4321).
 *   For RENDER_MODE=static you serve apps/web/dist as files via Nginx instead,
 *   so you can delete the web app from this list.
 *
 * Environment is read from the monorepo-root .env by both apps; values here are
 * only overrides/fallbacks.
 */
module.exports = {
  apps: [
    {
      name: 'siteforge-cms',
      cwd: './apps/cms',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--no-deprecation',
      },
    },
    {
      name: 'siteforge-web',
      cwd: './apps/web',
      // Astro Node standalone server entry (only exists when built with RENDER_MODE=ssr).
      script: './dist/server/entry.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: '4321',
      },
    },
  ],
};
