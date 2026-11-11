'use client';

import React from 'react';
import { DollarSign, Ruler, FileText, Check, X } from 'lucide-react';

interface BulkPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  bulkPriceInput: string;
  setBulkPriceInput: (v: string) => void;
  bulkComparePriceInput: string;
  setBulkComparePriceInput: (v: string) => void;
  bulkCostPriceInput?: string;
  setBulkCostPriceInput?: (v: string) => void;
  onExecute: () => Promise<void>;
  isSubmitting: boolean;
}

export function BulkPriceModal({
  isOpen,
  onClose,
  selectedCount,
  bulkPriceInput,
  setBulkPriceInput,
  bulkComparePriceInput,
  setBulkComparePriceInput,
  bulkCostPriceInput = '',
  setBulkCostPriceInput,
  onExecute,
  isSubmitting,
}: BulkPriceModalProps) {
  if (!isOpen) return null;

  const hasAnyValue = Boolean(bulkPriceInput || bulkComparePriceInput || bulkCostPriceInput);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border-2 border-deep-black max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
              MUDAR PREÇO / CUSTO ({selectedCount} PRODUTOS)
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-deep-black/60 hover:text-deep-black font-bold">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-black uppercase tracking-wider text-deep-black block">
              NOVO PREÇO DE VENDA ($ USD):
            </label>
            <input
              type="number"
              step="0.01"
              autoFocus
              value={bulkPriceInput}
              onChange={(e) => setBulkPriceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && hasAnyValue && !isSubmitting) {
                  e.preventDefault();
                  onExecute();
                }
              }}
              placeholder="Deixe vazio se não quiser alterar venda"
              className="w-full px-3.5 py-2.5 text-sm font-mono font-bold border border-deep-black/30 focus:outline-none focus:border-deep-black"
            />
          </div>

          <div className="space-y-1">
            <label className="font-black uppercase tracking-wider text-deep-black block">
              PREÇO ORIGINAL / DE: (OPCIONAL):
            </label>
            <input
              type="number"
              step="0.01"
              value={bulkComparePriceInput}
              onChange={(e) => setBulkComparePriceInput(e.target.value)}
              placeholder="Ex: 59.90"
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-deep-black/30 focus:outline-none focus:border-deep-black"
            />
            <span className="text-[10px] text-deep-black/50 block">Exibe riscado (De: $59.90 Por: $39.90)</span>
          </div>

          {setBulkCostPriceInput && (
            <div className="space-y-1 bg-amber-50 p-3 border border-amber-400">
              <label className="font-black uppercase tracking-wider text-amber-950 block">
                ★ PREÇO DE CUSTO / CONFECÇÃO ($ USD) (OPCIONAL):
              </label>
              <input
                type="number"
                step="0.01"
                value={bulkCostPriceInput}
                onChange={(e) => setBulkCostPriceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && hasAnyValue && !isSubmitting) {
                    e.preventDefault();
                    onExecute();
                  }
                }}
                placeholder="Ex: 12.00"
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold border border-amber-500 bg-white focus:outline-none focus:border-deep-black"
              />
              <span className="text-[10px] text-amber-900 block">Atualiza o custo unitário em todas as peças selecionadas.</span>
            </div>
          )}
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-deep-black/30 text-xs font-black uppercase tracking-wider hover:bg-gray-100 transition cursor-pointer"
          >
            CANCELAR
          </button>
          <button
            type="button"
            disabled={isSubmitting || !hasAnyValue}
            onClick={onExecute}
            className="flex-2 py-3 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-luxury cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-gold" />
            <span>{isSubmitting ? 'ATUALIZANDO...' : 'APLICAR ALTERAÇÕES'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface BulkSizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  bulkSizeGuideInput: string;
  setBulkSizeGuideInput: (v: string) => void;
  onExecute: () => Promise<void>;
  isSubmitting: boolean;
}

export function BulkSizeGuideModal({
  isOpen,
  onClose,
  selectedCount,
  bulkSizeGuideInput,
  setBulkSizeGuideInput,
  onExecute,
  isSubmitting,
}: BulkSizeGuideModalProps) {
  if (!isOpen) return null;

  const defaultTemplate = `TABELA DE MEDIDAS OFICIAL ANA FITNESS WEAR (EUA):
• P (S): Veste 2 a 4 (Busto: 32-34", Cintura: 24-26", Quadril: 34-36")
• M (M): Veste 6 a 8 (Busto: 35-37", Cintura: 27-29", Quadril: 37-39")
• G (L): Veste 10 a 12 (Busto: 38-40", Cintura: 30-32", Quadril: 40-42")
• GG (XL): Veste 14 a 16 (Busto: 41-43", Cintura: 33-35", Quadril: 43-45")
• Tamanho Único (One Size): Alta compressão inteligente, veste com perfeição do 2 ao 10`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border-2 border-deep-black max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-gold" />
            <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
              ADICIONAR TABELA DE MEDIDAS ({selectedCount} PRODUTOS)
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-deep-black/60 hover:text-deep-black font-bold">
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-black uppercase tracking-wider text-deep-black">
              GUIA DE MEDIDAS PARA OS CLIENTES:
            </label>
            <button
              type="button"
              onClick={() => setBulkSizeGuideInput(defaultTemplate)}
              className="text-[10px] font-black uppercase text-gold underline hover:text-black cursor-pointer"
            >
              USAR MODELO PADRÃO
            </button>
          </div>

          <textarea
            rows={7}
            value={bulkSizeGuideInput}
            onChange={(e) => setBulkSizeGuideInput(e.target.value)}
            placeholder="Digite ou cole aqui a tabela de medidas..."
            className="w-full p-3 font-mono text-xs border border-deep-black/30 focus:outline-none focus:border-deep-black"
          />
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-deep-black/30 text-xs font-black uppercase tracking-wider hover:bg-gray-100 transition cursor-pointer"
          >
            CANCELAR
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onExecute}
            className="flex-2 py-3 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-luxury cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-gold" />
            <span>{isSubmitting ? 'SALVANDO...' : 'APLICAR MEDIDAS'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface BulkDescModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  bulkDescInput: string;
  setBulkDescInput: (v: string) => void;
  bulkDescEnInput: string;
  setBulkDescEnInput: (v: string) => void;
  bulkDescMode: 'replace' | 'prepend' | 'append';
  setBulkDescMode: (m: 'replace' | 'prepend' | 'append') => void;
  onExecute: () => Promise<void>;
  isSubmitting: boolean;
}

export function BulkDescModal({
  isOpen,
  onClose,
  selectedCount,
  bulkDescInput,
  setBulkDescInput,
  bulkDescEnInput,
  setBulkDescEnInput,
  bulkDescMode,
  setBulkDescMode,
  onExecute,
  isSubmitting,
}: BulkDescModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border-2 border-deep-black max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
              MUDAR DESCRIÇÃO EM MASSA ({selectedCount} PRODUTOS)
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-deep-black/60 hover:text-deep-black font-bold">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-black uppercase tracking-wider text-deep-black block">
              MODO DE APLICAÇÃO DA DESCRIÇÃO:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBulkDescMode('replace')}
                className={`py-2 text-[10px] font-black uppercase border transition cursor-pointer ${
                  bulkDescMode === 'replace'
                    ? 'bg-deep-black text-white border-deep-black'
                    : 'bg-white text-deep-black border-deep-black/30'
                }`}
              >
                SUBSTITUIR TUDO
              </button>
              <button
                type="button"
                onClick={() => setBulkDescMode('append')}
                className={`py-2 text-[10px] font-black uppercase border transition cursor-pointer ${
                  bulkDescMode === 'append'
                    ? 'bg-deep-black text-white border-deep-black'
                    : 'bg-white text-deep-black border-deep-black/30'
                }`}
              >
                ANEXAR NO FIM
              </button>
              <button
                type="button"
                onClick={() => setBulkDescMode('prepend')}
                className={`py-2 text-[10px] font-black uppercase border transition cursor-pointer ${
                  bulkDescMode === 'prepend'
                    ? 'bg-deep-black text-white border-deep-black'
                    : 'bg-white text-deep-black border-deep-black/30'
                }`}
              >
                INSERIR NO INÍCIO
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-black uppercase tracking-wider text-deep-black block">
              TEXTO DA DESCRIÇÃO (PORTUGUÊS):
            </label>
            <textarea
              rows={4}
              value={bulkDescInput}
              onChange={(e) => setBulkDescInput(e.target.value)}
              placeholder="Digite o texto da descrição a ser aplicado..."
              className="w-full p-3 text-xs border border-deep-black/30 focus:outline-none focus:border-deep-black"
            />
          </div>

          <div className="space-y-1">
            <label className="font-black uppercase tracking-wider text-deep-black block">
              TEXTO DA DESCRIÇÃO (INGLÊS - OPCIONAL):
            </label>
            <textarea
              rows={3}
              value={bulkDescEnInput}
              onChange={(e) => setBulkDescEnInput(e.target.value)}
              placeholder="English description..."
              className="w-full p-3 text-xs border border-deep-black/30 focus:outline-none focus:border-deep-black"
            />
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-deep-black/30 text-xs font-black uppercase tracking-wider hover:bg-gray-100 transition cursor-pointer"
          >
            CANCELAR
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onExecute}
            className="flex-2 py-3 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-luxury cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-gold" />
            <span>{isSubmitting ? 'APLICANDO...' : 'APLICAR DESCRIÇÃO'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
