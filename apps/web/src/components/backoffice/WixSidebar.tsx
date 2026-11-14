'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Sparkles,
  DollarSign,
  Wallet,
  Users,
  Settings,
  Mail,
  BarChart3,
  Store,
  Tag,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  LogOut,
  Volume2,
  VolumeX,
  Bell,
  ExternalLink,
  Scissors,
  FileText,
  Instagram,
  Radio,
  Smartphone,
  Receipt,
  PackageMinus,
  Activity,
  Building2,
  Lock,
  Layers,
  Power,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export type WixBackofficeTab =
  | 'dashboard'
  | 'catalog'
  | 'out-of-stock'
  | 'sales'
  | 'conditionals'
  | 'commissions'
  | 'finances'
  | 'invoices'
  | 'coupons'
  | 'reports'
  | 'cms'
  | 'customers'
  | 'settings'
  | 'emails'
  | 'margins'
  | 'live'
  | 'backorders'
  | 'theme'
  | 'whatsapp-catalog'
  | 'instagram-direct'
  | 'suppliers';

interface WixSidebarProps {
  activeTab: WixBackofficeTab;
  onNavigateTab: (tab: WixBackofficeTab) => void;
  productsCount: number;
  outOfStockCount: number;
  pendingOrdersCount: number;
  totalOrdersCount: number;
  pendingSellersCount: number;
  adminName?: string;
  storeOffline?: boolean;
  onToggleStoreOffline?: () => void;
  onOpenNewProductForm: () => void;
  onOpenCategoriesModal: () => void;
  onOpenWriteOffModal: () => void;
  onOpenWhatsAppCatalogModal: () => void;
  onOpenTikTokModal: () => void;
  onOpenAIStudioModal: () => void;
  onOpenComboPromoModal: () => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function WixSidebar({
  activeTab,
  onNavigateTab,
  productsCount,
  outOfStockCount,
  pendingOrdersCount,
  totalOrdersCount,
  pendingSellersCount,
  adminName = 'Ana',
  storeOffline = false,
  onToggleStoreOffline,
  onOpenNewProductForm,
  onOpenCategoriesModal,
  onOpenWriteOffModal,
  onOpenWhatsAppCatalogModal,
  onOpenTikTokModal,
  onOpenAIStudioModal,
  onOpenComboPromoModal,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}: WixSidebarProps) {
  // Collapsible groups like Wix
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    catalog: true,
    sales: true,
    offers: true,
    finances: true,
    marketing: false,
    settings: false,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleSelectTab = (tab: WixBackofficeTab) => {
    onNavigateTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-gray-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand & Store Selector Header (Wix Style) */}
        <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-stone-900 text-gold flex items-center justify-center font-black text-sm shadow-xs border border-gold/40">
              AF
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-gray-900 tracking-tight">
                  Ana Fitness Wear
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                <span className={`w-2 h-2 rounded-full ${storeOffline ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span>{storeOffline ? 'Loja em Manutenção' : 'Loja no Ar (Online)'}</span>
              </div>
            </div>
          </div>

          {/* Botão Fechar no Mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Botão de Destaque Superior: + Novo Produto (Wix Padrão) */}
        <div className="p-3 bg-gray-50/70 border-b border-gray-150">
          <button
            type="button"
            onClick={() => {
              onOpenNewProductForm();
              if (typeof window !== 'undefined' && window.innerWidth < 1024) onCloseMobile();
            }}
            className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white rounded-md font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs group"
          >
            <PlusCircle className="w-4 h-4 text-gold group-hover:rotate-90 transition-transform duration-200" />
            <span>+ Novo Produto com Grade</span>
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 text-xs font-medium scrollbar-thin">
          {/* 1. Início */}
          <button
            type="button"
            onClick={() => handleSelectTab('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500'}`} />
              <span>Início</span>
            </div>
          </button>

          {/* 1.1 Radar Ao Vivo */}
          <button
            type="button"
            onClick={() => handleSelectTab('live')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition ${
              activeTab === 'live'
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Activity className={`w-4 h-4 ${activeTab === 'live' ? 'text-blue-600' : 'text-gray-500'}`} />
              <span>Radar Ao Vivo</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              AO VIVO
            </span>
          </button>

          {/* 1.2 Agentes de IA */}
          <button
            type="button"
            onClick={() => {
              onOpenAIStudioModal();
              if (typeof window !== 'undefined' && window.innerWidth < 1024) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 transition"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Agentes de IA</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-amber-500/15 text-amber-800 font-bold">
              NOVO
            </span>
          </button>

          {/* ========================================================
              GRUPO: VENDAS
             ======================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => toggleGroup('sales')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-gray-500 hover:text-gray-800 text-[11px] font-semibold uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5" />
                <span>Vendas</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openGroups.sales ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openGroups.sales && (
              <div className="pl-3 mt-1 space-y-0.5 border-l-2 border-gray-150 ml-3">
                <button
                  type="button"
                  onClick={() => handleSelectTab('sales')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'sales'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>Pedidos da loja</span>
                  {pendingOrdersCount > 0 ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-black">
                      {pendingOrdersCount} pendentes
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-mono">
                      {totalOrdersCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('conditionals')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'conditionals'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>Malas Condicionais</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-gray-100 text-gray-600 font-bold">
                    PROVA
                  </span>
                </button>

                <Link
                  href="/pos"
                  target="_blank"
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-gray-400" />
                    <span>PDV Balcão (Showroom)</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </Link>
              </div>
            )}
          </div>

          {/* ========================================================
              GRUPO: CATÁLOGO (WIX ORIGINAL)
             ======================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => toggleGroup('catalog')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-gray-500 hover:text-gray-800 text-[11px] font-semibold uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>Catálogo</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openGroups.catalog ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openGroups.catalog && (
              <div className="pl-3 mt-1 space-y-0.5 border-l-2 border-blue-200 ml-3">
                {/* 1. Produtos da Loja (O ITEM PRINCIPAL DO PRINT DO WIX) */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('catalog')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'catalog'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Produtos da loja</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-bold">
                    {productsCount}
                  </span>
                </button>

                {/* 2. Categorias */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenCategoriesModal();
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span>Categorias</span>
                  </span>
                  <span className="text-[9px] text-gray-400">+ Gerenciar</span>
                </button>

                {/* 3. Retiradas / Baixas */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenWriteOffModal();
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <PackageMinus className="w-3 h-3 text-red-500" />
                    <span>Retirada / Uso Próprio</span>
                  </span>
                </button>

                {/* 4. Produtos Esgotados */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('out-of-stock')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'out-of-stock'
                      ? 'bg-red-50 text-red-700 font-bold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>Produtos Esgotados</span>
                  {outOfStockCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 text-red-800 font-bold">
                      {outOfStockCount}
                    </span>
                  )}
                </button>

                {/* 5. Pré-vendas */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('backorders')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'backorders'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>Pré-vendas (Sob Medida)</span>
                </button>
              </div>
            )}
          </div>

          {/* ========================================================
              GRUPO: OFERTAS & DESCONTOS
             ======================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => toggleGroup('offers')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-gray-500 hover:text-gray-800 text-[11px] font-semibold uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Ofertas & Descontos</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openGroups.offers ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openGroups.offers && (
              <div className="pl-3 mt-1 space-y-0.5 border-l-2 border-gray-150 ml-3">
                <button
                  type="button"
                  onClick={() => handleSelectTab('coupons')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'coupons'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>Promoções & Frete Grátis ($100)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-amber-100 text-amber-800 font-bold">
                    POP-UP
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenComboPromoModal();
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <span>Promoção Combo (3 por $X)</span>
                  <span className="text-[9px] text-amber-600 font-bold">⚡ Configurar</span>
                </button>
              </div>
            )}
          </div>

          {/* ========================================================
              GRUPO: FINANCEIRO (O SISTEMINHA QUE A ANA PEDIU)
             ======================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => toggleGroup('finances')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-gray-500 hover:text-gray-800 text-[11px] font-semibold uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Financeiro da Loja</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openGroups.finances ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openGroups.finances && (
              <div className="pl-3 mt-1 space-y-0.5 border-l-2 border-emerald-200 ml-3">
                <button
                  type="button"
                  onClick={() => handleSelectTab('finances')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'finances'
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>DRE & Lucro Real</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-emerald-100 text-emerald-800 font-bold">
                    LUCRO
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('invoices')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'invoices'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>Entrada de Notas Fiscais (NF)</span>
                  <span className="text-[9px] text-gray-500 font-mono">Fábrica</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('margins')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'margins'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>Simulador de Margens</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('suppliers')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'suppliers'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>Fornecedores & Confecções</span>
                </button>
              </div>
            )}
          </div>

          {/* ========================================================
              GRUPO: CLIENTES & VENDEDORAS
             ======================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelectTab('customers')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition ${
                activeTab === 'customers'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${activeTab === 'customers' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>Clientes & Leads</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('commissions')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition ${
                activeTab === 'commissions'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${activeTab === 'commissions' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>Vendedoras & Afiliadas</span>
              </div>
              {pendingSellersCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-black">
                  {pendingSellersCount}
                </span>
              )}
            </button>
          </div>

          {/* ========================================================
              GRUPO: MARKETING & CANAIS
             ======================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => toggleGroup('marketing')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-gray-500 hover:text-gray-800 text-[11px] font-semibold uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5" />
                <span>Marketing & Canais</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openGroups.marketing ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openGroups.marketing && (
              <div className="pl-3 mt-1 space-y-0.5 border-l-2 border-gray-150 ml-3">
                <button
                  type="button"
                  onClick={() => {
                    onOpenWhatsAppCatalogModal();
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Catálogo WhatsApp (PDF)</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('instagram-direct')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'instagram-direct'
                      ? 'bg-pink-50 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                    <span>Direct Instagram & Bot</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenTikTokModal();
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🎵</span>
                    <span>Links TikTok Shop</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('emails')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                    activeTab === 'emails'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    <span>E-mails de Compra</span>
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ========================================================
              GRUPO: RELATÓRIOS & ANÁLISES
             ======================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelectTab('reports')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition ${
                activeTab === 'reports'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className={`w-4 h-4 ${activeTab === 'reports' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>Estoque no Ar ($ USD)</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-gray-100 text-gray-600 font-bold">
                VALUATION
              </span>
            </button>
          </div>

          {/* ========================================================
              GRUPO: SITE & CMS
             ======================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelectTab('cms')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition ${
                activeTab === 'cms'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className={`w-4 h-4 ${activeTab === 'cms' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>Banners & Vitrine (CMS)</span>
              </div>
            </button>
          </div>

          {/* ========================================================
              GRUPO: CONFIGURAÇÕES
             ======================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelectTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>Configurações</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer: User Profile & Logout */}
        <div className="p-3 border-t border-gray-150 bg-gray-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold text-xs">
              {adminName.slice(0, 2).toUpperCase()}
            </div>
            <div className="leading-tight">
              <span className="font-semibold text-xs text-gray-900 block truncate max-w-[120px]">
                {adminName}
              </span>
              <span className="text-[10px] text-gray-500 block">Administradora</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
            title="Bloquear Painel / Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
