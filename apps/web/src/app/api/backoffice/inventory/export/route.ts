import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const onlyLiveParam = searchParams.get('only_live');
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();
    // Padrão: apenas peças no ar se não especificado ou se only_live !== '0'
    const onlyLive = onlyLiveParam !== '0' && onlyLiveParam !== 'false';

    // 1. Busca todos os produtos do Supabase
    const { data: products, error: pErr } = await supabaseServer
      .from('products')
      .select('id, title, slug, description, category_id, supplier_id, created_at, categories(id, name)')
      .order('title', { ascending: true });

    if (pErr) {
      console.error('[API Inventory Export] Error fetching products:', pErr);
      return NextResponse.json({ error: 'Erro ao buscar catálogo de produtos.' }, { status: 500 });
    }

    // 2. Busca todas as variações da tabela product_variants
    const { data: variants, error: vErr } = await supabaseServer
      .from('product_variants')
      .select('*')
      .order('color', { ascending: true });

    if (vErr) {
      console.error('[API Inventory Export] Error fetching variants:', vErr);
      return NextResponse.json({ error: 'Erro ao buscar variações de estoque.' }, { status: 500 });
    }

    const productsMap = new Map<string, any>();
    (products || []).forEach((p: any) => {
      let meta: any = {};
      try {
        if (p.description && typeof p.description === 'string' && p.description.startsWith('{')) {
          meta = JSON.parse(p.description);
        }
      } catch (e) {}
      productsMap.set(p.id, { ...p, _meta: meta });
    });

    const inventoryRows: any[] = [];
    const handledProductVariantPairs = new Set<string>();

    // 3. Itera sobre todas as variantes do banco
    (variants || []).forEach((v: any) => {
      const prod = productsMap.get(v.product_id);
      if (!prod) return;
      if (prod.title?.startsWith('__')) return;

      const meta = prod._meta || {};
      const unitCost = Number(v.cost_price ?? meta.cost_price ?? 16.0);
      const unitPrice = Number(v.price ?? meta.price ?? meta.promotional_price ?? 44.9);
      const stock = Math.max(0, parseInt(String(v.stock_quantity ?? 0), 10) || 0);

      const isVisibleOnline = meta.visible_online === true;
      const isDraft = meta.is_draft === true || !isVisibleOnline;
      const isSpoiler = meta.badge === 'SPOILER' || meta.is_spoiler === true;
      const isLiveProduct = isVisibleOnline && !isDraft && !isSpoiler;
      const isLiveWithStock = isLiveProduct && stock > 0;

      if (onlyLive && !isLiveWithStock) {
        return; // Filtra somente peças no ar com estoque físico disponível
      }

      const totalCost = stock * unitCost;
      const totalRetail = stock * unitPrice;
      const profit = totalRetail - totalCost;
      const marginPct = unitPrice > 0 ? ((unitPrice - unitCost) / unitPrice) * 100 : 0;

      inventoryRows.push({
        sku: v.sku || `SKU-${v.id.slice(0, 8)}`,
        title: prod.title,
        category: prod.categories?.name || 'Sem Categoria',
        color: v.color || 'Padrão',
        size: v.size || 'Único',
        barcode: v.barcode || '',
        stock,
        unitCost,
        totalCost,
        unitPrice,
        totalRetail,
        profit,
        marginPct,
        status: isLiveWithStock ? 'No Ar (Ativo)' : stock === 0 ? 'Esgotado' : isDraft ? 'Rascunho' : 'Fora do Ar',
      });

      handledProductVariantPairs.add(`${v.product_id}__${v.color}__${v.size}`);
    });

    // 4. Inclui eventuais variantes virtuais de meta.variants
    (products || []).forEach((prod: any) => {
      if (prod.title?.startsWith('__')) return;
      const meta = prod._meta || {};
      const metaVars = Array.isArray(meta.variants) ? meta.variants : [];
      const isVisibleOnline = meta.visible_online === true;
      const isDraft = meta.is_draft === true || !isVisibleOnline;
      const isSpoiler = meta.badge === 'SPOILER' || meta.is_spoiler === true;
      const isLiveProduct = isVisibleOnline && !isDraft && !isSpoiler;

      metaVars.forEach((mv: any, idx: number) => {
        const pairKey = `${prod.id}__${mv.color}__${mv.size}`;
        if (!handledProductVariantPairs.has(pairKey)) {
          const unitCost = Number(mv.cost_price ?? meta.cost_price ?? 16.0);
          const unitPrice = Number(mv.price ?? meta.price ?? meta.promotional_price ?? 44.9);
          const stock = Math.max(0, parseInt(String(mv.stock_quantity ?? mv.stock ?? 0), 10) || 0);
          const isLiveWithStock = isLiveProduct && stock > 0;

          if (onlyLive && !isLiveWithStock) {
            return;
          }

          const totalCost = stock * unitCost;
          const totalRetail = stock * unitPrice;
          const profit = totalRetail - totalCost;
          const marginPct = unitPrice > 0 ? ((unitPrice - unitCost) / unitPrice) * 100 : 0;

          inventoryRows.push({
            sku: mv.sku || `SKU-${prod.slug.slice(0, 8)}-${idx}`,
            title: prod.title,
            category: prod.categories?.name || 'Sem Categoria',
            color: mv.color || 'Padrão',
            size: mv.size || 'Único',
            barcode: mv.barcode || '',
            stock,
            unitCost,
            totalCost,
            unitPrice,
            totalRetail,
            profit,
            marginPct,
            status: isLiveWithStock ? 'No Ar (Ativo)' : stock === 0 ? 'Esgotado' : isDraft ? 'Rascunho' : 'Fora do Ar',
          });
        }
      });
    });

    // Ordena alfabeticamente por título do produto e tamanho
    inventoryRows.sort((a, b) => a.title.localeCompare(b.title) || a.size.localeCompare(b.size));

    // Cálculos consolidados
    const totalPieces = inventoryRows.reduce((acc, r) => acc + r.stock, 0);
    const sumTotalCostUSD = inventoryRows.reduce((acc, r) => acc + r.totalCost, 0);
    const sumTotalRetailUSD = inventoryRows.reduce((acc, r) => acc + r.totalRetail, 0);
    const sumTotalProfitUSD = sumTotalRetailUSD - sumTotalCostUSD;
    const overallMarginPct = sumTotalRetailUSD > 0 ? (sumTotalProfitUSD / sumTotalRetailUSD) * 100 : 0;

    const dateStr = new Date().toISOString().split('T')[0];
    const timestampStr = new Date().toLocaleString('pt-BR');

    // EXPORTAÇÃO CSV
    if (format === 'csv') {
      const csvHeaders = [
        'SKU',
        'Produto',
        'Categoria',
        'Cor',
        'Tamanho',
        'Codigo de Barras',
        'Estoque Atual (un)',
        'Custo Unitario (USD)',
        'Custo Total de Mercadoria (USD)',
        'Preco de Venda Unitario (USD)',
        'Valor Total de Venda (USD)',
        'Lucro Estimado (USD)',
        'Margem (%)',
        'Situacao',
      ];

      const csvDataRows = inventoryRows.map((r) => [
        `"${r.sku.replace(/"/g, '""')}"`,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.category.replace(/"/g, '""')}"`,
        `"${r.color.replace(/"/g, '""')}"`,
        `"${r.size.replace(/"/g, '""')}"`,
        `"${r.barcode.replace(/"/g, '""')}"`,
        r.stock,
        r.unitCost.toFixed(2),
        r.totalCost.toFixed(2),
        r.unitPrice.toFixed(2),
        r.totalRetail.toFixed(2),
        r.profit.toFixed(2),
        r.marginPct.toFixed(1) + '%',
        `"${r.status}"`,
      ]);

      const summaryHeader = [
        `"RELATORIO DE ESTOQUE - ANA FITNESS WEAR (VALUATION EM DOLAR)"`,
        `"Filtro: ${onlyLive ? 'SOMENTE PECAS NO AR COM ESTOQUE' : 'TODOS OS ITENS'}"`,
        `"Data de Emissao: ${timestampStr}"`,
        `"TOTAL DE PECAS: ${totalPieces} unidades | SKUs: ${inventoryRows.length}"`,
        `"VALOR TOTAL EM MERCADORIA (CUSTO): $${sumTotalCostUSD.toFixed(2)} USD"`,
        `"VALOR TOTAL EM VITRINE (VENDA): $${sumTotalRetailUSD.toFixed(2)} USD"`,
        `"LUCRO BRUTO PROJETADO: $${sumTotalProfitUSD.toFixed(2)} USD (${overallMarginPct.toFixed(1)}% Margem)"`,
        '',
      ].join('\r\n');

      const csvContent =
        '\uFEFF' +
        summaryHeader +
        [csvHeaders.join(','), ...csvDataRows.map((row) => row.join(','))].join('\r\n') +
        `\r\n"TOTAL GERAL","","","","","",${totalPieces},"","$${sumTotalCostUSD.toFixed(2)}","","$${sumTotalRetailUSD.toFixed(2)}","$${sumTotalProfitUSD.toFixed(2)}","${overallMarginPct.toFixed(1)}%",""`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio_estoque_${onlyLive ? 'no_ar' : 'geral'}_${dateStr}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // EXPORTAÇÃO EXCEL (.XLSX)
    const wb = XLSX.utils.book_new();

    // 1. Matriz de dados para a planilha
    const wsData: any[][] = [
      ['ANA FITNESS WEAR - RELATÓRIO OFICIAL DE ESTOQUE (VALUATION EM DÓLAR)'],
      [`Filtro: ${onlyLive ? 'SOMENTE PEÇAS NO AR (VITRINE ATIVA COM ESTOQUE FÍSICO)' : 'CATÁLOGO GERAL DE ESTOQUE'}`],
      [`Data de Emissão: ${timestampStr}`],
      [''],
      ['--- RESUMO FINANCEIRO EM DÓLAR ($ USD) ---', '', '', '', '', '', '', '', '', '', '', ''],
      ['Total de Peças Físicas em Estoque:', totalPieces, 'unidades'],
      ['Total de Modelos / SKUs Únicos:', inventoryRows.length, 'combinações'],
      ['VALOR TOTAL EM MERCADORIA (CUSTO INVESTIDO):', Number(sumTotalCostUSD.toFixed(2)), 'USD ($)'],
      ['POTENCIAL TOTAL DE FATURAMENTO (VENDA):', Number(sumTotalRetailUSD.toFixed(2)), 'USD ($)'],
      ['LUCRO BRUTO ESTIMADO:', Number(sumTotalProfitUSD.toFixed(2)), `USD ($) (${overallMarginPct.toFixed(1)}% margem)`],
      [''],
      [
        'SKU',
        'PRODUTO',
        'CATEGORIA',
        'COR',
        'TAMANHO',
        'CÓDIGO DE BARRAS',
        'ESTOQUE ATUAL (UN)',
        'CUSTO UNITÁRIO ($ USD)',
        'CUSTO TOTAL MERCADORIA ($ USD)',
        'PREÇO DE VENDA ($ USD)',
        'VALOR TOTAL DE VENDA ($ USD)',
        'LUCRO ESTIMADO ($ USD)',
        'MARGEM (%)',
        'SITUAÇÃO',
      ],
    ];

    // Adiciona cada item
    inventoryRows.forEach((r) => {
      wsData.push([
        r.sku,
        r.title,
        r.category,
        r.color,
        r.size,
        r.barcode,
        r.stock,
        Number(r.unitCost.toFixed(2)),
        Number(r.totalCost.toFixed(2)),
        Number(r.unitPrice.toFixed(2)),
        Number(r.totalRetail.toFixed(2)),
        Number(r.profit.toFixed(2)),
        Number(r.marginPct.toFixed(1)),
        r.status,
      ]);
    });

    // Linha de Totais no final
    wsData.push([
      'TOTAL GERAL',
      '',
      '',
      '',
      '',
      '',
      totalPieces,
      '',
      Number(sumTotalCostUSD.toFixed(2)),
      '',
      Number(sumTotalRetailUSD.toFixed(2)),
      Number(sumTotalProfitUSD.toFixed(2)),
      Number(overallMarginPct.toFixed(1)),
      '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Configuração de largura das colunas
    ws['!cols'] = [
      { wch: 18 }, // SKU
      { wch: 38 }, // Produto
      { wch: 20 }, // Categoria
      { wch: 22 }, // Cor
      { wch: 10 }, // Tamanho
      { wch: 16 }, // Código de Barras
      { wch: 18 }, // Estoque Atual
      { wch: 22 }, // Custo Unitário
      { wch: 28 }, // Custo Total Mercadoria
      { wch: 22 }, // Preço de Venda
      { wch: 26 }, // Valor Total Venda
      { wch: 22 }, // Lucro Estimado
      { wch: 14 }, // Margem %
      { wch: 18 }, // Situação
    ];

    XLSX.utils.book_append_sheet(wb, ws, onlyLive ? 'Estoque no Ar (USD)' : 'Estoque Geral');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="relatorio_estoque_${onlyLive ? 'no_ar' : 'geral'}_${dateStr}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[API Inventory Export] Unexpected exception:', err);
    return NextResponse.json({ error: err.message || 'Erro inesperado ao gerar exportação de estoque.' }, { status: 500 });
  }
}
