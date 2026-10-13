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
    let sessionStartTime = Date.now();
    try {
      visitorId = sessionStorage.getItem('ana_vis_id') || '';
      if (!visitorId) {
        visitorId = `vis-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem('ana_vis_id', visitorId);
      }

      const storedStart = sessionStorage.getItem('ana_vis_start_time');
      if (storedStart) {
        sessionStartTime = parseInt(storedStart, 10) || Date.now();
      } else {
        sessionStorage.setItem('ana_vis_start_time', sessionStartTime.toString());
      }
    } catch {
      visitorId = `vis-${Date.now().toString(36)}`;
    }

    // Detecta dispositivo amigável e se é Telefone (Mobile) ou Computador (Desktop)
    let device = 'Navegador Web';
    let deviceType: 'mobile' | 'desktop' = 'mobile';
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPhone/i.test(ua)) {
        device = 'iPhone (Apple)';
        deviceType = 'mobile';
      } else if (/iPad/i.test(ua)) {
        device = 'iPad (Apple)';
        deviceType = 'mobile';
      } else if (/Android/i.test(ua)) {
        device = 'Android Smartphone';
        deviceType = 'mobile';
      } else if (/Macintosh|Mac OS/i.test(ua)) {
        device = 'Mac (Desktop)';
        deviceType = 'desktop';
      } else if (/Windows/i.test(ua)) {
        device = 'Windows PC';
        deviceType = 'desktop';
      } else {
        deviceType = /Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ? 'mobile' : 'desktop';
      }
    }

    const sendPing = async () => {
      try {
        const durationSeconds = Math.max(10, Math.round((Date.now() - sessionStartTime) / 1000));
        const referrer = typeof document !== 'undefined' ? document.referrer || '' : '';

        await fetch('/api/live/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: visitorId,
            page: pathname || '/',
            pageTitle: document.title || 'Ana Fitness Wear',
            device,
            deviceType,
            durationSeconds,
            referrer,
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
