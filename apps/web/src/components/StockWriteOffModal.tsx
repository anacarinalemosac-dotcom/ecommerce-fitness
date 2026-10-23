'use client';

import React, { useState, useEffect } from 'react';
import {
  PackageMinus,
  Sparkles,
  User,
  ShoppingBag,
  Gift,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  ScanBarcode,
  X,
  FileText,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Layers,
  Calendar,
} from 'lucide-react';

interface WriteOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: any) => void;
  catalogProducts: any[];
  initialTab?: 'NEW' | 'HISTORY';
}

interface SelectedItem {
  variant_id?: string;
  product_id?: string;
  sku: string;
  title: string;
  color: string;
  size: string;
  currentStock: number;
  quantity: number;
  costPrice: number;
  image?: string;
}

export function StockWriteOffModal({
  isOpen,
  onClose,
  onSuccess,
  catalogProducts = [],
  initialTab = 'NEW',
}: WriteOffModalProps) {
  const [reason, setReason] = useState<
    'OWNER_PERSONAL_USE' | 'SELLER_SAMPLE' | 'GIFT_MARKETING' | 'DEFECT_DAMAGE' | 'INVENTORY_ADJUSTMENT'
  >('OWNER_PERSONAL_USE');

  const [beneficiary, setBeneficiary] = useState('Ana Carina (Proprietária)');
  const [sellersList, setSellersList] = useState<any[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [notes, setNotes] = useState('');
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split('T')[0]);
  const [skipStockDecrement, setSkipStockDecrement] = useState(false);

  // Busca e seleção de peças
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);

  // Lista de itens no carrinho de saída
  const [itemsToWithdraw, setItemsToWithdraw] = useState<SelectedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sub-tabs internas do modal (Nova Retirada vs Histórico)
  const [activeModalTab, setActiveModalTab] = useState<'NEW' | 'HISTORY'>(initialTab);
  const [writeOffHistory, setWriteOffHistory] = useState<any[]>([]);
  const [historySummary, setHistorySummary] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/backoffice/inventory/write-off');
      if (res.ok) {
        const data = await res.json();
        setWriteOffHistory(data.writeOffs || []);
        setHistorySummary(data.summary || null);
      }
    } catch (err) {
      console.warn('Erro ao carregar histórico de saídas:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteWriteOff = async (item: any) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja cancelar a saída ${item.document_number} (${item.beneficiary_name} - $${(item.total_cost_value || 0).toFixed(2)})?\nA despesa correspondente também será removida do financeiro da loja.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `/api/backoffice/inventory/write-off?id=${item.id}&document_number=${item.document_number}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        await fetchHistory();
        onSuccess(null);
      }
    } catch (err) {
      console.error('Erro ao excluir saída:', err);
    }
  };

  // Carrega lista de vendedoras ativas e histórico
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await fetch('/api/backoffice/sellers');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.sellers)) {
            setSellersList(data.sellers);
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar vendedoras:', e);
      }
    };
    if (isOpen) {
      setActiveModalTab(initialTab);
      fetchSellers();
      fetchHistory();
      setErrorMessage('');
    }
  }, [isOpen, initialTab]);

  // Atualiza beneficiário quando o motivo mudar
  const handleReasonChange = (newReason: any) => {
    setReason(newReason);
    if (newReason === 'OWNER_PERSONAL_USE') {
      setBeneficiary('Ana Carina (Proprietária)');
      setSelectedSellerId('');
    } else if (newReason === 'SELLER_SAMPLE') {
      if (sellersList.length > 0) {
        setBeneficiary(`${sellersList[0].name} (Vendedora)`);
        setSelectedSellerId(sellersList[0].id);
      } else {
        setBeneficiary('Vendedora Parceira');
      }
    } else if (newReason === 'GIFT_MARKETING') {
      setBeneficiary('Parceria / Influencer / VIP');
      setSelectedSellerId('');
    } else if (newReason === 'DEFECT_DAMAGE') {
      setBeneficiary('Descarte / Avaria de Fábrica');
      setSelectedSellerId('');
    } else if (newReason === 'INVENTORY_ADJUSTMENT') {
      setBeneficiary('Ajuste de Auditoria de Estoque');
      setSelectedSellerId('');
    }
  };

  const handleSellerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSellerId(id);
    const found = sellersList.find((s) => s.id === id);
    if (found) {
      setBeneficiary(`${found.name} (Vendedora - ${found.coupon_code})`);
    }
  };

  // Helper para obter variações mesmo em produtos legados
  const getProductVariants = (prod: any) => {
    if (!prod) return [];
    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
      return prod.variants;
    }
    const sizes = Array.isArray(prod.sizes) && prod.sizes.length > 0 ? prod.sizes : ['U'];
    return sizes.map((s: string) => ({
      id: `${prod.id || 'prod'}-${s}`,
      sku: `${prod.sku || prod.title?.slice(0, 3) || 'FIT'}-${s}`.toUpperCase(),
      color: prod.colorName || 'Padrão',
      size: s,
      stock_quantity: prod.stock ?? 10,
      cost_price: prod.costPrice ?? 16.0,
      images: prod.primaryImage ? [prod.primaryImage] : [],
    }));
  };

  // Produtos filtrados para seleção
  const filteredProducts = catalogProducts.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (p.title || '').toLowerCase().includes(q);
    const skuMatch = (p.sku || '').toLowerCase().includes(q);
    const variants = getProductVariants(p);
    const variantMatch = variants.some(
      (v: any) => (v.sku || '').toLowerCase().includes(q) || (v.color || '').toLowerCase().includes(q)
    );
    return titleMatch || skuMatch || variantMatch;
  });

  const handleAddItem = () => {
    if (!selectedProduct || !selectedVariant) return;

    const existingIdx = itemsToWithdraw.findIndex((i) => i.sku === selectedVariant.sku);
    const qty = Math.max(1, selectedQty);

    if (existingIdx !== -1) {
      const updated = [...itemsToWithdraw];
      updated[existingIdx].quantity += qty;
      setItemsToWithdraw(updated);
    } else {
      setItemsToWithdraw([
        ...itemsToWithdraw,
        {
          variant_id: selectedVariant.id,
          product_id: selectedProduct.id,
          sku: selectedVariant.sku || `${selectedProduct.title?.slice(0, 3) || 'FIT'}-${selectedVariant.size}`,
          title: selectedProduct.title,
          color: selectedVariant.color || 'Padrão',
          size: selectedVariant.size || 'M',
          currentStock: Number(selectedVariant.stock_quantity ?? selectedVariant.stock ?? 0),
          quantity: qty,
          costPrice: Number(selectedVariant.cost_price ?? selectedProduct.costPrice ?? 16.0),
          image: selectedVariant.images?.[0] || selectedProduct.primaryImage,
        },
      ]);
    }

    // Reset seleção temporária
    setSelectedVariant(null);
    setSelectedQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setItemsToWithdraw(itemsToWithdraw.filter((_, i) => i !== index));
  };

  const totalCost = itemsToWithdraw.reduce((acc, i) => acc + i.costPrice * i.quantity, 0);
  const totalPieces = itemsToWithdraw.reduce((acc, i) => acc + i.quantity, 0);

  const handleSubmitWriteOff = async () => {
    if (itemsToWithdraw.length === 0) {
      setErrorMessage('Adicione ao menos uma peça para dar saída no estoque.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/backoffice/inventory/write-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          beneficiary_name: beneficiary,
          seller_id: selectedSellerId || undefined,
          notes,
          date: withdrawalDate,
          skip_stock_decrement: skipStockDecrement,
          items: itemsToWithdraw.map((i) => ({
            variant_id: i.variant_id,
            product_id: i.product_id,
            sku: i.sku,
            title: i.title,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
            cost_price: i.costPrice,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar baixa de estoque');
      }

      onSuccess(data.record);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao registrar saída de estoque.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-2 border-deep-black w-full max-w-4xl max-h-[92vh] flex flex-col shadow-luxury overflow-hidden">
        {/* Header Superior */}
        <div className="p-5 bg-deep-black text-white border-b-2 border-gold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold text-deep-black">
              <PackageMinus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                ERP BACKOFFICE • CONTROLE DE ESTOQUE
              </span>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                BAIXA DE ESTOQUE SEM CUSTO (USO PRÓPRIO / MOSTRUÁRIO VENDEDORA)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Sub-Tabs do Modal */}
        <div className="bg-deep-black/95 px-6 border-b border-gold/30 flex items-center justify-between text-xs font-black uppercase tracking-wider">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveModalTab('NEW')}
              className={`py-3 flex items-center gap-2 border-b-2 transition ${
                activeModalTab === 'NEW'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <PackageMinus className="w-4 h-4" />
              <span>REGISTRAR NOVA RETIRADA</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveModalTab('HISTORY');
                fetchHistory();
              }}
              className={`py-3 flex items-center gap-2 border-b-2 transition ${
                activeModalTab === 'HISTORY'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>HISTÓRICO DE SAÍDAS ({writeOffHistory.length})</span>
            </button>
          </div>

          {activeModalTab === 'HISTORY' && (
            <button
              type="button"
              onClick={fetchHistory}
              className="text-[10px] text-gold hover:text-white flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
              <span>ATUALIZAR</span>
            </button>
          )}
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border-2 border-red-500 text-red-900 font-bold uppercase flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeModalTab === 'NEW' ? (
            <>
              {/* 1. SELEÇÃO DO MOTIVO DA RETIRADA */}
              <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>1. MOTIVO DA SAÍDA DE ESTOQUE:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleReasonChange('OWNER_PERSONAL_USE')}
                className={`p-3 text-left border-2 transition space-y-1 ${
                  reason === 'OWNER_PERSONAL_USE'
                    ? 'border-deep-black bg-deep-black text-white'
                    : 'border-deep-black/20 text-deep-black hover:border-gold bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase tracking-wider text-xs">👑 USO PRÓPRIO</span>
                  {reason === 'OWNER_PERSONAL_USE' && <CheckCircle2 className="w-4 h-4 text-gold" />}
                </div>
                <p className="text-[10px] opacity-80 uppercase leading-snug">
                  Retirada pessoal da proprietária (Ana Carina).
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleReasonChange('SELLER_SAMPLE')}
                className={`p-3 text-left border-2 transition space-y-1 ${
                  reason === 'SELLER_SAMPLE'
                    ? 'border-deep-black bg-deep-black text-white'
                    : 'border-deep-black/20 text-deep-black hover:border-gold bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase tracking-wider text-xs">🛍️ MOSTRUÁRIO VENDEDORA</span>
                  {reason === 'SELLER_SAMPLE' && <CheckCircle2 className="w-4 h-4 text-gold" />}
                </div>
                <p className="text-[10px] opacity-80 uppercase leading-snug">
                  Peças entregues para vendedora demonstrar sem custo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleReasonChange('GIFT_MARKETING')}
                className={`p-3 text-left border-2 transition space-y-1 ${
                  reason === 'GIFT_MARKETING'
                    ? 'border-deep-black bg-deep-black text-white'
                    : 'border-deep-black/20 text-deep-black hover:border-gold bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase tracking-wider text-xs">🎁 BRINDE / MARKETING</span>
                  {reason === 'GIFT_MARKETING' && <CheckCircle2 className="w-4 h-4 text-gold" />}
                </div>
                <p className="text-[10px] opacity-80 uppercase leading-snug">
                  Parceria com influenciadora, fotos ou brinde VIP.
                </p>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleReasonChange('DEFECT_DAMAGE')}
                className={`p-2.5 text-left border transition flex items-center justify-between ${
                  reason === 'DEFECT_DAMAGE'
                    ? 'border-deep-black bg-deep-black text-white'
                    : 'border-deep-black/20 text-deep-black hover:border-gold bg-white'
                }`}
              >
                <span className="font-black uppercase tracking-wider text-[11px]">⚠️ AVARIA / DEFEITO DE FÁBRICA</span>
                {reason === 'DEFECT_DAMAGE' && <CheckCircle2 className="w-3.5 h-3.5 text-gold" />}
              </button>

              <button
                type="button"
                onClick={() => handleReasonChange('INVENTORY_ADJUSTMENT')}
                className={`p-2.5 text-left border transition flex items-center justify-between ${
                  reason === 'INVENTORY_ADJUSTMENT'
                    ? 'border-deep-black bg-deep-black text-white'
                    : 'border-deep-black/20 text-deep-black hover:border-gold bg-white'
                }`}
              >
                <span className="font-black uppercase tracking-wider text-[11px]">🔄 AJUSTE DE CONTAGEM FÍSICA</span>
                {reason === 'INVENTORY_ADJUSTMENT' && <CheckCircle2 className="w-3.5 h-3.5 text-gold" />}
              </button>
            </div>

            {/* Aviso Contábil */}
            <div className="p-2.5 bg-gold/10 border border-gold/40 text-[10.5px] font-bold text-deep-black uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>✓ Toda retirada reduz o estoque físico e é lançada automaticamente como DESPESA no Financeiro a preço de custo contábil.</span>
            </div>
          </div>

          {/* 2. DADOS DO BENEFICIÁRIO & VENDEDORA */}
          <div className="p-4 bg-gray-50 border border-deep-black/20 space-y-3">
            <h4 className="font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold" />
              <span>2. QUEM ESTÁ RETIRANDO / RECEBENDO AS PEÇAS:</span>
            </h4>

            {/* Data da Retirada e Campos Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-deep-black/70 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span>DATA DA RETIRADA:</span>
                </label>
                <input
                  type="date"
                  value={withdrawalDate}
                  onChange={(e) => setWithdrawalDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-deep-black/30 bg-white"
                  title="Permite lançar retiradas feitas em datas passadas"
                />
              </div>

              {reason === 'SELLER_SAMPLE' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-deep-black/70">
                      VENDEDORA CADASTRADA:
                    </label>
                    <select
                      value={selectedSellerId}
                      onChange={handleSellerSelect}
                      className="w-full px-3 py-2 text-xs uppercase border border-deep-black/30 bg-white font-bold"
                    >
                      {sellersList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Cupom: {s.coupon_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-deep-black/70">
                      NOME NO REGISTRO:
                    </label>
                    <input
                      type="text"
                      value={beneficiary}
                      onChange={(e) => setBeneficiary(e.target.value)}
                      className="w-full px-3 py-2 text-xs uppercase border border-deep-black/30 bg-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-deep-black/70">
                      RESPONSÁVEL PELA RETIRADA:
                    </label>
                    <input
                      type="text"
                      value={beneficiary}
                      onChange={(e) => setBeneficiary(e.target.value)}
                      className="w-full px-3 py-2 text-xs uppercase border border-deep-black/30 bg-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-deep-black/70">
                      OBSERVAÇÃO / JUSTIFICATIVA (OPCIONAL):
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: 2 peças para aula inaugural / uso pessoal"
                      className="w-full px-3 py-2 text-xs uppercase border border-deep-black/30 bg-white"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Caixa de Lançamento Retroativo */}
            <label className="flex items-start gap-2.5 p-3 bg-amber-50 border-2 border-amber-300 cursor-pointer hover:bg-amber-100/60 transition">
              <input
                type="checkbox"
                checked={skipStockDecrement}
                onChange={(e) => setSkipStockDecrement(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-deep-black text-white"
              />
              <div className="space-y-0.5">
                <span className="text-[11px] font-black uppercase text-amber-950 block">
                  Lançamento Retroativo: Peças já retiradas fisicamente no passado
                </span>
                <span className="text-[10px] text-amber-900/80 block leading-tight font-medium">
                  Marque esta opção se você já baixou fisicamente essas peças antes da nova configuração. O sistema lançará a despesa financeira na data escolhida <strong>SEM debitar o estoque atual novamente</strong>.
                </span>
              </div>
            </label>
          </div>

          {/* 3. SELEÇÃO DE PEÇAS NO ESTOQUE */}
          <div className="space-y-3">
            <h4 className="font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-gold" />
              <span>3. SELECIONAR PEÇAS PARA SAÍDA DE ESTOQUE:</span>
            </h4>

            {/* Campo de Busca Rápida */}
            <div className="relative">
              <Search className="w-4 h-4 text-deep-black/40 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="PESQUISAR PRODUTO POR NOME OU SKU..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs uppercase border border-deep-black/20 focus:border-deep-black"
              />
            </div>

            {/* Seletor de Produto e Variantes */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50 p-4 border border-deep-black/15">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[10px] font-black uppercase text-deep-black/70">PRODUTO:</label>
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const prod = catalogProducts.find((p) => p.id === e.target.value);
                    setSelectedProduct(prod || null);
                    const vars = getProductVariants(prod);
                    setSelectedVariant(vars?.[0] || null);
                  }}
                  className="w-full px-3 py-2 text-xs uppercase border border-deep-black/30 bg-white"
                >
                  <option value="">Selecione o produto...</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-[10px] font-black uppercase text-deep-black/70">VARIAÇÃO (COR & TAM):</label>
                <select
                  disabled={!selectedProduct}
                  value={selectedVariant?.id || selectedVariant?.sku || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const vars = getProductVariants(selectedProduct);
                    const v = vars.find((x: any) => x.id === val || x.sku === val);
                    setSelectedVariant(v || null);
                  }}
                  className="w-full px-3 py-2 text-xs uppercase border border-deep-black/30 bg-white disabled:opacity-50 font-mono"
                >
                  <option value="">Selecione o tamanho/cor...</option>
                  {getProductVariants(selectedProduct).map((v: any, idx: number) => (
                    <option key={v.id || idx} value={v.id || v.sku}>
                      {v.color} • Tam {v.size} (Estoque: {v.stock_quantity ?? v.stock ?? 0} un) - SKU: {v.sku}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 space-y-1">
                <label className="text-[10px] font-black uppercase text-deep-black/70">QTD:</label>
                <input
                  type="number"
                  min="1"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-2 text-xs font-mono font-bold text-center border border-deep-black/30 bg-white"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  disabled={!selectedVariant}
                  onClick={handleAddItem}
                  className="w-full py-2 bg-deep-black hover:bg-gold text-white hover:text-deep-black disabled:opacity-50 text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADICIONAR</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. LISTA DE PEÇAS NO CARRINHO DE SAÍDA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-2">
              <h4 className="font-black uppercase tracking-wider text-deep-black">
                4. PEÇAS SELECIONADAS PARA RETIRADA ({itemsToWithdraw.length} ITENS):
              </h4>
              <span className="text-[10px] text-deep-black/60 font-bold uppercase">
                O estoque será debitado no Supabase automaticamente
              </span>
            </div>

            {itemsToWithdraw.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-deep-black/20 text-center space-y-1 text-deep-black/50">
                <PackageMinus className="w-8 h-8 mx-auto text-gold/60" />
                <p className="font-bold uppercase tracking-wider">Nenhuma peça adicionada ainda.</p>
                <p className="text-[10px] uppercase">Selecione os produtos acima para compor a lista de saída.</p>
              </div>
            ) : (
              <div className="border border-deep-black/20 overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-deep-black text-white uppercase text-[9px] font-black tracking-wider">
                    <tr>
                      <th className="p-2.5">Item / SKU</th>
                      <th className="p-2.5">Tamanho</th>
                      <th className="p-2.5">Cor</th>
                      <th className="p-2.5 text-center">Estoque Atual</th>
                      <th className="p-2.5 text-center">Qtd Saída</th>
                      <th className="p-2.5 text-center">Novo Estoque</th>
                      <th className="p-2.5 text-right">Custo Unit.</th>
                      <th className="p-2.5 text-right">Custo Total</th>
                      <th className="p-2.5 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-deep-black/10 font-medium">
                    {itemsToWithdraw.map((item, idx) => {
                      const newStock = Math.max(0, item.currentStock - item.quantity);
                      return (
                        <tr key={idx} className="hover:bg-gold/5 transition">
                          <td className="p-2.5">
                            <span className="font-black uppercase text-deep-black block">{item.title}</span>
                            <span className="font-mono text-[9px] text-deep-black/60 font-bold">{item.sku}</span>
                          </td>
                          <td className="p-2.5 font-bold font-mono text-deep-black">{item.size}</td>
                          <td className="p-2.5 uppercase text-deep-black/80">{item.color}</td>
                          <td className="p-2.5 text-center font-mono text-deep-black/60">{item.currentStock} un</td>
                          <td className="p-2.5 text-center font-black font-mono text-red-600 bg-red-50">
                            -{item.quantity} un
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-green-700 bg-green-50">
                            {newStock} un
                          </td>
                          <td className="p-2.5 text-right font-mono text-deep-black/70">
                            ${item.costPrice.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-gold">
                            ${(item.costPrice * item.quantity).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Remover da lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 5. RESUMO DE CUSTO & IMPACTO */}
          {itemsToWithdraw.length > 0 && (
            <div className="p-4 bg-deep-black text-white border-2 border-gold flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  RESUMO DA MOVIMENTAÇÃO DE SAÍDA
                </span>
                <p className="text-xs uppercase text-white/80">
                  Total de <strong>{totalPieces} peça(s)</strong> baixada(s) • Cobrança ao beneficiário: <strong className="text-gold">$0.00</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-white/60 font-bold uppercase block">
                  CUSTO ABSORVIDO PELA EMPRESA:
                </span>
                <span className="text-xl font-black text-gold font-mono">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Cards de Resumo Consolidado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-deep-black/5 border border-deep-black/20 space-y-1">
              <span className="text-[10px] font-black uppercase text-deep-black/60 block">DOCUMENTOS GERADOS</span>
              <p className="text-xl font-black text-deep-black font-mono">
                {historySummary?.totalDocuments ?? writeOffHistory.length}
              </p>
              <span className="text-[9px] text-deep-black/50 uppercase font-bold">Saídas registradas</span>
            </div>

            <div className="p-4 bg-deep-black/5 border border-deep-black/20 space-y-1">
              <span className="text-[10px] font-black uppercase text-deep-black/60 block">TOTAL PEÇAS BAIXADAS</span>
              <p className="text-xl font-black text-red-600 font-mono">
                -{historySummary?.totalItemsWithdrawn ?? 0} un
              </p>
              <span className="text-[9px] text-deep-black/50 uppercase font-bold">Estoque físico debitado</span>
            </div>

            <div className="p-4 bg-deep-black text-white border-2 border-gold space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase text-gold block">CUSTO TOTAL ABSORVIDO</span>
              <p className="text-xl font-black text-gold font-mono">
                ${(historySummary?.totalCostValue ?? 0).toFixed(2)}
              </p>
              <span className="text-[9px] text-white/60 uppercase font-bold">Investimento / despesa operacional</span>
            </div>
          </div>

          {/* Tabela do Histórico */}
          <div className="border border-deep-black/20 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-[11px] uppercase tracking-wider">
              <thead className="bg-deep-black text-white text-[9px] font-black">
                <tr>
                  <th className="p-3">DOC # / DATA</th>
                  <th className="p-3">MOTIVO DA SAÍDA</th>
                  <th className="p-3">BENEFICIÁRIO</th>
                  <th className="p-3">PEÇAS & GRADE</th>
                  <th className="p-3 text-center">TOTAL PEÇAS</th>
                  <th className="p-3 text-right">CUSTO ABSORVIDO</th>
                  <th className="p-3 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {writeOffHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-deep-black/50 font-bold">
                      Nenhuma saída de estoque registrada ainda.
                    </td>
                  </tr>
                ) : (
                  writeOffHistory.map((item) => (
                    <tr key={item.id || item.document_number} className="hover:bg-gold/5 transition">
                      <td className="p-3 font-mono font-bold text-deep-black">
                        <span className="block">{item.document_number}</span>
                        <span className="text-[9px] text-deep-black/50 font-normal">
                          {new Date(item.date ? item.date + 'T12:00:00' : item.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-1.5 py-0.5 text-[8px] font-black border bg-gold/20 text-deep-black border-gold/40">
                          {item.reason_label || item.reason}
                        </span>
                        {item.skip_stock_decrement && (
                          <span className="inline-block ml-1 px-1 py-0.5 text-[7.5px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            RETROATIVO
                          </span>
                        )}
                        {item.notes && (
                          <span className="text-[9px] text-deep-black/60 block mt-0.5 italic">
                            "{item.notes}"
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-deep-black">
                        {item.beneficiary_name}
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5 max-w-xs">
                          {(item.items || []).map((it: any, itIdx: number) => (
                            <div key={itIdx} className="text-[10px]">
                              <span className="font-bold text-deep-black">{it.title}</span>
                              <span className="text-gold font-bold ml-1 font-mono">
                                ({it.color} • {it.size}) ×{it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-black text-red-600">
                        -{item.total_items_count} un
                      </td>
                      <td className="p-3 text-right font-mono font-black text-gold">
                        ${(item.total_cost_value || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteWriteOff(item)}
                          className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 transition"
                          title="Cancelar saída de estoque e estornar despesa no financeiro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

    {/* Rodapé de Ações */}
    <div className="p-4 bg-gray-50 border-t-2 border-deep-black flex items-center justify-between">
      {activeModalTab === 'NEW' ? (
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-deep-black text-deep-black hover:bg-deep-black hover:text-white text-xs font-black uppercase tracking-wider transition"
          >
            CANCELAR
          </button>

          <button
            type="button"
            disabled={isSubmitting || itemsToWithdraw.length === 0}
            onClick={handleSubmitWriteOff}
            className="px-6 py-2.5 bg-deep-black hover:bg-gold text-white hover:text-deep-black disabled:opacity-50 text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-luxury"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                <span>DEBITANDO ESTOQUE NO SUPABASE...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-gold" />
                <span>CONFIRMAR SAÍDA DE {totalPieces} PEÇA(S)</span>
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-deep-black text-deep-black hover:bg-deep-black hover:text-white text-xs font-black uppercase tracking-wider transition"
          >
            FECHAR
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('NEW')}
            className="px-6 py-2.5 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-luxury"
          >
            <PackageMinus className="w-4 h-4 text-gold" />
            <span>+ REGISTRAR NOVA SAÍDA</span>
          </button>
        </>
      )}
    </div>
  </div>
</div>
  );
}
