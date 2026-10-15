import { NextRequest, NextResponse } from 'next/server';
import { getAccessReports, recordVisitorAccess, formatDuration } from '@/lib/accessReportsStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || undefined;
    const format = searchParams.get('format');

    const report = await getAccessReports(dateParam);

    // Exportação em formato CSV para Excel
    if (format === 'csv') {
      const headers = [
        'ID Acesso',
        'Data',
        'Horário',
        'Cidade',
        'Estado/Região',
        'País',
        'Dispositivo',
        'Tipo (Telefone/Computador)',
        'Tempo no Site (segundos)',
        'Tempo no Site (formatado)',
        'Página Atual',
        'Título da Página',
        'Páginas Visitadas (Total)',
        'Origem / Referrer',
      ];

      const csvRows = [headers.join(',')];

      report.accesses.forEach((a) => {
        const row = [
          `"${a.id}"`,
          `"${a.date}"`,
          `"${a.timeFormatted}"`,
          `"${a.city}"`,
          `"${a.region}"`,
          `"${a.country}"`,
          `"${(a.device || '').replace(/"/g, '""')}"`,
          `"${a.deviceType === 'mobile' ? 'Telefone / Celular' : 'Computador'}"`,
          a.durationSeconds,
          `"${a.durationFormatted}"`,
          `"${a.currentPath}"`,
          `"${(a.currentTitle || '').replace(/"/g, '""')}"`,
          a.pagesVisitedCount,
          `"${(a.referrer || '').replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
      });

      // Adiciona BOM UTF-8 (\uFEFF) para abrir perfeitamente acentuado no Excel
      const csvContent = '\uFEFF' + csvRows.join('\r\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-acessos-${report.filterDate}.csv"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        report,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Erro ao gerar relatório de acessos:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar relatório de acessos', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorId, page, pageTitle, device, deviceType, clientDurationSeconds, city, region, country, referrer, isAdmin } = body;

    const adminCookie = req.cookies.get('ana_is_admin')?.value;
    const rawCookies = req.headers.get('cookie') || '';
    const hasAdminCookie = adminCookie === '1' || rawCookies.includes('ana_is_admin=1');

    const isErpRoute = page && (
      page.startsWith('/backoffice') ||
      page.startsWith('/admin') ||
      page.startsWith('/pos') ||
      page.startsWith('/vendedora')
    );

    if (isAdmin || hasAdminCookie || isErpRoute || (typeof visitorId === 'string' && visitorId.includes('admin'))) {
      return NextResponse.json({ success: true, ignored: true, reason: 'Admin/ERP session ignored' });
    }

    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId é obrigatório' }, { status: 400 });
    }

    const recorded = await recordVisitorAccess({
      visitorId,
      page: page || '/',
      pageTitle: pageTitle || 'Vitrine Ana Fitness Wear',
      device: device || 'Dispositivo Móvel',
      deviceType,
      clientDurationSeconds,
      city,
      region,
      country,
      referrer,
    });

    return NextResponse.json({ success: true, recorded });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
