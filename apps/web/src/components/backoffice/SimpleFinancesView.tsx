'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Plus,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  RefreshCw,
  Printer,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Building,
  Lightbulb,
  Scissors,
  Package,
  Truck,
  Megaphone,
  UserCheck,
  FileText,
  CreditCard,
  X,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Tag,
  Calculator,
  PackageMinus,
} from 'lucide-react';
import { ExpenseRecord, ExpenseCategory, FinancesState } from '@/lib/financesStore';
import { ClothingPricingCalculator } from './ClothingPricingCalculator';

interface SimpleFinancesViewProps {
  salesData: any;
  sellers?: any[];
  onOpenWriteOffModal?: () => void;
}

const CATEGORY_MAP: Record<
  ExpenseCategory,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  RENT: {
    label: 'Aluguel & Showroom',
    icon: Building,
    color: 'text-indigo-800',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  UTILITIES: {
    label: 'Contas (Luz, Internet, Água)',
    icon: Lightbulb,
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  SUPPLIERS: {
    label: 'Confecção, Tecidos & Costura',
    icon: Scissors,
    color: 'text-purple-800',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  PACKAGING: {
    label: 'Embalagens & Sacolas',
    icon: Package,
    color: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  SHIPPING: {
    label: 'Fretes & Correios (USPS)',
    icon: Truck,
    color: 'text-sky-800',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  MARKETING: {
    label: 'Marketing & Anúncios (Instagram Ads)',
    icon: Megaphone,
    color: 'text-pink-800',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
  WITHDRAWAL: {
    label: 'Retirada da Sócia (Ana Carina)',
    icon: UserCheck,
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  TAXES: {
    label: 'Taxas, Licenças & Impostos',
    icon: FileText,
    color: 'text-slate-800',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  OTHER: {
    label: 'Diversos / Outros',
    icon: Tag,
    color: 'text-gray-800',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  },
};

export function SimpleFinancesView({ salesData, sellers = [], onOpenWriteOffModal }: SimpleFinancesViewProps) {
  const [loading, setLoading] = useState(true);
  const [finances, setFinances] = useState<FinancesState>({
    expenses: [],
    initialCashBalance: 0,
    updatedAt: new Date().toISOString(),
  });

  // Sub-abas do Financeiro (Default: Compras & Precificação das Roupas)
  const [financeSubTab, setFinanceSubTab] = useState<'pricing' | 'cashflow'>('pricing');

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState<string>('CURRENT'); // 'CURRENT', 'PREVIOUS', 'ALL'
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // Modais
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [tempInitialBalance, setTempInitialBalance] = useState<number>(0);

  // Form de Despesa
  const [expenseFormData, setExpenseFormData] = useState<{
    date: string;
    description: string;
    category: ExpenseCategory;
    amount: string;
    payment_method: 'ZELLE' | 'BANK' | 'CASH' | 'CARD' | 'VENMO' | 'OTHER';
    status: 'PAID' | 'PENDING';
    due_date: string;
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'RENT',
    amount: '',
    payment_method: 'ZELLE',
    status: 'PAID',
    due_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [savingExpense, setSavingExpense] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Carrega despesas da API
  const fetchFinances = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/backoffice/finances');
      const data = await res.json();
      if (data.success && data.finances) {
        setFinances(data.finances);
        setTempInitialBalance(data.finances.initialCashBalance || 0);
      }
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  // Datas de referência para filtro
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0 a 11

  const previousMonthDate = new Date(currentYear, currentMonthIdx - 1, 1);
  const prevYear = previousMonthDate.getFullYear();
  const prevMonthIdx = previousMonthDate.getMonth();

  const sales = salesData?.sales || [];

  // Filtra Vendas por Período
  const filteredSales = useMemo(() => {
    return sales.filter((s: any) => {
      const d = new Date(s.created_at);
      if (selectedMonth === 'CURRENT') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
      }
      if (selectedMonth === 'PREVIOUS') {
        return d.getFullYear() === prevYear && d.getMonth() === prevMonthIdx;
      }
      return true;
    });
  }, [sales, selectedMonth, currentYear, currentMonthIdx, prevYear, prevMonthIdx]);

  // Filtra Despesas por Período, Categoria e Status
  const filteredExpenses = useMemo(() => {
    return (finances.expenses || []).filter((exp) => {
      const d = new Date(exp.date + 'T12:00:00');
      let matchesMonth = true;
      if (selectedMonth === 'CURRENT') {
        matchesMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
      } else if (selectedMonth === 'PREVIOUS') {
        matchesMonth = d.getFullYear() === prevYear && d.getMonth() === prevMonthIdx;
      }

      const matchesCat = categoryFilter === 'ALL' || exp.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || exp.status === statusFilter;

      return matchesMonth && matchesCat && matchesStatus;
    });
  }, [finances.expenses, selectedMonth, categoryFilter, statusFilter, currentYear, currentMonthIdx, prevYear, prevMonthIdx]);

  // CÁLCULOS DO FLUXO DE CAIXA E DRE
  // 1. Receitas de Vendas Realizadas (Entradas)
  let revenueOnline = 0;
  let revenuePos = 0;
  let revenueCrediarioReceived = 0;
  let totalCostOfGoods = 0;
  let totalCommissionsFromSales = 0;
  let totalPaymentFees = 0;
  let totalShippingCollected = 0;

  filteredSales.forEach((s: any) => {
    const isPaid =
      s.status === 'COMPLETED' ||
      s.status === 'PAID' ||
      s.status === 'DELIVERED' ||
      s.status === 'SHIPPED';

    const gross = (Number(s.subtotal_products) || 0) + (Number(s.shipping_fee) || 0) - (Number(s.discount_amount) || 0);

    if (isPaid) {
      if (s.channel === 'ONLINE') {
        revenueOnline += gross;
      } else {
        revenuePos += gross;
      }
      totalCostOfGoods += Number(s.cost_of_goods) || 0;
      totalCommissionsFromSales += Number(s.commission_amount) || 0;
      totalPaymentFees += Number(s.payment_fee) || 0;
      totalShippingCollected += Number(s.shipping_fee) || 0;
    }

    // Se tiver crediário, soma entradas e parcelas pagas
    if (s.crediario) {
      const down = Number(s.crediario.down_payment) || 0;
      revenueCrediarioReceived += down;
      (s.crediario.installments || []).forEach((inst: any) => {
        if (inst.status === 'PAID') {
          revenueCrediarioReceived += Number(inst.amount) || 0;
        }
      });
    }
  });

  const totalInflows = revenueOnline + revenuePos;

  // 2. Despesas Lançadas (Saídas)
  const paidExpensesTotal = filteredExpenses
    .filter((e) => e.status === 'PAID')
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const pendingExpensesTotal = filteredExpenses
    .filter((e) => e.status === 'PENDING')
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Total de Saídas Reais = Custos das Peças + Comissões Pagas + Taxas de Gateway + Despesas Pagas
  const totalOutflows = totalCostOfGoods + totalCommissionsFromSales + totalPaymentFees + paidExpensesTotal;

  // 3. Saldo Atual em Caixa (Disponível)
  const currentCashBalance = (Number(finances.initialCashBalance) || 0) + totalInflows - totalOutflows;

  // 4. Lucro Líquido Real Final do Período
  const netProfitPeriod = totalInflows - totalOutflows;
  const netMarginPct = totalInflows > 0 ? ((netProfitPeriod / totalInflows) * 100).toFixed(1) : '0.0';

  // 5. Crediário a Receber em Aberto (Contas a Receber)
  let crediarioReceivablesTotal = 0;
  sales.forEach((s: any) => {
    if (s.crediario?.installments) {
      s.crediario.installments.forEach((inst: any) => {
        if (inst.status === 'PENDING') {
          crediarioReceivablesTotal += Number(inst.amount) || 0;
        }
      });
    }
  });

  // Ações do Modal de Despesa
  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    setExpenseFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: 'RENT',
      amount: '',
      payment_method: 'ZELLE',
      status: 'PAID',
      due_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowExpenseModal(true);
  };

  const handleOpenEditExpense = (expense: ExpenseRecord) => {
    setEditingExpenseId(expense.id);
    setExpenseFormData({
      date: expense.date,
      description: expense.description,
      category: expense.category,
      amount: expense.amount.toString(),
      payment_method: expense.payment_method,
      status: expense.status,
      due_date: expense.due_date || expense.date,
      notes: expense.notes || '',
    });
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseFormData.description.trim() || Number(expenseFormData.amount) <= 0) {
      alert('Preencha a descrição e um valor válido.');
      return;
    }

    setSavingExpense(true);
    try {
      const res = await fetch('/api/backoffice/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_expense',
          expense: {
            id: editingExpenseId,
            ...expenseFormData,
            amount: parseFloat(expenseFormData.amount),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFinances(data.finances);
        setShowExpenseModal(false);
        setFeedbackBanner(editingExpenseId ? 'Despesa atualizada com sucesso!' : 'Despesa lançada com sucesso no financeiro!');
        setTimeout(() => setFeedbackBanner(null), 3500);
      } else {
        alert(data.error || 'Erro ao salvar despesa.');
      }
    } catch (err: any) {
      alert('Falha na comunicação: ' + err.message);
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string, description: string) => {
    if (!confirm(`Tem certeza que deseja excluir o lançamento "${description}"?`)) return;
    try {
      const res = await fetch('/api/backoffice/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_expense', expense_id: id }),
      });
      const data = await res.json();
      if (data.success) {
        setFinances(data.finances);
        setFeedbackBanner('Lançamento removido do financeiro.');
        setTimeout(() => setFeedbackBanner(null), 3000);
      }
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleMarkExpensePaid = async (id: string) => {
    try {
      const res = await fetch('/api/backoffice/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid', expense_id: id }),
      });
      const data = await res.json();
      if (data.success) {
        setFinances(data.finances);
        setFeedbackBanner('Conta marcada como PAGA com sucesso!');
        setTimeout(() => setFeedbackBanner(null), 3000);
      }
    } catch (err: any) {
      alert('Erro ao marcar como paga: ' + err.message);
    }
  };

  const handleSaveInitialBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/backoffice/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_initial_balance',
          balance: tempInitialBalance,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFinances(data.finances);
        setShowBalanceModal(false);
        setFeedbackBanner('Saldo inicial de caixa atualizado!');
        setTimeout(() => setFeedbackBanner(null), 3000);
      }
    } catch (err: any) {
      alert('Erro ao salvar saldo inicial: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Top Header com Resumo Geral & Ações */}
      <div className="bg-deep-black text-white p-6 sm:p-8 border-2 border-gold shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-white/10 text-[9px] font-black uppercase tracking-widest text-gold border border-gold/40">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>MÓDULO FINANCEIRO SIMPLES • FLUXO DE CAIXA & DRE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-gold" />
            <span>FINANCEIRO DA LOJA (ANA FITNESS WEAR LLC)</span>
          </h2>
          <p className="text-xs text-white/70 uppercase tracking-wider max-w-2xl leading-relaxed">
            Acompanhe o faturamento real, despesas do showroom (aluguel, luz, embalagens), saldo em caixa e quanto sobrou de lucro limpo no seu bolso em dólares ($ USD).
          </p>
        </div>

        {/* Botões de Ação Principais */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAddExpense}
            className="px-5 py-3 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4 text-deep-black" />
            <span>+ LANÇAR DESPESA / SAÍDA</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBalanceModal(true)}
            className="px-4 py-3 bg-white/10 hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider border border-white/20 transition flex items-center gap-2"
            title="Definir troco inicial ou saldo em conta"
          >
            <DollarSign className="w-4 h-4 text-gold" />
            <span>SALDO INICIAL (${Number(finances.initialCashBalance || 0).toFixed(2)})</span>
          </button>

          <button
            type="button"
            onClick={fetchFinances}
            className="p-3 bg-white/10 hover:bg-white hover:text-deep-black text-white transition border border-white/20"
            title="Atualizar dados financeiros"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-3 bg-white/10 hover:bg-white hover:text-deep-black text-white transition border border-white/20"
            title="Imprimir relatório financeiro"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner de Feedback */}
      {feedbackBanner && (
        <div className="p-3.5 bg-emerald-950 text-emerald-200 border-2 border-emerald-500 text-xs font-black uppercase tracking-wider flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackBanner}</span>
          </div>
          <button onClick={() => setFeedbackBanner(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SELETOR DE SUB-ABAS DO FINANCEIRO */}
      <div className="flex border-b-2 border-deep-black text-xs font-black uppercase tracking-widest gap-2 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setFinanceSubTab('pricing')}
          className={`py-3.5 px-6 border-b-2 transition flex items-center gap-2.5 ${
            financeSubTab === 'pricing'
              ? 'border-gold text-deep-black bg-gold/15 font-black shadow-sm'
              : 'border-transparent text-deep-black/60 hover:text-deep-black'
          }`}
        >
          <Calculator className="w-4 h-4 text-gold" />
          <span>ENTRADA DE NOTA FISCAL, FRETE & FORMAÇÃO DE PREÇO</span>
          <span className="px-1.5 py-0.5 bg-gold text-deep-black text-[9px] font-black">NOTA FISCAL</span>
        </button>

        <button
          type="button"
          onClick={() => setFinanceSubTab('cashflow')}
          className={`py-3.5 px-6 border-b-2 transition flex items-center gap-2.5 ${
            financeSubTab === 'cashflow'
              ? 'border-gold text-deep-black bg-gold/15 font-black shadow-sm'
              : 'border-transparent text-deep-black/60 hover:text-deep-black'
          }`}
        >
          <Wallet className="w-4 h-4 text-gold" />
          <span>FLUXO DE CAIXA, CONTAS & DRE (DESPESAS GERAIS)</span>
        </button>
      </div>

      {/* SUB-ABA 1: COMPRAS DE ROUPAS & PRECIFICAÇÃO COM FRETE */}
      {financeSubTab === 'pricing' && (
        <ClothingPricingCalculator
          finances={finances}
          onRefresh={fetchFinances}
          onShowFeedback={(msg) => setFeedbackBanner(msg)}
        />
      )}

      {/* SUB-ABA 2: FLUXO DE CAIXA COMPLETO & DESPESAS */}
      {financeSubTab === 'cashflow' && (
        <div className="space-y-8 animate-fadeIn">
          {/* 2. Barra de Filtro de Período (Mês Atual / Mês Anterior / Todos) */}
          <div className="bg-white border-2 border-deep-black p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold" />
          <span className="text-xs font-black uppercase tracking-wider text-deep-black">
            PERÍODO EM EXIBIÇÃO:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedMonth('CURRENT')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition border ${
              selectedMonth === 'CURRENT'
                ? 'bg-deep-black text-gold border-deep-black'
                : 'bg-white text-deep-black/60 border-deep-black/20 hover:text-deep-black'
            }`}
          >
            MÊS ATUAL ({new Date().toLocaleString('pt-BR', { month: 'long' })})
          </button>

          <button
            type="button"
            onClick={() => setSelectedMonth('PREVIOUS')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition border ${
              selectedMonth === 'PREVIOUS'
                ? 'bg-deep-black text-gold border-deep-black'
                : 'bg-white text-deep-black/60 border-deep-black/20 hover:text-deep-black'
            }`}
          >
            MÊS ANTERIOR ({previousMonthDate.toLocaleString('pt-BR', { month: 'long' })})
          </button>

          <button
            type="button"
            onClick={() => setSelectedMonth('ALL')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition border ${
              selectedMonth === 'ALL'
                ? 'bg-deep-black text-gold border-deep-black'
                : 'bg-white text-deep-black/60 border-deep-black/20 hover:text-deep-black'
            }`}
          >
            TODO O HISTÓRICO ACUMULADO
          </button>
        </div>
      </div>

      {/* 3. OS 4 CARDS GIGANTES DE FLUXO DE CAIXA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL DE ENTRADAS (RECEITAS) */}
        <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
              ENTRADAS TOTAIS (VENDAS)
            </span>
            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[9px] font-black uppercase flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-green-700" />
              <span>ENTROU</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-green-700 font-mono">
            ${totalInflows.toFixed(2)}
          </div>
          <div className="text-[10px] text-deep-black/60 uppercase font-mono space-y-0.5">
            <div>Online: ${revenueOnline.toFixed(2)} | Balcão: ${revenuePos.toFixed(2)}</div>
            <div className="text-[9px] text-deep-black/40 font-bold">{filteredSales.length} pedidos no período</div>
          </div>
        </div>

        {/* Card 2: TOTAL DE SAÍDAS (CUSTOS + DESPESAS) */}
        <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
              SAÍDAS TOTAIS (PAGAS)
            </span>
            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[9px] font-black uppercase flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-red-700" />
              <span>SAIU</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 font-mono">
            -${totalOutflows.toFixed(2)}
          </div>
          <div className="text-[10px] text-deep-black/60 uppercase font-mono space-y-0.5">
            <div>Peças: ${totalCostOfGoods.toFixed(2)} | Despesas: ${paidExpensesTotal.toFixed(2)}</div>
            <div className="text-[9px] text-deep-black/40 font-bold">Comissões: ${totalCommissionsFromSales.toFixed(2)}</div>
          </div>
        </div>

        {/* Card 3: SALDO ATUAL EM CAIXA (DISPONÍVEL) */}
        <div className="bg-deep-black text-white border-2 border-gold p-5 space-y-2 shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold">
              SALDO DISPONÍVEL EM CAIXA
            </span>
            <Wallet className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            ${currentCashBalance.toFixed(2)}
          </div>
          <p className="text-[10px] text-gold/80 uppercase font-bold font-mono">
            Fundo de Caixa (${Number(finances.initialCashBalance || 0).toFixed(2)}) + Entradas - Saídas
          </p>
        </div>

        {/* Card 4: LUCRO LÍQUIDO REAL NO BOLSO */}
        <div className="bg-deep-black text-white border-2 border-gold p-5 space-y-2 shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold">
              LUCRO LÍQUIDO REAL DO PERÍODO
            </span>
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${netProfitPeriod >= 0 ? 'text-gold' : 'text-red-400'}`}>
            ${netProfitPeriod.toFixed(2)}
          </div>
          <div className="inline-flex items-center gap-1 bg-gold/20 px-2 py-0.5 text-[9px] font-black text-gold uppercase border border-gold/40">
            <span>{netMarginPct}% MARGEM LÍQUIDA REAL</span>
          </div>
        </div>
      </div>

      {/* 4. BLOCO DE CONTAS A PAGAR & CREDIÁRIO A RECEBER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas a Pagar Pendentes */}
        <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-deep-black">
                CONTAS A PAGAR PENDENTES ({filteredExpenses.filter((e) => e.status === 'PENDING').length})
              </h3>
            </div>
            <span className="text-xs font-mono font-black text-red-600">
              Total: ${pendingExpensesTotal.toFixed(2)}
            </span>
          </div>

          {filteredExpenses.filter((e) => e.status === 'PENDING').length === 0 ? (
            <div className="p-8 text-center text-xs text-deep-black/50 font-bold uppercase space-y-1">
              <CheckCircle2 className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p>Nenhuma conta pendente para este período!</p>
              <p className="text-[10px] text-deep-black/40">Todas as despesas lançadas estão quitadas.</p>
            </div>
          ) : (
            <div className="divide-y divide-deep-black/10 max-h-60 overflow-y-auto">
              {filteredExpenses
                .filter((e) => e.status === 'PENDING')
                .map((exp) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-black text-deep-black block">{exp.description}</span>
                      <span className="text-[10px] text-deep-black/60 font-mono block">
                        Vence em: {exp.due_date || exp.date} • {CATEGORY_MAP[exp.category]?.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-red-600 text-sm">
                        ${exp.amount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMarkExpensePaid(exp.id)}
                        className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition"
                        title="Marcar como paga agora"
                      >
                        <Check className="w-3 h-3" />
                        <span>PAGAR</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Crediário a Receber no Balcão */}
        <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gold" />
              <h3 className="text-xs font-black uppercase tracking-widest text-deep-black">
                CREDIÁRIO (CARNÊS A RECEBER)
              </h3>
            </div>
            <span className="text-xs font-mono font-black text-gold">
              A Receber: ${crediarioReceivablesTotal.toFixed(2)}
            </span>
          </div>

          <p className="text-xs text-deep-black/70 leading-relaxed uppercase">
            Valores de compras parceladas no crediário da loja física aguardando pagamento pelas clientes nas datas de vencimento:
          </p>

          <div className="p-4 bg-deep-black/5 border border-deep-black/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-deep-black/60 uppercase block">Total Já Recebido no Crediário:</span>
              <span className="font-mono font-black text-green-700 text-base">
                ${revenueCrediarioReceived.toFixed(2)} USD
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-deep-black/60 uppercase block">Saldo Pendente a Entrar:</span>
              <span className="font-mono font-black text-gold text-base">
                ${crediarioReceivablesTotal.toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DEMONSTRATIVO DE RESULTADO (DRE SIMPLIFICADO) */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-deep-black">
              DEMONSTRATIVO FINANCEIRO SIMPLIFICADO (DRE DO PERÍODO)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-deep-black/50 font-bold uppercase">
            Moeda Oficial: Dólar Americano ($ USD)
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono uppercase">
          {/* 1. Receita Bruta */}
          <div className="flex justify-between p-2.5 bg-green-50 border border-green-200 font-black text-green-900">
            <span>(+) FATURAMENTO BRUTO TOTAL DE VENDAS</span>
            <span>+${totalInflows.toFixed(2)}</span>
          </div>
          <div className="pl-4 pr-2 flex justify-between text-[11px] text-deep-black/60">
            <span>• Vendas da Loja Online</span>
            <span>${revenueOnline.toFixed(2)}</span>
          </div>
          <div className="pl-4 pr-2 flex justify-between text-[11px] text-deep-black/60">
            <span>• Vendas do Balcão Showroom (PDV)</span>
            <span>${revenuePos.toFixed(2)}</span>
          </div>

          {/* 2. Custo das Peças */}
          <div className="flex justify-between p-2.5 bg-red-50 border border-red-200 font-black text-red-900">
            <span>(-) CUSTO DE CONFECÇÃO DAS PEÇAS VENDIDAS (COGS)</span>
            <span>-${totalCostOfGoods.toFixed(2)}</span>
          </div>

          {/* 3. Margem Bruta */}
          <div className="flex justify-between p-2.5 bg-deep-black/5 border border-deep-black/10 font-bold text-deep-black">
            <span>(=) MARGEM BRUTA DE CONTRIBUIÇÃO</span>
            <span>${(totalInflows - totalCostOfGoods).toFixed(2)}</span>
          </div>

          {/* 4. Deduções de Taxas & Comissões */}
          <div className="pl-4 pr-2 flex justify-between text-[11px] text-deep-black/70">
            <span>(-) Taxas de Meios de Pagamento (Cartão/Stripe/Venmo)</span>
            <span>-${totalPaymentFees.toFixed(2)}</span>
          </div>
          <div className="pl-4 pr-2 flex justify-between text-[11px] text-deep-black/70">
            <span>(-) Comissões Repassadas às Vendedoras</span>
            <span>-${totalCommissionsFromSales.toFixed(2)}</span>
          </div>

          {/* 5. Despesas Operacionais da Loja */}
          <div className="flex justify-between p-2.5 bg-red-50 border border-red-200 font-black text-red-900">
            <span>(-) DESPESAS OPERACIONAIS LANÇADAS DA LOJA</span>
            <span>-${paidExpensesTotal.toFixed(2)}</span>
          </div>

          {/* 6. Lucro Líquido Final */}
          <div className="flex justify-between p-3.5 bg-deep-black text-gold border-2 border-gold font-black text-sm sm:text-base">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>(=) LUCRO LÍQUIDO FINAL NO SEU BOLSO (USD)</span>
            </span>
            <span className="font-mono font-black">${netProfitPeriod.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 6. TABELA DE DESPESAS LANÇADAS (+ FILTROS) */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-deep-black/10 pb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gold" />
              <span>LANÇAMENTOS DE DESPESAS & SAÍDAS ({filteredExpenses.length})</span>
            </h3>
            <p className="text-[10px] text-deep-black/60 uppercase font-medium mt-0.5">
              Aluguel, contas de luz, confecção, embalagens e despesas operacionais da empresa.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro de Categoria */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold uppercase border border-deep-black/20 focus:outline-none focus:border-deep-black bg-white"
            >
              <option value="ALL">Todas as Categorias</option>
              {Object.entries(CATEGORY_MAP).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-bold uppercase border border-deep-black/20 focus:outline-none focus:border-deep-black bg-white"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PAID">Apenas Pagas</option>
              <option value="PENDING">Apenas Pendentes (A Pagar)</option>
            </select>

            <button
              type="button"
              onClick={handleOpenAddExpense}
              className="px-4 py-1.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova</span>
            </button>

            {onOpenWriteOffModal && (
              <button
                type="button"
                onClick={onOpenWriteOffModal}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow border border-red-800"
                title="Lançar ou ver histórico de mercadorias retiradas para uso próprio, mostruário ou marketing"
              >
                <PackageMinus className="w-3.5 h-3.5" />
                <span>Retiradas de Peças</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabela de Despesas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs uppercase tracking-wider">
            <thead className="bg-deep-black text-white text-[10px] font-black">
              <tr>
                <th className="p-3">DATA</th>
                <th className="p-3">CATEGORIA</th>
                <th className="p-3">DESCRIÇÃO DA DESPESA</th>
                <th className="p-3">FORMA PGTO</th>
                <th className="p-3">VALOR ($ USD)</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deep-black/10">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-deep-black/50 font-bold">
                    Nenhuma despesa lançada para o filtro selecionado. Clique em "+ NOVA" para adicionar.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const cat = CATEGORY_MAP[exp.category] || CATEGORY_MAP.OTHER;
                  const Icon = cat.icon;

                  return (
                    <tr key={exp.id} className="hover:bg-deep-black/5 transition">
                      <td className="p-3 font-mono font-bold text-deep-black whitespace-nowrap">
                        {exp.date}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black border ${cat.bg} ${cat.color} ${cat.border}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{cat.label}</span>
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-black text-deep-black block">{exp.description}</span>
                        {exp.notes && (
                          <span className="text-[10px] text-deep-black/50 font-normal block">{exp.notes}</span>
                        )}
                      </td>

                      <td className="p-3 font-mono font-bold text-deep-black/70 text-[11px]">
                        {exp.payment_method}
                      </td>

                      <td className="p-3 font-mono font-black text-red-600 text-sm whitespace-nowrap">
                        -${exp.amount.toFixed(2)}
                      </td>

                      <td className="p-3">
                        {exp.status === 'PAID' ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[9px] font-black border border-green-300">
                            PAGA
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkExpensePaid(exp.id)}
                            className="px-2 py-0.5 bg-amber-100 hover:bg-green-100 text-amber-900 hover:text-green-900 text-[9px] font-black border border-amber-300 hover:border-green-400 transition"
                            title="Clique para marcar como paga"
                          >
                            PENDENTE (PAGAR)
                          </button>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditExpense(exp)}
                            className="p-1.5 border border-deep-black/20 hover:border-deep-black bg-white text-deep-black transition"
                            title="Editar lançamento"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id, exp.description)}
                            className="p-1.5 border border-deep-black/20 hover:border-red-600 hover:text-red-600 bg-white text-deep-black transition"
                            title="Excluir lançamento"
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
      </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: LANÇAR / EDITAR DESPESA
         ========================================================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border-2 border-deep-black w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-luxury my-8">
            <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  CONTROLE DE SAÍDAS
                </span>
                <h3 className="text-lg font-black uppercase tracking-wider text-deep-black">
                  {editingExpenseId ? 'EDITAR LANÇAMENTO DE DESPESA' : 'LANÇAR NOVA DESPESA / SAÍDA'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="p-1 hover:text-gold transition text-deep-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    DATA DO GASTO *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseFormData.date}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono font-bold focus:outline-none focus:border-deep-black bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    VALOR EM DÓLARES ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-mono font-bold text-deep-black">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-deep-black/30 text-xs font-mono font-black focus:outline-none focus:border-deep-black bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  DESCRIÇÃO DA DESPESA *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel Showroom Leominster, Conta de Luz, 500 Sacolas..."
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    CATEGORIA DO GASTO *
                  </label>
                  <select
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black bg-white"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    FORMA DE PAGAMENTO *
                  </label>
                  <select
                    value={expenseFormData.payment_method}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, payment_method: e.target.value as any })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black bg-white"
                  >
                    <option value="ZELLE">Zelle</option>
                    <option value="BANK">Conta Bancária EUA / Transferência</option>
                    <option value="CASH">Dinheiro em Espécie (Caixa)</option>
                    <option value="CARD">Cartão de Crédito</option>
                    <option value="VENMO">Venmo</option>
                    <option value="OTHER">Outro Meio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    STATUS DO PAGAMENTO *
                  </label>
                  <select
                    value={expenseFormData.status}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black bg-white"
                  >
                    <option value="PAID">✓ JÁ PAGO (DEDUZIR DO CAIXA)</option>
                    <option value="PENDING">⏱ PENDENTE (A PAGAR NO FUTURO)</option>
                  </select>
                </div>

                {expenseFormData.status === 'PENDING' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                      DATA DE VENCIMENTO *
                    </label>
                    <input
                      type="date"
                      value={expenseFormData.due_date}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono font-bold focus:outline-none focus:border-deep-black bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  OBSERVAÇÕES (OPCIONAL)
                </label>
                <input
                  type="text"
                  placeholder="Detalhes adicionais, fornecedor ou comprovante..."
                  value={expenseFormData.notes}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs focus:outline-none focus:border-deep-black bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-deep-black/10">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 border border-deep-black/30 hover:border-deep-black text-deep-black font-black uppercase tracking-wider text-xs transition"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-6 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black uppercase tracking-widest text-xs transition shadow"
                >
                  {savingExpense ? 'SALVANDO...' : editingExpenseId ? 'SALVAR ALTERAÇÕES' : 'LANÇAR DESPESA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: AJUSTAR SALDO INICIAL DE CAIXA
         ========================================================================= */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-2 border-deep-black w-full max-w-md p-6 space-y-5 shadow-luxury">
            <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
                  Fundo de Caixa / Saldo Inicial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBalanceModal(false)}
                className="text-deep-black hover:text-gold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInitialBalance} className="space-y-4 text-xs">
              <p className="text-[11px] text-deep-black/70 uppercase leading-relaxed">
                Defina o valor em dólares ($ USD) que você iniciou no caixa físico da loja ou na conta para troco/capital de giro.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  SALDO INICIAL ($ USD):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono font-bold text-deep-black">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={tempInitialBalance}
                    onChange={(e) => setTempInitialBalance(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono font-black border border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-deep-black/10">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="px-4 py-2 border border-deep-black/30 text-xs font-black uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition"
                >
                  Salvar Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
