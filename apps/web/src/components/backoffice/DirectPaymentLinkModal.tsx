'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  MessageCircle,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface DirectPaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null;
}

export function DirectPaymentLinkModal({
  isOpen,
  onClose,
  product,
}: DirectPaymentLinkModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [linkMode, setLinkMode] = useState<'site' | 'stripe'>('site');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (product) {
      const vars = product.variants || [];
      const firstVar = vars.find((v: any) => Number(v.stock_quantity || v.stock) > 0) || vars[0];
      if (firstVar) {
        setSelectedSize(firstVar.size ? firstVar.size.toUpperCase() : 'M');
        setSelectedColor(firstVar.color || 'Preto Ônix');
      } else if (Array.isArray(product.sizes) && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0].toUpperCase());
        setSelectedColor(product.colorName || 'Preto Ônix');
      } else {
        setSelectedSize('M');
        setSelectedColor('Preto Ônix');
      }
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const basePrice = Number(
    product.meta?.promotional_price ??
    product.meta?.price ??
    product.price ??
    product.variants?.[0]?.price ??
    44.9
  );

  const installmentVal = (basePrice / 4).toFixed(2);
  const prodTitle = product.title || 'PEÇA FITNESS EXCLUSIVA';
  const prodSlug = product.slug || 'peca-fit';

  // URLs
  const siteDirectUrl = `${origin || 'https://anafitwear.com'}/checkout?direct=1&slug=${prodSlug}&size=${encodeURIComponent(selectedSize)}&color=${encodeURIComponent(selectedColor)}&pay=afterpay`;
  const stripeExpressUrl = `${origin || 'https://anafitwear.com'}/api/checkout/direct?slug=${prodSlug}&size=${encodeURIComponent(selectedSize)}&color=${encodeURIComponent(selectedColor)}&mode=stripe`;

  const finalUrl = linkMode === 'site' ? siteDirectUrl : stripeExpressUrl;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(finalUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch (e) {
      console.warn('Erro ao copiar:', e);
    }
  };

  const whatsappMessage = `Olá! Segue seu link exclusivo de pagamento direto para garantir seu *${prodTitle}* (Tamanho: ${selectedSize}, Cor: ${selectedColor}) na Ana Fitness Wear.\n\n✨ Você pode parcelar em 4x sem juros de $${installmentVal} no Afterpay ou pagar com cartão com frete fixo de $9.99 dos EUA:\n\n${finalUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  // Variantes únicas
  const variants = product.variants || [];
  const sizesList: string[] = Array.from(
    new Set([
      ...variants.map((v: any) => v.size?.toUpperCase()).filter(Boolean),
      ...(Array.isArray(product.sizes) ? product.sizes.map((s: string) => s.toUpperCase()) : ['S', 'M', 'L']),
    ])
  );

  const colorsList: string[] = Array.from(
    new Set([
      ...variants.map((v: any) => v.color).filter(Boolean),
      product.colorName,
    ].filter(Boolean))
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-deep-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0F0F0F] text-white border-2 border-gold rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(212,175,55,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-gold to-yellow-300" />

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                GERADOR DE LINK DE PAGAMENTO DIRETO
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                Pague em 4x no Afterpay sem o cliente precisar navegar pelo site
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card Resumo do Produto */}
          <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-14 aspect-[4/5] bg-black/40 rounded-lg overflow-hidden border border-white/15 shrink-0">
              <img
                src={product.primary_image || product.primaryImage || product.meta?.primary_image || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80'}
                alt={prodTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-black uppercase text-gold tracking-widest block truncate">
                {product.category || 'CONJUNTOS & MACAQUINHOS'}
              </span>
              <h4 className="text-sm font-black uppercase text-white truncate">
                {prodTitle}
              </h4>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-base font-black font-mono text-white">
                  ${basePrice.toFixed(2)}
                </span>
                <span className="px-2 py-0.5 bg-[#b2fce4] text-deep-black font-black text-[9px] uppercase rounded-xs">
                  4x de ${installmentVal} no Afterpay
                </span>
              </div>
            </div>
          </div>

          {/* Seletores de Variação (Cor e Tamanho) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block mb-1.5">
                TAMANHO:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {sizesList.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg border transition ${
                      selectedSize === sz
                        ? 'bg-gold text-deep-black border-gold shadow-sm'
                        : 'bg-white/5 text-gray-300 border-white/15 hover:border-gold'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {colorsList.length > 0 && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block mb-1.5">
                  COR:
                </label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-gold"
                >
                  {colorsList.map((c) => (
                    <option key={c} value={c} className="bg-black text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Seletor de Tipo de Link */}
          <div className="pt-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block mb-1.5">
              FORMATO DO LINK:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLinkMode('site')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  linkMode === 'site'
                    ? 'border-gold bg-gold/15 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span className="block text-xs font-black uppercase text-gold">Checkout VIP da Loja</span>
                <span className="block text-[9px] text-gray-300 mt-0.5">
                  Abre na loja com sacola pronta e Afterpay selecionado
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLinkMode('stripe')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  linkMode === 'stripe'
                    ? 'border-gold bg-gold/15 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span className="block text-xs font-black uppercase text-emerald-400">Stripe Express Direto</span>
                <span className="block text-[9px] text-gray-300 mt-0.5">
                  Redireciona direto para o checkout oficial do Stripe
                </span>
              </button>
            </div>
          </div>

          {/* Campo com o Link Gerado */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 flex items-center justify-between">
              <span>LINK GERADO:</span>
              {copiedLink && (
                <span className="text-emerald-400 font-black text-[9px] flex items-center gap-1">
                  <Check className="w-3 h-3" /> COPIADO COM SUCESSO!
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={finalUrl}
                className="w-full bg-[#181818] border border-gold/40 rounded-lg px-3 py-2 text-xs font-mono text-gold select-all focus:outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gold text-deep-black hover:bg-yellow-400'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'COPIADO' : 'COPIAR'}</span>
              </button>
            </div>
          </div>

          {/* Ações Finais */}
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1ebd5b] text-deep-black font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>ENVIAR LINK NO WHATSAPP COM TEXTO PRONTO</span>
            </a>

            <a
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 border border-white/10 text-center"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>TESTAR LINK COMO CLIENTE</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
