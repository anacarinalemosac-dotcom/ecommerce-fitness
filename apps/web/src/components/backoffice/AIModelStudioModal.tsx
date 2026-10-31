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
  Upload,
  ShoppingBag,
  AlertCircle,
  UserCheck,
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
  // Modo de Origem da Foto: Upload de Foto Nova vs Escolher do Catálogo
  const [sourceMode, setSourceMode] = useState<'upload' | 'catalog'>('upload');

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productTitle, setProductTitle] = useState<string>('');
  const [productImage, setProductImage] = useState<string>('');
  const [customUploadUrl, setCustomUploadUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  // FOTO 2: Modelo ou Pose de Referência para a IA se espelhar (o grande diferencial solicitado!)
  const [referenceModelUrl, setReferenceModelUrl] = useState<string>(
    'https://grmlmouqkixvfxbdifrc.supabase.co/storage/v1/object/public/products/default-model-reference.jpg'
  );
  const [isUploadingRefModel, setIsUploadingRefModel] = useState<boolean>(false);

  // Configurações da Modelo Virtual
  const [modelProfile, setModelProfile] = useState<'latina_curls' | 'blonde_waves' | 'brunette_sleek' | 'black_goddess'>('latina_curls');
  const [bodyType, setBodyType] = useState<'curvy_sculpt' | 'fitness_toned' | 'slim_athletic'>('curvy_sculpt');
  const [scene, setScene] = useState<'penthouse_miami' | 'luxury_gold_studio' | 'glass_gym' | 'minimalist_loft'>('luxury_gold_studio');
  const [aspectRatio, setAspectRatio] = useState<'3:4' | '9:16' | '1:1'>('3:4');

  // Estados de Geração
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [savingCover, setSavingCover] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Vincular a produto existente caso tenha sido foto nova
  const [targetProductToLink, setTargetProductToLink] = useState<string>('');

  // Inicializa quando o modal abre
  useEffect(() => {
    if (!isOpen) return;

    if (initialProduct) {
      setSourceMode('catalog');
      setSelectedProductId(initialProduct.id || '');
      setProductTitle(initialProduct.title || '');
      const img =
        initialProduct.meta?.primary_image ||
        initialProduct.primary_image ||
        initialProduct.primaryImage ||
        (Array.isArray(initialProduct.images) && initialProduct.images[0]) ||
        '';
      setProductImage(img);
      setGeneratedImageUrl('');
    } else {
      // Se não veio de um produto específico, abre no modo Upload (foto livre)
      setSourceMode('upload');
      setSelectedProductId('');
      // Carrega por padrão a última foto real que a cliente enviou
      const lastUploadedPhoto = 'https://grmlmouqkixvfxbdifrc.supabase.co/storage/v1/object/public/products/ana-1793406956180-photo_2026-10-25_18-02-07.jpg';
      setCustomUploadUrl(lastUploadedPhoto);
      setProductImage(lastUploadedPhoto);
      setProductTitle('CONJUNTO SUNSHINE YELLOW + HOT PINK FIT');
      setGeneratedImageUrl('');
    }
  }, [isOpen, initialProduct]);

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
      setGeneratedImageUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

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
        setGeneratedImageUrl(''); // limpa resultado anterior para nova geração
        if (!productTitle) {
          setProductTitle('Peça Fitness Ana Fitness Wear');
        }
      } else {
        setUploadError(data.error || 'Falha ao carregar arquivo de foto.');
      }
    } catch (err: any) {
      console.warn('Erro ao fazer upload da peça:', err);
      setUploadError('Erro de conexão ao carregar a foto.');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload da Modelo / Pose de Referência (Foto 2)
  const handleRefModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingRefModel(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setReferenceModelUrl(data.url);
      }
    } catch (err) {
      console.warn('Erro ao carregar modelo de referência:', err);
    } finally {
      setIsUploadingRefModel(false);
    }
  };

  const handleGenerateModel = async () => {
    const activeImage = customUploadUrl || productImage;
    if (!activeImage) {
      alert('Por favor, carregue uma foto da roupa ou escolha um produto do catálogo antes de gerar a modelo.');
      return;
    }

    setIsGenerating(true);
    setSaveSuccessMsg(false);

    // Efeito visual realista de etapas de espelhamento por IA
    setGenerationStep('1/3 • Mapeando pose, iluminação e silhueta da modelo de referência...');
    await new Promise((r) => setTimeout(r, 800));

    setGenerationStep('2/3 • Transferindo tecido, cós anatômico V, cores e logo ANA da sua peça...');
    await new Promise((r) => setTimeout(r, 900));

    setGenerationStep('3/3 • Ajustando caimento 100% fiel sem alterar o modelo da roupa...');

    try {
      const res = await fetch('/api/ai/virtual-try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          productId: selectedProductId,
          productTitle: productTitle || 'Conjunto Fitness Anatômico',
          productImage: activeImage,
          referenceModelImage: referenceModelUrl,
          modelProfile,
          bodyType,
          scene,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (res.ok && data.resultImageUrl) {
        setGeneratedImageUrl(data.resultImageUrl);
      } else {
        alert(data.error || 'Erro ao gerar modelo. Tente novamente.');
      }
    } catch (err) {
      console.warn('Erro na geração com IA:', err);
      alert('Falha na conexão com o estúdio de IA.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleSetAsProductCover = async (pIdToUpdate?: string) => {
    const prodId = pIdToUpdate || selectedProductId || targetProductToLink;
    if (!prodId || !generatedImageUrl) {
      alert('Por favor, selecione qual produto do catálogo receberá esta foto como capa.');
      return;
    }

    setSavingCover(true);
    try {
      const res = await fetch('/api/ai/virtual-try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_cover',
          productId: prodId,
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
      } else {
        alert(data.error || 'Não foi possível atualizar a capa do produto.');
      }
    } catch (err) {
      console.warn('Erro ao salvar capa:', err);
      alert('Erro de conexão ao salvar foto de capa.');
    } finally {
      setSavingCover(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard && generatedImageUrl) {
      const fullUrl = generatedImageUrl.startsWith('http')
        ? generatedImageUrl
        : `${window.location.origin}${generatedImageUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const activeDisplayGarmentImage = customUploadUrl || productImage;

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
                ANA FITNESS WEAR • ESPELHAMENTO DE MODELO & PROVADOR 3D
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider flex items-center gap-2 text-white">
              <span>ESTÚDIO IA: VESTIR ROUPA NA MODELO (COM ESPELHAMENTO)</span>
            </h2>
            <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
              Envie a foto da sua roupa (mesa/cabide) e uma modelo de referência vestida (mesmo que em outra cor). A IA copia a pose e caimento exatos e veste a sua roupa sem alterar o modelo original!
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
              <span>✓ Sucesso! A foto da modelo gerada pela IA já foi definida como a FOTO DE CAPA PRINCIPAL do produto no site e no Backoffice!</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUNA ESQUERDA: DUPLO INPUT (ROUPA + MODELO DE REFERÊNCIA) (5 Colunas) */}
            <div className="lg:col-span-5 space-y-4 bg-white p-5 border-2 border-deep-black shadow-sm">
              <div className="flex items-center gap-2 border-b border-deep-black/10 pb-2.5">
                <Sliders className="w-4 h-4 text-gold" />
                <h3 className="text-xs font-black uppercase tracking-widest text-deep-black">
                  1. DUPLA REFERÊNCIA (ROUPA + MODELO VESTIDA)
                </h3>
              </div>

              {/* CAMPO A: FOTO DA SUA ROUPA (PEÇA NA MESA OU CABIDE) */}
              <div className="space-y-2 border border-deep-black/20 p-3 bg-stone-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-deep-black text-gold text-[10px] font-black flex items-center justify-center">1</span>
                    <span>SUA ROUPA (CORES, TECIDO & ESTAMPA)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSourceMode('upload');
                        setSelectedProductId('');
                      }}
                      className={`px-2 py-0.5 text-[9px] font-black uppercase transition ${
                        sourceMode === 'upload' ? 'bg-deep-black text-gold' : 'text-deep-black/60 hover:text-deep-black'
                      }`}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSourceMode('catalog');
                        if (catalogProducts.length > 0 && !selectedProductId) {
                          handleSelectProduct(catalogProducts[0].id);
                        }
                      }}
                      className={`px-2 py-0.5 text-[9px] font-black uppercase transition ${
                        sourceMode === 'catalog' ? 'bg-deep-black text-gold' : 'text-deep-black/60 hover:text-deep-black'
                      }`}
                    >
                      Catálogo
                    </button>
                  </div>
                </div>

                {sourceMode === 'upload' ? (
                  <label className="block border-2 border-dashed border-deep-black/40 hover:border-gold p-3 bg-white text-center cursor-pointer transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2">
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 text-gold animate-spin" />
                          <span className="text-xs font-black uppercase text-deep-black">Enviando foto...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-gold" />
                          <span className="text-[11px] font-black uppercase text-deep-black">
                            {customUploadUrl ? '✓ Foto Carregada (Trocar)' : 'Enviar Foto da Peça (Mesa / Cabide)'}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="w-full p-2 bg-white border border-deep-black/30 text-xs font-bold text-deep-black uppercase focus:border-gold outline-none"
                  >
                    <option value="">-- Escolha um produto da loja --</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (${Number(p.price || 49.9).toFixed(2)})
                      </option>
                    ))}
                  </select>
                )}

                {activeDisplayGarmentImage && (
                  <div className="flex items-center gap-3 bg-white p-2 border border-deep-black/10">
                    <img
                      src={activeDisplayGarmentImage}
                      alt="Roupa Selecionada"
                      className="w-12 h-12 object-contain bg-stone-100 border border-deep-black/10"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-mono text-green-700 font-bold block truncate">
                        ✓ Peça pronta para espelhar
                      </span>
                      <input
                        type="text"
                        value={productTitle}
                        onChange={(e) => setProductTitle(e.target.value)}
                        placeholder="Nome da peça..."
                        className="text-[10px] font-bold text-deep-black uppercase w-full bg-transparent border-b border-deep-black/20 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CAMPO B: MODELO / POSE DE REFERÊNCIA (O PEDIDO DA CLIENTE!) */}
              <div className="space-y-2 border-2 border-gold/60 p-3 bg-amber-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-gold text-deep-black text-[10px] font-black flex items-center justify-center">2</span>
                    <span>MODELO DE REFERÊNCIA (MESMO DE OUTRA COR)</span>
                  </span>
                  <span className="text-[8px] bg-gold text-deep-black font-black px-1.5 py-0.2 uppercase">
                    ESPELHO DE POSE
                  </span>
                </div>

                <p className="text-[9px] text-deep-black/70 leading-relaxed">
                  Envie a foto de alguém vestindo a peça (mesmo que em outra cor), ou use a modelo oficial do estúdio para a IA clonar a pose e o caimento exatos!
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <label className="border-2 border-dashed border-deep-black/40 hover:border-gold p-2.5 bg-white text-center cursor-pointer transition flex items-center justify-center gap-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleRefModelUpload}
                      className="hidden"
                    />
                    {isUploadingRefModel ? (
                      <RefreshCw className="w-3.5 h-3.5 text-gold animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-gold" />
                    )}
                    <span className="text-[9px] font-black uppercase text-deep-black">
                      Subir Nova Foto
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setReferenceModelUrl(
                        'https://grmlmouqkixvfxbdifrc.supabase.co/storage/v1/object/public/products/default-model-reference.jpg'
                      )
                    }
                    className="border border-deep-black/30 hover:border-gold p-2.5 bg-white text-center cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-green-700" />
                    <span className="text-[9px] font-black uppercase text-deep-black">
                      Modelo Oficial
                    </span>
                  </button>
                </div>

                {referenceModelUrl && (
                  <div className="flex items-center gap-3 bg-white p-2 border border-gold/40">
                    <img
                      src={referenceModelUrl}
                      alt="Modelo Referência"
                      className="w-12 h-14 object-cover border border-deep-black/10"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-mono text-gold font-black uppercase block truncate">
                        ★ Modelo Referência Ativa
                      </span>
                      <span className="text-[9px] text-deep-black/60 block truncate">
                        Pose e estúdio espelhados com 100% de precisão
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão de Disparo da Geração com IA */}
              <button
                type="button"
                disabled={isGenerating || !activeDisplayGarmentImage}
                onClick={handleGenerateModel}
                className="w-full py-4 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border-2 border-gold shadow-md cursor-pointer disabled:opacity-50 mt-2 group"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-gold animate-spin" />
                    <span>VESTINDO E ESPELHANDO COM IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-gold group-hover:text-deep-black" />
                    <span>✨ VESTIR ROUPA NA MODELO (SEM ALTERAR O MODELO)</span>
                  </>
                )}
              </button>

              {generationStep && (
                <p className="text-[11px] font-mono font-bold text-center text-amber-700 animate-pulse bg-amber-50 p-2.5 border border-amber-300">
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
                    2. RESULTADO VISUAL (ROUPA ENVIADA VS MODELO FINAL VESTIDA)
                  </h3>
                </div>
                <span className="text-[9px] bg-green-100 text-green-900 border border-green-300 px-2 py-0.5 font-black uppercase font-mono">
                  8K ULTRA HD • CLONE DE POSE
                </span>
              </div>

              {/* Grade Comparativa Lado a Lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Imagem Original da Peça */}
                <div className="border border-deep-black/20 p-2.5 bg-stone-50 flex flex-col items-center justify-between space-y-2">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black uppercase text-deep-black/70 tracking-wider">
                      FOTO DA SUA ROUPA
                    </span>
                    <span className="text-[8px] bg-stone-200 text-deep-black px-1.5 py-0.2 font-black uppercase">
                      PEÇA REAL
                    </span>
                  </div>
                  <div className="w-full h-80 sm:h-96 bg-stone-200 flex items-center justify-center overflow-hidden border border-deep-black/10">
                    {activeDisplayGarmentImage ? (
                      <img
                        src={activeDisplayGarmentImage}
                        alt="Peça Original"
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : (
                      <div className="p-6 text-center text-xs text-deep-black/50 font-bold uppercase flex flex-col items-center gap-2">
                        <Camera className="w-8 h-8 text-deep-black/30" />
                        <span>Nenhuma foto carregada ainda</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-deep-black/60 font-mono truncate max-w-full font-bold">
                    {productTitle || 'Peça Fitness'}
                  </span>
                </div>

                {/* Imagem da Modelo Gerada pela IA */}
                <div className="border-2 border-gold p-2.5 bg-gradient-to-b from-stone-50 to-amber-50/30 flex flex-col items-center justify-between space-y-2 relative shadow-luxury">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black uppercase text-gold tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-gold" /> MODELO IA VESTINDO A SUA PEÇA
                    </span>
                    <span className="text-[8px] bg-gold text-deep-black px-1.5 py-0.2 font-black uppercase">
                      ESPELHADO
                    </span>
                  </div>

                  <div className="w-full h-80 sm:h-96 bg-deep-black flex items-center justify-center overflow-hidden relative group">
                    {generatedImageUrl ? (
                      <img
                        src={generatedImageUrl}
                        alt="Modelo Gerada com IA"
                        className="w-full h-full object-cover animate-fadeIn"
                      />
                    ) : (
                      <div className="p-6 text-center flex flex-col items-center justify-center gap-3 text-white">
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-10 h-10 text-gold animate-spin" />
                            <span className="text-xs font-black uppercase tracking-wider text-white">
                              ESPELHANDO POSE E VESTINDO ROUPA...
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-10 h-10 text-gold/80" />
                            <h4 className="text-xs font-black uppercase tracking-wider text-gold">
                              ESTÚDIO PRONTO PARA GERAR
                            </h4>
                            <p className="text-[10px] text-white/70 max-w-xs leading-relaxed">
                              Clique no botão dourado <strong>VESTIR ROUPA NA MODELO</strong> para a IA espelhar a pose da modelo e colocar a sua roupa sem alterar o corte.
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {isGenerating && generatedImageUrl && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center">
                        <RefreshCw className="w-8 h-8 text-gold animate-spin" />
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          ESPELHANDO POSE E CAIMENTO COM IA...
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-deep-black/70 font-mono font-bold">
                    {generatedImageUrl ? '✓ Modelo da roupa 100% preservado com cós e logo ANA' : 'Aguardando disparo da IA'}
                  </span>
                </div>
              </div>

              {/* Botões de Ação para Salvar ou Baixar */}
              {generatedImageUrl && (
                <div className="pt-3 border-t border-deep-black/10 space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-deep-black font-black text-xs uppercase tracking-wider border border-deep-black/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Copiar link direto da foto gerada"
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

                    {/* Botão para Produto Já Selecionado */}
                    {selectedProductId && (
                      <button
                        type="button"
                        disabled={savingCover}
                        onClick={() => handleSetAsProductCover(selectedProductId)}
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
                            <span>DEFINIR COMO CAPA DESTE PRODUTO</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Se foi uma foto nova avulsa, permite vincular a qualquer produto do catálogo */}
                  {!selectedProductId && catalogProducts.length > 0 && (
                    <div className="p-3 bg-stone-100 border border-deep-black/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="space-y-0.5 text-left w-full sm:w-auto">
                        <span className="text-[10px] font-black uppercase text-deep-black block">
                          DESEJA DEFINIR ESTA MODELO COMO CAPA DE ALGUM PRODUTO DO SITE?
                        </span>
                        <span className="text-[9px] text-deep-black/60 block">
                          Selecione o produto abaixo para aplicar a nova foto imediatamente:
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                          value={targetProductToLink}
                          onChange={(e) => setTargetProductToLink(e.target.value)}
                          className="p-2 bg-white border border-deep-black/30 text-xs font-bold text-deep-black uppercase outline-none"
                        >
                          <option value="">-- Escolha o produto --</option>
                          {catalogProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={savingCover || !targetProductToLink}
                          onClick={() => handleSetAsProductCover(targetProductToLink)}
                          className="px-4 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-wider transition border border-gold cursor-pointer disabled:opacity-40 shrink-0"
                        >
                          {savingCover ? 'SALVANDO...' : '★ APLICAR CAPA'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dica de Especialista */}
              <div className="p-3 bg-amber-50 border border-gold/40 text-[11px] text-deep-black/80 flex items-start gap-2">
                <Info className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <p>
                  <strong>Como Funciona o Espelhamento:</strong> A IA analisa a modelo de referência enviada (pose, corpo, estúdio e iluminação) e projeta as cores, tecidos e logotipo da sua roupa exatamente como ela é, sem distorcer o decote ou o cós!
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
