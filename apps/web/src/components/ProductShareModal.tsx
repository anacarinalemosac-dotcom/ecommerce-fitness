'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Mail,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

export interface ProductShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id?: string;
    title: string;
    slug: string;
    price: number;
    primaryImage?: string;
    image?: string;
    categoryPt?: string;
    categoryEn?: string;
  } | null;
  lang?: 'en' | 'pt';
}

export default function ProductShareModal({
  isOpen,
  onClose,
  product,
  lang = 'pt',
}: ProductShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        setCanNativeShare(true);
      }
    }
  }, []);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const productUrl = `${origin || 'https://anafitnesswear.com'}/produto/${product.slug}`;
  const productImage = product.primaryImage || product.image || '';
  const priceFormatted = `$${Number(product.price).toFixed(2)}`;

  const shareText =
    lang === 'pt'
      ? `Olha essa peça linda da Ana Fitness Wear: ${product.title} (${priceFormatted})`
      : `Look at this stunning piece from Ana Fitness Wear: ${product.title} (${priceFormatted})`;

  const fullShareText = `${shareText} - ${productUrl}`;

  // URLs de compartilhamento
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(fullShareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`${product.title} - Ana Fitness Wear`)}&body=${encodeURIComponent(
    lang === 'pt'
      ? `Olá!\n\nAchei essa peça linda e pensei em você:\n${product.title} (${priceFormatted})\n\nConfira os detalhes no link abaixo:\n${productUrl}\n\nAna Fitness Wear - Athletic Luxury`
      : `Hi!\n\nI found this gorgeous piece and thought of you:\n${product.title} (${priceFormatted})\n\nCheck out the link below:\n${productUrl}\n\nAna Fitness Wear - Athletic Luxury`
  )}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(productUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = productUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${product.title} | Ana Fitness Wear`,
          text: shareText,
          url: productUrl,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Erro no compartilhamento nativo:', err);
        }
      }
    }
  };

  const handleInstagramShare = async () => {
    // Copia o link para a área de transferência e abre o Instagram
    await handleCopyLink();
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md border border-deep-black/10 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-deep-black text-white px-5 py-4 flex items-center justify-between border-b border-gold/30">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-4 h-4 text-gold" />
            <span className="font-black text-xs uppercase tracking-widest text-white">
              {lang === 'pt' ? 'COMPARTILHAR PRODUTO' : 'SHARE PRODUCT'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Card Preview */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3.5">
          {productImage ? (
            <img
              src={productImage}
              alt={product.title}
              className="w-14 h-16 object-cover object-top border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-14 h-16 bg-gray-200 border border-gray-300 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-gold block truncate">
              {lang === 'pt' ? product.categoryPt || 'FITNESS LUXO' : product.categoryEn || 'ATHLETIC LUXURY'}
            </span>
            <h4 className="text-xs font-black uppercase text-deep-black truncate">
              {product.title}
            </h4>
            <span className="text-xs font-mono font-bold text-deep-black mt-0.5 block">
              {priceFormatted}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Copy Link Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-deep-black/70 flex items-center justify-between">
              <span>{lang === 'pt' ? 'COPIAR LINK DIRETO:' : 'COPY DIRECT LINK:'}</span>
              {copied && (
                <span className="text-emerald-600 font-black text-[9px] flex items-center gap-1 animate-fadeIn">
                  <Check className="w-3 h-3" />
                  {lang === 'pt' ? 'COPIADO!' : 'COPIED!'}
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={productUrl}
                className="w-full text-xs font-mono bg-gray-100 border border-gray-300 px-3 py-2 text-deep-black/80 select-all focus:outline-none focus:border-deep-black"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-deep-black text-white hover:bg-gold hover:text-deep-black'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (lang === 'pt' ? 'COPIADO' : 'COPIED') : (lang === 'pt' ? 'COPIAR' : 'COPY')}</span>
              </button>
            </div>
          </div>

          {/* Social & Messaging Apps Grid */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/70 block">
              {lang === 'pt' ? 'ESCOLHA O APLICATIVO PARA COMPARTILHAR:' : 'CHOOSE APP TO SHARE:'}
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-[#25D366]/10 hover:bg-[#25D366] text-[#128C7E] hover:text-white border border-[#25D366]/30 hover:border-[#25D366] transition flex items-center gap-2.5 group font-bold text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </div>
                <div className="truncate">
                  <span className="block font-black text-xs uppercase tracking-wide">WhatsApp</span>
                  <span className="text-[9px] opacity-75 font-normal block truncate">Conversa ou status</span>
                </div>
              </a>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleInstagramShare}
                className="p-3 bg-pink-50 hover:bg-gradient-to-r hover:from-purple-600 hover:via-pink-500 hover:to-orange-400 text-pink-700 hover:text-white border border-pink-200 transition flex items-center gap-2.5 group font-bold text-xs text-left"
                title={lang === 'pt' ? 'Copia link e abre Instagram' : 'Copy link and open Instagram'}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="truncate">
                  <span className="block font-black text-xs uppercase tracking-wide">Instagram</span>
                  <span className="text-[9px] opacity-75 font-normal block truncate">Direct & Stories</span>
                </div>
              </button>

              {/* SMS / Mensagens */}
              <a
                href={smsUrl}
                className="p-3 bg-gray-100 hover:bg-deep-black text-deep-black hover:text-white border border-gray-200 hover:border-deep-black transition flex items-center gap-2.5 group font-bold text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-deep-black text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block font-black text-xs uppercase tracking-wide">SMS / iMessage</span>
                  <span className="text-[9px] opacity-75 font-normal block truncate">Mensagem direta</span>
                </div>
              </a>

              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-[#229ED9]/10 hover:bg-[#229ED9] text-[#229ED9] hover:text-white border border-[#229ED9]/30 hover:border-[#229ED9] transition flex items-center gap-2.5 group font-bold text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-[#229ED9] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </div>
                <div className="truncate">
                  <span className="block font-black text-xs uppercase tracking-wide">Telegram</span>
                  <span className="text-[9px] opacity-75 font-normal block truncate">Canal ou chat</span>
                </div>
              </a>

              {/* E-mail */}
              <a
                href={emailUrl}
                className="p-3 bg-slate-100 hover:bg-slate-700 text-slate-700 hover:text-white border border-slate-200 hover:border-slate-700 transition flex items-center gap-2.5 group font-bold text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block font-black text-xs uppercase tracking-wide">E-mail</span>
                  <span className="text-[9px] opacity-75 font-normal block truncate">Enviar por e-mail</span>
                </div>
              </a>

              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white border border-[#1877F2]/30 hover:border-[#1877F2] transition flex items-center gap-2.5 group font-bold text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div className="truncate">
                  <span className="block font-black text-xs uppercase tracking-wide">Facebook</span>
                  <span className="text-[9px] opacity-75 font-normal block truncate">Feed ou mensagem</span>
                </div>
              </a>

              {/* X / Twitter */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 p-3 bg-black/5 hover:bg-black text-black hover:text-white border border-black/20 hover:border-black transition flex items-center gap-2.5 group font-bold text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div className="truncate">
                  <span className="block font-black text-xs uppercase tracking-wide">X (Twitter)</span>
                  <span className="text-[9px] opacity-75 font-normal block truncate">Publicar no feed</span>
                </div>
              </a>
            </div>
          </div>

          {/* Opção Nativa de Compartilhamento do Aparelho (iOS / Android / Dispositivo) */}
          {canNativeShare && (
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-3 px-4 bg-gold hover:bg-gold/90 text-deep-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Smartphone className="w-4 h-4" />
                <span>{lang === 'pt' ? 'OUTROS APPS DO APARELHO (SISTEMA)' : 'MORE APPS (SYSTEM MENU)'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
