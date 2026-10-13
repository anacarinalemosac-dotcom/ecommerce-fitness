'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Receipt,
  FileText,
  Ban,
} from 'lucide-react';

interface SaleItem {
  title: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
}

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  onSaveSuccess: () => void;
}

export function EditSaleModal({
  isOpen,
  onClose,
  sale,
  onSaveSuccess,
}: EditSaleModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [sellerName, setSellerName] = useState('Ana Karina');
  const [status, setStatus] = useState('COMPLETED');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Inicializa os dados quando a venda selecionada mudar
  useEffect(() => {
    if (sale) {
      setCustomerName(sale.customer_name || '');
      setCustomerPhone(sale.customer_phone || '');
      setCustomerEmail(sale.customer_email || '');
      setPaymentMethod((sale.payment_method || 'CASH').toUpperCase());
      const rawSeller = sale.seller_name || '';
      setSellerName(rawSeller.includes('Juliana Silva') ? 'Ana Karina' : (rawSeller || 'Ana Karina'));
      setStatus(sale.status || 'COMPLETED');
      setDiscountAmount(String(sale.discount_amount || 0));
      setNotes(sale.notes || sale.shipping_address?.notes || '');

      // Formata created_at para input datetime-local (YYYY-MM-DDTHH:mm)
      if (sale.created_at) {
        try {
          const d = new Date(sale.created_at);
          // Ajusta timezone local
          const offset = d.getTimezoneOffset() * 60000;
          const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);
          setCreatedAt(localISOTime);
        } catch (_) {
          setCreatedAt(new Date().toISOString().slice(0, 16));
        }
      } else {
        setCreatedAt(new Date().toISOString().slice(0, 16));
      }

      if (Array.isArray(sale.items) && sale.items.length > 0) {
        setItems(
          sale.items.map((it: any) => ({
            title: it.title || 'Peça Fitness',
            size: it.size || 'One Size',
            color: it.color || 'Preto Ônix',
            sku: it.sku || 'ANA-ITEM',
            quantity: Number(it.quantity) || 1,
            unit_price: it.unit_price !== undefined && it.unit_price !== null ? Number(it.unit_price) : 44.9,
            cost_price: it.cost_price !== undefined && it.cost_price !== null && !isNaN(Number(it.cost_price))
              ? Number(it.cost_price)
              : 0,
          }))
        );
      } else {
        setItems([
          {
            title: 'Peça Fitness',
            size: 'One Size',
            color: 'Preto',
            sku: 'ANA-PDV-01',
            quantity: 1,
            unit_price: Number(sale.subtotal_products) || 44.9,
            cost_price: 16.0,
          },
        ]);
      }
      setFeedback(null);
    }
  }, [sale]);

  if (!isOpen || !sale) return null;

  // Atalhos de Data (Hoje / Ontem)
  const setDateToToday = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    setCreatedAt(new Date(d.getTime() - offset).toISOString().slice(0, 16));
  };

  const setDateToYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const offset = d.getTimezoneOffset() * 60000;
    setCreatedAt(new Date(d.getTime() - offset).toISOString().slice(0, 16));
  };

  // Manipulação dos Itens
  const handleItemChange = (index: number, field: keyof SaleItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        title: 'Nova Peça Fitness',
        size: 'One Size',
        color: 'Preto Ônix',
        sku: `ITEM-${Date.now().toString().slice(-4)}`,
        quantity: 1,
        unit_price: 39.9,
        cost_price: 15.0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('A venda precisa conter pelo menos 1 item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Cálculos Financeiros
  const subtotalProducts = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
    0
  );
  const totalCostOfGoods = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.cost_price) || 0),
    0
  );
  const discountVal = Math.max(0, Number(discountAmount) || 0);
  const totalAmount = Math.max(0, subtotalProducts - discountVal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setFeedback({ type: 'error', message: 'O nome do cliente é obrigatório.' });
      return;
    }
    if (items.length === 0) {
      setFeedback({ type: 'error', message: 'Adicione pelo menos um item à venda.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      // Converte data local para ISO
      const isoDate = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();

      const payload = {
        action: 'edit_sale',
        order_id: sale.order_id || sale.id,
        id: sale.id,
        created_at: isoDate,
        customer_name: customerName.trim().toUpperCase(),
        customer_phone: customerPhone.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        payment_method: paymentMethod,
        seller_name: sellerName.trim(),
        status,
        discount_amount: discountVal,
        subtotal_products: Number(subtotalProducts.toFixed(2)),
        total_amount: Number(totalAmount.toFixed(2)),
        items,
        notes: notes.trim() || undefined,
      };

      const res = await fetch('/api/backoffice/sales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao salvar alterações da venda.');
      }

      setFeedback({ type: 'success', message: '✓ Venda atualizada com sucesso no banco de dados!' });
      setTimeout(() => {
        onSaveSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao atualizar venda.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSale = async () => {
    if (!confirm(`Deseja realmente cancelar a venda #${sale.order_id}? Os itens serão devolvidos ao estoque e a comissão será anulada.`)) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/backoffice/sales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_sale',
          order_id: sale.order_id || sale.id,
          id: sale.id,
          restore_stock: true,
          cancel_commission: true,
          cancellation_reason: 'Cancelado pelo lojista na tela de edição',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao cancelar venda.');
      }
      setFeedback({ type: 'success', message: '✓ Venda cancelada com sucesso! Peças devolvidas ao estoque.' });
      setTimeout(() => {
        onSaveSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao cancelar venda.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-4 border-gold w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-deep-black text-white p-5 flex items-center justify-between border-b-2 border-gold">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center border border-gold">
              <Edit3 className="w-5 h-5 text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                  EDITAR VENDA PDV • LOJA FÍSICA
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 bg-white/10 text-white border border-white/20">
                  #{sale.order_id || sale.id}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                EDITANDO VENDA DE: {sale.customer_name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-sm transition font-black"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 text-xs font-black uppercase flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-deep-black text-gold border-b-2 border-gold'
                : 'bg-red-50 text-red-700 border-b-2 border-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          </div>
        )}

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs uppercase">
          {/* SEÇÃO 1: DATA E HORÁRIO DA VENDA */}
          <div className="p-4 bg-warm-light/25 border-2 border-deep-black space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-[10px] font-black tracking-wider text-deep-black flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gold" />
                <span>Data e Horário da Venda (Ajustar para Ontem ou Hoje) *</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={setDateToYesterday}
                  className="px-2.5 py-1 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[9px] font-black tracking-wider transition border border-gold"
                >
                  📅 Marcar Ontem
                </button>
                <button
                  type="button"
                  onClick={setDateToToday}
                  className="px-2.5 py-1 bg-white hover:bg-deep-black hover:text-white text-deep-black text-[9px] font-black tracking-wider transition border border-deep-black"
                >
                  ⏰ Marcar Hoje
                </button>
              </div>
            </div>
            <input
              type="datetime-local"
              required
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="w-full p-2.5 border-2 border-deep-black font-mono font-bold text-xs bg-white focus:outline-none focus:border-gold"
            />
          </div>

          {/* SEÇÃO 2: DADOS DO CLIENTE & CONTATO */}
          <div className="p-4 bg-white border-2 border-deep-black space-y-3">
            <div className="flex items-center gap-1.5 border-b border-deep-black/10 pb-2">
              <User className="w-4 h-4 text-gold" />
              <span className="text-[10px] font-black tracking-wider text-deep-black">
                Dados do Cliente
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-deep-black">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CRISTINA"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 border-2 border-deep-black font-bold text-xs uppercase focus:outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-deep-black">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(978) 313-9452"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2.5 border-2 border-deep-black font-mono font-bold text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-deep-black">E-mail (Opcional)</label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full p-2.5 border-2 border-deep-black font-mono text-xs lowercase focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: MEIO DE PAGAMENTO, VENDEDORA E STATUS */}
          <div className="p-4 bg-white border-2 border-deep-black space-y-3">
            <div className="flex items-center gap-1.5 border-b border-deep-black/10 pb-2">
              <CreditCard className="w-4 h-4 text-gold" />
              <span className="text-[10px] font-black tracking-wider text-deep-black">
                Pagamento & Responsável
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-deep-black">Meio de Pagamento *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 border-2 border-deep-black font-black text-xs uppercase bg-white focus:outline-none focus:border-gold"
                >
                  <option value="CASH">💵 DINHEIRO (CASH)</option>
                  <option value="ZELLE">📱 ZELLE (TRANSFERÊNCIA)</option>
                  <option value="VENMO">🟣 VENMO</option>
                  <option value="CARD">💳 CARTÃO (CRÉDITO / DÉBITO)</option>
                  <option value="CREDIARIO">📑 CREDIÁRIO / CARNÊ</option>
                  <option value="APPLE_PAY">🍎 APPLE PAY</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-deep-black">Vendedora / Responsável</label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full p-2.5 border-2 border-deep-black font-bold text-xs uppercase focus:outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-deep-black">Status do Pedido</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 border-2 border-deep-black font-black text-xs uppercase bg-white focus:outline-none focus:border-gold"
                >
                  <option value="COMPLETED">✓ CONCLUÍDO / PAGO</option>
                  <option value="PENDING">⏳ PENDENTE (CREDIÁRIO / AGUARDANDO)</option>
                  <option value="IN_PRODUCTION">✂️ EM CONFECÇÃO</option>
                  <option value="CANCELLED">✕ CANCELADO</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: ITENS VENDIDOS */}
          <div className="p-4 bg-white border-2 border-deep-black space-y-3">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-2">
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-gold" />
                <span className="text-[10px] font-black tracking-wider text-deep-black">
                  Peças da Venda ({items.length})
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5 text-gold" />
                <span>+ Adicionar Outra Peça</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const qty = Number(item.quantity) || 1;
                const cost = Number(item.cost_price) || 0;
                const unitPrice = Number(item.unit_price) || 0;
                const itemSubtotal = qty * unitPrice;
                const itemTotalCost = qty * cost;
                const itemProfit = itemSubtotal - itemTotalCost;
                const itemMargin = itemSubtotal > 0 ? ((itemProfit / itemSubtotal) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-50 border-2 border-deep-black/30 space-y-2.5 shadow-2xs"
                  >
                    {/* Linha 1: Identificação da Peça */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5 space-y-0.5">
                        <label className="text-[8.5px] font-black text-deep-black/70 uppercase">
                          Peça / Modelo:
                        </label>
                        <input
                          type="text"
                          required
                          value={item.title}
                          onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                          placeholder="Nome do produto"
                          className="w-full p-2 border border-deep-black font-bold text-xs uppercase bg-white focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-0.5">
                        <label className="text-[8.5px] font-black text-deep-black/70 uppercase">
                          Tamanho:
                        </label>
                        <input
                          type="text"
                          value={item.size}
                          onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                          placeholder="P, M, G, One Size"
                          className="w-full p-2 border border-deep-black font-bold text-xs uppercase bg-white focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-0.5">
                        <label className="text-[8.5px] font-black text-deep-black/70 uppercase">
                          Cor / Detalhes:
                        </label>
                        <input
                          type="text"
                          value={item.color || ''}
                          onChange={(e) => handleItemChange(idx, 'color', e.target.value)}
                          placeholder="Preto Ônix, etc."
                          className="w-full p-2 border border-deep-black font-medium text-xs bg-white focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="p-2 text-deep-black/40 hover:text-red-600 disabled:opacity-20 transition"
                          title="Remover peça desta venda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Linha 2: Gestão Financeira da Peça (Qtd, Custo Unitário, Preço Venda, Lucro) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white p-2.5 border-2 border-deep-black/15 items-center">
                      {/* Quantidade */}
                      <div className="space-y-0.5">
                        <label className="text-[8.5px] font-black text-deep-black/70 uppercase block">
                          Quantidade:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value) || 1)}
                          className="w-full p-2 border border-deep-black font-mono font-bold text-xs bg-white text-center"
                        />
                      </div>

                      {/* Preço de Custo (CMV) - CAMPO SOLICITADO */}
                      <div className="space-y-0.5">
                        <label className="text-[8.5px] font-black uppercase text-amber-950 bg-amber-200/80 px-1.5 py-0.5 border border-amber-400 inline-flex items-center gap-1">
                          <span>★ PREÇO DE CUSTO ($):</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.cost_price}
                          onChange={(e) => handleItemChange(idx, 'cost_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full p-2 border-2 border-amber-500 font-mono font-black text-xs bg-amber-50 text-right focus:bg-white focus:outline-none"
                        />
                      </div>

                      {/* Preço de Venda Unitário */}
                      <div className="space-y-0.5">
                        <label className="text-[8.5px] font-black uppercase text-emerald-950 bg-emerald-200/80 px-1.5 py-0.5 border border-emerald-400 inline-flex items-center gap-1">
                          <span>PREÇO VENDA ($):</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full p-2 border-2 border-emerald-500 font-mono font-black text-xs bg-emerald-50 text-right focus:bg-white focus:outline-none"
                        />
                      </div>

                      {/* Lucro Bruto do Item */}
                      <div className="space-y-0.5 text-right pl-1">
                        <span className="text-[8.5px] font-black uppercase text-deep-black/60 block">
                          LUCRO DA PEÇA:
                        </span>
                        <div className="font-mono font-black text-xs text-green-700">
                          +${itemProfit.toFixed(2)}
                          <span className="text-[8px] font-normal text-deep-black/60 block">
                            margem: {itemMargin}%
                          </span>
                        </div>
                        <span className="text-[8px] text-deep-black/50 block font-mono">
                          Subtotal: ${itemSubtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 5: DESCONTO & OBSERVAÇÕES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white border-2 border-deep-black space-y-2">
              <label className="text-[10px] font-black text-deep-black flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-gold" />
                <span>Desconto Concedido ($)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-2.5 border-2 border-deep-black font-mono font-bold text-xs text-right bg-white focus:outline-none focus:border-gold"
              />
            </div>

            <div className="p-4 bg-white border-2 border-deep-black space-y-2">
              <label className="text-[10px] font-black text-deep-black flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gold" />
                <span>Observações / Notas Internas</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Pagou entrada de $20, restante amanhã"
                className="w-full p-2.5 border-2 border-deep-black font-medium text-xs bg-white focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* RESUMO FINANCEIRO EM TEMPO REAL */}
          <div className="p-4 bg-deep-black text-white border-2 border-gold space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">Faturamento Bruto (Peças):</span>
              <span className="font-mono font-bold text-white">${subtotalProducts.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center gap-1 font-bold">
                <span>(-) Custo Total das Peças (CMV Atualizado):</span>
              </span>
              <span className="font-mono font-bold">-${totalCostOfGoods.toFixed(2)}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex items-center justify-between text-xs text-red-400">
                <span>(-) Desconto Concedido:</span>
                <span className="font-mono font-bold">-${discountVal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-green-400 pt-1 border-t border-white/10">
              <span>(=) Lucro Bruto Estimado:</span>
              <span className="font-mono font-bold">+${Math.max(0, subtotalProducts - totalCostOfGoods - discountVal).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-black text-gold pt-2 border-t border-white/20">
              <span>TOTAL RECALCULADO A PAGAR:</span>
              <span className="font-mono text-xl">${totalAmount.toFixed(2)} USD</span>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleCancelSale}
              disabled={isSaving || status === 'CANCELLED'}
              className="py-3 px-4 bg-red-100 hover:bg-red-700 hover:text-white text-red-900 border-2 border-red-500 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              title="Cancelar esta venda e estornar as peças para o estoque"
            >
              <Ban className="w-4 h-4 text-red-700 group-hover:text-white" />
              <span>CANCELAR VENDA</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="py-3 px-4 bg-white hover:bg-gray-100 text-deep-black border-2 border-deep-black font-black text-xs uppercase tracking-wider transition"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-gold hover:bg-deep-black hover:text-gold text-deep-black border-2 border-deep-black font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>SALVANDO ALTERAÇÕES...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>SALVAR ALTERAÇÕES DA VENDA</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
