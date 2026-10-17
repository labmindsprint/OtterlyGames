import type { Metadata, Viewport } from 'next';
import './globals.css';
import './website.css';

export const metadata: Metadata = {
  title: 'Play Math Tank | Otterly Games',
  description: 'Play Math Tank in your browser: math battles, Universe, lessons, practice and tank customization, with progress saved on this browser.',
  alternates: { canonical: 'https://otterlygames.com/games/mathtank/' },
  robots: { index: false, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="antialiased">{children}</body></html>;
}
