'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Phone,
  User,
  MapPin,
  RefreshCw,
  MessageCircle,
  Printer,
  Trash2,
  RotateCcw,
  Sparkles,
  DollarSign,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { NewConditionalModal } from './NewConditionalModal';
import { SettleConditionalModal } from './SettleConditionalModal';
import {
  generateConditionalDispatchWhatsAppMessage,
  printConditionalReceipt,
} from '@/lib/whatsappMessages';

interface ConditionalsViewProps {
  products?: any[];
  sellers?: any[];
  onOpenSaleDetail?: (orderId: string) => void;
}

export function ConditionalsView({
  products = [],
  sellers = [],
  onOpenSaleDetail,
}: ConditionalsViewProps) {
  const [conditionals, setConditionals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalConditionals: 0,
    openCount: 0,
    openPiecesCount: 0,
    openTotalValue: 0,
    overdueCount: 0,
    settledCount: 0,
    returnedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'OVERDUE' | 'SETTLED' | 'RETURNED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modais
  const [showNewModal, setShowNewModal] = useState(false);
  const [settlingConditional, setSettlingConditional] = useState<any | null>(null);

  const fetchConditionals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backoffice/conditionals');
      const data = await res.json();
      if (res.ok && data.conditionals) {
        setConditionals(data.conditionals);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Erro ao buscar condicionais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditionals();
  }, []);

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

  // Filtragem da lista
  const filteredConditionals = conditionals.filter((c) => {
    const isOverdue = c.status === 'OPEN' && c.expected_return_date && c.expected_return_date < todayStr;

    if (statusFilter === 'OPEN' && c.status !== 'OPEN') return false;
    if (statusFilter === 'OVERDUE' && !isOverdue) return false;
    if (statusFilter === 'SETTLED' && c.status !== 'SETTLED') return false;
    if (statusFilter === 'RETURNED' && c.status !== 'RETURNED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.customer_name?.toLowerCase().includes(q);
      const matchNumber = c.conditional_number?.toLowerCase().includes(q);
      const matchPhone = c.customer_phone?.includes(q);
      const matchSeller = c.seller_name?.toLowerCase().includes(q);
      const matchItem = (c.items || []).some((it: any) =>
        (it.title && it.title.toLowerCase().includes(q)) || (it.sku && it.sku.toLowerCase().includes(q))
      );
      return matchName || matchNumber || matchPhone || matchSeller || matchItem;
    }

    return true;
  });

  // Exclusão de condicional
  const handleDeleteConditional = async (cond: any) => {
    const isConfirmed = window.confirm(
      `⚠️ EXCLUIR MALA CONDICIONAL #${cond.conditional_number}?\n\n` +
      `Cliente: ${cond.customer_name}\n` +
      `Peças na mala: ${cond.total_items} itens ($${Number(cond.total_value || 0).toFixed(2)})\n\n` +
      `Se a mala ainda estiver em aberto, todas as peças retornarão automaticamente ao estoque da loja.\n\n` +
      `Deseja realmente excluir este registro?`
    );

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/backoffice/conditionals?id=${encodeURIComponent(cond.id)}&restore_stock=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao excluir condicional.');
      }
      alert(`✓ Mala Condicional #${cond.conditional_number} excluída com sucesso!`);
      fetchConditionals();
    } catch (err: any) {
      alert(`Falha ao excluir condicional: ${err.message}`);
    }
  };

  // Abrir WhatsApp com mensagem da condicional
  const handleOpenWhatsApp = (cond: any) => {
    const msg = generateConditionalDispatchWhatsAppMessage(cond);
    const cleanPhone = String(cond.customer_phone || '').replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;
    if (fullPhone) {
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner de Apresentação & Ações Globais */}
      <div className="bg-deep-black text-white border-2 border-gold p-6 space-y-4 shadow-luxury">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gold/20 text-gold text-[9px] font-black uppercase tracking-widest border border-gold/40">
                MALA EM CONSIGNAÇÃO • PROVA EM CASA
              </span>
              {summary.overdueCount > 0 && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">
                  ⚠️ {summary.overdueCount} ATRASADA(S)
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-gold" />
              <span>GESTÃO DE CONDICIONAIS & CONIGNAÇÃO</span>
            </h2>
            <p className="text-xs text-white/70 max-w-2xl">
              Cadastre e acompanhe as malas de roupas enviadas para as clientes experimentarem em casa. Ao realizar o acerto, as peças compradas viram vendas automaticamente e as peças restantes retornam ao estoque!
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 bg-gold hover:bg-white text-deep-black font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-md cursor-pointer border border-gold"
            >
              <Plus className="w-4 h-4" />
              <span>+ NOVA CONDICIONAL</span>
            </button>
            <button
              type="button"
              onClick={fetchConditionals}
              className="px-3.5 py-2.5 border border-white/20 hover:border-gold text-white hover:text-gold text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">ATUALIZAR</span>
            </button>
          </div>
        </div>

        {/* 4 Cards de Métricas Prioritárias */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* 1. Malas em Aberto */}
          <div className="p-3 bg-white/5 border border-gold/40 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-gold flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-gold" />
              <span>MALAS ATIVAS (EM ABERTO)</span>
            </span>
            <span className="text-2xl font-black font-mono text-white block">
              {summary.openCount}
            </span>
            <span className="text-[10px] text-white/60 block">
              Com clientes provando no momento
            </span>
          </div>

          {/* 2. Peças sob Custódia */}
          <div className="p-3 bg-white/5 border border-white/15 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-white/70 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>PEÇAS SOB CUSTÓDIA</span>
            </span>
            <span className="text-2xl font-black font-mono text-gold block">
              {summary.openPiecesCount} un.
            </span>
            <span className="text-[10px] text-white/60 block">
              Roupas separadas fora do showroom
            </span>
          </div>

          {/* 3. Valor Total em Peças */}
          <div className="p-3 bg-white/5 border border-white/15 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-white/70 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
              <span>VALOR TOTAL EM ROUPAS</span>
            </span>
            <span className="text-2xl font-black font-mono text-green-400 block">
              ${summary.openTotalValue.toFixed(2)}
            </span>
            <span className="text-[10px] text-white/60 block">
              Potencial de venda em aberto
            </span>
          </div>

          {/* 4. Atrasadas */}
          <div
            className={`p-3 border space-y-1 ${
              summary.overdueCount > 0
                ? 'bg-red-950/60 border-red-500'
                : 'bg-white/5 border-white/15'
            }`}
          >
            <span className="text-[9px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>DEVOLUÇÕES ATRASADAS</span>
            </span>
            <span
              className={`text-2xl font-black font-mono block ${
                summary.overdueCount > 0 ? 'text-red-400' : 'text-white'
              }`}
            >
              {summary.overdueCount}
            </span>
            <span className="text-[10px] text-white/60 block">
              {summary.overdueCount > 0 ? 'Cobrar devolução via WhatsApp' : 'Nenhuma mala em atraso!'}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="bg-white border-2 border-deep-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Filtros por Status */}
        <div className="flex items-center gap-1 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-deep-black text-white border-deep-black shadow-xs'
                : 'bg-white text-deep-black/70 border-deep-black/20 hover:border-deep-black'
            }`}
          >
            TODAS ({conditionals.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border transition cursor-pointer ${
              statusFilter === 'OPEN'
                ? 'bg-gold text-deep-black border-deep-black font-black shadow-xs'
                : 'bg-white text-deep-black/70 border-deep-black/20 hover:border-deep-black'
            }`}
          >
            EM ABERTO ({summary.openCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OVERDUE')}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border transition cursor-pointer ${
              statusFilter === 'OVERDUE'
                ? 'bg-red-600 text-white border-red-800 shadow-xs'
                : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
            }`}
          >
            ⚠️ ATRASADAS ({summary.overdueCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('SETTLED')}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border transition cursor-pointer ${
              statusFilter === 'SETTLED'
                ? 'bg-green-700 text-white border-green-900 shadow-xs'
                : 'bg-white text-deep-black/70 border-deep-black/20 hover:border-deep-black'
            }`}
          >
            ACERTO FEITO ({summary.settledCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('RETURNED')}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border transition cursor-pointer ${
              statusFilter === 'RETURNED'
                ? 'bg-gray-800 text-white border-black shadow-xs'
                : 'bg-white text-deep-black/70 border-deep-black/20 hover:border-deep-black'
            }`}
          >
            DEVOLVIDAS ({summary.returnedCount})
          </button>
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-deep-black/50 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, tel, vendedora..."
            className="w-full pl-9 pr-3 py-2 border-2 border-deep-black text-xs font-medium focus:outline-none focus:border-gold bg-white"
          />
        </div>
      </div>

      {/* Lista de Condicionais */}
      {filteredConditionals.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-deep-black/30 p-12 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-deep-black/30 mx-auto" />
          <h3 className="text-base font-black uppercase text-deep-black">
            Nenhuma mala condicional encontrada
          </h3>
          <p className="text-xs text-deep-black/60 max-w-sm mx-auto">
            {searchQuery
              ? 'Nenhum resultado com os termos pesquisados. Tente alterar a busca ou filtro.'
              : 'Você ainda não registrou malas condicionais com esse status. Clique no botão abaixo para criar a primeira mala!'}
          </p>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="px-5 py-2.5 bg-gold hover:bg-deep-black hover:text-gold text-deep-black border-2 border-deep-black font-black text-xs uppercase tracking-wider transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>CRIAR PRIMEIRA MALA CONDICIONAL</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConditionals.map((cond) => {
            const isOverdue = cond.status === 'OPEN' && cond.expected_return_date && cond.expected_return_date < todayStr;
            const isDueToday = cond.status === 'OPEN' && cond.expected_return_date === todayStr;

            // Formatação de datas
            const formattedDispatch = cond.dispatch_date
              ? (cond.dispatch_date.includes('-') ? cond.dispatch_date.split('-').reverse().join('/') : cond.dispatch_date)
              : '';
            const formattedReturn = cond.expected_return_date
              ? (cond.expected_return_date.includes('-') ? cond.expected_return_date.split('-').reverse().join('/') : cond.expected_return_date)
              : '';

            return (
              <div
                key={cond.id}
                className={`bg-white border-2 transition shadow-sm overflow-hidden ${
                  isOverdue
                    ? 'border-red-500 bg-red-50/15'
                    : cond.status === 'SETTLED'
                    ? 'border-green-600'
                    : 'border-deep-black'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b ${
                    isOverdue
                      ? 'bg-red-700 text-white'
                      : cond.status === 'SETTLED'
                      ? 'bg-green-800 text-white'
                      : cond.status === 'RETURNED'
                      ? 'bg-gray-800 text-white'
                      : 'bg-deep-black text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-black text-sm uppercase tracking-wider text-gold">
                      #{cond.conditional_number}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="font-black text-sm uppercase text-white">
                      {cond.customer_name}
                    </span>
                    {cond.customer_phone && (
                      <span className="text-[10px] font-mono text-white/80 bg-white/10 px-2 py-0.5 rounded">
                        📞 {cond.customer_phone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Badge de Status */}
                    {cond.status === 'OPEN' ? (
                      isOverdue ? (
                        <span className="px-2.5 py-0.5 bg-white text-red-700 text-[10px] font-black uppercase tracking-wider border border-white flex items-center gap-1 shadow-xs animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-red-700" />
                          <span>⚠️ ATRASADA (PRAZO VENCIDO)</span>
                        </span>
                      ) : isDueToday ? (
                        <span className="px-2 py-0.5 bg-amber-400 text-deep-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                          <Clock className="w-3 h-3 text-deep-black" />
                          <span>VENCE HOJE!</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gold text-deep-black text-[10px] font-black uppercase tracking-wider">
                          👜 COM A CLIENTE (EM ABERTO)
                        </span>
                      )
                    ) : cond.status === 'SETTLED' ? (
                      <span className="px-2.5 py-0.5 bg-white text-green-800 text-[10px] font-black uppercase tracking-wider border border-white">
                        ✓ ACERTO REALIZADO (VENDA GERADA)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-gray-200 text-gray-900 text-[10px] font-black uppercase tracking-wider">
                        ↩️ DEVOLVIDA TOTAL
                      </span>
                    )}
                  </div>
                </div>

                {/* Conteúdo Principal do Card */}
                <div className="p-4 space-y-4">
                  {/* Grid de Informações de Prazos & Local */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs border-b border-deep-black/10 pb-3">
                    <div>
                      <span className="text-[9px] font-black uppercase text-deep-black/50 block">DATA DE SAÍDA:</span>
                      <span className="font-mono font-bold text-deep-black">{formattedDispatch}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-deep-black/50 block">DEVOLUÇÃO PREVISTA:</span>
                      <span
                        className={`font-mono font-black ${
                          isOverdue ? 'text-red-700 underline' : 'text-deep-black'
                        }`}
                      >
                        ⏰ {formattedReturn}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-deep-black/50 block">VENDEDORA:</span>
                      <span className="font-bold text-deep-black">👤 {cond.seller_name || 'Ana Karina'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-deep-black/50 block">TOTAL DA MALA:</span>
                      <span className="font-mono font-black text-sm text-gold bg-deep-black px-2 py-0.5 inline-block">
                        {cond.total_items} peças • ${Number(cond.total_value || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Observações da mala se houver */}
                  {(cond.notes || cond.customer_address) && (
                    <div className="text-xs bg-gray-50 p-2.5 border border-deep-black/10 space-y-1">
                      {cond.customer_address && (
                        <div className="flex items-center gap-1.5 text-deep-black/80 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                          <span>Local: {cond.customer_address}</span>
                        </div>
                      )}
                      {cond.notes && (
                        <div className="text-deep-black/70 italic text-[11px]">
                          📝 "{cond.notes}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Peças Incluídas na Mala */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-gold" />
                      <span>PEÇAS INCLUÍDAS NESTA MALA ({cond.items?.length || 0}):</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {(cond.items || []).map((it: any, iIdx: number) => {
                        const isSettled = cond.status === 'SETTLED';
                        const keptQty = it.kept_quantity !== undefined ? it.kept_quantity : 0;
                        const wasKept = isSettled && keptQty > 0;

                        return (
                          <div
                            key={iIdx}
                            className={`p-2 border flex items-center gap-2.5 text-xs ${
                              wasKept
                                ? 'bg-green-50/80 border-green-400'
                                : 'bg-white border-deep-black/15'
                            }`}
                          >
                            {it.image ? (
                              <img src={it.image} alt={it.title} className="w-10 h-10 object-cover border border-deep-black/10 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 bg-gold/20 flex items-center justify-center font-black text-xs text-deep-black border shrink-0">
                                FIT
                              </div>
                            )}
                            <div className="overflow-hidden flex-1">
                              <span className="font-bold text-deep-black block truncate" title={it.title}>
                                {it.title}
                              </span>
                              <span className="text-[10px] font-mono text-gold font-bold block">
                                {it.color} • TAM {it.size}
                              </span>
                              <div className="flex items-center justify-between text-[10px] font-mono text-deep-black/70 mt-0.5">
                                <span>×{it.quantity} un</span>
                                <span className="font-bold">${Number(it.unit_price || 0).toFixed(2)}</span>
                              </div>
                              {isSettled && (
                                <span
                                  className={`text-[8px] font-black uppercase px-1 py-0.2 mt-1 inline-block border ${
                                    wasKept
                                      ? 'bg-green-700 text-white border-green-900'
                                      : 'bg-gray-100 text-gray-700 border-gray-300'
                                  }`}
                                >
                                  {wasKept ? `✓ COMPROU (${keptQty})` : '↩️ DEVOLVEU'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resumo se já tiver acerto realizado */}
                  {cond.status === 'SETTLED' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-950 block">
                          ACERTO CONCLUÍDO EM:
                        </span>
                        <span className="font-mono text-emerald-900 font-bold">
                          {cond.settled_at ? new Date(cond.settled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Sim'}
                        </span>
                        {cond.settled_sale_order_id && (
                          <span className="font-mono font-bold text-deep-black block mt-0.5">
                            Pedido de Venda Gerado: <strong>#{cond.settled_sale_order_id}</strong>
                          </span>
                        )}
                      </div>
                      <div className="sm:text-right">
                        <span className="text-[10px] font-black uppercase text-emerald-950 block">
                          VALOR TOTAL PAGO:
                        </span>
                        <span className="font-mono text-lg font-black text-emerald-800">
                          ${Number(cond.settled_total_paid || 0).toFixed(2)} USD
                        </span>
                        <span className="text-[10px] font-bold text-emerald-900 block">
                          Forma: {cond.settled_payment_method || 'ZELLE'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Barra de Ações Rápidas */}
                  <div className="pt-2 border-t border-deep-black/10 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Botão de Fechar / Realizar Acerto */}
                      {cond.status === 'OPEN' && (
                        <button
                          type="button"
                          onClick={() => setSettlingConditional(cond)}
                          className="px-4 py-2 bg-gold hover:bg-deep-black hover:text-gold text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 border-2 border-deep-black shadow-xs cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>⚖️ REALIZAR ACERTO / FECHAR</span>
                        </button>
                      )}

                      {/* Botão WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(cond)}
                        className="px-3 py-2 bg-green-700 hover:bg-green-800 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 border border-green-900 shadow-2xs cursor-pointer"
                        title="Enviar comprovante ou lembrete no WhatsApp da cliente"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WHATSAPP</span>
                      </button>

                      {/* Botão Imprimir Termo */}
                      <button
                        type="button"
                        onClick={() => printConditionalReceipt(cond)}
                        className="px-3 py-2 bg-white hover:bg-gray-100 text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 border border-deep-black cursor-pointer shadow-2xs"
                        title="Imprimir ficha / termo de mala para assinatura da cliente"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>IMPRIMIR FICHA</span>
                      </button>
                    </div>

                    {/* Botão Excluir */}
                    <button
                      type="button"
                      onClick={() => handleDeleteConditional(cond)}
                      className="text-[10px] font-black uppercase text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Excluir condicional e devolver peças ao estoque"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir registro</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação de Nova Condicional */}
      <NewConditionalModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={() => {
          fetchConditionals();
          setShowNewModal(false);
        }}
        products={products}
        sellers={sellers}
      />

      {/* Modal de Acerto / Fechamento de Condicional */}
      <SettleConditionalModal
        isOpen={Boolean(settlingConditional)}
        onClose={() => setSettlingConditional(null)}
        conditional={settlingConditional}
        onSuccess={() => {
          fetchConditionals();
        }}
      />
    </div>
  );
}
