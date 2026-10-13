'use client';

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Package,
  Receipt,
  User,
  DollarSign,
  Calendar,
  Check,
  RefreshCw,
  Ban,
} from 'lucide-react';

interface CancelSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  onSuccess: () => void;
}

export function CancelSaleModal({
  isOpen,
  onClose,
  sale,
  onSuccess,
}: CancelSaleModalProps) {
  const [restoreStock, setRestoreStock] = useState(true);
  const [cancelCommission, setCancelCommission] = useState(true);
  const [reason, setReason] = useState('Cliente solicitou cancelamento');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !sale) return null;

  const isAlreadyCancelled = sale.status === 'CANCELLED';
  const totalAmount = (Number(sale.subtotal_products || 0) + Number(sale.shipping_fee || 0) - Number(sale.discount_amount || 0)).toFixed(2);
  const commission = Number(sale.commission_amount || 0).toFixed(2);

  // 1. Confirmar Cancelamento (muda status para CANCELLED e estorna estoque/comissão)
  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/backoffice/sales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_sale',
          order_id: sale.order_id || sale.id,
          id: sale.id,
          restore_stock: restoreStock,
          cancel_commission: cancelCommission,
          cancellation_reason: reason.trim() || 'Cancelado pelo lojista no Backoffice',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao cancelar venda.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao cancelar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Excluir Permanentemente do Banco de Dados
  const handlePermanentDelete = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const orderId = sale.order_id || sale.id;
      const res = await fetch(`/api/backoffice/sales?order_id=${encodeURIComponent(orderId)}&restore_stock=${restoreStock}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao excluir registro de venda.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao excluir registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-4 border-red-600 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-red-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <Ban className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-200">
                GESTÃO OPERACIONAL DE VENDAS
              </span>
              <h2 className="text-lg font-black uppercase tracking-wider text-white">
                {isAlreadyCancelled ? 'VENDA JÁ CANCELADA' : 'CANCELAR VENDA'} #{sale.order_id}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-100 border-2 border-red-500 text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dados Resumidos da Venda */}
          <div className="bg-deep-black/5 border border-deep-black/20 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-deep-black/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/60">
                CLIENTE:
              </span>
              <span className="font-black text-deep-black uppercase">
                {sale.customer_name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/60">
                CANAL / FORMA PGTO:
              </span>
              <span className="font-bold text-deep-black font-mono">
                {sale.channel === 'ONLINE' ? 'LOJA ONLINE' : 'PDV BALCÃO'} • {sale.payment_method}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/60">
                VALOR TOTAL:
              </span>
              <span className="font-black text-base text-deep-black font-mono">
                ${totalAmount} USD
              </span>
            </div>

            {Number(commission) > 0 && (
              <div className="flex items-center justify-between text-gold">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  COMISSÃO VENDEDORA ({sale.seller_name}):
                </span>
                <span className="font-bold font-mono">
                  ${commission} USD
                </span>
              </div>
            )}
          </div>

          {/* Lista de Peças Vendidas */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-gold" />
              <span>PEÇAS INCLUÍDAS NESTA VENDA ({sale.items?.length || 0}):</span>
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1 border border-deep-black/15 p-2 bg-white">
              {(sale.items || []).map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs p-1.5 hover:bg-gray-50 border-b last:border-0 border-gray-100">
                  <div className="font-bold text-deep-black">
                    {it.title}{' '}
                    <span className="text-[10px] font-mono text-gold font-normal">
                      ({it.color || 'Preto'} • TAM {it.size})
                    </span>
                  </div>
                  <span className="font-mono font-black text-xs text-deep-black">
                    ×{it.quantity} un.
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Opções de Cancelamento */}
          {!isAlreadyCancelled && (
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2.5 p-3 bg-green-50 border border-green-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restoreStock}
                  onChange={(e) => setRestoreStock(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-700 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-black text-green-900 uppercase block">
                    Devolver peças ao estoque físico (estornar inventário)
                  </span>
                  <span className="text-[11px] text-green-800">
                    A quantidade vendida retornará automaticamente para o estoque do produto no catálogo.
                  </span>
                </div>
              </label>

              {Number(commission) > 0 && (
                <label className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cancelCommission}
                    onChange={(e) => setCancelCommission(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-amber-700 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-black text-amber-950 uppercase block">
                      Anular comissão da vendedora (${commission} USD)
                    </span>
                    <span className="text-[11px] text-amber-800">
                      O saldo a pagar da vendedora será ajustado para não pagar comissão sobre venda cancelada.
                    </span>
                  </div>
                </label>
              )}

              {/* Motivo do Cancelamento */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                  Motivo do Cancelamento:
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Cliente desistiu, erro de digitação no PDV, troca..."
                  className="w-full p-2.5 border-2 border-deep-black text-xs focus:outline-none focus:border-red-600 font-medium"
                />
              </div>
            </div>
          )}

          {isAlreadyCancelled && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-900 text-xs">
              <span className="font-black uppercase block">Esta venda já foi cancelada.</span>
              {sale.cancellation_reason && (
                <span className="text-[11px] block mt-1">
                  Motivo registrado: <em>"{sale.cancellation_reason}"</em>
                </span>
              )}
            </div>
          )}

          {/* Opção de Exclusão Permanente */}
          {showDeleteConfirm && (
            <div className="p-4 bg-red-950 text-white space-y-3 border-2 border-red-600 animate-fadeIn">
              <div className="flex items-center gap-2 text-gold font-black text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>ATENÇÃO: EXCLUSÃO PERMANENTE</span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Esta ação apagará permanentemente o pedido <strong>#{sale.order_id}</strong> do banco de dados e do histórico. Esta ação não poderá ser desfeita.
              </p>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handlePermanentDelete}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>SIM, EXCLUIR DEFINITIVAMENTE</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-deep-black border-t-2 border-deep-black flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[10px] font-black uppercase text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
                title="Excluir completamente o registro caso seja venda teste"
              >
                <Trash2 className="w-3 h-3" />
                <span>Excluir registro permanentemente</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-white/30 hover:border-white text-white font-black text-xs uppercase tracking-wider transition"
            >
              Fechar
            </button>

            {!isAlreadyCancelled && (
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>CANCELANDO...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>CONFIRMAR CANCELAMENTO</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
