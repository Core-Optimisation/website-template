import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Payload runs the admin UI + API inside this Next app.
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/', destination: '/admin', permanent: false }];
  },
};

export default withPayload(nextConfig);
