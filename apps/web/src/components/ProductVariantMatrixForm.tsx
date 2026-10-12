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
  Percent,
  Star,
  Award,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Image as ImageIcon,
  Link2,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { supabase } from '../lib/supabase';

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

  // Visibilidade / Canais de Venda (Online & PDV)
  const [visibleOnline, setVisibleOnline] = useState(false);
  const [visiblePos, setVisiblePos] = useState(true);

  // Atributos Oficiais Wix Stores
  const [ribbon, setRibbon] = useState(''); // Fita / Selo Promocional (ex: Lançamento, Mais Vendido, Oferta)
  const [brand, setBrand] = useState('ANA Fitness Wear'); // Marca
  const [generalSku, setGeneralSku] = useState(''); // SKU Geral
  const [comparePrice, setComparePrice] = useState(''); // Preço de Comparação (De / Por)
  const [isOnSale, setIsOnSale] = useState(false); // Toggle de Promoção

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
  const [draggedMediaIndex, setDraggedMediaIndex] = useState<number | null>(null);

  // Vínculo de Foto com Variação
  const [variantPhotoModal, setVariantPhotoModal] = useState<{
    variantIndex: number;
    currentVariant: VariantRow;
  } | null>(null);
  const [applyToAllSizesOfColor, setApplyToAllSizesOfColor] = useState(true);
  const [isUploadingVariantPhoto, setIsUploadingVariantPhoto] = useState(false);
  const variantFileInputRef = useRef<HTMLInputElement>(null);

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

      let parsedMeta: any = {};
      // Extrai metadados do campo description caso esteja em JSON
      if (initialProduct.description) {
        try {
          if (initialProduct.description.startsWith('{')) {
            parsedMeta = JSON.parse(initialProduct.description);
            setDescription(parsedMeta.bio || '');
            setComposition(parsedMeta.composition || '');
            if (parsedMeta.ribbon) setRibbon(parsedMeta.ribbon);
            if (parsedMeta.brand) setBrand(parsedMeta.brand);
            if (parsedMeta.general_sku) setGeneralSku(parsedMeta.general_sku);
            if (parsedMeta.compare_price && parsedMeta.promotional_price) {
              const higher = Math.max(Number(parsedMeta.compare_price), Number(parsedMeta.promotional_price));
              const lower = Math.min(Number(parsedMeta.compare_price), Number(parsedMeta.promotional_price));
              setComparePrice(String(higher));
              setDefaultPrice(String(lower));
              setIsOnSale(true);
            } else if (parsedMeta.compare_price) {
              setComparePrice(String(parsedMeta.compare_price));
              setIsOnSale(true);
            } else if (parsedMeta.promotional_price) {
              setComparePrice(String(initialProduct.price || 49.90));
              setDefaultPrice(String(parsedMeta.promotional_price));
              setIsOnSale(true);
            }
            setVisibleOnline(parsedMeta.visible_online === true || initialProduct.visible_online === true);
            setVisiblePos(parsedMeta.visible_pos !== false && initialProduct.visible_pos !== false);
          } else {
            setDescription(initialProduct.description);
            setVisibleOnline(initialProduct.visible_online === true);
            setVisiblePos(initialProduct.visible_pos !== false);
          }
        } catch {
          setDescription(initialProduct.description);
          setVisibleOnline(initialProduct.visible_online === true);
          setVisiblePos(initialProduct.visible_pos !== false);
        }
      } else {
        setVisibleOnline(initialProduct.visible_online === true);
        setVisiblePos(initialProduct.visible_pos !== false);
      }
      if (initialProduct.sku) setGeneralSku(initialProduct.sku);

      // Extrai todas as mídias já existentes (foto de capa, variantes, galeria)
      const existingMedia: MediaItem[] = [];
      const seenUrls = new Set<string>();

      const addMediaIfNew = (url: string, color = 'all', name = 'Foto do Produto') => {
        if (!url || typeof url !== 'string' || url.startsWith('data:') || seenUrls.has(url)) return;
        seenUrls.add(url);
        const isVid = url.endsWith('.mp4') || url.includes('video');
        existingMedia.push({
          id: `m-init-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url,
          type: isVid ? 'video' : 'image',
          associatedColor: color,
          fileName: name,
          isUploading: false,
        });
      };

      // 1. Candidatas a foto principal
      const primaryCandidate =
        initialProduct.primaryImage ||
        initialProduct.primary_image ||
        initialProduct.meta?.primary_image ||
        parsedMeta.primary_image ||
        '';

      if (primaryCandidate) {
        addMediaIfNew(primaryCandidate, 'all', 'Foto Principal');
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
          images: (Array.isArray(v.images) ? v.images : v.image ? [v.image] : []).filter((u: string) => u && !u.startsWith('data:')),
          image: (Array.isArray(v.images) && v.images[0] && !v.images[0].startsWith('data:')) ? v.images[0] : (v.image && !v.image.startsWith('data:') ? v.image : ''),
          video_url: v.video_url || '',
        }));
        setVariants(loadedVariants);

        // Preço padrão das variantes
        if (loadedVariants[0]) {
          if (parsedMeta.promotional_price) {
            setDefaultPrice(String(parsedMeta.promotional_price));
          } else {
            setDefaultPrice(String(loadedVariants[0].price));
          }
          setDefaultCostPrice(String(loadedVariants[0].cost_price));
        }

        // Atualiza cores e tamanhos detectados
        const uniqueColors = Array.from(new Set(loadedVariants.map((v) => v.color)));
        const colorObjs = uniqueColors.map((cName) => {
          const found = loadedVariants.find((v) => v.color === cName);
          return { name: cName, hex: found?.colorHex || '#0A0A0A' };
        });
        if (colorObjs.length > 0) {
          setColors(colorObjs);
        }

        const uniqueSizes = Array.from(new Set(loadedVariants.map((v) => v.size)));
        if (uniqueSizes.length > 0) {
          setSelectedSizes(uniqueSizes);
        }

        loadedVariants.forEach((v) => {
          if (Array.isArray(v.images)) {
            v.images.forEach((imgUrl: string) => {
              addMediaIfNew(imgUrl, v.color || 'all', 'Foto da Variante');
            });
          } else if (v.image) {
            addMediaIfNew(v.image, v.color || 'all', 'Foto da Variante');
          }
          if (v.video_url) {
            addMediaIfNew(v.video_url, v.color || 'all', 'Vídeo da Peça');
          }
        });
      } else if (initialProduct.colorName || (initialProduct.sizes && initialProduct.sizes.length > 0)) {
        if (initialProduct.colorName) {
          setColors([{ name: initialProduct.colorName, hex: initialProduct.colorHex || '#0A0A0A' }]);
        }
        if (initialProduct.sizes && initialProduct.sizes.length > 0) {
          setSelectedSizes(initialProduct.sizes);
        }
      }

      setMediaList(existingMedia);
    } else {
      setVisibleOnline(false); // Novos produtos iniciam como rascunho por segurança
      setVisiblePos(true);
      setRibbon('');
      setBrand('ANA Fitness Wear');
      setGeneralSku('');
      setComparePrice('');
      setIsOnSale(false);
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

  // Sincronizador automático da grade de variações
  const syncMatrixWithColorsAndSizes = (
    currentColors: Array<{ name: string; hex: string }>,
    currentSizes: string[],
    existingVariants: VariantRow[]
  ) => {
    if (currentColors.length === 0 || currentSizes.length === 0) {
      setVariants([]);
      return;
    }

    const basePrefix = (generalSku || title || 'PROD')
      .slice(0, 4)
      .toUpperCase()
      .replace(/[^\w]/g, '');

    const colorCodeMap = (cName: string) =>
      cName
        .slice(0, 3)
        .toUpperCase()
        .replace(/[^\w]/g, '');

    const generated: VariantRow[] = [];

    currentColors.forEach((colorObj) => {
      const colorImages = mediaList
        .filter((m) => m.associatedColor === colorObj.name || m.associatedColor === 'all')
        .map((m) => m.url);

      currentSizes.forEach((sz) => {
        const existing = existingVariants.find(
          (v) =>
            (v.color || '').trim().toLowerCase() === colorObj.name.trim().toLowerCase() &&
            (v.size || '').trim().toUpperCase() === sz.trim().toUpperCase()
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
          stock_quantity: existing !== undefined ? existing.stock_quantity : 5,
          price: existing !== undefined ? existing.price : (parseFloat(defaultPrice) || 44.9),
          cost_price: existing !== undefined ? existing.cost_price : (parseFloat(defaultCostPrice) || 16.0),
          allow_backorder: existing !== undefined ? existing.allow_backorder : true,
          estimated_production_days: existing !== undefined ? existing.estimated_production_days : 7,
          image: existing?.image || colorImages[0] || mediaList[0]?.url || '',
          images: existing?.images?.length ? existing.images : (colorImages.length ? colorImages : (mediaList[0]?.url ? [mediaList[0].url] : [])),
          video_url: existing?.video_url || '',
        });
      });
    });

    setVariants(generated);
  };

  // Gerenciamento de Cores
  const handleAddColor = () => {
    if (newColorName.trim() && !colors.some((c) => c.name.toLowerCase() === newColorName.trim().toLowerCase())) {
      const updatedColors = [...colors, { name: newColorName.trim(), hex: newColorHex }];
      setColors(updatedColors);
      setNewColorName('');
      syncMatrixWithColorsAndSizes(updatedColors, selectedSizes, variants);
    }
  };

  const handleRemoveColor = (nameToRemove: string) => {
    const updatedColors = colors.filter((c) => c.name !== nameToRemove);
    setColors(updatedColors);
    syncMatrixWithColorsAndSizes(updatedColors, selectedSizes, variants);
  };

  // Gerenciamento de Tamanhos
  const toggleSize = (sz: string) => {
    const updatedSizes = selectedSizes.includes(sz)
      ? selectedSizes.filter((s) => s !== sz)
      : [...selectedSizes, sz];
    setSelectedSizes(updatedSizes);
    syncMatrixWithColorsAndSizes(colors, updatedSizes, variants);
  };

  const handleAddCustomSize = () => {
    if (customSizeInput.trim()) {
      const upper = customSizeInput.trim().toUpperCase();
      if (!availableSizes.includes(upper)) {
        setAvailableSizes([...availableSizes, upper]);
      }
      const updatedSizes = selectedSizes.includes(upper) ? selectedSizes : [...selectedSizes, upper];
      setSelectedSizes(updatedSizes);
      setCustomSizeInput('');
      syncMatrixWithColorsAndSizes(colors, updatedSizes, variants);
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

    syncMatrixWithColorsAndSizes(colors, selectedSizes, variants);
    setFeedback({
      type: 'success',
      message: `Grade gerada com sucesso! ${colors.length * selectedSizes.length} variações combinadas (${colors.length} cores × ${selectedSizes.length} tamanhos).`,
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

  // Reordenação de fotos (mover para esquerda / direita)
  const handleMoveMedia = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= mediaList.length) return;

    const updated = [...mediaList];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    setMediaList(updated);
  };

  // Drag & drop para reordenação de fotos na galeria
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedMediaIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedMediaIndex === null || draggedMediaIndex === targetIndex) {
      setDraggedMediaIndex(null);
      return;
    }

    const updated = [...mediaList];
    const [movedItem] = updated.splice(draggedMediaIndex, 1);
    updated.splice(targetIndex, 0, movedItem);
    setMediaList(updated);
    setDraggedMediaIndex(null);
  };

  // Define uma foto como capa principal (move para índice 0)
  const handleSetPrimaryMedia = (index: number) => {
    if (index <= 0 || index >= mediaList.length) return;
    const updated = [...mediaList];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    setMediaList(updated);

    // Atualiza primeira foto das variantes caso não tenham imagem própria
    setVariants((prev) =>
      prev.map((vr) => ({
        ...vr,
        image: vr.image || selected.url,
      }))
    );
  };

  // Vincular foto a uma variante específica ou a todos os tamanhos da cor
  const handleBindPhotoToVariant = (
    variantIndex: number,
    photoUrl: string,
    applyToAllSizes: boolean = true
  ) => {
    const targetVariant = variants[variantIndex];
    if (!targetVariant) return;

    setVariants((prev) =>
      prev.map((v, i) => {
        if (applyToAllSizes && v.color.toLowerCase() === targetVariant.color.toLowerCase()) {
          const currentImgs = Array.isArray(v.images) ? v.images : [];
          return {
            ...v,
            image: photoUrl,
            images: photoUrl ? [photoUrl, ...currentImgs.filter((u) => u !== photoUrl)] : currentImgs,
          };
        }

        if (i === variantIndex) {
          const currentImgs = Array.isArray(v.images) ? v.images : [];
          return {
            ...v,
            image: photoUrl,
            images: photoUrl ? [photoUrl, ...currentImgs.filter((u) => u !== photoUrl)] : currentImgs,
          };
        }

        return v;
      })
    );
  };

  // Upload direto de foto no Storage para uma variante específica
  const handleUploadPhotoForVariant = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !variantPhotoModal) return;
    const file = e.target.files[0];
    setIsUploadingVariantPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage.from('products').upload(filePath, file, {
        contentType: file.type,
      });

      if (uploadErr) {
        alert(`Erro no upload: ${uploadErr.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);

      // Adiciona na galeria geral
      setMediaList((prev) => [
        ...prev,
        {
          id: `m-var-${Date.now()}`,
          url: publicUrl,
          type: 'image',
          associatedColor: variantPhotoModal.currentVariant.color,
          fileName: file.name,
          isUploading: false,
        },
      ]);

      // Vincula na variante
      handleBindPhotoToVariant(
        variantPhotoModal.variantIndex,
        publicUrl,
        applyToAllSizesOfColor
      );

      // Atualiza o modal
      setVariantPhotoModal((prev) =>
        prev
          ? {
              ...prev,
              currentVariant: {
                ...prev.currentVariant,
                image: publicUrl,
              },
            }
          : null
      );
    } catch (err: any) {
      alert(`Erro ao carregar foto: ${err?.message}`);
    } finally {
      setIsUploadingVariantPhoto(false);
      if (variantFileInputRef.current) variantFileInputRef.current.value = '';
    }
  };

  // Upload de Mídias (Fotos e Vídeos) Direto para o Supabase Storage (Sem Base64)
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingMedia(true);

    const files = Array.from(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';

    for (const file of files) {
      const isVid = file.type.startsWith('video/');
      const tempId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const defaultColor = 'all';

      // 1. Indicador visual imediato "Carregando imagem..." (0 Base64)
      const initialMediaItem: MediaItem = {
        id: tempId,
        url: '',
        type: isVid ? 'video' : 'image',
        associatedColor: defaultColor,
        fileName: file.name,
        isUploading: true,
      };

      setMediaList((prev) => [...prev, initialMediaItem]);

      try {
        // 2. Upload binário direto para o Supabase Storage (bucket 'products')
        const fileExt = file.name.split('.').pop() || (isVid ? 'mp4' : 'jpg');
        const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('products')
          .upload(filePath, file, { contentType: file.type });

        if (error) {
          console.error('Erro no upload para Supabase Storage:', error);
          alert(`Erro ao enviar foto para o Supabase Storage: ${error.message}`);
          setMediaList((prev) => prev.filter((m) => m.id !== tempId));
          continue;
        }

        // 3. Obtenção da URL pública permanente
        const {
          data: { publicUrl },
        } = supabase.storage.from('products').getPublicUrl(filePath);

        // 4. Salva unicamente a URL pública no estado da galeria
        setMediaList((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, url: publicUrl, isUploading: false } : m
          )
        );

        // 5. Salva unicamente a URL pública nas variações
        setVariants((prev) =>
          prev.map((vr) => {
            if (defaultColor === 'all' || vr.color === defaultColor) {
              const currentImgs = Array.isArray(vr.images) ? vr.images : [];
              return {
                ...vr,
                image: currentImgs[0] || publicUrl,
                images: Array.from(new Set([...currentImgs, publicUrl])),
              };
            }
            return vr;
          })
        );
      } catch (err: any) {
        console.error('Erro no upload para Supabase Storage:', err);
        alert(`Falha no upload para o Storage: ${err?.message || 'Erro desconhecido'}`);
        setMediaList((prev) => prev.filter((m) => m.id !== tempId));
      }
    }
    setIsUploadingMedia(false);
  };

  // Adição direta por URL externa
  const handleAddDirectUrl = () => {
    const rawUrl = directImageUrlInput.trim();
    if (!rawUrl) return;

    const defaultColor = 'all';
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
  // 💾 GRAVAÇÃO FINAL NO SUPABASE
  // =========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }

    const activeColorNames = new Set(colors.map((c) => c.name.trim().toLowerCase()));
    const activeSizeNames = new Set(selectedSizes.map((s) => s.trim().toUpperCase()));

    // 1. Considera apenas variações que pertencem às cores e tamanhos ativos
    const validVariants = variants.filter(
      (v) =>
        activeColorNames.has((v.color || '').trim().toLowerCase()) &&
        activeSizeNames.has((v.size || '').trim().toUpperCase())
    );

    const basePrefix = (generalSku || title || 'PROD').slice(0, 4).toUpperCase().replace(/[^\w]/g, '');
    const currentKeys = new Set(validVariants.map((v) => `${(v.color || '').trim().toLowerCase()}___${(v.size || '').trim().toUpperCase()}`));
    const completedVariants = [...validVariants];

    colors.forEach((c) => {
      selectedSizes.forEach((s) => {
        const key = `${c.name.trim().toLowerCase()}___${s.trim().toUpperCase()}`;
        if (!currentKeys.has(key)) {
          const colorImgs = mediaList
            .filter((m) => m.associatedColor === c.name || m.associatedColor === 'all')
            .map((m) => m.url);

          completedVariants.push({
            color: c.name,
            colorHex: c.hex,
            size: s,
            sku: `${basePrefix}-${c.name.slice(0, 3).toUpperCase().replace(/[^\w]/g, '')}-${s}`,
            barcode: `789${Math.floor(100000000 + Math.random() * 900000000)}`,
            stock_quantity: 5,
            price: parseFloat(defaultPrice) || 44.9,
            cost_price: parseFloat(defaultCostPrice) || 16.0,
            allow_backorder: true,
            estimated_production_days: 7,
            images: colorImgs.length ? colorImgs : mediaList.map((m) => m.url).filter(Boolean),
            image: colorImgs[0] || mediaList[0]?.url || '',
          });
        }
      });
    });

    if (completedVariants.length === 0) {
      alert('Por favor, adicione ao menos uma cor e um tamanho para o produto.');
      return;
    }

    if (mediaList.some((m) => m.isUploading)) {
      alert('Aguarde o término do upload das imagens para o Supabase Storage antes de salvar.');
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const enrichedVariants = completedVariants.map((vr) => {
      const explicitImg = vr.image && !vr.image.startsWith('data:') ? vr.image : '';

      // 1. Fotos vinculadas à cor desta variante
      const colorMatching = mediaList
        .filter((m) => m.associatedColor === vr.color && m.url && !m.url.startsWith('data:') && !m.isUploading)
        .map((m) => m.url);

      // 2. Fotos gerais da peça ('all')
      const allMatching = mediaList
        .filter((m) => m.associatedColor === 'all' && m.url && !m.url.startsWith('data:') && !m.isUploading)
        .map((m) => m.url);

      const currentImgs = (Array.isArray(vr.images) ? vr.images : []).filter((u) => u && !u.startsWith('data:'));

      // Ordena com prioridade máxima para a foto explícita da variação
      const orderedImages: string[] = [];
      if (explicitImg) orderedImages.push(explicitImg);
      colorMatching.forEach((img) => {
        if (!orderedImages.includes(img)) orderedImages.push(img);
      });
      currentImgs.forEach((img) => {
        if (!orderedImages.includes(img)) orderedImages.push(img);
      });
      allMatching.forEach((img) => {
        if (!orderedImages.includes(img)) orderedImages.push(img);
      });
      if (orderedImages.length === 0 && mediaList.length > 0) {
        mediaList.forEach((m) => {
          if (m.url && !orderedImages.includes(m.url)) orderedImages.push(m.url);
        });
      }

      const finalPrimary = orderedImages[0] || explicitImg || '';

      return {
        ...vr,
        images: orderedImages,
        image: finalPrimary,
      };
    });

    try {
      const validMedia = mediaList.filter((m) => m.url && !m.url.startsWith('data:') && !m.isUploading);
      const primaryCoverImg = validMedia[0]?.url || enrichedVariants[0]?.images?.[0] || enrichedVariants[0]?.image || '';
      const numCompare = isOnSale && comparePrice ? parseFloat(comparePrice) : null;
      const numPrice = parseFloat(defaultPrice) || 34.90;

      let finalSellingPrice = numPrice;
      let finalComparePrice = numCompare;

      if (isOnSale && numCompare) {
        const higher = Math.max(numPrice, numCompare);
        const lower = Math.min(numPrice, numCompare);
        finalSellingPrice = lower;
        finalComparePrice = higher;
      }

      const variantsWithPromoPrice = enrichedVariants.map((vr) => ({
        ...vr,
        price: finalSellingPrice,
      }));

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
        variants: variantsWithPromoPrice,
        visible_online: visibleOnline,
        visible_pos: visiblePos,
        ribbon: ribbon.trim(),
        brand: brand.trim() || 'ANA Fitness Wear',
        sku: generalSku.trim() || enrichedVariants[0]?.sku || '',
        compare_price: finalComparePrice,
        promotional_price: isOnSale ? finalSellingPrice : null,
        primary_image: primaryCoverImg,
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

      // Garante recepção estruturada de { success: true, product, variants }
      const { success, product: savedProduct, variants: savedVariants } = data;

      setFeedback({
        type: 'success',
        message: `✓ Produto "${title}" gravado com sucesso no Supabase! (${Array.isArray(savedVariants) ? savedVariants.length : 0} variações persistidas). Status: ${
          visibleOnline ? '🟢 No ar na vitrine' : '⚪ Oculto na loja'
        }`,
      });

      try {
        await refreshProducts();
      } catch (e) {}

      if (onSaveSuccess) {
        onSaveSuccess({
          success: Boolean(success),
          product: savedProduct,
          variants: savedVariants,
        });
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

  // Cálculos em tempo real de Lucro e Margem (Widget Wix Stores)
  const priceNum = parseFloat(defaultPrice) || 0;
  const costNum = parseFloat(defaultCostPrice) || 0;
  const compareNum = parseFloat(comparePrice) || 0;
  const profitPerUnit = priceNum - costNum;
  const marginPct = priceNum > 0 ? (profitPerUnit / priceNum) * 100 : 0;
  const discountPct =
    isOnSale && compareNum > priceNum
      ? Math.round(((compareNum - priceNum) / compareNum) * 100)
      : 0;

  const totalCalculatedStock = variants.reduce(
    (acc, v) => acc + (Number(v.stock_quantity) || 0),
    0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#f8f9fa] selection:bg-deep-black selection:text-gold p-3 sm:p-6 rounded-lg border border-gray-200">
      {/* =========================================================================
          WIX STORES STYLE TOP BAR
         ========================================================================= */}
      <div className="bg-white border-2 border-deep-black p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-deep-black text-gold border border-gold shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-deep-black/60">
              <span>CATÁLOGO DE PRODUTOS</span>
              <ChevronRight className="w-3 h-3 text-gold" />
              <span className="text-deep-black">{initialProduct ? 'EDIÇÃO DE PRODUTO FÍSICO' : 'NOVO PRODUTO FÍSICO'}</span>
            </div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black truncate max-w-md">
              {title || 'NOVO PRODUTO'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
          {/* Botão de Ativação Direta na Vitrine (Topo da Tela) */}
          <button
            type="button"
            onClick={() => setVisibleOnline(!visibleOnline)}
            className={`text-[10px] font-black uppercase tracking-widest px-3.5 py-2 border-2 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              visibleOnline
                ? 'bg-green-700 hover:bg-green-800 text-white border-green-800'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400'
            }`}
            title="Clique aqui para ativar ou desativar este produto na vitrine pública do site"
          >
            <span className={`w-2 h-2 rounded-full ${visibleOnline ? 'bg-white animate-pulse' : 'bg-amber-600'}`} />
            <span>{visibleOnline ? '🟢 NO AR NA VITRINE (ATIVO)' : '⚪ OCULTO DO SITE (CLIQUE P/ ATIVAR)'}</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border-2 border-deep-black hover:bg-deep-black hover:text-white text-deep-black font-black text-xs uppercase tracking-wider transition"
            >
              CANCELAR
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-gold hover:bg-deep-black hover:text-gold text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 border-2 border-deep-black disabled:opacity-50 shadow-xs"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>GRAVANDO...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>SALVAR PRODUTO</span>
              </>
            )}
          </button>
        </div>
      </div>

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
          GRID DE 2 COLUNAS OFICIAL WIX STORES
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =======================================================================
            COLUNA PRINCIPAL (ESQUERDA - 8 COLUNAS)
           ======================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* CARD 1: MÍDIAS E IMAGENS DO PRODUTO */}
          <div className="bg-white border-2 border-deep-black p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gold" />
                <h2 className="text-sm font-black uppercase tracking-wider text-deep-black">
                  Imagens e Vídeos
                </h2>
              </div>
              <span className="text-[10px] font-black uppercase bg-deep-black text-white px-2.5 py-0.5">
                {mediaList.length} ARQUIVOS CARREGADOS
              </span>
            </div>

            <p className="text-[11px] text-deep-black/70">
              Faça upload das fotos da modelo usando a peça. A primeira foto é exibida como capa principal da vitrine.
            </p>

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
              className="border-2 border-dashed border-deep-black/40 hover:border-gold hover:bg-gold/5 p-6 text-center cursor-pointer transition space-y-2 bg-gray-50/50"
            >
              <div className="inline-flex p-2.5 bg-white border border-deep-black/20 text-gold shadow-xs">
                <Upload className="w-5 h-5 text-gold" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-deep-black block">
                  Adicionar Imagens ou Vídeos
                </span>
                <span className="text-[10px] text-deep-black/60 font-medium">
                  PNG, JPG, WEBP e vídeos MP4 (Demonstração de caimento e squat-proof).
                </span>
              </div>
              {isUploadingMedia && (
                <div className="flex items-center justify-center gap-2 p-2.5 bg-gold/15 border-2 border-gold text-xs font-black uppercase text-deep-black animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-gold" />
                  <span>Carregando imagem para o Supabase Storage...</span>
                </div>
              )}
            </div>

            {/* Adição Direta via URL */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="Ou cole uma URL direta de imagem (ex: https://.../foto.jpg)"
                value={directImageUrlInput}
                onChange={(e) => setDirectImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDirectUrl();
                  }
                }}
                className="flex-1 p-2 border-2 border-deep-black text-xs font-medium focus:border-gold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddDirectUrl}
                className="px-3.5 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition shrink-0"
              >
                + VINCULAR URL
              </button>
            </div>

            {/* Grade de Mídias Carregadas com Associação por Cor */}
            {mediaList.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                  Galeria de Mídias ({mediaList.length}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {mediaList.map((media, mIdx) => {
                    const isPrimary = mIdx === 0;
                    const isBeingDragged = draggedMediaIndex === mIdx;

                    return (
                      <div
                        key={media.id}
                        draggable={!media.isUploading}
                        onDragStart={(e) => handleDragStart(e, mIdx)}
                        onDragOver={(e) => handleDragOver(e, mIdx)}
                        onDrop={(e) => handleDrop(e, mIdx)}
                        className={`bg-white border-2 p-2 space-y-2 relative group shadow-xs transition select-none ${
                          isBeingDragged ? 'opacity-40 border-gold border-dashed ring-2 ring-gold' : ''
                        } ${
                          isPrimary ? 'border-gold ring-2 ring-gold/30' : 'border-deep-black/30 hover:border-deep-black'
                        }`}
                      >
                        {/* Barra Superior do Card de Mídia */}
                        <div className="flex items-center justify-between text-[8px] font-black uppercase pb-1 border-b border-deep-black/10">
                          <span
                            className={`px-1.5 py-0.5 rounded-none flex items-center gap-1 ${
                              isPrimary ? 'bg-gold text-deep-black font-black' : 'bg-deep-black/10 text-deep-black/70'
                            }`}
                          >
                            {isPrimary && <Star className="w-2.5 h-2.5 fill-deep-black shrink-0" />}
                            <span>#{mIdx + 1} {isPrimary ? '(CAPA)' : ''}</span>
                          </span>

                          <div
                            className="cursor-grab active:cursor-grabbing text-deep-black/40 hover:text-gold p-0.5"
                            title="Arraste para reordenar a posição desta foto"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Visualizador da Mídia */}
                        <div className="relative aspect-[4/5] bg-deep-black/10 overflow-hidden border border-deep-black/10 group">
                          {media.isUploading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-deep-black text-white space-y-2">
                              <Loader2 className="w-6 h-6 text-gold animate-spin" />
                              <span className="text-[9px] font-black uppercase tracking-wider text-gold animate-pulse">
                                Carregando imagem...
                              </span>
                              <span className="text-[7.5px] font-mono text-white/60 truncate max-w-[90%]">
                                {media.fileName || 'Storage'}
                              </span>
                            </div>
                          ) : media.type === 'video' ? (
                            <video src={media.url} className="w-full h-full object-cover" />
                          ) : (
                            <img src={media.url} alt="Mídia" className="w-full h-full object-cover" />
                          )}

                          {/* Botão de Excluir Foto */}
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
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-700"
                            title="Excluir mídia"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Controles de Movimentação de Ordem (← Mover | Tornar Capa | Mover →) */}
                        <div className="flex items-center gap-1 pt-0.5">
                          <button
                            type="button"
                            disabled={mIdx === 0}
                            onClick={() => handleMoveMedia(mIdx, 'left')}
                            className="flex-1 py-1 px-1 bg-gray-100 hover:bg-deep-black hover:text-white disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-deep-black text-deep-black text-[9px] font-black uppercase transition border border-deep-black/20 flex items-center justify-center gap-0.5"
                            title="Mover foto para a esquerda (posição anterior)"
                          >
                            <ChevronLeft className="w-3 h-3" />
                            <span>←</span>
                          </button>

                          {!isPrimary ? (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryMedia(mIdx)}
                              className="flex-[2] py-1 px-1 bg-deep-black/5 hover:bg-gold hover:text-deep-black text-deep-black text-[8px] font-black uppercase transition border border-deep-black/20 truncate"
                              title="Tornar esta foto a capa principal da vitrine"
                            >
                              ★ Tornar Capa
                            </button>
                          ) : (
                            <span className="flex-[2] py-1 px-1 bg-gold text-deep-black text-[8px] font-black uppercase text-center border border-gold truncate">
                              ★ Capa Ativa
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={mIdx === mediaList.length - 1}
                            onClick={() => handleMoveMedia(mIdx, 'right')}
                            className="flex-1 py-1 px-1 bg-gray-100 hover:bg-deep-black hover:text-white disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-deep-black text-deep-black text-[9px] font-black uppercase transition border border-deep-black/20 flex items-center justify-center gap-0.5"
                            title="Mover foto para a direita (próxima posição)"
                          >
                            <span>→</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Seletor de Associação de Cor & Vínculo */}
                        <div className="space-y-1 pt-1 border-t border-deep-black/10">
                          <label className="text-[7.5px] font-black uppercase tracking-wider text-deep-black/60 block">
                            Cor da Peça:
                          </label>
                          <select
                            value={media.associatedColor}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = [...mediaList];
                              updated[mIdx].associatedColor = val;
                              setMediaList(updated);

                              setVariants((prev) =>
                                prev.map((vr) => {
                                  if (val === 'all' || vr.color.toLowerCase() === val.toLowerCase()) {
                                    const currentImgs = Array.isArray(vr.images) ? vr.images : [];
                                    return {
                                      ...vr,
                                      image: media.url,
                                      images: [media.url, ...currentImgs.filter((u) => u !== media.url)],
                                    };
                                  }
                                  return vr;
                                })
                              );
                            }}
                            className="w-full p-1 border border-deep-black/30 font-bold text-[8.5px] uppercase bg-white focus:outline-none focus:border-gold"
                          >
                            <option value="all">Todas as Cores</option>
                            {colors.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          {media.associatedColor !== 'all' && (
                            <button
                              type="button"
                              onClick={() => {
                                setVariants((prev) =>
                                  prev.map((vr) => {
                                    if (vr.color.toLowerCase() === media.associatedColor.toLowerCase()) {
                                      const cur = Array.isArray(vr.images) ? vr.images : [];
                                      return {
                                        ...vr,
                                        image: media.url,
                                        images: [media.url, ...cur.filter((u) => u !== media.url)],
                                      };
                                    }
                                    return vr;
                                  })
                                );
                                setFeedback({
                                  type: 'success',
                                  message: `✓ Foto vinculada a todas as variantes da cor "${media.associatedColor}"!`,
                                });
                                setTimeout(() => setFeedback(null), 3500);
                              }}
                              className="w-full py-1 bg-gold/15 hover:bg-gold text-deep-black text-[7.5px] font-black uppercase tracking-wider transition border border-gold/40 flex items-center justify-center gap-1 shadow-2xs"
                              title={`Vincular esta foto a todos os tamanhos da cor ${media.associatedColor}`}
                            >
                              <Link2 className="w-2.5 h-2.5 text-deep-black" />
                              <span>Vincular a {media.associatedColor}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: INFORMAÇÕES BÁSICAS DO PRODUTO (WIX BASIC INFO) */}
          <div className="bg-white border-2 border-deep-black p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-deep-black/10 pb-3">
              <FileText className="w-4 h-4 text-gold" />
              <h2 className="text-sm font-black uppercase tracking-wider text-deep-black">
                Informações do Produto
              </h2>
            </div>

            {/* Nome do Produto */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                <span>Nome do Produto *</span>
                <span className="text-deep-black/40 text-[9px]">Campo obrigatório</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: LEGGING SCULPT EFEITO LEVANTA BUMBUM"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full p-3 border-2 border-deep-black font-bold text-xs uppercase focus:outline-none focus:border-gold"
              />
            </div>

            {/* Fita do Produto (Product Ribbon) */}
            <div className="space-y-2 p-3.5 bg-gray-50 border border-deep-black/20">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-gold" />
                  <span>Fita do Produto (Product Ribbon / Selo Promocional)</span>
                </label>
                {ribbon && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gold text-deep-black border border-deep-black">
                    Preview: {ribbon}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-deep-black/60">
                Aparece como um selo de destaque no canto superior da foto na vitrine da loja.
              </p>
              <input
                type="text"
                placeholder="Ex: LANÇAMENTO, BEST SELLER, OFERTA RELÂMPAGO, SOB MEDIDA"
                value={ribbon}
                onChange={(e) => setRibbon(e.target.value)}
                className="w-full p-2.5 border-2 border-deep-black font-bold text-xs uppercase bg-white focus:outline-none focus:border-gold"
              />
              {/* Botões de Atalho Rápido para Ribbon */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[8.5px] font-bold text-deep-black/50 uppercase self-center mr-1">
                  Atalhos:
                </span>
                {['LANÇAMENTO', 'BEST SELLER', 'OFERTA RELÂMPAGO', 'SOB MEDIDA', 'EDIÇÃO LIMITADA', '100% SQUAT-PROOF'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setRibbon(sug)}
                    className="px-2 py-0.5 bg-white hover:bg-gold hover:text-deep-black text-deep-black border border-deep-black/30 text-[8.5px] font-black uppercase transition"
                  >
                    + {sug}
                  </button>
                ))}
                {ribbon && (
                  <button
                    type="button"
                    onClick={() => setRibbon('')}
                    className="px-2 py-0.5 text-red-600 hover:underline text-[8.5px] font-black uppercase"
                  >
                    ✕ Limpar Fita
                  </button>
                )}
              </div>
            </div>

            {/* Descrição Detalhada */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                Descrição Detalhada do Produto
              </label>
              <textarea
                rows={4}
                placeholder="Descreva o caimento, a compressão do tecido, a sustentação e os diferenciais esportivos da peça..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border-2 border-deep-black font-medium text-xs focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* CARD 3: PREÇO, PROMOÇÃO E LUCRO (WIX PRICING & PROFIT CALCULATOR) */}
          <div className="bg-white border-2 border-deep-black p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-deep-black/10 pb-3">
              <DollarSign className="w-4 h-4 text-gold" />
              <h2 className="text-sm font-black uppercase tracking-wider text-deep-black">
                Preços e Lucro por Peça
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              {/* Preço de Venda Padrão */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                  {isOnSale ? 'Preço de Oferta / Promocional ($ USD) *' : 'Preço de Venda ($ USD) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-deep-black">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 34.90"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    className="w-full p-2.5 pl-7 border-2 border-deep-black font-mono font-bold text-xs focus:outline-none focus:border-gold"
                  />
                </div>
                {isOnSale && (
                  <span className="text-[9px] text-green-700 font-bold block">
                    ✓ Valor que o cliente pagará (destacado na vitrine)
                  </span>
                )}
              </div>

              {/* Preço de Custo */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                  <span>Custo dos Produtos ($ USD)</span>
                  <span className="text-[9px] text-deep-black/40">Confecção</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-deep-black">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultCostPrice}
                    onChange={(e) => setDefaultCostPrice(e.target.value)}
                    className="w-full p-2.5 pl-7 border-2 border-deep-black font-mono font-bold text-xs focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>

            {/* Toggle Em Promoção / Preço de Comparação (Compare Price) */}
            <div className="p-4 border-2 border-deep-black/20 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnSale}
                    onChange={(e) => setIsOnSale(e.target.checked)}
                    className="w-4 h-4 accent-gold"
                  />
                  <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                    Em promoção (Exibir preço com risquinho por cima "De / Por")
                  </span>
                </label>
                {isOnSale && discountPct > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 bg-red-600 text-white uppercase">
                    -{discountPct}% OFF
                  </span>
                )}
              </div>

              {isOnSale && (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                      Preço Regular ($ USD - Valor com risco por cima)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-black text-deep-black">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 49.90"
                        value={comparePrice}
                        onChange={(e) => setComparePrice(e.target.value)}
                        className="w-full p-2.5 pl-7 border-2 border-deep-black font-mono font-bold text-xs focus:outline-none focus:border-gold bg-white"
                      />
                    </div>
                    <span className="text-[9px] text-deep-black/60 font-bold block">
                      Aparecerá riscado ao lado do preço de oferta (ex: ~$49.90~)
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-deep-black/20 text-xs font-bold text-deep-black">
                    <span className="text-[9px] text-deep-black/50 uppercase block font-black">Como o cliente verá na vitrine:</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-black font-mono text-deep-black">
                        ${(priceNum > 0 ? (compareNum > 0 ? Math.min(priceNum, compareNum) : priceNum) : 34.90).toFixed(2)}
                      </span>
                      {compareNum > 0 && (
                        <span className="text-xs text-deep-black/40 line-through font-mono font-bold">
                          ${(Math.max(priceNum, compareNum)).toFixed(2)}
                        </span>
                      )}
                      {discountPct > 0 && (
                        <span className="text-[9px] font-black text-red-600 uppercase">
                          ({discountPct}% OFF)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Widget Oficial Wix de Lucro Líquido e Margem */}
            <div className="bg-deep-black text-white p-4 border-2 border-gold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-luxury">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-gold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-gold" />
                  <span>CALCULADORA DE RENTABILIDADE WIX</span>
                </span>
                <p className="text-xs text-white/80">
                  Lucro líquido gerado por cada peça vendida com base no preço de venda e custo de confecção.
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 bg-white/10 px-4 py-2 border border-white/20">
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gold block">
                    LUCRO BRUTO / UNID
                  </span>
                  <span className="text-base font-black font-mono text-white">
                    {profitPerUnit >= 0 ? '+' : ''}${profitPerUnit.toFixed(2)}
                  </span>
                </div>

                <div className="w-px h-8 bg-white/20" />

                <div className="text-right">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gold block">
                    MARGEM DE LUCRO
                  </span>
                  <span className={`text-base font-black font-mono ${marginPct >= 50 ? 'text-green-400' : 'text-gold'}`}>
                    {marginPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: OPÇÕES DO PRODUTO & MATRIZ DE VARIANTES (COR × TAMANHO) */}
          <div className="bg-white border-2 border-deep-black p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gold" />
                <h2 className="text-sm font-black uppercase tracking-wider text-deep-black">
                  Opções do Produto (Cores e Tamanhos)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-deep-black/60 font-bold">
                {colors.length} CORES × {selectedSizes.length} TAMANHOS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Cores */}
              <div className="p-4 border-2 border-deep-black/20 bg-gray-50/50 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-gold" />
                  <span>Cores Disponíveis ({colors.length})</span>
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-9 h-9 border-2 border-deep-black cursor-pointer bg-transparent p-0.5 shrink-0"
                    title="Escolha a cor da amostra"
                  />
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
                    className="flex-1 p-2 border-2 border-deep-black font-bold text-xs uppercase focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-3 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[10px] font-black uppercase tracking-wider transition shrink-0"
                  >
                    + ADICIONAR
                  </button>
                </div>

                {/* Amostras Rápidas da Coleção Ana Fitness */}
                <div className="space-y-1 pt-1">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-deep-black/50 block">
                    Amostras Frequentes:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Preto Ônix', hex: '#0A0A0A' },
                      { name: 'Amarelo Solar', hex: '#F59E0B' },
                      { name: 'Verde Militar', hex: '#4B5320' },
                      { name: 'Champagne Gold', hex: '#D4AF37' },
                      { name: 'Pure White', hex: '#FFFFFF' },
                      { name: 'Vinho Marsala', hex: '#800020' },
                    ].map((sug) => (
                      <button
                        key={sug.name}
                        type="button"
                        onClick={() => {
                          if (!colors.some((c) => c.name.toLowerCase() === sug.name.toLowerCase())) {
                            setColors([...colors, sug]);
                          }
                        }}
                        className="px-2 py-0.5 bg-white border border-deep-black/30 hover:border-gold text-[8.5px] font-bold uppercase inline-flex items-center gap-1 transition"
                      >
                        <span className="w-2 h-2 rounded-full border border-deep-black/30" style={{ backgroundColor: sug.hex }} />
                        <span>{sug.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Cores Ativas */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-deep-black/10">
                  {colors.map((c) => (
                    <div
                      key={c.name}
                      className="p-1 pl-2 pr-1.5 bg-white border border-deep-black flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="w-3 h-3 rounded-full border border-deep-black/30" style={{ backgroundColor: c.hex }} />
                      <span className="text-[10px] font-black uppercase text-deep-black">{c.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(c.name)}
                        className="text-red-500 hover:text-red-700 p-0.5 transition"
                        title="Remover cor"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tamanhos */}
              <div className="p-4 border-2 border-deep-black/20 bg-gray-50/50 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-gold" />
                  <span>Tamanhos Disponíveis ({selectedSizes.length})</span>
                </span>

                <div className="grid grid-cols-5 gap-1.5">
                  {availableSizes.map((sz) => {
                    const isSelected = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        className={`py-2 text-xs font-black uppercase tracking-wider border-2 transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-deep-black text-white border-deep-black shadow-xs ring-1 ring-gold'
                            : 'bg-white text-deep-black/60 border-deep-black/20 hover:border-deep-black hover:text-deep-black'
                        }`}
                      >
                        <span>{sz}</span>
                        <span className="text-[7px] font-bold">
                          {isSelected ? '✓ ATIVO' : '+ ATIVAR'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
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
                    className="flex-1 p-2 border-2 border-deep-black font-bold text-xs uppercase focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[10px] font-black uppercase tracking-wider transition shrink-0"
                  >
                    + ADICIONAR
                  </button>
                </div>

                <div className="p-2 bg-white border border-deep-black/20 text-[10px] font-black uppercase text-deep-black flex items-center justify-between">
                  <span>Tamanhos Ativos:</span>
                  <span className="text-gold font-mono">{selectedSizes.join(' • ') || 'Nenhum'}</span>
                </div>
              </div>
            </div>

            {/* Botão Gerador de Grade */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleGenerateMatrix}
                className="w-full sm:w-auto px-8 py-3.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-wider transition inline-flex items-center justify-center gap-2 shadow-luxury border-2 border-gold"
              >
                <Sparkles className="w-4 h-4 text-gold" />
                <span>⚡ Gerar Grade de Variações ({colors.length * selectedSizes.length} Combinações)</span>
              </button>
            </div>

            {/* Tabela de Variantes */}
            {variants.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-deep-black/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-gold" />
                    <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                      Tabela de Estoque por Variação ({variants.length} SKUs)
                    </span>
                  </div>

                  {/* Ação em Massa */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-deep-black/60">Estoque em Massa:</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Qtd (ex: 5)"
                      value={massStockValue}
                      onChange={(e) => setMassStockValue(e.target.value)}
                      className="w-20 p-1 border border-deep-black font-mono font-bold text-center text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyMassStock}
                      className="px-2.5 py-1 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-[9px] font-black uppercase transition"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border-2 border-deep-black max-h-96">
                  <table className="w-full text-left text-xs uppercase tracking-wider">
                    <thead className="bg-deep-black text-white text-[9px] font-black sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5">Cor & Foto</th>
                        <th className="p-2.5">Tam</th>
                        <th className="p-2.5">Código SKU</th>
                        <th className="p-2.5">Estoque</th>
                        <th className="p-2.5">Preço ($)</th>
                        <th className="p-2.5">Custo ($)</th>
                        <th className="p-2.5">Encomenda</th>
                        <th className="p-2.5 text-right">Excluir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-deep-black/10">
                      {variants.map((v, idx) => (
                        <tr key={`${v.color}-${v.size}-${idx}`} className="hover:bg-deep-black/5">
                          <td className="p-2.5">
                            <div className="flex items-center gap-2">
                              {/* Botão de Foto da Variação (Interativo) */}
                              <button
                                type="button"
                                onClick={() => setVariantPhotoModal({ variantIndex: idx, currentVariant: v })}
                                className="w-8 h-10 border-2 border-deep-black/30 hover:border-gold hover:ring-2 hover:ring-gold/30 overflow-hidden bg-deep-black/10 shrink-0 relative group transition shadow-2xs"
                                title="Clique para vincular ou trocar foto desta variação"
                              >
                                {v.image || v.images?.[0] ? (
                                  <img
                                    src={v.image || v.images[0]}
                                    alt={v.color}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center p-0.5 text-[6.5px] text-deep-black/40 font-bold leading-tight">
                                    <Camera className="w-3 h-3 text-deep-black/30 mb-0.5" />
                                    <span>+ FOTO</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Camera className="w-3.5 h-3.5 text-gold" />
                                </div>
                              </button>

                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-deep-black/40 shrink-0"
                                    style={{ backgroundColor: v.colorHex }}
                                  />
                                  <span className="font-black text-deep-black text-[11px]">{v.color}</span>
                                </div>

                                {/* Seletor Rápido de Foto da Galeria */}
                                <div className="flex items-center gap-1">
                                  <select
                                    value={v.image || ''}
                                    onChange={(e) => {
                                      handleBindPhotoToVariant(idx, e.target.value, false);
                                    }}
                                    className="p-0.5 text-[8.5px] border border-deep-black/30 font-bold uppercase bg-white max-w-[120px] truncate focus:outline-none focus:border-gold"
                                    title="Selecione diretamente a foto para esta variação"
                                  >
                                    <option value="">(Capa Geral)</option>
                                    {mediaList.map((m, mIdx) => (
                                      <option key={m.id} value={m.url}>
                                        Foto #{mIdx + 1} {m.associatedColor !== 'all' ? `(${m.associatedColor})` : ''} {mIdx === 0 ? '★' : ''}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() => setVariantPhotoModal({ variantIndex: idx, currentVariant: v })}
                                    className="px-1.5 py-0.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[7.5px] font-black uppercase transition shrink-0"
                                    title="Abrir seletor visual com miniaturas grandes"
                                  >
                                    Ver
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-2.5 font-black text-xs">{v.size}</td>

                          <td className="p-2.5">
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[idx].sku = e.target.value.toUpperCase();
                                setVariants(updated);
                              }}
                              className="w-28 p-1 border border-deep-black font-mono font-bold text-[10px] uppercase bg-white"
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              value={v.stock_quantity}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[idx].stock_quantity = Math.max(0, parseInt(e.target.value) || 0);
                                setVariants(updated);
                              }}
                              className="w-16 p-1 border border-deep-black text-center font-mono font-bold text-xs bg-white"
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.01"
                              value={v.price}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[idx].price = parseFloat(e.target.value) || 0;
                                setVariants(updated);
                              }}
                              className="w-20 p-1 border border-deep-black font-mono font-bold text-xs bg-white"
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.01"
                              value={v.cost_price}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[idx].cost_price = parseFloat(e.target.value) || 0;
                                setVariants(updated);
                              }}
                              className="w-20 p-1 border border-deep-black font-mono font-bold text-xs bg-white"
                            />
                          </td>

                          <td className="p-2.5 text-center">
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
                          </td>

                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setVariants(variants.filter((_, i) => i !== idx));
                              }}
                              className="p-1 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white transition"
                              title="Remover variante"
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
          </div>

          {/* CARD 5: INFORMAÇÕES ADICIONAIS (COMPOSIÇÃO & TABELA DE MEDIDAS) */}
          <div className="bg-white border-2 border-deep-black p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-deep-black/10 pb-3">
              <Ruler className="w-4 h-4 text-gold" />
              <h2 className="text-sm font-black uppercase tracking-wider text-deep-black">
                Informações Adicionais (Atelier & Confecção)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
                  <Shirt className="w-3.5 h-3.5 text-gold" />
                  <span>Composição do Tecido</span>
                </label>
                <input
                  type="text"
                  placeholder="88% Poliamida Nobre, 12% Elastano"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  className="w-full p-2.5 border-2 border-deep-black font-bold text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-gold" />
                  <span>Tabela de Medidas (Guia de Tamanhos)</span>
                </label>
                <input
                  type="text"
                  placeholder="P: 34-36 (US 2-4) | M: 38-40 (US 6-8) | G: 42-44 (US 10-12)"
                  value={sizeGuide}
                  onChange={(e) => setSizeGuide(e.target.value)}
                  className="w-full p-2.5 border-2 border-deep-black font-medium text-xs focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            COLUNA LATERAL (DIREITA - 4 COLUNAS / WIX SIDEBAR)
           ======================================================================= */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          {/* CARD LATERAL 1: VISIBILIDADE DO PRODUTO (CONTROLE LOJA ONLINE & PDV) */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gold" />
                <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
                  Visibilidade do Produto
                </h3>
              </div>
              <span
                className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                  visibleOnline
                    ? 'bg-green-700 text-white border-green-800'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {visibleOnline ? '🟢 NO AR' : '⚪ OCULTO'}
              </span>
            </div>

            {/* Toggle Loja Online */}
            <div
              className={`p-4 border-2 transition-all ${
                visibleOnline
                  ? 'border-deep-black bg-gold/5 shadow-xs'
                  : 'border-deep-black/20 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase tracking-wider text-deep-black block">
                    Mostrar na loja online
                  </span>
                  <p className="text-[10px] text-deep-black/70 leading-relaxed">
                    Quando ativado, a peça é publicada imediatamente na vitrine pública do site e nas buscas de categorias.
                  </p>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => setVisibleOnline(!visibleOnline)}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    visibleOnline ? 'bg-deep-black' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={visibleOnline}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      visibleOnline ? 'translate-x-6 bg-gold' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-deep-black/10 text-[9px] font-black uppercase flex items-center justify-between">
                <span className="text-deep-black/60">Status na Loja Virtual:</span>
                <span className={visibleOnline ? 'text-green-700' : 'text-amber-700'}>
                  {visibleOnline ? '✓ VISÍVEL NA VITRINE' : '✕ NÃO APARECE NO SITE (OCULTO)'}
                </span>
              </div>
            </div>

            {/* Toggle PDV */}
            <div
              className={`p-4 border-2 transition-all ${
                visiblePos
                  ? 'border-deep-black bg-gold/5 shadow-xs'
                  : 'border-deep-black/20 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase tracking-wider text-deep-black block">
                    Mostrar no ponto de venda (PDV)
                  </span>
                  <p className="text-[10px] text-deep-black/70 leading-relaxed">
                    Disponível no sistema de caixa físico e no catálogo de vendas diretas das vendedoras.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setVisiblePos(!visiblePos)}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    visiblePos ? 'bg-deep-black' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={visiblePos}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      visiblePos ? 'translate-x-6 bg-gold' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-deep-black/10 text-[9px] font-black uppercase flex items-center justify-between">
                <span className="text-deep-black/60">Status no PDV:</span>
                <span className={visiblePos ? 'text-green-700' : 'text-amber-700'}>
                  {visiblePos ? '✓ ATIVO NO CAIXA' : '✕ INATIVO NO PDV'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-deep-black/5 text-[9.5px] text-deep-black/70 font-medium">
              💡 <strong>Padrão de Segurança:</strong> Produtos importados iniciam como ocultos. Você confere fotos e dados e ativa em 1 clique.
            </div>
          </div>

          {/* CARD LATERAL 2: ORGANIZAÇÃO (CATEGORIA, MARCA E TAGS) */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-deep-black/10 pb-3">
              <Tag className="w-4 h-4 text-gold" />
              <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
                Organização do Catálogo
              </h3>
            </div>

            {/* Tipo de Produto */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                Tipo de Produto
              </label>
              <div className="p-2 bg-gray-100 border border-deep-black/20 text-xs font-black uppercase text-deep-black flex items-center justify-between">
                <span>PRODUTO FÍSICO (PHYSICAL)</span>
                <span className="text-[8.5px] bg-deep-black text-white px-2 py-0.5">ESTOQUE</span>
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                Categoria Principal *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 border-2 border-deep-black font-black text-xs uppercase bg-white focus:outline-none focus:border-gold"
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
                className="w-full p-2.5 border-2 border-deep-black font-bold text-xs uppercase bg-white focus:outline-none focus:border-gold"
              >
                <option value="Alta Compressão">ALTA COMPRESSÃO</option>
                <option value="Cós Anatômico Duplo">CÓS ANATÔMICO DUPLO</option>
                <option value="Seamless Sculpt">SEAMLESS SCULPT (SEM COSTURA)</option>
                <option value="Costas Nadador">COSTAS NADADOR</option>
                <option value="Bojo Removível">BOJO REMOVÍVEL</option>
                <option value="Atelier Sob Medida">ATELIER SOB MEDIDA (PRE-ORDER)</option>
              </select>
            </div>

            {/* Marca (Brand) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                Marca (Brand)
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="ANA Fitness Wear"
                className="w-full p-2.5 border-2 border-deep-black font-bold text-xs uppercase focus:outline-none focus:border-gold"
              />
            </div>

            {/* Tags de Busca */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                Tags de Busca & Indexação
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 border-2 border-deep-black bg-white min-h-[36px]">
                {tags.map((tg) => (
                  <span
                    key={tg}
                    className="px-2 py-0.5 bg-deep-black text-white text-[9px] font-black uppercase flex items-center gap-1 shadow-xs"
                  >
                    <span>#{tg}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tg)}
                      className="text-gold hover:text-white transition"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+ Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 min-w-[70px] p-0.5 font-bold text-xs uppercase focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* CARD LATERAL 3: INVENTÁRIO GERAL & LOGÍSTICA */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-deep-black/10 pb-3">
              <Factory className="w-4 h-4 text-gold" />
              <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
                Inventário e Logística
              </h3>
            </div>

            {/* SKU Geral */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                SKU Geral do Produto (Product SKU)
              </label>
              <input
                type="text"
                placeholder="Ex: ANA-LEG-SCULPT"
                value={generalSku}
                onChange={(e) => setGeneralSku(e.target.value.toUpperCase())}
                className="w-full p-2.5 border-2 border-deep-black font-mono font-bold text-xs uppercase focus:outline-none focus:border-gold"
              />
            </div>

            {/* Fornecedor Vinculado */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                Fornecedor / Confecção Vinculada *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full p-2.5 border-2 border-deep-black font-bold text-xs uppercase bg-white focus:outline-none focus:border-gold"
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

            {/* Resumo de Estoque */}
            <div className="p-3 bg-gray-50 border border-deep-black/20 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-deep-black/60 font-bold uppercase text-[9.5px]">Estoque Total:</span>
                <span className="font-mono font-black text-deep-black">{totalCalculatedStock} PEÇAS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-deep-black/60 font-bold uppercase text-[9.5px]">Status Logístico:</span>
                <span className={`font-black uppercase text-[9px] ${totalCalculatedStock > 0 ? 'text-green-700' : 'text-gold'}`}>
                  {totalCalculatedStock > 0 ? '✓ PRONTA ENTREGA' : 'PRÉ-VENDA / ENCOMENDA'}
                </span>
              </div>
            </div>
          </div>

          {/* CARD LATERAL 4: BOTÃO FINAL DE SALVAR */}
          <div className="p-5 bg-deep-black text-white border-2 border-gold space-y-3 shadow-luxury">
            <span className="text-[9px] font-black uppercase tracking-widest text-gold block">
              SINCRONIZAÇÃO SUPABASE CLOUD
            </span>
            <p className="text-[11px] text-white/80 leading-relaxed">
              Ao salvar, o produto e todas as suas variações serão atualizados imediatamente nas tabelas 'products' e 'product_variants'.
            </p>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-gold hover:bg-white hover:text-deep-black text-deep-black font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 border border-gold disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-deep-black" />
                  <span>SALVANDO PRODUTO...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>SALVAR PRODUTO NO SUPABASE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL INTERATIVO: VINCULAR FOTO À VARIAÇÃO
         ========================================================================= */}
      {variantPhotoModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-2 border-deep-black max-w-xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-deep-black/10 pb-3">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gold block">
                  PERSONALIZAÇÃO POR COR E TAMANHO
                </span>
                <h3 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gold" />
                  <span>Vincular Foto à Variação</span>
                </h3>
                <p className="text-xs text-deep-black/70 font-bold uppercase pt-0.5">
                  Cor: <span className="text-gold">{variantPhotoModal.currentVariant.color}</span> • Tamanho: <span className="text-deep-black">{variantPhotoModal.currentVariant.size}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setVariantPhotoModal(null)}
                className="p-1 border border-deep-black/30 hover:bg-deep-black hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Foto Atualmente Vinculada */}
            <div className="p-3 bg-stone-50 border border-deep-black/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-16 border-2 border-deep-black overflow-hidden bg-white shrink-0">
                  {variantPhotoModal.currentVariant.image ? (
                    <img
                      src={variantPhotoModal.currentVariant.image}
                      alt="Foto Vinculada"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[7px] text-deep-black/40 font-bold text-center p-1">
                      CAPA PADRÃO
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-deep-black block">
                    {variantPhotoModal.currentVariant.image ? 'Foto Vinculada Atualmente' : 'Usando Foto Padrão da Capa'}
                  </span>
                  <span className="text-[9px] text-deep-black/60">
                    {variantPhotoModal.currentVariant.image
                      ? 'Esta é a imagem exibida quando a cliente selecionar esta cor.'
                      : 'Nenhuma foto exclusiva vinculada ainda.'}
                  </span>
                </div>
              </div>

              {variantPhotoModal.currentVariant.image && (
                <button
                  type="button"
                  onClick={() => {
                    handleBindPhotoToVariant(variantPhotoModal.variantIndex, '', false);
                    setVariantPhotoModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            currentVariant: {
                              ...prev.currentVariant,
                              image: '',
                            },
                          }
                        : null
                    );
                  }}
                  className="px-2.5 py-1.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white text-[9px] font-black uppercase transition shrink-0"
                >
                  Desvincular
                </button>
              )}
            </div>

            {/* Galeria de Fotos Disponíveis */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                Escolha uma foto da galeria do produto ({mediaList.length} disponíveis):
              </span>

              {mediaList.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-deep-black/30 text-center text-xs text-deep-black/60 font-bold uppercase">
                  Nenhuma foto carregada na galeria ainda. Faça upload abaixo.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1 border border-deep-black/15">
                  {mediaList.map((m, mIdx) => {
                    const isSelected = variantPhotoModal.currentVariant.image === m.url;
                    const isColorMatch =
                      m.associatedColor.toLowerCase() ===
                      variantPhotoModal.currentVariant.color.toLowerCase();

                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          handleBindPhotoToVariant(
                            variantPhotoModal.variantIndex,
                            m.url,
                            applyToAllSizesOfColor
                          );
                          setVariantPhotoModal((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  currentVariant: {
                                    ...prev.currentVariant,
                                    image: m.url,
                                  },
                                }
                              : null
                          );
                        }}
                        className={`aspect-[4/5] border-2 relative cursor-pointer group overflow-hidden transition ${
                          isSelected
                            ? 'border-gold ring-3 ring-gold/40 scale-[0.98]'
                            : 'border-deep-black/30 hover:border-deep-black'
                        }`}
                      >
                        <img src={m.url} alt={`Foto ${mIdx + 1}`} className="w-full h-full object-cover" />

                        {/* Badges */}
                        <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                          <span className="px-1 py-0.5 bg-deep-black/80 text-white text-[7.5px] font-black uppercase">
                            #{mIdx + 1}
                          </span>
                          {isColorMatch && (
                            <span className="px-1 py-0.5 bg-gold text-deep-black text-[7px] font-black uppercase">
                              Cor
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                            <span className="p-1 bg-deep-black text-gold rounded-full shadow">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upload de Nova Foto Exclusiva */}
            <div className="p-3 border-2 border-dashed border-deep-black/30 bg-stone-50 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                Ou envie uma nova foto do seu dispositivo para esta variação:
              </span>
              <input
                ref={variantFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadPhotoForVariant}
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploadingVariantPhoto}
                onClick={() => variantFileInputRef.current?.click()}
                className="w-full py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                {isUploadingVariantPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                    <span>Enviando foto para o Supabase Storage...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-gold" />
                    <span>+ Carregar Foto do Computador / Celular</span>
                  </>
                )}
              </button>
            </div>

            {/* Checkbox de Replicação Inteligente por Cor */}
            <div className="p-3 bg-gold/10 border border-gold/40">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToAllSizesOfColor}
                  onChange={(e) => setApplyToAllSizesOfColor(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-gold"
                />
                <div>
                  <span className="text-xs font-black uppercase tracking-wide text-deep-black block">
                    Aplicar esta mesma foto a todos os tamanhos da cor "{variantPhotoModal.currentVariant.color}"
                  </span>
                  <span className="text-[9.5px] text-deep-black/70">
                    Recomendado: Vinculará a foto a todas as variantes desta cor (ex: P, M, G) com 1 único clique.
                  </span>
                </div>
              </label>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-deep-black/10">
              <button
                type="button"
                onClick={() => setVariantPhotoModal(null)}
                className="px-5 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition font-bold"
              >
                Concluir e Salvar Vínculo
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
