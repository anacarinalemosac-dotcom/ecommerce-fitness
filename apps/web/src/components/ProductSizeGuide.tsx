'use client';

import React, { useState } from 'react';
import {
  Ruler,
  Check,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Phone,
  X,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useStoreSettings } from '../context/StoreSettingsContext';

export interface SizeItem {
  key: 'P' | 'M' | 'G' | 'GG';
  usKey: 'S' | 'M' | 'L' | 'XL';
  labelPt: string;
  labelEn: string;
  brNumber: string;
  usNumber: string;
  cm: {
    bust: string;
    waist: string;
    hip: string;
  };
  in: {
    bust: string;
    waist: string;
    hip: string;
  };
  weightPt: string;
  weightEn: string;
  heightPt: string;
  heightEn: string;
  fitPt: string;
  fitEn: string;
  taglinePt: string;
  taglineEn: string;
}

export const OFFICIAL_SIZE_GUIDE: SizeItem[] = [
  {
    key: 'P',
    usKey: 'S',
    labelPt: 'TAMANHO P',
    labelEn: 'SIZE S (SMALL)',
    brNumber: '36 - 38',
    usNumber: 'US 2 - 4',
    cm: {
      bust: '82 - 88 cm',
      waist: '64 - 70 cm',
      hip: '90 - 96 cm',
    },
    in: {
      bust: '32 - 34 pol.',
      waist: '25 - 27 pol.',
      hip: '35 - 37 pol.',
    },
    weightPt: '48 a 56 kg',
    weightEn: '105 - 125 lbs',
    heightPt: '1,50 m a 1,65 m',
    heightEn: "4'11\" - 5'5\"",
    fitPt: 'Caimento ajustado e anatômico. Modela o busto e a cintura com sustentação premium sem apertar.',
    fitEn: 'Snug & sculpted fit. Enhances bust and waistline with premium compression without digging in.',
    taglinePt: 'IDEAL PARA QUEM VESTE 36 OU 38 NO BRASIL',
    taglineEn: 'PERFECT FOR US SIZES 2 TO 4',
  },
  {
    key: 'M',
    usKey: 'M',
    labelPt: 'TAMANHO M',
    labelEn: 'SIZE M (MEDIUM)',
    brNumber: '40 - 42',
    usNumber: 'US 6 - 8',
    cm: {
      bust: '89 - 95 cm',
      waist: '71 - 77 cm',
      hip: '97 - 104 cm',
    },
    in: {
      bust: '35 - 37 pol.',
      waist: '28 - 30 pol.',
      hip: '38 - 40 pol.',
    },
    weightPt: '57 a 66 kg',
    weightEn: '126 - 145 lbs',
    heightPt: '1,58 m a 1,72 m',
    heightEn: "5'2\" - 5'8\"",
    fitPt: 'Equilíbrio ideal entre elasticidade e compressão. Zero transparência (squat-proof) e liberdade total de movimento.',
    fitEn: 'Optimal balance of stretch and muscle support. 100% squat-proof opacity and complete mobility.',
    taglinePt: 'IDEAL PARA QUEM VESTE 40 OU 42 NO BRASIL',
    taglineEn: 'PERFECT FOR US SIZES 6 TO 8',
  },
  {
    key: 'G',
    usKey: 'L',
    labelPt: 'TAMANHO G',
    labelEn: 'SIZE L (LARGE)',
    brNumber: '44',
    usNumber: 'US 10 - 12',
    cm: {
      bust: '96 - 103 cm',
      waist: '78 - 85 cm',
      hip: '105 - 112 cm',
    },
    in: {
      bust: '38 - 40 pol.',
      waist: '31 - 33 pol.',
      hip: '41 - 43 pol.',
    },
    weightPt: '67 a 78 kg',
    weightEn: '146 - 170 lbs',
    heightPt: '1,62 m a 1,78 m',
    heightEn: "5'4\" - 5'10\"",
    fitPt: 'Cós alto anatômico que não enrola na cintura e modela os glúteos com conforto absoluto.',
    fitEn: 'Stay-put reinforced high waistband that does not roll down and beautifully sculpts the silhouette.',
    taglinePt: 'IDEAL PARA QUEM VESTE 44 NO BRASIL',
    taglineEn: 'PERFECT FOR US SIZES 10 TO 12',
  },
  {
    key: 'GG',
    usKey: 'XL',
    labelPt: 'TAMANHO GG',
    labelEn: 'SIZE XL (EXTRA LARGE)',
    brNumber: '46 - 48',
    usNumber: 'US 14 - 16',
    cm: {
      bust: '104 - 112 cm',
      waist: '86 - 94 cm',
      hip: '113 - 122 cm',
    },
    in: {
      bust: '41 - 44 pol.',
      waist: '34 - 37 pol.',
      hip: '44 - 47 pol.',
    },
    weightPt: '79 a 92 kg',
    weightEn: '171 - 200 lbs',
    heightPt: '1,64 m a 1,80 m',
    heightEn: "5'5\" - 5'11\"",
    fitPt: 'Compressão inteligente que abraça as curvas com elegância e alta sustentação em treinos intensos.',
    fitEn: 'Smart shaping compression that contours curves gracefully with superior high-impact support.',
    taglinePt: 'IDEAL PARA QUEM VESTE 46 OU 48 NO BRASIL',
    taglineEn: 'PERFECT FOR US SIZES 14 TO 16',
  },
];

interface ProductSizeGuideProps {
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
  availableSizes?: string[];
  variants?: any[];
  selectedColor?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export function ProductSizeGuide({
  selectedSize,
  onSelectSize,
  availableSizes = [],
  variants = [],
  selectedColor = '',
  isModal = false,
  onClose,
}: ProductSizeGuideProps) {
  const { lang } = useLanguage();
  const { siteInfo } = useStoreSettings();
  const [filterSize, setFilterSize] = useState<'ALL' | 'P' | 'M' | 'G' | 'GG'>('ALL');
  const [unit, setUnit] = useState<'CM' | 'IN'>('CM');

  const filteredItems = filterSize === 'ALL'
    ? OFFICIAL_SIZE_GUIDE
    : OFFICIAL_SIZE_GUIDE.filter((item) => item.key === filterSize);

  // Helper para verificar estoque na variante atual
  const checkStockForSize = (key: string) => {
    if (!variants || variants.length === 0) return null;
    const match = variants.find((v) => {
      const vSize = (v.size || '').toUpperCase();
      const vColor = (v.color || '').toLowerCase();
      const targetSize = key.toUpperCase();
      const isSizeMatch = vSize === targetSize || (targetSize === 'P' && vSize === 'S') || (targetSize === 'G' && vSize === 'L') || (targetSize === 'GG' && vSize === 'XL');
      const isColorMatch = !selectedColor || vColor === selectedColor.toLowerCase();
      return isSizeMatch && isColorMatch;
    });
    if (!match) return null;
    return Number(match.stock || 0);
  };

  const handlePickSize = (sizeKey: string) => {
    if (onSelectSize) {
      // Se a lista de tamanhos do produto usa 'S', 'M', 'L', 'XL', mapeia
      const hasUS = availableSizes.some((s) => ['S', 'L', 'XL'].includes(s.toUpperCase()));
      let mapped = sizeKey;
      if (hasUS) {
        if (sizeKey === 'P') mapped = 'S';
        if (sizeKey === 'G') mapped = 'L';
        if (sizeKey === 'GG') mapped = 'XL';
      }
      onSelectSize(mapped);
    }
    if (isModal && onClose) {
      onClose();
    }
  };

  const cleanWhatsapp = (siteInfo.whatsapp || siteInfo.phone || '19783139452').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
    lang === 'pt'
      ? 'Olá! Gostaria de ajuda para escolher o tamanho ideal na Ana Fitness Wear.'
      : 'Hello! I need assistance choosing the best size at Ana Fitness Wear.'
  )}`;

  const content = (
    <div className="space-y-8 text-deep-black">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-deep-black/10 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-gold text-deep-black text-[10px] font-black uppercase tracking-widest">
              ATELIER OFICIAL
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-deep-black/60">
              GRADE SEPARADA P • M • G • GG
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-deep-black">
            {lang === 'pt' ? 'TABELA DE MEDIDAS & CAIMENTO IDEAL' : 'SIZE & MEASUREMENTS GUIDE'}
          </h3>
          <p className="text-xs text-deep-black/70 font-medium uppercase tracking-wide max-w-2xl">
            {lang === 'pt'
              ? 'Consulte as medidas detalhadas de cada tamanho para encontrar o caimento perfeito no seu corpo. Nossas peças têm alta elasticidade e compressão de alta performance.'
              : 'Detailed measurements for each size to help you find your flawless fit. High elasticity fabric engineered for supportive compression.'}
          </p>
        </div>

        {/* Alternador de Unidade: Centímetros / Polegadas */}
        <div className="flex items-center gap-1 bg-deep-black/5 p-1 border border-deep-black/20 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setUnit('CM')}
            className={`px-3 py-1.5 text-[11px] font-black tracking-wider transition uppercase cursor-pointer ${
              unit === 'CM'
                ? 'bg-deep-black text-gold shadow-xs'
                : 'text-deep-black/60 hover:text-deep-black'
            }`}
          >
            CENTÍMETROS (CM)
          </button>
          <button
            type="button"
            onClick={() => setUnit('IN')}
            className={`px-3 py-1.5 text-[11px] font-black tracking-wider transition uppercase cursor-pointer ${
              unit === 'IN'
                ? 'bg-deep-black text-gold shadow-xs'
                : 'text-deep-black/60 hover:text-deep-black'
            }`}
          >
            POLEGADAS (INCHES)
          </button>
        </div>
      </div>

      {/* Barra de Filtro Rápido por Tamanho Separado */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/70">
            {lang === 'pt' ? 'VISUALIZAR TAMANHO SEPARADO:' : 'FILTER BY SIZE:'}
          </span>
          <span className="text-[10px] font-bold text-gold uppercase tracking-wider">
            {filterSize === 'ALL' ? (lang === 'pt' ? 'MOSTRANDO TODOS' : 'SHOWING ALL') : `FOCADO NO TAMANHO ${filterSize}`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {(['ALL', 'P', 'M', 'G', 'GG'] as const).map((sz) => {
            const isActive = filterSize === sz;
            return (
              <button
                key={sz}
                type="button"
                onClick={() => setFilterSize(sz)}
                className={`py-2.5 px-2 text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isActive
                    ? 'border-deep-black bg-deep-black text-gold shadow-sm'
                    : 'border-deep-black/20 bg-white hover:border-gold text-deep-black'
                }`}
              >
                <span>{sz === 'ALL' ? (lang === 'pt' ? 'TODOS' : 'ALL') : sz}</span>
                {sz !== 'ALL' && (
                  <span className={`text-[8.5px] font-medium tracking-tight ${isActive ? 'text-white/80' : 'text-deep-black/50'}`}>
                    {sz === 'P' ? '36-38' : sz === 'M' ? '40-42' : sz === 'G' ? '44' : '46-48'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* BLOCOS / CARDS SEPARADOS: P, M, G, GG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredItems.map((item) => {
          const isSelected = selectedSize && (
            selectedSize.toUpperCase() === item.key ||
            selectedSize.toUpperCase() === item.usKey
          );
          const stock = checkStockForSize(item.key);
          const hasStock = stock !== null && stock > 0;

          return (
            <div
              key={item.key}
              className={`border-2 p-6 transition-all relative flex flex-col justify-between space-y-5 bg-white ${
                isSelected
                  ? 'border-deep-black ring-2 ring-gold shadow-md'
                  : 'border-deep-black/20 hover:border-deep-black/60 shadow-xs'
              }`}
            >
              {/* Topo do Card com Badge Grande do Tamanho */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-deep-black text-white flex flex-col items-center justify-center border-2 border-gold shadow-xs shrink-0">
                      <span className="text-2xl font-black leading-none text-gold">{item.key}</span>
                      <span className="text-[9px] font-bold text-white/70">{item.usKey}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                        <span>{lang === 'pt' ? item.labelPt : item.labelEn}</span>
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-gold text-deep-black text-[9px] font-black uppercase tracking-widest">
                            SELECIONADO
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] font-black text-gold uppercase tracking-wider">
                        {lang === 'pt' ? item.taglinePt : item.taglineEn}
                      </p>
                    </div>
                  </div>

                  {stock !== null && (
                    <span
                      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border shrink-0 ${
                        hasStock
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-neutral-300 bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {hasStock ? `${stock} EM ESTOQUE` : (lang === 'pt' ? 'ESGOTADO' : 'OUT OF STOCK')}
                    </span>
                  )}
                </div>

                {/* Badges de Correspondência Brasil & EUA */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                  <div className="p-2 bg-deep-black/5 border border-deep-black/10">
                    <span className="text-[9px] font-black text-deep-black/60 uppercase tracking-widest block">
                      MANEQUIM BRASIL
                    </span>
                    <span className="text-xs font-black text-deep-black uppercase">
                      VESTE {item.brNumber}
                    </span>
                  </div>
                  <div className="p-2 bg-deep-black/5 border border-deep-black/10">
                    <span className="text-[9px] font-black text-deep-black/60 uppercase tracking-widest block">
                      EQUIVALÊNCIA EUA
                    </span>
                    <span className="text-xs font-black text-deep-black uppercase">
                      {item.usNumber}
                    </span>
                  </div>
                </div>

                {/* Métricas do Corpo: Busto, Cintura, Quadril */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-3 bg-white border-2 border-deep-black/10 text-center space-y-0.5">
                    <span className="text-[9.5px] font-black text-gold uppercase tracking-widest block">
                      {lang === 'pt' ? 'BUSTO' : 'BUST'}
                    </span>
                    <span className="text-sm font-black text-deep-black block">
                      {unit === 'CM' ? item.cm.bust : item.in.bust}
                    </span>
                    <span className="text-[8.5px] font-medium text-deep-black/50 block">
                      {unit === 'CM' ? item.in.bust : item.cm.bust}
                    </span>
                  </div>

                  <div className="p-3 bg-white border-2 border-deep-black/10 text-center space-y-0.5">
                    <span className="text-[9.5px] font-black text-gold uppercase tracking-widest block">
                      {lang === 'pt' ? 'CINTURA' : 'WAIST'}
                    </span>
                    <span className="text-sm font-black text-deep-black block">
                      {unit === 'CM' ? item.cm.waist : item.in.waist}
                    </span>
                    <span className="text-[8.5px] font-medium text-deep-black/50 block">
                      {unit === 'CM' ? item.in.waist : item.cm.waist}
                    </span>
                  </div>

                  <div className="p-3 bg-white border-2 border-deep-black/10 text-center space-y-0.5">
                    <span className="text-[9.5px] font-black text-gold uppercase tracking-widest block">
                      {lang === 'pt' ? 'QUADRIL' : 'HIPS'}
                    </span>
                    <span className="text-sm font-black text-deep-black block">
                      {unit === 'CM' ? item.cm.hip : item.in.hip}
                    </span>
                    <span className="text-[8.5px] font-medium text-deep-black/50 block">
                      {unit === 'CM' ? item.in.hip : item.cm.hip}
                    </span>
                  </div>
                </div>

                {/* Altura & Peso Referencial */}
                <div className="flex items-center justify-between text-[10.5px] font-bold text-deep-black/80 px-1 pt-1 border-t border-deep-black/10">
                  <span>
                    <strong className="text-deep-black font-black">{lang === 'pt' ? 'Peso Indicado:' : 'Weight:'}</strong>{' '}
                    {lang === 'pt' ? item.weightPt : item.weightEn}
                  </span>
                  <span>
                    <strong className="text-deep-black font-black">{lang === 'pt' ? 'Altura:' : 'Height:'}</strong>{' '}
                    {lang === 'pt' ? item.heightPt : item.heightEn}
                  </span>
                </div>

                {/* Descrição do Caimento da Peça */}
                <p className="text-[11px] text-deep-black/75 font-medium leading-relaxed bg-amber-50/50 p-2.5 border border-gold/30">
                  <strong className="text-deep-black font-black">{lang === 'pt' ? 'Caimento:' : 'Fit:'}</strong>{' '}
                  {lang === 'pt' ? item.fitPt : item.fitEn}
                </p>
              </div>

              {/* Botão de Selecionar Tamanho */}
              <button
                type="button"
                onClick={() => handlePickSize(item.key)}
                className={`w-full py-3 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-deep-black text-gold border-2 border-deep-black shadow-xs'
                    : 'bg-gold hover:bg-deep-black hover:text-gold text-deep-black border-2 border-deep-black'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4 text-gold stroke-[3]" />
                    <span>{lang === 'pt' ? `TAMANHO ${item.key} SELECIONADO` : `SIZE ${item.key} SELECTED`}</span>
                  </>
                ) : (
                  <>
                    <span>{lang === 'pt' ? `ESCOLHER TAMANHO ${item.key} (${item.brNumber})` : `SELECT SIZE ${item.key} (${item.usNumber})`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* TABELA COMPARATIVA GERAL RESUMIDA */}
      <div className="space-y-3 pt-4 border-t border-deep-black/10">
        <h4 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
          <Layers className="w-4 h-4 text-gold" />
          <span>{lang === 'pt' ? 'VISÃO COMPARATIVA COMPLETA (TODOS OS TAMANHOS)' : 'FULL SIZING COMPARISON TABLE'}</span>
        </h4>

        <div className="overflow-x-auto border-2 border-deep-black bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs uppercase tracking-wider">
            <thead>
              <tr className="bg-deep-black text-white text-[11px] font-black">
                <th className="py-3 px-3.5 border-b border-deep-black/20 text-gold">TAMANHO BR</th>
                <th className="py-3 px-3.5 border-b border-deep-black/20">MANEQUIM BR</th>
                <th className="py-3 px-3.5 border-b border-deep-black/20">EUA (US SIZING)</th>
                <th className="py-3 px-3.5 border-b border-deep-black/20">BUSTO</th>
                <th className="py-3 px-3.5 border-b border-deep-black/20">CINTURA</th>
                <th className="py-3 px-3.5 border-b border-deep-black/20">QUADRIL</th>
                <th className="py-3 px-3.5 border-b border-deep-black/20">PESO SUGERIDO</th>
                <th className="py-3 px-3.5 border-b border-deep-black/20 text-right">AÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deep-black/10 font-bold">
              {OFFICIAL_SIZE_GUIDE.map((row) => {
                const isSelected = selectedSize && (
                  selectedSize.toUpperCase() === row.key ||
                  selectedSize.toUpperCase() === row.usKey
                );

                return (
                  <tr
                    key={row.key}
                    className={`transition ${
                      isSelected ? 'bg-gold/15 font-black' : 'hover:bg-deep-black/5'
                    }`}
                  >
                    <td className="py-3.5 px-3.5 font-black text-deep-black">
                      <span className="px-2 py-0.5 bg-deep-black text-gold text-xs font-black inline-block">
                        {row.key}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-deep-black">{row.brNumber}</td>
                    <td className="py-3.5 px-3.5 text-deep-black font-mono">{row.usNumber}</td>
                    <td className="py-3.5 px-3.5 text-deep-black/85">
                      {unit === 'CM' ? row.cm.bust : row.in.bust}
                    </td>
                    <td className="py-3.5 px-3.5 text-deep-black/85">
                      {unit === 'CM' ? row.cm.waist : row.in.waist}
                    </td>
                    <td className="py-3.5 px-3.5 text-deep-black/85">
                      {unit === 'CM' ? row.cm.hip : row.in.hip}
                    </td>
                    <td className="py-3.5 px-3.5 text-deep-black/70 text-[11px]">
                      {lang === 'pt' ? row.weightPt : row.weightEn}
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handlePickSize(row.key)}
                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider transition cursor-pointer border ${
                          isSelected
                            ? 'bg-deep-black text-gold border-deep-black'
                            : 'bg-white hover:bg-gold text-deep-black border-deep-black'
                        }`}
                      >
                        {isSelected ? 'ESCOLHIDO' : 'SELECIONAR'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GUIA ILUSTRADO: COMO MEDIR O SEU CORPO */}
      <div className="p-6 border-2 border-deep-black bg-white space-y-4">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-gold" />
          <h4 className="text-sm font-black uppercase tracking-wider text-deep-black">
            {lang === 'pt' ? 'COMO TIRAR SUAS MEDIDAS COM FITA MÉTRICA' : 'HOW TO MEASURE YOUR BODY'}
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-deep-black/5 border border-deep-black/10 space-y-1.5">
            <span className="text-xs font-black text-gold uppercase tracking-wider block">
              1. {lang === 'pt' ? 'BUSTO / TÓRAX' : 'BUST'}
            </span>
            <p className="text-[11px] text-deep-black/75 leading-relaxed font-medium">
              {lang === 'pt'
                ? 'Passe a fita métrica sobre a parte mais saliente do busto, mantendo a fita reta nas costas e sem apertar.'
                : 'Wrap measuring tape around the fullest part of your bust, keeping tape straight across your back.'}
            </p>
          </div>

          <div className="p-4 bg-deep-black/5 border border-deep-black/10 space-y-1.5">
            <span className="text-xs font-black text-gold uppercase tracking-wider block">
              2. {lang === 'pt' ? 'CINTURA' : 'WAIST'}
            </span>
            <p className="text-[11px] text-deep-black/75 leading-relaxed font-medium">
              {lang === 'pt'
                ? 'Meça na parte mais estreita da cintura natural, cerca de 2 dedos acima da linha do umbigo.'
                : 'Measure around your natural waistline, approximately two fingers above your navel.'}
            </p>
          </div>

          <div className="p-4 bg-deep-black/5 border border-deep-black/10 space-y-1.5">
            <span className="text-xs font-black text-gold uppercase tracking-wider block">
              3. {lang === 'pt' ? 'QUADRIL' : 'HIPS'}
            </span>
            <p className="text-[11px] text-deep-black/75 leading-relaxed font-medium">
              {lang === 'pt'
                ? 'Com os pés juntos, passe a fita na área de maior projeção dos glúteos para obter a medida exata.'
                : 'With feet together, measure around the widest portion of your hips and glutes.'}
            </p>
          </div>
        </div>

        {/* Banner Concierge WhatsApp */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-deep-black text-white border border-gold/30">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              CONCIERGE ANA FITNESS WEAR
            </span>
            <p className="text-xs font-bold uppercase tracking-wider">
              {lang === 'pt'
                ? 'AINDA NA DÚVIDA ENTRE DOIS TAMANHOS? FALE COM NOSSA CONSULTORA PELO WHATSAPP!'
                : 'STILL UNSURE ABOUT YOUR SIZE? CONTACT OUR PERSONAL SIZING ADVISOR!'}
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shrink-0 border border-gold"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{lang === 'pt' ? 'FALAR NO WHATSAPP' : 'WHATSAPP SIZING HELP'}</span>
          </a>
        </div>
      </div>
    </div>
  );

  // Se for Modal, renderiza dentro do overlay com scroll
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
        <div className="bg-white border-2 border-deep-black w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl animate-scaleUp">
          {/* Header Fixo do Modal */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-deep-black bg-deep-black text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gold text-deep-black">
                <Ruler className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gold">
                  {lang === 'pt' ? 'TABELA OFICIAL DE MEDIDAS (P • M • G • GG)' : 'OFFICIAL SIZING GUIDE (S • M • L • XL)'}
                </h3>
                <span className="text-[10px] text-white/70 uppercase tracking-widest block font-medium">
                  ANA FITNESS WEAR • ATELIER & CONFECÇÃO
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/70 hover:text-gold hover:bg-white/10 transition cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Corpo com Scroll */}
          <div className="p-4 sm:p-8 overflow-y-auto space-y-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
}
