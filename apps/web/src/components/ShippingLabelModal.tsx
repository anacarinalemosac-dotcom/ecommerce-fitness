'use client';

import React, { useState } from 'react';
import {
  Truck,
  ExternalLink,
  Copy,
  Check,
  X,
  Package,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  Barcode,
  Navigation,
} from 'lucide-react';

export interface ShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSaveTracking?: (orderId: string, trackingCode: string) => Promise<void> | void;
}

export function ShippingLabelModal({
  isOpen,
  onClose,
  order,
  onSaveTracking,
}: ShippingLabelModalProps) {
  if (!isOpen || !order) return null;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState<string>(order.tracking_code || '');
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Extrai com segurança os dados do destinatário
  const customerName =
    order.shipping_address?.firstName
      ? `${order.shipping_address.firstName} ${order.shipping_address.lastName || ''}`.trim()
      : order.customer_name || 'Cliente';

  const customerPhone =
    order.shipping_address?.phone ||
    order.customer_phone ||
    '';

  const customerEmail =
    order.shipping_address?.email ||
    order.customer_email ||
    '';

  const streetAddress =
    order.shipping_address?.address ||
    order.customer_address ||
    order.crediario?.customer_address ||
    '';

  const apt = order.shipping_address?.apt || '';
  const city = order.shipping_address?.city || '';
  const state = order.shipping_address?.state || '';
  const zip = order.shipping_address?.zip || '';
  const country = order.shipping_address?.country || 'US';

  // Monta o endereço formatado no padrão dos Correios dos EUA (USPS)
  const fullAddressLines: string[] = [
    customerName.toUpperCase(),
    apt ? `${streetAddress.toUpperCase()}, ${apt.toUpperCase()}` : streetAddress.toUpperCase(),
    city && state && zip ? `${city.toUpperCase()}, ${state.toUpperCase()} ${zip}` : '',
    'UNITED STATES',
    customerPhone ? `TEL: ${customerPhone}` : '',
  ].filter(Boolean);

  const formattedFullAddress = fullAddressLines.join('\n');

  // Remetente oficial (Ana Fitness Wear LLC)
  const senderAddress = `ANA FITNESS WEAR LLC\n126 FIRST ST, APT 01\nLEOMINSTER, MA 01453\nUNITED STATES\nTEL: (978) 313-9452`;

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveTrackingCode = async () => {
    if (!trackingInput.trim()) return;
    setIsSavingTracking(true);
    try {
      if (onSaveTracking) {
        await onSaveTracking(order.order_id || order.id, trackingInput.trim());
      } else {
        await fetch('/api/backoffice/sales', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.order_id || order.id,
            fulfillment_status: 'SHIPPED',
            tracking_code: trackingInput.trim(),
          }),
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar tracking:', err);
      alert('Erro ao salvar código de rastreamento.');
    } finally {
      setIsSavingTracking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white border-2 border-deep-black w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 bg-deep-black text-white flex items-center justify-between border-b-2 border-gold shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold text-deep-black flex items-center justify-center font-black rounded">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                  CORREIOS DOS ESTADOS UNIDOS • USPS
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white/10 text-white border border-white/20">
                  PEDIDO #{order.order_id || order.id}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                EMISSÃO DE ETIQUETA DE ENVIO
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition rounded cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Rolável */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-neutral-50/50">

          {/* 1. SELEÇÃO DE PLATAFORMA PARA FAZER A ETIQUETA (CLICK-N-SHIP OU PIRATE SHIP) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-gold" />
                <span>CLIQUE NO PORTAL DESEJADO PARA GERAR A ETIQUETA:</span>
              </span>
              <span className="text-[9px] font-bold text-deep-black/60 uppercase">
                Abre em nova aba
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opção A: Pirate Ship (Recomendado para Lojistas nos EUA - Até 80% de desconto) */}
              <a
                href="https://ship.pirateship.com/ship"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (formattedFullAddress) {
                    handleCopy(formattedFullAddress, 'auto-pirate');
                  }
                }}
                className="p-4 bg-white hover:bg-amber-50 border-2 border-deep-black hover:border-gold transition flex flex-col justify-between group shadow-sm cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-700 text-white font-mono">
                      ★ MAIS ECONÔMICO (30% A 80% OFF)
                    </span>
                    <ExternalLink className="w-4 h-4 text-deep-black group-hover:text-gold transition" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-deep-black group-hover:text-gold flex items-center gap-1.5">
                    <span>PIRATE SHIP (USPS)</span>
                  </h3>
                  <p className="text-[11px] text-deep-black/70 leading-relaxed font-medium">
                    Plataforma oficial gratuita favorita das lojas nos EUA. Emite exatamente a mesma etiqueta do USPS Priority Mail com desconto comercial e cola de endereço facilitada.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-deep-black/10 flex items-center justify-between text-[10px] font-bold text-emerald-800">
                  <span>Copia endereço + abre o site →</span>
                </div>
              </a>

              {/* Opção B: USPS Click-N-Ship Oficial */}
              <a
                href="https://cns.usps.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (formattedFullAddress) {
                    handleCopy(formattedFullAddress, 'auto-usps');
                  }
                }}
                className="p-4 bg-white hover:bg-blue-50 border-2 border-deep-black hover:border-blue-700 transition flex flex-col justify-between group shadow-sm cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-800 text-white font-mono">
                      PORTAL OFICIAL DO CORREIO
                    </span>
                    <ExternalLink className="w-4 h-4 text-deep-black group-hover:text-blue-800 transition" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-deep-black group-hover:text-blue-800 flex items-center gap-1.5">
                    <span>USPS CLICK-N-SHIP</span>
                  </h3>
                  <p className="text-[11px] text-deep-black/70 leading-relaxed font-medium">
                    Portal direto dos Correios dos Estados Unidos. Crie, pague e imprima etiquetas oficiais com código de rastreamento do USPS.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-deep-black/10 flex items-center justify-between text-[10px] font-bold text-blue-800">
                  <span>Copia endereço + abre o site →</span>
                </div>
              </a>
            </div>

            {/* Opção Secundária: Agendar Coleta Gratuita no Showroom */}
            <div className="pt-1">
              <a
                href="https://tools.usps.com/schedule-pickup-steps.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-deep-black/80 hover:text-gold uppercase underline transition"
              >
                <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>Agendar Coleta Gratuita do Carteiro no Showroom de Leominster (Package Pickup) ↗</span>
              </a>
            </div>
          </div>

          {/* 2. DADOS DO DESTINATÁRIO (CLIENTE) COM BOTÕES DE 1 CLIQUE PARA COPIAR */}
          <div className="bg-white border-2 border-deep-black p-4 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deep-black/10 pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                  ENDEREÇO DO DESTINATÁRIO (COLAR NO CORREIO):
                </span>
              </div>

              {/* Botão Principal de Cópia Completa */}
              <button
                type="button"
                onClick={() => handleCopy(formattedFullAddress, 'full')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition border-2 cursor-pointer ${
                  copiedKey === 'full' || copiedKey === 'auto-pirate' || copiedKey === 'auto-usps'
                    ? 'bg-emerald-600 border-emerald-700 text-white'
                    : 'bg-gold hover:bg-deep-black hover:text-gold text-deep-black border-deep-black'
                }`}
                title="Copiar nome e endereço completo para colar no site dos Correios"
              >
                {copiedKey === 'full' || copiedKey === 'auto-pirate' || copiedKey === 'auto-usps' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>✓ ENDEREÇO COMPLETO COPIADO!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPIAR ENDEREÇO COMPLETO</span>
                  </>
                )}
              </button>
            </div>

            {/* Bloco Visual do Endereço Formatado */}
            {streetAddress ? (
              <div className="p-3 bg-neutral-100 border border-deep-black/15 font-mono text-xs text-deep-black space-y-1">
                <div className="font-bold flex items-center justify-between">
                  <span>{customerName}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(customerName, 'name')}
                    className="text-[9px] text-deep-black/60 hover:text-deep-black font-sans uppercase font-bold flex items-center gap-0.5"
                    title="Copiar somente o nome"
                  >
                    {copiedKey === 'name' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'name' ? 'Copiado' : 'Copiar nome'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span>
                    {streetAddress} {apt ? `• ${apt}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(apt ? `${streetAddress}, ${apt}` : streetAddress, 'street')}
                    className="text-[9px] text-deep-black/60 hover:text-deep-black font-sans uppercase font-bold flex items-center gap-0.5"
                    title="Copiar somente a rua/número"
                  >
                    {copiedKey === 'street' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'street' ? 'Copiado' : 'Copiar rua'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between font-bold">
                  <span>
                    {city ? `${city}, ` : ''}{state ? `${state} ` : ''}{zip}
                  </span>
                  <div className="flex items-center gap-2">
                    {zip && (
                      <button
                        type="button"
                        onClick={() => handleCopy(zip, 'zip')}
                        className="text-[9px] text-deep-black/60 hover:text-deep-black font-sans uppercase font-bold flex items-center gap-0.5"
                        title="Copiar somente o ZIP Code"
                      >
                        {copiedKey === 'zip' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'zip' ? 'ZIP OK' : 'Copiar ZIP'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {customerPhone && (
                  <div className="flex items-center justify-between text-[11px] text-deep-black/70 pt-1 border-t border-deep-black/10">
                    <span>Telefone: {customerPhone}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(customerPhone, 'phone')}
                      className="text-[9px] text-deep-black/60 hover:text-deep-black font-sans uppercase font-bold flex items-center gap-0.5"
                    >
                      {copiedKey === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'phone' ? 'Copiado' : 'Copiar fone'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold space-y-1">
                <p>⚠️ Este pedido não possui endereço de entrega cadastrado (pode ter sido registrado como Retirada no Showroom ou cliente de balcão sem endereço).</p>
                <p className="text-[11px] text-amber-900 font-normal">Se o cliente solicitou entrega pelos Correios, solicite o endereço completo e o ZIP Code para colar no portal do USPS.</p>
              </div>
            )}

            {/* Dica do Remetente (From) */}
            <div className="flex items-center justify-between text-[10px] text-deep-black/60 pt-1">
              <span>Remetente: <strong>ANA FITNESS WEAR LLC • Leominster, MA 01453</strong></span>
              <button
                type="button"
                onClick={() => handleCopy(senderAddress, 'sender')}
                className="text-deep-black hover:text-gold font-bold uppercase flex items-center gap-1"
                title="Copiar dados do remetente oficial"
              >
                {copiedKey === 'sender' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'sender' ? 'Copiado' : 'Copiar Remetente'}</span>
              </button>
            </div>
          </div>

          {/* 3. INFORMAR E SALVAR O CÓDIGO DE RASTREIO APÓS GERAR A ETIQUETA */}
          <div className="bg-neutral-100 border-2 border-deep-black p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-gold" />
                <span>CÓDIGO DE RASTREAMENTO DOS CORREIOS (TRACKING NUMBER):</span>
              </span>
              {order.tracking_code && (
                <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                  ✓ RASTREIO ATUAL: {order.tracking_code}
                </span>
              )}
            </div>

            <p className="text-[11px] text-deep-black/70 leading-relaxed font-medium">
              Assim que você imprimir a etiqueta no Pirate Ship ou no USPS, copie o código de rastreamento gerado (geralmente começa com <strong>9400...</strong>) e salve abaixo. O status mudará automaticamente para <strong>DESPACHADO</strong> e o cliente poderá acompanhar a entrega pelo site ou e-mail.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Ex: 9400 1118 9956 1234 5678 90"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-white border border-deep-black/30 focus:outline-none focus:border-deep-black"
              />

              <button
                type="button"
                disabled={isSavingTracking || !trackingInput.trim()}
                onClick={handleSaveTrackingCode}
                className="px-5 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-40"
              >
                {isSavingTracking ? (
                  <span>SALVANDO...</span>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>✓ RASTREIO SALVO!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-gold" />
                    <span>SALVAR & DESPACHAR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-3 sm:p-4 bg-white border-t-2 border-deep-black flex items-center justify-between gap-3 shrink-0">
          <span className="text-[10px] text-deep-black/60 font-medium hidden sm:inline">
            Dúvidas no envio? Entre em contato com a equipe pelo WhatsApp oficial.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition ml-auto cursor-pointer"
          >
            FECHAR
          </button>
        </div>

      </div>
    </div>
  );
}
