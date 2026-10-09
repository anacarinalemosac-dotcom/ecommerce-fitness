'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'pt';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    // Top Bar
    'ticker.slogan': '✨ WEAR YOUR STRENGTH ✨',
    'ticker.shipping': 'FLAT RATE SHIPPING $9.99 ACROSS ALL 50 US STATES',
    'ticker.delivery': 'BASED IN LEOMINSTER, MA • FAST DOMESTIC 1-5 DAY USPS DELIVERY',
    'ticker.preorder': 'EXCLUSIVE MADE-TO-ORDER PRE-ORDERS',

    // Nav
    'nav.new': 'NEW ARRIVALS',
    'nav.sets': 'SETS',
    'nav.jumpsuits': 'JUMPSUITS',
    'nav.rompers': 'ROMPERS',
    'nav.tops': 'TOPS & BRAS',
    'nav.preorder': 'PRE-ORDER',
    'nav.contact': 'CONTACT',
    'nav.faq': 'FAQ',
    'nav.policy': 'STORE POLICY',
    'nav.pos': 'POS TERMINAL',
    'nav.erp': 'ERP',

    // Hero
    'hero.badge': 'OFFICIAL US STORE • LEOMINSTER, MA',
    'hero.title1': 'WEAR YOUR',
    'hero.title2': 'STRENGTH',
    'hero.subtitle': 'High-end athletic luxury based in Massachusetts. Zero see-through, anatomical compression and sculpt fit. We sell and ship domestically across all United States for a flat rate of $9.99.',
    'hero.cta': 'SHOP COLLECTION',
    'hero.preorderCta': 'EXPLORE PRE-ORDERS',

    // Categorias
    'cat.title': 'FEATURED CATEGORIES',
    'cat.subtitle': 'DISCOVER THE MOST COVETED SILHOUETTES BY ANA FITNESS WEAR',

    // Produtos
    'prod.featured': 'FEATURED STYLES',
    'prod.featuredSubtitle': 'ICONIC PIECES WITH VERIFIED ZERO SEE-THROUGH AND PREMIUM COMPRESSION',
    'prod.addToBag': 'ADD TO BAG',
    'prod.orderPreorder': 'PRE-ORDER PIECE (MADE-TO-ORDER)',
    'prod.inStock': 'IN STOCK • READY TO SHIP IN THE US',
    'prod.outOfStock': 'OUT OF STOCK • TAILORED PRE-ORDER',
    'prod.bestSeller': 'BEST SELLER',
    'prod.preOrderBadge': 'PRE-ORDER',
    'prod.newBadge': 'NEW ARRIVAL',
    'prod.freeShippingBanner': 'FLAT RATE SHIPPING: $9.99 ACROSS ALL US STATES',

    // PDP Tabs
    'tab.desc': 'DESCRIPTION & PERFORMANCE',
    'tab.sizing': 'SIZE GUIDE & MEASUREMENTS',
    'tab.care': 'CARE & WASHING',
    'tab.preorder': 'PRE-ORDER PRODUCTION',

    // Gymshark UI Additions
    'gymshark.quickAdd': 'QUICK ADD',
    'gymshark.addedToBag': 'ADDED TO BAG',
    'gymshark.viewBag': 'VIEW BAG & CHECKOUT',
    'gymshark.selectSize': 'SELECT SIZE',
    'gymshark.communityTitle': '#ANAFITNESSWEAR ATHLETES',
    'gymshark.communitySubtitle': 'REAL COMMUNITY • REAL CONFIDENCE ACROSS THE US',
    'gymshark.followInsta': 'FOLLOW @ANAFITNESSWEAREUA',
    'gymshark.techTitle': 'ENGINEERED FOR SQUATS. SCULPTED FOR STRENGTH.',
    'gymshark.techSubtitle': 'LAB-VERIFIED SQUAT-PROOF WEAVE • 4-WAY MUSCLE COMPRESSION',
    'gymshark.filterAll': 'ALL PIECES',

    // Footer
    'footer.vipTitle': 'ANA FITNESS WEAR VIP CLUB',
    'footer.vipDesc': 'Be the first to hear about fresh drops, restocks and exclusive ambassador perks.',
    'footer.emailPlaceholder': 'ENTER YOUR EMAIL ADDRESS',
    'footer.subscribe': 'JOIN NOW',
    'footer.about': 'High-end athletic luxury based in Leominster, Massachusetts. Zero see-through, sculpt fit and personal concierge support. We sell and ship nationwide across the US.',
    'footer.location': 'Leominster, MA 01453 • United States',
    'footer.phone': 'Phone / WhatsApp: +1 (978) 313-9452',
    'footer.insta': 'Instagram: @anafitnessweareua',
    'footer.payments': 'ACCEPTED PAYMENT METHODS',
    'footer.paymentsDesc': 'Apple Pay, Credit & Debit Cards (Visa, Mastercard, Amex, Discover), Zelle, and Venmo.',
    'footer.returns': '30-DAY HASSLE-FREE RETURNS',
    'footer.returnsDesc': 'Total satisfaction guarantee. Easy returns and exchanges within 30 days of delivery.',

    // Shipping page
    'ship.title': 'DOMESTIC US SHIPPING & DELIVERY POLICY',
    'ship.subtitle': 'Fast domestic shipping to all 50 US States via USPS and trusted carriers.',
    'ship.flatRateTitle': 'STANDARD FLAT RATE US SHIPPING: $9.99',
    'ship.flatRateDesc': 'Regardless of your US state or item quantity, standard domestic shipping is flat $9.99 with full online tracking provided via email & SMS.',
    'ship.prepTitle': 'HANDLING & PROCESSING TIME',
    'ship.prepDesc': 'Orders are prepared, inspected and dispatched within 1 to 5 business days after payment confirmation.',

    // Returns page
    'ret.title': 'EXCHANGE & RETURN POLICY (US)',
    'ret.subtitle': 'Generous 30-day domestic return window following delivery so you can try on your pieces with peace of mind.',
    'ret.condTitle': 'GARMENT CONDITION GUIDELINES',
    'ret.condDesc': 'Unworn, unwashed, free of stains, scents or pet hair, with all original tags attached.',
    'ret.shippingNote': 'Return shipping postage is customer responsibility, unless the return is due to an incorrect item sent or verified defect.',

    // Contact
    'contact.title': 'CUSTOMER CONCIERGE & SHOWROOM',
    'contact.subtitle': 'Reach out anytime for sizing advice, removable bra cup inquiries, or order status assistance.',
    'contact.address': 'Leominster, MA 01453 • United States',
    'contact.call': '+1 (978) 313-9452',
    'contact.chatWhatsApp': 'CHAT ON WHATSAPP',
  },
  pt: {
    // Top Bar
    'ticker.slogan': '✨ WEAR YOUR STRENGTH ✨',
    'ticker.shipping': 'TAXA FIXA DE FRETE $9.99 PARA TODOS OS ESTADOS UNIDOS',
    'ticker.delivery': 'SEDE EM LEOMINSTER, MA • ENVIO DOMÉSTICO USPS EM 1 A 5 DIAS ÚTEIS',
    'ticker.preorder': 'PRÉ-VENDAS EXCLUSIVAS SOB MEDIDA',

    // Nav
    'nav.new': 'LANÇAMENTOS',
    'nav.sets': 'CONJUNTOS',
    'nav.jumpsuits': 'MACACÕES',
    'nav.rompers': 'MACAQUINHOS',
    'nav.tops': 'TOPS & BLUSAS',
    'nav.preorder': 'PRÉ-VENDA',
    'nav.contact': 'CONTATO',
    'nav.faq': 'FAQ',
    'nav.policy': 'POLÍTICA DA LOJA',
    'nav.pos': 'PDV BALCÃO',
    'nav.erp': 'ERP',

    // Hero
    'hero.badge': 'LOJA OFICIAL NOS ESTADOS UNIDOS • LEOMINSTER, MA',
    'hero.title1': 'WEAR YOUR',
    'hero.title2': 'STRENGTH',
    'hero.subtitle': 'Moda fitness de alto padrão sediada em Massachusetts. Zero transparência, caimento escultural e compressão anatômica. Vendemos e entregamos para todos os Estados Unidos com frete fixo de $9.99.',
    'hero.cta': 'VER COLEÇÃO',
    'hero.preorderCta': 'PRÉ-VENDA EXCLUSIVA',

    // Categorias
    'cat.title': 'CATEGORIAS OFICIAIS',
    'cat.subtitle': 'EXPLORE OS MODELOS MAIS DESEJADOS DA ANA FITNESS WEAR',

    // Produtos
    'prod.featured': 'PRODUTOS EM DESTAQUE',
    'prod.featuredSubtitle': 'PEÇAS ICÔNICAS COM ZERO TRANSPARÊNCIA E TECIDOS DE ALTA COMPRESSÃO',
    'prod.addToBag': 'ADICIONAR À SACOLA',
    'prod.orderPreorder': 'ENCOMENDAR PEÇA (PRÉ-VENDA)',
    'prod.inStock': 'EM ESTOQUE • PRONTA ENTREGA NOS EUA',
    'prod.outOfStock': 'ESTOQUE ESGOTADO • PRODUÇÃO SOB ENCOMENDA',
    'prod.bestSeller': 'BEST SELLER',
    'prod.preOrderBadge': 'PRÉ-VENDA',
    'prod.newBadge': 'LANÇAMENTO',
    'prod.freeShippingBanner': 'TAXA FIXA DE FRETE: $9.99 PARA QUALQUER ESTADO DOS EUA',

    // PDP Tabs
    'tab.desc': 'DESCRIÇÃO & PERFORMANCE',
    'tab.sizing': 'TABELA DE MEDIDAS (US)',
    'tab.care': 'CUIDADOS & LAVAGEM',
    'tab.preorder': 'PRODUÇÃO SOB ENCOMENDA',

    // Gymshark UI Additions
    'gymshark.quickAdd': 'COMPRA RÁPIDA',
    'gymshark.addedToBag': 'ADICIONADO À SACOLA',
    'gymshark.viewBag': 'VER SACOLA & CHECKOUT',
    'gymshark.selectSize': 'ESCOLHER TAMANHO',
    'gymshark.communityTitle': 'ATLETAS #ANAFITNESSWEAR',
    'gymshark.communitySubtitle': 'COMUNIDADE REAL • PERFORMANCE NOS ESTADOS UNIDOS',
    'gymshark.followInsta': 'SEGUIR @ANAFITNESSWEAREUA',
    'gymshark.techTitle': 'ENGENHARIA PARA AGACHAMENTO. ESCULPIDO PARA SUA FORÇA.',
    'gymshark.techSubtitle': 'ZERO TRANSPARÊNCIA TESTADO EM LABORATÓRIO • COMPRESSÃO 4-WAY',
    'gymshark.filterAll': 'TODAS AS PEÇAS',

    // Footer
    'footer.vipTitle': 'CLUBE VIP ANA FITNESS WEAR',
    'footer.vipDesc': 'Receba em primeira mão novidades dos novos drops, reposições e cupons exclusivos.',
    'footer.emailPlaceholder': 'DIGITE SEU MELHOR E-MAIL',
    'footer.subscribe': 'CADASTRAR',
    'footer.about': 'Moda fitness de alto padrão sediada em Leominster, Massachusetts. Zero transparência, caimento escultural e atendimento concierge nos Estados Unidos.',
    'footer.location': 'Leominster, MA 01453 • Estados Unidos',
    'footer.phone': 'Telefone / WhatsApp: +1 (978) 313-9452',
    'footer.insta': 'Instagram: @anafitnessweareua',
    'footer.payments': 'FORMAS DE PAGAMENTO ACEITAS',
    'footer.paymentsDesc': 'Apple Pay, Cartões de Crédito e Débito (Visa, Mastercard, Amex, Discover), Zelle e Venmo.',
    'footer.returns': '30 DIAS PARA TROCAS E DEVOLUÇÕES',
    'footer.returnsDesc': 'Garantia total de satisfação. Troca simplificada em até 30 dias após o recebimento.',

    // Shipping page
    'ship.title': 'POLÍTICA DE ENVIO DOMÉSTICO (EUA)',
    'ship.subtitle': 'Entregas rápidas para todos os 50 estados dos Estados Unidos via USPS e transportadoras parceiras.',
    'ship.flatRateTitle': 'TAXA FIXA DE FRETE STANDARD: $9.99',
    'ship.flatRateDesc': 'Independente do estado ou quantidade de peças no pedido, o frete doméstico é fixo em apenas $9.99 com código de rastreamento enviado via e-mail e SMS.',
    'ship.prepTitle': 'PRAZO DE PREPARAÇÃO E DESPACHO',
    'ship.prepDesc': 'Seu pedido é separado, conferido e despachado em 1 a 5 dias úteis a partir da nossa sede em Massachusetts.',

    // Returns page
    'ret.title': 'POLÍTICA DE TROCAS E DEVOLUÇÕES (EUA)',
    'ret.subtitle': 'Prazo estendido de 30 dias após o recebimento para que você experimente suas peças com tranquilidade.',
    'ret.condTitle': 'CONDIÇÕES DAS PEÇAS',
    'ret.condDesc': 'Sem sinais de uso, não lavadas, sem manchas ou odores, com etiquetas originais afixadas.',
    'ret.shippingNote': 'O frete de devolução é por conta do cliente, exceto em caso de produto incorreto ou defeito comprovado de fábrica.',

    // Contact
    'contact.title': 'CENTRAL DE ATENDIMENTO & CONCIERGE',
    'contact.subtitle': 'Fale conosco para tirar dúvidas de medidas, consultar modelos com bojo removível ou verificar o status do seu pedido.',
    'contact.address': 'Leominster, MA 01453 • Estados Unidos',
    'contact.call': '+1 (978) 313-9452',
    'contact.chatWhatsApp': 'CONVERSAR NO WHATSAPP',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('ana_lang') as Language;
    if (saved === 'pt' || saved === 'en') {
      setLangState(saved);
    } else {
      setLangState('en');
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('ana_lang', newLang);
    } catch (e) {
      // ignore
    }
  };

  const t = (key: string): string => {
    const table = DICTIONARY[lang] || DICTIONARY.en;
    return table[key] || DICTIONARY.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
