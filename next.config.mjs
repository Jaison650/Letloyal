import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  serverExternalPackages: ['mysql2', 'bcryptjs'],
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
};

export default withNextIntl(nextConfig);
