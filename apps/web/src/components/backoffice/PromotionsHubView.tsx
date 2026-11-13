'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Truck,
  Clock,
  Calendar,
  Save,
  Check,
  Eye,
  AlertCircle,
  Tag,
  DollarSign,
  Percent,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
} from 'lucide-react';
import { useStoreSettings, DEFAULT_PROMO_POPUP, PromoOfferPopupConfig } from '@/context/StoreSettingsContext';
import CouponsManagerView from './CouponsManagerView';
import { PromoOfferPopup } from '../PromoOfferPopup';

interface PromotionsHubViewProps {
  onOpenComboModal?: () => void;
  comboPromo?: any;
}

export function PromotionsHubView({
  onOpenComboModal,
  comboPromo,
}: PromotionsHubViewProps) {
  const { siteInfo, updateSiteInfo } = useStoreSettings();

  const [activeSubTab, setActiveSubTab] = useState<'POPUP' | 'COMBO' | 'COUPONS'>('POPUP');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Estados locais do formulário de Pop-up de Oferta
  const initialPopup = siteInfo.promoOfferPopup || DEFAULT_PROMO_POPUP;

  const [popupActive, setPopupActive] = useState<boolean>(initialPopup.active ?? true);
  const [popupBadge, setPopupBadge] = useState<string>(initialPopup.badge || '⚡ OFERTA RELÂMPAGO • FRETE GRÁTIS');
  const [popupTitle, setPopupTitle] = useState<string>(initialPopup.title || 'FRETE GRÁTIS EM COMPRAS ACIMA DE $100!');
  const [popupDescription, setPopupDescription] = useState<string>(
    initialPopup.description ||
      'Válido para todos os 50 estados dos EUA via USPS Priority. Oferta especial por tempo limitado: encerra neste domingo à meia-noite (horário dos EUA)! Aproveite para garantir seus conjuntos favoritos.'
  );
  const [popupCtaText, setPopupCtaText] = useState<string>(initialPopup.ctaText || 'GARANTIR MEU FRETE GRÁTIS');
  const [popupCtaLink, setPopupCtaLink] = useState<string>(initialPopup.ctaLink || '#vitrine');
  const [popupExpiresAt, setPopupExpiresAt] = useState<string>(
    initialPopup.expiresAt || '2026-11-15T23:59:59-05:00'
  );
  const [popupMinOrder, setPopupMinOrder] = useState<number>(
    initialPopup.freeShippingThreshold || siteInfo.freeShippingThreshold || 100
  );
  const [popupShowCountdown, setPopupShowCountdown] = useState<boolean>(initialPopup.showCountdown ?? true);

  // Sincroniza se siteInfo atualizar
  useEffect(() => {
    if (siteInfo.promoOfferPopup) {
      const p = siteInfo.promoOfferPopup;
      setPopupActive(p.active ?? true);
      setPopupBadge(p.badge || '⚡ OFERTA RELÂMPAGO • FRETE GRÁTIS');
      setPopupTitle(p.title || 'FRETE GRÁTIS EM COMPRAS ACIMA DE $100!');
      setPopupDescription(
        p.description ||
          'Válido para todos os 50 estados dos EUA via USPS Priority. Oferta especial por tempo limitado: encerra neste domingo à meia-noite (horário dos EUA)! Aproveite para garantir seus conjuntos favoritos.'
      );
      setPopupCtaText(p.ctaText || 'GARANTIR MEU FRETE GRÁTIS');
      setPopupCtaLink(p.ctaLink || '#vitrine');
      setPopupExpiresAt(p.expiresAt || '2026-11-15T23:59:59-05:00');
      setPopupMinOrder(p.freeShippingThreshold || siteInfo.freeShippingThreshold || 100);
      setPopupShowCountdown(p.showCountdown ?? true);
    }
  }, [siteInfo.promoOfferPopup, siteInfo.freeShippingThreshold]);

  // Atalhos de Data de Expiração
  const setExpireUntilSundayMidnight = () => {
    // Domingo 15 de Novembro de 2026 às 23:59:59 EST
    setPopupExpiresAt('2026-11-15T23:59:59-05:00');
  };

  const setExpireInHours = (hours: number) => {
    const target = new Date(Date.now() + hours * 60 * 60 * 1000);
    setPopupExpiresAt(target.toISOString());
  };

  // Calcula quanto tempo resta da oferta
  const expiresMs = new Date(popupExpiresAt).getTime();
  const diffMs = expiresMs - Date.now();
  const isExpired = diffMs <= 0;

  const formatRemainingHuman = () => {
    if (isExpired) return 'EXPIROU (O pop-up não será mais exibido aos clientes)';
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Restam aproximadamente ${d} dia(s), ${h} hora(s) e ${m} min até o término`;
  };

  const handleSavePromoPopup = async () => {
    setIsSaving(true);
    setSaveFeedback(null);

    const updatedConfig: PromoOfferPopupConfig = {
      active: popupActive,
      badge: popupBadge.trim(),
      title: popupTitle.trim(),
      description: popupDescription.trim(),
      ctaText: popupCtaText.trim(),
      ctaLink: popupCtaLink.trim() || '#vitrine',
      expiresAt: popupExpiresAt,
      freeShippingThreshold: Number(popupMinOrder) || 100,
      showCountdown: popupShowCountdown,
    };

    try {
      const res = await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteInfo: {
            ...siteInfo,
            freeShippingThreshold: Number(popupMinOrder) || 100,
            promoOfferPopup: updatedConfig,
          },
        }),
      });

      if (!res.ok) throw new Error('Falha ao salvar no servidor.');

      updateSiteInfo({
        freeShippingThreshold: Number(popupMinOrder) || 100,
        promoOfferPopup: updatedConfig,
      });

      setSaveFeedback('✓ Oferta e Pop-up salvos com sucesso! As configurações já estão ativas no site.');
      setTimeout(() => setSaveFeedback(null), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar oferta:', err);
      alert('Erro ao salvar configurações da oferta: ' + err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Cabeçalho da Central de Promoções */}
      <div className="bg-deep-black text-white p-6 border-b-2 border-gold shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-gold text-deep-black text-[9px] font-black uppercase tracking-widest">
              CAMPANHAS DE VENDAS
            </span>
            <span className="text-[10px] text-gold font-mono uppercase">
              ESTOQUE EUA • MASSACHUSETTS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-gold" />
            <span>CENTRAL DE PROMOÇÕES & OFERTAS</span>
          </h1>
          <p className="text-xs text-white/70 uppercase tracking-wider mt-1 max-w-2xl leading-relaxed">
            Gerencie o Pop-up de Frete Grátis na entrada do site, a contagem regressiva de validade, os Combos de peças fechadas e todos os Cupons de desconto da loja.
          </p>
        </div>

        {/* 3 Abas Internas da Central de Promoções */}
        <div className="flex flex-wrap gap-1.5 bg-white/10 p-1.5 border border-white/20 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('POPUP')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'POPUP'
                ? 'bg-gold text-deep-black shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>POP-UP FRETE GRÁTIS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('COMBO')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'COMBO'
                ? 'bg-gold text-deep-black shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>PROMOÇÃO DE COMBO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('COUPONS')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'COUPONS'
                ? 'bg-gold text-deep-black shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>CUPONS DE DESCONTO</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK DE SUCESSO AO SALVAR */}
      {saveFeedback && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* =========================================================================
          SUB-ABA 1: POP-UP DE FRETE GRÁTIS & OFERTA RELÂMPAGO
         ========================================================================= */}
      {activeSubTab === 'POPUP' && (
        <div className="space-y-6">
          {/* Card Principal de Configuração */}
          <div className="bg-white border-2 border-deep-black p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-deep-black/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  AVISO DE ENTRADA DO SITE
                </span>
                <h2 className="text-lg font-black uppercase tracking-wider text-deep-black flex items-center gap-2 mt-0.5">
                  <Truck className="w-5 h-5 text-gold" />
                  <span>POP-UP DE FRETE GRÁTIS COM CONTAGEM REGRESSIVA</span>
                </h2>
              </div>

              {/* Botão Liga/Desliga */}
              <div className="flex items-center gap-3 bg-neutral-100 px-3 py-2 border border-deep-black/20">
                <span className="text-xs font-black uppercase text-deep-black">
                  STATUS DO POP-UP:
                </span>
                <button
                  type="button"
                  onClick={() => setPopupActive(!popupActive)}
                  className={`px-3 py-1 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                    popupActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-neutral-300 text-deep-black/60'
                  }`}
                >
                  {popupActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  <span>{popupActive ? 'LIGADO (ATIVO)' : 'DESLIGADO'}</span>
                </button>
              </div>
            </div>

            {/* Aviso de Regra de Horário */}
            <div className={`p-4 border-2 space-y-1.5 ${
              isExpired
                ? 'bg-red-50 border-red-400 text-red-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center gap-2 text-xs font-black uppercase">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>VIGÊNCIA AUTOMÁTICA DA OFERTA (HORÁRIO DOS ESTADOS UNIDOS):</span>
              </div>
              <p className="text-xs font-medium leading-relaxed">
                {formatRemainingHuman()}
              </p>
              <p className="text-[11px] text-deep-black/70 font-semibold">
                * Conforme você pediu, quando o horário de término chegar, o pop-up sai do ar sozinho sem você precisar entrar aqui para tirar!
              </p>
            </div>

            {/* Grid dos Campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Data & Hora de Término */}
              <div className="space-y-2 md:col-span-2 bg-neutral-50 p-4 border border-deep-black/15">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                  <span>DATA E HORA DO ENCERRAMENTO (HORÁRIO DE BOSTON/EUA - EST):</span>
                  <span className="text-gold font-mono font-bold">
                    {popupExpiresAt}
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Botão Exclusivo Solicitado: Domingo Meia-Noite */}
                  <button
                    type="button"
                    onClick={setExpireUntilSundayMidnight}
                    className="px-3 py-2 bg-gold hover:bg-deep-black hover:text-gold text-deep-black border-2 border-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>✓ ATÉ DOMINGO À MEIA-NOITE (15/NOV - 23:59:59 EST)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpireInHours(24)}
                    className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-deep-black border border-deep-black/30 text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    +24 HORAS
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpireInHours(48)}
                    className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-deep-black border border-deep-black/30 text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    +48 HORAS
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpireInHours(168)}
                    className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-deep-black border border-deep-black/30 text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    +7 DIAS
                  </button>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[11px] text-deep-black/70 font-bold uppercase shrink-0">
                    Ou digite/ajuste manualmente a data ISO:
                  </span>
                  <input
                    type="text"
                    value={popupExpiresAt}
                    onChange={(e) => setPopupExpiresAt(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold uppercase border border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
                    placeholder="YYYY-MM-DDTHH:mm:ss-05:00"
                  />
                </div>
              </div>

              {/* Valor Mínimo para Frete Grátis */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                  VALOR MÍNIMO EM PRODUTOS PARA FRETE GRÁTIS ($ USD):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono font-bold text-xs text-deep-black/50">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={popupMinOrder}
                    onChange={(e) => setPopupMinOrder(Number(e.target.value) || 100)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-black font-mono border-2 border-deep-black focus:outline-none focus:border-gold"
                  />
                </div>
                <span className="text-[10px] text-deep-black/60 font-medium block">
                  Atualmente configurado para: <strong>Compras a partir de ${popupMinOrder}.00</strong>
                </span>
              </div>

              {/* Exibir Cronômetro de Contagem Regressiva */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                  MOSTRAR CONTADOR REGRESSIVO DE DIAS/HORAS/MINUTOS?
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPopupShowCountdown(true)}
                    className={`flex-1 py-2 text-xs font-black uppercase border transition cursor-pointer ${
                      popupShowCountdown ? 'bg-deep-black text-gold border-deep-black' : 'bg-white text-deep-black border-deep-black/20'
                    }`}
                  >
                    ✓ SIM, EXIBIR CRONÔMETRO
                  </button>
                  <button
                    type="button"
                    onClick={() => setPopupShowCountdown(false)}
                    className={`flex-1 py-2 text-xs font-black uppercase border transition cursor-pointer ${
                      !popupShowCountdown ? 'bg-deep-black text-white border-deep-black' : 'bg-white text-deep-black border-deep-black/20'
                    }`}
                  >
                    OCULTAR CRONÔMETRO
                  </button>
                </div>
              </div>

              {/* Etiqueta / Badge */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                  ETIQUETA SUPERIOR (BADGE):
                </label>
                <input
                  type="text"
                  value={popupBadge}
                  onChange={(e) => setPopupBadge(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold uppercase border border-deep-black/30 focus:outline-none focus:border-deep-black"
                  placeholder="⚡ OFERTA RELÂMPAGO • FRETE GRÁTIS"
                />
              </div>

              {/* Título do Pop-up */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                  TÍTULO PRINCIPAL DO POP-UP:
                </label>
                <input
                  type="text"
                  value={popupTitle}
                  onChange={(e) => setPopupTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-black uppercase border border-deep-black/30 focus:outline-none focus:border-deep-black"
                  placeholder="FRETE GRÁTIS EM COMPRAS ACIMA DE $100!"
                />
              </div>

              {/* Descrição Explicativa */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                  TEXTO EXPLICATIVO DA OFERTA:
                </label>
                <textarea
                  rows={2}
                  value={popupDescription}
                  onChange={(e) => setPopupDescription(e.target.value)}
                  className="w-full p-3 text-xs font-medium border border-deep-black/30 focus:outline-none focus:border-deep-black"
                  placeholder="Explique as condições do frete grátis..."
                />
              </div>

              {/* Texto do Botão de Ação */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                  TEXTO DO BOTÃO (CHAMADA):
                </label>
                <input
                  type="text"
                  value={popupCtaText}
                  onChange={(e) => setPopupCtaText(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-black uppercase border border-deep-black/30 focus:outline-none focus:border-deep-black"
                  placeholder="GARANTIR MEU FRETE GRÁTIS"
                />
              </div>

              {/* Destino do Botão */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black block">
                  DESTINO AO CLICAR NO BOTÃO:
                </label>
                <input
                  type="text"
                  value={popupCtaLink}
                  onChange={(e) => setPopupCtaLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-deep-black/30 focus:outline-none focus:border-deep-black"
                  placeholder="#vitrine (vai para a vitrine de produtos)"
                />
              </div>

            </div>

            {/* Botões de Ação do Rodapé */}
            <div className="pt-4 border-t-2 border-deep-black flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="w-full sm:w-auto px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-deep-black border border-deep-black text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-gold" />
                <span>👁️ VER PRÉVIA COMO APARECE NO SITE</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSavePromoPopup}
                className="w-full sm:w-auto px-8 py-3.5 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-luxury border-2 border-deep-black cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-gold" />
                <span>{isSaving ? 'SALVANDO ALTERAÇÕES...' : 'SALVAR CONFIGURAÇÃO DA OFERTA'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-ABA 2: PROMOÇÃO DE COMBO (3 PEÇAS POR $X)
         ========================================================================= */}
      {activeSubTab === 'COMBO' && (
        <div className="bg-white border-2 border-deep-black p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-deep-black/10 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                COMPRE JUNTO & ECONOMIZE
              </span>
              <h2 className="text-lg font-black uppercase tracking-wider text-deep-black flex items-center gap-2 mt-0.5">
                <Sparkles className="w-5 h-5 text-gold" />
                <span>PROMOÇÃO DE COMBO DE PEÇAS</span>
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onOpenComboModal && onOpenComboModal()}
              className="px-6 py-3 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-2 border-deep-black shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span>CONFIGURAR PEÇAS & VALOR DO COMBO</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 border border-deep-black/20 space-y-1">
              <span className="text-[10px] font-bold text-deep-black/60 uppercase block">Situação do Combo</span>
              <p className="text-xl font-black text-deep-black">
                {comboPromo?.active ? '🟢 ATIVA NO SITE' : '🔴 PAUSADA'}
              </p>
              <p className="text-[10px] text-deep-black/60">
                {comboPromo?.active ? 'Aparece no carrinho e vitrine' : 'Nenhum desconto de combo aplicado'}
              </p>
            </div>

            <div className="p-4 bg-stone-50 border border-deep-black/20 space-y-1">
              <span className="text-[10px] font-bold text-deep-black/60 uppercase block">Regra do Pacote</span>
              <p className="text-xl font-black text-deep-black font-mono">
                {comboPromo?.required_quantity || 3} PEÇAS POR ${Number(comboPromo?.bundle_price || 99).toFixed(2)}
              </p>
              <p className="text-[10px] text-deep-black/60">
                Válido para Zelle, Venmo, Cash App e Parcelamento
              </p>
            </div>

            <div className="p-4 bg-stone-50 border border-deep-black/20 space-y-1">
              <span className="text-[10px] font-bold text-deep-black/60 uppercase block">Produtos Participantes</span>
              <p className="text-xl font-black text-gold font-mono">
                {(comboPromo?.product_ids || []).length} MODELOS
              </p>
              <p className="text-[10px] text-deep-black/60">
                Conjuntos e peças elegíveis ao combo
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium space-y-1">
            <p className="font-bold">💡 Dica de Venda:</p>
            <p>
              Você pode incluir qualquer produto do catálogo na promoção de combo. Quando o cliente adicionar a quantidade necessária ({comboPromo?.required_quantity || 3} peças), o desconto é aplicado automaticamente na sacola lateral e no checkout!
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-ABA 3: CUPONS DE DESCONTO & VENDEDORAS
         ========================================================================= */}
      {activeSubTab === 'COUPONS' && (
        <div className="space-y-4">
          <CouponsManagerView />
        </div>
      )}

      {/* MODAL DE PRÉVIA DO POP-UP */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#0A0A0A] text-white border-2 border-gold max-w-lg w-full p-6 sm:p-8 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-gold hover:text-deep-black text-white/80 transition flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-5 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/20 border border-gold/40 text-gold text-[10px] font-black uppercase tracking-widest rounded-full">
                <Zap className="w-3.5 h-3.5 text-gold animate-pulse" />
                <span>{popupBadge}</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white font-mono leading-tight">
                  {popupTitle}
                </h2>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium max-w-md mx-auto">
                  {popupDescription}
                </p>
              </div>

              {popupShowCountdown && (
                <div className="pt-1">
                  <div className="text-[10px] uppercase font-black tracking-widest text-gold/90 mb-2">
                    ESTA OFERTA ENCERRA EM:
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                    <div className="bg-white/5 border border-gold/40 p-2 rounded text-center">
                      <span className="text-lg font-black text-gold font-mono block">02</span>
                      <span className="text-[8.5px] uppercase font-bold text-white/60">DIAS</span>
                    </div>
                    <div className="bg-white/5 border border-gold/40 p-2 rounded text-center">
                      <span className="text-lg font-black text-gold font-mono block">06</span>
                      <span className="text-[8.5px] uppercase font-bold text-white/60">HORAS</span>
                    </div>
                    <div className="bg-white/5 border border-gold/40 p-2 rounded text-center">
                      <span className="text-lg font-black text-gold font-mono block">54</span>
                      <span className="text-[8.5px] uppercase font-bold text-white/60">MIN</span>
                    </div>
                    <div className="bg-white/5 border border-gold/40 p-2 rounded text-center">
                      <span className="text-lg font-black text-gold font-mono block">38</span>
                      <span className="text-[8.5px] uppercase font-bold text-white/60">SEG</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-full py-4 bg-gold text-deep-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-gold shadow-lg"
              >
                <span>{popupCtaText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-white/40 uppercase">
                (Esta é apenas uma prévia visual. Clique no X acima para fechar)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
