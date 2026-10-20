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
  Mail,
  Camera,
  Search,
  Tag,
  CheckCircle,
} from 'lucide-react';

export interface ReviewProductOption {
  slug: string;
  title: string;
  category: string;
  image: string;
}

const DEFAULT_POPULAR_PRODUCTS: ReviewProductOption[] = [
  {
    slug: 'samanta-romper',
    title: 'Samanta Romper',
    category: 'Macaquinho • Bojo Removível',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
  },
  {
    slug: 'beach-samanta-romper',
    title: 'Beach Samanta Romper',
    category: 'Macaquinho • Costas Abertas',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80',
  },
  {
    slug: 'blusa-bailarina',
    title: 'Bailarina Top',
    category: 'Top • Alta Sustentação',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80',
  },
  {
    slug: 'monique-flare-pants-set',
    title: 'Monique Flare Pants Set',
    category: 'Conjunto Calça Flare & Top',
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80',
  },
  {
    slug: 'conjunto-calca-kely',
    title: 'Kely Pants Set',
    category: 'Conjunto Calça & Top Sob Medida',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80',
  },
  {
    slug: 'macaquinho-deluxe',
    title: 'Deluxe Romper',
    category: 'Macaquinho Luxo Anatômico',
    image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80',
  },
];

function ReviewFormContent() {
  const searchParams = useSearchParams();
  const initialProductSlug = searchParams.get('produto') || searchParams.get('p') || '';
  const initialCustomerName = searchParams.get('nome') || searchParams.get('name') || '';
  const initialCustomerEmail = searchParams.get('email') || '';

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail);
  const [city, setCity] = useState('');
  const [selectedProductSlug, setSelectedProductSlug] = useState(initialProductSlug);
  const [customProductTitle, setCustomProductTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Produtos carregados da loja
  const [productList, setProductList] = useState<ReviewProductOption[]>(DEFAULT_POPULAR_PRODUCTS);

  useEffect(() => {
    async function loadStoreProducts() {
      try {
        const res = await fetch('/api/backoffice/products');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: ReviewProductOption[] = data.map((p: any) => ({
              slug: p.slug || p.id,
              title: p.title,
              category: p.categoryPt || 'Look Fitness',
              image: p.primaryImage || p.secondaryImage || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
            }));
            setProductList(mapped);
          }
        }
      } catch (err) {
        // Fallback já presente em DEFAULT_POPULAR_PRODUCTS
      }
    }
    loadStoreProducts();
  }, []);

  // Sincroniza com parâmetros de URL se passados
  useEffect(() => {
    if (initialProductSlug) {
      setSelectedProductSlug(initialProductSlug);
    }
    if (initialCustomerName) {
      setCustomerName(initialCustomerName);
    }
    if (initialCustomerEmail) {
      setCustomerEmail(initialCustomerEmail);
    }
  }, [initialProductSlug, initialCustomerName, initialCustomerEmail]);

  // Encontra o produto selecionado
  const selectedProduct = productList.find(
    (p) =>
      p.slug.toLowerCase() === selectedProductSlug.toLowerCase() ||
      p.title.toLowerCase() === selectedProductSlug.toLowerCase() ||
      selectedProductSlug.toLowerCase().includes(p.slug.toLowerCase()) ||
      p.slug.toLowerCase().includes(selectedProductSlug.toLowerCase())
  );

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
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Por favor, digite um e-mail válido para receber seu cupom de 10% OFF.');
      return;
    }
    if (!comment.trim() || comment.trim().length < 10) {
      setErrorMessage('Por favor, escreva uma frase sobre o que achou da sua peça (mínimo 10 caracteres).');
      return;
    }

    const productTitle = customProductTitle.trim() || selectedProduct?.title || selectedProductSlug || 'Look Ana Fitness Wear';

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          city: city.trim() || 'Massachusetts, EUA',
          productSlug: selectedProduct?.slug || selectedProductSlug || 'look-fitness',
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

      setEmailSentSuccess(Boolean(data.emailSent));
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

  const filteredProducts = productList.filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-warm-light/20 py-8 px-4 sm:px-6 lg:px-8">
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
              Conte como ficou o caimento e o conforto da sua peça. Ao enviar, você ganha <strong>10% OFF</strong> enviado diretamente para o seu e-mail!
            </p>
          </div>
        </header>

        {/* =========================================================================
            TELA DE SUCESSO APÓS O ENVIO (COM CONFIRMAÇÃO DE ENVIO POR E-MAIL)
           ========================================================================= */}
        {submitted ? (
          <div className="bg-white border-2 border-gold p-6 sm:p-10 shadow-luxury text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 mx-auto bg-gold text-deep-black rounded-full flex items-center justify-center shadow-md">
              <Heart className="w-8 h-8 fill-deep-black text-deep-black animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-gold block">
                AVALIAÇÃO RECEBIDA COM SUCESSO!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-deep-black">
                MUITO OBRIGADA, {customerName.toUpperCase()}!
              </h2>
              <p className="text-xs text-deep-black/70 uppercase tracking-wide max-w-md mx-auto">
                Seu feedback foi registrado e publicado com carinho na vitrine da nossa loja oficial!
              </p>
            </div>

            {/* Aviso de Envio do E-mail */}
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-sm text-left flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-950 block">
                  ✓ CUPOM ENVIADO PARA SEU E-MAIL COM SUCESSO!
                </span>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Enviamos o código do seu presente de 10% OFF para: <strong>{customerEmail}</strong>. Verifique sua caixa de entrada (ou pasta de promoções/spam) para salvar seu cupom!
                </p>
              </div>
            </div>

            {/* Cartão de Cupom Presente (Exibido na tela para uso imediato) */}
            <div className="bg-gradient-to-r from-deep-black via-zinc-950 to-deep-black text-white p-6 sm:p-7 border-2 border-gold space-y-3 shadow-lg">
              <div className="flex items-center justify-center gap-2 text-gold">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">SEU CUPOM DE 10% OFF</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs text-white/80 uppercase">
                Se quiser usar agora mesmo, é só copiar o código abaixo:
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <div className="w-full sm:w-auto bg-white/10 border-2 border-dashed border-gold px-8 py-3.5 font-mono font-black text-2xl text-gold tracking-widest select-all">
                  OBRIGADA10
                </div>
                <button
                  type="button"
                  onClick={handleCopyCoupon}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gold hover:bg-white text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  {copiedCoupon ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCoupon ? 'COPIADO!' : 'COPIAR CÓDIGO'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-8 py-4 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 border border-gold shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>IR PARA A LOJA APROVEITAR OS 10% OFF</span>
              </Link>
            </div>
          </div>
        ) : (
          /* =========================================================================
              FORMULÁRIO DE AVALIAÇÃO COM IDENTIFICAÇÃO VISUAL DAS PEÇAS POR FOTO
             ========================================================================= */
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
                {rating === 5 && '⭐⭐⭐⭐⭐ EXCELENTE • AMEI O LOOK!'}
                {rating === 4 && '⭐⭐⭐⭐ MUITO BOM!'}
                {rating === 3 && '⭐⭐⭐ BOM'}
                {rating <= 2 && 'PODE MELHORAR'}
              </span>
            </div>

            {/* 2. IDENTIFICAÇÃO VISUAL DA PEÇA (FOTO AO LADO DO NOME) */}
            <div className="space-y-3 border-b border-deep-black/10 pb-6">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-deep-black block">
                  QUAL LOOK VOCÊ COMPROU? (CLIQUE NA FOTO)
                </label>
                <p className="text-[11px] text-deep-black/60 uppercase">
                  Não precisa saber o nome técnico: basta reconhecer a foto da sua peça abaixo!
                </p>
              </div>

              {/* Se uma peça já foi selecionada, mostra destaque de confirmação visual */}
              {selectedProduct && (
                <div className="p-3.5 bg-gold/15 border-2 border-gold flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-md overflow-hidden border-2 border-deep-black shrink-0 relative bg-deep-black">
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-1.5 py-0.5">
                          LOOK SELECIONADO
                        </span>
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-deep-black mt-0.5">
                        {selectedProduct.title}
                      </h4>
                      <span className="text-[10px] text-deep-black/70 font-medium uppercase block">
                        {selectedProduct.category}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Galeria Visual de Peças com Foto e Nome */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-warm-light/40 border border-deep-black/20 px-3 py-2 text-xs">
                  <Search className="w-3.5 h-3.5 text-deep-black/50" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Filtrar por nome ou tipo (macaquinho, calça, top)..."
                    className="w-full bg-transparent text-xs font-bold uppercase focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1 border border-deep-black/15 bg-white">
                  {filteredProducts.map((p) => {
                    const isSelected =
                      selectedProductSlug.toLowerCase() === p.slug.toLowerCase() ||
                      selectedProductSlug.toLowerCase() === p.title.toLowerCase();

                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => {
                          setSelectedProductSlug(p.slug);
                          setCustomProductTitle('');
                        }}
                        className={`text-left p-2 border-2 transition-all flex flex-col justify-between group cursor-pointer ${
                          isSelected
                            ? 'border-gold bg-gold/10 shadow-sm ring-2 ring-gold/40'
                            : 'border-deep-black/15 bg-white hover:border-deep-black hover:bg-neutral-50'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="w-full aspect-square rounded overflow-hidden border border-deep-black/20 bg-neutral-100 relative">
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-gold text-deep-black p-0.5 rounded-full shadow">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <strong className="text-[11px] font-black uppercase text-deep-black line-clamp-1 block leading-tight">
                              {p.title}
                            </strong>
                            <span className="text-[9px] text-deep-black/60 font-medium uppercase line-clamp-1 block">
                              {p.category}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Opção para outra peça não listada */}
                  <button
                    type="button"
                    onClick={() => setSelectedProductSlug('outro')}
                    className={`text-left p-2 border-2 transition-all flex flex-col items-center justify-center text-center p-3 cursor-pointer ${
                      selectedProductSlug === 'outro'
                        ? 'border-gold bg-gold/10 shadow-sm ring-2 ring-gold/40'
                        : 'border-dashed border-deep-black/30 hover:border-deep-black bg-neutral-50'
                    }`}
                  >
                    <Tag className="w-6 h-6 text-gold mb-1" />
                    <span className="text-[10px] font-black uppercase text-deep-black block">
                      OUTRA PEÇA
                    </span>
                    <span className="text-[8px] text-deep-black/50 uppercase block">
                      Digitar nome
                    </span>
                  </button>
                </div>

                {selectedProductSlug === 'outro' && (
                  <div className="pt-2 animate-fadeIn">
                    <label className="text-[10px] font-black uppercase text-deep-black block mb-1">
                      DESCREVA QUAL PEÇA VOCÊ COMPROU:
                    </label>
                    <input
                      type="text"
                      placeholder="EX: MACACÃO LONGO PRETO COM TRANSPARÊNCIA..."
                      value={customProductTitle}
                      onChange={(e) => setCustomProductTitle(e.target.value)}
                      className="w-full p-2.5 border-2 border-deep-black text-xs font-bold uppercase focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 3. DADOS DA CLIENTE & E-MAIL PARA ENVIO DO CUPOM */}
            <div className="space-y-4">
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

              {/* CAMPO DE E-MAIL COM DESTAQUE DOURADO */}
              <div className="p-4 bg-gold/10 border-2 border-gold space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-gold" />
                    <span>SEU E-MAIL (PARA RECEBER O CUPOM 10% OFF) *</span>
                  </span>
                  <span className="text-[9px] font-black bg-gold text-deep-black px-1.5 py-0.5">
                    ONDE ENVIAMOS O CUPOM
                  </span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu-email@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-deep-black text-xs font-mono font-bold lowercase focus:outline-none placeholder:text-deep-black/40"
                />
                <p className="text-[10px] text-deep-black/70 font-medium">
                  ✉️ Assim que você enviar sua avaliação, o código do cupom <strong>OBRIGADA10</strong> será enviado imediatamente para este e-mail!
                </p>
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
                placeholder="Ex: O tecido é muito macio e confortável! Não fica transparente no agachamento e o cós anatômico segura muito bem no treino..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3.5 border-2 border-deep-black text-xs font-medium focus:outline-none placeholder:text-deep-black/40"
              />
              <p className="text-[10px] text-deep-black/60 uppercase">
                Dicas: Conte como ficou o caimento, se a tabela de medidas deu certo e o que mais você adorou!
              </p>
            </div>

            {/* 5. FOTO USANDO A PEÇA (OPCIONAL) */}
            <div className="space-y-2 border-t border-deep-black/10 pt-4">
              <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-gold" />
                <span>FOTO VESTINDO A PEÇA (OPCIONAL)</span>
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
                    {uploadingPhoto ? 'ENVIANDO FOTO...' : 'CLIQUE PARA ENVIAR UMA FOTO DO SEU LOOK'}
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
              <span>{submitting ? 'ENVIANDO SUA AVALIAÇÃO...' : 'ENVIAR AVALIAÇÃO & RECEBER CUPOM 10% OFF NO E-MAIL'}</span>
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
