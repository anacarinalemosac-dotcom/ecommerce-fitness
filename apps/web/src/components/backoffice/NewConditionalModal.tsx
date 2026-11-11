'use client';

import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Plus,
  Trash2,
  Calendar,
  User,
  Phone,
  MapPin,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  Printer,
  Sparkles,
} from 'lucide-react';
import { generateConditionalDispatchWhatsAppMessage, printConditionalReceipt } from '@/lib/whatsappMessages';

interface NewConditionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products?: any[];
  sellers?: any[];
}

export function NewConditionalModal({
  isOpen,
  onClose,
  onSuccess,
  products = [],
  sellers = [],
}: NewConditionalModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [sellerName, setSellerName] = useState('Ana Karina');
  
  // Prazo de devolução (Padrão 3 dias à frente)
  const getDefaultReturnDate = (daysAhead: number = 3) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const [returnDate, setReturnDate] = useState(() => getDefaultReturnDate(3));
  const [notes, setNotes] = useState('');
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // Itens na mala condicional
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [createdConditional, setCreatedConditional] = useState<any | null>(null);

  if (!isOpen) return null;

  // Filtragem dos produtos do catálogo (sem limite artificial — permite rolar e ver todos)
  const filteredProducts = (products || []).filter((p) => {
    if (!searchProductQuery.trim()) return true;
    const q = searchProductQuery.toLowerCase().trim();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.colorName && p.colorName.toLowerCase().includes(q)) ||
      (Array.isArray(p.variants) &&
        p.variants.some(
          (v: any) =>
            (v.sku || '').toLowerCase().includes(q) ||
            (v.color || '').toLowerCase().includes(q)
        ))
    );
  });

  // Adicionar produto à mala
  const handleAddItem = (prod: any, variant?: any) => {
    const sku = variant?.sku || prod.sku || `ITEM-${Date.now().toString().slice(-4)}`;
    const size = variant?.size || prod.sizes?.[0] || 'M';
    const color = variant?.color || prod.colorName || prod.colors?.[0]?.name || 'Preto Ônix';
    const unitPrice = Number(variant?.price || prod.price || 39.90);
    const costPrice = Number(variant?.cost_price || prod.costPrice || 15.00);
    const image = variant?.images?.[0] || prod.primaryImage || '';

    // Se já estiver na lista, apenas incrementa a quantidade
    const existingIndex = selectedItems.findIndex((it) => it.sku === sku && it.size === size && it.color === color);
    if (existingIndex >= 0) {
      setSelectedItems((prev) =>
        prev.map((it, idx) => (idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it))
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          title: prod.title,
          sku,
          size,
          color,
          unit_price: unitPrice,
          cost_price: costPrice,
          quantity: 1,
          image,
        },
      ]);
    }
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setSelectedItems((prev) => prev.map((it, i) => (i === index ? { ...it, quantity: newQty } : it)));
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPieces = selectedItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const totalValue = selectedItems.reduce(
    (acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setFeedback({ type: 'error', message: 'Digite o nome da cliente.' });
      return;
    }
    if (selectedItems.length === 0) {
      setFeedback({ type: 'error', message: 'Selecione ao menos 1 peça para a mala condicional.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || undefined,
        customer_address: customerAddress.trim() || undefined,
        seller_name: sellerName.trim() || 'Ana Karina',
        expected_return_date: returnDate,
        notes: notes.trim() || undefined,
        items: selectedItems,
      };

      const res = await fetch('/api/backoffice/conditionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao registrar condicional.');
      }

      setCreatedConditional(data.conditional);
      setFeedback({
        type: 'success',
        message: `✓ Mala Condicional #${data.conditional.conditional_number} registrada com sucesso! Peças reservadas e estoque atualizado.`,
      });
      onSuccess();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao salvar mala condicional.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!createdConditional) return;
    const msg = generateConditionalDispatchWhatsAppMessage(createdConditional);
    const cleanPhone = String(customerPhone || '').replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;
    if (fullPhone) {
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-deep-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-4 border-gold w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-deep-black text-white p-4 sm:p-5 border-b-2 border-gold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center border border-gold">
              <ShoppingBag className="w-5 h-5 text-gold" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MALA CONDICIONAL • ENVIO PARA PROVAR EM CASA</span>
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                NOVA CONDICIONAL / CONIGNAÇÃO
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Feedback visual */}
        {feedback && (
          <div
            className={`p-3.5 text-xs font-bold flex items-center justify-between gap-2 border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-400'
                : 'bg-red-50 text-red-950 border-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            {feedback.type === 'success' && createdConditional && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 border border-green-800 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>MANDAR WHATSAPP</span>
                </button>
                <button
                  type="button"
                  onClick={() => printConditionalReceipt(createdConditional)}
                  className="px-3 py-1 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>IMPRIMIR FICHA</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Corpo do formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* SEÇÃO 1: DADOS DA CLIENTE & VENDEDORA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-deep-black/5 p-4 border border-deep-black/20">
            {/* Nome da Cliente */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
                <User className="w-3 h-3 text-gold" />
                <span>Nome da Cliente *</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Patrícia Lima"
                className="w-full p-2.5 border-2 border-deep-black text-xs font-bold focus:outline-none focus:border-gold bg-white uppercase"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
                <Phone className="w-3 h-3 text-gold" />
                <span>WhatsApp / Celular</span>
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ex: (978) 555-0192"
                className="w-full p-2.5 border-2 border-deep-black text-xs font-mono font-bold focus:outline-none focus:border-gold bg-white"
              />
            </div>

            {/* Vendedora Responsável */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
                <span>Vendedora Responsável</span>
              </label>
              <select
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full p-2.5 border-2 border-deep-black text-xs font-bold focus:outline-none focus:border-gold bg-white"
              >
                <option value="Ana Karina">Ana Karina (Showroom)</option>
                {(sellers || []).map((s: any) => (
                  <option key={s.id || s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Endereço / Local de Entrega da Mala */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gold" />
                <span>Endereço / Local Onde a Mala Foi Deixada (Opcional)</span>
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Ex: Entregue no Salão da Maria, Fitchburg / Rua Central 123"
                className="w-full p-2 border-2 border-deep-black text-xs font-medium focus:outline-none focus:border-gold bg-white"
              />
            </div>

            {/* Prazo de Devolução */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-600" />
                  <span>Devolução Prevista *</span>
                </span>
                <span className="text-[9px] text-deep-black/60 font-bold">Atalhos rápidos:</span>
              </label>
              <div className="flex gap-1 mb-1">
                <button
                  type="button"
                  onClick={() => setReturnDate(getDefaultReturnDate(2))}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-gold hover:text-deep-black text-[9px] font-black border border-deep-black/30"
                >
                  2d
                </button>
                <button
                  type="button"
                  onClick={() => setReturnDate(getDefaultReturnDate(3))}
                  className="px-2 py-0.5 bg-gold text-deep-black text-[9px] font-black border border-deep-black shadow-2xs"
                >
                  3d (Padrão)
                </button>
                <button
                  type="button"
                  onClick={() => setReturnDate(getDefaultReturnDate(5))}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-gold hover:text-deep-black text-[9px] font-black border border-deep-black/30"
                >
                  5d
                </button>
                <button
                  type="button"
                  onClick={() => setReturnDate(getDefaultReturnDate(7))}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-gold hover:text-deep-black text-[9px] font-black border border-deep-black/30"
                >
                  7d
                </button>
              </div>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full p-2 border-2 border-deep-black text-xs font-mono font-bold focus:outline-none focus:border-gold bg-white"
              />
            </div>
          </div>

          {/* SEÇÃO 2: SELEÇÃO DE PEÇAS PARA A MALA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-gold" />
                <span>PEÇAS INCLUÍDAS NA MALA ({totalPieces} itens selecionados)</span>
              </span>
              <span className="text-xs font-mono font-black text-deep-black">
                VALOR TOTAL: <strong className="text-gold bg-deep-black px-2 py-0.5">${totalValue.toFixed(2)} USD</strong>
              </span>
            </div>

            {/* Lista dos Itens Já Adicionados */}
            {selectedItems.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-deep-black/30 text-center bg-gray-50 space-y-1">
                <ShoppingBag className="w-8 h-8 text-deep-black/30 mx-auto" />
                <p className="text-xs font-bold text-deep-black/70 uppercase">
                  Nenhuma peça adicionada à mala ainda.
                </p>
                <p className="text-[10px] text-deep-black/50">
                  Pesquise no catálogo abaixo e clique em "+ Adicionar à Mala" para incluir os looks que a cliente vai provar.
                </p>
              </div>
            ) : (
              <div className="border-2 border-deep-black divide-y divide-deep-black/20 max-h-56 overflow-y-auto bg-white">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-10 h-10 object-cover border border-deep-black/20" />
                      ) : (
                        <div className="w-10 h-10 bg-gold/20 flex items-center justify-center font-black text-xs text-deep-black border">
                          FIT
                        </div>
                      )}
                      <div>
                        <span className="font-black text-xs text-deep-black block">{item.title}</span>
                        <span className="text-[10px] font-mono text-gold font-bold">
                          {item.color} • TAM {item.size} • SKU: {item.sku}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Quantidade */}
                      <div className="flex items-center border border-deep-black">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                          className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 font-black text-xs"
                        >
                          -
                        </button>
                        <span className="px-2.5 font-mono font-bold text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                          className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 font-black text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Preço */}
                      <div className="text-right min-w-[70px]">
                        <span className="font-mono font-black text-xs text-deep-black block">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                        <span className="text-[9px] text-deep-black/50 font-mono">
                          (${item.unit_price.toFixed(2)}/un)
                        </span>
                      </div>

                      {/* Botão Remover */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-red-600 hover:text-red-800 transition"
                        title="Remover peça da mala"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SELETOR RÁPIDO DO CATÁLOGO DE PRODUTOS */}
            <div className="border border-deep-black/30 p-3 bg-gray-50 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                    Catálogo Completo ({filteredProducts.length} de {(products || []).length} produtos — role a barrinha para ver todos):
                  </span>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-deep-black/50 absolute left-2 top-2.5" />
                  <input
                    type="text"
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    placeholder="Buscar nome, cor, modelo ou SKU..."
                    className="w-full pl-7 pr-12 py-1.5 border border-deep-black/30 text-xs focus:outline-none focus:border-gold bg-white"
                  />
                  {searchProductQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchProductQuery('')}
                      className="absolute right-1.5 top-1 text-[9px] font-black uppercase px-1.5 py-0.5 bg-deep-black/10 hover:bg-deep-black hover:text-white transition"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Grid rolável com TODOS os produtos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1.5 p-0.5">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-6 text-center space-y-2">
                    <p className="text-xs font-bold uppercase text-deep-black/50">
                      Nenhum produto encontrado para &ldquo;{searchProductQuery}&rdquo;.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchProductQuery('')}
                      className="px-3 py-1 bg-deep-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-gold hover:text-deep-black transition"
                    >
                      Mostrar Todos os {(products || []).length} Produtos
                    </button>
                  </div>
                ) : (
                  filteredProducts.map((prod: any) => {
                    const hasVars = Array.isArray(prod.variants) && prod.variants.length > 0;
                    const totalStock = hasVars
                      ? prod.variants.reduce((acc: number, v: any) => acc + Math.max(0, Number(v.stock_quantity ?? v.stock ?? 0)), 0)
                      : Math.max(0, Number(prod.stock ?? 0));
                    return (
                      <div
                        key={prod.id}
                        className="p-2 bg-white border border-deep-black/20 hover:border-gold flex items-center justify-between gap-2 transition"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {prod.primaryImage ? (
                            <img src={prod.primaryImage} alt={prod.title} className="w-10 h-11 object-cover shrink-0 border border-deep-black/10" />
                          ) : (
                            <div className="w-10 h-11 bg-gold/20 shrink-0" />
                          )}
                          <div className="overflow-hidden">
                            <span className="font-bold text-[11px] text-deep-black block truncate" title={prod.title}>
                              {prod.title}
                            </span>
                            <span className="font-mono text-[9.5px] text-gold font-bold block">
                              ${Number(prod.price || 39.90).toFixed(2)} USD • <span className={totalStock > 0 ? 'text-emerald-700' : 'text-red-600'}>{totalStock} un</span>
                            </span>
                            {prod.sku && (
                              <span className="font-mono text-[8.5px] text-deep-black/50 block truncate">
                                {prod.sku}
                              </span>
                            )}
                          </div>
                        </div>

                        {hasVars ? (
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAddItem(prod, prod.variants[0])}
                              className="px-2 py-1 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[9px] font-black uppercase tracking-wider border border-deep-black transition shadow-xs cursor-pointer"
                            >
                              + ADD
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddItem(prod)}
                            className="px-2 py-1 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[9px] font-black uppercase tracking-wider border border-deep-black transition shadow-xs cursor-pointer shrink-0"
                          >
                            + ADD
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Observações da Mala */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
              Observações Internas da Mala (Ex: Mala rosa com zíper, deixar na recepção, provar com amigas):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Digite qualquer observação relevante..."
              className="w-full p-2 border-2 border-deep-black text-xs font-medium focus:outline-none focus:border-gold bg-white"
            />
          </div>

          {/* Rodapé com Botões de Ação */}
          <div className="pt-3 border-t border-deep-black/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-mono text-deep-black">
              <span className="font-black">Resumo da Mala: </span>
              <span>
                {totalPieces} peças • Valor Total: <strong>${totalValue.toFixed(2)} USD</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-white hover:bg-gray-100 text-deep-black border-2 border-deep-black font-black text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="px-5 py-2.5 bg-gold hover:bg-deep-black hover:text-gold text-deep-black border-2 border-deep-black font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>REGISTRANDO MALA...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>CRIAR MALA CONDICIONAL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
