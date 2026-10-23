'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  DollarSign,
  Truck,
  Package,
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Building,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Calculator,
  UserCheck,
  Receipt,
  Layers,
  HelpCircle,
  Eye,
  Printer,
  X,
  Archive,
  Download,
  ArrowRightLeft,
  Globe2,
  ShieldAlert,
  Search,
  Check,
  Edit3,
} from 'lucide-react';
import { ClothingPurchaseRecord, ClothingItemDetail, FinancesState } from '@/app/api/backoffice/finances/route';

interface ClothingPricingCalculatorProps {
  finances: FinancesState;
  onRefresh: () => Promise<void>;
  onShowFeedback?: (msg: string) => void;
}

export function ClothingPricingCalculator({
  finances,
  onRefresh,
  onShowFeedback,
}: ClothingPricingCalculatorProps) {
  // Modo de Exibição: Padrão 'archive' para que a usuária sempre veja todas as notas já registradas!
  const [activeTabMode, setActiveTabMode] = useState<'create' | 'archive'>('archive');
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newlyCreatedInvoiceId, setNewlyCreatedInvoiceId] = useState<string | null>(null);

  // Modal para Visualizar o Espelho da Nota Fiscal Individual
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState<ClothingPurchaseRecord | null>(null);

  // 1. Cabeçalho da Nota Fiscal / Romaneio
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [defaultCommissionPct, setDefaultCommissionPct] = useState<number>(15); // 15% padrão
  const [notes, setNotes] = useState<string>('');

  // 2. Moeda da Compra e Taxa de Câmbio
  const [purchaseCurrency, setPurchaseCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [exchangeRate, setExchangeRate] = useState<string>('5.50'); // 1 USD = R$ 5.50

  // 3. Frete da Nota Fiscal
  const [freightCurrency, setFreightCurrency] = useState<'USD' | 'BRL'>('USD');
  const [freightAmount, setFreightAmount] = useState<string>('0.00');

  // 4. Fornecedores e Produtos do Catálogo para Autocomplete
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // 5. Itens da Nota Fiscal
  // unitCost: valor na moeda da compra (ex: em R$ se purchaseCurrency === 'BRL')
  const [items, setItems] = useState<ClothingItemDetail[]>([
    {
      id: 'item-1',
      name: 'Conjunto Mirela Top + Legging Compressão',
      quantity: 20,
      unitCost: 99.0, // R$ 99,00
      totalCost: 1980.0,
      freightPerUnit: 3.0,
      totalCostPerUnit: 21.0,
      suggestedPrice: 49.9,
      commissionPct: 15,
      commissionAmount: 7.49,
      profitPerUnit: 21.41,
      marginPct: 42.9,
      totalItemProfit: 428.2,
    },
    {
      id: 'item-2',
      name: 'Blusa Poliamida Manga Longa Bailarina',
      quantity: 15,
      unitCost: 66.0, // R$ 66,00
      totalCost: 990.0,
      freightPerUnit: 3.0,
      totalCostPerUnit: 15.0,
      suggestedPrice: 34.9,
      commissionPct: 15,
      commissionAmount: 5.24,
      profitPerUnit: 14.66,
      marginPct: 42.0,
      totalItemProfit: 219.9,
    },
    {
      id: 'item-3',
      name: 'Macaquinho Beach Samanta Open Back',
      quantity: 15,
      unitCost: 88.0, // R$ 88,00
      totalCost: 1320.0,
      freightPerUnit: 3.0,
      totalCostPerUnit: 19.0,
      suggestedPrice: 44.9,
      commissionPct: 15,
      commissionAmount: 6.74,
      profitPerUnit: 19.16,
      marginPct: 42.7,
      totalItemProfit: 287.4,
    },
  ]);

  const [registerAsExpense, setRegisterAsExpense] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Carrega fornecedores e produtos do catálogo para autocomplete
  useEffect(() => {
    fetch('/api/backoffice/suppliers')
      .then((r) => r.json())
      .then((d) => {
        if (d.suppliers && Array.isArray(d.suppliers)) {
          setSuppliersList(d.suppliers);
          if (d.suppliers.length > 0 && supplier === 'Confecção / Fábrica') {
            setSupplier(d.suppliers[0].company_name);
          }
        }
      })
      .catch((err) => console.warn('Erro ao carregar fornecedores:', err));

    fetch('/api/backoffice/products')
      .then((r) => r.json())
      .then((d) => {
        if (d.products && Array.isArray(d.products)) {
          setCatalogProducts(d.products);
        }
      })
      .catch((err) => console.warn('Erro ao carregar produtos:', err));
  }, []);

  // Câmbio numérico seguro
  const rateNum = Math.max(0.01, parseFloat(exchangeRate) || 5.50);

  // Totais Automáticos da Nota Fiscal
  const totalPieces = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

  // Subtotal na Moeda Original da Compra (R$ ou $)
  const totalClothesOriginal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0),
    0
  );

  // Subtotal Convertido para Dólares ($ USD)
  const totalClothesUSD = purchaseCurrency === 'BRL'
    ? totalClothesOriginal / rateNum
    : totalClothesOriginal;

  // Frete Convertido para Dólares ($ USD)
  const rawFreightNum = Math.max(0, parseFloat(freightAmount) || 0);
  const freightUSD = freightCurrency === 'BRL'
    ? rawFreightNum / rateNum
    : rawFreightNum;

  // Total Geral da Nota em Dólares ($ USD)
  const totalInvoiceUSD = totalClothesUSD + freightUSD;

  // Rateio do Frete por Unidade em Dólares ($ USD)
  const freightPerUnitUSD = totalPieces > 0 ? freightUSD / totalPieces : 0;

  // Recalcula campos dinâmicos de cada item sempre que frete, itens ou câmbio mudarem
  const enrichedItems = items.map((it) => {
    const q = Math.max(1, Number(it.quantity) || 1);
    const uCostOriginal = Math.max(0, Number(it.unitCost) || 0);
    const lineTotalOriginal = q * uCostOriginal;

    // Custo de fábrica convertido para Dólares ($ USD)
    const uCostUSD = purchaseCurrency === 'BRL'
      ? uCostOriginal / rateNum
      : uCostOriginal;

    const lineTotalUSD = q * uCostUSD;

    // Custo real em dólar com a fatia do frete
    const realCostPerUnitUSD = uCostUSD + freightPerUnitUSD;

    // Preço de venda pretendido em dólar ($)
    const salePriceUSD = Number(it.suggestedPrice) > 0
      ? Number(it.suggestedPrice)
      : Math.ceil(realCostPerUnitUSD * 2) - 0.1;

    // Comissão da vendedora (padrão 15% ou personalizada da linha)
    const commPct = it.commissionPct !== undefined ? Number(it.commissionPct) : defaultCommissionPct;
    const commAmountUSD = salePriceUSD * (commPct / 100);

    // Lucro Líquido no Bolso por Peça em Dólar (Preço - Custo Real com Frete - Comissão Vendedora)
    const netProfitUnitUSD = salePriceUSD - realCostPerUnitUSD - commAmountUSD;

    // Margem Líquida % (Lucro Líquido / Preço de Venda)
    const netMarginPct = salePriceUSD > 0 ? (netProfitUnitUSD / salePriceUSD) * 100 : 0;

    // Lucro Total do Lote deste Item em Dólar
    const lineTotalProfitUSD = netProfitUnitUSD * q;

    return {
      ...it,
      quantity: q,
      unitCost: uCostUSD, // em USD
      unitCostOriginal: uCostOriginal, // na moeda original (ex: BRL)
      totalCost: lineTotalUSD, // em USD
      totalCostOriginal: lineTotalOriginal, // na moeda original
      freightPerUnit: freightPerUnitUSD,
      totalCostPerUnit: realCostPerUnitUSD,
      suggestedPrice: salePriceUSD,
      commissionPct: commPct,
      commissionAmount: commAmountUSD,
      profitPerUnit: netProfitUnitUSD,
      marginPct: netMarginPct,
      totalItemProfit: lineTotalProfitUSD,
    };
  });

  // Totais Gerais Consolidados da Nota em Dólares ($ USD)
  const totalProjectedRevenueUSD = enrichedItems.reduce(
    (acc, it) => acc + it.suggestedPrice * it.quantity,
    0
  );
  const totalProjectedCommissionsUSD = enrichedItems.reduce(
    (acc, it) => acc + (it.commissionAmount || 0) * it.quantity,
    0
  );
  const totalProjectedNetProfitUSD = enrichedItems.reduce(
    (acc, it) => acc + (it.totalItemProfit || 0),
    0
  );
  const averageNetMarginPct =
    totalProjectedRevenueUSD > 0 ? (totalProjectedNetProfitUSD / totalProjectedRevenueUSD) * 100 : 0;

  // Peças necessárias para amortizar 100% do frete da remessa
  const avgProfitPerPieceUSD = totalPieces > 0 ? totalProjectedNetProfitUSD / totalPieces : 0;
  const piecesToBreakEvenFreight =
    avgProfitPerPieceUSD > 0 ? Math.ceil(freightUSD / avgProfitPerPieceUSD) : 0;

  // Manipulação de Linhas de Itens
  const handleAddItem = () => {
    const defaultCost = purchaseCurrency === 'BRL' ? 110.0 : 20.0;
    const newItem: ClothingItemDetail = {
      id: `item-${Date.now()}`,
      name: '',
      quantity: 10,
      unitCost: defaultCost,
      totalCost: defaultCost * 10,
      freightPerUnit: freightPerUnitUSD,
      totalCostPerUnit: (defaultCost / (purchaseCurrency === 'BRL' ? rateNum : 1)) + freightPerUnitUSD,
      suggestedPrice: 49.9,
      commissionPct: defaultCommissionPct,
      commissionAmount: 49.9 * (defaultCommissionPct / 100),
      profitPerUnit: 20.0,
      marginPct: 40.0,
      totalItemProfit: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('A nota fiscal deve conter pelo menos 1 item.');
      return;
    }
    setItems(items.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (
    id: string,
    field: 'name' | 'quantity' | 'unitCost' | 'suggestedPrice' | 'commissionPct',
    val: any
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return { ...it, [field]: val };
        }
        return it;
      })
    );
  };

  // Alternar Moeda da Compra (com conversão aproximada para conveniência)
  const handleToggleCurrency = (newCurr: 'BRL' | 'USD') => {
    if (newCurr === purchaseCurrency) return;
    setPurchaseCurrency(newCurr);
    // Ajusta custos unitários aproximados para que o usuário não se assuste
    setItems((prev) =>
      prev.map((it) => {
        let newUnitCost = it.unitCost;
        if (newCurr === 'BRL') {
          newUnitCost = Math.round(it.unitCost * rateNum);
        } else {
          newUnitCost = Math.round((it.unitCost / rateNum) * 100) / 100;
        }
        return {
          ...it,
          unitCost: newUnitCost,
        };
      })
    );
  };

  // Aplica comissão padrão do cabeçalho a todas as linhas
  const handleApplyCommissionToAll = (newPct: number) => {
    setDefaultCommissionPct(newPct);
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        commissionPct: newPct,
      }))
    );
  };

  const clothingPurchases = finances.clothingPurchases || [];

  // Verificação de duplicidade de nota em tempo real
  const duplicateInvoice = useMemo(() => {
    if (!invoiceNumber || !invoiceNumber.trim() || invoiceNumber.trim().length < 2) return null;
    return clothingPurchases.find(
      (p) =>
        p.id !== editingPurchaseId &&
        (p.invoiceNumber || '').trim().toLowerCase() === invoiceNumber.trim().toLowerCase()
    );
  }, [clothingPurchases, invoiceNumber, editingPurchaseId]);

  // Totais consolidados do histórico de notas
  const totalPiecesAll = clothingPurchases.reduce((acc, p) => acc + (Number(p.totalPieces) || 0), 0);
  const totalPaidAll = clothingPurchases.reduce((acc, p) => acc + (Number(p.totalPaid) || 0), 0);
  const totalProfitAll = clothingPurchases.reduce((acc, p) => acc + (Number(p.totalProjectedProfit) || 0), 0);

  // Lista filtrada por busca
  const filteredPurchasesList = clothingPurchases.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchNum = (p.invoiceNumber || '').toLowerCase().includes(q);
    const matchSup = (p.supplier || '').toLowerCase().includes(q);
    const matchDate = (p.date || '').toLowerCase().includes(q);
    return matchNum || matchSup || matchDate;
  });

  // Salvar Nota Fiscal no Backend
  const handleSaveInvoice = async () => {
    if (!invoiceNumber.trim()) {
      alert('Por favor, informe o número da Nota Fiscal / Romaneio.');
      return;
    }
    if (!supplier.trim()) {
      alert('Por favor, informe o Fornecedor ou Confecção da mercadoria.');
      return;
    }
    if (items.length === 0 || totalPieces <= 0) {
      alert('Adicione pelo menos um item com quantidade válida na nota fiscal.');
      return;
    }

    // Alerta de duplicidade se a nota já foi lançada antes
    if (duplicateInvoice && !editingPurchaseId) {
      const confirmDup = confirm(
        `⚠️ ATENÇÃO: A nota fiscal "${duplicateInvoice.invoiceNumber}" já consta cadastrada no sistema!\n\n` +
        `• Data: ${duplicateInvoice.date}\n` +
        `• Fornecedor: ${duplicateInvoice.supplier}\n` +
        `• Total: $${duplicateInvoice.totalPaid.toFixed(2)} USD (${duplicateInvoice.totalPieces} peças)\n\n` +
        `Deseja realmente cadastrar outra nota com este mesmo número?`
      );
      if (!confirmDup) return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/backoffice/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_clothing_purchase',
          purchase: {
            id: editingPurchaseId || undefined,
            invoiceNumber: invoiceNumber.trim(),
            currency: purchaseCurrency,
            exchangeRate: rateNum,
            clothesAmountOriginal: totalClothesOriginal,
            date: purchaseDate,
            supplier: supplier.trim(),
            totalPieces,
            clothesAmount: totalClothesUSD,
            freightAmount: freightUSD,
            defaultCommissionPct,
            totalCommissionsProjected: totalProjectedCommissionsUSD,
            markupMultiplier: totalClothesUSD > 0 ? totalProjectedRevenueUSD / totalInvoiceUSD : 2.0,
            suggestedSalePrice: totalPieces > 0 ? totalProjectedRevenueUSD / totalPieces : 49.9,
            profitPerPiece: avgProfitPerPieceUSD,
            totalProjectedProfit: totalProjectedNetProfitUSD,
            notes: notes
              ? `Nota: ${invoiceNumber} • Câmbio: R$ ${rateNum.toFixed(2)} • ${notes}`
              : `Nota Fiscal: ${invoiceNumber} (${purchaseCurrency === 'BRL' ? `R$ ${totalClothesOriginal.toFixed(2)} conv. @ ${rateNum.toFixed(2)}` : '$ USD'})`,
            register_as_expense: registerAsExpense,
            items: enrichedItems,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        const savedNumber = invoiceNumber.trim();
        const savedSupplier = supplier.trim();
        const savedId = editingPurchaseId || data.finances?.clothingPurchases?.[0]?.id;

        await onRefresh();

        // 1. Fecha o formulário e muda para a lista de notas registradas (ela NÃO precisa ficar aberta!)
        setActiveTabMode('archive');
        setEditingPurchaseId(null);

        // 2. Destaca visualmente a nota recém-criada no topo da lista
        if (savedId) {
          setNewlyCreatedInvoiceId(savedId);
          setTimeout(() => setNewlyCreatedInvoiceId(null), 12000);
        }

        const msg = `✓ Nota Fiscal "${savedNumber}" (${savedSupplier}) gravada com sucesso! Lançada no financeiro da loja como gasto com mercadoria.`;
        setSuccessBanner(msg);
        if (onShowFeedback) {
          onShowFeedback(`Nota fiscal ${savedNumber} registrada e lançada no financeiro!`);
        }
        setTimeout(() => setSuccessBanner(null), 9000);
      } else {
        alert(data.error || 'Erro ao salvar nota fiscal.');
      }
    } catch (e: any) {
      alert('Erro na requisição: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Carregar Nota do Histórico na Tela para Edição
  const handleLoadPurchaseToInvoice = (p: ClothingPurchaseRecord) => {
    setEditingPurchaseId(p.id);
    setInvoiceNumber(p.invoiceNumber || `NF-${p.id.substring(6, 12)}`);
    setSupplier(p.supplier || '');
    setPurchaseDate(p.date || new Date().toISOString().split('T')[0]);
    setFreightAmount(String(p.freightAmount || 0));
    setFreightCurrency('USD');
    setPurchaseCurrency(p.currency || 'USD');
    setExchangeRate(String(p.exchangeRate || 5.50));
    setDefaultCommissionPct(p.defaultCommissionPct || 15);
    if (p.notes) setNotes(p.notes);

    if (p.items && p.items.length > 0) {
      setItems(
        p.items.map((it, idx) => ({
          id: it.id || `item-hist-${idx}`,
          name: it.name || `Item ${idx + 1}`,
          quantity: it.quantity || 1,
          unitCost: it.unitCostOriginal || it.unitCost || 0,
          totalCost: (it.quantity || 1) * (it.unitCostOriginal || it.unitCost || 0),
          freightPerUnit: it.freightPerUnit || 0,
          totalCostPerUnit: it.totalCostPerUnit || it.unitCost,
          suggestedPrice: it.suggestedPrice || 49.9,
          commissionPct: it.commissionPct ?? p.defaultCommissionPct ?? 15,
          commissionAmount: it.commissionAmount || 0,
          profitPerUnit: it.profitPerUnit || 0,
          marginPct: it.marginPct || 0,
          totalItemProfit: it.totalItemProfit || 0,
        }))
      );
    }
    setActiveTabMode('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm('Deseja excluir esta nota fiscal do histórico de compras e do financeiro?')) return;
    try {
      const res = await fetch('/api/backoffice/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_clothing_purchase',
          purchase_id: purchaseId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await onRefresh();
        if (selectedInvoiceModal?.id === purchaseId) {
          setSelectedInvoiceModal(null);
        }
        if (onShowFeedback) onShowFeedback('Nota fiscal excluída do histórico.');
      }
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  // Limpar para Nova Nota (Começa em branco e sem mock fixo)
  const handleResetNewInvoice = () => {
    setEditingPurchaseId(null);
    setInvoiceNumber('');
    setSupplier(suppliersList[0]?.company_name || '');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaseCurrency('BRL');
    setExchangeRate('5.50');
    setFreightCurrency('USD');
    setFreightAmount('0.00');
    setDefaultCommissionPct(15);
    setNotes('');
    setItems([
      {
        id: `item-${Date.now()}`,
        name: '',
        quantity: 10,
        unitCost: 110.0,
        totalCost: 1100.0,
        freightPerUnit: 0,
        totalCostPerUnit: 20.0,
        suggestedPrice: 49.9,
        commissionPct: 15,
        commissionAmount: 7.49,
        profitPerUnit: 22.41,
        marginPct: 44.9,
        totalItemProfit: 224.1,
      },
    ]);
    setActiveTabMode('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Oficial: Entrada de Nota Fiscal */}
      <div className="bg-gradient-to-r from-deep-black via-zinc-950 to-deep-black text-white border-2 border-gold p-6 sm:p-8 space-y-4 shadow-luxury">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold text-deep-black font-black text-[10px] uppercase tracking-widest shadow">
              <Receipt className="w-3.5 h-3.5" />
              <span>ENTRADA DE MERCADORIA • NOTA FISCAL MULTIMOEDA</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
              NOTA FISCAL DE COMPRA (REAIS OU DÓLAR)
            </h2>
            <p className="text-xs uppercase tracking-wider text-white/70 max-w-3xl">
              Lance suas compras de confecção feitas no Brasil (em R$) ou nos Estados Unidos (em $). Informe a taxa de câmbio do dia, veja o valor convertido automaticamente por peça, adicione o frete e calcule o preço de venda com a dedução da comissão da vendedora (15%).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetNewInvoice}
              className="px-4 py-2 bg-white/10 hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition border border-white/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Nota</span>
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="p-2.5 bg-white/10 hover:bg-gold hover:text-deep-black text-white transition border border-white/20"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SELETOR PRINCIPAL DE MODO: LANÇAR NOTA vs ARQUIVO DE NOTAS */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTabMode('create')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest transition flex items-center gap-2 ${
              activeTabMode === 'create'
                ? 'bg-gold text-deep-black shadow'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>LANÇAR NOTA FISCAL (ENTRADA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('archive')}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest transition flex items-center gap-2 ${
              activeTabMode === 'archive'
                ? 'bg-gold text-deep-black shadow'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>ARQUIVO DE NOTAS FISCAIS REGISTRADAS ({clothingPurchases.length})</span>
          </button>
        </div>

        {/* Banner de Sucesso */}
        {successBanner && (
          <div className="p-4 bg-emerald-950 text-emerald-100 border-2 border-emerald-500 text-xs font-black uppercase tracking-wider flex items-center justify-between animate-fadeIn shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-white">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* SEÇÃO 1: FORMULÁRIO ESTILO NOTA FISCAL (SELECIONADO: 'create') */}
      {activeTabMode === 'create' && (
        <div className="bg-white border-2 border-deep-black shadow-sm divide-y-2 divide-deep-black animate-fadeIn">
          {/* BARRA SUPERIOR DE NAVEGAÇÃO & STATUS DE EDIÇÃO */}
          <div className="p-4 bg-stone-100 border-b-2 border-deep-black flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveTabMode('archive')}
              className="px-3.5 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow"
            >
              <span>← Voltar para Arquivo de Notas</span>
            </button>

            {editingPurchaseId ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-500 text-deep-black font-black text-xs uppercase tracking-wider">
                  ✏️ Editando Nota Salva: {invoiceNumber || editingPurchaseId}
                </span>
                <button
                  type="button"
                  onClick={handleResetNewInvoice}
                  className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-deep-black font-bold text-xs uppercase transition"
                >
                  Cancelar Edição
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold uppercase text-deep-black/60">
                Preencha os dados abaixo para dar entrada em uma nova remessa de mercadoria.
              </span>
            )}
          </div>

          {/* BANNER DE ALERTA DE NOTA FISCAL DUPLICADA (PREVENÇÃO DE ENTRADA DUPLA) */}
          {duplicateInvoice && !editingPurchaseId && (
            <div className="p-4 bg-amber-500/15 border-b-2 border-amber-600 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-xs uppercase tracking-wider text-amber-900">
                    ⚠️ ATENÇÃO: ESTA NOTA FISCAL JÁ FOI DADA ENTRADA NO SISTEMA!
                  </div>
                  <div className="text-xs text-amber-950/90 mt-0.5">
                    A nota <strong>"{duplicateInvoice.invoiceNumber}"</strong> já consta cadastrada com o fornecedor <strong>{duplicateInvoice.supplier}</strong> em <strong>{duplicateInvoice.date}</strong> no valor de <strong>${duplicateInvoice.totalPaid.toFixed(2)} USD ({duplicateInvoice.totalPieces} peças)</strong>.
                  </div>
                  <div className="text-[11px] text-amber-800 font-bold mt-1">
                    Você não precisa cadastrá-la novamente. Clique no botão ao lado para consultar o espelho da nota já salva.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceModal(duplicateInvoice)}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Nota Já Cadastrada</span>
                </button>
              </div>
            </div>
          )}

          {/* CABEÇALHO DA NOTA (Moeda, Câmbio, Fornecedor, Data, Nº NF, Comissão) */}
          <div className="p-6 bg-stone-50 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-deep-black/10 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                <Building className="w-4 h-4 text-gold" />
                <span>CABEÇALHO DA NOTA & SELEÇÃO DE MOEDA (R$ OU $)</span>
              </h3>

              {/* SELETOR DE MOEDA DA COMPRA (REAIS OU DÓLARES) */}
              <div className="flex items-center gap-1 bg-stone-200 p-1 border border-deep-black/20">
                <button
                  type="button"
                  onClick={() => handleToggleCurrency('BRL')}
                  className={`px-3 py-1 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                    purchaseCurrency === 'BRL'
                      ? 'bg-green-700 text-white shadow'
                      : 'text-deep-black/70 hover:text-deep-black'
                  }`}
                >
                  <span>🇧🇷 COMPRA EM REAIS (R$)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleCurrency('USD')}
                  className={`px-3 py-1 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                    purchaseCurrency === 'USD'
                      ? 'bg-deep-black text-gold shadow'
                      : 'text-deep-black/70 hover:text-deep-black'
                  }`}
                >
                  <span>🇺🇸 COMPRA EM DÓLAR ($)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Fornecedor / Confecção */}
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                  <span>FORNECEDOR / CONFECÇÃO:</span>
                  {suppliersList.length > 0 && (
                    <span className="text-[9px] text-gold font-bold">{suppliersList.length} cadastrados</span>
                  )}
                </label>
                <input
                  type="text"
                  list="suppliers-datalist"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Ex: Confecção Delux / São Paulo"
                  className="w-full px-3 py-2 text-xs font-bold border-2 border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
                />
                <datalist id="suppliers-datalist">
                  {suppliersList.map((s: any) => (
                    <option key={s.id} value={s.company_name} />
                  ))}
                </datalist>
              </div>

              {/* Número da Nota Fiscal */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                  <span>Nº DA NOTA / INVOICE:</span>
                  {duplicateInvoice && !editingPurchaseId && (
                    <span className="text-[9px] text-amber-700 font-black uppercase">⚠️ Já Cadastrada</span>
                  )}
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex: NF-1042 ou Pedido #88"
                  className={`w-full px-3 py-2 text-xs font-mono font-bold border-2 focus:outline-none bg-white ${
                    duplicateInvoice && !editingPurchaseId
                      ? 'border-amber-600 bg-amber-50 text-amber-950 focus:border-amber-700'
                      : 'border-deep-black/30 focus:border-deep-black'
                  }`}
                />
                {duplicateInvoice && !editingPurchaseId && (
                  <p className="text-[10px] text-amber-800 font-bold leading-tight">
                    Esta nota já existe no histórico.
                  </p>
                )}
              </div>

              {/* Data da Compra */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                  DATA DA COMPRA / EMISSÃO:
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border-2 border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
                />
              </div>

              {/* Taxa de Câmbio do Dia (Apenas quando compra em BRL) */}
              {purchaseCurrency === 'BRL' ? (
                <div className="space-y-1.5 bg-green-50 p-2.5 border-2 border-green-600 animate-fadeIn">
                  <label className="text-[10px] font-black uppercase tracking-wider text-green-950 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-green-700" />
                      CÂMBIO DO DIA:
                    </span>
                    <span className="text-green-800 font-mono font-black">$1 = R$ {rateNum.toFixed(2)}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 font-mono text-green-800 font-bold text-xs">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      placeholder="5.50"
                      className="w-full pl-8 pr-2 py-1 text-xs font-mono font-black border border-green-700 bg-white text-green-900 focus:outline-none"
                    />
                  </div>
                  <span className="text-[9px] text-green-900 block font-medium leading-tight">
                    Digite a cotação que você pagou na transferência/banco.
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 bg-stone-100 p-2.5 border border-deep-black/20 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                    MOEDA DA NOTA:
                  </span>
                  <div className="font-mono font-black text-sm text-deep-black">
                    Dólar Americano ($ USD)
                  </div>
                  <span className="text-[9px] text-deep-black/60 block uppercase">
                    Sem conversão cambial.
                  </span>
                </div>
              )}

              {/* Comissão Padrão da Vendedora */}
              <div className="space-y-1.5 bg-gold/10 p-2.5 border border-gold/40">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-gold" />
                    COMISSÃO VENDEDORA (%):
                  </span>
                  <span className="text-gold font-mono font-black">{defaultCommissionPct}%</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultCommissionPct}
                    onChange={(e) => handleApplyCommissionToAll(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 text-xs font-mono font-black border border-deep-black bg-white"
                  />
                  <span className="text-xs font-black font-mono">%</span>
                </div>
                <span className="text-[9px] text-deep-black/70 block uppercase leading-tight">
                  Padrão 15% (editável linha por linha).
                </span>
              </div>
            </div>
          </div>

          {/* CORPO DA NOTA: TABELA DE ITENS (VALOR ORIGINAL + VALOR CONVERTIDO) */}
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />
                  <span>
                    ITENS DA NOTA FISCAL {purchaseCurrency === 'BRL' ? '(VALORES EM REAIS R$ & CONVERTIDOS EM DÓLAR $)' : '(VALORES EM DÓLAR $)'}
                  </span>
                </h3>
                <p className="text-[10px] text-deep-black/60 uppercase mt-0.5">
                  {purchaseCurrency === 'BRL'
                    ? `Digite o valor em Reais (R$). O sistema converte automaticamente para Dólares ($ USD) usando a taxa de R$ ${rateNum.toFixed(2)}.`
                    : 'Digite a quantidade e o valor unitário em Dólares ($ USD).'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4 text-gold" />
                <span>+ Adicionar Item à Nota</span>
              </button>
            </div>

            <datalist id="catalog-products-datalist">
              {catalogProducts.map((p: any) => (
                <option key={p.id} value={p.title} />
              ))}
            </datalist>

            {/* Tabela de Linhas da Nota */}
            <div className="overflow-x-auto border-2 border-deep-black">
              <table className="w-full text-left text-xs uppercase tracking-wider">
                <thead className="bg-deep-black text-white text-[10px] font-black">
                  <tr>
                    <th className="p-3 w-8 text-center">#</th>
                    <th className="p-3">DESCRIÇÃO DO ITEM / MODELO</th>
                    <th className="p-3 w-28 text-center">QUANTIDADE</th>
                    <th className="p-3 w-36">
                      {purchaseCurrency === 'BRL' ? 'UNITÁRIO (R$)' : 'UNITÁRIO ($)'}
                    </th>
                    {purchaseCurrency === 'BRL' && (
                      <th className="p-3 w-36 bg-green-950 text-emerald-300">
                        CONVERTIDO ($ USD)
                      </th>
                    )}
                    <th className="p-3 w-40">
                      {purchaseCurrency === 'BRL' ? 'SUBTOTAL (R$ & $)' : 'SUBTOTAL ($)'}
                    </th>
                    <th className="p-3 w-12 text-center">REMOVER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-deep-black/10">
                  {items.map((it, idx) => {
                    const q = Number(it.quantity) || 0;
                    const uCost = Number(it.unitCost) || 0;
                    const lineTotalOriginal = q * uCost;
                    const uCostUSD = purchaseCurrency === 'BRL' ? uCost / rateNum : uCost;
                    const lineTotalUSD = q * uCostUSD;

                    return (
                      <tr key={it.id} className="hover:bg-amber-50/40 transition">
                        <td className="p-3 text-center font-bold text-deep-black/50 font-mono">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            list="catalog-products-datalist"
                            value={it.name}
                            onChange={(e) => handleUpdateItem(it.id, 'name', e.target.value)}
                            placeholder="Ex: Conjunto Mirela Top + Legging ou Blusa Bailarina"
                            className="w-full px-3 py-1.5 text-xs font-bold border border-deep-black/20 focus:outline-none focus:border-deep-black bg-white"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={it.quantity}
                            onChange={(e) => handleUpdateItem(it.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs font-mono font-black border border-deep-black/20 text-center bg-white"
                          />
                        </td>
                        <td className="p-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 font-mono text-deep-black/40">
                              {purchaseCurrency === 'BRL' ? 'R$' : '$'}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.unitCost}
                              onChange={(e) => handleUpdateItem(it.id, 'unitCost', parseFloat(e.target.value) || 0)}
                              className="w-full pl-8 pr-2 py-1.5 text-xs font-mono font-black border border-deep-black/20 text-deep-black bg-white"
                            />
                          </div>
                        </td>

                        {/* Coluna de Custo Convertido em Dólar (Quando em BRL) */}
                        {purchaseCurrency === 'BRL' && (
                          <td className="p-3 font-mono font-black text-xs text-emerald-700 bg-emerald-50/50">
                            ${uCostUSD.toFixed(2)} USD
                            <span className="text-[9px] text-deep-black/50 block font-normal">
                              (@ R$ {rateNum.toFixed(2)})
                            </span>
                          </td>
                        )}

                        <td className="p-3 font-mono font-black text-xs text-deep-black">
                          {purchaseCurrency === 'BRL' ? (
                            <div>
                              <span>R$ {lineTotalOriginal.toFixed(2)}</span>
                              <span className="text-[10px] text-emerald-700 block font-normal">
                                (${lineTotalUSD.toFixed(2)} USD)
                              </span>
                            </div>
                          ) : (
                            <span>${lineTotalOriginal.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 transition hover:bg-red-50 rounded"
                            title="Remover este item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RODAPÉ DA NOTA (SOMAS, FRETE E RATEIO) */}
          <div className="p-6 bg-stone-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Subtotal das Roupas (Original e Convertido) */}
              <div className="p-4 bg-white border-2 border-deep-black/20 space-y-1">
                <span className="text-[10px] text-deep-black/60 font-black uppercase block">
                  1. SUBTOTAL DAS ROUPAS:
                </span>
                {purchaseCurrency === 'BRL' ? (
                  <div>
                    <div className="text-lg font-mono font-black text-deep-black">
                      R$ {totalClothesOriginal.toFixed(2)}
                    </div>
                    <div className="text-base font-mono font-black text-emerald-700">
                      (${totalClothesUSD.toFixed(2)} USD)
                    </div>
                  </div>
                ) : (
                  <div className="text-xl font-mono font-black text-green-700">
                    ${totalClothesUSD.toFixed(2)}
                  </div>
                )}
                <span className="text-[10px] font-mono text-deep-black/60 block">
                  Total: <strong>{totalPieces} peças</strong>
                </span>
              </div>

              {/* Valor do Frete com Moeda */}
              <div className="p-4 bg-sky-50 border-2 border-sky-400 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-sky-950 font-black uppercase">
                    2. VALOR DO FRETE:
                  </label>
                  <div className="flex items-center gap-1 text-[9px] font-bold">
                    <button
                      type="button"
                      onClick={() => setFreightCurrency('USD')}
                      className={`px-1.5 py-0.5 ${freightCurrency === 'USD' ? 'bg-sky-700 text-white' : 'text-sky-900'}`}
                    >
                      $ USD
                    </button>
                    <button
                      type="button"
                      onClick={() => setFreightCurrency('BRL')}
                      className={`px-1.5 py-0.5 ${freightCurrency === 'BRL' ? 'bg-sky-700 text-white' : 'text-sky-900'}`}
                    >
                      R$ BRL
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 font-mono text-sky-700 font-bold">
                    {freightCurrency === 'BRL' ? 'R$' : '$'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-2 py-1.5 text-lg font-mono font-black border-2 border-sky-500 bg-white text-sky-900 focus:outline-none"
                  />
                </div>
                <div className="text-[10px] text-sky-800 font-mono font-bold leading-tight">
                  Frete em Dólar: <strong>${freightUSD.toFixed(2)}</strong> (+${freightPerUnitUSD.toFixed(2)} / peça)
                </div>
              </div>

              {/* Total Geral Pago na Nota (em USD) */}
              <div className="p-4 bg-white border-2 border-deep-black space-y-1">
                <span className="text-[10px] text-deep-black/60 font-black uppercase block">
                  3. TOTAL GERAL PAGO (USD):
                </span>
                <div className="text-xl font-mono font-black text-deep-black">
                  ${totalInvoiceUSD.toFixed(2)}
                </div>
                <span className="text-[10px] text-deep-black/60 font-mono block">
                  {purchaseCurrency === 'BRL'
                    ? `(R$ ${totalClothesOriginal.toFixed(2)} @ ${rateNum.toFixed(2)} + frete)`
                    : '(Roupas + Frete em Dólar)'}
                </span>
              </div>

              {/* Custo Médio Real em Dólar por Peça */}
              <div className="p-4 bg-white border-2 border-gold space-y-1">
                <span className="text-[10px] text-deep-black/60 font-black uppercase block">
                  4. CUSTO MÉDIO REAL / PEÇA:
                </span>
                <div className="text-xl font-mono font-black text-gold">
                  ${(totalPieces > 0 ? totalInvoiceUSD / totalPieces : 0).toFixed(2)} USD
                </div>
                <span className="text-[10px] text-deep-black/70 font-mono block font-bold">
                  (Custo convertido + frete rateado)
                </span>
              </div>
            </div>
          </div>

          {/* 3. TABELA DE FORMAÇÃO DE PREÇO, COMISSÃO (15%) E MARGEM REAL EM DÓLARES */}
          <div className="p-6 space-y-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-deep-black/10 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-deep-black text-gold font-black text-[9px] uppercase tracking-widest mb-1">
                  <Sparkles className="w-3 h-3 text-gold" />
                  <span>PREÇO DE VENDA NOS EUA & LUCRO LÍQUIDO NO BOLSO</span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
                  PRECIFICAÇÃO EM DÓLAR, COMISSÃO DAS VENDEDORAS E MARGEM REAL
                </h3>
                <p className="text-[10px] text-deep-black/60 uppercase mt-0.5">
                  O custo de fábrica já está convertido em Dólar ($). Digite o preço de venda que você vai cobrar nos EUA. O sistema deduz a comissão da vendedora e calcula a margem líquida limpa.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border-2 border-deep-black">
              <table className="w-full text-left text-xs uppercase tracking-wider">
                <thead className="bg-zinc-900 text-white text-[10px] font-black">
                  <tr>
                    <th className="p-3">ITEM</th>
                    <th className="p-3 text-center">QTD</th>
                    <th className="p-3">
                      {purchaseCurrency === 'BRL' ? 'CUSTO R$ & $' : 'CUSTO FÁBRICA'}
                    </th>
                    <th className="p-3">FRETE RATEADO</th>
                    <th className="p-3 bg-zinc-800 text-gold">CUSTO REAL / UN</th>
                    <th className="p-3 w-36">PREÇO VENDA ($)</th>
                    <th className="p-3 w-36">COMISSÃO VENDEDORA</th>
                    <th className="p-3 bg-emerald-950 text-emerald-300">LUCRO NO BOLSO ($)</th>
                    <th className="p-3 bg-emerald-950 text-emerald-300">MARGEM (%)</th>
                    <th className="p-3 text-right">LUCRO TOTAL ITEM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-deep-black/10 font-mono">
                  {enrichedItems.map((it) => (
                    <tr key={it.id} className="hover:bg-stone-50 transition">
                      <td className="p-3 font-sans font-bold text-deep-black">
                        {it.name || 'Sem nome'}
                      </td>
                      <td className="p-3 text-center font-bold text-deep-black">
                        {it.quantity} un
                      </td>
                      <td className="p-3 text-deep-black/80">
                        {purchaseCurrency === 'BRL' ? (
                          <div>
                            <span className="font-bold text-emerald-700">${it.unitCost.toFixed(2)} USD</span>
                            <span className="text-[10px] text-deep-black/50 block font-normal">
                              (R$ {(it.unitCostOriginal || 0).toFixed(2)})
                            </span>
                          </div>
                        ) : (
                          <span>${it.unitCost.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-3 text-sky-700 font-bold">
                        +${it.freightPerUnit.toFixed(2)}
                      </td>
                      <td className="p-3 font-black text-deep-black bg-stone-100">
                        ${it.totalCostPerUnit.toFixed(2)}
                      </td>
                      <td className="p-3 font-sans">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 font-mono text-deep-black/40">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.suggestedPrice}
                            onChange={(e) =>
                              handleUpdateItem(it.id, 'suggestedPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-black border-2 border-deep-black bg-white focus:border-gold focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="p-3 font-sans">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={it.commissionPct}
                            onChange={(e) =>
                              handleUpdateItem(it.id, 'commissionPct', parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-1.5 py-1 text-xs font-mono font-black border border-deep-black/30 bg-white"
                          />
                          <span className="text-[10px] font-black font-mono">%</span>
                          <span className="text-[11px] font-mono font-bold text-deep-black/60 truncate">
                            (${(it.commissionAmount || 0).toFixed(2)})
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-black text-xs text-emerald-700 bg-emerald-50/50">
                        +${it.profitPerUnit.toFixed(2)} / un
                      </td>
                      <td className="p-3 font-black text-xs text-emerald-800 bg-emerald-50/50">
                        {(it.marginPct || 0).toFixed(1)}%
                      </td>
                      <td className="p-3 text-right font-black text-xs text-emerald-700">
                        +${(it.totalItemProfit || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. CARDS DE RESUMO EXECUTIVO DO LOTE */}
          <div className="p-6 bg-deep-black text-white space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-black uppercase tracking-widest text-gold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                <span>RESULTADO FINANCEIRO CONSOLIDADO DA NOTA FISCAL</span>
              </span>
              <span className="text-[10px] text-white/60 font-mono">
                {totalPieces} peças no total {purchaseCurrency === 'BRL' && `• Câmbio R$ ${rateNum.toFixed(2)}`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Total Investido */}
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[9px] text-white/60 uppercase block">INVESTIMENTO TOTAL</span>
                <div className="text-base sm:text-lg font-mono font-black text-white">
                  ${totalInvoiceUSD.toFixed(2)}
                </div>
                <span className="text-[9px] text-white/40 uppercase block">
                  {purchaseCurrency === 'BRL' ? `R$ ${totalClothesOriginal.toFixed(2)} + Frete` : 'Roupas + Frete'}
                </span>
              </div>

              {/* Faturamento Bruto */}
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[9px] text-white/60 uppercase block">FATURAMENTO BRUTO</span>
                <div className="text-base sm:text-lg font-mono font-black text-white">
                  ${totalProjectedRevenueUSD.toFixed(2)}
                </div>
                <span className="text-[9px] text-white/40 uppercase block">100% Vendido ($ USD)</span>
              </div>

              {/* Total Comissões */}
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[9px] text-gold uppercase block">COMISSÕES VENDEDORAS</span>
                <div className="text-base sm:text-lg font-mono font-black text-gold">
                  ${totalProjectedCommissionsUSD.toFixed(2)}
                </div>
                <span className="text-[9px] text-white/40 uppercase block">Total a Pagar</span>
              </div>

              {/* Lucro Líquido Limpo */}
              <div className="p-3 bg-emerald-950/80 border-2 border-emerald-500 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] text-emerald-300 font-black uppercase block">
                  LUCRO LÍQUIDO NO BOLSO
                </span>
                <div className="text-lg sm:text-xl font-mono font-black text-emerald-400">
                  +${totalProjectedNetProfitUSD.toFixed(2)}
                </div>
                <span className="text-[9px] text-emerald-200 uppercase block font-bold">
                  Livre de Roupas, Frete e Comissão
                </span>
              </div>

              {/* Margem Média Líquida */}
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[9px] text-white/60 uppercase block">MARGEM MÉDIA LÍQUIDA</span>
                <div className="text-base sm:text-lg font-mono font-black text-emerald-400">
                  {averageNetMarginPct.toFixed(1)}%
                </div>
                <span className="text-[9px] text-white/40 uppercase block">Sobre a Venda Total</span>
              </div>
            </div>

            <div className="p-3 bg-sky-950/40 border border-sky-500/40 text-sky-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                🚚 <strong>Amortização de Frete:</strong> Vendendo apenas{' '}
                <strong>{piecesToBreakEvenFreight} peças</strong> deste lote, você já cobre 100% do frete de $
                {freightUSD.toFixed(2)}! As outras{' '}
                <strong>{Math.max(0, totalPieces - piecesToBreakEvenFreight)} peças</strong> são lucro livre.
              </div>
            </div>

            {/* Botão de Salvar e Checkbox */}
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs uppercase text-white/80">
                <input
                  type="checkbox"
                  checked={registerAsExpense}
                  onChange={(e) => setRegisterAsExpense(e.target.checked)}
                  className="accent-gold w-4 h-4"
                />
                <span>
                  Lançar despesa de Roupas (${totalClothesUSD.toFixed(2)}) e Frete ($
                  {freightUSD.toFixed(2)}) no Fluxo de Caixa / DRE
                </span>
              </label>

              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={saving}
                className="px-8 py-3.5 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>GRAVANDO NOTA FISCAL...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SALVAR ENTRADA DE NOTA FISCAL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 2: ARQUIVO DE NOTAS FISCAIS REGISTRADAS (SELECIONADO: 'archive') */}
      {activeTabMode === 'archive' && (
        <div className="space-y-6 animate-fadeIn">
          {/* CARDS DE RESUMO GERAL DAS NOTAS FISCAIS REGISTRADAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total de Notas */}
            <div className="bg-white border-2 border-deep-black p-4 space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/60 block">
                NOTAS CADASTRADAS
              </span>
              <div className="text-2xl font-black text-deep-black font-mono">
                {clothingPurchases.length}
              </div>
              <span className="text-[10px] text-deep-black/50 uppercase font-medium block">
                Romaneios de compras
              </span>
            </div>

            {/* Card 2: Total de Peças */}
            <div className="bg-white border-2 border-deep-black p-4 space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/60 block">
                TOTAL DE PEÇAS ADQUIRIDAS
              </span>
              <div className="text-2xl font-black text-deep-black font-mono">
                {totalPiecesAll} peças
              </div>
              <span className="text-[10px] text-deep-black/50 uppercase font-medium block">
                Estoque somado das notas
              </span>
            </div>

            {/* Card 3: Total Gasto com Mercadoria */}
            <div className="bg-deep-black text-white border-2 border-gold p-4 space-y-1 shadow-luxury">
              <span className="text-[10px] font-black uppercase tracking-wider text-gold block">
                GASTO TOTAL COM MERCADORIA
              </span>
              <div className="text-2xl font-black text-white font-mono">
                ${totalPaidAll.toFixed(2)}
              </div>
              <span className="text-[10px] text-gold/80 uppercase font-bold block">
                Lançado no financeiro da loja ($ USD)
              </span>
            </div>

            {/* Card 4: Lucro Estimado no Bolso */}
            <div className="bg-emerald-950 border-2 border-emerald-500 p-4 space-y-1 shadow-sm text-emerald-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                LUCRO PROJETADO NO ESTOQUE
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                +${totalProfitAll.toFixed(2)}
              </div>
              <span className="text-[10px] text-emerald-200/80 uppercase font-bold block">
                Livre de roupas, frete e comissão
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
            {/* TOPO DO ARQUIVO: TÍTULO, BUSCA E BOTÃO DE NOVA NOTA */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-deep-black pb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                  <Archive className="w-4 h-4 text-gold" />
                  <span>NOTAS FISCAIS REGISTRADAS NO SISTEMA ({clothingPurchases.length})</span>
                </h3>
                <p className="text-[10px] text-deep-black/60 uppercase mt-0.5 font-medium">
                  Suas notas ficam salvas e fechadas aqui. Clique em qualquer nota para abrir o espelho com custos, câmbio e margens.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Campo de Busca Rápida */}
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-deep-black/40 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar nota, fornecedor ou data..."
                    className="w-full pl-9 pr-7 py-2 text-xs border border-deep-black/30 font-bold focus:outline-none focus:border-deep-black bg-stone-50"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-deep-black/40 hover:text-deep-black text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResetNewInvoice}
                  className="px-5 py-2.5 bg-gold hover:bg-deep-black hover:text-gold text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ DAR ENTRADA EM NOVA NOTA</span>
                </button>
              </div>
            </div>

            {clothingPurchases.length === 0 ? (
              <div className="p-12 text-center text-xs text-deep-black/50 font-bold uppercase space-y-3 border-2 border-dashed border-deep-black/10">
                <Receipt className="w-10 h-10 mx-auto text-gold mb-1" />
                <p className="text-sm text-deep-black">Nenhuma nota fiscal registrada no arquivo ainda.</p>
                <p className="text-[10px] text-deep-black/40">
                  Clique no botão acima para cadastrar sua primeira nota de compra de mercadoria.
                </p>
                <button
                  type="button"
                  onClick={handleResetNewInvoice}
                  className="px-5 py-2.5 bg-deep-black text-gold text-xs font-black uppercase tracking-wider transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lançar Primeira Nota</span>
                </button>
              </div>
            ) : filteredPurchasesList.length === 0 ? (
              <div className="p-8 text-center text-xs text-deep-black/50 font-bold uppercase space-y-2">
                <Search className="w-6 h-6 mx-auto text-deep-black/30" />
                <p>Nenhuma nota encontrada com o termo "{searchQuery}".</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gold underline uppercase text-[11px] font-black"
                >
                  Limpar busca
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPurchasesList.map((p) => {
                  const invNum = p.invoiceNumber || `NF-${p.id.substring(6, 12)}`;
                  const itemsCount = p.items?.length || 1;
                  const isBRL = p.currency === 'BRL';
                  const isNewlyCreated = p.id === newlyCreatedInvoiceId;

                  return (
                    <div
                      key={p.id}
                      className={`p-5 border-2 transition space-y-4 shadow-sm group ${
                        isNewlyCreated
                          ? 'border-gold bg-gold/10 ring-2 ring-gold/50'
                          : 'border-deep-black bg-stone-50 hover:bg-white hover:border-gold'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-deep-black text-gold text-[9px] font-black uppercase tracking-wider inline-block">
                              {invNum}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-[8px] font-black uppercase ${
                                isBRL ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-stone-200 text-stone-800'
                              }`}
                            >
                              {isBRL ? `🇧🇷 R$ (Câmbio ${p.exchangeRate?.toFixed(2)})` : '🇺🇸 $ USD'}
                            </span>
                            {isNewlyCreated && (
                              <span className="px-1.5 py-0.5 bg-emerald-700 text-white text-[8px] font-black uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>RECÉM SALVA</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black uppercase text-deep-black line-clamp-1">
                            {p.supplier || 'Confecção Parceira'}
                          </h4>
                          <span className="text-[10px] text-deep-black/60 font-mono block">
                            📅 {p.date} • {itemsCount} {itemsCount === 1 ? 'modelo' : 'modelos'}
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-[9px] text-deep-black/50 uppercase block">Qtd Total</span>
                          <span className="text-xs font-black text-deep-black">{p.totalPieces} peças</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-y border-deep-black/10 py-2.5">
                        <div>
                          <span className="text-[9px] text-deep-black/60 uppercase block">Total Pago ($)</span>
                          <span className="font-black text-deep-black text-sm">${p.totalPaid.toFixed(2)}</span>
                          {isBRL && p.clothesAmountOriginal && (
                            <span className="text-[9px] text-deep-black/50 block font-sans">
                              (R$ {p.clothesAmountOriginal.toFixed(2)})
                            </span>
                          )}
                          <span className="text-[9px] text-sky-700 block font-sans">frete: ${p.freightAmount.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-emerald-700 font-bold uppercase block">Lucro no Bolso</span>
                          <span className="font-black text-emerald-600 text-sm">
                            +${p.totalProjectedProfit.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceModal(p)}
                          className="flex-1 py-2 bg-deep-black group-hover:bg-gold group-hover:text-deep-black text-white text-[11px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Abrir Espelho</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleLoadPurchaseToInvoice(p)}
                          className="p-2 bg-stone-200 hover:bg-gold text-deep-black transition border border-deep-black/20"
                          title="Editar esta nota fiscal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePurchase(p.id)}
                          className="p-2 text-deep-black/40 hover:text-red-600 hover:bg-red-50 transition border border-deep-black/10"
                          title="Excluir nota fiscal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL OFICIAL: ESPELHO DA NOTA FISCAL COM CONVERSÃO CAMBIAL */}
      {selectedInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-deep-black max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Barra de Ferramentas Superior do Modal */}
            <div className="bg-deep-black text-white p-4 flex items-center justify-between sticky top-0 z-10 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gold" />
                <span className="text-xs font-black uppercase tracking-widest text-gold">
                  ESPELHO DA NOTA FISCAL • {selectedInvoiceModal.invoiceNumber || `NF-${selectedInvoiceModal.id.substring(6, 12)}`}
                </span>
                {selectedInvoiceModal.currency === 'BRL' && (
                  <span className="px-2 py-0.5 bg-green-900 text-emerald-300 text-[9px] font-black uppercase border border-emerald-600">
                    🇧🇷 Compra em Reais (Câmbio {selectedInvoiceModal.exchangeRate?.toFixed(2)})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-gold hover:text-deep-black text-white text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLoadPurchaseToInvoice(selectedInvoiceModal);
                    setSelectedInvoiceModal(null);
                  }}
                  className="px-3 py-1.5 bg-gold text-deep-black hover:bg-white text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1"
                >
                  <span>Editar na Tela</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceModal(null)}
                  className="p-1.5 text-white/70 hover:text-white transition"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTEÚDO IMPRESSO / TIMBRADO DA NOTA FISCAL */}
            <div className="p-6 sm:p-8 space-y-6 bg-white text-deep-black" id="invoice-printable-area">
              {/* Cabeçalho Timbrado */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-deep-black pb-6">
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-deep-black">
                    ANA FITNESS WEAR LLC
                  </h1>
                  <p className="text-xs text-deep-black/70 uppercase tracking-widest font-bold">
                    LUXURY ACTIVEWEAR & SQUAT-PROOF SETS
                  </p>
                  <p className="text-[10px] text-deep-black/60 font-mono">
                    Showroom & Distribution Center • Leominster, MA • anafitwear.com
                  </p>
                </div>

                <div className="p-4 bg-stone-50 border-2 border-deep-black text-right space-y-1 font-mono">
                  <span className="text-[9px] text-deep-black/60 uppercase block font-sans font-bold">
                    DOCUMENTO DE ENTRADA
                  </span>
                  <div className="text-lg font-black text-deep-black">
                    {selectedInvoiceModal.invoiceNumber || `NF-${selectedInvoiceModal.id.substring(6, 12)}`}
                  </div>
                  <span className="text-[10px] text-deep-black/70 block">
                    Data: <strong>{selectedInvoiceModal.date}</strong>
                  </span>
                  {selectedInvoiceModal.currency === 'BRL' && (
                    <span className="text-[9px] text-green-700 block font-bold">
                      Câmbio Aplicado: $1 = R$ {selectedInvoiceModal.exchangeRate?.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Informações da Compra e Fornecedor */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-stone-50 border border-deep-black/20 text-xs">
                <div>
                  <span className="text-[9px] text-deep-black/60 uppercase font-black block">FORNECEDOR / FÁBRICA:</span>
                  <strong className="text-sm text-deep-black">{selectedInvoiceModal.supplier || 'Confecção'}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-deep-black/60 uppercase font-black block">TOTAL DE PEÇAS:</span>
                  <strong className="text-sm font-mono text-deep-black">{selectedInvoiceModal.totalPieces} unidades</strong>
                </div>
                <div>
                  <span className="text-[9px] text-deep-black/60 uppercase font-black block">MOEDA DA COMPRA:</span>
                  <strong className="text-sm font-mono text-deep-black">
                    {selectedInvoiceModal.currency === 'BRL'
                      ? `🇧🇷 Reais (R$ ${selectedInvoiceModal.clothesAmountOriginal?.toFixed(2) || '0.00'})`
                      : '🇺🇸 Dólar Americano ($ USD)'}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-deep-black/60 uppercase font-black block">COMISSÃO VENDEDORA:</span>
                  <strong className="text-sm font-mono text-gold">{selectedInvoiceModal.defaultCommissionPct || 15}% por venda</strong>
                </div>
              </div>

              {/* Tabela de Itens da Nota Fiscal */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-gold" />
                  <span>DISCRIMINAÇÃO DOS MODELOS & ITENS COMPRADOS</span>
                </h4>

                <div className="border-2 border-deep-black overflow-x-auto">
                  <table className="w-full text-left text-xs uppercase tracking-wider">
                    <thead className="bg-deep-black text-white text-[9px] font-black">
                      <tr>
                        <th className="p-2.5">MODELO / ITEM</th>
                        <th className="p-2.5 text-center">QTD</th>
                        <th className="p-2.5">
                          {selectedInvoiceModal.currency === 'BRL' ? 'CUSTO R$' : 'CUSTO FÁBRICA'}
                        </th>
                        {selectedInvoiceModal.currency === 'BRL' && (
                          <th className="p-2.5 bg-green-950 text-emerald-300">CONVERTIDO ($)</th>
                        )}
                        <th className="p-2.5">FRETE RATEADO</th>
                        <th className="p-2.5 bg-zinc-800 text-gold">CUSTO REAL / UN</th>
                        <th className="p-2.5">PREÇO VENDA</th>
                        <th className="p-2.5">COMISSÃO (15%)</th>
                        <th className="p-2.5 bg-emerald-950 text-emerald-300">LUCRO UNIT.</th>
                        <th className="p-2.5 bg-emerald-950 text-emerald-300">MARGEM (%)</th>
                        <th className="p-2.5 text-right">LUCRO TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-deep-black/10 font-mono text-[11px]">
                      {(selectedInvoiceModal.items && selectedInvoiceModal.items.length > 0
                        ? selectedInvoiceModal.items
                        : [
                            {
                              id: 'single',
                              name: 'Lote de Peças Diversas',
                              quantity: selectedInvoiceModal.totalPieces,
                              unitCost: selectedInvoiceModal.unitCostAverage,
                              unitCostOriginal: selectedInvoiceModal.unitCostAverage,
                              freightPerUnit: selectedInvoiceModal.freightPerPiece,
                              totalCostPerUnit: selectedInvoiceModal.totalCostPerPiece,
                              suggestedPrice: selectedInvoiceModal.suggestedSalePrice,
                              commissionPct: selectedInvoiceModal.defaultCommissionPct || 15,
                              commissionAmount:
                                selectedInvoiceModal.suggestedSalePrice *
                                ((selectedInvoiceModal.defaultCommissionPct || 15) / 100),
                              profitPerUnit: selectedInvoiceModal.profitPerPiece,
                              marginPct:
                                selectedInvoiceModal.suggestedSalePrice > 0
                                  ? (selectedInvoiceModal.profitPerPiece /
                                      selectedInvoiceModal.suggestedSalePrice) *
                                    100
                                  : 0,
                              totalItemProfit: selectedInvoiceModal.totalProjectedProfit,
                            },
                          ]
                      ).map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-stone-50">
                          <td className="p-2.5 font-sans font-bold text-deep-black">
                            {item.name || `Modelo ${idx + 1}`}
                          </td>
                          <td className="p-2.5 text-center font-bold text-deep-black">
                            {item.quantity} un
                          </td>
                          <td className="p-2.5 text-deep-black/70">
                            {selectedInvoiceModal.currency === 'BRL' && item.unitCostOriginal
                              ? `R$ ${item.unitCostOriginal.toFixed(2)}`
                              : `$${(item.unitCost || 0).toFixed(2)}`}
                          </td>
                          {selectedInvoiceModal.currency === 'BRL' && (
                            <td className="p-2.5 font-black text-emerald-700 bg-emerald-50/50">
                              ${(item.unitCost || 0).toFixed(2)} USD
                            </td>
                          )}
                          <td className="p-2.5 text-sky-700 font-bold">
                            +${(item.freightPerUnit || selectedInvoiceModal.freightPerPiece || 0).toFixed(2)}
                          </td>
                          <td className="p-2.5 font-black text-deep-black bg-stone-100">
                            ${(item.totalCostPerUnit || 0).toFixed(2)}
                          </td>
                          <td className="p-2.5 font-bold text-deep-black">
                            ${(item.suggestedPrice || 0).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-gold font-bold">
                            {item.commissionPct || selectedInvoiceModal.defaultCommissionPct || 15}%{' '}
                            <span className="text-[9px] text-deep-black/50 block">
                              (${(item.commissionAmount || 0).toFixed(2)})
                            </span>
                          </td>
                          <td className="p-2.5 font-black text-emerald-700 bg-emerald-50/50">
                            +${(item.profitPerUnit || 0).toFixed(2)}
                          </td>
                          <td className="p-2.5 font-black text-emerald-800 bg-emerald-50/50">
                            {(item.marginPct || 0).toFixed(1)}%
                          </td>
                          <td className="p-2.5 text-right font-black text-emerald-700">
                            +${(item.totalItemProfit || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quadro de Totais da Nota Fiscal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-stone-50 border border-deep-black/20 space-y-2 text-xs">
                  <span className="font-black uppercase tracking-wider text-deep-black block border-b border-deep-black/10 pb-1">
                    CUSTOS DA REMESSA
                  </span>
                  {selectedInvoiceModal.currency === 'BRL' && selectedInvoiceModal.clothesAmountOriginal && (
                    <div className="flex justify-between font-mono">
                      <span className="text-deep-black/70">Subtotal em Reais:</span>
                      <strong className="text-deep-black">R$ {selectedInvoiceModal.clothesAmountOriginal.toFixed(2)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between font-mono">
                    <span className="text-deep-black/70">Roupas Convertidas ($ USD):</span>
                    <strong className="text-green-800">${selectedInvoiceModal.clothesAmount.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-deep-black/70">Frete Total Pago ($ USD):</span>
                    <strong className="text-sky-800">${selectedInvoiceModal.freightAmount.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between font-mono text-sm border-t border-deep-black/10 pt-1.5 font-black">
                    <span>TOTAL PAGO NA NOTA ($ USD):</span>
                    <span className="text-deep-black">${selectedInvoiceModal.totalPaid.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950 text-white border-2 border-emerald-500 space-y-2 text-xs">
                  <span className="font-black uppercase tracking-wider text-emerald-300 block border-b border-white/10 pb-1">
                    PROJEÇÃO DE RETORNO & LUCRO
                  </span>
                  <div className="flex justify-between font-mono">
                    <span className="text-white/70">Faturamento Projetado:</span>
                    <strong className="text-white">
                      $
                      {(
                        selectedInvoiceModal.items?.reduce(
                          (acc, it) => acc + (it.suggestedPrice || 0) * (it.quantity || 1),
                          0
                        ) || selectedInvoiceModal.suggestedSalePrice * selectedInvoiceModal.totalPieces
                      ).toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-gold">Comissões Vendedoras:</span>
                    <strong className="text-gold">
                      -${(selectedInvoiceModal.totalCommissionsProjected || 0).toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between font-mono text-sm border-t border-white/10 pt-1.5 font-black text-emerald-300">
                    <span>LUCRO LÍQUIDO NO BOLSO ($ USD):</span>
                    <span className="text-base text-emerald-400">
                      +${selectedInvoiceModal.totalProjectedProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rodapé da Nota Fiscal */}
              <div className="pt-4 border-t border-deep-black/20 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-deep-black/60 uppercase font-mono">
                <span>Registro do Sistema • ID: {selectedInvoiceModal.id}</span>
                <span>Documento oficial de controle de estoque e custos • ANA FITNESS WEAR LLC</span>
              </div>
            </div>

            {/* Rodapé com botão de fechar */}
            <div className="p-4 bg-stone-100 border-t border-deep-black/10 flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedInvoiceModal(null)}
                className="px-6 py-2.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-widest transition"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
