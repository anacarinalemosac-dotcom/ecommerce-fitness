'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Camera,
  Check,
  CheckCircle2,
  Download,
  Share2,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
  Zap,
  ExternalLink,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AIModelStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogProducts?: any[];
  initialProduct?: any;
  onCoverUpdated?: () => void;
}

export function AIModelStudioModal({
  isOpen,
  onClose,
  catalogProducts = [],
  initialProduct = null,
  onCoverUpdated,
}: AIModelStudioModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productTitle, setProductTitle] = useState<string>('');
  const [productImage, setProductImage] = useState<string>('');
  const [customUploadUrl, setCustomUploadUrl] = useState<string>('');

  // Configurações da Modelo Virtual
  const [modelProfile, setModelProfile] = useState<'latina_curls' | 'blonde_waves' | 'brunette_sleek' | 'black_goddess'>('latina_curls');
  const [bodyType, setBodyType] = useState<'curvy_sculpt' | 'fitness_toned' | 'slim_athletic'>('curvy_sculpt');
  const [scene, setScene] = useState<'penthouse_miami' | 'luxury_gold_studio' | 'glass_gym' | 'minimalist_loft'>('penthouse_miami');
  const [aspectRatio, setAspectRatio] = useState<'3:4' | '9:16' | '1:1'>('3:4');

  // Estados de Geração
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('/uploads/ai-model-demo-monique.jpg');
  const [savingCover, setSavingCover] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Inicializa com o produto selecionado caso exista
  useEffect(() => {
    if (!isOpen) return;

    if (initialProduct) {
      setSelectedProductId(initialProduct.id || '');
      setProductTitle(initialProduct.title || '');
      const img =
        initialProduct.meta?.primary_image ||
        initialProduct.primary_image ||
        initialProduct.primaryImage ||
        (Array.isArray(initialProduct.images) && initialProduct.images[0]) ||
        '';
      setProductImage(img);
    } else if (catalogProducts && catalogProducts.length > 0) {
      const first = catalogProducts[0];
      setSelectedProductId(first.id || '');
      setProductTitle(first.title || '');
      const img =
        first.meta?.primary_image ||
        first.primary_image ||
        first.primaryImage ||
        (Array.isArray(first.images) && first.images[0]) ||
        '';
      setProductImage(img);
    }
  }, [isOpen, initialProduct, catalogProducts]);

  if (!isOpen) return null;

  const handleSelectProduct = (pId: string) => {
    setSelectedProductId(pId);
    const found = catalogProducts.find((p) => p.id === pId);
    if (found) {
      setProductTitle(found.title || '');
      const img =
        found.meta?.primary_image ||
        found.primary_image ||
        found.primaryImage ||
        (Array.isArray(found.images) && found.images[0]) ||
        '';
      setProductImage(img);
      setCustomUploadUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setCustomUploadUrl(data.url);
        setProductImage(data.url);
      }
    } catch (err) {
      console.warn('Erro ao fazer upload da peça:', err);
    }
  };

  const handleGenerateModel = async () => {
    setIsGenerating(true);
    setSaveSuccessMsg(false);

    // Efeito visual de etapas da inteligência artificial
    setGenerationStep('Identificando tecido, decote e modelagem da peça...');
    await new Promise((r) => setTimeout(r, 900));

    setGenerationStep('Ajustando proporções anatômicas sculpt fit na modelo...');
    await new Promise((r) => setTimeout(r, 1100));

    setGenerationStep('Renderizando iluminação de estúdio luxo e sombras reais...');

    try {
      const res = await fetch('/api/ai/virtual-try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          productId: selectedProductId,
          productTitle,
          productImage: customUploadUrl || productImage,
          modelProfile,
          bodyType,
          scene,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (res.ok && data.resultImageUrl) {
        setGeneratedImageUrl(data.resultImageUrl);
      }
    } catch (err) {
      console.warn('Erro na geração com IA:', err);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleSetAsProductCover = async () => {
    if (!selectedProductId || !generatedImageUrl) return;

    setSavingCover(true);
    try {
      const res = await fetch('/api/ai/virtual-try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_cover',
          productId: selectedProductId,
          imageUrlToSave: generatedImageUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccessMsg(true);
        if (onCoverUpdated) {
          onCoverUpdated();
        }
        setTimeout(() => setSaveSuccessMsg(false), 5000);
      }
    } catch (err) {
      console.warn('Erro ao salvar capa:', err);
    } finally {
      setSavingCover(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const fullUrl = generatedImageUrl.startsWith('http')
        ? generatedImageUrl
        : `${window.location.origin}${generatedImageUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white border-2 border-deep-black w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header Luxury AI Studio */}
        <div className="bg-gradient-to-r from-deep-black via-zinc-950 to-deep-black text-white p-5 sm:p-6 border-b-2 border-gold flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-gold text-deep-black rounded-xs font-black text-xs">
                ✨
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                ANA FITNESS WEAR • VIRTUAL TRY-ON STUDIO IA
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider flex items-center gap-2 text-white">
              <span>ESTÚDIO IA DE MODELOS VIRTUAIS (PADRÃO TIKTOK)</span>
            </h2>
            <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
              Transforme fotos de roupas no cabide, esticadas na mesa ou do fornecedor em fotos profissionais de alta conversão com modelos fitness reais vestindo suas peças.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title="Fechar Estúdio"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Corpo Principal com 2 Colunas */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50">
          {saveSuccessMsg && (
            <div className="p-4 bg-green-50 border-2 border-green-600 text-green-900 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0" />
              <span>✓ Sucesso! A foto da modelo gerada pela IA já foi definida como a FOTO DE CAPA PRINCIPAL deste produto no site e no Backoffice!</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUNA ESQUERDA: CONTROLES E CONFIGURAÇÃO DA IA (5 Colunas) */}
            <div className="lg:col-span-5 space-y-5 bg-white p-5 border-2 border-deep-black shadow-sm">
              <div className="flex items-center gap-2 border-b border-deep-black/10 pb-3">
                <Sliders className="w-4 h-4 text-gold" />
                <h3 className="text-xs font-black uppercase tracking-widest text-deep-black">
                  1. SELECIONE A PEÇA E PERSONALIZE A MODELO
                </h3>
              </div>

              {/* Escolha do Produto do Catálogo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  PRODUTO DO CATÁLOGO:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-deep-black/30 text-xs font-bold text-deep-black uppercase focus:border-gold outline-none"
                >
                  <option value="">-- Selecione uma peça da loja --</option>
                  {catalogProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (${Number(p.price || 49.9).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Opcional de Foto do Celular/Cabide */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center justify-between">
                  <span>OU FAZER UPLOAD DE NOVA FOTO (CABIDE / MANEQUIM):</span>
                  <span className="text-[9px] text-gold font-bold">ROLO DA CÂMERA</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 border-2 border-dashed border-deep-black/30 hover:border-gold p-3 bg-stone-50 text-center cursor-pointer transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-deep-black uppercase">
                      <Camera className="w-4 h-4 text-gold" />
                      <span>{customUploadUrl ? '✓ Foto Carregada (Trocar)' : 'Tirar Foto ou Escolher Arquivo'}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Biotipo da Modelo */}
              <div className="space-y-1.5 pt-2 border-t border-deep-black/10">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  BIOTIPO DA MODELO FITNESS:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'curvy_sculpt', label: 'Curvas / Sculpt', desc: 'Padrão Brasil' },
                    { id: 'fitness_toned', label: 'Toned / Definida', desc: 'Musculosa' },
                    { id: 'slim_athletic', label: 'Slim / Longilínea', desc: 'Esguia' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBodyType(b.id as any)}
                      className={`p-2 border text-left transition cursor-pointer ${
                        bodyType === b.id
                          ? 'border-gold bg-gold/15 text-deep-black font-black shadow-xs'
                          : 'border-deep-black/20 bg-stone-50 text-deep-black/70 hover:border-deep-black'
                      }`}
                    >
                      <span className="block text-[11px] font-black uppercase">{b.label}</span>
                      <span className="block text-[8px] text-deep-black/60 uppercase">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Perfil & Cabelo da Modelo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  PERFIL & CABELO:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'latina_curls', label: 'Morena Cachos Dourados' },
                    { id: 'blonde_waves', label: 'Loira com Ondas' },
                    { id: 'brunette_sleek', label: 'Morena Cabelo Liso' },
                    { id: 'black_goddess', label: 'Negra Imponente / Tranças' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModelProfile(m.id as any)}
                      className={`p-2 border text-left transition cursor-pointer ${
                        modelProfile === m.id
                          ? 'border-gold bg-gold/15 text-deep-black font-black shadow-xs'
                          : 'border-deep-black/20 bg-stone-50 text-deep-black/70 hover:border-deep-black'
                      }`}
                    >
                      <span className="block text-[10px] font-black uppercase truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cenário de Fundo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  CENÁRIO DE FUNDO:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'penthouse_miami', label: 'Penthouse Luxo Miami' },
                    { id: 'luxury_gold_studio', label: 'Estúdio Clean Dourado' },
                    { id: 'glass_gym', label: 'Academia Moderna Vidro' },
                    { id: 'minimalist_loft', label: 'Loft Minimalista Chic' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setScene(s.id as any)}
                      className={`p-2 border text-left transition cursor-pointer ${
                        scene === s.id
                          ? 'border-gold bg-gold/15 text-deep-black font-black shadow-xs'
                          : 'border-deep-black/20 bg-stone-50 text-deep-black/70 hover:border-deep-black'
                      }`}
                    >
                      <span className="block text-[10px] font-black uppercase truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Proporção da Imagem */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                  FORMATO / PROPORÇÃO:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '3:4', label: '3:4 Vitrine & Feed' },
                    { id: '9:16', label: '9:16 TikTok / Reels' },
                    { id: '1:1', label: '1:1 Quadrado' },
                  ].map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id as any)}
                      className={`p-2 border text-center transition cursor-pointer ${
                        aspectRatio === ar.id
                          ? 'border-gold bg-gold/15 text-deep-black font-black shadow-xs'
                          : 'border-deep-black/20 bg-stone-50 text-deep-black/70 hover:border-deep-black'
                      }`}
                    >
                      <span className="block text-[10px] font-black uppercase">{ar.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão de Disparo da Geração com IA */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateModel}
                className="w-full py-4 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border-2 border-gold shadow-md cursor-pointer disabled:opacity-50 mt-4 group"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-gold animate-spin" />
                    <span>VESTINDO MODELO COM IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-gold group-hover:text-deep-black" />
                    <span>✨ GERAR MODELO VESTINDO COM IA</span>
                  </>
                )}
              </button>

              {generationStep && (
                <p className="text-[11px] font-mono font-bold text-center text-amber-700 animate-pulse bg-amber-50 p-2 border border-amber-300">
                  {generationStep}
                </p>
              )}
            </div>

            {/* COLUNA DIREITA: COMPARADOR ANTES E DEPOIS (7 Colunas) */}
            <div className="lg:col-span-7 space-y-4 bg-white p-5 border-2 border-deep-black shadow-sm">
              <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gold" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-deep-black">
                    2. RESULTADO VISUAL (ANTES: PEÇA / DEPOIS: MODELO VESTINDO)
                  </h3>
                </div>
                <span className="text-[9px] bg-green-100 text-green-900 border border-green-300 px-2 py-0.5 font-black uppercase font-mono">
                  8K ULTRA HD • SQUAT-PROOF
                </span>
              </div>

              {/* Grade Comparativa Lado a Lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Imagem Original da Peça */}
                <div className="border border-deep-black/20 p-2.5 bg-stone-50 flex flex-col items-center justify-between space-y-2">
                  <span className="text-[10px] font-black uppercase text-deep-black/60 tracking-wider">
                    FOTO ORIGINAL DA PEÇA
                  </span>
                  <div className="w-full h-80 sm:h-96 bg-stone-200 flex items-center justify-center overflow-hidden border border-deep-black/10">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt="Peça Original"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="p-4 text-center text-xs text-deep-black/40 font-bold uppercase">
                        Nenhuma foto selecionada
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-deep-black/50 font-mono truncate max-w-full">
                    {productTitle || 'Peça Fitness'}
                  </span>
                </div>

                {/* Imagem da Modelo Gerada pela IA */}
                <div className="border-2 border-gold p-2.5 bg-gradient-to-b from-stone-50 to-amber-50/30 flex flex-col items-center justify-between space-y-2 relative shadow-luxury">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black uppercase text-gold tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-gold" /> MODELO IA VESTINDO A PEÇA
                    </span>
                    <span className="text-[8px] bg-gold text-deep-black px-1.5 py-0.2 font-black uppercase">
                      PADRÃO TIKTOK
                    </span>
                  </div>

                  <div className="w-full h-80 sm:h-96 bg-deep-black flex items-center justify-center overflow-hidden relative group">
                    <img
                      src={generatedImageUrl}
                      alt="Modelo Gerada com IA"
                      className="w-full h-full object-cover"
                    />

                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center">
                        <RefreshCw className="w-8 h-8 text-gold animate-spin" />
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          VESTINDO A MODELO COM TECNOLOGIA IA...
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-deep-black/70 font-mono font-bold">
                    Caimento perfeito • Compressão Anatômica
                  </span>
                </div>
              </div>

              {/* Botões de Ação para Salvar ou Baixar */}
              <div className="pt-3 border-t border-deep-black/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-deep-black font-black text-xs uppercase tracking-wider border border-deep-black/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Copiar URL direta da foto gerada"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '✓ LINK COPIADO' : 'COPIAR LINK'}</span>
                </button>

                <a
                  href={generatedImageUrl}
                  download="ana-fitness-ai-model.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-deep-black font-black text-xs uppercase tracking-wider border border-deep-black/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Baixar imagem em resolução máxima para postar no TikTok"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>BAIXAR FOTO EM HD</span>
                </a>

                {/* Botão de Ouro: Definir como Capa Principal do Produto no Site */}
                <button
                  type="button"
                  disabled={savingCover || !selectedProductId}
                  onClick={handleSetAsProductCover}
                  className="px-5 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-wider border-2 border-gold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  title="Colocar esta foto imediatamente como a Capa Oficial do Produto no Site e Vitrine"
                >
                  {savingCover ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-gold animate-spin" />
                      <span>SALVANDO NA CAPA...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gold">★</span>
                      <span>DEFINIR COMO CAPA DO PRODUTO</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dica de Especialista */}
              <div className="p-3 bg-amber-50 border border-gold/40 text-[11px] text-deep-black/80 flex items-start gap-2">
                <Info className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <p>
                  <strong>Dica de Vendas TikTok Shop:</strong> Fotos de produtos com modelos atléticas em poses naturais e iluminação de academia/estúdio aumentam a taxa de conversão em até <strong>3.8x</strong> comparado com fotos de roupas no cabide.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="bg-white border-t-2 border-deep-black p-4 flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono font-bold text-deep-black/60 uppercase">
            ESTÚDIO VIRTUAL TRY-ON • ANA FITNESS WEAR LLC
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black font-black text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Fechar Estúdio
          </button>
        </div>
      </div>
    </div>
  );
}
