'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Link2, Check, X, AlertTriangle, Sparkles, Trash2, EyeOff } from 'lucide-react';

interface GroupProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: any[];
  onSuccess: () => void;
}

export function GroupProductsModal({
  isOpen,
  onClose,
  selectedProducts,
  onSuccess,
}: GroupProductsModalProps) {
  const [masterId, setMasterId] = useState<string>('');
  const [unifiedTitle, setUnifiedTitle] = useState<string>('');
  const [actionForSecondaries, setActionForSecondaries] = useState<'hide' | 'delete'>('hide');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedProducts && selectedProducts.length > 0) {
      const first = selectedProducts[0];
      setMasterId(first.id);
      // Sugere um título limpo removendo cores específicas (ex: "MACACÃO SUPLEX BLUE" -> "MACACÃO SUPLEX")
      const cleanTitle = (first.title || '')
        .replace(/\s*\(CÓPIA\)/gi, '')
        .replace(/\s*-\s*copia\s*[a-z0-9]*/gi, '')
        .replace(/\s*(blue|black|red|lilac|pink|green|terracotta|marsala|chocolate|amarelo|verde|vermelho|preto|azul|rosa)\b/gi, '')
        .trim();
      setUnifiedTitle(cleanTitle || first.title || '');
    }
  }, [selectedProducts]);

  if (!isOpen || !selectedProducts || selectedProducts.length < 2) return null;

  // Extrai todas as cores de todos os produtos selecionados
  const previewColors: Array<{ name: string; hex: string }> = [];
  const seenColorNames = new Set<string>();

  selectedProducts.forEach((p) => {
    const pColors = p.colors || (p.colorName ? [{ name: p.colorName, hex: p.colorHex || '#0A0A0A' }] : []);
    pColors.forEach((c: any) => {
      const name = typeof c === 'string' ? c : c.name || '';
      const hex = typeof c === 'object' && c.hex ? c.hex : '#0A0A0A';
      if (name && !seenColorNames.has(name.toLowerCase())) {
        seenColorNames.add(name.toLowerCase());
        previewColors.push({ name, hex });
      }
    });
  });

  const handleExecuteGroup = async () => {
    if (!masterId) {
      setErrorMsg('Por favor, selecione qual produto será o principal.');
      return;
    }
    if (!unifiedTitle.trim()) {
      setErrorMsg('Por favor, defina o nome do produto unificado.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/backoffice/products/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterProductId: masterId,
          selectedProductIds: selectedProducts.map((p) => p.id),
          newTitle: unifiedTitle.trim(),
          actionForSecondaries,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao agrupar produtos.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao agrupar produtos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white border-2 border-deep-black max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
                AGRUPAR PRODUTOS EM UM SÓ ({selectedProducts.length} ITENS)
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Unifique produtos avulsos em variações de cores e fotos de uma única peça no catálogo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-black font-bold p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Escolha do Produto Principal */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-gray-900 block">
            1. SELECIONE QUAL SERÁ O PRODUTO PRINCIPAL (MASTER):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto border border-gray-200 p-2 rounded bg-gray-50/50">
            {selectedProducts.map((p) => {
              const isSelected = p.id === masterId;
              const img = p.primary_image || p.primaryImage || p.images?.[0] || '';
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setMasterId(p.id);
                    if (!unifiedTitle || unifiedTitle === selectedProducts.find(sp => sp.id === masterId)?.title) {
                      setUnifiedTitle(p.title);
                    }
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                    {img ? (
                      <img src={img} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">
                        SEM FOTO
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{p.title}</p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      {p.colorName || (p.colors?.[0]?.name ? p.colors[0].name : 'Cor padrão')} • ${Number(p.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Nome do Produto Unificado */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-gray-900 block">
            2. NOME DA PEÇA UNIFICADA NA LOJA:
          </label>
          <input
            type="text"
            value={unifiedTitle}
            onChange={(e) => setUnifiedTitle(e.target.value)}
            placeholder="Ex: MACACÃO FITNESS SUPLEX MODELADOR"
            className="w-full px-3.5 py-2.5 text-xs font-bold border border-gray-300 focus:outline-none focus:border-indigo-600 rounded bg-white shadow-xs"
          />
        </div>

        {/* 3. Preview das Variações de Cores Consolidadas */}
        <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-700">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>CORES QUE SERÃO INTEGRADAS ({previewColors.length})</span>
            </span>
            <span className="text-gray-400 font-normal">Todas as fotos serão unificadas</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {previewColors.map((c, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-800 shadow-2xs"
              >
                <span
                  className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                  style={{ backgroundColor: c.hex }}
                />
                <span>{c.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 4. O que fazer com os produtos secundários */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-gray-900 block">
            4. O QUE FAZER COM OS PRODUTOS INDIVIDUAIS APÓS AGRUPAR?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label
              className={`flex items-start gap-2.5 p-3 rounded border cursor-pointer transition ${
                actionForSecondaries === 'hide'
                  ? 'border-indigo-600 bg-indigo-50/50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="actionSecondaries"
                checked={actionForSecondaries === 'hide'}
                onChange={() => setActionForSecondaries('hide')}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-bold text-gray-900 flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ocultar do site (Recomendado)</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Some os cards repetidos da vitrine, mas preserva os cadastros no histórico.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 p-3 rounded border cursor-pointer transition ${
                actionForSecondaries === 'delete'
                  ? 'border-red-600 bg-red-50/50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="actionSecondaries"
                checked={actionForSecondaries === 'delete'}
                onChange={() => setActionForSecondaries('delete')}
                className="mt-0.5 text-red-600 focus:ring-red-500"
              />
              <div>
                <p className="font-bold text-gray-900 flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Excluir do catálogo</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Remove permanentemente os produtos avulsos, mantendo apenas o unificado.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black border border-gray-300 rounded hover:bg-gray-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExecuteGroup}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded shadow transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Agrupando produtos...</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span>Confirmar e Agrupar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default GroupProductsModal;
