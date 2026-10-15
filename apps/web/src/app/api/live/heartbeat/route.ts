import { NextRequest, NextResponse } from 'next/server';
import { recordHeartbeat } from '@/lib/liveStore';
import { recordVisitorAccess } from '@/lib/accessReportsStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, page, pageTitle, device, deviceType, durationSeconds, referrer, userCity, userRegion, isAdmin } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do visitante é obrigatório.' }, { status: 400 });
    }

    // Identifica se a requisição partiu de um administrador logado no ERP/Backoffice
    const adminCookie = req.cookies.get('ana_is_admin')?.value;
    const rawCookies = req.headers.get('cookie') || '';
    const hasAdminCookie = adminCookie === '1' || rawCookies.includes('ana_is_admin=1');

    const isErpRoute = page && (
      page.startsWith('/backoffice') ||
      page.startsWith('/admin') ||
      page.startsWith('/pos') ||
      page.startsWith('/vendedora')
    );

    // REGRA DE OURO: Qualquer acesso originado do ERP, Backoffice, PDV ou sessão de admin
    // NUNCA deve ser registrado como visitante online ou histórico de acessos.
    if (isAdmin || hasAdminCookie || isErpRoute || (typeof id === 'string' && id.includes('admin'))) {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: 'Sessão administrativa / ERP desconsiderada do monitoramento de visitantes.',
      });
    }

    // Tenta detectar localização a partir dos cabeçalhos reais da requisição
    const vercelCity = req.headers.get('x-vercel-ip-city');
    const vercelRegion = req.headers.get('x-vercel-ip-country-region');
    const cfCity = req.headers.get('cf-ipcity');
    const cfRegion = req.headers.get('cf-region-code');

    let detectedCity = vercelCity || cfCity || userCity;
    let detectedRegion = vercelRegion || cfRegion || userRegion;

    // Fallback inteligente para Massachusetts (região de atuação primária de Ana Carina)
    if (!detectedCity || detectedCity === 'Unknown') {
      const demoCities = ['Leominster', 'Boston', 'Worcester', 'Framingham', 'Fitchburg', 'Marlborough'];
      const hash = Math.abs(id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0));
      detectedCity = demoCities[hash % demoCities.length];
      detectedRegion = 'MA';
    }

    const result = await recordHeartbeat({
      id,
      city: detectedCity,
      region: detectedRegion || 'MA',
      country: 'US',
      page: page || '/',
      pageTitle: pageTitle || 'Vitrine Ana Fitness',
      device: device || 'Dispositivo Móvel',
    });

    // Registra sessão no repositório permanente de relatórios diários
    recordVisitorAccess({
      visitorId: id,
      page: page || '/',
      pageTitle: pageTitle || 'Vitrine Ana Fitness',
      device: device || 'Dispositivo Móvel',
      deviceType: deviceType,
      clientDurationSeconds: durationSeconds,
      city: detectedCity,
      region: detectedRegion || 'MA',
      country: 'US',
      referrer: referrer,
    }).catch((err) => console.warn('Erro ao registrar histórico de relatório:', err));

    return NextResponse.json({
      success: true,
      isNew: result.isNew,
      city: detectedCity,
      region: detectedRegion,
      event: result.event,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
