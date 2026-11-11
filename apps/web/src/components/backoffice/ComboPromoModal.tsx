'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  Plus,
  Trash2,
} from 'lucide-react';

interface ComboPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  comboPromo: any;
  onSave: (updated: any) => Promise<void>;
  products: any[];
}

export function ComboPromoModal({
  isOpen,
  onClose,
  comboPromo,
  onSave,
  products,
}: ComboPromoModalProps) {
  if (!isOpen) return null;

  const [active, setActive] = useState(comboPromo?.active ?? true);
  const [title, setTitle] = useState(comboPromo?.title || 'Promoção Especial de Combo');
  const [requiredQty, setRequiredQty] = useState<number>(comboPromo?.required_quantity || 3);
  const [bundlePrice, setBundlePrice] = useState<number>(comboPromo?.bundle_price || 99.0);
  const [badgeText, setBadgeText] = useState(comboPromo?.badge_text || 'COMBO 3 PEÇAS');
  const [description, setDescription] = useState(
    comboPromo?.description || 'Selecione quaisquer 3 conjuntos participantes e feche o combo pelo valor promocional configurado!'
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    Array.isArray(comboPromo?.product_ids) ? comboPromo.product_ids : []
  );

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ONLY_PARTICIPATING' | 'SETS'>('ALL');
  const [saving, setSaving] = useState(false);

  const setIds = new Set(selectedProductIds.map((id) => String(id).toLowerCase()));

  // Identifica todos os conjuntos
  const isSet = (p: any) =>
    (p.title || '').toUpperCase().includes('SET') || (p.title || '').toUpperCase().includes('CONJUNTO');

  // Filtra produtos na lista de seleção
  const displayedProducts = products.filter((p: any) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = (p.title || '').toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterMode === 'ONLY_PARTICIPATING') {
      return setIds.has(String(p.id).toLowerCase());
    }
    if (filterMode === 'SETS') {
      return isSet(p);
    }
    return true;
  });

  const handleToggleProduct = (id: string) => {
    const idStr = String(id).toLowerCase();
    if (setIds.has(idStr)) {
      setSelectedProductIds((prev) => prev.filter((x) => String(x).toLowerCase() !== idStr));
    } else {
      setSelectedProductIds((prev) => [...prev, id]);
    }
  };

  const handleSelectAllSets = () => {
    const setProducts = products.filter(isSet);
    const newIds = Array.from(new Set([...selectedProductIds, ...setProducts.map((p) => p.id)]));
    setSelectedProductIds(newIds);
  };

  const handleClearAll = () => {
    setSelectedProductIds([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedProds = products.filter((p) =>
        selectedProductIds.some((id) => String(id).toLowerCase() === String(p.id).toLowerCase())
      );
      const updatedConfig = {
        active,
        title: title.trim() || 'Promoção Especial de Combo',
        required_quantity: Number(requiredQty) || 3,
        bundle_price: Number(bundlePrice) || 99.0,
        badge_text: badgeText.trim() || 'COMBO 3 PEÇAS',
        description: description.trim(),
        product_ids: selectedProductIds,
        product_slugs: selectedProds.map((p) => p.slug).filter(Boolean),
      };
      await onSave(updatedConfig);
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar configuração: ' + err?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border-2 border-deep-black max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-5 bg-deep-black text-white border-b-2 border-gold flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold text-deep-black flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                CONFIGURADOR DE PROMOÇÃO DE COMBO (3 POR $X)
              </h3>
              <p className="text-[11px] text-white/70 uppercase">
                Configure a quantidade, o valor fechado e quais produtos participam da promoção
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl font-bold p-1 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Corpo com Scroll */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card de Status da Promoção */}
          <div className="p-4 bg-stone-50 border-2 border-deep-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/60 font-mono">
                STATUS DA PROMOÇÃO NA LOJA
              </span>
              <p className="text-sm font-black uppercase text-deep-black flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span>{active ? 'PROMOÇÃO ATIVA (DESCONTO APLICADO NO CHECKOUT)' : 'PROMOÇÃO PAUSADA / DESATIVADA'}</span>
              </p>
              <p className="text-[11px] text-deep-black/70">
                {active
                  ? 'Quando o cliente tiver 3 produtos participantes na sacola, o valor fechará automaticamente no preço promocional.'
                  : 'Nenhum desconto de combo será aplicado enquanto a promoção estiver pausada.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition border-2 border-deep-black cursor-pointer shadow-xs ${
                active
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-neutral-200 hover:bg-neutral-300 text-deep-black'
              }`}
            >
              {active ? '✓ PROMOÇÃO ATIVA (CLIQUE P/ PAUSAR)' : 'PAUSADA (CLIQUE P/ ATIVAR)'}
            </button>
          </div>

          {/* Configuração dos Parâmetros Financeiros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/80 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-gold" />
                <span>QUANTIDADE NECESSÁRIA:</span>
              </label>
              <input
                type="number"
                min={2}
                max={10}
                required
                value={requiredQty}
                onChange={(e) => setRequiredQty(Number(e.target.value) || 3)}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-black border border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
              />
              <span className="text-[10px] text-deep-black/50 block">Ex: 3 (Compre 3 peças)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/80 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>VALOR FECHADO DO COMBO ($ USD):</span>
              </label>
              <input
                type="number"
                step="0.01"
                min={1}
                required
                value={bundlePrice}
                onChange={(e) => setBundlePrice(Number(e.target.value) || 99.0)}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-black border border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
              />
              <span className="text-[10px] text-deep-black/50 block">Ex: 99.00 (Os 3 fecham por $99)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/80">
                TEXTO DO SELO / BADGE:
              </label>
              <input
                type="text"
                required
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="COMBO 3 PEÇAS"
                className="w-full px-3.5 py-2.5 text-xs font-black uppercase tracking-wider border border-deep-black/30 focus:outline-none focus:border-deep-black bg-white font-mono"
              />
              <span className="text-[10px] text-deep-black/50 block">Selo exibido nos produtos</span>
            </div>
          </div>

          {/* Título e Descrição */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/80">
                TÍTULO DA PROMOÇÃO (CLIENTE):
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-black uppercase tracking-wider border border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/80">
                DESCRITIVO DA PROMOÇÃO:
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider border border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
              />
            </div>
          </div>

          {/* Resumo Dinâmico da Regra */}
          <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
            <p className="font-black uppercase flex items-center gap-1.5 text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
              <span>REGRA ATIVA NO CHECKOUT:</span>
            </p>
            <p className="text-[11px] font-medium leading-relaxed">
              • Ao comprar <strong>{requiredQty} peças participantes</strong>, o cliente pagará exatamente <strong>${bundlePrice.toFixed(2)}</strong> no total.
              <br />
              • Se comprar <strong>1 ou 2 peças</strong>, nenhuma promoção é aplicada e o cliente paga o <strong>valor normal de cada peça</strong>.
            </p>
          </div>

          {/* Seletor de Produtos Participantes */}
          <div className="space-y-3 pt-2 border-t-2 border-deep-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                  <span>PRODUTOS PARTICIPANTES DA PROMOÇÃO</span>
                  <span className="px-2 py-0.5 bg-gold text-deep-black font-mono text-[10px] font-black">
                    {selectedProductIds.length} PRODUTO(S)
                  </span>
                </h4>
                <p className="text-[10px] text-deep-black/60 uppercase">
                  Marque abaixo as peças que participarão do combo de {requiredQty} por ${bundlePrice.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectAllSets}
                  className="px-3 py-1.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-gold" />
                  <span>INCLUIR TODOS OS CONJUNTOS ({products.filter(isSet).length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 border border-deep-black/30 hover:bg-red-50 hover:text-red-700 text-[10px] font-bold uppercase transition cursor-pointer"
                >
                  LIMPAR TODOS
                </button>
              </div>
            </div>

            {/* Filtros da Lista de Produtos */}
            <div className="flex items-center gap-2 flex-wrap bg-stone-100 p-2.5 border border-deep-black/15">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-deep-black/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="FILTRAR POR NOME OU SKU..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs uppercase border border-deep-black/20 focus:outline-none focus:border-deep-black bg-white"
                />
              </div>

              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase transition border ${
                  filterMode === 'ALL' ? 'bg-deep-black text-white' : 'bg-white text-deep-black hover:bg-stone-200'
                }`}
              >
                TODOS ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ONLY_PARTICIPATING')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase transition border ${
                  filterMode === 'ONLY_PARTICIPATING'
                    ? 'bg-amber-500 text-deep-black border-deep-black'
                    : 'bg-white text-deep-black hover:bg-stone-200'
                }`}
              >
                PARTICIPANTES ({selectedProductIds.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('SETS')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase transition border ${
                  filterMode === 'SETS' ? 'bg-deep-black text-white' : 'bg-white text-deep-black hover:bg-stone-200'
                }`}
              >
                APENAS CONJUNTOS ({products.filter(isSet).length})
              </button>
            </div>

            {/* Grid dos Produtos com Checkbox */}
            <div className="max-h-[320px] overflow-y-auto border border-deep-black/20 divide-y divide-deep-black/10 bg-white">
              {displayedProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-deep-black/50 uppercase font-bold">
                  Nenhum produto encontrado com este filtro.
                </div>
              ) : (
                displayedProducts.map((p) => {
                  const isChecked = setIds.has(String(p.id).toLowerCase());
                  const img =
                    p.primary_image ||
                    p.primaryImage ||
                    p.variants?.[0]?.image ||
                    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleToggleProduct(p.id)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                        isChecked ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-deep-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleProduct(p.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 accent-gold cursor-pointer"
                        />
                        <img
                          src={img}
                          alt={p.title}
                          className="w-10 h-12 object-cover border border-deep-black/20 shrink-0"
                        />
                        <div className="space-y-0.5">
                          <p className="text-xs font-black uppercase text-deep-black line-clamp-1">
                            {p.title}
                          </p>
                          <p className="text-[10px] text-deep-black/60 font-mono">
                            SKU: {p.sku || p.slug || 'ANA-ITEM'} • Preço individual: ${(Number(p.price) || 39.9).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isChecked ? (
                          <span className="px-2 py-0.5 bg-amber-500 text-deep-black text-[9px] font-black uppercase border border-deep-black flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>NO COMBO</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-deep-black/40 uppercase font-bold">
                            NÃO PARTICIPA
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Botões de Ação do Rodapé do Modal */}
          <div className="pt-4 border-t-2 border-deep-black flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-deep-black/30 hover:bg-gray-100 text-xs font-black uppercase tracking-wider text-deep-black transition cursor-pointer"
            >
              FECHAR
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-luxury cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-gold" />
              <span>{saving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÃO DA PROMOÇÃO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
