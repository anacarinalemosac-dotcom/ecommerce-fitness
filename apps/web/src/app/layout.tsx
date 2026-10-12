import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { FloatingLanguageSwitcher } from '../components/FloatingLanguageSwitcher';
import { LiveVisitorTracker } from '../components/LiveVisitorTracker';
import { TrackingScripts } from '../components/TrackingScripts';

export const metadata: Metadata = {
  title: 'ANA FITNESS WEAR | ✨Wear Your Strength✨ | Official US Store',
  description: 'Luxury activewear crafted for maximum confidence. Zero see-through, anatomical compression and sculpt fit. Shipping across all United States from Leominster, MA. Flat rate $9.99.',
  manifest: '/manifest.json',
  icons: {
    icon: '/symbol-ana-fitness.png',
    apple: '/symbol-ana-fitness.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ANA Backoffice',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-deep-black selection:bg-deep-black selection:text-gold">
        <Providers>
          <TrackingScripts />
          <LiveVisitorTracker />
          <SiteHeader />
          <main className="flex-1 w-full">
            {children}
          </main>
          <SiteFooter />
          <FloatingLanguageSwitcher />
        </Providers>
      </body>
    </html>
  );
}
