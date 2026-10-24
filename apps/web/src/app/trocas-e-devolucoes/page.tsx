'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { ChevronDown, RotateCcw, ShieldCheck, Truck, ArrowRight, HelpCircle, Phone, Sparkles } from 'lucide-react';

export default function TrocasEDevolucoesPage() {
  const { lang, t } = useLanguage();
  const { siteInfo } = useStoreSettings();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const returnDays = siteInfo.returnDays || 30;
  const storePhone = siteInfo.phone || '+1 (978) 313-9452';
  const cleanPhone = (siteInfo.whatsapp || siteInfo.phone || '19783139452').replace(/\D/g, '');
  const storeAddress = siteInfo.address || 'Leominster, MA 01453 • United States';
  const customPolicyText = siteInfo.returnPolicyText;

  const accordionItems = [
    {
      titlePt: `1. QUAL É O PRAZO PARA SOLICITAR A TROCA OU DEVOLUÇÃO?`,
      titleEn: `1. WHAT IS THE RETURN AND EXCHANGE WINDOW?`,
      contentPt:
        `Você tem até ${returnDays} (${returnDays === 30 ? 'trinta' : returnDays}) dias corridos a partir do recebimento do seu pedido para solicitar uma troca ou devolução, garantindo total tranquilidade para experimentar as suas peças.`,
      contentEn:
        `You have up to ${returnDays} days from the delivery date to request an exchange or return, giving you plenty of time to try on your pieces comfortably.`,
    },
    {
      titlePt: '2. QUAIS SÃO AS CONDIÇÕES OBRIGATÓRIAS DAS PEÇAS?',
      titleEn: '2. WHAT ARE THE GARMENT CONDITIONS?',
      contentPt:
        'Para que a devolução seja aprovada:\n• Estar sem sinais de uso;\n• Não ter sido lavada;\n• Estar sem manchas, odores, perfumes ou qualquer alteração;\n• Estar com as etiquetas originais afixadas;\n• Ser devolvida nas mesmas condições em que foi recebida.',
      contentEn:
        'To ensure your return is accepted:\n• Unworn and unwashed;\n• Free of stains, odors, perfumes, or pet hair;\n• Original tags attached;\n• Returned in original pristine condition.',
    },
    {
      titlePt: '3. QUEM PAGA O FRETE DE DEVOLUÇÃO?',
      titleEn: '3. WHO PAYS FOR RETURN SHIPPING?',
      contentPt:
        `Os custos de envio para devolução ou troca são de responsabilidade da cliente. A ${siteInfo.storeName || 'ANA Fitness Wear'} assume integralmente o custo do frete apenas quando o produto enviado for incorreto ou apresentar defeito confirmado de fabricação.`,
      contentEn:
        `Return shipping postage is paid by the customer. ${siteInfo.storeName || 'ANA Fitness Wear'} covers return shipping costs only if an incorrect item was shipped or in case of a verified manufacturing defect.`,
    },
    {
      titlePt: '4. COMO É FEITO O REEMBOLSO?',
      titleEn: '4. HOW ARE REFUNDS PROCESSED?',
      contentPt:
        `Após o recebimento e inspeção da peça em nossa central (${storeAddress.split('•')[0].trim()}), o reembolso é emitido na mesma forma de pagamento original (Zelle, Venmo ou estorno no cartão de crédito/débito).`,
      contentEn:
        `Once the return is received and inspected at our facility in ${storeAddress.split('•')[0].trim()}, refunds are issued back to the original payment method (Zelle, Venmo, or Credit/Debit card).`,
    },
    {
      titlePt: '5. PEÇAS EM PRÉ-VENDA / SOB ENCOMENDA TÊM DIREITO A TROCA?',
      titleEn: '5. DO PRE-ORDER ITEMS QUALIFY FOR EXCHANGES?',
      contentPt:
        `Sim! Peças produzidas sob encomenda possuem a mesmíssima garantia de ${returnDays} dias. Caso o tamanho precise de ajuste, confeccionamos uma nova peça prioritária para você no ateliê.`,
      contentEn:
        `Yes! Made-to-order pre-orders carry the exact same ${returnDays}-day guarantee. If sizing needs adjustment, we will tailor a replacement piece with priority.`,
    },
    {
      titlePt: '6. COMO INICIAR UMA SOLICITAÇÃO?',
      titleEn: '6. HOW DO I START A RETURN?',
      contentPt:
        `Basta entrar em contato com nosso atendimento pelo WhatsApp/Telefone ${storePhone} ou Instagram ${siteInfo.instagram || '@anafitnessweareua'} informando o número do seu pedido.`,
      contentEn:
        `Simply reach out to our concierge via WhatsApp/Phone ${storePhone} or Instagram ${siteInfo.instagram || '@anafitnessweareua'} with your order details.`,
    },
  ];

  const toggleAccordion = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-12">
      {/* Header da Política */}
      <div className="text-center space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
          {siteInfo.storeName || 'ANA FITNESS WEAR'} • STORE POLICY
        </span>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-wider text-deep-black">
          {t('ret.title')}
        </h1>
        <p className="text-xs sm:text-sm uppercase tracking-wider text-deep-black/60 font-medium max-w-xl mx-auto leading-relaxed">
          {t('ret.subtitle')}
        </p>
      </div>

      {/* Destaque das Garantias Oficiais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-xs">
          <RotateCcw className="w-5 h-5 mx-auto text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
            {lang === 'pt' ? `${returnDays} DIAS DE PRAZO` : `${returnDays}-DAY WINDOW`}
          </h3>
          <p className="text-[10px] uppercase tracking-wider text-deep-black/60">
            {lang === 'pt' ? 'A partir da entrega' : 'From delivery date'}
          </p>
        </div>
        <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-xs">
          <ShieldCheck className="w-5 h-5 mx-auto text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
            {lang === 'pt' ? 'ZERO TRANSPARÊNCIA' : 'ZERO SEE-THROUGH'}
          </h3>
          <p className="text-[10px] uppercase tracking-wider text-deep-black/60">
            {lang === 'pt' ? 'Garantia de tecido premium' : 'Premium fabric guarantee'}
          </p>
        </div>
        <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-xs">
          <Truck className="w-5 h-5 mx-auto text-gold" />
          <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
            {storeAddress.split('•')[0].trim().toUpperCase()}
          </h3>
          <p className="text-[10px] uppercase tracking-wider text-deep-black/60">
            {lang === 'pt' ? 'Atendimento rápido nos EUA' : 'Fast US domestic support'}
          </p>
        </div>
      </div>

      {/* Resumo da Política Customizada no CMS */}
      {customPolicyText && (
        <div className="p-6 bg-gold/10 border-2 border-gold text-deep-black space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-deep-black">
            <Sparkles className="w-4 h-4 text-gold" />
            <span>DIRETRIZES OFICIAIS DE ATENDIMENTO</span>
          </div>
          <p className="text-xs leading-relaxed uppercase font-medium">
            {customPolicyText}
          </p>
        </div>
      )}

      {/* Sanfona / Accordion Interativo */}
      <div className="space-y-3">
        {accordionItems.map((item, idx) => {
          const isOpen = openIdx === idx;

          return (
            <div
              key={idx}
              className="border-2 border-deep-black bg-white transition-all shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-black text-xs sm:text-sm uppercase tracking-wider text-deep-black hover:text-gold transition cursor-pointer"
              >
                <span>{lang === 'pt' ? item.titlePt : item.titleEn}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-gold' : 'text-deep-black'
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-deep-black/80 font-medium uppercase tracking-wide leading-relaxed whitespace-pre-line border-t border-deep-black/10 pt-4 animate-fadeIn">
                  {lang === 'pt' ? item.contentPt : item.contentEn}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Card de Ajuda Direta */}
      <div className="p-6 bg-deep-black text-white border border-gold/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-luxury">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            {lang === 'pt' ? 'PRECISA DE AJUDA COM SEU TAMANHO OU TROCA?' : 'NEED HELP WITH SIZING OR AN EXCHANGE?'}
          </h4>
          <p className="text-[11px] text-white/70 uppercase tracking-wider">
            {lang === 'pt'
              ? `Fale direto conosco pelo WhatsApp: ${storePhone}`
              : `Chat with us directly via WhatsApp: ${storePhone}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/${cleanPhone}?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20uma%20troca%20ou%20devolu%C3%A7%C3%A3o.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-[#25d366] hover:bg-green-600 text-black text-xs font-black uppercase tracking-widest transition whitespace-nowrap flex items-center gap-2 border border-black shadow"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>WhatsApp Direto</span>
          </a>

          <Link
            href="/contato"
            className="px-6 py-3 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition whitespace-nowrap"
          >
            {lang === 'pt' ? 'FALAR COM ATENDIMENTO' : 'CONTACT CONCIERGE'}
          </Link>
        </div>
      </div>
    </div>
  );
}
