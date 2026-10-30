'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  Search,
  Sparkles,
  Radio,
  CheckCircle2,
  Share2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface TikTokProduct {
  id: string;
  slug: string;
  title: string;
  category?: string;
  price: string | number;
  primaryImage: string;
  images?: string[];
  variants?: any[];
  tiktokLink: string;
  shareText: string;
}

interface TikTokCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TikTokCatalogModal({ isOpen, onClose }: TikTokCatalogModalProps) {
  const [baseUrl, setBaseUrl] = useState('https://anafitwear.com');
  const [products, setProducts] = useState<TikTokProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncingApi, setSyncingApi] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch('/api/catalog/tiktok?format=json')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => {
        console.error('Erro ao buscar produtos TikTok:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const feedUrl = `${baseUrl}/api/catalog/tiktok`;
  const csvUrl = `${baseUrl}/api/catalog/tiktok?format=csv`;

  const copyToClipboard = (text: string, key: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 3000);
    } catch (e) {
      console.warn('Erro ao copiar:', e);
    }
  };

  const handleSyncAllTikTok = async () => {
    setSyncingApi(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/catalog/tiktok/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_sync', productId: 'ALL' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus(`✓ Sincronização concluída com sucesso! ${data.totalProcessed || products.length} produtos validados para o TikTok.`);
      } else {
        setSyncStatus(`ℹ ${data.message || 'Catálogo pronto! Para sincronização contínua, adicione a URL do feed no TikTok Shop.'}`);
      }
    } catch (err: any) {
      setSyncStatus(`Erro ao acionar sincronização: ${err.message}`);
    } finally {
      setSyncingApi(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white border-2 border-deep-black w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header Luxury TikTok */}
        <div className="bg-deep-black text-white p-5 sm:p-6 border-b-2 border-gold flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-gradient-to-tr from-[#fe2c55] to-[#25f4ee] rounded-xs text-black font-black text-xs shadow-xs">
                🎵
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                PADRÃO OFICIAL TIKTOK SHOP US & SOCIAL COMMERCE
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider flex items-center gap-2 text-white">
              <span>CENTRAL DE LINKS & CATÁLOGO DO TIKTOK</span>
            </h2>
            <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
              Todos os produtos foram preparados e validados nas diretrizes de alta conversão do TikTok: títulos claros, zero transparência, imagens em alta resolução, moeda USD e frete USPS $9.99.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title="Fechar Janela"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50">
          {/* CARD 1: LINK DO FEED AUTOMÁTICO EM MASSA */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deep-black/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-widest text-deep-black">
                  1. LINK DO FEED AUTOMÁTICO DO CATÁLOGO (SINCRONIZAÇÃO EM MASSA)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5">
                PADRÃO XML RSS 2.0 • ATUALIZAÇÃO EM TEMPO REAL
              </span>
            </div>

            <p className="text-xs text-deep-black/80 leading-relaxed">
              Cole este link no seu <strong>TikTok Shop Seller Center</strong> (em <em>Produtos &gt; Feeds de Dados / Data Feeds &gt; Adicionar Novo Feed</em>). O TikTok irá ler todas as peças, fotos de capa, tamanhos, preços e estoque da loja automaticamente.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={feedUrl}
                  className="w-full p-3 bg-stone-100 border border-deep-black/30 font-mono text-xs font-bold text-deep-black focus:outline-none select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(feedUrl, 'feed-url')}
                className={`px-5 py-3 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0 ${
                  copiedKey === 'feed-url'
                    ? 'bg-green-600 text-white'
                    : 'bg-deep-black hover:bg-gold hover:text-deep-black text-white'
                }`}
              >
                {copiedKey === 'feed-url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'feed-url' ? '✓ LINK COPIADO!' : 'COPIAR LINK DO FEED'}</span>
              </button>

              <a
                href={csvUrl}
                download="tiktok_catalog_feed.csv"
                className="px-4 py-3 bg-stone-200 hover:bg-stone-300 text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 border border-deep-black/20 shrink-0 cursor-pointer"
                title="Baixar planilha CSV completa para upload manual no TikTok Shop"
              >
                <Download className="w-4 h-4" />
                <span>BAIXAR CSV</span>
              </a>
            </div>

            {syncStatus && (
              <div className="p-3 bg-green-50 border border-green-400 text-green-900 text-xs font-bold uppercase tracking-wide flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                <span>{syncStatus}</span>
              </div>
            )}
          </div>

          {/* CARD 2: LINKS INDIVIDUAIS DE CADA PRODUTO */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-deep-black/10 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-gold" />
                  <span>2. LINKS INDIVIDUAIS DE CADA PRODUTO (VÍDEOS, BIO, LIVES & MENSAGENS)</span>
                </h3>
                <p className="text-[11px] text-deep-black/60 mt-0.5">
                  Copie o link direto ou a legenda pronta para colar nas suas postagens do TikTok.
                </p>
              </div>

              {/* Barra de Busca */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-deep-black/40" />
                <input
                  type="text"
                  placeholder="Buscar peça por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-deep-black/30 text-xs font-bold uppercase focus:border-gold outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs font-black uppercase text-deep-black/60 animate-pulse">
                Carregando catálogo no padrão TikTok...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold uppercase text-deep-black/50">
                Nenhum produto encontrado para a busca &quot;{search}&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((p) => {
                  const productUrl = `${baseUrl}/produto/${p.slug}?utm_source=tiktok&utm_medium=social&utm_campaign=product_showcase`;
                  const isCopied = copiedKey === `link-${p.slug}`;
                  const isTextCopied = copiedKey === `text-${p.slug}`;

                  return (
                    <div
                      key={p.slug || p.id}
                      className="border-2 border-deep-black p-3.5 bg-white flex flex-col justify-between gap-3 hover:border-gold transition group shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={p.primaryImage || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80'}
                          alt={p.title}
                          className="w-16 h-20 object-cover border border-deep-black/20 shrink-0 bg-stone-100"
                        />
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-deep-black text-gold">
                              {p.category || 'CONJUNTO'}
                            </span>
                            <span className="text-[9px] font-black text-green-700 bg-green-50 border border-green-200 px-1 py-0.2">
                              ✓ PADRÃO TIKTOK
                            </span>
                          </div>

                          <h4 className="text-xs font-black uppercase text-deep-black truncate block">
                            {p.title}
                          </h4>

                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="font-black text-deep-black">${Number(p.price).toFixed(2)} USD</span>
                            <span className="text-[10px] text-deep-black/50">• Frete $9.99</span>
                          </div>

                          <span className="text-[10px] text-deep-black/60 block truncate font-mono">
                            /produto/{p.slug}
                          </span>
                        </div>
                      </div>

                      {/* Botões de Ação para o TikTok */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-deep-black/10">
                        {/* Botão Copiar Link */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(productUrl, `link-${p.slug}`)}
                          className={`py-2 px-2.5 text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border ${
                            isCopied
                              ? 'bg-green-600 border-green-700 text-white'
                              : 'bg-deep-black border-deep-black text-white hover:bg-gold hover:text-deep-black hover:border-gold'
                          }`}
                          title="Copiar o link direto deste produto formatado com tags do TikTok"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-gold group-hover:text-deep-black" />}
                          <span>{isCopied ? '✓ LINK COPIADO!' : 'COPIAR LINK'}</span>
                        </button>

                        {/* Botão Copiar Texto Completo com Link */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(p.shareText || `${p.title} • $${p.price} USD • ${productUrl}`, `text-${p.slug}`)}
                          className={`py-2 px-2.5 text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                            isTextCopied
                              ? 'bg-green-600 border-green-700 text-white'
                              : 'bg-stone-100 hover:bg-stone-200 text-deep-black border-deep-black/20'
                          }`}
                          title="Copiar texto pronto com preço, benefícios e link para colar na descrição do vídeo do TikTok"
                        >
                          {isTextCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span>{isTextCopied ? '✓ TEXTO COPIADO!' : 'TEXTO + LINK'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DICAS DE OURO PARA O TIKTOK SHOP US */}
          <div className="bg-amber-50 border-2 border-gold p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-black uppercase text-deep-black">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>COMO USAR OS LINKS NO TIKTOK:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-deep-black/80 font-medium">
              <li><strong>Na Bio do TikTok:</strong> Cole o link da loja ou do catálogo principal para os seguidores comprarem com 1 toque.</li>
              <li><strong>Em Vídeos e Reels:</strong> Clique em <strong>&quot;COPIAR LINK&quot;</strong> ou <strong>&quot;TEXTO + LINK&quot;</strong> e cole na legenda ou no primeiro comentário fixado do seu vídeo.</li>
              <li><strong>No TikTok Shop Seller Center:</strong> Vá em <em>Catalog &gt; Data Feeds</em> e use o <strong>LINK DO FEED</strong> acima para ter todos os produtos sincronizados automaticamente.</li>
            </ul>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="bg-white border-t-2 border-deep-black p-4 flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono font-bold text-deep-black/60 uppercase">
            {products.length} PRODUTOS ATIVOS E VALIDADOS NO PADRÃO TIKTOK SHOP
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black font-black text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}
