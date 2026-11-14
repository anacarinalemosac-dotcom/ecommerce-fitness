'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Download,
  Upload,
  PlusCircle,
  MoreHorizontal,
  ChevronDown,
  Edit3,
  Copy,
  ExternalLink,
  CreditCard,
  Sparkles,
  Trash2,
  RefreshCw,
  X,
  Check,
  Tag,
  Ruler,
  Radio,
  Layers,
} from 'lucide-react';

interface WixProductTableProps {
  products: any[];
  totalCatalogCount: number;
  todayCatalogCount: number;
  activeCatalogCount: number;
  draftCatalogCount: number;
  inStockCatalogCount: number;
  outOfStockCatalogCount: number;
  availableCategories: string[];
  productSearch: string;
  setProductSearch: (s: string) => void;
  productCategoryFilter: string;
  setProductCategoryFilter: (c: string) => void;
  productStatusFilter: 'ALL' | 'TODAY' | 'ACTIVE' | 'DRAFT' | 'HIDDEN' | 'IN_STOCK' | 'OUT_OF_STOCK';
  setProductStatusFilter: (st: any) => void;
  productSizeFilter: 'ALL' | 'P' | 'M' | 'G' | 'GG' | 'UN';
  setProductSizeFilter: (sz: any) => void;
  selectedCatalogIds: string[];
  onToggleSelectProduct: (id: string) => void;
  onToggleSelectAllFiltered: () => void;
  onOpenAddForm: () => void;
  onEditProduct: (product: any) => void;
  onDuplicateProduct: (product: any) => void;
  onDeleteProduct: (id: string, title: string) => void;
  onOpenDirectPaymentModal: (product: any) => void;
  onOpenAIStudioModal: (product: any) => void;
  onExportCsv: () => void;
  onImportCsv: () => void;
  onDownloadExcelTemplate: () => void;
  onRefreshProducts: () => void;
  loadingRefresh?: boolean;
  onBulkPrice: () => void;
  onBulkSizeGuide: () => void;
  onBulkDesc: () => void;
  onBulkAddToCombo: () => void;
  onBulkRemoveFromCombo: () => void;
  onClearSelection: () => void;
  comboBadgeText?: string;
}

export function WixProductTable({
  products,
  totalCatalogCount,
  todayCatalogCount,
  activeCatalogCount,
  draftCatalogCount,
  inStockCatalogCount,
  outOfStockCatalogCount,
  availableCategories,
  productSearch,
  setProductSearch,
  productCategoryFilter,
  setProductCategoryFilter,
  productStatusFilter,
  setProductStatusFilter,
  productSizeFilter,
  setProductSizeFilter,
  selectedCatalogIds,
  onToggleSelectProduct,
  onToggleSelectAllFiltered,
  onOpenAddForm,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onOpenDirectPaymentModal,
  onOpenAIStudioModal,
  onExportCsv,
  onImportCsv,
  onDownloadExcelTemplate,
  onRefreshProducts,
  loadingRefresh = false,
  onBulkPrice,
  onBulkSizeGuide,
  onBulkDesc,
  onBulkAddToCombo,
  onBulkRemoveFromCombo,
  onClearSelection,
  comboBadgeText = 'COMBO 3 PEÇAS',
}: WixProductTableProps) {
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const isAllSelected =
    products.length > 0 && products.every((p: any) => selectedCatalogIds.includes(p.id));

  const handleCopyLink = (product: any) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://anafitwear.com'}/produto/${product.slug || product.id}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedSlug(product.slug || product.id);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* ========================================================
          1. CABEÇALHO DO CATÁLOGO NO ESTILO WIX
         ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Produtos
            </h1>
            <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {totalCatalogCount}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Para ver o desempenho dos seus produtos, vá para Análise de loja.
          </p>
        </div>

        {/* Botões do Topo Direito (Wix): "Mais ações v" e "+ Novo produto" */}
        <div className="flex items-center gap-2.5">
          {/* Menu Dropdown "Mais ações" */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreActionsMenu(!showMoreActionsMenu)}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <span>Mais ações</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {showMoreActionsMenu && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-30 animate-fadeIn text-xs"
                onMouseLeave={() => setShowMoreActionsMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActionsMenu(false);
                    onExportCsv();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Exportar Catálogo (.csv)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActionsMenu(false);
                    onImportCsv();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span>Importar Planilha (Excel/CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActionsMenu(false);
                    onDownloadExcelTemplate();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-gold" />
                  <span>Baixar Modelo Excel (.xlsx)</span>
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActionsMenu(false);
                    onRefreshProducts();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRefresh ? 'animate-spin' : ''}`} />
                  <span>Atualizar Produtos</span>
                </button>
              </div>
            )}
          </div>

          {/* Botão de Destaque Wix: + Novo produto */}
          <button
            type="button"
            onClick={onOpenAddForm}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-md text-xs font-semibold flex items-center gap-2 transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-gold" />
            <span>+ Novo produto</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. BARRA DE FILTROS E ABAS ESTILO WIX
         ======================================================== */}
      <div className="bg-white border border-gray-200/90 rounded-lg p-3 space-y-3 shadow-2xs">
        {/* Linha 1: Abas Principais + Ferramentas à Direita */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-2.5">
          {/* Abas Horizontais Limpas */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            <button
              type="button"
              onClick={() => setProductStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                productStatusFilter === 'ALL'
                  ? 'bg-gray-900 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Todos os produtos ({totalCatalogCount})
            </button>

            <button
              type="button"
              onClick={() => setProductStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                productStatusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>No ar na loja ({activeCatalogCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setProductStatusFilter('IN_STOCK')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                productStatusFilter === 'IN_STOCK'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Em estoque ({inStockCatalogCount})
            </button>

            <button
              type="button"
              onClick={() => setProductStatusFilter('OUT_OF_STOCK')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                productStatusFilter === 'OUT_OF_STOCK'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Esgotados ({outOfStockCatalogCount})
            </button>

            <button
              type="button"
              onClick={() => setProductStatusFilter('TODAY')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                productStatusFilter === 'TODAY'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ⚡ Criados hoje ({todayCatalogCount})
            </button>
          </div>

          {/* Ferramentas: Filtrar e Buscar */}
          <div className="flex items-center gap-2">
            {/* Botão Filtrar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition ${
                  productCategoryFilter !== 'ALL' || productSizeFilter !== 'ALL'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <span>Filtrar</span>
                {(productCategoryFilter !== 'ALL' || productSizeFilter !== 'ALL') && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </button>

              {showFilterDropdown && (
                <div
                  className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-30 text-xs space-y-3 animate-fadeIn"
                  onMouseLeave={() => setShowFilterDropdown(false)}
                >
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Categoria
                    </label>
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-800"
                    >
                      <option value="ALL">Todas as categorias</option>
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Tamanho
                    </label>
                    <select
                      value={productSizeFilter}
                      onChange={(e) => setProductSizeFilter(e.target.value as any)}
                      className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-800"
                    >
                      <option value="ALL">Todos os tamanhos</option>
                      <option value="P">P (S)</option>
                      <option value="M">M (M)</option>
                      <option value="G">G (L)</option>
                      <option value="GG">GG (XL)</option>
                      <option value="UN">Tamanho Único</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setProductCategoryFilter('ALL');
                        setProductSizeFilter('ALL');
                      }}
                      className="text-[11px] text-gray-500 hover:text-red-600 font-medium"
                    >
                      Limpar filtros
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilterDropdown(false)}
                      className="px-2.5 py-1 bg-gray-900 text-white rounded text-[11px] font-medium"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ícones Rápidos: Exportar / Importar */}
            <button
              type="button"
              onClick={onExportCsv}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition"
              title="Exportar (.csv)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onImportCsv}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition"
              title="Importar (Excel/CSV)"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linha 2: Campo de Busca Wix */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU, cor ou fornecedor..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50/70 border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-blue-500"
          />
          {productSearch && (
            <button
              type="button"
              onClick={() => setProductSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          3. BARRA DE AÇÕES EM MASSA (QUANDO ITENS SÃO MARCADOS)
         ======================================================== */}
      {selectedCatalogIds.length > 0 && (
        <div className="sticky top-16 z-20 p-3 bg-gray-900 text-white rounded-lg shadow-lg flex flex-wrap items-center justify-between gap-3 animate-fadeIn text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="font-semibold text-gold">
              {selectedCatalogIds.length} produto(s) selecionado(s)
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onBulkPrice}
              className="px-2.5 py-1 bg-white/10 hover:bg-white hover:text-black rounded text-[11px] font-semibold transition"
            >
              💵 Mudar Preço
            </button>
            <button
              type="button"
              onClick={onBulkSizeGuide}
              className="px-2.5 py-1 bg-white/10 hover:bg-white hover:text-black rounded text-[11px] font-semibold transition"
            >
              📐 Adicionar Medidas
            </button>
            <button
              type="button"
              onClick={onBulkDesc}
              className="px-2.5 py-1 bg-white/10 hover:bg-white hover:text-black rounded text-[11px] font-semibold transition"
            >
              📝 Mudar Descrição
            </button>
            <button
              type="button"
              onClick={onBulkAddToCombo}
              className="px-2.5 py-1 bg-amber-500 text-black hover:bg-amber-400 rounded text-[11px] font-bold transition"
            >
              ⚡ Incluir no Combo
            </button>
            <button
              type="button"
              onClick={onBulkRemoveFromCombo}
              className="px-2.5 py-1 bg-white/10 hover:bg-red-600 rounded text-[11px] font-semibold transition"
            >
              ✕ Tirar do Combo
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-[11px] text-gray-400 hover:text-white px-2 py-1"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          4. TABELA LIMPA DE PRODUTOS (CÓPIA DO MODELO WIX)
         ======================================================== */}
      <div className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Header Limpo Wix */}
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-[11px] font-semibold">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onToggleSelectAllFiltered}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-3 min-w-[280px]">Nome</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Preço</th>
                <th className="p-3">Estoque</th>
                <th className="p-3">Categorias</th>
                <th className="p-3 w-16 text-right">Ações</th>
              </tr>
            </thead>

            {/* Linhas da Tabela */}
            <tbody className="divide-y divide-gray-150">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Search className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="font-semibold text-gray-700">Nenhum produto encontrado</p>
                      <p className="text-xs text-gray-500">
                        {productSearch
                          ? `Nenhum resultado para "${productSearch}".`
                          : 'Nenhum produto atende aos filtros selecionados.'}
                      </p>
                      {(productSearch || productCategoryFilter !== 'ALL' || productStatusFilter !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearch('');
                            setProductCategoryFilter('ALL');
                            setProductStatusFilter('ALL');
                          }}
                          className="mt-2 px-3 py-1.5 bg-gray-900 text-white rounded text-xs font-medium"
                        >
                          Limpar busca
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((item: any) => {
                  const itemVariants =
                    item.variants ||
                    (item.sizes
                      ? item.sizes.map((sz: string) => ({
                          size: sz,
                          color: item.colorName || 'Preto Ônix',
                          sku: `${item.sku || 'PROD'}-${sz}`,
                          stock_quantity: Math.round((item.stock || 0) / item.sizes.length),
                        }))
                      : []);

                  const totalStock =
                    item.total_stock ??
                    item.stock ??
                    itemVariants.reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0);

                  const firstImage =
                    item.meta?.primary_image ||
                    item.primary_image ||
                    item.primaryImage ||
                    itemVariants[0]?.images?.[0] ||
                    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';

                  const categoryName = item.categories?.name || item.category || 'CONJUNTOS';
                  const basePrice =
                    item.meta?.promotional_price ??
                    item.meta?.price ??
                    item.price ??
                    itemVariants[0]?.price ??
                    44.9;

                  const isSelected = selectedCatalogIds.includes(item.id);
                  const isActionMenuOpen = openActionRowId === item.id;

                  // Status de estoque no estilo Wix
                  let stockStatusText = 'Em estoque';
                  let stockColorDot = 'bg-emerald-500';
                  let stockTextColor = 'text-gray-700';

                  if (totalStock === 0) {
                    stockStatusText = 'Esgotado';
                    stockColorDot = 'bg-red-500';
                    stockTextColor = 'text-red-700';
                  } else if (totalStock <= 3) {
                    stockStatusText = 'Parcialmente esgotado';
                    stockColorDot = 'bg-amber-500';
                    stockTextColor = 'text-amber-800';
                  }

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectProduct(item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Nome + Miniatura + Número de Variantes (Exatamente como no Wix!) */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={firstImage}
                            alt={item.title}
                            className="w-11 h-11 rounded-md object-cover border border-gray-200 shrink-0 bg-gray-50"
                          />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onEditProduct(item)}
                              className="font-semibold text-gray-900 hover:text-blue-600 text-xs text-left truncate block max-w-[240px] sm:max-w-[320px]"
                              title={item.title}
                            >
                              {item.title}
                            </button>
                            <span className="text-[11px] text-gray-500 font-normal block">
                              {itemVariants.length > 0
                                ? `${itemVariants.length} variantes`
                                : item.sizes?.length
                                ? `${item.sizes.length} tamanhos`
                                : 'Sem variantes'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="p-3 text-gray-500 text-xs">
                        Físico
                      </td>

                      {/* SKU */}
                      <td className="p-3 text-gray-500 font-mono text-[11px]">
                        {item.sku || '—'}
                      </td>

                      {/* Preço (US$ XX,XX) */}
                      <td className="p-3 text-gray-900 font-semibold text-xs whitespace-nowrap">
                        US$ {Number(basePrice).toFixed(2).replace('.', ',')}
                      </td>

                      {/* Estoque (Em estoque, Parcialmente esgotado, Esgotado) */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${stockColorDot}`} />
                          <span className={`text-xs ${stockTextColor} font-medium`}>
                            {stockStatusText}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            ({totalStock})
                          </span>
                        </div>
                      </td>

                      {/* Categorias (Pills discretos como no Wix) */}
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium whitespace-nowrap">
                          {categoryName}
                        </span>
                      </td>

                      {/* Menu de Ações (Os 3 pontinhos do Wix) */}
                      <td className="p-3 text-right relative">
                        <button
                          type="button"
                          onClick={() => setOpenActionRowId(isActionMenuOpen ? null : item.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
                          title="Ações do produto"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Menu Dropdown de Ações */}
                        {isActionMenuOpen && (
                          <div
                            className="absolute right-3 top-10 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-30 text-left text-xs animate-fadeIn"
                            onMouseLeave={() => setOpenActionRowId(null)}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionRowId(null);
                                onEditProduct(item);
                              }}
                              className="w-full px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                              <span>Editar produto</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionRowId(null);
                                onDuplicateProduct(item);
                              }}
                              className="w-full px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                              <span>Duplicar produto</span>
                            </button>

                            <Link
                              href={`/produto/${item.slug || 'samanta-romper'}`}
                              target="_blank"
                              className="w-full px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                              <span>Ver na loja</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                handleCopyLink(item);
                                setOpenActionRowId(null);
                              }}
                              className="w-full px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                            >
                              <span>🔗</span>
                              <span>{copiedSlug === (item.slug || item.id) ? '✓ Link copiado!' : 'Copiar link'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionRowId(null);
                                onOpenDirectPaymentModal(item);
                              }}
                              className="w-full px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Link Afterpay 4x</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionRowId(null);
                                onOpenAIStudioModal(item);
                              }}
                              className="w-full px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>Estúdio Modelo IA</span>
                            </button>

                            <div className="border-t border-gray-100 my-1" />

                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionRowId(null);
                                onDeleteProduct(item.id, item.title);
                              }}
                              className="w-full px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              <span>Excluir produto</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
