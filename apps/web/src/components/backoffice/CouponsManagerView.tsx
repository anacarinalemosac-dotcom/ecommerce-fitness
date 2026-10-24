'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Percent,
  Truck,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';
import { CouponRecord, DiscountType } from '@/lib/couponsStore';

export default function CouponsManagerView() {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'EXPIRED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | DiscountType>('ALL');

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<DiscountType>('PERCENTAGE');
  const [formValue, setFormValue] = useState<string>('10');
  const [formMinOrder, setFormMinOrder] = useState<string>('');
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>('');
  const [formMaxUses, setFormMaxUses] = useState<string>('');
  const [formValidFrom, setFormValidFrom] = useState<string>('');
  const [formValidUntil, setFormValidUntil] = useState<string>('');
  const [formAppliesTo, setFormAppliesTo] = useState<'ALL' | 'ONLINE' | 'POS'>('ALL');

  // Copiar código feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Simulador de teste de cupom
  const [testCode, setTestCode] = useState('');
  const [testSubtotal, setTestSubtotal] = useState('100.00');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backoffice/coupons?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.coupons)) {
          setCoupons(data.coupons);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar cupons:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormDescription('');
    setFormType('PERCENTAGE');
    setFormValue('10');
    setFormMinOrder('');
    setFormMaxDiscount('');
    setFormMaxUses('');
    setFormValidFrom('');
    setFormValidUntil('');
    setFormAppliesTo('ALL');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: CouponRecord) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDescription(coupon.description || '');
    setFormType(coupon.discount_type);
    setFormValue(String(coupon.discount_value));
    setFormMinOrder(coupon.min_order_amount ? String(coupon.min_order_amount) : '');
    setFormMaxDiscount(coupon.max_discount_amount ? String(coupon.max_discount_amount) : '');
    setFormMaxUses(coupon.max_uses ? String(coupon.max_uses) : '');
    setFormValidFrom(coupon.valid_from || '');
    setFormValidUntil(coupon.valid_until || '');
    setFormAppliesTo(coupon.applies_to || 'ALL');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      setFeedback({ type: 'error', message: 'Por favor, informe o código do cupom.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      action: editingCoupon ? 'update' : 'create',
      coupon: {
        id: editingCoupon?.id,
        code: cleanCode,
        description: formDescription.trim(),
        discount_type: formType,
        discount_value: formType === 'FREE_SHIPPING' ? 0 : parseFloat(formValue) || 0,
        min_order_amount: formMinOrder ? parseFloat(formMinOrder) : undefined,
        max_discount_amount: formMaxDiscount ? parseFloat(formMaxDiscount) : undefined,
        max_uses: formMaxUses ? parseInt(formMaxUses, 10) : undefined,
        valid_from: formValidFrom || undefined,
        valid_until: formValidUntil || undefined,
        applies_to: formAppliesTo,
        active: editingCoupon ? editingCoupon.active : true,
      },
    };

    try {
      const res = await fetch('/api/backoffice/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons);
        setFeedback({
          type: 'success',
          message: editingCoupon
            ? `✓ Cupom ${cleanCode} atualizado com sucesso!`
            : `✓ Novo cupom ${cleanCode} criado e ativo na vitrine!`,
        });
        setTimeout(() => {
          setIsModalOpen(false);
          setFeedback(null);
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Erro ao gravar cupom no Supabase.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro de conexão com o servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, code: string) => {
    try {
      const res = await fetch('/api/backoffice/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status', id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.warn('Erro ao alternar status do cupom:', err);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom "${code}"?`)) return;
    try {
      const res = await fetch('/api/backoffice/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.warn('Erro ao excluir cupom:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(
        `/api/backoffice/coupons?code=${encodeURIComponent(
          testCode.trim()
        )}&subtotal=${encodeURIComponent(testSubtotal || '100')}`
      );
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ valid: false, message: 'Erro na simulação do cupom.' });
    } finally {
      setIsTesting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtros
  const filteredCoupons = coupons.filter((c) => {
    // Busca por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCode = c.code.toLowerCase().includes(term);
      const matchDesc = c.description?.toLowerCase().includes(term);
      const matchSeller = c.seller_name?.toLowerCase().includes(term);
      if (!matchCode && !matchDesc && !matchSeller) return false;
    }

    // Filtro por tipo
    if (typeFilter !== 'ALL' && c.discount_type !== typeFilter) {
      return false;
    }

    // Filtro por status
    const isExpired = c.valid_until && c.valid_until < todayStr;
    if (statusFilter === 'ACTIVE' && (!c.active || isExpired)) return false;
    if (statusFilter === 'PAUSED' && (c.active || isExpired)) return false;
    if (statusFilter === 'EXPIRED' && !isExpired) return false;

    return true;
  });

  const activeCount = coupons.filter(
    (c) => c.active && (!c.valid_until || c.valid_until >= todayStr)
  ).length;
  const totalUsesCount = coupons.reduce((sum, c) => sum + (c.times_used || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* =========================================================================
          BANNER TOP BAR: GERENCIADOR DE CUPONS OFICIAL
         ========================================================================= */}
      <div className="bg-deep-black text-white p-6 sm:p-8 border-2 border-gold shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-[9px] font-black uppercase tracking-widest text-gold border border-gold/40">
            <Tag className="w-3.5 h-3.5 text-gold" />
            <span>MÓDULO DE MARKETING & PROMOÇÕES DA LOJA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
            <span>CUPONS DE DESCONTO & PROMOÇÕES</span>
          </h1>
          <p className="text-xs text-white/75 max-w-2xl leading-relaxed uppercase">
            Crie códigos promocionais, defina porcentagens (%) ou valores fixos ($), frete grátis, datas de validade e controle o uso de cupons sem depender de ninguém.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchCoupons}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs transition"
            title="Atualizar lista de cupons do Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-3 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-deep-black stroke-[3]" />
            <span>+ CRIAR NOVO CUPOM</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CARDS DE MÉTRICAS RÁPIDAS
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-deep-black p-5 space-y-1 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
            CUPONS ATIVOS NA VITRINE
          </span>
          <p className="text-2xl sm:text-3xl font-black text-deep-black font-mono">
            {activeCount} <span className="text-xs text-deep-black/50">/ {coupons.length}</span>
          </p>
          <span className="text-[9px] text-green-700 font-bold block uppercase">
            ● Disponíveis para uso imediato
          </span>
        </div>

        <div className="bg-white border-2 border-deep-black p-5 space-y-1 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
            TOTAL DE UTILIZAÇÕES
          </span>
          <p className="text-2xl sm:text-3xl font-black text-gold font-mono">
            {totalUsesCount}
          </p>
          <span className="text-[9px] text-deep-black/50 font-bold block uppercase">
            Pedidos fechados com desconto
          </span>
        </div>

        <div className="bg-white border-2 border-deep-black p-5 space-y-1 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
            TIPOS DE DESCONTO
          </span>
          <div className="flex items-center gap-2 pt-1 font-mono text-xs font-bold text-deep-black">
            <span className="px-1.5 py-0.5 bg-gold/20 text-deep-black border border-gold">
              {coupons.filter((c) => c.discount_type === 'PERCENTAGE').length} %
            </span>
            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 border border-green-300">
              {coupons.filter((c) => c.discount_type === 'FIXED').length} $ OFF
            </span>
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-300">
              {coupons.filter((c) => c.discount_type === 'FREE_SHIPPING').length} FRETE
            </span>
          </div>
          <span className="text-[9px] text-deep-black/50 font-bold block uppercase pt-0.5">
            Formatos flexíveis para campanhas
          </span>
        </div>

        <div className="bg-deep-black text-white border-2 border-gold p-5 space-y-1 shadow-luxury">
          <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
            NUVEM SUPABASE
          </span>
          <p className="text-xl font-black text-white font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span>SINCRONIZADO</span>
          </p>
          <span className="text-[9px] text-white/70 font-bold block uppercase">
            Armazenamento permanente e seguro
          </span>
        </div>
      </div>

      {/* =========================================================================
          BARRA DE PESQUISA, FILTROS E SIMULADOR RÁPIDO
         ========================================================================= */}
      <div className="bg-white border-2 border-deep-black p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Busca por texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-deep-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="PESQUISAR POR CÓDIGO (EX: VERAO15, BEMVINDA)..."
              className="w-full pl-9 pr-3 py-2 border border-deep-black/20 text-xs uppercase font-mono font-bold focus:outline-none focus:border-deep-black"
            />
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-black uppercase text-deep-black/60 shrink-0">
              STATUS:
            </span>
            {(['ALL', 'ACTIVE', 'PAUSED', 'EXPIRED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition ${
                  statusFilter === st
                    ? 'bg-deep-black text-gold border-deep-black'
                    : 'bg-white text-deep-black/70 border-deep-black/20 hover:border-deep-black'
                }`}
              >
                {st === 'ALL'
                  ? 'TODOS'
                  : st === 'ACTIVE'
                  ? 'ATIVOS'
                  : st === 'PAUSED'
                  ? 'PAUSADOS'
                  : 'EXPIRADOS'}
              </button>
            ))}
          </div>

          {/* Filtro de Tipo */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-black uppercase text-deep-black/60 shrink-0">
              TIPO:
            </span>
            {(['ALL', 'PERCENTAGE', 'FIXED', 'FREE_SHIPPING'] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setTypeFilter(tp)}
                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition ${
                  typeFilter === tp
                    ? 'bg-deep-black text-gold border-deep-black'
                    : 'bg-white text-deep-black/70 border-deep-black/20 hover:border-deep-black'
                }`}
              >
                {tp === 'ALL'
                  ? 'TODOS'
                  : tp === 'PERCENTAGE'
                  ? '% OFF'
                  : tp === 'FIXED'
                  ? '$ OFF'
                  : 'FRETE GRÁTIS'}
              </button>
            ))}
          </div>
        </div>

        {/* Simulador rápido de cupom inline */}
        <div className="pt-3 border-t border-deep-black/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs bg-deep-black/5 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold shrink-0" />
            <span className="font-black text-deep-black uppercase text-[10px]">
              SIMULADOR DE CUPOM:
            </span>
          </div>

          <form onSubmit={handleTestCoupon} className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              placeholder="DIGITE O CUPOM (EX: VERAO15)"
              className="px-2.5 py-1 text-xs font-mono font-bold uppercase border border-deep-black/20 bg-white w-44 focus:outline-none focus:border-deep-black"
            />
            <div className="flex items-center gap-1 bg-white border border-deep-black/20 px-2 py-1">
              <span className="text-[10px] font-mono text-deep-black/50">$</span>
              <input
                type="number"
                step="5"
                value={testSubtotal}
                onChange={(e) => setTestSubtotal(e.target.value)}
                placeholder="Subtotal"
                className="w-16 text-xs font-mono font-bold focus:outline-none"
                title="Valor da sacola para simulação"
              />
            </div>
            <button
              type="submit"
              disabled={isTesting || !testCode.trim()}
              className="px-3 py-1 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-[10px] font-black uppercase tracking-wider transition disabled:opacity-50"
            >
              {isTesting ? 'SIMULANDO...' : 'TESTAR CÁLCULO'}
            </button>
          </form>

          {testResult && (
            <div
              className={`px-3 py-1 text-[10px] font-black uppercase border ${
                testResult.valid
                  ? 'bg-green-100 text-green-900 border-green-300'
                  : 'bg-red-100 text-red-900 border-red-300'
              }`}
            >
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          TABELA DE CUPONS CADASTRADOS
         ========================================================================= */}
      <div className="bg-white border-2 border-deep-black shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs uppercase tracking-wider">
          <thead className="bg-deep-black text-white text-[10px] font-black">
            <tr>
              <th className="p-4">CÓDIGO DO CUPOM</th>
              <th className="p-4">TIPO DE DESCONTO</th>
              <th className="p-4">REGRAS & PEDIDO MÍNIMO</th>
              <th className="p-4">VALIDADE / EXPIRAÇÃO</th>
              <th className="p-4">UTILIZAÇÕES</th>
              <th className="p-4">STATUS</th>
              <th className="p-4 text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-deep-black/10">
            {filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-deep-black/50 font-bold">
                  {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                    ? 'Nenhum cupom encontrado com os filtros selecionados.'
                    : 'Nenhum cupom cadastrado no momento. Clique no botão "+ CRIAR NOVO CUPOM" acima.'}
                </td>
              </tr>
            ) : (
              filteredCoupons.map((c) => {
                const isExpired = c.valid_until && c.valid_until < todayStr;
                const isLimitReached = c.max_uses && c.times_used >= c.max_uses;

                return (
                  <tr key={c.id} className="hover:bg-deep-black/5 transition">
                    {/* Código com botão copiar */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-deep-black bg-gold/15 px-2 py-0.5 border border-gold/40">
                          {c.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(c.code)}
                          className="p-1 hover:text-gold text-deep-black/40 transition"
                          title="Copiar código"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {copiedCode === c.code && (
                          <span className="text-[8px] bg-green-100 text-green-800 px-1 py-0.5 font-bold animate-pulse">
                            ✓ COPIADO
                          </span>
                        )}
                      </div>
                      {c.description && (
                        <p className="text-[10px] text-deep-black/60 font-bold mt-1 line-clamp-1 lowercase first-letter:uppercase">
                          {c.description}
                        </p>
                      )}
                      <span className="text-[8.5px] text-deep-black/40 block mt-0.5 font-mono">
                        {c.seller_name || 'Loja Oficial'}
                      </span>
                    </td>

                    {/* Badge do Tipo de Desconto */}
                    <td className="p-4">
                      {c.discount_type === 'PERCENTAGE' && (
                        <span className="px-2.5 py-1 bg-gold text-deep-black font-mono font-black text-xs border border-deep-black inline-flex items-center gap-1 shadow-xs">
                          <Percent className="w-3 h-3 stroke-[3]" />
                          <span>{c.discount_value}% OFF</span>
                        </span>
                      )}
                      {c.discount_type === 'FIXED' && (
                        <span className="px-2.5 py-1 bg-green-700 text-white font-mono font-black text-xs border border-deep-black inline-flex items-center gap-1 shadow-xs">
                          <DollarSign className="w-3 h-3 stroke-[3]" />
                          <span>${Number(c.discount_value).toFixed(2)} OFF</span>
                        </span>
                      )}
                      {c.discount_type === 'FREE_SHIPPING' && (
                        <span className="px-2.5 py-1 bg-blue-700 text-white font-mono font-black text-xs border border-deep-black inline-flex items-center gap-1 shadow-xs">
                          <Truck className="w-3 h-3 stroke-[3]" />
                          <span>FRETE GRÁTIS</span>
                        </span>
                      )}
                    </td>

                    {/* Regras */}
                    <td className="p-4 text-[10px] font-bold space-y-0.5">
                      <div>
                        {c.min_order_amount ? (
                          <span className="text-deep-black">
                            Mínimo: <span className="font-mono text-gold font-black">${c.min_order_amount.toFixed(2)}</span>
                          </span>
                        ) : (
                          <span className="text-deep-black/40">Sem pedido mínimo</span>
                        )}
                      </div>
                      <div>
                        {c.max_discount_amount ? (
                          <span className="text-deep-black/60">
                            Teto máximo: <span className="font-mono font-black">${c.max_discount_amount.toFixed(2)}</span>
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <span className="text-[9px] text-deep-black/40">
                          {c.applies_to === 'ALL'
                            ? '🌐 Site + Balcão'
                            : c.applies_to === 'ONLINE'
                            ? '💻 Apenas Site'
                            : '🏬 Apenas Showroom/PDV'}
                        </span>
                      </div>
                    </td>

                    {/* Validade */}
                    <td className="p-4">
                      {isExpired ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[9px] font-black border border-red-300 inline-block">
                          EXPIRADO EM {c.valid_until}
                        </span>
                      ) : c.valid_until ? (
                        <div>
                          <span className="text-deep-black font-mono font-bold text-xs block">
                            Até {c.valid_until}
                          </span>
                          {c.valid_from && (
                            <span className="text-[9px] text-deep-black/50 block">
                              Início: {c.valid_from}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-deep-black/60 font-mono text-[10px] font-bold">
                          Permanente (sem data)
                        </span>
                      )}
                    </td>

                    {/* Utilizações */}
                    <td className="p-4 font-mono">
                      <div className="flex items-center gap-1 font-black text-deep-black text-xs">
                        <span>{c.times_used || 0}</span>
                        {c.max_uses ? (
                          <span className="text-deep-black/40 text-[10px]">/ {c.max_uses}</span>
                        ) : null}
                      </div>
                      {isLimitReached && (
                        <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1 py-0.5 border border-amber-300 block w-fit mt-0.5">
                          LIMITE ATINGIDO
                        </span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c.id, c.active, c.code)}
                        className={`px-2.5 py-1 text-[10px] font-black uppercase border flex items-center gap-1.5 transition ${
                          c.active && !isExpired
                            ? 'bg-green-100 text-green-900 border-green-400 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                        title="Clique para alternar entre Ativo e Pausado"
                      >
                        {c.active && !isExpired ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                            <span>ATIVO</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            <span>PAUSADO</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 hover:bg-deep-black hover:text-white border border-deep-black/20 text-deep-black transition"
                          title="Editar cupom"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="p-1.5 hover:bg-red-600 hover:text-white border border-red-200 text-red-600 transition"
                          title="Excluir cupom"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          MODAL DE CRIAÇÃO / EDIÇÃO DE CUPOM
         ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-deep-black max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-gold" />
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black">
                  {editingCoupon ? `EDITAR CUPOM: ${editingCoupon.code}` : 'CRIAR NOVO CUPOM DE DESCONTO'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-deep-black/40 hover:text-deep-black transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 text-xs font-black uppercase border flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-green-100 text-green-900 border-green-400'
                    : 'bg-red-100 text-red-900 border-red-400'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              {/* Código do Cupom */}
              <div>
                <label className="font-black uppercase tracking-wider text-deep-black block mb-1">
                  CÓDIGO DO CUPOM * (SEM ESPAÇOS, EM MAIÚSCULAS)
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="EX: VERAO15, ANA10, BLACKFRIDAY"
                  className="w-full p-2.5 border-2 border-deep-black font-mono font-black text-sm uppercase tracking-wider focus:outline-none focus:border-gold"
                />
                <span className="text-[10px] text-deep-black/60 font-bold block mt-0.5">
                  É exatamente o que o cliente digitará no carrinho/checkout para ganhar o benefício.
                </span>
              </div>

              {/* Descrição Interna */}
              <div>
                <label className="font-black uppercase tracking-wider text-deep-black block mb-1">
                  DESCRIÇÃO / OBJETIVO DA CAMPANHA (OPCIONAL)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="EX: Cupom especial para seguidoras do Instagram"
                  className="w-full p-2 border border-deep-black/30 font-medium focus:outline-none focus:border-deep-black"
                />
              </div>

              {/* Tipo de Desconto */}
              <div>
                <label className="font-black uppercase tracking-wider text-deep-black block mb-1">
                  TIPO DE BENEFÍCIO *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('PERCENTAGE')}
                    className={`p-3 border-2 font-black uppercase text-center transition flex flex-col items-center gap-1 ${
                      formType === 'PERCENTAGE'
                        ? 'border-gold bg-gold/15 text-deep-black'
                        : 'border-deep-black/20 hover:border-deep-black text-deep-black/60'
                    }`}
                  >
                    <Percent className="w-4 h-4 text-gold stroke-[3]" />
                    <span className="text-[10px]">PORCENTAGEM (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('FIXED')}
                    className={`p-3 border-2 font-black uppercase text-center transition flex flex-col items-center gap-1 ${
                      formType === 'FIXED'
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-deep-black/20 hover:border-deep-black text-deep-black/60'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-green-600 stroke-[3]" />
                    <span className="text-[10px]">VALOR FIXO ($)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('FREE_SHIPPING')}
                    className={`p-3 border-2 font-black uppercase text-center transition flex flex-col items-center gap-1 ${
                      formType === 'FREE_SHIPPING'
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-deep-black/20 hover:border-deep-black text-deep-black/60'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-blue-600 stroke-[3]" />
                    <span className="text-[10px]">FRETE GRÁTIS</span>
                  </button>
                </div>
              </div>

              {/* Valor do Desconto */}
              {formType !== 'FREE_SHIPPING' && (
                <div>
                  <label className="font-black uppercase tracking-wider text-deep-black block mb-1">
                    {formType === 'PERCENTAGE'
                      ? 'PORCENTAGEM DE DESCONTO (%) *'
                      : 'VALOR DO DESCONTO EM DÓLAR ($ USD) *'}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-deep-black">
                      {formType === 'PERCENTAGE' ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      step={formType === 'PERCENTAGE' ? '1' : '0.5'}
                      min="0.1"
                      max={formType === 'PERCENTAGE' ? '100' : '9999'}
                      required
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      placeholder={formType === 'PERCENTAGE' ? '15' : '10.00'}
                      className="w-full p-2.5 border-2 border-deep-black font-mono font-black text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              )}

              {/* Regras e Condições */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-black uppercase tracking-wider text-deep-black block mb-1">
                    PEDIDO MÍNIMO ($ USD)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    placeholder="Sem mínimo (0)"
                    className="w-full p-2 border border-deep-black/30 font-mono text-xs focus:outline-none focus:border-deep-black"
                  />
                  <span className="text-[9px] text-deep-black/50 block mt-0.5">
                    Ex: 50.00 (só aplica se carrinho &ge; $50)
                  </span>
                </div>

                <div>
                  <label className="font-black uppercase tracking-wider text-deep-black block mb-1">
                    LIMITE TOTAL DE USOS
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder="Ilimitado"
                    className="w-full p-2 border border-deep-black/30 font-mono text-xs focus:outline-none focus:border-deep-black"
                  />
                  <span className="text-[9px] text-deep-black/50 block mt-0.5">
                    Ex: 100 (expira após os 100 primeiros clientes)
                  </span>
                </div>
              </div>

              {/* Datas de Validade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-black uppercase tracking-wider text-deep-black block mb-1">
                    INÍCIO DA PROMOÇÃO (DATA)
                  </label>
                  <input
                    type="date"
                    value={formValidFrom}
                    onChange={(e) => setFormValidFrom(e.target.value)}
                    className="w-full p-2 border border-deep-black/30 font-mono text-xs focus:outline-none focus:border-deep-black"
                  />
                </div>

                <div>
                  <label className="font-black uppercase tracking-wider text-deep-black block mb-1">
                    EXPIRAÇÃO / VALIDADE ATÉ
                  </label>
                  <input
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full p-2 border border-deep-black/30 font-mono text-xs focus:outline-none focus:border-deep-black"
                  />
                  <span className="text-[9px] text-deep-black/50 block mt-0.5">
                    Deixe em branco para cupom sem expiração
                  </span>
                </div>
              </div>

              {/* Canal de Aplicação */}
              <div>
                <label className="font-black uppercase tracking-wider text-deep-black block mb-1">
                  ONDE ESTE CUPOM PODE SER USADO?
                </label>
                <select
                  value={formAppliesTo}
                  onChange={(e) => setFormAppliesTo(e.target.value as any)}
                  className="w-full p-2 border border-deep-black/30 font-bold focus:outline-none focus:border-deep-black bg-white"
                >
                  <option value="ALL">🌐 TODOS OS CANAIS (Site Online + Balcão/Showroom)</option>
                  <option value="ONLINE">💻 APENAS LOJA VIRTUAL ONLINE (Site Oficial)</option>
                  <option value="POS">🏬 APENAS BALCÃO / SHOWROOM (PDV Presencial)</option>
                </select>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-deep-black/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-deep-black/30 text-deep-black font-black uppercase tracking-wider hover:bg-deep-black/5"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black font-black uppercase tracking-widest transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SALVANDO...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-gold" />
                      <span>{editingCoupon ? 'ATUALIZAR CUPOM' : 'SALVAR NO SUPABASE'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
