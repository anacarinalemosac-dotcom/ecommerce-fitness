import React from 'react';

export interface PaymentMethodInfo {
  code: string;
  label: string;
  shortLabel: string;
  icon: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
  isStripe: boolean;
  isDirectLink?: boolean;
}

export function getPaymentMethodDisplay(orderOrMethod: any): PaymentMethodInfo {
  let raw = '';
  let isDirect = false;

  if (typeof orderOrMethod === 'string') {
    raw = orderOrMethod.toUpperCase();
  } else if (orderOrMethod && typeof orderOrMethod === 'object') {
    raw = String(
      orderOrMethod.payment_method ||
      orderOrMethod.paymentMethod ||
      orderOrMethod.shipping_address?.payment_method ||
      orderOrMethod.shipping_address?.channel_detail ||
      'CARD'
    ).toUpperCase();
    isDirect =
      orderOrMethod.direct_link === 'true' ||
      orderOrMethod.direct_link === true ||
      orderOrMethod.shipping_address?.direct_link === 'true' ||
      orderOrMethod.shipping_address?.direct_link === true;
  }

  if (raw === 'CARD' || raw === 'CREDIT_CARD' || raw === 'DEBIT_CARD' || raw === 'STRIPE') {
    return {
      code: 'CARD',
      label: isDirect ? 'Cartão de Crédito (Link Stripe)' : 'Cartão de Crédito (Stripe)',
      shortLabel: isDirect ? 'Cartão (Link)' : 'Cartão (Stripe)',
      icon: '💳',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-950 font-black',
      borderClass: 'border-amber-400',
      description: 'Processado automaticamente via Stripe Checkout',
      isStripe: true,
      isDirectLink: isDirect,
    };
  }

  if (raw === 'ZELLE') {
    return {
      code: 'ZELLE',
      label: 'Zelle (Transferência)',
      shortLabel: 'Zelle',
      icon: '🟣',
      bgClass: 'bg-purple-100',
      textClass: 'text-purple-950 font-black',
      borderClass: 'border-purple-400',
      description: 'Chave Zelle: anafitweareua@gmail.com',
      isStripe: false,
    };
  }

  if (raw === 'VENMO') {
    return {
      code: 'VENMO',
      label: 'Venmo (@Accleaningproservices)',
      shortLabel: 'Venmo',
      icon: '🔵',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-950 font-black',
      borderClass: 'border-blue-400',
      description: 'Usuário Venmo: @Accleaningproservices',
      isStripe: false,
    };
  }

  if (raw === 'CASHAPP' || raw === 'CASH_APP') {
    return {
      code: 'CASHAPP',
      label: 'Cash App ($ACCleaningpro)',
      shortLabel: 'Cash App',
      icon: '🟢',
      bgClass: 'bg-[#00D632]/20',
      textClass: 'text-emerald-950 font-black',
      borderClass: 'border-[#00D632]/60',
      description: 'Cashtag: $ACCleaningpro',
      isStripe: false,
    };
  }

  if (raw === 'AFTERPAY') {
    return {
      code: 'AFTERPAY',
      label: isDirect ? 'Afterpay (Link Direto)' : 'Afterpay (4x sem juros)',
      shortLabel: 'Afterpay',
      icon: '✨',
      bgClass: 'bg-[#b2fce4]/70',
      textClass: 'text-emerald-950 font-black',
      borderClass: 'border-[#10b981]',
      description: 'Parcelamento em 4x sem juros via Stripe',
      isStripe: true,
      isDirectLink: isDirect,
    };
  }

  if (raw === 'AFFIRM') {
    return {
      code: 'AFFIRM',
      label: 'Affirm (Parcelado)',
      shortLabel: 'Affirm',
      icon: '⚡',
      bgClass: 'bg-[#004BFF]/15',
      textClass: 'text-[#004BFF] font-black',
      borderClass: 'border-[#004BFF]/40',
      description: 'Financiamento parcelado via Stripe',
      isStripe: true,
    };
  }

  if (raw === 'APPLE_PAY') {
    return {
      code: 'APPLE_PAY',
      label: 'Apple Pay (Stripe)',
      shortLabel: 'Apple Pay',
      icon: '🍎',
      bgClass: 'bg-stone-100',
      textClass: 'text-stone-900 font-black',
      borderClass: 'border-stone-400',
      description: 'Pagamento instantâneo Apple Pay via Stripe',
      isStripe: true,
    };
  }

  if (raw === 'CREDIARIO') {
    return {
      code: 'CREDIARIO',
      label: 'Crediário Loja (Carnê)',
      shortLabel: 'Crediário Loja',
      icon: '📒',
      bgClass: 'bg-amber-400',
      textClass: 'text-deep-black font-black',
      borderClass: 'border-amber-600',
      description: 'Parcelamento próprio no carnê da loja',
      isStripe: false,
    };
  }

  if (raw === 'CASH' || raw === 'DINHEIRO') {
    return {
      code: 'CASH',
      label: 'Dinheiro (Showroom)',
      shortLabel: 'Dinheiro Balcão',
      icon: '💵',
      bgClass: 'bg-stone-200',
      textClass: 'text-stone-900 font-black',
      borderClass: 'border-stone-400',
      description: 'Pagamento em espécie no balcão',
      isStripe: false,
    };
  }

  return {
    code: raw || 'OUTRO',
    label: raw || 'Outro Meio',
    shortLabel: raw || 'Outro',
    icon: '💳',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-900 font-black',
    borderClass: 'border-gray-300',
    description: 'Forma de pagamento registrada no pedido',
    isStripe: false,
  };
}

export interface PaymentMethodBadgeProps {
  orderOrMethod: any;
  variant?: 'compact' | 'full' | 'detailed';
  className?: string;
}

export function PaymentMethodBadge({
  orderOrMethod,
  variant = 'compact',
  className = '',
}: PaymentMethodBadgeProps) {
  const info = getPaymentMethodDisplay(orderOrMethod);
  const textToShow = variant === 'compact' ? info.shortLabel : info.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-tight border shadow-2xs whitespace-nowrap ${info.bgClass} ${info.textClass} ${info.borderClass} ${className}`}
      title={info.description}
    >
      <span className="text-xs leading-none shrink-0">{info.icon}</span>
      <span>{textToShow}</span>
      {info.isDirectLink && (
        <span className="bg-amber-600 text-white text-[8px] font-black px-1 py-0.2 rounded-xs ml-0.5">
          LINK
        </span>
      )}
    </span>
  );
}
