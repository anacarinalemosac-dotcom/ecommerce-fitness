'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Layers,
  Palette,
  Tag,
  Factory,
  DollarSign,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Camera,
  Video,
  Grid,
  Check,
  X,
  RefreshCw,
  Eye,
  Barcode,
  Clock,
  Shirt,
  Ruler,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { ImageUploadBox } from './ImageUploadBox';
import { useStoreSettings } from '../context/StoreSettingsContext';

export interface VariantRow {
  id?: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  barcode: string;
  stock_quantity: number;
  price: number;
  cost_price: number;
  allow_backorder: boolean;
  estimated_production_days: number;
  image?: string;
  images: string[];
  video_url?: string;
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  associatedColor: string; // 'all' ou nome da cor
  fileName?: string;
  isUploading?: boolean;
}

interface ProductVariantMatrixFormProps {
  initialProduct?: any | null;
  onSaveSuccess?: (savedProduct: any) => void;
  onCancel?: () => void;
}

export function ProductVariantMatrixForm({
  initialProduct,
  onSaveSuccess,
  onCancel,
}: ProductVariantMatrixFormProps) {
  const { refreshProducts } = useStoreSettings();

  // 1. Dados Básicos do Produto
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('Alta Compressão');
  const [tags, setTags] = useState<string[]>(['squat-proof', 'zero-transparencia']);
  const [tagInput, setTagInput] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('44.90');
  const [defaultCostPrice, setDefaultCostPrice] = useState('16.00');
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('88% Poliamida Nobre, 12% Elastano 4-way stretch');
  const [sizeGuide, setSizeGuide] = useState(
    'P: Busto 84-88cm, Cintura 66-70cm (US 2-4)\nM: Busto 89-94cm, Cintura 71-76cm (US 6-8)\nG: Busto 95-100cm, Cintura 77-82cm (US 10-12)\nGG: Busto 101-106cm, Cintura 83-88cm (US 14)'
  );

  // 2. Gerador de Cores e Tamanhos
  const [colors, setColors] = useState<Array<{ name: string; hex: string }>>([
    { name: 'Preto Ônix', hex: '#0A0A0A' },
    { name: 'Amarelo Solar', hex: '#F59E0B' },
    { name: 'Verde Militar', hex: '#4B5320' },
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#D4AF37');

  const [availableSizes, setAvailableSizes] = useState<string[]>([
    'PP',
    'P',
    'M',
    'G',
    'GG',
  ]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['P', 'M', 'G']);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // 3. Matriz de Variantes
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [massStockValue, setMassStockValue] = useState('');

  // 4. Mídias
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [directImageUrlInput, setDirectImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Supabase & Carregamento
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Carrega fornecedores e categorias do Supabase via API
  useEffect(() => {
    async function fetchMeta() {
      try {
        const [supRes, catRes] = await Promise.all([
          fetch('/api/backoffice/suppliers'),
          fetch('/api/backoffice/categories'),
        ]);
        if (supRes.ok) {
          const supData = await supRes.json();
          setSuppliersList(supData.suppliers || []);
          if (supData.suppliers?.length > 0 && !supplierId) {
            setSupplierId(supData.suppliers[0].id);
          }
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategoriesList(catData.categories || []);
          if (catData.categories?.length > 0 && !categoryId) {
            setCategoryId(catData.categories[0].id);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar fornecedores e categorias:', err);
      }
    }
    fetchMeta();
  }, []);

  // Preenche dados quando estiver no modo de EDIÇÃO
  useEffect(() => {
    if (initialProduct) {
      setTitle(initialProduct.title || '');
      setSlug(initialProduct.slug || '');
      setCategoryId(initialProduct.category_id || '');
      setSupplierId(initialProduct.supplier_id || '');

      // Extrai metadados do campo description caso esteja em JSON
      if (initialProduct.description) {
        try {
          const parsed = JSON.parse(initialProduct.description);
          setDescription(parsed.bio || '');
          setComposition(parsed.composition || '');
          setSizeGuide(parsed.sizeGuide || '');
          if (Array.isArray(parsed.tags)) setTags(parsed.tags);
          if (parsed.subcategory) setSubcategory(parsed.subcategory);
        } catch {
          setDescription(initialProduct.description);
        }
      }

      // Se o produto tiver variantes cadastradas
      if (initialProduct.variants && initialProduct.variants.length > 0) {
        const loadedVariants: VariantRow[] = initialProduct.variants.map((v: any) => ({
          id: v.id,
          color: v.color || 'Preto Ônix',
          colorHex: v.color === 'Amarelo Solar' ? '#F59E0B' : v.color === 'Verde Militar' ? '#4B5320' : '#0A0A0A',
          size: v.size || 'M',
          sku: v.sku,
          barcode: v.barcode || '',
          stock_quantity: v.stock_quantity ?? 0,
          price: v.price || 44.9,
          cost_price: v.cost_price || 16.0,
          allow_backorder: v.allow_backorder ?? true,
          estimated_production_days: v.estimated_production_days ?? 7,
          images: Array.isArray(v.images) ? v.images : [],
          video_url: v.video_url || '',
        }));
        setVariants(loadedVariants);

        // Atualiza cores e tamanhos detectados
        const uniqueColors = Array.from(new Set(loadedVariants.map((v) => v.color)));
        const colorObjs = uniqueColors.map((cName) => {
          const found = loadedVariants.find((v) => v.color === cName);
          return { name: cName, hex: found?.colorHex || '#0A0A0A' };
        });
        setColors(colorObjs);

        const uniqueSizes = Array.from(new Set(loadedVariants.map((v) => v.size)));
        setSelectedSizes(uniqueSizes);

        // Extrai todas as mídias já existentes nas variantes e no produto
        const existingMedia: MediaItem[] = [];
        const seenUrls = new Set<string>();

        loadedVariants.forEach((v) => {
          if (Array.isArray(v.images)) {
            v.images.forEach((imgUrl: string) => {
              if (imgUrl && !seenUrls.has(imgUrl)) {
                seenUrls.add(imgUrl);
                existingMedia.push({
                  id: `m-init-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  url: imgUrl,
                  type: 'image',
                  associatedColor: v.color || 'all',
                  fileName: 'Foto do Produto',
                  isUploading: false,
                });
              }
            });
          }
          if (v.video_url && !seenUrls.has(v.video_url)) {
            seenUrls.add(v.video_url);
            existingMedia.push({
              id: `m-init-vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              url: v.video_url,
              type: 'video',
              associatedColor: v.color || 'all',
              fileName: 'Vídeo da Peça',
              isUploading: false,
            });
          }
        });

        if (initialProduct.primaryImage && !seenUrls.has(initialProduct.primaryImage)) {
          seenUrls.add(initialProduct.primaryImage);
          existingMedia.push({
            id: `m-init-p-${Date.now()}`,
            url: initialProduct.primaryImage,
            type: 'image',
            associatedColor: 'all',
            fileName: 'Foto Principal',
            isUploading: false,
          });
        }

        setMediaList(existingMedia);
      }
    }
  }, [initialProduct]);

  // Atualiza slug automaticamente conforme o título
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialProduct) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  // Gerenciamento de Tags
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Gerenciamento de Cores
  const handleAddColor = () => {
    if (newColorName.trim() && !colors.some((c) => c.name.toLowerCase() === newColorName.trim().toLowerCase())) {
      setColors([...colors, { name: newColorName.trim(), hex: newColorHex }]);
      setNewColorName('');
    }
  };

  const handleRemoveColor = (nameToRemove: string) => {
    setColors(colors.filter((c) => c.name !== nameToRemove));
  };

  // Gerenciamento de Tamanhos
  const toggleSize = (sz: string) => {
    if (selectedSizes.includes(sz)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== sz));
    } else {
      setSelectedSizes([...selectedSizes, sz]);
    }
  };

  const handleAddCustomSize = () => {
    if (customSizeInput.trim()) {
      const upper = customSizeInput.trim().toUpperCase();
      if (!availableSizes.includes(upper)) {
        setAvailableSizes([...availableSizes, upper]);
      }
      if (!selectedSizes.includes(upper)) {
        setSelectedSizes([...selectedSizes, upper]);
      }
      setCustomSizeInput('');
    }
  };

  // =========================================================================
  // ⚡ GERADOR AUTOMÁTICO DE GRADE DE VARIAÇÕES (MATRIZ SKU)
  // =========================================================================
  const handleGenerateMatrix = () => {
    if (colors.length === 0) {
      alert('Por favor, adicione ao menos uma cor para gerar a grade.');
      return;
    }
    if (selectedSizes.length === 0) {
      alert('Por favor, selecione ao menos um tamanho para gerar a grade.');
      return;
    }

    const basePrefix = (title || 'PROD')
      .slice(0, 4)
      .toUpperCase()
      .replace(/[^\w]/g, '');

    const colorCodeMap = (cName: string) =>
      cName
        .slice(0, 3)
        .toUpperCase()
        .replace(/[^\w]/g, '');

    const generated: VariantRow[] = [];

    colors.forEach((colorObj) => {
      // Localiza imagens associadas a esta cor na lista de mídias
      const colorImages = mediaList
        .filter((m) => m.associatedColor === colorObj.name || m.associatedColor === 'all')
        .map((m) => m.url);

      selectedSizes.forEach((sz) => {
        // Verifica se já existia essa combinação para preservar valores editados
        const existing = variants.find(
          (v) => v.color.toLowerCase() === colorObj.name.toLowerCase() && v.size === sz
        );

        const sku =
          existing?.sku ||
          `${basePrefix}-${colorCodeMap(colorObj.name)}-${sz}`;

        const barcode =
          existing?.barcode ||
          `789${Math.floor(100000000 + Math.random() * 900000000)}`;

        generated.push({
          id: existing?.id,
          color: colorObj.name,
          colorHex: colorObj.hex,
          size: sz,
          sku,
          barcode,
          stock_quantity: existing ? existing.stock_quantity : 5,
          price: existing ? existing.price : parseFloat(defaultPrice) || 44.9,
          cost_price: existing ? existing.cost_price : parseFloat(defaultCostPrice) || 16.0,
          allow_backorder: existing ? existing.allow_backorder : true,
          estimated_production_days: existing ? existing.estimated_production_days : 7,
          image: existing?.image || colorImages[0] || '',
          images: existing?.images?.length ? existing.images : colorImages,
          video_url: existing?.video_url || '',
        });
      });
    });

    setVariants(generated);
    setFeedback({
      type: 'success',
      message: `Grade gerada com sucesso! ${generated.length} variações combinadas (${colors.length} cores × ${selectedSizes.length} tamanhos).`,
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Aplicação em massa de quantidade de estoque
  const handleApplyMassStock = () => {
    const qty = parseInt(massStockValue);
    if (!isNaN(qty)) {
      setVariants(
        variants.map((v) => ({
          ...v,
          stock_quantity: Math.max(0, qty),
        }))
      );
      setMassStockValue('');
    }
  };

  // Upload de Mídias (Fotos e Vídeos) com Prévia Instantânea (0ms)
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingMedia(true);

    const files = Array.from(e.target.files);
    // Limpa o seletor para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) fileInputRef.current.value = '';

    for (const file of files) {
      const isVid = file.type.startsWith('video/');
      const tempId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const defaultColor = colors[0]?.name || 'all';

      // 1. Leitura imediata com FileReader para exibição instantânea no contador e na tela
      const reader = new FileReader();
      const readPromise = new Promise<string>((resolve) => {
        reader.onload = (evt) => {
          resolve((evt.target?.result as string) || '');
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });

      const previewDataUrl = await readPromise;

      // Adiciona na hora em mediaList -> Contador `{mediaList.length} ARQUIVOS CARREGADOS` sobe imediatamente!
      const initialMediaItem: MediaItem = {
        id: tempId,
        url: previewDataUrl || '',
        type: isVid ? 'video' : 'image',
        associatedColor: defaultColor,
        fileName: file.name,
        isUploading: true,
      };

      setMediaList((prev) => [...prev, initialMediaItem]);

      // 2. Envio para a API de upload (Supabase Storage Cloud + disco local)
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          const finalUrl = data.url || previewDataUrl;

          // Atualiza o item de mídia com a URL oficial da nuvem
          setMediaList((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, url: finalUrl, isUploading: false } : m
            )
          );

          // Sincroniza imediatamente com as variantes para gravar as fotos
          setVariants((prev) =>
            prev.map((vr) => {
              if (defaultColor === 'all' || vr.color === defaultColor) {
                const currentImgs = Array.isArray(vr.images) ? vr.images : [];
                return {
                  ...vr,
                  image: currentImgs[0] || finalUrl,
                  images: Array.from(new Set([...currentImgs, finalUrl])),
                };
              }
              return vr;
            })
          );
        } else {
          console.warn('Upload de arquivo retornou código não-ok, mantendo prévia local');
          setMediaList((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, isUploading: false } : m))
          );
        }
      } catch (err) {
        console.error('Erro na requisição de upload:', err);
        setMediaList((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, isUploading: false } : m))
        );
      }
    }
    setIsUploadingMedia(false);
  };

  // Adição direta por URL externa (ex: Unsplash, CDN ou Google Drive)
  const handleAddDirectUrl = () => {
    const rawUrl = directImageUrlInput.trim();
    if (!rawUrl) return;

    const defaultColor = colors[0]?.name || 'all';
    const isVid = rawUrl.endsWith('.mp4') || rawUrl.includes('video');
    const newMedia: MediaItem = {
      id: `m-url-${Date.now()}`,
      url: rawUrl,
      type: isVid ? 'video' : 'image',
      associatedColor: defaultColor,
      fileName: 'Foto via URL Externa',
      isUploading: false,
    };

    setMediaList((prev) => [...prev, newMedia]);
    setDirectImageUrlInput('');

    // Sincroniza com as variantes
    setVariants((prev) =>
      prev.map((vr) => {
        if (defaultColor === 'all' || vr.color === defaultColor) {
          const currentImgs = Array.isArray(vr.images) ? vr.images : [];
          return {
            ...vr,
            image: currentImgs[0] || rawUrl,
            images: Array.from(new Set([...currentImgs, rawUrl])),
          };
        }
        return vr;
      })
    );
  };

  // =========================================================================
  // 💾 GRAVAÇÃO FINAL DIRETO NO SUPABASE
  // =========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }
    if (variants.length === 0) {
      alert('Gere a grade de variações antes de salvar o produto.');
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    // Mapeia todas as mídias carregadas para as respectivas variantes da matriz
    const enrichedVariants = variants.map((vr) => {
      const matchingImages = mediaList
        .filter((m) => m.associatedColor === 'all' || m.associatedColor === vr.color)
        .map((m) => m.url)
        .filter(Boolean);

      const currentImgs = Array.isArray(vr.images) ? vr.images : [];
      const mergedImages = Array.from(new Set([...currentImgs, ...matchingImages]));

      return {
        ...vr,
        images: mergedImages,
        image: mergedImages[0] || vr.image || '',
      };
    });

    try {
      const payload = {
        id: initialProduct?.id,
        title,
        slug,
        category_id: categoryId || null,
        supplier_id: supplierId || null,
        subcategory,
        tags,
        description,
        composition,
        sizeGuide,
        variants: enrichedVariants,
      };

      const res = await fetch('/api/backoffice/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao gravar no Supabase');
      }

      setFeedback({
        type: 'success',
        message: `✓ Produto "${title}" e ${variants.length} variações gravados com sucesso nas tabelas 'products' e 'product_variants' do Supabase!`,
      });

      try {
        await refreshProducts();
      } catch (e) {}

      if (onSaveSuccess) {
        onSaveSuccess(data);
      }
    } catch (err: any) {
      console.error('Erro ao salvar no Supabase:', err);
      setFeedback({
        type: 'error',
        message: `Falha ao salvar no Supabase: ${err.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalCalculatedStock = variants.reduce(
    (acc, v) => acc + (Number(v.stock_quantity) || 0),
    0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white selection:bg-deep-black selection:text-gold">
      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 border-2 flex items-center justify-between text-xs font-black uppercase tracking-wider animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-deep-black text-white border-gold'
              : 'bg-red-50 text-red-700 border-red-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[10px] underline hover:text-gold"
          >
            FECHAR
          </button>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 1: DADOS BÁSICOS DO PRODUTO
         ========================================================================= */}
      <div className="border-2 border-deep-black p-6 sm:p-8 space-y-6 bg-white shadow-sm">
        <div className="border-b border-deep-black/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gold" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black">
                1. DADOS BÁSICOS DO PRODUTO (CATÁLOGO GERAL)
              </h2>
            </div>
            <p className="text-xs text-deep-black/60 uppercase mt-0.5">
              Identificação comercial, categoria, confecção e preços padrões em Dólar ($ USD).
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-deep-black text-gold border border-gold px-3 py-1 self-start sm:self-auto">
            SUPABASE SYNC
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Nome do Produto */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
              <span>Nome do Produto *</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="EX: LEGGING SCULPT EFEITO LEVANTA BUMBUM"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full p-3 border-2 border-deep-black font-bold text-xs uppercase focus:outline-none focus:border-gold"
            />
          </div>

          {/* Slug da URL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
              Slug da URL (ex: legging-sculpt)
            </label>
            <input
              type="text"
              placeholder="legging-sculpt"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full p-3 border-2 border-deep-black font-mono text-xs focus:outline-none focus:border-gold"
            />
          </div>

          {/* Categoria */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
              <span>Categoria Principal (Supabase) *</span>
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-3 border-2 border-deep-black font-black text-xs uppercase bg-white focus:outline-none focus:border-gold"
            >
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              {categoriesList.length === 0 && (
                <>
                  <option value="">LEGGINGS</option>
                  <option value="">TOPS</option>
                  <option value="">CONJUNTOS</option>
                  <option value="">MACAQUINHOS</option>
                  <option value="">MACACÕES</option>
                </>
              )}
            </select>
          </div>

          {/* Subcategoria */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
              Subcategoria / Linha Fitness
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full p-3 border-2 border-deep-black font-bold text-xs uppercase bg-white focus:outline-none focus:border-gold"
            >
              <option value="Alta Compressão">ALTA COMPRESSÃO</option>
              <option value="Cós Anatômico Duplo">CÓS ANATÔMICO DUPLO</option>
              <option value="Seamless Sculpt">SEAMLESS SCULPT (SEM COSTURA)</option>
              <option value="Costas Nadador">COSTAS NADADOR</option>
              <option value="Bojo Removível">BOJO REMOVÍVEL</option>
              <option value="Atelier Sob Medida">ATELIER SOB MEDIDA (PRE-ORDER)</option>
            </select>
          </div>

          {/* Fornecedor Vinculado */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
              <Factory className="w-3.5 h-3.5 text-gold" />
              <span>Fornecedor / Confecção Vinculada *</span>
            </label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full p-3 border-2 border-deep-black font-bold text-xs uppercase bg-white focus:outline-none focus:border-gold"
            >
              {suppliersList.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.company_name} {sup.contact_name ? `(${sup.contact_name})` : ''}
                </option>
              ))}
              {suppliersList.length === 0 && (
                <option value="">CONFECÇÕES FITPRO BRASIL (ATELIER SEDE)</option>
              )}
            </select>
          </div>

          {/* Preço de Venda Padrão */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
              Preço de Venda Padrão ($ USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-black text-deep-black">$</span>
              <input
                type="number"
                step="0.01"
                required
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
                className="w-full p-3 pl-7 border-2 border-deep-black font-mono font-bold text-xs focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Preço de Custo */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gold flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Preço de Custo ($ USD) - Confecção Privado</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-black text-deep-black">$</span>
              <input
                type="number"
                step="0.01"
                value={defaultCostPrice}
                onChange={(e) => setDefaultCostPrice(e.target.value)}
                className="w-full p-3 pl-7 border-2 border-gold font-mono font-bold text-xs focus:outline-none focus:border-deep-black"
              />
            </div>
            <span className="text-[9px] text-deep-black/50 block">Protegido por RLS contra clientes.</span>
          </div>

          {/* Tags de Busca (Chips) */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-gold" />
              <span>Tags de Busca & Indexação (Pressione Enter para adicionar)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2.5 border-2 border-deep-black bg-white min-h-[44px]">
              {tags.map((tg) => (
                <span
                  key={tg}
                  className="px-2.5 py-1 bg-deep-black text-white text-[10px] font-black uppercase flex items-center gap-1.5 shadow-xs"
                >
                  <span>#{tg}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tg)}
                    className="text-gold hover:text-white transition"
                    title="Remover tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="+ Adicionar tag (ex: gymshark, compressao)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 min-w-[180px] p-1 font-bold text-xs uppercase focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1 bg-gold text-deep-black font-black text-[10px] uppercase hover:bg-deep-black hover:text-gold transition"
              >
                + ADICIONAR
              </button>
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gold" />
              <span>Descrição Detalhada do Produto</span>
            </label>
            <textarea
              rows={3}
              placeholder="Descreva o caimento, os detalhes anatômicos e os diferenciais esportivos da peça..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border-2 border-deep-black font-medium text-xs focus:outline-none focus:border-gold"
            />
          </div>

          {/* Composição do Tecido */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
              <Shirt className="w-3.5 h-3.5 text-gold" />
              <span>Composição do Tecido</span>
            </label>
            <input
              type="text"
              placeholder="88% Poliamida Nobre, 12% Elastano"
              value={composition}
              onChange={(e) => setComposition(e.target.value)}
              className="w-full p-3 border-2 border-deep-black font-bold text-xs focus:outline-none focus:border-gold"
            />
          </div>

          {/* Tabela de Medidas */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-gold" />
              <span>Tabela de Medidas (Guia de Tamanhos)</span>
            </label>
            <input
              type="text"
              placeholder="P: 34-36 (US 2-4) | M: 38-40 (US 6-8) | G: 42-44 (US 10-12)"
              value={sizeGuide}
              onChange={(e) => setSizeGuide(e.target.value)}
              className="w-full p-3 border-2 border-deep-black font-medium text-xs focus:outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO 2: GERADOR DE GRADE E VARIAÇÕES (CORES & TAMANHOS)
         ========================================================================= */}
      <div className="border-2 border-deep-black p-6 sm:p-8 space-y-6 bg-white shadow-sm">
        <div className="border-b border-deep-black/10 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gold" />
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black">
              2. GERADOR DE GRADE & VARIAÇÕES (MATRIZ COR × TAMANHO)
            </h2>
          </div>
          <p className="text-xs text-deep-black/60 uppercase mt-0.5">
            Configure as cores disponíveis e os tamanhos. O botão gerador cria automaticamente a tabela com todos os SKUs combinados.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Coluna A: Gerenciamento de Cores */}
          <div className="p-5 border-2 border-deep-black/20 bg-deep-black/5 space-y-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-gold" />
              <span>CORES DISPONÍVEIS DA PEÇA</span>
            </span>

            {/* Inputs para Nova Cor */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-10 h-10 border-2 border-deep-black cursor-pointer bg-transparent p-0.5"
                  title="Escolha a cor da amostra"
                />
              </div>

              <input
                type="text"
                placeholder="Nome da Cor (ex: Amarelo Solar)"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColor();
                  }
                }}
                className="flex-1 p-2.5 border-2 border-deep-black font-bold text-xs uppercase focus:outline-none focus:border-gold"
              />

              <button
                type="button"
                onClick={handleAddColor}
                className="px-4 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition shrink-0 shadow-xs"
              >
                + ADICIONAR COR
              </button>
            </div>

            {/* Sugestões Rápidas de Cores da Coleção Ana Fitness */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/60 block">
                AMOSTRAS FREQUENTES DA MARCA:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Preto Ônix', hex: '#0A0A0A' },
                  { name: 'Amarelo Solar', hex: '#F59E0B' },
                  { name: 'Verde Militar', hex: '#4B5320' },
                  { name: 'Champagne Gold', hex: '#D4AF37' },
                  { name: 'Pure White', hex: '#FFFFFF' },
                  { name: 'Vinho Marsala', hex: '#800020' },
                  { name: 'Azul Marinho', hex: '#000080' },
                ].map((sug) => (
                  <button
                    key={sug.name}
                    type="button"
                    onClick={() => {
                      if (!colors.some((c) => c.name.toLowerCase() === sug.name.toLowerCase())) {
                        setColors([...colors, sug]);
                      }
                    }}
                    className="px-2 py-1 bg-white border border-deep-black/30 hover:border-gold text-[9px] font-black uppercase inline-flex items-center gap-1.5 transition"
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-deep-black/30" style={{ backgroundColor: sug.hex }} />
                    <span>{sug.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Cores Ativas */}
            <div className="space-y-1.5 pt-2 border-t border-deep-black/10">
              <span className="text-[10px] font-black uppercase text-deep-black block">
                CORES SELECIONADAS ({colors.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <div
                    key={c.name}
                    className="p-1.5 pl-2.5 pr-2 bg-white border-2 border-deep-black flex items-center gap-2 shadow-xs"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-deep-black/40 shadow-xs"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-xs font-black uppercase text-deep-black">{c.name}</span>
                    <span className="text-[9px] font-mono text-deep-black/40">{c.hex}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(c.name)}
                      className="text-red-500 hover:text-red-700 p-0.5 ml-1 transition"
                      title="Remover cor"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna B: Gerenciamento de Tamanhos */}
          <div className="p-5 border-2 border-deep-black/20 bg-deep-black/5 space-y-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-gold" />
              <span>TAMANHOS DISPONÍVEIS NA GRADE</span>
            </span>

            {/* Botões de Seleção Rápida de Tamanho */}
            <div className="grid grid-cols-5 gap-2">
              {availableSizes.map((sz) => {
                const isSelected = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`py-3 text-xs font-black uppercase tracking-wider border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-deep-black text-white border-deep-black shadow-md ring-2 ring-gold/40'
                        : 'bg-white text-deep-black/60 border-deep-black/20 hover:border-deep-black hover:text-deep-black'
                    }`}
                  >
                    <span>{sz}</span>
                    <span className="text-[8px] font-bold">
                      {isSelected ? '✓ ATIVO' : '+ ATIVAR'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Adicionar Tamanho Personalizado */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Outro Tamanho (ex: XXL, ÚNICO)"
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSize();
                  }
                }}
                className="flex-1 p-2.5 border-2 border-deep-black font-bold text-xs uppercase focus:outline-none focus:border-gold"
              />
              <button
                type="button"
                onClick={handleAddCustomSize}
                className="px-4 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition shrink-0"
              >
                + ADICIONAR
              </button>
            </div>

            <div className="p-3 bg-white border border-deep-black/20 text-xs font-black uppercase text-deep-black flex items-center justify-between">
              <span>TAMANHOS ATIVOS:</span>
              <span className="text-gold font-mono">{selectedSizes.join(' • ') || 'NENHUM'}</span>
            </div>
          </div>
        </div>

        {/* BOTÃO GERADOR DE GRADE EM DESTAQUE */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleGenerateMatrix}
            className="w-full sm:w-auto px-10 py-4 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-ultra transition inline-flex items-center justify-center gap-3 shadow-luxury border-2 border-gold"
          >
            <Sparkles className="w-4 h-4 text-gold group-hover:text-deep-black" />
            <span>⚡ GERAR GRADE DE VARIAÇÕES ({colors.length * selectedSizes.length} COMBINAÇÕES)</span>
          </button>
          <p className="text-[10px] text-deep-black/60 uppercase font-bold mt-2">
            Multiplica as {colors.length} cores pelos {selectedSizes.length} tamanhos e monta a tabela de estoque por SKU abaixo.
          </p>
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO 3: TABELA DE ESTOQUE POR VARIAÇÃO (MATRIZ SKU INDIVIDUAL)
         ========================================================================= */}
      {variants.length > 0 && (
        <div className="border-2 border-deep-black p-6 sm:p-8 space-y-6 bg-white shadow-sm">
          <div className="border-b border-deep-black/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-gold" />
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black">
                  3. TABELA DE ESTOQUE POR VARIAÇÃO (MATRIZ SKU)
                </h2>
              </div>
              <p className="text-xs text-deep-black/60 uppercase mt-0.5">
                Controle individual de quantidade, código de barras, pronta entrega vs. encomenda para cada tamanho e cor.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-deep-black text-white px-3.5 py-1.5 border border-gold inline-flex items-center gap-2 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold">ESTOQUE TOTAL:</span>
                <span className="text-sm font-black font-mono">{totalCalculatedStock} PEÇAS</span>
              </div>
              <span className="text-xs font-mono font-bold text-deep-black/70">
                ({variants.length} SKUs ATIVOS)
              </span>
            </div>
          </div>

          {/* Barra de Ações em Massa */}
          <div className="p-3.5 bg-deep-black/5 border border-deep-black/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-deep-black">Definir Estoque em Massa:</span>
              <input
                type="number"
                min="0"
                placeholder="Qtd (ex: 10)"
                value={massStockValue}
                onChange={(e) => setMassStockValue(e.target.value)}
                className="w-24 p-1.5 border border-deep-black font-mono font-bold text-center text-xs bg-white"
              />
              <button
                type="button"
                onClick={handleApplyMassStock}
                className="px-3 py-1.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-[10px] font-black uppercase transition"
              >
                APLICAR A TODAS
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setVariants(variants.map((v) => ({ ...v, allow_backorder: true })))
                }
                className="px-2.5 py-1.5 bg-white border border-deep-black hover:bg-deep-black hover:text-white text-[10px] font-bold uppercase transition"
              >
                ✓ Permitir Encomenda em Todas
              </button>
            </div>
          </div>

          {/* Tabela Responsiva de Variações */}
          <div className="overflow-x-auto border-2 border-deep-black">
            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black text-white text-[10px] font-black">
                <tr>
                  <th className="p-3">COR & FOTO</th>
                  <th className="p-3">TAM</th>
                  <th className="p-3">CÓDIGO SKU</th>
                  <th className="p-3">CÓD. BARRAS</th>
                  <th className="p-3">ESTOQUE FÍSICO</th>
                  <th className="p-3">PREÇO ($)</th>
                  <th className="p-3">CUSTO ($)</th>
                  <th className="p-3">ENCOMENDA</th>
                  <th className="p-3">DIAS CONFECÇÃO</th>
                  <th className="p-3 text-right">EXCLUIR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {variants.map((v, idx) => (
                  <tr key={`${v.color}-${v.size}-${idx}`} className="hover:bg-deep-black/5">
                    {/* Cor + Amostra + Miniatura */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-10 border border-deep-black/30 overflow-hidden bg-deep-black/10 shrink-0 relative">
                          {v.image || v.images?.[0] ? (
                            <img
                              src={v.image || v.images[0]}
                              alt={v.color}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[7px] text-deep-black/40 font-bold">
                              SEM FOTO
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-deep-black/40"
                              style={{ backgroundColor: v.colorHex }}
                            />
                            <span className="font-black text-deep-black">{v.color}</span>
                          </div>
                          <span className="text-[8px] font-mono text-deep-black/50 block">{v.colorHex}</span>
                        </div>
                      </div>
                    </td>

                    {/* Tamanho */}
                    <td className="p-3">
                      <span className="px-2 py-1 bg-deep-black text-white text-[10px] font-black inline-block">
                        {v.size}
                      </span>
                    </td>

                    {/* SKU */}
                    <td className="p-3">
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].sku = e.target.value.toUpperCase();
                          setVariants(updated);
                        }}
                        className="w-32 p-1.5 border border-deep-black font-mono font-bold text-xs uppercase bg-white focus:outline-none focus:border-gold"
                      />
                    </td>

                    {/* Barcode */}
                    <td className="p-3">
                      <input
                        type="text"
                        value={v.barcode}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].barcode = e.target.value;
                          setVariants(updated);
                        }}
                        className="w-28 p-1.5 border border-deep-black font-mono text-[11px] bg-white focus:outline-none focus:border-gold"
                      />
                    </td>

                    {/* Estoque */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={v.stock_quantity}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].stock_quantity = Math.max(0, parseInt(e.target.value) || 0);
                            setVariants(updated);
                          }}
                          className={`w-20 p-1.5 border-2 font-mono font-black text-center text-xs focus:outline-none ${
                            v.stock_quantity > 0
                              ? 'border-deep-black bg-white text-deep-black'
                              : 'border-gold bg-gold/10 text-deep-black'
                          }`}
                        />
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            v.stock_quantity > 0 ? 'bg-green-500' : 'bg-gold'
                          }`}
                          title={v.stock_quantity > 0 ? 'Pronta Entrega' : 'Sob Encomenda'}
                        />
                      </div>
                    </td>

                    {/* Preço de Venda */}
                    <td className="p-3 font-mono">
                      <div className="relative w-20">
                        <span className="absolute left-1.5 top-1.5 text-[10px] font-bold text-deep-black">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={v.price}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].price = parseFloat(e.target.value) || 0;
                            setVariants(updated);
                          }}
                          className="w-full p-1 pl-4 border border-deep-black font-mono text-xs text-right bg-white"
                        />
                      </div>
                    </td>

                    {/* Preço de Custo */}
                    <td className="p-3 font-mono">
                      <div className="relative w-20">
                        <span className="absolute left-1.5 top-1.5 text-[10px] font-bold text-gold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={v.cost_price}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].cost_price = parseFloat(e.target.value) || 0;
                            setVariants(updated);
                          }}
                          className="w-full p-1 pl-4 border border-gold font-mono text-xs text-right bg-white text-deep-black"
                        />
                      </div>
                    </td>

                    {/* Checkbox Encomenda */}
                    <td className="p-3 text-center">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={v.allow_backorder}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].allow_backorder = e.target.checked;
                            setVariants(updated);
                          }}
                          className="w-4 h-4 accent-gold"
                        />
                        <span className="text-[9px] font-bold">
                          {v.allow_backorder ? 'SIM' : 'NÃO'}
                        </span>
                      </label>
                    </td>

                    {/* Dias Confecção */}
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={v.estimated_production_days}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].estimated_production_days =
                              parseInt(e.target.value) || 7;
                            setVariants(updated);
                          }}
                          className="w-14 p-1 border border-deep-black text-center font-mono text-xs bg-white"
                        />
                        <span className="text-[9px] text-deep-black/60">DIAS</span>
                      </div>
                    </td>

                    {/* Excluir Linha */}
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setVariants(variants.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white transition"
                        title="Remover esta variação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 4: UPLOAD DE MÍDIAS & ASSOCIAÇÃO POR COR
         ========================================================================= */}
      <div className="border-2 border-deep-black p-6 sm:p-8 space-y-6 bg-white shadow-sm">
        <div className="border-b border-deep-black/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-gold" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black">
                4. UPLOAD DE MÍDIAS (FOTOS EM ALTA & VÍDEOS) COM ASSOCIAÇÃO POR COR
              </h2>
            </div>
            <p className="text-xs text-deep-black/60 uppercase mt-0.5">
              Faça upload das fotos da modelo e associe cada imagem à cor correspondente (ex: Amarelo Solar, Preto Ônix).
            </p>
          </div>
          <span className="text-[10px] font-black uppercase bg-deep-black text-white px-3 py-1">
            {mediaList.length} ARQUIVOS CARREGADOS
          </span>
        </div>

        {/* Input Oculto de Arquivos */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/mp4"
          onChange={handleMediaUpload}
          className="hidden"
        />

        {/* Dropzone de Upload */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-deep-black hover:border-gold hover:bg-gold/5 p-8 text-center cursor-pointer transition space-y-3"
        >
          <div className="inline-flex p-3 bg-white border border-deep-black text-gold shadow-xs">
            <Upload className="w-6 h-6 text-gold" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-deep-black block">
              CLIQUE OU ARRASTE FOTOS EM ALTA RESOLUÇÃO E VÍDEOS CURTOS (MP4)
            </span>
            <span className="text-[10px] text-deep-black/60 uppercase font-medium">
              Suporte a arquivos JPG, PNG, WEBP e vídeos MP4 (Demonstração de caimento e squat-proof).
            </span>
          </div>
          {isUploadingMedia && (
            <p className="text-xs font-black uppercase text-gold animate-pulse">
              Enviando arquivos para o servidor...
            </p>
          )}
        </div>

        {/* Adição Direta via URL */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <input
            type="url"
            placeholder="Ou cole uma URL direta de foto (ex: https://.../foto.jpg ou link do seu catálogo)"
            value={directImageUrlInput}
            onChange={(e) => setDirectImageUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddDirectUrl();
              }
            }}
            className="flex-1 p-2.5 border-2 border-deep-black text-xs font-medium focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddDirectUrl}
            className="px-4 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition shrink-0"
          >
            + VINCULAR POR URL
          </button>
        </div>

        {/* Grade de Mídias Carregadas com Associação por Cor */}
        {mediaList.length > 0 && (
          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
              MÍDIAS VINCULADAS AO PRODUTO ({mediaList.length}):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {mediaList.map((media, mIdx) => (
                <div
                  key={media.id}
                  className="bg-white border-2 border-deep-black p-2 space-y-2 relative group shadow-xs"
                >
                  <div className="relative aspect-[4/5] bg-deep-black/10 overflow-hidden border border-deep-black/20">
                    {media.type === 'video' ? (
                      <video src={media.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={media.url} alt="Mídia" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-1 left-1 bg-deep-black text-gold text-[7px] font-black px-1.5 py-0.5 uppercase">
                      {media.type}
                    </span>
                    {media.isUploading && (
                      <span className="absolute bottom-1 left-1 bg-gold text-deep-black text-[7px] font-black px-1 py-0.5 animate-pulse">
                        ENVIANDO...
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const removed = mediaList[mIdx];
                        setMediaList(mediaList.filter((_, i) => i !== mIdx));
                        if (removed) {
                          setVariants((prev) =>
                            prev.map((vr) => ({
                              ...vr,
                              images: (vr.images || []).filter((u) => u !== removed.url),
                              image: vr.image === removed.url ? (vr.images || []).find((u) => u !== removed.url) || '' : vr.image,
                            }))
                          );
                        }
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow-sm"
                      title="Excluir mídia"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Seletor de Associação de Cor */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-wider text-deep-black/70 block">
                      Associar à Cor:
                    </label>
                    <select
                      value={media.associatedColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = [...mediaList];
                        updated[mIdx].associatedColor = val;
                        setMediaList(updated);

                        // Atualiza automaticamente as variantes dessa cor na matriz
                        setVariants((prev) =>
                          prev.map((vr) => {
                            if (val === 'all' || vr.color === val) {
                              const currentImgs = Array.isArray(vr.images) ? vr.images : [];
                              return {
                                ...vr,
                                image: currentImgs[0] || media.url,
                                images: Array.from(new Set([...currentImgs, media.url])),
                              };
                            } else {
                              return {
                                ...vr,
                                images: (vr.images || []).filter((u) => u !== media.url),
                              };
                            }
                          })
                        );
                      }}
                      className="w-full p-1 border border-deep-black font-bold text-[9px] uppercase bg-white focus:outline-none focus:border-gold"
                    >
                      <option value="all">Todas as Cores (Geral)</option>
                      {colors.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          BOTÕES DE AÇÃO: SALVAR NO SUPABASE & CANCELAR
         ========================================================================= */}
      <div className="p-6 bg-deep-black text-white border-2 border-gold flex flex-col sm:flex-row items-center justify-between gap-4 shadow-luxury">
        <div className="text-left space-y-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-gold" />
            <span>PRONTO PARA GRAVAR NO BANCO DE DADOS SUPABASE</span>
          </span>
          <p className="text-xs text-white/70 uppercase">
            Gravará 1 registro em <strong className="text-white">'products'</strong> e {variants.length} registros em <strong className="text-white">'product_variants'</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest transition"
            >
              CANCELAR
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 sm:flex-none px-8 py-4 bg-gold hover:bg-white hover:text-deep-black text-deep-black font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-deep-black" />
                <span>GRAVANDO NO SUPABASE...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>SALVAR PRODUTO E GRADE NO SUPABASE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
