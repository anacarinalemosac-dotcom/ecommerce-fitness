'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Star,
  Sparkles,
  Heart,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Mail,
  Search,
  CheckCircle2,
  Lock,
  User,
} from 'lucide-react';

export interface CatalogItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string;
  price: number;
}

function AvaliarHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialProductSlug = searchParams.get('produto') || searchParams.get('p') || searchParams.get('slug') || '';
  const initialCustomerEmail = searchParams.get('email') || '';
  const initialCustomerName = searchParams.get('nome') || searchParams.get('name') || '';

  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  // Redireciona imediatamente para a página do produto se o slug foi informado na URL
  useEffect(() => {
    if (initialProductSlug) {
      setRedirecting(true);
      const emailParam = initialCustomerEmail ? `&email=${encodeURIComponent(initialCustomerEmail)}` : '';
      const nameParam = initialCustomerName ? `&nome=${encodeURIComponent(initialCustomerName)}` : '';
      const targetUrl = `/produto/${initialProductSlug}?avaliar=true${emailParam}${nameParam}`;
      router.replace(targetUrl);
    }
  }, [initialProductSlug, initialCustomerEmail, initialCustomerName, router]);

  // Carrega produtos reais do catálogo da loja
  useEffect(() => {
    async function fetchStoreCatalog() {
      try {
        const res = await fetch('/api/backoffice/products');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: CatalogItem[] = data.map((p: any) => ({
              id: p.id,
              slug: p.slug || p.id,
              title: p.title,
              category: p.categoryPt || p.category || 'Look Fitness',
              image: p.primaryImage || p.image || '/symbol-ana-fitness.png',
              price: Number(p.price || 0),
            }));
            setProducts(mapped);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar catálogo oficial:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!initialProductSlug) {
      fetchStoreCatalog();
    }
  }, [initialProductSlug]);

  if (redirecting) {
    return (
      <div className="min-h-screen bg-warm-light/20 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-gold border-t-transparent animate-spin mb-4" />
        <h2 className="text-sm font-black uppercase tracking-wider text-deep-black">
          Redirecionando para a página da sua peça...
        </h2>
        <p className="text-xs text-deep-black/60 uppercase mt-1">
          A avaliação oficial com verificação de compra é feita diretamente no look.
        </p>
      </div>
    );
  }

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-warm-light/20 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Topo Oficial com Identidade de Luxo */}
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
              ANA FITNESS WEAR • EXPERIÊNCIA DA CLIENTE & AVALIAÇÃO VERIFICADA
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-deep-black mt-1">
              AVALIE SEU LOOK E GANHE 10% OFF
            </h1>
            <p className="text-xs text-deep-black/70 uppercase tracking-wide max-w-xl mx-auto mt-2 leading-relaxed">
              Para garantir 100% de transparência e autenticidade, as avaliações são feitas <strong>diretamente na página oficial de cada look</strong> após identificação da cliente compradora.
            </p>
          </div>
        </header>

        {/* Banner Informativo com Cupom OBRIGADA10 */}
        <div className="bg-gradient-to-r from-deep-black via-zinc-950 to-deep-black text-white p-6 border-2 border-gold shadow-luxury flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-gold">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">
                COMO FUNCIONA O PRESENTE DE AVALIAÇÃO
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed max-w-xl">
              1. Selecione abaixo a peça que você comprou.<br />
              2. Na página do look, role até a aba <strong>AVALIAÇÕES</strong> e faça login ou informe seu e-mail de compra.<br />
              3. Conte o que achou do caimento e receba seu cupom <strong>OBRIGADA10 (10% OFF)</strong> direto no seu e-mail!
            </p>
          </div>

          <div className="bg-white/10 border border-gold/40 px-4 py-3 text-center shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              RECOMPENSA EXCLUSIVA
            </span>
            <span className="text-xl font-mono font-black text-gold tracking-widest block mt-0.5">
              10% OFF
            </span>
            <span className="text-[9px] text-white/60 uppercase block">CUPOM NO SEU E-MAIL</span>
          </div>
        </div>

        {/* Barra de Busca de Peças */}
        <div className="bg-white border-2 border-deep-black p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 flex-1 w-full bg-warm-light/40 border border-deep-black/20 px-3 py-2.5">
            <Search className="w-4 h-4 text-deep-black/50 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digite o nome da peça que você comprou (ex: Samanta Romper, Flare...)"
              className="w-full bg-transparent text-xs font-bold uppercase focus:outline-none placeholder:text-deep-black/40"
            />
          </div>

          <span className="text-[10px] font-black text-deep-black/60 uppercase shrink-0">
            {filtered.length} looks encontrados
          </span>
        </div>

        {/* Grade de Produtos Reais da Loja */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-black uppercase tracking-wider text-deep-black/60">
              Carregando catálogo oficial da loja...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-deep-black/20 p-12 text-center space-y-4">
            <ShoppingBag className="w-10 h-10 text-deep-black/30 mx-auto" />
            <h3 className="text-sm font-black uppercase text-deep-black">
              Nenhuma peça encontrada com essa busca
            </h3>
            <p className="text-xs text-deep-black/60 max-w-sm mx-auto">
              Tente buscar por palavras como &quot;romper&quot;, &quot;calça&quot;, &quot;top&quot; ou confira toda a nossa vitrine oficial.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-deep-black text-white text-xs font-black uppercase tracking-wider hover:bg-gold hover:text-deep-black transition"
            >
              <span>VER TODAS AS PEÇAS NA LOJA</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const emailParam = initialCustomerEmail ? `&email=${encodeURIComponent(initialCustomerEmail)}` : '';
              const nameParam = initialCustomerName ? `&nome=${encodeURIComponent(initialCustomerName)}` : '';
              const reviewLink = `/produto/${item.slug}?avaliar=true${emailParam}${nameParam}`;

              return (
                <div
                  key={item.id}
                  className="bg-white border-2 border-deep-black/15 hover:border-gold transition-all duration-300 shadow-sm hover:shadow-luxury flex flex-col justify-between group overflow-hidden"
                >
                  <div>
                    {/* Imagem Real da Peça */}
                    <div className="w-full aspect-[4/5] bg-neutral-100 overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 bg-deep-black/90 text-gold px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border border-gold/40">
                        {item.category}
                      </div>
                    </div>

                    {/* Informações da Peça */}
                    <div className="p-4 space-y-1.5">
                      <h3 className="text-sm font-black uppercase tracking-wider text-deep-black line-clamp-1 group-hover:text-gold transition-colors">
                        {item.title}
                      </h3>
                      {item.price > 0 && (
                        <p className="text-xs font-mono font-bold text-deep-black/70">
                          ${item.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botão de Avaliação com Link Direto para a Peça */}
                  <div className="p-4 pt-0">
                    <Link
                      href={reviewLink}
                      className="w-full py-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 border border-gold shadow-xs"
                    >
                      <Star className="w-3.5 h-3.5 fill-gold text-gold group-hover:fill-deep-black group-hover:text-deep-black" />
                      <span>AVALIAR ESTE LOOK &rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rodapé de Confiança e Segurança */}
        <div className="p-6 bg-white border border-deep-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
                SISTEMA DE AVALIAÇÃO VERIFICADA
              </h4>
              <p className="text-[11px] text-deep-black/60 uppercase">
                Apenas clientes que realmente compraram podem postar depoimentos e fotos.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs font-black uppercase tracking-wider text-deep-black hover:text-gold transition flex items-center gap-1 shrink-0"
          >
            <span>VOLTAR PARA A LOJA OFICIAL</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AvaliarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-warm-light/20 flex items-center justify-center text-xs font-black uppercase tracking-wider text-deep-black">
          Carregando catálogo de avaliação...
        </div>
      }
    >
      <AvaliarHubContent />
    </Suspense>
  );
}
