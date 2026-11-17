'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  RefreshCw,
  Search,
  Check,
  CheckCircle2,
  Package,
  AlertCircle,
  MessageCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Layers,
  ChevronDown,
} from 'lucide-react';

export interface SwapOrderItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  itemIndex: number;
  itemToSwap: any;
  catalogProducts: any[];
  onSwapSuccess: (updatedOrder: any) => void;
}

export function SwapOrderItemModal({
  isOpen,
  onClose,
  order,
  itemIndex,
  itemToSwap,
  catalogProducts,
  onSwapSuccess,
}: SwapOrderItemModalProps) {
  if (!isOpen || !order || !itemToSwap) return null;

  const orderId = order.order_id || order.id || 'PEDIDO';
  const customerName = order.customer_name || 'Cliente';
  const customerPhone = order.customer_phone || order.shipping_address?.customer_phone || '';
  const cleanPhone = String(customerPhone).replace(/\D/g, '');
  const waPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;

  // Estados de Busca e Seleção
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);

  // Modo Manual (caso seja uma peça sob medida ou produto não catalogado)
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualSize, setManualSize] = useState('M');
  const [manualColor, setManualColor] = useState('');
  const [manualSku, setManualSku] = useState('');
  const [manualPrice, setManualPrice] = useState(String(itemToSwap.unit_price || 40));
  const [manualCost, setManualCost] = useState(String(itemToSwap.cost_price || 12));

  // Opções da Troca
  const [adjustStock, setAdjustStock] = useState(true);
  const [keepOriginalPrice, setKeepOriginalPrice] = useState(true);
  const [customNotes, setCustomNotes] = useState('Peça fora de estoque • Troca combinada com cliente');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swapResult, setSwapResult] = useState<{
    success: boolean;
    oldItem: any;
    newItem: any;
    waMessage: string;
  } | null>(null);

  // Lista de Categorias Únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalogProducts.forEach((p) => {
      const cat = (p.categories?.name || p.category || p.subcategory || '').toString().trim().toUpperCase();
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [catalogProducts]);

  // Produtos Filtrados
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return catalogProducts.filter((p: any) => {
      // Ignora produtos rascunho invisíveis
      if (p.is_draft || p.title?.startsWith('__')) return false;

      const titleMatch = (p.title || '').toLowerCase().includes(term);
      const skuMatch = (p.general_sku || '').toLowerCase().includes(term) ||
        (Array.isArray(p.variants) && p.variants.some((v: any) => (v.sku || '').toLowerCase().includes(term)));
      const colorMatch = (p.colors || []).some((c: any) => (c.name || '').toLowerCase().includes(term)) ||
        (Array.isArray(p.variants) && p.variants.some((v: any) => (v.color || '').toLowerCase().includes(term)));

      const matchesSearch = !term || titleMatch || skuMatch || colorMatch;

      const productCat = (p.categories?.name || p.category || p.subcategory || '').toString().trim().toUpperCase();
      const matchesCategory = selectedCategory === 'ALL' || productCat === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [catalogProducts, searchTerm, selectedCategory]);

  const handleSelectProduct = (prod: any) => {
    setSelectedProduct(prod);
    const variants = Array.isArray(prod.variants) && prod.variants.length > 0 ? prod.variants : [];
    // Tenta selecionar variante com mesmo tamanho da peça original ou a primeira disponível
    const sameSize = variants.find(
      (v: any) => (v.size || '').toUpperCase() === (itemToSwap.size || '').toUpperCase() && (Number(v.stock_quantity) > 0 || v.stock_quantity === undefined)
    );
    setSelectedVariant(sameSize || variants[0] || null);
  };

  const handleConfirmSwap = async () => {
    let newItemPayload: any = null;

    if (isManualMode) {
      if (!manualTitle.trim()) {
        alert('Por favor, informe o nome da nova peça.');
        return;
      }
      newItemPayload = {
        title: manualTitle.trim(),
        size: manualSize.trim(),
        color: manualColor.trim() || 'Padrão',
        sku: manualSku.trim().toUpperCase() || `ITEM-${Date.now().toString().slice(-4)}`,
        image: itemToSwap.image || '',
        unit_price: Number(manualPrice) || Number(itemToSwap.unit_price) || 40,
        cost_price: Number(manualCost) || Number(itemToSwap.cost_price) || 12,
        quantity: Number(itemToSwap.quantity) || 1,
      };
    } else {
      if (!selectedProduct) {
        alert('Por favor, selecione uma peça de substituição no catálogo.');
        return;
      }

      const img =
        selectedVariant?.image ||
        (Array.isArray(selectedVariant?.images) ? selectedVariant.images[0] : null) ||
        selectedProduct.primary_image ||
        selectedProduct.primaryImage ||
        (Array.isArray(selectedProduct.images) ? selectedProduct.images[0] : '') ||
        '';

      newItemPayload = {
        title: selectedProduct.title,
        size: selectedVariant?.size || 'M',
        color: selectedVariant?.color || 'Padrão',
        sku: selectedVariant?.sku || selectedProduct.general_sku || `ANA-${Date.now().toString().slice(-4)}`,
        image: img,
        unit_price: Number(selectedProduct.price) || Number(itemToSwap.unit_price) || 40,
        cost_price: Number(selectedProduct.cost_price || selectedVariant?.cost_price || 12),
        quantity: Number(itemToSwap.quantity) || 1,
        variant_id: selectedVariant?.id,
        product_id: selectedProduct.id,
      };
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/backoffice/sales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'swap_item',
          order_id: orderId,
          item_index: itemIndex,
          new_item: newItemPayload,
          adjust_stock: adjustStock,
          keep_original_price: keepOriginalPrice,
          reason: 'Falta de estoque / Troca combinada com cliente',
          custom_notes: customNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao realizar a troca da peça.');
      }

      // Mensagem pré-formatada para WhatsApp da cliente
      const oldTitle = `${itemToSwap.title || 'Peça Fitness'} (${itemToSwap.size || 'Tam Padrão'} • ${itemToSwap.color || 'Padrão'})`;
      const newTitle = `${newItemPayload.title} (${newItemPayload.size} • ${newItemPayload.color})`;

      const waMsg = `Olá *${customerName}*! 🥰 Tudo bem? Aqui é a Ana da *ANA Fitness Wear*! 💕

Passando com muito carinho para te confirmar que já atualizamos o seu pedido *#${orderId}* com a nova peça que combinamos:

❌ *Substituído:* ~${oldTitle}~
✅ *Novo Conjunto:* ✨ *${newTitle}*

A sua peça já está separada na arara e estamos cuidadosamente preparando e embalando o seu pedido para envio! 📦✨

Assim que a caixinha for postada nos Correios (USPS), você receberá o código de rastreio para acompanhar cada passo da entrega.

Muito obrigada pela compreensão e carinho! Se precisar de qualquer coisa, é só me chamar por aqui. Tenha um dia maravilhoso! 💕✨`;

      setSwapResult({
        success: true,
        oldItem: itemToSwap,
        newItem: newItemPayload,
        waMessage: waMsg,
      });

      if (data.order) {
        onSwapSuccess(data.order);
      }
    } catch (err: any) {
      alert(`Falha na troca: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!swapResult) return;
    const encoded = encodeURIComponent(swapResult.waMessage);
    const url = waPhone
      ? `https://wa.me/${waPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 animate-fadeIn backdrop-blur-xs">
      <div className="bg-white border-4 border-deep-black max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 bg-deep-black text-white border-b-2 border-gold flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-deep-black flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-stone-900 px-2 py-0.5 border border-gold/40">
                  SUBSTITUIÇÃO DE ITEM
                </span>
                <span className="font-mono font-black text-xs text-white">#{orderId}</span>
              </div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white mt-0.5">
                TROCAR PEÇA DO PEDIDO • {customerName}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl font-bold p-1 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* TELA DE SUCESSO PÓS-TROCA */}
        {swapResult ? (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="p-5 bg-emerald-50 border-2 border-emerald-600 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-base font-black uppercase text-emerald-950 tracking-wider">
                PEÇA SUBSTITUÍDA COM SUCESSO NO PEDIDO!
              </h4>
              <p className="text-xs text-emerald-900 font-medium">
                O pedido #{orderId} foi atualizado no banco de dados e o estoque foi recalculado.
              </p>
            </div>

            {/* Comparativo Visual da Troca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 border-2 border-red-300 space-y-2">
                <span className="text-[10px] font-black uppercase text-red-800 block">❌ PEÇA REMOVIDA (SEM ESTOQUE):</span>
                <div className="flex items-center gap-3">
                  {swapResult.oldItem.image && (
                    <img
                      src={swapResult.oldItem.image}
                      alt={swapResult.oldItem.title}
                      className="w-12 h-16 object-cover rounded border border-red-300 opacity-60"
                    />
                  )}
                  <div className="min-w-0">
                    <strong className="text-xs text-deep-black uppercase block truncate line-through">
                      {swapResult.oldItem.title}
                    </strong>
                    <span className="text-[10px] text-deep-black/60 font-mono block">
                      Tam: {swapResult.oldItem.size} • Cor: {swapResult.oldItem.color}
                    </span>
                    <span className="text-[9px] font-mono text-red-700 bg-red-100 px-1 py-0.5 mt-0.5 inline-block">
                      SKU: {swapResult.oldItem.sku}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border-2 border-emerald-500 space-y-2">
                <span className="text-[10px] font-black uppercase text-emerald-800 block">✨ NOVA PEÇA INCLUÍDA:</span>
                <div className="flex items-center gap-3">
                  {swapResult.newItem.image && (
                    <img
                      src={swapResult.newItem.image}
                      alt={swapResult.newItem.title}
                      className="w-12 h-16 object-cover rounded border border-emerald-400"
                    />
                  )}
                  <div className="min-w-0">
                    <strong className="text-xs text-deep-black uppercase block truncate">
                      {swapResult.newItem.title}
                    </strong>
                    <span className="text-[10px] text-deep-black/70 font-mono block">
                      Tam: <strong className="text-deep-black">{swapResult.newItem.size}</strong> • Cor: <strong className="text-deep-black">{swapResult.newItem.color}</strong>
                    </span>
                    <span className="text-[9px] font-mono text-emerald-900 bg-emerald-100 px-1 py-0.5 mt-0.5 inline-block font-bold">
                      SKU: {swapResult.newItem.sku}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ação 1-Clique WhatsApp */}
            <div className="p-4 bg-emerald-100/70 border-2 border-emerald-600 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-700" />
                  <strong className="text-xs font-black uppercase text-emerald-950">
                    AVISAR A CLIENTE NO WHATSAPP COM 1 CLIQUE
                  </strong>
                </div>
                <span className="text-[9px] font-mono bg-emerald-700 text-white font-bold px-2 py-0.5 uppercase">
                  CONFIRMAÇÃO PRONTA
                </span>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-snug">
                Clique no botão abaixo para abrir o WhatsApp da cliente com a mensagem carinhosa já preenchida confirmando a nova peça.
              </p>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>ABRIR WHATSAPP E ENVIAR CONFIRMAÇÃO DA TROCA</span>
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-deep-black/10">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                CONCLUIR E FECHAR
              </button>
            </div>
          </div>
        ) : (
          /* CORPO DO FORMULÁRIO DE TROCA */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* 1. Item Atual (Que será substituído) */}
            <div className="p-3.5 bg-neutral-50 border-2 border-deep-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {itemToSwap.image ? (
                  <img
                    src={itemToSwap.image}
                    alt={itemToSwap.title}
                    className="w-14 h-18 object-cover rounded border-2 border-red-400 shrink-0 bg-neutral-100"
                  />
                ) : (
                  <div className="w-14 h-18 rounded border-2 border-dashed border-red-300 bg-red-50 shrink-0 flex items-center justify-center text-[9px] font-bold text-red-600">
                    SEM FOTO
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-900 border border-red-300 text-[9px] font-black uppercase font-mono">
                      ❌ PEÇA EM FALTA (SERÁ TROCADA)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-deep-black/60">
                      Item #{itemIndex + 1} do Pedido
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-deep-black uppercase truncate mt-0.5">
                    {itemToSwap.title || 'Peça Fitness'}
                  </h4>
                  <div className="text-[11px] text-deep-black/70 font-mono mt-0.5">
                    Tamanho: <strong className="text-deep-black">{itemToSwap.size || 'M'}</strong> • Cor: <strong className="text-deep-black">{itemToSwap.color || 'Padrão'}</strong> • Qtd: <strong className="text-deep-black">{itemToSwap.quantity || 1}x</strong>
                  </div>
                  {itemToSwap.sku && (
                    <span className="text-[9px] font-mono text-deep-black/50 block mt-0.5">
                      SKU Original: {itemToSwap.sku}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex sm:flex-col items-end justify-between sm:justify-center gap-1 border-t sm:border-t-0 sm:border-l border-deep-black/10 pt-2 sm:pt-0 sm:pl-4">
                <span className="text-[9px] uppercase font-bold text-deep-black/50">Valor no Pedido:</span>
                <strong className="text-base font-black font-mono text-deep-black">
                  ${(Number(itemToSwap.unit_price) || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Alternador: Selecionar do Catálogo vs Cadastro Manual */}
            <div className="flex items-center justify-between border-b-2 border-deep-black pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
                  ESCOLHA A NOVA PEÇA DE SUBSTITUIÇÃO:
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsManualMode(!isManualMode)}
                className="text-[10px] font-black uppercase text-deep-black underline hover:text-gold transition cursor-pointer"
              >
                {isManualMode ? '← Escolher do Catálogo' : '+ Digitar Peça Sob Medida Manualmente'}
              </button>
            </div>

            {isManualMode ? (
              /* MODO MANUAL (SOB MEDIDA) */
              <div className="p-4 bg-neutral-50 border-2 border-deep-black space-y-3 animate-fadeIn">
                <div className="p-2 bg-amber-100 border border-amber-300 text-[10.5px] text-amber-950 font-bold">
                  ✍️ Modo Manual: use para peças sob medida do ateliê ou modelos exclusivos que não constam na vitrine online.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-deep-black">Nome da Nova Peça *</label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="Ex: Conjunto Bicolor Terracota & Bege"
                      className="w-full p-2 border-2 border-deep-black text-xs font-bold uppercase focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-deep-black">Cor / Variação</label>
                    <input
                      type="text"
                      value={manualColor}
                      onChange={(e) => setManualColor(e.target.value)}
                      placeholder="Ex: Terracota com Bege"
                      className="w-full p-2 border-2 border-deep-black text-xs uppercase focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-deep-black">Tamanho</label>
                    <select
                      value={manualSize}
                      onChange={(e) => setManualSize(e.target.value)}
                      className="w-full p-2 border-2 border-deep-black text-xs font-bold uppercase bg-white focus:outline-none focus:border-gold"
                    >
                      <option value="P">Tamanho P</option>
                      <option value="M">Tamanho M</option>
                      <option value="G">Tamanho G</option>
                      <option value="GG">Tamanho GG</option>
                      <option value="One Size">One Size (Tamanho Único)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-deep-black">SKU (Opcional)</label>
                    <input
                      type="text"
                      value={manualSku}
                      onChange={(e) => setManualSku(e.target.value)}
                      placeholder="Ex: CONJ-TER-M"
                      className="w-full p-2 border-2 border-deep-black text-xs font-mono uppercase focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* MODO CATÁLOGO AO VIVO */
              <div className="space-y-3">
                {/* Barra de Filtros e Busca */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-deep-black/50 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome (ex: azul, bordo, chocolate), cor ou SKU..."
                      className="w-full pl-9 pr-3 py-2 text-xs border-2 border-deep-black bg-white uppercase font-bold focus:outline-none focus:border-gold"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-2 text-deep-black/40 hover:text-deep-black text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-2 border-2 border-deep-black text-xs font-black uppercase bg-white focus:outline-none focus:border-gold sm:w-48"
                  >
                    <option value="ALL">TODAS CATEGORIAS ({catalogProducts.length})</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade de Produtos Disponíveis */}
                <div className="border-2 border-deep-black max-h-60 overflow-y-auto divide-y divide-deep-black/10 bg-white">
                  {filteredProducts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-deep-black/60 font-bold">
                      Nenhum produto encontrado com o termo "{searchTerm}". Tente outra busca ou use o modo manual.
                    </div>
                  ) : (
                    filteredProducts.map((p: any) => {
                      const isChosen = selectedProduct?.id === p.id;
                      const pImg = p.primary_image || p.primaryImage || (Array.isArray(p.images) ? p.images[0] : '');
                      const variants = Array.isArray(p.variants) ? p.variants : [];
                      const totalStock = variants.reduce((s: number, v: any) => s + (Number(v.stock_quantity) || 0), 0);

                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className={`p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition ${
                            isChosen ? 'bg-amber-100/70 border-l-4 border-amber-600' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {pImg ? (
                              <img
                                src={pImg}
                                alt={p.title}
                                className="w-11 h-14 object-cover rounded border border-deep-black/20 shrink-0 bg-neutral-100"
                              />
                            ) : (
                              <div className="w-11 h-14 rounded border border-deep-black/20 shrink-0 bg-neutral-100 flex items-center justify-center text-[8px] font-bold">
                                PEÇA
                              </div>
                            )}
                            <div className="min-w-0">
                              <strong className="text-xs text-deep-black uppercase block truncate">
                                {p.title}
                              </strong>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] font-mono font-bold text-deep-black">
                                  ${Number(p.price || 40).toFixed(2)} USD
                                </span>
                                <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 border ${
                                  totalStock > 0
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                    : 'bg-stone-100 text-stone-700 border-stone-300'
                                }`}>
                                  Estoque Total: {totalStock} peças
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isChosen ? (
                              <span className="px-2.5 py-1 bg-amber-600 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>SELECIONADO</span>
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-neutral-100 text-deep-black/70 hover:bg-deep-black hover:text-white font-black text-[9px] uppercase tracking-wider transition">
                                ESCOLHER ESTE
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Seleção de Tamanho e Cor da Peça Escolhida */}
                {selectedProduct && (
                  <div className="p-3.5 bg-amber-50/80 border-2 border-amber-500 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-950 tracking-wider">
                        TAMANHO & VARIANTE DA NOVA PEÇA:
                      </span>
                      <span className="text-[10px] font-mono text-amber-900 font-bold">
                        {selectedProduct.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(selectedProduct.variants || []).map((v: any, vIdx: number) => {
                        const isVarSelected = selectedVariant?.id === v.id || selectedVariant?.sku === v.sku;
                        const stock = Number(v.stock_quantity) || 0;
                        const hasStock = stock > 0;

                        return (
                          <button
                            key={v.id || vIdx}
                            type="button"
                            onClick={() => setSelectedVariant(v)}
                            className={`p-2 border-2 transition text-left cursor-pointer ${
                              isVarSelected
                                ? 'bg-deep-black text-white border-deep-black shadow'
                                : hasStock
                                ? 'bg-white text-deep-black border-amber-400 hover:border-deep-black'
                                : 'bg-neutral-100 text-deep-black/50 border-deep-black/20'
                            }`}
                          >
                            <div className="text-xs font-black uppercase">
                              Tam: {v.size || 'M'} • {v.color || 'Padrão'}
                            </div>
                            <div className={`text-[9px] font-mono font-bold mt-0.5 ${
                              isVarSelected
                                ? 'text-gold'
                                : hasStock
                                ? 'text-emerald-700'
                                : 'text-stone-500'
                            }`}>
                              {hasStock ? `✓ ${stock} em estoque` : '⚠️ 0 em estoque'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Opções e Regras da Troca */}
            <div className="p-4 bg-neutral-50 border-2 border-deep-black space-y-3 text-xs">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-deep-black/70 block">
                CONFIGURAÇÕES DA TROCA:
              </span>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-deep-black select-none">
                <input
                  type="checkbox"
                  checked={adjustStock}
                  onChange={(e) => setAdjustStock(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
                <span>Dar baixa de 1 unidade no estoque desta nova peça selecionada</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-deep-black select-none">
                <input
                  type="checkbox"
                  checked={keepOriginalPrice}
                  onChange={(e) => setKeepOriginalPrice(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
                <span>Manter o valor total original do pedido (Não altera o que a cliente já pagou)</span>
              </label>

              <div className="space-y-1 pt-1">
                <label className="text-[9px] font-bold uppercase text-deep-black/60 block">
                  Observação Interna no Histórico do Pedido:
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Ex: Cliente aceitou trocar por este modelo via WhatsApp"
                  className="w-full p-2 border border-deep-black/30 bg-white text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rodapé com Botões de Ação */}
        {!swapResult && (
          <div className="p-4 bg-neutral-100 border-t-2 border-deep-black/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-deep-black/70 font-medium">
              A peça antiga será substituída pela nova com registro seguro no pedido e no estoque.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-white hover:bg-neutral-200 text-deep-black border border-deep-black text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmSwap}
                disabled={isSubmitting || (!isManualMode && !selectedProduct)}
                className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-deep-black text-xs font-black uppercase tracking-wider transition shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'SALVANDO TROCA...' : 'CONFIRMAR TROCA DE PEÇA'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
