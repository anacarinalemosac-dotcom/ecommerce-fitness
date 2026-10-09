'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function LiveVisitorTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    // Não rastreia rotas internas do backoffice para não poluir os visitantes com a própria Ana Carina
    if (pathname && (pathname.startsWith('/backoffice') || pathname.startsWith('/admin'))) {
      return;
    }

    // Identificador único da sessão do visitante (preservado enquanto a aba/navegador estiver aberto)
    let visitorId = '';
    try {
      visitorId = sessionStorage.getItem('ana_vis_id') || '';
      if (!visitorId) {
        visitorId = `vis-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem('ana_vis_id', visitorId);
      }
    } catch {
      visitorId = `vis-${Date.now().toString(36)}`;
    }

    // Detecta dispositivo amigável
    let device = 'Navegador Web';
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPhone/i.test(ua)) device = 'iPhone (Apple)';
      else if (/iPad/i.test(ua)) device = 'iPad (Apple)';
      else if (/Android/i.test(ua)) device = 'Android Smartphone';
      else if (/Macintosh|Mac OS/i.test(ua)) device = 'Mac (Desktop)';
      else if (/Windows/i.test(ua)) device = 'Windows PC';
    }

    const sendPing = async () => {
      try {
        await fetch('/api/live/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: visitorId,
            page: pathname || '/',
            pageTitle: document.title || 'Ana Fitness Wear',
            device,
          }),
        });
      } catch (e) {
        // Silencioso para não incomodar o cliente
      }
    };

    // Ping imediato ao carregar / trocar de página
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      sendPing();
    }

    // Heartbeat a cada 25 segundos enquanto o visitante estiver na página
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sendPing();
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
