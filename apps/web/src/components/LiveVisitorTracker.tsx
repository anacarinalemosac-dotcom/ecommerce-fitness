'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useStoreSettings } from '../context/StoreSettingsContext';

// Rotas administrativas e do ERP que NUNCA devem ser contabilizadas como visitantes
const ERP_ADMIN_ROUTES = ['/backoffice', '/admin', '/pos', '/vendedora'];

/**
 * Verifica se a aba/navegador atual pertence à Ana Carina, Mayne ou qualquer operador do ERP/Backoffice
 */
export function isErpOrAdminActive(adminUserLoggedIn?: boolean): boolean {
  if (adminUserLoggedIn) return true;
  if (typeof window === 'undefined') return false;

  try {
    // 1. Verifica se há sessão de admin salva no localStorage
    const saved = localStorage.getItem('ana_admin_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.isLoggedIn || parsed.role === 'owner' || parsed.role === 'manager')) {
        return true;
      }
    }

    // 2. Cookie de administrador ativo
    if (document.cookie && document.cookie.includes('ana_is_admin=1')) {
      return true;
    }

    // 3. Flags de controle em localStorage ou sessionStorage
    if (
      localStorage.getItem('ana_is_admin') === 'true' ||
      sessionStorage.getItem('ana_is_admin') === 'true' ||
      sessionStorage.getItem('ana_pos_unlocked') === 'true'
    ) {
      return true;
    }
  } catch (_) {}

  return false;
}

export function LiveVisitorTracker() {
  const pathname = usePathname();
  const { adminUser } = useStoreSettings();
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    // 1. Não rastreia rotas internas do ERP, Backoffice, PDV e portal da vendedora
    if (pathname && ERP_ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
      return;
    }

    // 2. Se o usuário estiver logado no ERP / Backoffice (Ana Carina, Mayne, admin), NUNCA contabiliza como visitante
    if (isErpOrAdminActive(adminUser?.isLoggedIn)) {
      // Remove qualquer ID de visitante residual da sessão do administrador
      try {
        sessionStorage.removeItem('ana_vis_id');
        sessionStorage.removeItem('ana_vis_start_time');
      } catch (_) {}
      return;
    }

    // Identificador único da sessão do visitante real (preservado enquanto a aba/navegador estiver aberto)
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
      // Re-valida para garantir que a dona não fez login no meio da sessão
      if (isErpOrAdminActive(adminUser?.isLoggedIn)) return;
      if (pathname && ERP_ADMIN_ROUTES.some((route) => pathname.startsWith(route))) return;

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
            isAdmin: false,
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
  }, [pathname, adminUser?.isLoggedIn]);

  return null;
}
