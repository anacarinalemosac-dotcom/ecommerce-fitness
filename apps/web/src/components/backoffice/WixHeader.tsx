'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Menu,
  ExternalLink,
  Store,
  Power,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  Activity,
  Lock,
  ChevronDown,
} from 'lucide-react';

interface WixHeaderProps {
  onToggleMobileSidebar: () => void;
  searchValue: string;
  onSearchChange: (val: string) => void;
  storeOffline?: boolean;
  onToggleStoreOffline?: () => void;
  liveVisitorsCount?: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  browserNotificationsActive: boolean;
  onEnableBrowserNotifications: () => void;
  onOpenLiveFeed: () => void;
  onLogout: () => void;
  adminName?: string;
}

export function WixHeader({
  onToggleMobileSidebar,
  searchValue,
  onSearchChange,
  storeOffline = false,
  onToggleStoreOffline,
  liveVisitorsCount = 0,
  soundEnabled,
  onToggleSound,
  browserNotificationsActive,
  onEnableBrowserNotifications,
  onOpenLiveFeed,
  onLogout,
  adminName = 'Ana',
}: WixHeaderProps) {
  return (
    <header className="h-14 lg:h-16 bg-white border-b border-gray-200/90 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs">
      {/* Lado Esquerdo: Botão Mobile + Nome da Loja */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md lg:hidden"
          title="Abrir Menu Lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm tracking-tight">
            Ana Fitness Wear
          </span>
          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono font-medium">
            Painel Oficial
          </span>
        </div>

        {/* Status da Loja: No Ar / Manutenção */}
        {onToggleStoreOffline && (
          <button
            type="button"
            onClick={onToggleStoreOffline}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition ${
              storeOffline
                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
            title={storeOffline ? 'Loja em manutenção. Clique para colocar no ar.' : 'Loja no ar para clientes. Clique para manutenção.'}
          >
            <span className={`w-2 h-2 rounded-full ${storeOffline ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{storeOffline ? '🔴 Manutenção' : '🟢 No Ar'}</span>
          </button>
        )}
      </div>

      {/* Centro: Barra de Busca Wix */}
      <div className="flex-1 max-w-md mx-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Busque recursos, produtos, pedidos, clientes..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* Lado Direito: Ações Rápidas */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Radar Ao Vivo */}
        <button
          type="button"
          onClick={onOpenLiveFeed}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition"
          title="Ver visitantes em tempo real"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-emerald-700 font-bold">{liveVisitorsCount}</span>
          <span className="text-gray-500 text-[11px]">online</span>
        </button>

        {/* Som On/Off */}
        <button
          type="button"
          onClick={onToggleSound}
          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition"
          title={soundEnabled ? 'Silenciar alertas de vendas' : 'Ativar som de caixa registradora'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
        </button>

        {/* Notificações Push */}
        <button
          type="button"
          onClick={onEnableBrowserNotifications}
          className={`p-2 rounded-md transition ${
            browserNotificationsActive
              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
              : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100'
          }`}
          title={browserNotificationsActive ? 'Notificações push ativas no celular' : 'Ativar notificações push'}
        >
          {browserNotificationsActive ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        </button>

        {/* Botão Ver Loja Virtual */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-100 border border-gray-200 rounded-md transition"
        >
          <span>Ver Loja</span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </Link>

        {/* Botão PDV Balcão */}
        <Link
          href="/pos"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-900 text-gold hover:bg-black rounded-md transition shadow-2xs"
        >
          <Store className="w-3.5 h-3.5" />
          <span>PDV Balcão</span>
        </Link>

        {/* Avatar / Bloquear */}
        <div className="flex items-center pl-1 sm:pl-2 border-l border-gray-200">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition"
            title="Bloquear painel / Sair"
          >
            <div className="w-7 h-7 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold text-xs">
              {adminName.slice(0, 1).toUpperCase()}
            </div>
            <Lock className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
          </button>
        </div>
      </div>
    </header>
  );
}
