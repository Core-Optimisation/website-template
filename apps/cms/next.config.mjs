import { withPayload } from '@payloadcms/next/withPayload';
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Payload runs the admin UI + API inside this Next app.
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/', destination: '/admin', permanent: false }];
  },
};

const config = withPayload(nextConfig);

// Only enable the Sentry build plugin when a DSN is configured so default
// builds stay clean and never attempt source-map uploads without credentials.
export default process.env.SENTRY_DSN
  ? withSentryConfig(config, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      disableLogger: true,
    })
  : config;
