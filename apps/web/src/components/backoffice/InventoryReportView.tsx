'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import * as XLSX from 'xlsx';
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Tag,
  Layers,
  ArrowUpDown,
  Plus,
  Minus,
  Edit2,
  Check,
  X,
  ExternalLink,
  Barcode,
  Sparkles,
  FileSpreadsheet,
  BadgeDollarSign,
  CheckCheck,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  category: string;
  sku: string;
  barcode: string;
  color: string;
  colorHex?: string | null;
  size: string;
  stockQuantity: number;
  unitCost: number;
  unitPrice: number;
  totalCostValue: number;
  totalRetailValue: number;
  profitValue?: number;
  marginEstimate: number;
  image: string;
  visibleOnline: boolean;
  isDraft?: boolean;
  isSpoiler: boolean;
  isLiveProduct?: boolean;
  isLiveWithStock?: boolean;
  allowBackorder: boolean;
  updatedAt?: string;
}

interface InventoryStats {
  totalVariants: number;
  totalStockPieces: number;
  totalCostAsset: number;
  totalRetailAsset: number;
  projectedProfit: number;
  overallMarginPct: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  liveVariantsCount?: number;
  livePiecesCount?: number;
  liveCostAsset?: number;
  liveRetailAsset?: number;
  liveProjectedProfit?: number;
  liveOverallMarginPct?: number;
}

export function InventoryReportView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Padrão: 'live_only' para responder diretamente ao usuário que deseja calcular as peças que estão no ar
  const [statusFilter, setStatusFilter] = useState<'live_only' | 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'drafts'>('live_only');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'stock_asc' | 'stock_desc' | 'cost_desc' | 'value_desc' | 'sku'>('stock_desc');

  // Quick inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchInventory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch('/api/backoffice/inventory', { cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao carregar dados do estoque.');
      const data = await res.json();

      if (data.success) {
        setItems(data.items || []);
        setStats(data.stats || null);
      }
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      showToast('Erro ao carregar o inventário de estoque.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Helper: checa se item está no ar e com estoque físico
  const isItemLiveWithStock = useCallback((item: InventoryItem) => {
    if (typeof item.isLiveWithStock === 'boolean') return item.isLiveWithStock;
    const isOnline = item.visibleOnline === true && !item.isDraft && !item.isSpoiler;
    return isOnline && item.stockQuantity > 0;
  }, []);

  // Totais consolidados exclusivos de PEÇAS NO AR COM ESTOQUE (Valuation USD)
  const liveSummaryTotals = useMemo(() => {
    const liveItems = items.filter(isItemLiveWithStock);
    let pieces = 0;
    let cost = 0;
    let retail = 0;
    liveItems.forEach((i) => {
      pieces += i.stockQuantity;
      cost += i.totalCostValue;
      retail += i.totalRetailValue;
    });
    return {
      variantsCount: liveItems.length,
      pieces,
      cost,
      retail,
      profit: retail - cost,
      margin: retail > 0 ? ((retail - cost) / retail) * 100 : 0,
    };
  }, [items, isItemLiveWithStock]);

  // Quick Stock Adjustment
  const handleUpdateStock = async (item: InventoryItem, newStock: number) => {
    const validStock = Math.max(0, newStock);
    try {
      setSavingId(item.id);
      const res = await fetch('/api/backoffice/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: item.id,
          productId: item.productId,
          stockQuantity: validStock,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar');
      }

      // Update local state instantly
      setItems((prev) =>
        prev.map((it) => {
          if (it.id === item.id) {
            const updatedStock = validStock;
            const isLive = (it.visibleOnline && !it.isDraft && !it.isSpoiler && updatedStock > 0);
            return {
              ...it,
              stockQuantity: updatedStock,
              totalCostValue: updatedStock * it.unitCost,
              totalRetailValue: updatedStock * it.unitPrice,
              profitValue: updatedStock * (it.unitPrice - it.unitCost),
              isLiveWithStock: isLive,
            };
          }
          return it;
        })
      );

      // Recompute stats locally
      setStats((prev) => {
        if (!prev) return prev;
        const diff = validStock - item.stockQuantity;
        const costDiff = diff * item.unitCost;
        const retailDiff = diff * item.unitPrice;
        return {
          ...prev,
          totalStockPieces: prev.totalStockPieces + diff,
          totalCostAsset: prev.totalCostAsset + costDiff,
          totalRetailAsset: prev.totalRetailAsset + retailDiff,
        };
      });

      showToast(`Estoque de "${item.productTitle} (${item.color}/${item.size})" alterado para ${validStock} un.`);
      setEditingId(null);
    } catch (err: any) {
      console.error('Failed to update stock:', err);
      showToast(err.message || 'Erro ao salvar alteração.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Distinct filter options
  const categoriesList = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort();
  }, [items]);

  const sizesList = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.size).filter(Boolean))).sort();
  }, [items]);

  const colorsList = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.color).filter(Boolean))).sort();
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = item.productTitle?.toLowerCase().includes(q);
          const matchSku = item.sku?.toLowerCase().includes(q);
          const matchBarcode = item.barcode?.toLowerCase().includes(q);
          const matchColor = item.color?.toLowerCase().includes(q);
          const matchSize = item.size?.toLowerCase().includes(q);
          const matchCat = item.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchSku && !matchBarcode && !matchColor && !matchSize && !matchCat) {
            return false;
          }
        }

        // Status Filter
        if (statusFilter === 'live_only') {
          if (!isItemLiveWithStock(item)) return false;
        } else if (statusFilter === 'in_stock') {
          if (item.stockQuantity <= 0) return false;
        } else if (statusFilter === 'low_stock') {
          if (item.stockQuantity <= 0 || item.stockQuantity > 3) return false;
        } else if (statusFilter === 'out_of_stock') {
          if (item.stockQuantity > 0) return false;
        } else if (statusFilter === 'drafts') {
          const isDraftOrHidden = item.isDraft || !item.visibleOnline || item.isSpoiler;
          if (!isDraftOrHidden) return false;
        }

        // Category Filter
        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

        // Size Filter
        if (sizeFilter !== 'all' && item.size !== sizeFilter) return false;

        // Color Filter
        if (colorFilter !== 'all' && item.color !== colorFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.productTitle.localeCompare(b.productTitle);
        if (sortBy === 'stock_asc') return a.stockQuantity - b.stockQuantity;
        if (sortBy === 'stock_desc') return b.stockQuantity - a.stockQuantity;
        if (sortBy === 'cost_desc') return b.totalCostValue - a.totalCostValue;
        if (sortBy === 'value_desc') return b.totalRetailValue - a.totalRetailValue;
        if (sortBy === 'sku') return a.sku.localeCompare(b.sku);
        return 0;
      });
  }, [items, searchQuery, statusFilter, categoryFilter, sizeFilter, colorFilter, sortBy, isItemLiveWithStock]);

  // Aggregated filtered totals
  const filteredTotals = useMemo(() => {
    let pieces = 0;
    let cost = 0;
    let retail = 0;
    filteredItems.forEach((i) => {
      pieces += i.stockQuantity;
      cost += i.totalCostValue;
      retail += i.totalRetailValue;
    });
    return {
      count: filteredItems.length,
      pieces,
      cost,
      retail,
      profit: retail - cost,
      margin: retail > 0 ? ((retail - cost) / retail) * 100 : 0,
    };
  }, [filteredItems]);

  // =========================================================================
  // EXPORTAÇÃO EXCEL (.XLSX) PROFISSIONAL COM CÁLCULO EM DÓLAR ($ USD)
  // =========================================================================
  const handleExportExcel = (forceOnlyLive = false) => {
    const itemsToExport = forceOnlyLive ? items.filter(isItemLiveWithStock) : filteredItems;

    if (itemsToExport.length === 0) {
      showToast('Nenhum item para exportar com os filtros selecionados.', 'error');
      return;
    }

    const totalPieces = itemsToExport.reduce((acc, i) => acc + i.stockQuantity, 0);
    const totalCost = itemsToExport.reduce((acc, i) => acc + i.totalCostValue, 0);
    const totalRetail = itemsToExport.reduce((acc, i) => acc + i.totalRetailValue, 0);
    const totalProfit = totalRetail - totalCost;
    const marginPct = totalRetail > 0 ? (totalProfit / totalRetail) * 100 : 0;

    const dateStr = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleString('pt-BR');

    const wb = XLSX.utils.book_new();

    const wsData: any[][] = [
      ['ANA FITNESS WEAR • RELATÓRIO OFICIAL DE ESTOQUE (VALUATION EM DÓLAR)'],
      [
        forceOnlyLive || statusFilter === 'live_only'
          ? 'FILTRO: SOMENTE PEÇAS NO AR (VITRINE ATIVA COM ESTOQUE DISPONÍVEL)'
          : 'FILTRO: CATÁLOGO GERAL DE ESTOQUE',
      ],
      [`Data de Emissão: ${timestamp}`],
      [''],
      ['--- RESUMO FINANCEIRO EM DÓLAR ($ USD) ---', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Total de Peças Físicas em Estoque:', totalPieces, 'unidades'],
      ['Total de Modelos / SKUs Únicos:', itemsToExport.length, 'combinações'],
      ['VALOR TOTAL DE MERCADORIA (CUSTO INVESTIDO):', Number(totalCost.toFixed(2)), 'USD ($)'],
      ['POTENCIAL TOTAL DE FATURAMENTO (VENDA):', Number(totalRetail.toFixed(2)), 'USD ($)'],
      ['LUCRO BRUTO ESTIMADO:', Number(totalProfit.toFixed(2)), `USD ($) (${marginPct.toFixed(1)}% margem)`],
      [''],
      [
        'PRODUTO',
        'CATEGORIA',
        'COR',
        'TAMANHO',
        'SKU',
        'CÓDIGO DE BARRAS',
        'ESTOQUE ATUAL (UN)',
        'CUSTO UNITÁRIO ($ USD)',
        'CUSTO TOTAL MERCADORIA ($ USD)',
        'PREÇO DE VENDA ($ USD)',
        'VALOR TOTAL DE VENDA ($ USD)',
        'LUCRO ESTIMADO ($ USD)',
        'MARGEM (%)',
        'SITUAÇÃO NA LOJA',
      ],
    ];

    itemsToExport.forEach((i) => {
      const isLive = isItemLiveWithStock(i);
      const situacao = isLive
        ? 'No Ar (Ativo)'
        : i.stockQuantity === 0
        ? 'Esgotado'
        : i.isDraft
        ? 'Rascunho'
        : 'Fora do Ar';

      wsData.push([
        i.productTitle,
        i.category,
        i.color,
        i.size,
        i.sku,
        i.barcode || '',
        i.stockQuantity,
        Number(i.unitCost.toFixed(2)),
        Number(i.totalCostValue.toFixed(2)),
        Number(i.unitPrice.toFixed(2)),
        Number(i.totalRetailValue.toFixed(2)),
        Number((i.totalRetailValue - i.totalCostValue).toFixed(2)),
        Number(i.marginEstimate.toFixed(1)),
        situacao,
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
      Number(totalCost.toFixed(2)),
      '',
      Number(totalRetail.toFixed(2)),
      Number(totalProfit.toFixed(2)),
      Number(marginPct.toFixed(1)),
      '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 36 }, // Produto
      { wch: 18 }, // Categoria
      { wch: 22 }, // Cor
      { wch: 10 }, // Tamanho
      { wch: 20 }, // SKU
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

    const sheetName = forceOnlyLive || statusFilter === 'live_only' ? 'Estoque no Ar ($ USD)' : 'Estoque Geral';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fileName = `relatorio_estoque_${forceOnlyLive || statusFilter === 'live_only' ? 'no_ar' : 'geral'}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(`Planilha Excel baixada com sucesso: ${fileName}`);
  };

  // =========================================================================
  // EXPORTAÇÃO CSV FORMATADA COM BOM UTF-8
  // =========================================================================
  const handleExportCSV = (forceOnlyLive = false) => {
    const itemsToExport = forceOnlyLive ? items.filter(isItemLiveWithStock) : filteredItems;

    if (itemsToExport.length === 0) {
      showToast('Nenhum item para exportar com os filtros atuais.', 'error');
      return;
    }

    const totalPieces = itemsToExport.reduce((acc, i) => acc + i.stockQuantity, 0);
    const totalCost = itemsToExport.reduce((acc, i) => acc + i.totalCostValue, 0);
    const totalRetail = itemsToExport.reduce((acc, i) => acc + i.totalRetailValue, 0);
    const totalProfit = totalRetail - totalCost;
    const marginPct = totalRetail > 0 ? (totalProfit / totalRetail) * 100 : 0;

    const headers = [
      'Produto',
      'Categoria',
      'Cor',
      'Tamanho',
      'SKU',
      'Codigo de Barras',
      'Estoque Atual',
      'Preco de Custo (USD)',
      'Total de Custo de Mercadoria (USD)',
      'Preco de Venda (USD)',
      'Total de Venda (USD)',
      'Lucro Projetado (USD)',
      'Margem (%)',
      'Situacao',
    ];

    const rows = itemsToExport.map((i) => [
      `"${i.productTitle.replace(/"/g, '""')}"`,
      `"${i.category.replace(/"/g, '""')}"`,
      `"${i.color.replace(/"/g, '""')}"`,
      `"${i.size.replace(/"/g, '""')}"`,
      `"${i.sku.replace(/"/g, '""')}"`,
      `"${i.barcode.replace(/"/g, '""')}"`,
      i.stockQuantity,
      i.unitCost.toFixed(2),
      i.totalCostValue.toFixed(2),
      i.unitPrice.toFixed(2),
      i.totalRetailValue.toFixed(2),
      (i.totalRetailValue - i.totalCostValue).toFixed(2),
      i.marginEstimate.toFixed(1) + '%',
      isItemLiveWithStock(i) ? 'No Ar' : i.stockQuantity === 0 ? 'Esgotado' : 'Fora do Ar',
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const timestampStr = new Date().toLocaleString('pt-BR');

    const summaryHeader = [
      `"ANA FITNESS WEAR - RELATORIO DE ESTOQUE (VALUATION EM DOLAR)"`,
      `"Filtro: ${forceOnlyLive || statusFilter === 'live_only' ? 'SOMENTE PECAS NO AR COM ESTOQUE' : 'TODOS OS ITENS'}"`,
      `"Data de Emissao: ${timestampStr}"`,
      `"TOTAL DE PECAS: ${totalPieces} unidades | SKUs: ${itemsToExport.length}"`,
      `"VALOR TOTAL EM MERCADORIA (CUSTO): $${totalCost.toFixed(2)} USD"`,
      `"VALOR TOTAL EM VITRINE (VENDA): $${totalRetail.toFixed(2)} USD"`,
      `"LUCRO BRUTO ESTIMADO: $${totalProfit.toFixed(2)} USD (${marginPct.toFixed(1)}% Margem)"`,
      '',
    ].join('\r\n');

    const csvContent =
      '\uFEFF' +
      summaryHeader +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n') +
      `\r\n"TOTAL GERAL","","","","","",${totalPieces},"","$${totalCost.toFixed(2)}","","$${totalRetail.toFixed(2)}","$${totalProfit.toFixed(2)}","${marginPct.toFixed(1)}%",""`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_estoque_${forceOnlyLive || statusFilter === 'live_only' ? 'no_ar' : 'geral'}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório CSV exportado com sucesso!');
  };

  // =========================================================================
  // IMPRESSÃO / SALVAR EM PDF FORMATADO COM VALUATION EM DÓLAR
  // =========================================================================
  const handlePrintValuationReport = (forceOnlyLive = false) => {
    const itemsToPrint = forceOnlyLive ? items.filter(isItemLiveWithStock) : filteredItems;

    if (itemsToPrint.length === 0) {
      showToast('Nenhum item para impressão.', 'error');
      return;
    }

    const totalPieces = itemsToPrint.reduce((acc, i) => acc + i.stockQuantity, 0);
    const totalCost = itemsToPrint.reduce((acc, i) => acc + i.totalCostValue, 0);
    const totalRetail = itemsToPrint.reduce((acc, i) => acc + i.totalRetailValue, 0);
    const totalProfit = totalRetail - totalCost;
    const marginPct = totalRetail > 0 ? (totalProfit / totalRetail) * 100 : 0;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Permita popups no navegador para visualizar o relatório para impressão.');
      return;
    }

    const rowsHtml = itemsToPrint
      .map(
        (i, idx) => `
        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: 6px 8px; font-weight: bold; font-size: 11px;">${i.productTitle}</td>
          <td style="padding: 6px 8px; font-size: 10px; color: #4b5563;">${i.category}</td>
          <td style="padding: 6px 8px; font-size: 11px;"><strong>${i.color}</strong></td>
          <td style="padding: 6px 8px; text-align: center; font-size: 11px;"><span style="display: inline-block; padding: 2px 6px; background: #000; color: #fff; border-radius: 4px; font-weight: bold;">${i.size}</span></td>
          <td style="padding: 6px 8px; font-family: monospace; font-size: 10px;">${i.sku}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: 900; font-size: 12px; color: #111827;">${i.stockQuantity} un</td>
          <td style="padding: 6px 8px; text-align: right; font-size: 11px; color: #374151;">$${i.unitCost.toFixed(2)}</td>
          <td style="padding: 6px 8px; text-align: right; font-weight: bold; font-size: 11px; color: #b45309; background: #fffbeb;">$${i.totalCostValue.toFixed(2)}</td>
          <td style="padding: 6px 8px; text-align: right; font-size: 11px; color: #374151;">$${i.unitPrice.toFixed(2)}</td>
          <td style="padding: 6px 8px; text-align: right; font-weight: bold; font-size: 11px; color: #059669; background: #ecfdf5;">$${i.totalRetailValue.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Oficial de Estoque no Ar - Valuation em Dólar - Ana Fitness</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 12mm; color: #111; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
            .logo { font-size: 22px; font-weight: 900; letter-spacing: 1px; }
            .subtitle { font-size: 11px; color: #b45309; font-weight: bold; text-transform: uppercase; margin-top: 2px; }
            .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f9fafb; border: 1.5px solid #000; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 11px; }
            .kpi-title { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #6b7280; letter-spacing: 0.5px; }
            .kpi-val { font-size: 18px; font-weight: 900; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { background: #000; color: #fff; padding: 7px 8px; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; text-align: left; }
            tfoot td { background: #111827; color: #fff; font-weight: 900; padding: 10px 8px; font-size: 11px; }
            @media print {
              body { margin: 8mm; }
              @page { size: landscape; margin: 8mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">ANA FITNESS WEAR</div>
              <div class="subtitle">★ RELATÓRIO OFICIAL DE ESTOQUE NO AR & VALUATION EM DÓLAR ($ USD) ★</div>
            </div>
            <div style="text-align: right; font-size: 11px; font-family: monospace;">
              <div><strong>DATA DE EMISSÃO:</strong> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              <div><strong>ESCOPO:</strong> ${forceOnlyLive || statusFilter === 'live_only' ? 'Somente Peças no Ar (Vitrine Ativa)' : 'Estoque Filtrado'}</div>
              <div><strong>TOTAL DE SKUs:</strong> ${itemsToPrint.length} variações</div>
            </div>
          </div>

          <div class="kpis">
            <div>
              <div class="kpi-title">Peças Físicas no Ar</div>
              <div class="kpi-val" style="color: #000;">${totalPieces} un</div>
              <div style="font-size: 9px; color: #666; margin-top: 2px;">Saldo real em prateleira</div>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 6px 10px; border-radius: 6px;">
              <div class="kpi-title" style="color: #b45309;">CUSTO TOTAL DE MERCADORIA</div>
              <div class="kpi-val" style="color: #b45309;">$${totalCost.toFixed(2)} USD</div>
              <div style="font-size: 9px; color: #92400e; font-weight: bold; margin-top: 2px;">Valor em dólar investido</div>
            </div>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 6px 10px; border-radius: 6px;">
              <div class="kpi-title" style="color: #059669;">POTENCIAL TOTAL DE VENDA</div>
              <div class="kpi-val" style="color: #059669;">$${totalRetail.toFixed(2)} USD</div>
              <div style="font-size: 9px; color: #065f46; font-weight: bold; margin-top: 2px;">Preço bruto de vitrine</div>
            </div>
            <div>
              <div class="kpi-title">LUCRO BRUTO ESTIMADO</div>
              <div class="kpi-val" style="color: #2563eb;">$${totalProfit.toFixed(2)} USD</div>
              <div style="font-size: 9px; color: #1d4ed8; font-weight: bold; margin-top: 2px;">Margem: ${marginPct.toFixed(1)}%</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Cor</th>
                <th style="text-align: center;">Tam</th>
                <th>SKU</th>
                <th style="text-align: center;">Estoque</th>
                <th style="text-align: right;">Custo Unit.</th>
                <th style="text-align: right; background: #b45309;">Total Custo Mercadoria ($)</th>
                <th style="text-align: right;">Preço Venda</th>
                <th style="text-align: right; background: #059669;">Total Venda ($)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="text-transform: uppercase;">TOTAL GERAL (${itemsToPrint.length} MODELOS):</td>
                <td style="text-align: center;">${totalPieces} un</td>
                <td style="text-align: right;">—</td>
                <td style="text-align: right; color: #fde68a;">$${totalCost.toFixed(2)}</td>
                <td style="text-align: right;">—</td>
                <td style="text-align: right; color: #6ee7b7;">$${totalRetail.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 24px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9px; color: #666; display: flex; justify-content: space-between;">
            <span>Ana Fitness Wear • Leominster, Massachusetts USA • Relatório de Avaliação Financeira</span>
            <span>Emitido por: Backoffice Administrativo</span>
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold transition-all transform duration-300 ${
            toastMsg.type === 'success'
              ? 'bg-deep-black text-gold border-gold/40 shadow-gold/20'
              : 'bg-red-950 text-red-200 border-red-700'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-gold" /> : <XCircle className="w-5 h-5 text-red-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* =====================================================================
          CARD EXECUTIVO: VALUATION EM DÓLAR DE PEÇAS NO AR
         ===================================================================== */}
      <div className="bg-gradient-to-br from-deep-black via-zinc-900 to-black text-white rounded-3xl p-6 sm:p-8 border-2 border-gold/50 shadow-2xl shadow-gold/10 relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/40 text-[11px] font-black uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>VALUATION OFICIAL EM DÓLAR ($ USD)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                Quanto Você Tem em Mercadoria no Ar
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl mt-1">
                Cálculo financeiro consolidado de peças <strong>ativas na vitrine da loja</strong> com estoque disponível.
                Exclui rascunhos, spoilers e produtos esgotados.
              </p>
            </div>

            {/* Botões de Ação Rápida */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              {/* Botão Baixar Excel */}
              <button
                onClick={() => handleExportExcel(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                title="Baixar planilha completa em formato Excel (.xlsx) das peças no ar com custos e preços em dólar"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Baixar Excel (.xlsx)</span>
              </button>

              {/* Botão Exportar CSV */}
              <button
                onClick={() => handleExportCSV(true)}
                className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider border border-white/20 transition cursor-pointer"
                title="Baixar em formato CSV compatível com planilhas"
              >
                <Download className="w-4 h-4 text-gold" />
                <span>Baixar CSV</span>
              </button>

              {/* Botão Imprimir / PDF */}
              <button
                onClick={() => handlePrintValuationReport(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gold text-deep-black hover:bg-gold-light text-xs font-black uppercase tracking-wider shadow-lg shadow-gold/20 transition transform hover:-translate-y-0.5 cursor-pointer"
                title="Abrir folha formal de valuation para impressão ou Salvar como PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {/* Grid dos 4 KPIs de Valuation em Dólar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            {/* KPI 1: Total de Peças Físicas no Ar */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-300">
                  Peças no Ar (Físico)
                </span>
                <Package className="w-4 h-4 text-gold" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {liveSummaryTotals.pieces}
                <span className="text-xs sm:text-sm font-normal text-gray-400 ml-1.5">unidades</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Em <strong className="text-gold font-bold">{liveSummaryTotals.variantsCount}</strong> modelos/variações
              </div>
            </div>

            {/* KPI 2: Custo Total em Mercadoria (O DADO CHAVE PEDIDO) */}
            <div className="bg-amber-500/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-2 border-amber-500/40 relative">
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                CUSTO REAL
              </div>
              <div className="flex items-center justify-between text-amber-400 mb-1">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                  Valor em Mercadoria
                </span>
                <BadgeDollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 tracking-tight">
                ${liveSummaryTotals.cost.toFixed(2)}
                <span className="text-xs sm:text-sm font-bold text-amber-300/70 ml-1">USD</span>
              </div>
              <div className="text-[11px] text-amber-200/80 mt-1">
                Dinheiro investido nas peças no ar
              </div>
            </div>

            {/* KPI 3: Potencial de Venda (Preço de Vitrine) */}
            <div className="bg-emerald-500/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-2 border-emerald-500/40 relative">
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                FATURAMENTO BRUTO
              </div>
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                  Potencial de Vitrine
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 tracking-tight">
                ${liveSummaryTotals.retail.toFixed(2)}
                <span className="text-xs sm:text-sm font-bold text-emerald-300/70 ml-1">USD</span>
              </div>
              <div className="text-[11px] text-emerald-200/80 mt-1">
                Valor bruto ao vender todas as peças
              </div>
            </div>

            {/* KPI 4: Lucro Estimado & Margem */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-300">
                  Lucro Bruto Projetado
                </span>
                <DollarSign className="w-4 h-4 text-gold" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                ${liveSummaryTotals.profit.toFixed(2)}
                <span className="text-xs sm:text-sm font-bold text-gray-400 ml-1">USD</span>
              </div>
              <div className="text-[11px] text-gold font-bold mt-1">
                Margem média: {liveSummaryTotals.margin.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          BARRA DE ABAS RÁPIDAS DE FILTRO POR SITUAÇÃO
         ===================================================================== */}
      <div className="bg-white dark:bg-deep-black/60 rounded-2xl p-3 border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-2 overflow-x-auto">
        {/* Aba 1: Somente Peças no Ar (Destaque Principal) */}
        <button
          onClick={() => setStatusFilter('live_only')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            statusFilter === 'live_only'
              ? 'bg-gold text-deep-black shadow-md shadow-gold/20 ring-2 ring-gold'
              : 'bg-gold/10 text-gold hover:bg-gold/20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>🌟 Somente Peças no Ar ({liveSummaryTotals.pieces} un • ${liveSummaryTotals.cost.toFixed(2)} USD)</span>
        </button>

        {/* Aba 2: Todos os SKUs Cadastrados */}
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-deep-black text-white dark:bg-white dark:text-deep-black'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Todos os SKUs ({items.length})</span>
        </button>

        {/* Aba 3: Em Estoque */}
        <button
          onClick={() => setStatusFilter('in_stock')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            statusFilter === 'in_stock'
              ? 'bg-emerald-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Em Estoque (&gt; 0 un)</span>
        </button>

        {/* Aba 4: Estoque Baixo */}
        <button
          onClick={() => setStatusFilter('low_stock')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            statusFilter === 'low_stock'
              ? 'bg-amber-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Estoque Baixo (1 a 3 un)</span>
        </button>

        {/* Aba 5: Esgotados */}
        <button
          onClick={() => setStatusFilter('out_of_stock')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            statusFilter === 'out_of_stock'
              ? 'bg-red-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-red-500" />
          <span>Esgotados (0 un)</span>
        </button>

        {/* Aba 6: Rascunhos / Fora do Ar */}
        <button
          onClick={() => setStatusFilter('drafts')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            statusFilter === 'drafts'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5 text-purple-400" />
          <span>Fora do Ar / Rascunhos</span>
        </button>
      </div>

      {/* =====================================================================
          FILTROS ADICIONAIS: BUSCA, CATEGORIA, TAMANHO, COR E ORDENAÇÃO
         ===================================================================== */}
      <div className="bg-white dark:bg-deep-black/60 rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Busca por texto */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por produto, SKU, código de barras, cor..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-gold transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro de Categoria */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-gold transition"
            >
              <option value="all">📂 Todas as Categorias ({categoriesList.length})</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Tamanho */}
          <div>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-gold transition"
            >
              <option value="all">📏 Todos os Tamanhos ({sizesList.length})</option>
              {sizesList.map((sz) => (
                <option key={sz} value={sz}>
                  Tamanho: {sz}
                </option>
              ))}
            </select>
          </div>

          {/* Ordenação */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-gold transition"
            >
              <option value="stock_desc">Maior Estoque Físico</option>
              <option value="stock_asc">Menor Estoque (Reposição Urgente)</option>
              <option value="cost_desc">Maior Custo Total de Mercadoria ($)</option>
              <option value="value_desc">Maior Valor de Venda ($)</option>
              <option value="title">Nome do Produto (A-Z)</option>
              <option value="sku">Código SKU</option>
            </select>
          </div>
        </div>

        {/* Cores e Botões de Ação para a visualização filtrada */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gold" /> Cor:
            </span>
            <button
              onClick={() => setColorFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                colorFilter === 'all'
                  ? 'bg-gold text-deep-black font-black'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            {colorsList.slice(0, 8).map((c) => (
              <button
                key={c}
                onClick={() => setColorFilter(colorFilter === c ? 'all' : c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  colorFilter === c
                    ? 'bg-gold text-deep-black font-black shadow-sm'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
            {colorsList.length > 8 && (
              <select
                value={colorsList.slice(8).includes(colorFilter) ? colorFilter : ''}
                onChange={(e) => setColorFilter(e.target.value || 'all')}
                className="px-2 py-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-lg text-xs border-0"
              >
                <option value="">+ Outras cores ({colorsList.length - 8})</option>
                {colorsList.slice(8).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInventory(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-gold' : ''}`} />
              <span>{refreshing ? 'Atualizando...' : 'Recarregar'}</span>
            </button>
            <button
              onClick={() => handleExportExcel(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 transition"
              title="Baixar planilha Excel com a listagem exatamente como está filtrada na tela"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Visualização Atual</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          TABELA DETALHADA DE ESTOQUE
         ===================================================================== */}
      <div className="bg-white dark:bg-deep-black/60 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Carregando inventário de produtos...</p>
            <p className="text-xs text-gray-400 mt-1">Sincronizando variações e saldos com o banco de dados.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-40" />
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">Nenhum item encontrado com estes filtros.</p>
            <p className="text-xs text-gray-400 mt-1">Tente ajustar a busca ou clicar em &quot;Somente Peças no Ar&quot;.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('live_only');
                setCategoryFilter('all');
                setSizeFilter('all');
                setColorFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-gold text-deep-black text-xs font-black rounded-xl transition"
            >
              Ver Peças no Ar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Peça / Produto</th>
                  <th className="py-3.5 px-4">Categoria</th>
                  <th className="py-3.5 px-4">Cor</th>
                  <th className="py-3.5 px-4 text-center">Tam</th>
                  <th className="py-3.5 px-4">SKU & Código</th>
                  <th className="py-3.5 px-4 text-center">Estoque Físico</th>
                  <th className="py-3.5 px-4 text-right">Custo Unitário</th>
                  <th className="py-3.5 px-4 text-right bg-amber-500/5 text-amber-600 dark:text-amber-400">
                    Custo Mercadoria ($)
                  </th>
                  <th className="py-3.5 px-4 text-right">Preço Venda</th>
                  <th className="py-3.5 px-4 text-right bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                    Total Venda ($)
                  </th>
                  <th className="py-3.5 px-4 text-center">Status Loja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                {filteredItems.map((item) => {
                  const isLow = item.stockQuantity > 0 && item.stockQuantity <= 3;
                  const isOut = item.stockQuantity === 0;
                  const isEditing = editingId === item.id;
                  const isSaving = savingId === item.id;
                  const isLive = isItemLiveWithStock(item);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gold/5 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Foto e Título */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 shrink-0">
                            {item.image && item.image !== '/placeholder.png' ? (
                              <Image
                                src={item.image}
                                alt={item.productTitle}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-5 h-5 opacity-40" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-gold transition">
                              {item.productTitle}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                              <a
                                href={`/produto/${item.productSlug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-gold flex items-center gap-1 transition"
                              >
                                Ver na loja <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              {item.isSpoiler && (
                                <span className="bg-purple-500/20 text-purple-300 px-1 rounded text-[9px] font-bold">
                                  Spoiler
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                          {item.category}
                        </span>
                      </td>

                      {/* Cor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shrink-0 shadow-sm"
                            style={{
                              backgroundColor: item.colorHex || '#555555',
                            }}
                          />
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {item.color}
                          </span>
                        </div>
                      </td>

                      {/* Tamanho */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-black bg-deep-black text-gold border border-gold/40 shadow-sm">
                          {item.size}
                        </span>
                      </td>

                      {/* SKU & Código de Barras */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-gray-800 dark:text-gray-300">
                          {item.sku}
                        </div>
                        {item.barcode && (
                          <div className="flex items-center gap-1 font-mono text-[10px] text-gray-400 mt-0.5">
                            <Barcode className="w-3 h-3 text-gold/70" />
                            <span>{item.barcode}</span>
                          </div>
                        )}
                      </td>

                      {/* Quantidade em Estoque Físico com Ajuste Rápido */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1 bg-white dark:bg-black p-1 rounded-xl border border-gold shadow-lg">
                            <input
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                              className="w-14 text-center py-1 bg-transparent text-sm font-black text-gray-900 dark:text-white focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateStock(item, editValue);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => handleUpdateStock(item, editValue)}
                              disabled={isSaving}
                              className="p-1 rounded-lg bg-gold text-deep-black hover:bg-gold-light transition cursor-pointer"
                              title="Salvar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-white transition cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-xl border border-gray-200 dark:border-white/10 group-hover:border-gold/40 transition">
                            <button
                              onClick={() => handleUpdateStock(item, item.stockQuantity - 1)}
                              disabled={item.stockQuantity <= 0 || isSaving}
                              className="p-1 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                              title="Diminuir 1 unidade"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setEditValue(item.stockQuantity);
                              }}
                              className={`px-2 py-0.5 rounded-md font-black text-sm tracking-tight hover:bg-gold/20 hover:text-gold transition cursor-pointer ${
                                isOut
                                  ? 'text-red-500 font-extrabold'
                                  : isLow
                                  ? 'text-amber-500 font-extrabold'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                              title="Clique para digitar a quantidade"
                            >
                              {isSaving ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-gold" />
                              ) : (
                                `${item.stockQuantity} un`
                              )}
                            </button>

                            <button
                              onClick={() => handleUpdateStock(item, item.stockQuantity + 1)}
                              disabled={isSaving}
                              className="p-1 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition cursor-pointer"
                              title="Aumentar 1 unidade"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Custo Unitário */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-semibold text-gray-700 dark:text-gray-300">
                          ${item.unitCost.toFixed(2)}
                        </div>
                      </td>

                      {/* Custo Total de Mercadoria (Qtd x Custo) */}
                      <td className="py-3 px-4 text-right bg-amber-500/[0.03]">
                        <div className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                          ${item.totalCostValue.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {item.stockQuantity} un × ${item.unitCost.toFixed(2)}
                        </div>
                      </td>

                      {/* Preço de Venda Unitário */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-semibold text-gray-700 dark:text-gray-300">
                          ${item.unitPrice.toFixed(2)}
                        </div>
                      </td>

                      {/* Total de Venda (Qtd x Preço) */}
                      <td className="py-3 px-4 text-right bg-emerald-500/[0.03]">
                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          ${item.totalRetailValue.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                          Lucro: ${(item.totalRetailValue - item.totalCostValue).toFixed(2)}
                        </div>
                      </td>

                      {/* Status na Loja */}
                      <td className="py-3 px-4 text-center">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <Sparkles className="w-3 h-3 text-emerald-500" /> No Ar
                          </span>
                        ) : isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30">
                            <XCircle className="w-3 h-3" /> Esgotado
                          </span>
                        ) : item.isDraft ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            <EyeOff className="w-3 h-3" /> Rascunho
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/30">
                            Fora do Ar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Rodapé com Totais Consolidados */}
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/[0.04] text-xs font-black">
                  <td colSpan={5} className="py-4 px-4 text-gray-900 dark:text-white uppercase tracking-wider">
                    TOTAL DOS ITENS FILTRADOS ({filteredTotals.count} SKUs):
                  </td>
                  <td className="py-4 px-4 text-center text-sm font-black text-gold">
                    {filteredTotals.pieces} un
                  </td>
                  <td className="py-4 px-4 text-right text-gray-400">—</td>
                  <td className="py-4 px-4 text-right text-sm font-black text-amber-500 bg-amber-500/10">
                    ${filteredTotals.cost.toFixed(2)} USD
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                      Custo Mercadoria
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-gray-400">—</td>
                  <td className="py-4 px-4 text-right text-sm font-black text-emerald-500 bg-emerald-500/10">
                    ${filteredTotals.retail.toFixed(2)} USD
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                      Faturamento Bruto
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-[11px] font-bold text-gold">
                    Lucro: ${filteredTotals.profit.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
