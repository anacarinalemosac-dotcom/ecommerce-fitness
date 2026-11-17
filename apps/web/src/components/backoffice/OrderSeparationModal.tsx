'use client';

import React, { useState } from 'react';
import {
  Scissors,
  CheckCircle2,
  Mail,
  Phone,
  MessageCircle,
  Package,
  MapPin,
  X,
  ExternalLink,
  Sparkles,
  Send,
  Check,
  Copy,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PaymentMethodBadge, getPaymentMethodDisplay } from '@/lib/paymentFormatters';

export interface OrderSeparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onStatusUpdated?: (orderId: string, newFulfillment: string) => Promise<void> | void;
  onSwapItem?: (order: any, itemIndex: number, item: any) => void;
}

export function OrderSeparationModal({
  isOpen,
  onClose,
  order,
  onStatusUpdated,
  onSwapItem,
}: OrderSeparationModalProps) {
  if (!isOpen || !order) return null;

  const orderId = order.order_id || order.id || 'PEDIDO';
  const customerName = order.customer_name || 'Cliente';
  const initialEmail =
    order.customer_email ||
    order.shipping_address?.customer_email ||
    order.shipping_address?.email ||
    '';
  const rawPhone = order.customer_phone || order.shipping_address?.customer_phone || '';
  const digitsPhone = String(rawPhone).replace(/\D/g, '');
  const waPhone = digitsPhone.length === 10 ? `1${digitsPhone}` : digitsPhone;

  const rawItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : (Array.isArray(order.shipping_address?.items) ? order.shipping_address.items : []);

  const addr = order.shipping_address || {};
  const addressText = addr.address
    ? `${addr.address}${addr.apt ? ` (${addr.apt})` : ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zip || ''}`
    : (order.customer_address || order.crediario?.customer_address || 'Endereço padrão / Showroom');

  // Items checklist
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});
  const toggleItemCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const allItemsChecked = rawItems.length > 0 && rawItems.every((_: any, idx: number) => checkedItems[idx]);

  // WhatsApp Message
  const itemsTextList = rawItems
    .map((it: any) => `• *${it.title || 'Conjunto Fitness'}* (${it.color || 'Padrão'} • Tam ${it.size || 'M'}) ×${it.quantity || 1}`)
    .join('\n');

  const defaultWaMessage = `Olá *${customerName}*! 🥰 Tudo bem?

Aqui é a Ana da *ANA Fitness Wear*! 💕

Passando para te avisar com muito carinho que o seu pedido *#${orderId}* já foi confirmado e nossa equipe já está cuidadosamente *separando e embalando as suas peças para envio*! ✨📦

🛍️ *Peças do seu pedido:*
${itemsTextList || '• Peças selecionadas'}

📍 *Endereço de Entrega:*
${addressText}

Assim que a caixinha for postada nos Correios (USPS), você receberá o seu código de rastreamento oficial para acompanhar cada passo da entrega.

Muito obrigada pela preferência e por escolher a ANA Fitness Wear! Se precisar de qualquer coisa, é só me chamar por aqui. Tenha um dia maravilhoso! ✨💖`;

  const [waMessage, setWaMessage] = useState(defaultWaMessage);
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const isAlreadyInSeparation = order.fulfillment_status === 'IN_PRODUCTION';

  const handleSetInSeparation = async () => {
    setIsUpdatingStatus(true);
    try {
      if (onStatusUpdated) {
        await onStatusUpdated(orderId, 'IN_PRODUCTION');
      } else {
        await fetch('/api/backoffice/sales', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            fulfillment_status: 'IN_PRODUCTION',
          }),
        });
      }
      setStatusSuccess(true);
      setTimeout(() => setStatusSuccess(false), 3000);
    } catch (e: any) {
      alert('Erro ao atualizar status: ' + e.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendWhatsApp = async () => {
    // 1. Atualiza status para Em Separação se ainda não estiver
    if (!isAlreadyInSeparation && onStatusUpdated) {
      try {
        await onStatusUpdated(orderId, 'IN_PRODUCTION');
      } catch (_) {}
    }

    // 2. Abre link do WhatsApp
    const encoded = encodeURIComponent(waMessage);
    const url = waPhone
      ? `https://wa.me/${waPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      alert('Por favor, informe um endereço de e-mail válido para a cliente.');
      return;
    }

    setIsSendingEmail(true);
    setEmailSuccess(false);

    try {
      const res = await fetch('/api/backoffice/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          type: 'ORDER_SEPARATION',
          email: emailInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailSuccess(true);
        // Atualiza status para Em Separação
        if (!isAlreadyInSeparation && onStatusUpdated) {
          await onStatusUpdated(orderId, 'IN_PRODUCTION');
        }
      } else {
        alert('Erro ao enviar e-mail: ' + (data.error || 'Falha no envio'));
      }
    } catch (err: any) {
      alert('Falha na comunicação: ' + err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(addressText);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 animate-fadeIn backdrop-blur-xs">
      <div className="bg-white border-4 border-deep-black max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 bg-deep-black text-white border-b-2 border-gold flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-deep-black flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-stone-900 px-2 py-0.5 border border-gold/40">
                  SEPARAÇÃO & EMBALAGEM
                </span>
                <span className="font-mono font-black text-xs text-white">#{orderId}</span>
              </div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white mt-0.5">
                SEPARAR PEDIDO • {customerName}
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

        {/* Corpo Rolável */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Barra de Status e Meio de Pagamento */}
          <div className="p-3.5 bg-neutral-50 border-2 border-deep-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/60 block">
                FORMA DE PAGAMENTO IDENTIFICADA:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <PaymentMethodBadge orderOrMethod={order} variant="full" />
                <span className="text-[11px] font-mono font-bold text-deep-black">
                  Total Pago: ${(Number(order.total_amount) || Number(order.subtotal_products) || 0).toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[9px] font-bold uppercase text-deep-black/50 block">SITUAÇÃO ATUAL:</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 border inline-block ${
                  isAlreadyInSeparation
                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                    : 'bg-stone-100 text-stone-800 border-stone-300'
                }`}>
                  {isAlreadyInSeparation ? '✂️ EM SEPARAÇÃO' : '🕒 AGUARDANDO SEPARAÇÃO'}
                </span>
              </div>

              {!isAlreadyInSeparation && (
                <button
                  type="button"
                  onClick={handleSetInSeparation}
                  disabled={isUpdatingStatus}
                  className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-deep-black text-xs font-black uppercase tracking-wider border-2 border-deep-black transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>{isUpdatingStatus ? 'ATUALIZANDO...' : 'MARCAR "EM SEPARAÇÃO"'}</span>
                </button>
              )}
            </div>
          </div>

          {statusSuccess && (
            <div className="p-2.5 bg-emerald-100 border border-emerald-400 text-emerald-950 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>✓ Status do pedido atualizado com sucesso para "EM SEPARAÇÃO"!</span>
            </div>
          )}

          {/* Checklist de Peças Físicas para Separar */}
          <div className="space-y-2 border-2 border-deep-black p-3.5 bg-white">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-2">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-gold" />
                <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
                  PEÇAS PARA SEPARAR NA ARARA ({rawItems.length} ITEM{rawItems.length === 1 ? '' : 'S'})
                </h4>
              </div>
              <span className="text-[10px] text-deep-black/60 font-bold uppercase">
                Marque conforme for pegando na arara:
              </span>
            </div>

            <div className="divide-y divide-deep-black/10 max-h-56 overflow-y-auto">
              {rawItems.map((it: any, idx: number) => {
                const isChecked = !!checkedItems[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleItemCheck(idx)}
                    className={`py-2 px-2 flex items-center justify-between gap-3 cursor-pointer transition rounded ${
                      isChecked ? 'bg-emerald-50/70 line-through text-deep-black/60' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItemCheck(idx)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 accent-amber-600 cursor-pointer shrink-0"
                      />
                      {it.image && (
                        <img
                          src={it.image}
                          alt={it.title}
                          className="w-10 h-13 object-cover rounded border border-deep-black/20 shrink-0 bg-neutral-100"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="font-black text-xs text-deep-black block uppercase truncate">
                          {it.title || 'Conjunto Fitness'}
                        </span>
                        <div className="text-[10px] text-deep-black/70 font-mono mt-0.5">
                          Cor: <strong className="text-deep-black">{it.color || 'Padrão'}</strong> • Tam: <strong className="text-deep-black">{it.size || 'M'}</strong>
                        </div>
                        {it.sku && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-100 border border-amber-300 text-amber-950 font-mono font-bold text-[9px]">
                            SKU: {it.sku}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {onSwapItem && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSwapItem(order, idx, it);
                          }}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-deep-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition shadow-xs cursor-pointer border border-deep-black/30"
                          title="Sem estoque? Clique para trocar esta peça por outro modelo, cor ou tamanho"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>TROCAR</span>
                        </button>
                      )}
                      <span className="font-mono font-black text-xs text-deep-black px-2 py-1 bg-neutral-100 border border-deep-black/20">
                        ×{it.quantity || 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {allItemsChecked && (
              <div className="p-2 bg-emerald-100 border border-emerald-400 text-emerald-950 text-xs font-bold flex items-center gap-1.5 mt-1">
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Todas as peças conferidas na arara! Agora notifique a cliente abaixo:</span>
              </div>
            )}
          </div>

          {/* Endereço de Envio */}
          <div className="p-3 bg-neutral-50 border border-deep-black/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase text-deep-black/60 block">DESTINO DE ENTREGA (USPS):</span>
                <span className="font-mono text-deep-black block text-[11px] truncate" title={addressText}>
                  {addressText}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyAddress}
              className="px-2.5 py-1 bg-deep-black text-gold text-[9px] font-black uppercase shrink-0 flex items-center gap-1 cursor-pointer"
            >
              {copiedAddr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedAddr ? 'COPIADO' : 'COPIAR'}</span>
            </button>
          </div>

          {/* ÁREA DE NOTIFICAÇÃO: WHATSAPP OU E-MAIL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t-2 border-deep-black">
            {/* Opção 1: Enviar WhatsApp */}
            <div className="p-4 bg-emerald-50/70 border-2 border-emerald-600 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-700" />
                    <h5 className="text-xs font-black uppercase text-emerald-950 tracking-wider">
                      OPÇÃO 1: NOTIFICAR VIA WHATSAPP
                    </h5>
                  </div>
                  <span className="text-[9px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 uppercase">
                    1-CLIQUE
                  </span>
                </div>

                <p className="text-[11px] text-emerald-900/80 leading-snug">
                  Abre a conversa da cliente no WhatsApp com mensagem carinhosa já preenchida e pronta para envio.
                </p>

                {waPhone ? (
                  <div className="text-[10px] font-mono text-emerald-950 bg-white p-1.5 border border-emerald-300 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>Telefone: +{waPhone}</span>
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-amber-800 bg-amber-100 p-1.5 border border-amber-300 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Telefone não cadastrado. O WhatsApp abrirá para você selecionar o contato.</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-emerald-950 block">
                    Mensagem que será enviada:
                  </label>
                  <textarea
                    rows={6}
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    className="w-full p-2 text-[10.5px] border border-emerald-300 bg-white focus:outline-none focus:border-emerald-600 font-sans leading-relaxed resize-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow cursor-pointer mt-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>ABRIR NO WHATSAPP E MARCAR "EM SEPARAÇÃO"</span>
              </button>
            </div>

            {/* Opção 2: Enviar E-mail Oficial */}
            <div className="p-4 bg-amber-50/70 border-2 border-amber-500 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-800" />
                    <h5 className="text-xs font-black uppercase text-amber-950 tracking-wider">
                      OPÇÃO 2: ENVIAR E-MAIL OFICIAL
                    </h5>
                  </div>
                  <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 uppercase">
                    OFICIAL DA LOJA
                  </span>
                </div>

                <p className="text-[11px] text-amber-950/80 leading-snug">
                  Dispara um e-mail com layout de luxo da ANA Fitness Wear informando que as peças já estão sendo preparadas.
                </p>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-amber-950 block">
                    E-mail da Cliente:
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="cliente@exemplo.com"
                    className="w-full p-2 text-xs border border-amber-300 bg-white focus:outline-none focus:border-deep-black font-mono"
                  />
                </div>

                <div className="p-2.5 bg-white border border-amber-300 text-[10px] text-amber-950 space-y-1">
                  <div className="font-bold">Assunto do e-mail:</div>
                  <div className="font-mono text-[10px] text-deep-black/80">
                    ✨ Seu Pedido #{orderId} Já Está Sendo Separado! - ANA Fitness Wear
                  </div>
                  <div className="text-[9px] text-deep-black/50 pt-1 border-t border-amber-200">
                    Inclui fotos das peças, endereço e aviso que o código USPS chegará assim que postado.
                  </div>
                </div>

                {emailSuccess && (
                  <div className="p-2 bg-emerald-100 border border-emerald-400 text-emerald-950 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>✓ E-mail oficial de separação disparado com sucesso!</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !emailInput}
                className="w-full py-2.5 px-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow cursor-pointer disabled:opacity-50 mt-2"
              >
                <Mail className="w-4 h-4 text-gold" />
                <span>{isSendingEmail ? 'DISPARANDO E-MAIL...' : 'ENVIAR E-MAIL DE SEPARAÇÃO'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-neutral-100 border-t-2 border-deep-black/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-deep-black/60 font-medium">
            Você pode enviar WhatsApp, disparar o e-mail ou fazer os dois para encantar sua cliente.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  );
}
