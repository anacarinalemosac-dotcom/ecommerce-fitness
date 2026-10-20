'use client';

import React, { useState, useEffect } from 'react';
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
  // Modo de Exibição: 'create' (Lançar Nova Nota) ou 'archive' (Arquivo de Notas Registradas)
  const [activeTabMode, setActiveTabMode] = useState<'create' | 'archive'>('create');

  // Modal para Visualizar o Espelho da Nota Fiscal Individual
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState<ClothingPurchaseRecord | null>(null);

  // 1. Cabeçalho da Nota Fiscal / Romaneio
  const [invoiceNumber, setInvoiceNumber] = useState<string>('NF-2026/01');
  const [supplier, setSupplier] = useState<string>('Confecção / Fábrica');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [defaultCommissionPct, setDefaultCommissionPct] = useState<number>(15); // 15% padrão
  const [notes, setNotes] = useState<string>('');

  // 2. Frete da Nota Fiscal
  const [freightAmount, setFreightAmount] = useState<string>('150.00');

  // 3. Fornecedores e Produtos do Catálogo para Autocomplete
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // 4. Itens da Nota Fiscal
  const [items, setItems] = useState<ClothingItemDetail[]>([
    {
      id: 'item-1',
      name: 'Conjunto Mirela Top + Legging Compressão',
      quantity: 20,
      unitCost: 18.0,
      totalCost: 360.0,
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
      unitCost: 12.0,
      totalCost: 180.0,
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
      unitCost: 16.0,
      totalCost: 240.0,
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

  // Totais Automáticos da Nota Fiscal
  const totalPieces = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  const totalClothesAmount = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0),
    0
  );
  const freightNum = Math.max(0, Number(freightAmount) || 0);
  const totalInvoiceAmount = totalClothesAmount + freightNum;

  // Rateio do Frete por Unidade
  const freightPerUnit = totalPieces > 0 ? freightNum / totalPieces : 0;

  // Recalcula campos dinâmicos de cada item sempre que frete ou itens mudarem
  const enrichedItems = items.map((it) => {
    const q = Math.max(1, Number(it.quantity) || 1);
    const uCost = Math.max(0, Number(it.unitCost) || 0);
    const lineTotalCost = q * uCost;

    // Custo real com a fatia do frete
    const realCostPerUnit = uCost + freightPerUnit;

    // Preço de venda pretendido (se não preenchido, sugere dobro do custo real)
    const salePrice = Number(it.suggestedPrice) > 0 ? Number(it.suggestedPrice) : Math.ceil(realCostPerUnit * 2) - 0.1;

    // Comissão da vendedora (padrão 15% ou personalizada da linha)
    const commPct = it.commissionPct !== undefined ? Number(it.commissionPct) : defaultCommissionPct;
    const commAmount = salePrice * (commPct / 100);

    // Lucro Líquido no Bolso por Peça (Preço - Custo Real com Frete - Comissão Vendedora)
    const netProfitUnit = salePrice - realCostPerUnit - commAmount;

    // Margem Líquida % (Lucro Líquido / Preço de Venda)
    const netMarginPct = salePrice > 0 ? (netProfitUnit / salePrice) * 100 : 0;

    // Lucro Total do Lote deste Item
    const lineTotalProfit = netProfitUnit * q;

    return {
      ...it,
      quantity: q,
      unitCost: uCost,
      totalCost: lineTotalCost,
      freightPerUnit,
      totalCostPerUnit: realCostPerUnit,
      suggestedPrice: salePrice,
      commissionPct: commPct,
      commissionAmount: commAmount,
      profitPerUnit: netProfitUnit,
      marginPct: netMarginPct,
      totalItemProfit: lineTotalProfit,
    };
  });

  // Totais Gerais Consolidados da Nota
  const totalProjectedRevenue = enrichedItems.reduce(
    (acc, it) => acc + it.suggestedPrice * it.quantity,
    0
  );
  const totalProjectedCommissions = enrichedItems.reduce(
    (acc, it) => acc + (it.commissionAmount || 0) * it.quantity,
    0
  );
  const totalProjectedNetProfit = enrichedItems.reduce(
    (acc, it) => acc + (it.totalItemProfit || 0),
    0
  );
  const averageNetMarginPct =
    totalProjectedRevenue > 0 ? (totalProjectedNetProfit / totalProjectedRevenue) * 100 : 0;

  // Peças necessárias para amortizar 100% do frete da remessa
  const avgProfitPerPiece = totalPieces > 0 ? totalProjectedNetProfit / totalPieces : 0;
  const piecesToBreakEvenFreight =
    avgProfitPerPiece > 0 ? Math.ceil(freightNum / avgProfitPerPiece) : 0;

  // Manipulação de Linhas de Itens
  const handleAddItem = () => {
    const newItem: ClothingItemDetail = {
      id: `item-${Date.now()}`,
      name: '',
      quantity: 10,
      unitCost: 20.0,
      totalCost: 200.0,
      freightPerUnit,
      totalCostPerUnit: 20.0 + freightPerUnit,
      suggestedPrice: 49.9,
      commissionPct: defaultCommissionPct,
      commissionAmount: 49.9 * (defaultCommissionPct / 100),
      profitPerUnit: 49.9 - (20.0 + freightPerUnit) - 49.9 * (defaultCommissionPct / 100),
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

  // Salvar Nota Fiscal no Backend
  const handleSaveInvoice = async () => {
    if (items.length === 0 || totalPieces <= 0) {
      alert('Adicione pelo menos um item com quantidade válida na nota fiscal.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/backoffice/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_clothing_purchase',
          purchase: {
            invoiceNumber,
            date: purchaseDate,
            supplier,
            totalPieces,
            clothesAmount: totalClothesAmount,
            freightAmount: freightNum,
            defaultCommissionPct,
            totalCommissionsProjected: totalProjectedCommissions,
            markupMultiplier: totalClothesAmount > 0 ? totalProjectedRevenue / totalInvoiceAmount : 2.0,
            suggestedSalePrice: totalPieces > 0 ? totalProjectedRevenue / totalPieces : 49.9,
            profitPerPiece: avgProfitPerPiece,
            totalProjectedProfit: totalProjectedNetProfit,
            notes: notes ? `Nota: ${invoiceNumber} • ${notes}` : `Nota Fiscal: ${invoiceNumber}`,
            register_as_expense: registerAsExpense,
            items: enrichedItems,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        await onRefresh();
        setSuccessBanner(
          `Nota Fiscal "${invoiceNumber}" de ${supplier} (${totalPieces} peças) gravada com sucesso! Frete de $${freightNum.toFixed(2)} rateado ($${freightPerUnit.toFixed(2)}/un) e margens calculadas.`
        );
        if (onShowFeedback) {
          onShowFeedback(`Nota fiscal ${invoiceNumber} registrada com sucesso!`);
        }
        setTimeout(() => setSuccessBanner(null), 8000);
      } else {
        alert(data.error || 'Erro ao salvar nota fiscal.');
      }
    } catch (e: any) {
      alert('Erro na requisição: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Carregar Nota do Histórico na Tela
  const handleLoadPurchaseToInvoice = (p: ClothingPurchaseRecord) => {
    setInvoiceNumber(p.invoiceNumber || `NF-${p.id.substring(6, 12)}`);
    setSupplier(p.supplier || '');
    setPurchaseDate(p.date || new Date().toISOString().split('T')[0]);
    setFreightAmount(String(p.freightAmount || 0));
    setDefaultCommissionPct(p.defaultCommissionPct || 15);
    if (p.notes) setNotes(p.notes);

    if (p.items && p.items.length > 0) {
      setItems(
        p.items.map((it, idx) => ({
          id: it.id || `item-hist-${idx}`,
          name: it.name || `Item ${idx + 1}`,
          quantity: it.quantity || 1,
          unitCost: it.unitCost || 0,
          totalCost: (it.quantity || 1) * (it.unitCost || 0),
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
    if (!confirm('Deseja excluir esta nota fiscal do histórico de compras?')) return;
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

  // Limpar para Nova Nota
  const handleResetNewInvoice = () => {
    setInvoiceNumber(`NF-${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900 + 100))}`);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setFreightAmount('100.00');
    setDefaultCommissionPct(15);
    setNotes('');
    setItems([
      {
        id: `item-${Date.now()}`,
        name: '',
        quantity: 10,
        unitCost: 20.0,
        totalCost: 200.0,
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
  };

  const clothingPurchases = finances.clothingPurchases || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Oficial: Entrada de Nota Fiscal */}
      <div className="bg-gradient-to-r from-deep-black via-zinc-950 to-deep-black text-white border-2 border-gold p-6 sm:p-8 space-y-4 shadow-luxury">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold text-deep-black font-black text-[10px] uppercase tracking-widest shadow">
              <Receipt className="w-3.5 h-3.5" />
              <span>ENTRADA DE MERCADORIA ESTILO NOTA FISCAL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
              NOTA FISCAL DE COMPRA & ARQUIVO DE ENTRADAS
            </h2>
            <p className="text-xs uppercase tracking-wider text-white/70 max-w-3xl">
              Lance a remessa de peças linha por linha como em uma Nota Fiscal. O sistema rateia o frete automaticamente entre os itens, desconta a comissão das vendedoras (15%) e te dá a margem líquida real e o lucro exato em dólar no seu bolso.
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
          {/* CABEÇALHO DA NOTA (Fornecedor, Data, Nº NF, Comissão) */}
          <div className="p-6 bg-stone-50 space-y-4">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                <Building className="w-4 h-4 text-gold" />
                <span>CABEÇALHO DA NOTA FISCAL / PEDIDO DE COMPRA</span>
              </h3>
              <span className="text-[10px] text-deep-black/60 font-mono font-bold uppercase">
                Moeda Oficial: $ USD (Dólares)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fornecedor / Confecção */}
              <div className="space-y-1.5">
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
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                  Nº DA NOTA / INVOICE / ROMANEIO:
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex: NF-1042 ou Pedido #88"
                  className="w-full px-3 py-2 text-xs font-mono font-bold border-2 border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
                />
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
                  Padrão 15% (descontado do lucro líquido).
                </span>
              </div>
            </div>
          </div>

          {/* CORPO DA NOTA: TABELA DE ITENS (ADICIONAR MANUALMENTE LINHA A LINHA) */}
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />
                  <span>ITENS DA NOTA FISCAL (ROUPAS & CONJUNTOS)</span>
                </h3>
                <p className="text-[10px] text-deep-black/60 uppercase mt-0.5">
                  Adicione cada modelo comprado. O total de cada linha é calculado na hora.
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
                    <th className="p-3 w-36">VALOR UNITÁRIO ($)</th>
                    <th className="p-3 w-36">VALOR TOTAL ($)</th>
                    <th className="p-3 w-12 text-center">REMOVER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-deep-black/10">
                  {items.map((it, idx) => {
                    const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitCost) || 0);
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
                            <span className="absolute left-2.5 top-1.5 font-mono text-deep-black/40">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.unitCost}
                              onChange={(e) => handleUpdateItem(it.id, 'unitCost', parseFloat(e.target.value) || 0)}
                              className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-black border border-deep-black/20 text-green-700 bg-white"
                            />
                          </div>
                        </td>
                        <td className="p-3 font-mono font-black text-xs text-green-800">
                          ${lineTotal.toFixed(2)}
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
              {/* Subtotal das Roupas */}
              <div className="p-4 bg-white border-2 border-deep-black/20 space-y-1">
                <span className="text-[10px] text-deep-black/60 font-black uppercase block">
                  1. SUBTOTAL DAS ROUPAS:
                </span>
                <div className="text-xl font-mono font-black text-green-700">
                  ${totalClothesAmount.toFixed(2)}
                </div>
                <span className="text-[10px] font-mono text-deep-black/60 block">
                  Total: <strong>{totalPieces} peças</strong>
                </span>
              </div>

              {/* Valor do Frete */}
              <div className="p-4 bg-sky-50 border-2 border-sky-400 space-y-1">
                <label className="text-[10px] text-sky-950 font-black uppercase flex items-center justify-between">
                  <span>2. VALOR DO FRETE ($):</span>
                  <Truck className="w-4 h-4 text-sky-600" />
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 font-mono text-sky-700 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-1.5 text-lg font-mono font-black border-2 border-sky-500 bg-white text-sky-900 focus:outline-none"
                  />
                </div>
                <div className="text-[10px] text-sky-800 font-mono font-bold leading-tight">
                  Frete Rateado: <strong>+${freightPerUnit.toFixed(2)} / peça</strong>
                </div>
              </div>

              {/* Total Geral da Nota */}
              <div className="p-4 bg-white border-2 border-deep-black space-y-1">
                <span className="text-[10px] text-deep-black/60 font-black uppercase block">
                  3. TOTAL GERAL PAGO NA NOTA:
                </span>
                <div className="text-xl font-mono font-black text-deep-black">
                  ${totalInvoiceAmount.toFixed(2)}
                </div>
                <span className="text-[10px] text-deep-black/60 font-mono block">
                  (Roupas + Frete Total)
                </span>
              </div>

              {/* Custo Médio Real */}
              <div className="p-4 bg-white border-2 border-gold space-y-1">
                <span className="text-[10px] text-deep-black/60 font-black uppercase block">
                  4. CUSTO MÉDIO REAL / PEÇA:
                </span>
                <div className="text-xl font-mono font-black text-gold">
                  ${(totalPieces > 0 ? totalInvoiceAmount / totalPieces : 0).toFixed(2)}
                </div>
                <span className="text-[10px] text-deep-black/70 font-mono block font-bold">
                  (Já com o frete embutido)
                </span>
              </div>
            </div>
          </div>

          {/* 3. TABELA DE FORMAÇÃO DE PREÇO, COMISSÃO (15%) E MARGEM REAL */}
          <div className="p-6 space-y-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-deep-black/10 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-deep-black text-gold font-black text-[9px] uppercase tracking-widest mb-1">
                  <Sparkles className="w-3 h-3 text-gold" />
                  <span>ANÁLISE DE VENDA & LUCRO LÍQUIDO NO BOLSO</span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
                  PREÇO DE VENDA, COMISSÃO DAS VENDEDORAS E MARGEM REAL POR ITEM
                </h3>
                <p className="text-[10px] text-deep-black/60 uppercase mt-0.5">
                  Digite o preço de venda que você vai cobrar. O sistema deduz o custo real (com frete) e a comissão da vendedora, mostrando o lucro líquido limpo em dólar e a porcentagem.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border-2 border-deep-black">
              <table className="w-full text-left text-xs uppercase tracking-wider">
                <thead className="bg-zinc-900 text-white text-[10px] font-black">
                  <tr>
                    <th className="p-3">ITEM</th>
                    <th className="p-3 text-center">QTD</th>
                    <th className="p-3">CUSTO FÁBRICA</th>
                    <th className="p-3">FRETE RATEADO</th>
                    <th className="p-3 bg-zinc-800 text-gold">CUSTO REAL TOTAL</th>
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
                      <td className="p-3 text-deep-black/70">
                        ${it.unitCost.toFixed(2)}
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
                {totalPieces} peças no total
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Total Investido */}
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[9px] text-white/60 uppercase block">INVESTIMENTO TOTAL</span>
                <div className="text-base sm:text-lg font-mono font-black text-white">
                  ${totalInvoiceAmount.toFixed(2)}
                </div>
                <span className="text-[9px] text-white/40 uppercase block">Roupas + Frete</span>
              </div>

              {/* Faturamento Bruto */}
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[9px] text-white/60 uppercase block">FATURAMENTO BRUTO</span>
                <div className="text-base sm:text-lg font-mono font-black text-white">
                  ${totalProjectedRevenue.toFixed(2)}
                </div>
                <span className="text-[9px] text-white/40 uppercase block">100% Vendido</span>
              </div>

              {/* Total Comissões */}
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[9px] text-gold uppercase block">COMISSÕES VENDEDORAS</span>
                <div className="text-base sm:text-lg font-mono font-black text-gold">
                  ${totalProjectedCommissions.toFixed(2)}
                </div>
                <span className="text-[9px] text-white/40 uppercase block">Total a Pagar</span>
              </div>

              {/* Lucro Líquido Limpo */}
              <div className="p-3 bg-emerald-950/80 border-2 border-emerald-500 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] text-emerald-300 font-black uppercase block">
                  LUCRO LÍQUIDO NO BOLSO
                </span>
                <div className="text-lg sm:text-xl font-mono font-black text-emerald-400">
                  +${totalProjectedNetProfit.toFixed(2)}
                </div>
                <span className="text-[9px] text-emerald-200 uppercase block font-bold">
                  Livre de Custos e Comissão
                </span>
              </div>

              {/* Margem Média Líquida */}
              <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                <span className="text-[9px] text-white/60 uppercase block">MARGEM MÉDIA LÍQUIDA</span>
                <div className="text-base sm:text-lg font-mono font-black text-emerald-400">
                  {averageNetMarginPct.toFixed(1)}%
                </div>
                <span className="text-[9px] text-white/40 uppercase block">Sobre o Faturamento</span>
              </div>
            </div>

            <div className="p-3 bg-sky-950/40 border border-sky-500/40 text-sky-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                🚚 <strong>Amortização de Frete:</strong> Vendendo apenas{' '}
                <strong>{piecesToBreakEvenFreight} peças</strong> deste lote, você já cobre 100% do frete de $
                {freightNum.toFixed(2)}! As outras{' '}
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
                  Lançar despesa de Roupas (${totalClothesAmount.toFixed(2)}) e Frete ($
                  {freightNum.toFixed(2)}) no Fluxo de Caixa / DRE
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
          <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-deep-black pb-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                  <Archive className="w-4 h-4 text-gold" />
                  <span>ARQUIVO COMPLETO DE NOTAS FISCAIS ({clothingPurchases.length} REGISTRADAS)</span>
                </h3>
                <p className="text-[10px] text-deep-black/60 uppercase mt-0.5 font-medium">
                  Clique em qualquer nota fiscal para abrir o espelho individual com todos os modelos, custos, comissões e margens.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTabMode('create')}
                className="px-4 py-2 bg-deep-black text-gold hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Lançar Nova Nota</span>
              </button>
            </div>

            {clothingPurchases.length === 0 ? (
              <div className="p-12 text-center text-xs text-deep-black/50 font-bold uppercase space-y-3 border-2 border-dashed border-deep-black/10">
                <Receipt className="w-10 h-10 mx-auto text-gold mb-1" />
                <p className="text-sm text-deep-black">Nenhuma nota fiscal registrada no arquivo ainda.</p>
                <p className="text-[10px] text-deep-black/40">
                  Clique em "LANÇAR NOTA FISCAL" para cadastrar seu primeiro romaneio de compra.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTabMode('create')}
                  className="px-5 py-2.5 bg-deep-black text-gold text-xs font-black uppercase tracking-wider transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lançar Primeira Nota</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clothingPurchases.map((p) => {
                  const invNum = p.invoiceNumber || `NF-${p.id.substring(6, 12)}`;
                  const itemsCount = p.items?.length || 1;
                  return (
                    <div
                      key={p.id}
                      className="p-5 border-2 border-deep-black bg-stone-50 hover:bg-white hover:border-gold transition space-y-4 shadow-sm group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 bg-deep-black text-gold text-[9px] font-black uppercase tracking-wider inline-block">
                            {invNum}
                          </span>
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
                          <span className="text-[9px] text-deep-black/60 uppercase block">Total Pago</span>
                          <span className="font-black text-deep-black">${p.totalPaid.toFixed(2)}</span>
                          <span className="text-[9px] text-sky-700 block">(frete ${p.freightAmount.toFixed(2)})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-emerald-700 font-bold uppercase block">Lucro no Bolso</span>
                          <span className="font-black text-emerald-600 text-sm">
                            +${p.totalProjectedProfit.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceModal(p)}
                          className="flex-1 py-2 bg-deep-black group-hover:bg-gold group-hover:text-deep-black text-white text-[11px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Abrir Espelho da Nota</span>
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

      {/* MODAL OFICIAL: ESPELHO DA NOTA FISCAL (VISUALIZAÇÃO INDIVIDUAL UMA POR UMA) */}
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
                </div>
              </div>

              {/* Informações da Compra e Fornecedor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-stone-50 border border-deep-black/20 text-xs">
                <div>
                  <span className="text-[9px] text-deep-black/60 uppercase font-black block">FORNECEDOR / FÁBRICA:</span>
                  <strong className="text-sm text-deep-black">{selectedInvoiceModal.supplier || 'Confecção'}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-deep-black/60 uppercase font-black block">TOTAL DE PEÇAS:</span>
                  <strong className="text-sm font-mono text-deep-black">{selectedInvoiceModal.totalPieces} unidades</strong>
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
                        <th className="p-2.5">CUSTO FÁBRICA</th>
                        <th className="p-2.5">FRETE RATEADO</th>
                        <th className="p-2.5 bg-zinc-800 text-gold">CUSTO REAL TOTAL</th>
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
                            ${(item.unitCost || 0).toFixed(2)}
                          </td>
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
                  <div className="flex justify-between font-mono">
                    <span className="text-deep-black/70">Subtotal das Roupas:</span>
                    <strong className="text-green-800">${selectedInvoiceModal.clothesAmount.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-deep-black/70">Frete Total Pago:</span>
                    <strong className="text-sky-800">${selectedInvoiceModal.freightAmount.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between font-mono text-sm border-t border-deep-black/10 pt-1.5 font-black">
                    <span>TOTAL PAGO NA NOTA:</span>
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
                    <span>LUCRO LÍQUIDO NO BOLSO:</span>
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
