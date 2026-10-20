'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Star,
  Sparkles,
  CheckCircle2,
  Heart,
  Upload,
  ArrowRight,
  ShoppingBag,
  Copy,
  Check,
  ShieldCheck,
  MessageSquare,
  Instagram,
  Camera,
} from 'lucide-react';

const POPULAR_PRODUCTS = [
  { slug: 'samanta-romper', title: 'Samanta Romper (Macaquinho)' },
  { slug: 'beach-samanta-romper', title: 'Beach Samanta Romper' },
  { slug: 'blusa-bailarina', title: 'Bailarina Top' },
  { slug: 'monique-flare-pants-set', title: 'Monique Flare Pants Set (Conjunto)' },
  { slug: 'kely-pants-set', title: 'Kely Pants Set (Conjunto)' },
  { slug: 'outro', title: 'Outra Peça / Look Geral' },
];

function ReviewFormContent() {
  const searchParams = useSearchParams();
  const initialProductSlug = searchParams.get('produto') || searchParams.get('p') || '';
  const initialCustomerName = searchParams.get('nome') || searchParams.get('name') || '';

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [city, setCity] = useState('');
  const [instagram, setInstagram] = useState('');
  const [selectedProductSlug, setSelectedProductSlug] = useState(initialProductSlug);
  const [customProductTitle, setCustomProductTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  useEffect(() => {
    if (initialProductSlug) {
      setSelectedProductSlug(initialProductSlug);
    }
    if (initialCustomerName) {
      setCustomerName(initialCustomerName);
    }
  }, [initialProductSlug, initialCustomerName]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setPhotoUrl(data.url);
        }
      } else {
        // Fallback para Data URL local se a rota de upload não responder
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setPhotoUrl(reader.result.toString());
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Erro ao carregar imagem, usando fallback local:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Por favor, digite seu nome.');
      return;
    }
    if (!comment.trim() || comment.trim().length < 10) {
      setErrorMessage('Por favor, escreva uma frase sobre o que achou da sua peça (mínimo 10 caracteres).');
      return;
    }

    const foundProd = POPULAR_PRODUCTS.find((p) => p.slug === selectedProductSlug);
    const productTitle = customProductTitle.trim() || foundProd?.title || 'Look Ana Fitness Wear';

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          city: city.trim() || 'Massachusetts, EUA',
          productSlug: selectedProductSlug || 'look-fitness',
          productTitle,
          rating,
          comment: comment.trim(),
          photoUrl: photoUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar avaliação.');
      }

      setSubmitted(true);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCoupon = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('OBRIGADA10');
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-warm-light/20 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header com Logomarca Oficial */}
        <header className="text-center space-y-3">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <div className="w-20 h-20 mx-auto relative rounded-full border-2 border-gold shadow-luxury p-1 bg-deep-black flex items-center justify-center">
              <Image
                src="/symbol-ana-fitness.png"
                alt="Ana Fitness Wear"
                width={72}
                height={72}
                className="rounded-full object-cover"
                priority
              />
            </div>
          </Link>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              ANA FITNESS WEAR • EXPERIÊNCIA DA CLIENTE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-deep-black mt-1">
              SUA OPINIÃO IMPORTA MUITO!
            </h1>
            <p className="text-xs text-deep-black/70 uppercase tracking-wide max-w-md mx-auto mt-1">
              Conte como ficou o caimento e o conforto da sua peça. Ao enviar, você ganha um cupom de <strong>10% OFF</strong> para seu próximo look!
            </p>
          </div>
        </header>

        {/* TELA DE SUCESSO APÓS O ENVIO */}
        {submitted ? (
          <div className="bg-white border-2 border-gold p-8 sm:p-10 shadow-luxury text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 mx-auto bg-gold text-deep-black rounded-full flex items-center justify-center shadow-md">
              <Heart className="w-8 h-8 fill-deep-black text-deep-black animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-gold block">
                AVALIAÇÃO RECEBIDA COM SUCESSO!
              </span>
              <h2 className="text-2xl font-black uppercase tracking-wider text-deep-black">
                MUITO OBRIGADA, {customerName.toUpperCase()}!
              </h2>
              <p className="text-xs text-deep-black/70 uppercase tracking-wide max-w-md mx-auto">
                Seu feedback foi publicado na nossa loja oficial e ajuda outras mulheres a escolherem o look com segurança.
              </p>
            </div>

            {/* Cartão de Cupom Presente */}
            <div className="bg-gradient-to-r from-deep-black via-zinc-950 to-deep-black text-white p-6 border-2 border-gold space-y-3 shadow-lg">
              <div className="flex items-center justify-center gap-2 text-gold">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">SEU PRESENTE EXCLUSIVO</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs text-white/80 uppercase">
                Use este cupom para garantir <strong>10% DE DESCONTO</strong> no seu próximo pedido:
              </p>

              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="bg-white/10 border-2 border-dashed border-gold px-6 py-3 font-mono font-black text-xl text-gold tracking-widest select-all">
                  OBRIGADA10
                </div>
                <button
                  type="button"
                  onClick={handleCopyCoupon}
                  className="px-5 py-3 bg-gold hover:bg-white text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  {copiedCoupon ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCoupon ? 'COPIADO!' : 'COPIAR'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-8 py-3.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 border border-gold shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>IR PARA A LOJA ONLINE</span>
              </Link>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE AVALIAÇÃO */
          <form
            onSubmit={handleSubmit}
            className="bg-white border-2 border-deep-black p-6 sm:p-8 shadow-luxury space-y-6"
          >
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border-2 border-red-500 text-red-900 text-xs font-black uppercase">
                {errorMessage}
              </div>
            )}

            {/* 1. SELEÇÃO DE ESTRELAS */}
            <div className="text-center space-y-2 border-b border-deep-black/10 pb-6">
              <label className="text-xs font-black uppercase tracking-widest text-deep-black block">
                QUAL É A SUA NOTA PARA A PEÇA?
              </label>

              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    aria-label={`Nota ${star} estrelas`}
                  >
                    <Star
                      className={`w-9 h-9 sm:w-11 sm:h-11 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'fill-gold text-gold drop-shadow-sm'
                          : 'fill-gray-200 text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <span className="text-[11px] font-black uppercase tracking-wider text-gold font-mono block">
                {rating === 5 && '⭐⭐⭐⭐⭐ EXCELENTE • AMEI A PEÇA!'}
                {rating === 4 && '⭐⭐⭐⭐ MUITO BOM!'}
                {rating === 3 && '⭐⭐⭐ BOM'}
                {rating <= 2 && 'PODE MELHORAR'}
              </span>
            </div>

            {/* 2. PRODUTO AVALIADO */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                <span>QUAL PEÇA VOCÊ ESTÁ AVALIANDO?</span>
                <span className="text-[10px] text-deep-black/50 font-normal">OPCIONAL</span>
              </label>
              <select
                value={selectedProductSlug}
                onChange={(e) => setSelectedProductSlug(e.target.value)}
                className="w-full p-3 border-2 border-deep-black text-xs font-bold uppercase focus:outline-none bg-warm-light/20 cursor-pointer"
              >
                <option value="">-- SELECIONE A SUA PEÇA --</option>
                {POPULAR_PRODUCTS.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>

              {selectedProductSlug === 'outro' && (
                <input
                  type="text"
                  placeholder="DIGITE O NOME DO SEU LOOK..."
                  value={customProductTitle}
                  onChange={(e) => setCustomProductTitle(e.target.value)}
                  className="w-full mt-2 p-3 border-2 border-deep-black text-xs font-bold uppercase focus:outline-none"
                />
              )}
            </div>

            {/* 3. DADOS DA CLIENTE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black">
                  SEU NOME COMPLETO *
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: MARIANA SILVA"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 border-2 border-deep-black text-xs font-bold uppercase focus:outline-none placeholder:text-deep-black/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black">
                  SUA CIDADE / ESTADO (EUA) *
                </label>
                <input
                  type="text"
                  placeholder="EX: BOSTON, MA OU LEOMINSTER, MA"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 border-2 border-deep-black text-xs font-bold uppercase focus:outline-none placeholder:text-deep-black/40"
                />
              </div>
            </div>

            {/* 4. OPINIÃO / DEPOIMENTO */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                <span>O QUE VOCÊ ACHOU DA PEÇA? *</span>
                <span className="text-[10px] text-gold font-mono font-bold">100% SINCERO</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Ex: O tecido é muito macio e confortável! Não fica transparente no agachamento e o cós segura muito bem no treino..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3.5 border-2 border-deep-black text-xs font-medium focus:outline-none placeholder:text-deep-black/40"
              />
              <p className="text-[10px] text-deep-black/60 uppercase">
                Dicas: Conte como ficou o caimento, se a tabela de medidas deu certo e o que mais gostou!
              </p>
            </div>

            {/* 5. FOTO USANDO A PEÇA (OPCIONAL) */}
            <div className="space-y-2 border-t border-deep-black/10 pt-4">
              <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-gold" />
                <span>FOTO USANDO A PEÇA (OPCIONAL)</span>
              </label>

              {photoUrl ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-300">
                  <div className="w-14 h-14 relative rounded-md overflow-hidden border border-emerald-500 shrink-0">
                    <img src={photoUrl} alt="Foto da avaliação" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-black uppercase text-emerald-900 block">
                      ✓ Foto adicionada com sucesso!
                    </span>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-[10px] text-red-600 font-bold uppercase underline mt-0.5 cursor-pointer"
                    >
                      Remover foto
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-deep-black/30 hover:border-gold p-4 flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition bg-warm-light/10">
                  <Upload className="w-5 h-5 text-gold" />
                  <span className="text-xs font-black uppercase text-deep-black">
                    {uploadingPhoto ? 'ENVIANDO FOTO...' : 'CLIQUE PARA ENVIAR UMA FOTO SEU LOOK'}
                  </span>
                  <span className="text-[10px] text-deep-black/60 uppercase">
                    Foto no espelho, treino ou dia a dia (PNG, JPG)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* BOTÃO ENVIAR */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 border border-gold shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-gold group-hover:text-deep-black" />
              <span>{submitting ? 'ENVIANDO SUA AVALIAÇÃO...' : 'ENVIAR AVALIAÇÃO & PEGAR MEU CUPOM 10% OFF'}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-deep-black/60 uppercase font-bold pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Avaliação real protegida • Ana Fitness Wear LLC</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AvaliarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs font-black uppercase tracking-wider text-deep-black">Carregando formulário...</div>}>
      <ReviewFormContent />
    </Suspense>
  );
}
