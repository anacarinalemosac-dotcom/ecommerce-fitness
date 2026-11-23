import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { FloatingLanguageSwitcher } from '../components/FloatingLanguageSwitcher';
import { CustomerChatWidget } from '../components/CustomerChatWidget';
import { LiveVisitorTracker } from '../components/LiveVisitorTracker';
import { AffiliateLinkTracker } from '../components/AffiliateLinkTracker';
import { TrackingScripts } from '../components/TrackingScripts';
import { StoreMaintenanceGuard } from '../components/StoreMaintenanceGuard';
import { SideCartDrawer } from '../components/SideCartDrawer';
import { PromoOfferPopup } from '../components/PromoOfferPopup';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.anafitwear.com'),
  title: 'ANA FITNESS WEAR | ✨Wear Your Strength✨ | Official US Store',
  description: 'Luxury activewear crafted for maximum confidence. Zero see-through, anatomical compression and sculpt fit. Shipping across all United States from Leominster, MA. Flat rate $9.90.',
  openGraph: {
    type: 'website',
    siteName: 'ANA Fitness Wear',
    title: 'ANA FITNESS WEAR | Luxury Activewear US',
    description: 'Zero see-through, anatomical compression and sculpt fit. Shipping across all United States.',
    images: [
      {
        url: 'https://grmlmouqkixvfxbdifrc.supabase.co/storage/v1/object/public/products/1794313586030-kxs3id.png',
        width: 1200,
        height: 630,
        alt: 'ANA FITNESS WEAR - Luxury Activewear US',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ANA FITNESS WEAR | Luxury Activewear US',
    description: 'Zero see-through, anatomical compression and sculpt fit. Shipping across all United States.',
    images: ['https://grmlmouqkixvfxbdifrc.supabase.co/storage/v1/object/public/products/1794313586030-kxs3id.png'],
  },
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
      <head>
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '2201109947470495');
              try {
                var usp = new URLSearchParams(window.location.search);
                var tc = usp.get('test_event_code') || usp.get('fb_test_code');
                if (tc) {
                  sessionStorage.setItem('meta_test_event_code', tc);
                  fbq('track', 'PageView', {}, { test_event_code: tc });
                } else {
                  var stc = sessionStorage.getItem('meta_test_event_code');
                  if (stc) {
                    fbq('track', 'PageView', {}, { test_event_code: stc });
                  } else {
                    fbq('track', 'PageView');
                  }
                }
              } catch (_) {
                fbq('track', 'PageView');
              }
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2201109947470495&ev=PageView&noscript=1"
            alt="Meta Pixel"
          />
        </noscript>
      </head>
      <body className="min-h-screen flex flex-col bg-white text-deep-black selection:bg-deep-black selection:text-gold">
        <Providers>
          <TrackingScripts />
          <LiveVisitorTracker />
          <AffiliateLinkTracker />
          <StoreMaintenanceGuard>
            <SiteHeader />
            <main className="flex-1 w-full">
              {children}
            </main>
            <SiteFooter />
            <SideCartDrawer />
            <CustomerChatWidget />
          </StoreMaintenanceGuard>
        </Providers>
      </body>
    </html>
  );
}
