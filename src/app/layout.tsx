import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'LetLoyal — QR Loyalty for Local Businesses', template: '%s | LetLoyal' },
  description: 'Turn every QR scan into a loyal customer. No app download needed. Live in 10 minutes.',
  keywords: ['loyalty program', 'QR code', 'rewards', 'local business', 'stamp card'],
  authors: [{ name: 'LetLoyal' }],
  openGraph: {
    title: 'LetLoyal — QR Loyalty for Local Businesses',
    description: 'Turn every QR scan into a loyal customer.',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    title: 'LetLoyal',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#028090',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased bg-brand-bg text-text-dark">
        {children}
      </body>
    </html>
  );
}
