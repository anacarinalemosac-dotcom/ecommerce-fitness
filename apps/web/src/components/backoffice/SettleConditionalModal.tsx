'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  RotateCcw,
  DollarSign,
  CreditCard,
  Banknote,
  QrCode,
  RefreshCw,
  MessageCircle,
  Receipt,
  User,
  Sparkles,
} from 'lucide-react';
import { generateConditionalSettlementWhatsAppMessage, formatPaymentMethodLabel } from '@/lib/whatsappMessages';

interface SettleConditionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  conditional: any;
  onSuccess: () => void;
}

export function SettleConditionalModal({
  isOpen,
  onClose,
  conditional,
  onSuccess,
}: SettleConditionalModalProps) {
  // Inicializa o estado dos itens com cada peça como 'ficou' ou 'devolveu'
  const [itemsDecision, setItemsDecision] = useState<any[]>(() => {
    if (!conditional?.items) return [];
    return conditional.items.map((it: any) => ({
      ...it,
      kept_quantity: it.kept_quantity !== undefined ? it.kept_quantity : it.quantity,
      returned_quantity: it.returned_quantity !== undefined ? it.returned_quantity : 0,
    }));
  });

  const [paymentMethod, setPaymentMethod] = useState<'ZELLE' | 'CARD' | 'CASH' | 'VENMO' | 'CREDIARIO'>('ZELLE');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [settledResult, setSettledResult] = useState<any | null>(null);

  if (!isOpen || !conditional) return null;

  // Ações em massa:
  const handleKeepAll = () => {
    setItemsDecision((prev) =>
      prev.map((it) => ({
        ...it,
        kept_quantity: it.quantity,
        returned_quantity: 0,
      }))
    );
  };

  const handleReturnAll = () => {
    setItemsDecision((prev) =>
      prev.map((it) => ({
        ...it,
        kept_quantity: 0,
        returned_quantity: it.quantity,
      }))
    );
  };

  // Ajuste individual
  const handleSetKept = (index: number, kept: number) => {
    setItemsDecision((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const validKept = Math.max(0, Math.min(it.quantity, kept));
        return {
          ...it,
          kept_quantity: validKept,
          returned_quantity: it.quantity - validKept,
        };
      })
    );
  };

  // Cálculos financeiros
  const totalKeptPieces = itemsDecision.reduce((acc, it) => acc + (Number(it.kept_quantity) || 0), 0);
  const totalReturnedPieces = itemsDecision.reduce((acc, it) => acc + (Number(it.returned_quantity) || 0), 0);
  const subtotalKeptValue = itemsDecision.reduce(
    (acc, it) => acc + (Number(it.kept_quantity) || 0) * (Number(it.unit_price) || 0),
    0
  );
  const discountVal = Math.max(0, parseFloat(discountAmount) || 0);
  const finalTotalToPay = Math.max(0, subtotalKeptValue - discountVal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/backoffice/conditionals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settle',
          conditional_id: conditional.id || conditional.conditional_number,
          items: itemsDecision,
          payment_method: paymentMethod,
          discount_amount: discountVal,
          settlement_notes: settlementNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao realizar acerto da condicional.');
      }

      setSettledResult(data);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao processar acerto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!conditional) return;
    const keptList = itemsDecision.filter((it) => (it.kept_quantity || 0) > 0);
    const retList = itemsDecision.filter((it) => (it.returned_quantity || 0) > 0);
    const msg = generateConditionalSettlementWhatsAppMessage(
      conditional,
      keptList,
      retList,
      finalTotalToPay,
      paymentMethod
    );
    const cleanPhone = String(conditional.customer_phone || '').replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;
    if (fullPhone) {
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-deep-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-4 border-gold w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-deep-black text-white p-4 sm:p-5 border-b-2 border-gold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center border border-gold">
              <RotateCcw className="w-5 h-5 text-gold" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                FECHAMENTO & BAIXA OPERACIONAL
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                ACERTO DA MALA #{conditional.conditional_number}
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

        {/* Mensagem de sucesso após finalizar */}
        {settledResult ? (
          <div className="p-6 space-y-5 text-center my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-wider text-deep-black">
                {totalKeptPieces > 0 ? 'VENDA GERADA COM SUCESSO!' : 'MALA 100% DEVOLVIDA AO ESTOQUE!'}
              </h3>
              <p className="text-xs text-deep-black/70 max-w-md mx-auto">
                {settledResult.message}
              </p>
            </div>

            {totalKeptPieces > 0 && (
              <div className="p-4 bg-gold/15 border-2 border-gold max-w-sm mx-auto space-y-1 font-mono">
                <span className="text-[10px] font-bold text-deep-black/70 block uppercase">
                  Pedido Gerado no Sistema:
                </span>
                <span className="text-lg font-black text-deep-black">
                  #{settledResult.sale_order_id}
                </span>
                <span className="text-sm font-black text-green-700 block">
                  Valor Pago: ${finalTotalToPay.toFixed(2)} USD ({formatPaymentMethodLabel(paymentMethod)})
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full sm:w-auto px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>MANDAR RECIBO NO WHATSAPP DA CLIENTE</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-wider transition cursor-pointer"
              >
                CONCLUIR E FECHAR
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-100 border border-red-500 text-red-900 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Resumo da Cliente e Vendedora */}
            <div className="p-3 bg-deep-black/5 border border-deep-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[10px] font-black uppercase text-deep-black/60 block">CLIENTE:</span>
                <span className="font-black text-deep-black uppercase text-sm">
                  {conditional.customer_name}
                </span>
                {conditional.customer_phone && (
                  <span className="text-[10px] font-mono text-deep-black/70 block">
                    📞 {conditional.customer_phone}
                  </span>
                )}
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-black uppercase text-deep-black/60 block">ATENDIMENTO:</span>
                <span className="font-bold text-deep-black">
                  👤 {conditional.seller_name || 'Ana Karina'}
                </span>
                <span className="text-[10px] font-mono text-deep-black/70 block">
                  Total enviado: {conditional.total_items} peças (${Number(conditional.total_value || 0).toFixed(2)})
                </span>
              </div>
            </div>

            {/* SEÇÃO DE ESCOLHA DAS PEÇAS: FICOU OU DEVOLVEU */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4 text-gold" />
                  <span>MARQUE AS PEÇAS QUE A CLIENTE COMPROU OU DEVOLVEU:</span>
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleKeepAll}
                    className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white text-[10px] font-black uppercase tracking-wider transition shadow-2xs cursor-pointer"
                  >
                    ✓ FICOU COM TUDO
                  </button>
                  <button
                    type="button"
                    onClick={handleReturnAll}
                    className="px-2.5 py-1 bg-gray-600 hover:bg-gray-800 text-white text-[10px] font-black uppercase tracking-wider transition shadow-2xs cursor-pointer"
                  >
                    ↩️ DEVOLVEU TUDO
                  </button>
                </div>
              </div>

              {/* Lista dos Itens da Mala */}
              <div className="border-2 border-deep-black divide-y divide-deep-black/20 max-h-60 overflow-y-auto bg-white">
                {itemsDecision.map((item, idx) => {
                  const isKept = (item.kept_quantity || 0) > 0;
                  return (
                    <div
                      key={idx}
                      className={`p-3 flex items-center justify-between gap-3 transition ${
                        isKept ? 'bg-green-50/70' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
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
                          <span className="text-[10px] text-deep-black/60 block font-mono">
                            Preço: ${Number(item.unit_price || 0).toFixed(2)} USD
                          </span>
                        </div>
                      </div>

                      {/* Seletor Ficou / Devolveu */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSetKept(idx, item.quantity)}
                          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1 border transition cursor-pointer ${
                            isKept
                              ? 'bg-green-700 text-white border-green-900 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>FICOU ({item.kept_quantity})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetKept(idx, 0)}
                          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1 border transition cursor-pointer ${
                            !isKept
                              ? 'bg-red-700 text-white border-red-900 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>DEVOLVEU</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO FINANCEIRA DO ACERTO: FORMA DE PAGAMENTO & DESCONTO */}
            {totalKeptPieces > 0 ? (
              <div className="bg-deep-black text-white p-4 space-y-4 border-2 border-gold">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  FECHAMENTO FINANCEIRO DAS PEÇAS COMPRADAS ({totalKeptPieces} PEÇAS)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Forma de Pagamento */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white">
                      Forma de Pagamento:
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full p-2.5 bg-white text-deep-black border-2 border-gold font-bold text-xs uppercase"
                    >
                      <option value="ZELLE">⚡ ZELLE</option>
                      <option value="CARD">💳 CARTÃO DE CRÉDITO / DÉBITO</option>
                      <option value="CASH">💵 DINHEIRO (CASH)</option>
                      <option value="VENMO">📱 VENMO</option>
                      <option value="CREDIARIO">📋 CREDIÁRIO / CARNÊ PRÓPRIO</option>
                    </select>
                  </div>

                  {/* Desconto */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white">
                      Desconto Especial Concedido ($ USD):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 bg-white text-deep-black border-2 border-gold font-mono font-bold text-xs text-right"
                    />
                  </div>
                </div>

                {/* Resumo Final de Valores */}
                <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                  <div className="text-xs space-y-0.5">
                    <span className="text-white/70 block">
                      Subtotal Peças: ${subtotalKeptValue.toFixed(2)} USD
                    </span>
                    {discountVal > 0 && (
                      <span className="text-amber-400 block font-bold">
                        Desconto: -${discountVal.toFixed(2)} USD
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase text-gold block">
                      TOTAL A RECEBER:
                    </span>
                    <span className="font-mono text-2xl font-black text-gold">
                      ${finalTotalToPay.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs font-bold space-y-1">
                <span className="uppercase block font-black">
                  ℹ️ Todas as {totalReturnedPieces} peças foram marcadas como devolvidas.
                </span>
                <span className="text-[11px] font-normal text-amber-900 block">
                  Ao confirmar, todas as peças retornarão automaticamente ao estoque da loja e a condicional será arquivada como Devolvida (sem cobrança).
                </span>
              </div>
            )}

            {/* Observações do Acerto */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                Observações do Acerto (Opcional):
              </label>
              <input
                type="text"
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                placeholder="Ex: Pagou via Zelle na hora, amou o conjunto Monique..."
                className="w-full p-2 border-2 border-deep-black text-xs font-medium focus:outline-none focus:border-gold bg-white"
              />
            </div>

            {/* Botões do Rodapé */}
            <div className="pt-3 border-t border-deep-black/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-mono text-deep-black">
                <span className="font-bold">
                  {totalKeptPieces} compradas • {totalReturnedPieces} devolvidas ao estoque
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
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gold hover:bg-deep-black hover:text-gold text-deep-black border-2 border-deep-black font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>PROCESSANDO ACERTO...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CONFIRMAR ACERTO & DAR BAIXA</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
