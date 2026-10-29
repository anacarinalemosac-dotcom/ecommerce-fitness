'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
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
  marginEstimate: number;
  image: string;
  visibleOnline: boolean;
  isSpoiler: boolean;
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
}

export function InventoryReportView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'stock_asc' | 'stock_desc' | 'value_desc' | 'sku'>('stock_asc');

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
    setTimeout(() => setToastMsg(null), 3500);
  };

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
            return {
              ...it,
              stockQuantity: updatedStock,
              totalCostValue: updatedStock * it.unitCost,
              totalRetailValue: updatedStock * it.unitPrice,
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
        if (statusFilter === 'in_stock' && item.stockQuantity <= 0) return false;
        if (statusFilter === 'low_stock' && (item.stockQuantity <= 0 || item.stockQuantity > 3)) return false;
        if (statusFilter === 'out_of_stock' && item.stockQuantity > 0) return false;

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
        if (sortBy === 'value_desc') return b.totalRetailValue - a.totalRetailValue;
        if (sortBy === 'sku') return a.sku.localeCompare(b.sku);
        return 0;
      });
  }, [items, searchQuery, statusFilter, categoryFilter, sizeFilter, colorFilter, sortBy]);

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

  // Export CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      showToast('Nenhum item para exportar com os filtros atuais.', 'error');
      return;
    }

    const headers = [
      'Produto',
      'Categoria',
      'Cor',
      'Tamanho',
      'SKU',
      'Codigo de Barras',
      'Estoque Atual',
      'Preco de Custo (USD)',
      'Preco de Venda (USD)',
      'Total Custo (USD)',
      'Total Venda (USD)',
      'Situacao',
    ];

    const rows = filteredItems.map((i) => [
      `"${i.productTitle.replace(/"/g, '""')}"`,
      `"${i.category.replace(/"/g, '""')}"`,
      `"${i.color.replace(/"/g, '""')}"`,
      `"${i.size.replace(/"/g, '""')}"`,
      `"${i.sku.replace(/"/g, '""')}"`,
      `"${i.barcode.replace(/"/g, '""')}"`,
      i.stockQuantity,
      i.unitCost.toFixed(2),
      i.unitPrice.toFixed(2),
      i.totalCostValue.toFixed(2),
      i.totalRetailValue.toFixed(2),
      i.stockQuantity === 0 ? 'Esgotado' : i.stockQuantity <= 3 ? 'Estoque Baixo' : 'Em Estoque',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_conferencia_estoque_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório CSV exportado com sucesso!');
  };

  // Printable Inventory Checklist Sheet
  const handlePrintChecklist = () => {
    if (filteredItems.length === 0) {
      showToast('Nenhum item filtrado para impressão.', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Permita popups no navegador para imprimir a folha de conferência.');
      return;
    }

    const rowsHtml = filteredItems
      .map(
        (i, idx) => `
        <tr style="border-bottom: 1px solid #e5e7eb; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: 6px 8px; font-weight: bold; font-size: 11px;">${i.productTitle}</td>
          <td style="padding: 6px 8px; font-size: 10px; color: #4b5563;">${i.category}</td>
          <td style="padding: 6px 8px; font-size: 11px;"><strong>${i.color}</strong></td>
          <td style="padding: 6px 8px; text-align: center; font-size: 11px;"><span style="display: inline-block; padding: 2px 6px; background: #000; color: #fff; border-radius: 4px; font-weight: bold;">${i.size}</span></td>
          <td style="padding: 6px 8px; font-family: monospace; font-size: 10px;">${i.sku}</td>
          <td style="padding: 6px 8px; font-family: monospace; font-size: 10px; color: #374151;">${i.barcode || '—'}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold; font-size: 12px; color: ${i.stockQuantity === 0 ? '#dc2626' : '#111827'};">${i.stockQuantity} un</td>
          <td style="padding: 6px 8px; text-align: center; border: 1.5px dashed #9ca3af; min-width: 80px; background: #fff;">
            <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #000; vertical-align: middle; margin-right: 6px;"></span>
            <span style="font-size: 9px; color: #6b7280;">_____ un</span>
          </td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Folha de Conferência de Estoque - Ana Fitness</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 15mm; color: #000; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
            .logo { font-size: 22px; font-weight: 900; letter-spacing: 1px; }
            .subtitle { font-size: 10px; color: #555; text-transform: uppercase; margin-top: 2px; }
            .kpis { display: flex; gap: 20px; background: #f3f4f6; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; font-size: 11px; }
            .kpis div { flex: 1; }
            .kpis strong { font-size: 14px; display: block; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { background: #000; color: #fff; padding: 8px; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; text-align: left; }
            @media print {
              body { margin: 10mm; }
              @page { size: portrait; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">ANA FITNESS WEAR</div>
              <div class="subtitle">FOLHA OFICIAL DE CONFERÊNCIA FÍSICA & AUDITORIA DE ESTOQUE</div>
            </div>
            <div style="text-align: right; font-size: 11px; font-family: monospace;">
              <div><strong>DATA:</strong> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              <div><strong>TOTAL DE ITENS:</strong> ${filteredItems.length} SKUs</div>
              <div><strong>PEÇAS NO SISTEMA:</strong> ${filteredTotals.pieces} un</div>
            </div>
          </div>

          <div class="kpis">
            <div>Filtro de Categoria: <strong>${categoryFilter === 'all' ? 'Todas' : categoryFilter}</strong></div>
            <div>Filtro de Tamanho: <strong>${sizeFilter === 'all' ? 'Todos' : sizeFilter}</strong></div>
            <div>Filtro de Situação: <strong>${statusFilter === 'all' ? 'Todos os Itens' : statusFilter}</strong></div>
            <div>Auditor Responsável: <strong>____________________________</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Cor</th>
                <th style="text-align: center;">Tam</th>
                <th>SKU</th>
                <th>Cód. Barras</th>
                <th style="text-align: center;">Sistema</th>
                <th style="text-align: center; background: #374151;">[✓] Físico Contado</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9px; color: #666; display: flex; justify-content: space-between;">
            <span>Ana Fitness Wear • Leominster, Massachusetts USA</span>
            <span>Assinatura do Conferente: _____________________________________</span>
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

      {/* Header & Main Control Bar */}
      <div className="bg-white dark:bg-deep-black/60 rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                Conferência de Estoque & Inventário Geral
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                  {items.length} SKUs Registrados
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Relação analítica de peças físicas por produto, cor e tamanho. Filtre, audite e ajuste as quantidades em tempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchInventory(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white text-xs font-bold border border-gray-300 dark:border-white/10 transition"
            title="Recarregar dados do banco"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-gold' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 transition"
            title="Exportar planilha Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrintChecklist}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gold text-deep-black hover:bg-gold-light text-xs font-black shadow-md shadow-gold/10 transition"
            title="Imprimir folha de contagem física para o depósito"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Folha de Conferência</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Peças Físicas */}
        <div className="bg-white dark:bg-deep-black/60 rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Peças Físicas</span>
            <Package className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {stats ? stats.totalStockPieces : 0}
            <span className="text-xs font-normal text-gray-400 ml-1">unidades</span>
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            Filtradas: <strong className="text-gold font-bold">{filteredTotals.pieces} un</strong>
          </div>
        </div>

        {/* SKUs Ativos */}
        <div className="bg-white dark:bg-deep-black/60 rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">SKUs / Modelos</span>
            <Tag className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {stats ? stats.totalVariants : 0}
            <span className="text-xs font-normal text-gray-400 ml-1">combinações</span>
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            Filtrados: <strong className="text-indigo-400 font-bold">{filteredTotals.count}</strong>
          </div>
        </div>

        {/* Valor Total em Custo */}
        <div className="bg-white dark:bg-deep-black/60 rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Patrimônio (Custo)</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            ${stats ? stats.totalCostAsset.toFixed(2) : '0.00'}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            Filtrado: <strong>${filteredTotals.cost.toFixed(2)}</strong>
          </div>
        </div>

        {/* Valor de Venda Projetado */}
        <div className="bg-white dark:bg-deep-black/60 rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faturamento (Venda)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            ${stats ? stats.totalRetailAsset.toFixed(2) : '0.00'}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            Filtrado: <strong>${filteredTotals.retail.toFixed(2)}</strong>
          </div>
        </div>

        {/* Estoque Crítico (1-3 un) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'low_stock' ? 'all' : 'low_stock')}
          className={`cursor-pointer rounded-2xl p-4 border shadow-sm transition ${
            statusFilter === 'low_stock'
              ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-deep-black/60 border-gray-200 dark:border-white/10 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estoque Baixo</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats ? stats.lowStockCount : 0}
            <span className="text-xs font-normal text-gray-400 ml-1">SKUs</span>
          </div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1">
            1 a 3 peças (atenção!)
          </div>
        </div>

        {/* Zerados / Esgotados */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
          className={`cursor-pointer rounded-2xl p-4 border shadow-sm transition ${
            statusFilter === 'out_of_stock'
              ? 'bg-red-500/15 border-red-500 ring-2 ring-red-500/20'
              : 'bg-white dark:bg-deep-black/60 border-gray-200 dark:border-white/10 hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-red-600 dark:text-red-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Esgotados</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {stats ? stats.outOfStockCount : 0}
            <span className="text-xs font-normal text-gray-400 ml-1">SKUs</span>
          </div>
          <div className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-1">
            0 peças (sem estoque)
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-deep-black/60 rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Text Search */}
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

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-gold transition"
            >
              <option value="all">📦 Todas as Situações</option>
              <option value="in_stock">✅ Em Estoque (&gt; 0 un)</option>
              <option value="low_stock">⚠️ Estoque Baixo (1 a 3 un)</option>
              <option value="out_of_stock">🚫 Zerados / Esgotados (0 un)</option>
            </select>
          </div>

          {/* Category Filter */}
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

          {/* Size Filter */}
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
        </div>

        {/* Secondary Filters: Color and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-white/5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gold" /> Filtro por Cor:
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
            <span className="text-gray-400 font-bold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-gold" /> Ordenar:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="stock_asc">Menor Estoque (Reposição Urgente)</option>
              <option value="stock_desc">Maior Estoque</option>
              <option value="title">Nome do Produto (A-Z)</option>
              <option value="value_desc">Maior Valor Total ($)</option>
              <option value="sku">Código SKU</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Items Table */}
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
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">Nenhum item encontrado.</p>
            <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros de busca, categoria ou tamanho acima.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setSizeFilter('all');
                setColorFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-bold rounded-xl transition border border-gold/30"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Peça / Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Cor</th>
                  <th className="py-3 px-4 text-center">Tam</th>
                  <th className="py-3 px-4">SKU & Código de Barras</th>
                  <th className="py-3 px-4 text-center">Estoque Físico (Ajuste)</th>
                  <th className="py-3 px-4 text-right">Custo / Venda</th>
                  <th className="py-3 px-4 text-right">Total em Estoque</th>
                  <th className="py-3 px-4 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                {filteredItems.map((item) => {
                  const isLow = item.stockQuantity > 0 && item.stockQuantity <= 3;
                  const isOut = item.stockQuantity === 0;
                  const isEditing = editingId === item.id;
                  const isSaving = savingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gold/5 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Product Thumbnail & Title */}
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

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                          {item.category}
                        </span>
                      </td>

                      {/* Color */}
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

                      {/* Size */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-black bg-deep-black text-gold border border-gold/40 shadow-sm">
                          {item.size}
                        </span>
                      </td>

                      {/* SKU & Barcode */}
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

                      {/* Stock Quantity with Quick Adjustment */}
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
                              className="p-1 rounded-lg bg-gold text-deep-black hover:bg-gold-light transition"
                              title="Salvar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-white transition"
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
                              className="p-1 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
                              title="Diminuir 1 unidade"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setEditValue(item.stockQuantity);
                              }}
                              className={`px-2 py-0.5 rounded-md font-black text-sm tracking-tight hover:bg-gold/20 hover:text-gold transition ${
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
                              className="p-1 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition"
                              title="Aumentar 1 unidade"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Cost and Retail Unit Prices */}
                      <td className="py-3 px-4 text-right">
                        <div className="text-gray-900 dark:text-white font-bold">
                          ${item.unitPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Custo: ${item.unitCost.toFixed(2)}
                        </div>
                      </td>

                      {/* Total Value in Stock */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          ${item.totalRetailValue.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400/80">
                          Custo: ${item.totalCostValue.toFixed(2)}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30">
                            <XCircle className="w-3 h-3" /> Esgotado
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> Baixo ({item.stockQuantity})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Em Estoque
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer with Totals */}
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/[0.04] text-xs font-black">
                  <td colSpan={5} className="py-3 px-4 text-gray-900 dark:text-white uppercase tracking-wider">
                    TOTAL DOS ITENS FILTRADOS ({filteredTotals.count} SKUs):
                  </td>
                  <td className="py-3 px-4 text-center text-sm font-black text-gold">
                    {filteredTotals.pieces} un
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500">
                    —
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-black text-emerald-500">
                    ${filteredTotals.retail.toFixed(2)}
                    <div className="text-[10px] text-amber-500 font-semibold">
                      Custo: ${filteredTotals.cost.toFixed(2)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-[11px] font-bold text-gold">
                    {filteredTotals.margin.toFixed(1)}% Margem
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
