'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Truck,
  Package,
  TrendingUp,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Building,
  Info,
  HelpCircle,
  ArrowRight,
  Calculator,
  RefreshCw,
  ShoppingBag,
  Layers,
  ChevronDown,
  ChevronUp,
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
  // Inputs do Cálculo Rápido de Compra
  const [totalPieces, setTotalPieces] = useState<string>('50');
  const [clothesAmount, setClothesAmount] = useState<string>('1000.00');
  const [freightAmount, setFreightAmount] = useState<string>('150.00');
  const [supplier, setSupplier] = useState<string>('Confecção / Fábrica');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Estratégia de Precificação
  const [markupType, setMarkupType] = useState<'multiplier' | 'margin' | 'custom'>('multiplier');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(2.0); // 2.0x (dobrar o custo)
  const [selectedMarginPct, setSelectedMarginPct] = useState<number>(50); // 50% margem
  const [customSalePrice, setCustomSalePrice] = useState<string>('49.90');
  const [suppliersList, setSuppliersList] = useState<any[]>([]);

  // Carrega lista de fornecedores cadastrados
  React.useEffect(() => {
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
      .catch((err) => console.warn('Erro ao buscar fornecedores:', err));
  }, []);

  // Detalhamento de Modelos (opcional)
  const [showDetailedItems, setShowDetailedItems] = useState(false);
  const [detailedItems, setDetailedItems] = useState<ClothingItemDetail[]>([
    {
      id: 'item-1',
      name: 'Macacão Samanta Romper',
      quantity: 25,
      unitCost: 20.0,
      freightPerUnit: 3.0,
      totalCostPerUnit: 23.0,
      suggestedPrice: 49.9,
      profitPerUnit: 26.9,
    },
    {
      id: 'item-2',
      name: 'Conjunto Top + Legging Canelada',
      quantity: 25,
      unitCost: 20.0,
      freightPerUnit: 3.0,
      totalCostPerUnit: 23.0,
      suggestedPrice: 49.9,
      profitPerUnit: 26.9,
    },
  ]);

  const [registerAsExpense, setRegisterAsExpense] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Cálculos Automáticos
  const piecesNum = Math.max(1, Number(totalPieces) || 1);
  const clothesNum = Math.max(0, Number(clothesAmount) || 0);
  const freightNum = Math.max(0, Number(freightAmount) || 0);

  // Custo unitário de compra na confecção
  const factoryUnitCost = clothesNum / piecesNum;

  // Frete rateado por peça
  const freightPerPiece = freightNum / piecesNum;

  // Custo REAL Total por Peça (Custo Peça + Frete)
  const totalCostPerPiece = factoryUnitCost + freightPerPiece;

  // Preço Sugerido de Venda
  let calculatedSalePrice = 0;
  if (markupType === 'multiplier') {
    calculatedSalePrice = totalCostPerPiece * selectedMultiplier;
  } else if (markupType === 'margin') {
    const marginDec = Math.min(0.95, Math.max(0.05, selectedMarginPct / 100));
    calculatedSalePrice = totalCostPerPiece / (1 - marginDec);
  } else {
    calculatedSalePrice = Number(customSalePrice) || totalCostPerPiece * 2;
  }

  // Preço comercial arredondado (terminação .90)
  const commercialPrice = Math.ceil(calculatedSalePrice) - 0.1 > calculatedSalePrice
    ? Math.ceil(calculatedSalePrice) - 0.1
    : Math.ceil(calculatedSalePrice) + 0.9;

  // Lucro por peça
  const profitPerPiece = calculatedSalePrice - totalCostPerPiece;
  const marginAchievedPct = calculatedSalePrice > 0 ? (profitPerPiece / calculatedSalePrice) * 100 : 0;
  const markupAchieved = totalCostPerPiece > 0 ? calculatedSalePrice / totalCostPerPiece : 0;

  // Lucro Total Projetado no Lote
  const totalProjectedProfit = profitPerPiece * piecesNum;
  const totalInvestment = clothesNum + freightNum;
  const totalRevenueProjected = calculatedSalePrice * piecesNum;

  // Quantas peças vendidas já pagam o frete todo
  const piecesToBreakEvenFreight = profitPerPiece > 0 ? Math.ceil(freightNum / profitPerPiece) : 0;

  // Atualiza detalhamento de modelos quando o frete muda
  const handleUpdateItemDetail = (id: string, field: 'name' | 'quantity' | 'unitCost', value: any) => {
    setDetailedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          const q = Number(updated.quantity) || 1;
          const uCost = Number(updated.unitCost) || 0;
          const fPerU = freightPerPiece;
          const tCost = uCost + fPerU;
          let sPrice = tCost * (markupType === 'multiplier' ? selectedMultiplier : 2.0);
          if (markupType === 'custom' && Number(customSalePrice) > 0) {
            sPrice = Number(customSalePrice);
          }
          return {
            ...updated,
            quantity: q,
            unitCost: uCost,
            freightPerUnit: fPerU,
            totalCostPerUnit: tCost,
            suggestedPrice: sPrice,
            profitPerUnit: sPrice - tCost,
          };
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: ClothingItemDetail = {
      id: `item-${Date.now()}`,
      name: `Modelo ${detailedItems.length + 1}`,
      quantity: 10,
      unitCost: factoryUnitCost > 0 ? factoryUnitCost : 20,
      freightPerUnit: freightPerPiece,
      totalCostPerUnit: (factoryUnitCost > 0 ? factoryUnitCost : 20) + freightPerPiece,
      suggestedPrice: calculatedSalePrice,
      profitPerUnit: profitPerPiece,
    };
    setDetailedItems([...detailedItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setDetailedItems(detailedItems.filter((i) => i.id !== id));
  };

  // Salvar no Backend
  const handleSavePurchase = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/backoffice/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_clothing_purchase',
          purchase: {
            date: purchaseDate,
            supplier,
            totalPieces: piecesNum,
            clothesAmount: clothesNum,
            freightAmount: freightNum,
            markupMultiplier: markupType === 'multiplier' ? selectedMultiplier : markupAchieved,
            suggestedSalePriceCustom: calculatedSalePrice,
            notes,
            register_as_expense: registerAsExpense,
            items: showDetailedItems ? detailedItems : [],
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        await onRefresh();
        setSuccessBanner(
          `Lote de compra gravado com sucesso! Custo real por peça ($${totalCostPerPiece.toFixed(2)}) e preço sugerido ($${calculatedSalePrice.toFixed(2)}) arquivados.`
        );
        if (onShowFeedback) {
          onShowFeedback('Compra de roupas e cálculo de preço registrados com sucesso!');
        }
        setTimeout(() => setSuccessBanner(null), 6000);
      } else {
        alert(data.error || 'Erro ao salvar compra.');
      }
    } catch (e: any) {
      alert('Erro na requisição: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm('Deseja excluir este registro de compra do histórico?')) return;
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
        if (onShowFeedback) onShowFeedback('Registro de compra excluído.');
      }
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  const handleLoadPurchaseToCalculator = (p: ClothingPurchaseRecord) => {
    setTotalPieces(String(p.totalPieces));
    setClothesAmount(String(p.clothesAmount));
    setFreightAmount(String(p.freightAmount));
    setSupplier(p.supplier || '');
    setPurchaseDate(p.date || new Date().toISOString().split('T')[0]);
    if (p.notes) setNotes(p.notes);
    if (p.suggestedSalePrice) {
      setCustomSalePrice(p.suggestedSalePrice.toFixed(2));
      setMarkupType('custom');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clothingPurchases = finances.clothingPurchases || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Explicativo da Ferramenta */}
      <div className="bg-gradient-to-r from-deep-black via-zinc-950 to-deep-black text-white border-2 border-gold p-6 sm:p-8 space-y-4 shadow-luxury">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold text-deep-black font-black text-[10px] uppercase tracking-widest shadow">
              <Calculator className="w-3.5 h-3.5" />
              <span>PRECIFICAÇÃO SIMPLES & RATEIO DE FRETE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
              COMPRAS DE ROUPAS & FORMAÇÃO DE PREÇO
            </h2>
            <p className="text-xs uppercase tracking-wider text-white/70 max-w-2xl">
              Coloque o valor que você pagou nas roupas da confecção e o valor do frete. O sistema embutirá o frete em cada peça e calculará o preço ideal de venda para você lucrar com segurança.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="p-3 bg-white/10 hover:bg-gold hover:text-deep-black text-white transition border border-white/20"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
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

      {/* 2. O CORAÇÃO DA CALCULADORA (Grid de Entrada e Resultado) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LADO ESQUERDO (7 Colunas): Formulário de Entrada das Peças e Frete */}
        <div className="lg:col-span-7 bg-white border-2 border-deep-black p-6 space-y-6 shadow-sm">
          <div className="border-b-2 border-deep-black pb-3 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
              <Package className="w-4 h-4 text-gold" />
              <span>1. DADOS DA COMPRA (ROUPAS + FRETE)</span>
            </h3>
            <span className="text-[10px] text-deep-black/60 font-mono font-bold uppercase">
              Moeda: $ USD (Dólar)
            </span>
          </div>

          {/* Grid de Inputs Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantidade Total de Peças */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                <span>QUANTIDADE TOTAL DE PEÇAS NO PACOTE:</span>
                <span className="text-gold font-mono">{piecesNum} peças</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={totalPieces}
                  onChange={(e) => setTotalPieces(e.target.value)}
                  placeholder="Ex: 50"
                  className="w-full px-4 py-3 pl-11 text-base font-mono font-black border-2 border-deep-black focus:outline-none focus:border-gold bg-white"
                />
                <Package className="w-5 h-5 text-deep-black/40 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[10px] text-deep-black/60 uppercase">
                Total de rompers, conjuntos, leggings ou tops que vieram nesta remessa.
              </p>
            </div>

            {/* Valor Pago nas Roupas */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                <span>VALOR TOTAL DAS ROUPAS ($):</span>
                <span className="text-green-700 font-mono font-black">${clothesNum.toFixed(2)}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={clothesAmount}
                  onChange={(e) => setClothesAmount(e.target.value)}
                  placeholder="Ex: 1000.00"
                  className="w-full px-4 py-3 pl-11 text-base font-mono font-black border-2 border-deep-black focus:outline-none focus:border-gold bg-white text-green-700"
                />
                <span className="text-base font-black text-deep-black/40 absolute left-4 top-3">$</span>
              </div>
              <div className="p-2 bg-green-50 border border-green-200 text-[10px] font-mono text-green-900 font-bold">
                Custo de Fábrica: <strong>${factoryUnitCost.toFixed(2)} / peça</strong>
              </div>
            </div>

            {/* Valor Pago no Frete */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                <span>VALOR PAGO NO FRETE ($):</span>
                <span className="text-sky-700 font-mono font-black">${freightNum.toFixed(2)}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={freightAmount}
                  onChange={(e) => setFreightAmount(e.target.value)}
                  placeholder="Ex: 150.00"
                  className="w-full px-4 py-3 pl-11 text-base font-mono font-black border-2 border-deep-black focus:outline-none focus:border-gold bg-white text-sky-700"
                />
                <Truck className="w-5 h-5 text-deep-black/40 absolute left-3.5 top-3.5" />
              </div>
              <div className="p-2 bg-sky-50 border border-sky-200 text-[10px] font-mono text-sky-900 font-bold">
                Frete Rateado: <strong>+${freightPerPiece.toFixed(2)} / peça</strong>
              </div>
            </div>

            {/* Fornecedor (Opcional) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                <span>FORNECEDOR / CONFECÇÃO (OPCIONAL):</span>
                {suppliersList.length > 0 && (
                  <span className="text-[9px] text-gold font-bold">{suppliersList.length} cadastrado(s)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="pricing-suppliers-list"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Selecione ou digite a confecção..."
                  className="w-full px-3 py-2 text-xs font-bold border border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
                />
                <datalist id="pricing-suppliers-list">
                  {suppliersList.map((sup: any) => (
                    <option key={sup.id} value={sup.company_name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Data da Compra */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                DATA DA COMPRA:
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
              />
            </div>
          </div>

          {/* 2. SELETOR DE MARGEM / QUANTO VOCÊ QUER GANHAR */}
          <div className="pt-4 border-t-2 border-deep-black/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                <span>2. QUANTO VOCÊ DESEJA GANHAR POR PEÇA?</span>
              </h4>
              <span className="text-[10px] text-gold font-black uppercase">
                {markupType === 'multiplier' ? `${selectedMultiplier}x Custo` : markupType === 'margin' ? `${selectedMarginPct}% Margem` : 'Preço Manual'}
              </span>
            </div>

            {/* Botões Rápidos de Multiplicador / Margem */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMarkupType('multiplier');
                  setSelectedMultiplier(2.0);
                }}
                className={`p-3 text-left border-2 transition ${
                  markupType === 'multiplier' && selectedMultiplier === 2.0
                    ? 'border-gold bg-deep-black text-gold shadow'
                    : 'border-deep-black/20 bg-white text-deep-black hover:border-deep-black'
                }`}
              >
                <div className="text-xs font-black uppercase">DOBRAR O CUSTO</div>
                <div className="text-[10px] font-bold opacity-80 font-mono">2.0x (100% Markup)</div>
                <div className="text-[11px] font-black mt-1 text-gold font-mono">
                  ${(totalCostPerPiece * 2.0).toFixed(2)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMarkupType('multiplier');
                  setSelectedMultiplier(2.5);
                }}
                className={`p-3 text-left border-2 transition ${
                  markupType === 'multiplier' && selectedMultiplier === 2.5
                    ? 'border-gold bg-deep-black text-gold shadow'
                    : 'border-deep-black/20 bg-white text-deep-black hover:border-deep-black'
                }`}
              >
                <div className="text-xs font-black uppercase">LUCRO ALTO</div>
                <div className="text-[10px] font-bold opacity-80 font-mono">2.5x (150% Markup)</div>
                <div className="text-[11px] font-black mt-1 text-gold font-mono">
                  ${(totalCostPerPiece * 2.5).toFixed(2)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMarkupType('multiplier');
                  setSelectedMultiplier(3.0);
                }}
                className={`p-3 text-left border-2 transition ${
                  markupType === 'multiplier' && selectedMultiplier === 3.0
                    ? 'border-gold bg-deep-black text-gold shadow'
                    : 'border-deep-black/20 bg-white text-deep-black hover:border-deep-black'
                }`}
              >
                <div className="text-xs font-black uppercase">TRIPLICAR</div>
                <div className="text-[10px] font-bold opacity-80 font-mono">3.0x (200% Markup)</div>
                <div className="text-[11px] font-black mt-1 text-gold font-mono">
                  ${(totalCostPerPiece * 3.0).toFixed(2)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMarkupType('custom')}
                className={`p-3 text-left border-2 transition ${
                  markupType === 'custom'
                    ? 'border-gold bg-deep-black text-gold shadow'
                    : 'border-deep-black/20 bg-white text-deep-black hover:border-deep-black'
                }`}
              >
                <div className="text-xs font-black uppercase">PERSONALIZADO</div>
                <div className="text-[10px] font-bold opacity-80">Digitar meu preço</div>
                <div className="text-[11px] font-black mt-1 font-mono">
                  ${Number(customSalePrice || 0).toFixed(2)}
                </div>
              </button>
            </div>

            {/* Input para Preço Personalizado caso selecione */}
            {markupType === 'custom' && (
              <div className="p-4 bg-gold/10 border-2 border-gold space-y-2 animate-fadeIn">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                  <span>DIGITE O PREÇO DE VENDA QUE VOCÊ PRETENDE COBRAR:</span>
                  <span className="text-gold font-mono font-black">${customSalePrice}</span>
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customSalePrice}
                    onChange={(e) => setCustomSalePrice(e.target.value)}
                    placeholder="Ex: 49.90"
                    className="w-full px-4 py-2.5 pl-9 text-base font-mono font-black border-2 border-deep-black focus:outline-none focus:border-gold bg-white"
                  />
                  <span className="text-base font-black text-deep-black/40 absolute left-3 top-2.5">$</span>
                </div>
                <p className="text-[10px] text-deep-black/70 uppercase">
                  O sistema calculará sua margem exata e quanto sobrará limpo no bolso por peça.
                </p>
              </div>
            )}
          </div>

          {/* Toggle para Detalhamento Opcional por Modelos */}
          <div className="pt-2 border-t border-deep-black/10">
            <button
              type="button"
              onClick={() => setShowDetailedItems(!showDetailedItems)}
              className="text-xs font-black uppercase tracking-wider text-deep-black hover:text-gold flex items-center gap-1.5 transition"
            >
              <Layers className="w-4 h-4 text-gold" />
              <span>
                {showDetailedItems
                  ? '▼ Ocultar Detalhamento por Modelo'
                  : '► Opcional: Detalhar modelos diferentes que vieram nesta compra'}
              </span>
            </button>

            {showDetailedItems && (
              <div className="mt-4 p-4 bg-zinc-50 border-2 border-deep-black space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                    MODELOS NA MESMA REMESSA (FRETE DE ${freightNum.toFixed(2)} RATEADO ENTRE ELES)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-deep-black text-gold hover:bg-gold hover:text-deep-black text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Adicionar Modelo</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {detailedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-deep-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItemDetail(item.id, 'name', e.target.value)}
                          placeholder="Nome do Modelo"
                          className="w-full px-2 py-1 text-xs font-bold border border-deep-black/20 bg-white"
                        />
                        <div className="flex items-center gap-2 text-[10px] text-deep-black/60 font-mono">
                          <span>Frete Rateado: +${freightPerPiece.toFixed(2)}</span>
                          <span>•</span>
                          <span className="text-deep-black font-black">
                            Custo Real: ${(Number(item.unitCost) + freightPerPiece).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <label className="text-[9px] font-black text-deep-black/60 block">QTD:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemDetail(item.id, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 text-xs font-mono font-bold border border-deep-black/20"
                          />
                        </div>

                        <div className="w-24">
                          <label className="text-[9px] font-black text-deep-black/60 block">CUSTO FÁBRICA:</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => handleUpdateItemDetail(item.id, 'unitCost', e.target.value)}
                            className="w-full px-2 py-1 text-xs font-mono font-bold border border-deep-black/20"
                          />
                        </div>

                        <div className="text-right pl-2">
                          <label className="text-[9px] font-black text-gold block">VENDA SUGERIDA:</label>
                          <span className="font-mono font-black text-xs text-deep-black">
                            ${((Number(item.unitCost) + freightPerPiece) * selectedMultiplier).toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 transition"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO (5 Colunas): O PAINEL DE RESULTADO & DECISÃO DE PREÇO */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card Dourado de Preço Recomendado */}
          <div className="bg-deep-black text-white border-2 border-gold p-6 space-y-5 shadow-luxury">
            <div className="flex items-center justify-between border-b border-gold/30 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>PREÇO RECOMENDADO DE VENDA</span>
              </span>
              <span className="px-2 py-0.5 bg-gold text-deep-black text-[9px] font-black uppercase">
                {markupAchieved.toFixed(1)}X MARKUP
              </span>
            </div>

            {/* O Grande Número de Venda */}
            <div className="space-y-1 text-center py-2">
              <div className="text-4xl sm:text-5xl font-black font-mono text-gold tracking-tight">
                ${calculatedSalePrice.toFixed(2)}
              </div>
              <p className="text-xs uppercase tracking-wider text-white/80 font-bold">
                POR PEÇA (VENDER NO SITE OU NO PDV)
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 bg-white/10 text-white text-[11px] font-bold font-mono border border-white/20">
                  Sugestão Comercial: <strong>${commercialPrice.toFixed(2)}</strong> (Terminação .90)
                </span>
              </div>
            </div>

            {/* Raio-X do Custo & Lucro por Peça */}
            <div className="p-4 bg-white/5 border border-white/15 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-white/70">
                <span>Custo de Fábrica da Peça:</span>
                <span className="font-bold text-white">${factoryUnitCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sky-400">
                <span>+ Frete Embutido por Peça:</span>
                <span className="font-bold">+${freightPerPiece.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/20 text-white font-bold">
                <span>(=) Custo Real Total da Peça:</span>
                <span className="text-gold">${totalCostPerPiece.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gold/40 text-gold font-black text-sm">
                <span>(+) Seu Lucro Líquido por Peça:</span>
                <span>+${profitPerPiece.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-right text-gold/80 font-sans font-bold">
                Margem Líquida Real: {marginAchievedPct.toFixed(1)}%
              </div>
            </div>

            {/* Visão do Lote Inteiro */}
            <div className="space-y-2 text-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-gold">
                PROJEÇÃO PARA O LOTE DE {piecesNum} PEÇAS:
              </div>
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-2.5 bg-white/5 border border-white/10">
                  <span className="text-[9px] text-white/60 uppercase block">Investimento Total</span>
                  <span className="text-sm font-bold text-white">${totalInvestment.toFixed(2)}</span>
                </div>
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  <span className="text-[9px] uppercase block font-sans font-black">Lucro Total Limpo</span>
                  <span className="text-sm font-black">${totalProjectedProfit.toFixed(2)}</span>
                </div>
              </div>
              <div className="p-3 bg-sky-950/40 border border-sky-500/40 text-sky-200 text-[11px] leading-relaxed">
                🚚 <strong>Frete Amortizado:</strong> Bastam <strong>{piecesToBreakEvenFreight} peças vendidas</strong> para pagar os ${freightNum.toFixed(2)} do frete integralmente! As outras {Math.max(0, piecesNum - piecesToBreakEvenFreight)} peças serão puro lucro.
              </div>
            </div>

            {/* Checkbox de Lançamento e Botão de Salvar */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs uppercase text-white/90">
                <input
                  type="checkbox"
                  checked={registerAsExpense}
                  onChange={(e) => setRegisterAsExpense(e.target.checked)}
                  className="mt-0.5 accent-gold w-4 h-4"
                />
                <span className="text-[11px] leading-tight">
                  Lançar automaticamente como despesa no Fluxo de Caixa (Confecção: ${clothesNum.toFixed(2)} + Frete: ${freightNum.toFixed(2)})
                </span>
              </label>

              <button
                type="button"
                onClick={handleSavePurchase}
                disabled={saving}
                className="w-full py-4 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>GRAVANDO COMPRA...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SALVAR COMPRA & PREÇOS NO HISTÓRICO</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HISTÓRICO DE COMPRAS & LOTES SALVOS */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-deep-black pb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gold" />
              <span>HISTÓRICO DE COMPRAS DE ROUPAS & PRECIFICAÇÕES ({clothingPurchases.length})</span>
            </h3>
            <p className="text-[10px] text-deep-black/60 uppercase mt-0.5 font-medium">
              Consulte os lotes que você já comprou, o custo real de cada um e os preços sugeridos.
            </p>
          </div>
        </div>

        {clothingPurchases.length === 0 ? (
          <div className="p-8 text-center text-xs text-deep-black/50 font-bold uppercase space-y-2 border-2 border-dashed border-deep-black/10">
            <Package className="w-8 h-8 mx-auto text-gold mb-1" />
            <p>Nenhuma compra de lote gravada ainda.</p>
            <p className="text-[10px] text-deep-black/40">
              Preencha os dados acima e clique em "SALVAR COMPRA & PREÇOS NO HISTÓRICO".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black text-white text-[10px] font-black">
                <tr>
                  <th className="p-3">DATA</th>
                  <th className="p-3">FORNECEDOR</th>
                  <th className="p-3 text-center">PEÇAS</th>
                  <th className="p-3">ROUPAS ($)</th>
                  <th className="p-3">FRETE ($)</th>
                  <th className="p-3">CUSTO REAL / PEÇA</th>
                  <th className="p-3">PREÇO SUGERIDO</th>
                  <th className="p-3">LUCRO PROJETADO</th>
                  <th className="p-3 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {clothingPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-deep-black/5 transition font-mono">
                    <td className="p-3 font-bold text-deep-black whitespace-nowrap">{p.date}</td>
                    <td className="p-3 font-sans font-bold text-deep-black">{p.supplier || 'Confecção'}</td>
                    <td className="p-3 text-center font-bold text-deep-black">{p.totalPieces} un</td>
                    <td className="p-3 text-green-700 font-bold">${p.clothesAmount.toFixed(2)}</td>
                    <td className="p-3 text-sky-700 font-bold">${p.freightAmount.toFixed(2)}</td>
                    <td className="p-3 font-black text-deep-black">
                      ${p.totalCostPerPiece.toFixed(2)}
                      <span className="text-[9px] text-deep-black/50 block font-normal">
                        (fábrica ${p.unitCostAverage.toFixed(2)} + frete ${p.freightPerPiece.toFixed(2)})
                      </span>
                    </td>
                    <td className="p-3 font-black text-gold">
                      ${p.suggestedSalePrice.toFixed(2)}
                      <span className="text-[9px] text-deep-black/60 block font-normal">
                        ({p.markupMultiplier.toFixed(1)}x custo)
                      </span>
                    </td>
                    <td className="p-3 font-black text-emerald-600">
                      +${p.totalProjectedProfit.toFixed(2)}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadPurchaseToCalculator(p)}
                          className="px-2.5 py-1 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[10px] font-black uppercase transition font-sans"
                          title="Carregar na calculadora"
                        >
                          Carregar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePurchase(p.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
