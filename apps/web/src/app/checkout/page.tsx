'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Lock,
  Tag,
  CheckCircle2,
  ArrowLeft,
  ShoppingBag,
  Clock,
  Sparkles,
  Phone,
  HelpCircle,
} from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function CheckoutPage() {
  const { lang, t } = useLanguage();

  // Dados do Item no Carrinho
  const [cartItem, setCartItem] = useState({
    title: 'SAMANTA ROMPER',
    slug: 'samanta-romper',
    size: 'S',
    color: 'Preto Ônix',
    sku: 'SAM-BLK-S',
    price: 44.9,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80',
  });

  // Carrega o item real selecionado pelo cliente
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ana_cart_item');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCartItem((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {}
  }, []);

  // Endereço de Envio nos EUA
  const [shippingForm, setShippingForm] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    apt: '',
    city: '',
    state: 'MA',
    zip: '',
  });

  // Pagamento Online
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'APPLE_PAY' | 'ZELLE' | 'VENMO'>('CARD');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  // Cupom de Vendedora (Comissão Oculta para o Cliente)
  const [couponInput, setCouponInput] = useState('CAMILA10');
  const [appliedCoupon, setAppliedCoupon] = useState<'CAMILA10' | null>('CAMILA10');
  const [discountPercent, setDiscountPercent] = useState(10); // 10% desconto do cupom

  // Status de Finalização
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<null | string>(null);

  // Cálculos Financeiros
  const subtotal = cartItem.price * cartItem.quantity;
  const discountAmount = appliedCoupon ? (subtotal * discountPercent) / 100 : 0;
  const shippingRate = 9.99; // Taxa fixa de frete para todos os EUA
  const total = subtotal - discountAmount + shippingRate;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (clean === 'CAMILA10' || clean === 'JULIANA10' || clean === 'ANA10') {
      setAppliedCoupon('CAMILA10');
      setDiscountPercent(10);
    } else {
      alert(lang === 'pt' ? 'Cupom inválido ou expirado.' : 'Invalid or expired promo code.');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedOrderId = `ANA-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await fetch('/api/backoffice/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: generatedOrderId,
          channel: 'ONLINE',
          customer_name: `${shippingForm.firstName || 'Cliente'} ${shippingForm.lastName || 'Online'}`,
          customer_email: shippingForm.email || 'cliente@exemplo.com',
          customer_phone: shippingForm.phone || '+1 978 313-9452',
          seller_name: appliedCoupon === 'CAMILA10' ? 'Camila (Embaixadora)' : 'Loja Oficial Online',
          coupon_code: appliedCoupon,
          payment_method: paymentMethod,
          subtotal_products: subtotal,
          discount_amount: discountAmount,
          shipping_fee: shippingRate,
          shipping_cost: 7.50, // Custo real USPS Ground Advantage
          items: [
            {
              title: cartItem.title,
              size: cartItem.size,
              color: cartItem.color,
              sku: (cartItem as any).sku || 'ANA-ITEM',
              quantity: cartItem.quantity,
              unit_price: cartItem.price,
              cost_price: 15.0,
            },
          ],
        }),
      });
    } catch (err) {
      console.warn('Erro ao registrar venda na API:', err);
    }

    setIsSubmitting(false);
    setOrderComplete(generatedOrderId);
  };

  if (orderComplete) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8 animate-fadeIn">
        <div className="w-16 h-16 bg-gold text-deep-black rounded-full flex items-center justify-center mx-auto shadow-luxury">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
            {lang === 'pt' ? 'PAGAMENTO PROCESSADO COM SUCESSO' : 'PAYMENT PROCESSED SUCCESSFULLY'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-deep-black">
            {lang === 'pt' ? 'OBRIGADO PELO SEU PEDIDO!' : 'THANK YOU FOR YOUR ORDER!'}
          </h1>
          <p className="text-xs uppercase tracking-wider text-deep-black/60 font-bold">
            {lang === 'pt' ? `NÚMERO DO PEDIDO: #${orderComplete}` : `ORDER NUMBER: #${orderComplete}`}
          </p>
        </div>

        <div className="p-6 bg-white border-2 border-deep-black text-left space-y-4 max-w-xl mx-auto">
          <h3 className="text-xs font-black uppercase tracking-wider text-deep-black border-b border-deep-black/10 pb-2">
            {lang === 'pt' ? 'DETALHES DO ENVIO DOMÉSTICO (EUA)' : 'DOMESTIC US SHIPPING DETAILS'}
          </h3>
          <div className="text-xs space-y-1 text-deep-black/80 uppercase font-medium">
            <p><strong>{lang === 'pt' ? 'Cliente' : 'Customer'}:</strong> {shippingForm.firstName || 'Cliente'} {shippingForm.lastName}</p>
            <p><strong>{lang === 'pt' ? 'Destino' : 'Destination'}:</strong> {shippingForm.address || 'Leominster'}, {shippingForm.city || 'MA'} {shippingForm.state} {shippingForm.zip || '01453'}</p>
            <p><strong>{lang === 'pt' ? 'Prazo de Preparação' : 'Handling Time'}:</strong> 1 a 5 dias úteis com rastreamento USPS</p>
            <p><strong>{lang === 'pt' ? 'Total Pago' : 'Total Paid'}:</strong> <span className="font-bold text-gold font-mono">${total.toFixed(2)}</span></p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/"
            className="px-8 py-3.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-widest transition"
          >
            {lang === 'pt' ? 'VOLTAR À PÁGINA INICIAL' : 'RETURN TO HOME'}
          </Link>
          <a
            href={`https://wa.me/19783139452?text=Hello%2C%20I%20just%20placed%20order%20%23${orderComplete}%20on%20the%20website.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 bg-gold text-deep-black hover:bg-deep-black hover:text-gold text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span>{lang === 'pt' ? 'ACOMPANHAR NO WHATSAPP' : 'TRACK ON WHATSAPP'}</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-10 bg-white">
      {/* Header do Checkout do Cliente */}
      <div className="flex items-center justify-between border-b border-deep-black/10 pb-6">
        <Link
          href="/"
          className="text-xs font-bold uppercase tracking-wider text-deep-black/60 hover:text-deep-black flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'pt' ? 'CONTINUAR COMPRANDO' : 'CONTINUE SHOPPING'}</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-deep-black">
          <Lock className="w-4 h-4 text-gold" />
          <span>{lang === 'pt' ? 'CHECKOUT ONLINE 100% SEGURO' : '100% SECURE ONLINE CHECKOUT'}</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* =========================================================================
            COLUNA ESQUERDA: DADOS DE ENVIO & FORMAS DE PAGAMENTO DO CLIENTE
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. Endereço de Envio nos EUA */}
          <div className="bg-white border-2 border-deep-black p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <Truck className="w-4 h-4 text-gold" />
                <span>{lang === 'pt' ? '1. ENDEREÇO DE ENTREGA NOS ESTADOS UNIDOS' : '1. DOMESTIC US SHIPPING ADDRESS'}</span>
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider text-gold">
                FLAT RATE $9.99
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? 'E-MAIL (PARA RASTREIO):' : 'EMAIL (FOR TRACKING UPDATES):'}
                </label>
                <input
                  type="email"
                  required
                  value={shippingForm.email}
                  onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? 'TELEFONE (NOTIFICAÇÕES SMS):' : 'PHONE (SMS NOTIFICATIONS):'}
                </label>
                <input
                  type="tel"
                  required
                  value={shippingForm.phone}
                  onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                  placeholder="+1 (978) 000-0000"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? 'PRIMEIRO NOME:' : 'FIRST NAME:'}
                </label>
                <input
                  type="text"
                  required
                  value={shippingForm.firstName}
                  onChange={(e) => setShippingForm({ ...shippingForm, firstName: e.target.value })}
                  placeholder="Ex: Amanda"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? 'SOBRENOME:' : 'LAST NAME:'}
                </label>
                <input
                  type="text"
                  required
                  value={shippingForm.lastName}
                  onChange={(e) => setShippingForm({ ...shippingForm, lastName: e.target.value })}
                  placeholder="Ex: Silva"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                {lang === 'pt' ? 'ENDEREÇO (STREET ADDRESS):' : 'STREET ADDRESS:'}
              </label>
              <input
                type="text"
                required
                value={shippingForm.address}
                onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                placeholder="Ex: 123 Main Street"
                className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? 'CIDADE:' : 'CITY:'}
                </label>
                <input
                  type="text"
                  required
                  value={shippingForm.city}
                  onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                  placeholder="Ex: Leominster"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? 'ESTADO (US STATE):' : 'STATE:'}
                </label>
                <select
                  value={shippingForm.state}
                  onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black bg-white"
                >
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  ZIP CODE:
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={shippingForm.zip}
                  onChange={(e) => setShippingForm({ ...shippingForm, zip: e.target.value })}
                  placeholder="01453"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>
            </div>
          </div>

          {/* 2. Formas de Pagamento Online */}
          <div className="bg-white border-2 border-deep-black p-6 sm:p-8 space-y-5">
            <div className="border-b border-deep-black/10 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" />
                <span>{lang === 'pt' ? '2. FORMA DE PAGAMENTO' : '2. PAYMENT METHOD'}</span>
              </h2>
            </div>

            {/* Abas de Seleção de Pagamento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider border transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'CARD'
                    ? 'border-deep-black bg-deep-black text-white'
                    : 'border-deep-black/20 text-deep-black hover:border-gold'
                }`}
              >
                <CreditCard className="w-4 h-4 text-gold" />
                <span>CREDIT CARD</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('APPLE_PAY')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider border transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'APPLE_PAY'
                    ? 'border-deep-black bg-deep-black text-white'
                    : 'border-deep-black/20 text-deep-black hover:border-gold'
                }`}
              >
                <Sparkles className="w-4 h-4 text-gold" />
                <span>APPLE PAY</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ZELLE')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider border transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'ZELLE'
                    ? 'border-deep-black bg-deep-black text-white'
                    : 'border-deep-black/20 text-deep-black hover:border-gold'
                }`}
              >
                <span className="font-mono text-gold font-black">ZELLE</span>
                <span>ZELLE PAY</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('VENMO')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider border transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'VENMO'
                    ? 'border-deep-black bg-deep-black text-white'
                    : 'border-deep-black/20 text-deep-black hover:border-gold'
                }`}
              >
                <span className="font-mono text-gold font-black">VENMO</span>
                <span>VENMO PAY</span>
              </button>
            </div>

            {/* Formulário de Cartão de Crédito */}
            {paymentMethod === 'CARD' && (
              <div className="p-4 border border-deep-black/20 bg-white space-y-3 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                    {lang === 'pt' ? 'NÚMERO DO CARTÃO:' : 'CARD NUMBER:'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    placeholder="4000 1234 5678 9010"
                    className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                      {lang === 'pt' ? 'VALIDADE (MM/AA):' : 'EXPIRATION (MM/YY):'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                      placeholder="12/28"
                      className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                      CVV / CVC:
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      placeholder="123"
                      className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Apple Pay Direct */}
            {paymentMethod === 'APPLE_PAY' && (
              <div className="p-4 bg-deep-black text-white text-center space-y-2 animate-fadeIn border border-gold">
                <span className="text-xs font-black uppercase tracking-widest text-gold block">
                  APPLE PAY INSTANT CHECKOUT
                </span>
                <p className="text-xs text-white/80 uppercase">
                  {lang === 'pt'
                    ? 'Clique no botão abaixo para autorizar o pagamento com Face ID ou Touch ID.'
                    : 'Click Place Order to authorize payment with Touch ID or Face ID.'}
                </p>
              </div>
            )}

            {/* Instruções Zelle */}
            {paymentMethod === 'ZELLE' && (
              <div className="p-4 border border-gold bg-gold/5 space-y-2 animate-fadeIn text-xs text-deep-black">
                <h4 className="font-black uppercase tracking-wider text-deep-black">
                  {lang === 'pt' ? 'COMO PAGAR VIA ZELLE:' : 'HOW TO PAY VIA ZELLE:'}
                </h4>
                <p className="text-deep-black/80 font-medium leading-relaxed">
                  {lang === 'pt'
                    ? 'Envie o valor total para o Zelle oficial da loja: '
                    : 'Send the total amount to the official store Zelle: '}
                  <strong className="text-deep-black font-mono font-bold">+1 (978) 313-9452</strong> ou <strong className="text-deep-black font-mono">orders@anafitwear.com</strong>.
                </p>
                <p className="text-[10px] text-deep-black/60 uppercase">
                  {lang === 'pt'
                    ? 'Seu pedido será confirmado automaticamente assim que a transferência for identificada.'
                    : 'Your order will be confirmed immediately once the transfer is verified.'}
                </p>
              </div>
            )}

            {/* Instruções Venmo */}
            {paymentMethod === 'VENMO' && (
              <div className="p-4 border border-deep-black/30 bg-white space-y-2 animate-fadeIn text-xs text-deep-black">
                <h4 className="font-black uppercase tracking-wider text-deep-black">
                  {lang === 'pt' ? 'COMO PAGAR VIA VENMO:' : 'HOW TO PAY VIA VENMO:'}
                </h4>
                <p className="text-deep-black/80 font-medium leading-relaxed">
                  {lang === 'pt'
                    ? 'Envie o valor para nosso Venmo: '
                    : 'Send payment to our Venmo account: '}
                  <strong className="text-deep-black font-mono font-bold">@anafitnessweareua</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            COLUNA DIREITA: RESUMO DO PEDIDO & CUPOM (SEM COMISSÃO DE VENDEDORA)
           ========================================================================= */}
        <div className="lg:col-span-5 bg-white border-2 border-deep-black p-6 sm:p-8 space-y-6 shadow-luxury">
          <div className="border-b border-deep-black/10 pb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
              <span>{lang === 'pt' ? 'RESUMO DA SACOLA' : 'ORDER SUMMARY'}</span>
              <span className="text-xs text-deep-black/50 font-bold">1 ITEM</span>
            </h3>
          </div>

          {/* Item no Carrinho */}
          <div className="flex gap-4 items-center border-b border-deep-black/10 pb-4">
            <img
              src={cartItem.image}
              alt={cartItem.title}
              className="w-16 h-20 object-cover border border-deep-black/20"
            />
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
                {cartItem.title}
              </h4>
              <p className="text-[10px] text-deep-black/60 uppercase font-mono font-bold">
                {lang === 'pt' ? 'TAMANHO' : 'SIZE'}: {cartItem.size} • {cartItem.color}
              </p>
              <span className="text-[10px] text-gold font-black uppercase">
                {lang === 'pt' ? 'ZERO TRANSPARÊNCIA' : 'ZERO SEE-THROUGH'}
              </span>
            </div>
            <span className="text-sm font-black text-deep-black font-mono">
              ${cartItem.price.toFixed(2)}
            </span>
          </div>

          {/* Inserção de Cupom da Vendedora */}
          <div className="space-y-2 border-b border-deep-black/10 pb-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-gold" />
              <span>{lang === 'pt' ? 'CUPOM DE DESCONTO / VENDEDORA:' : 'AMBASSADOR / PROMO CODE:'}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="EX: CAMILA10"
                className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-[10px] font-black uppercase tracking-widest transition"
              >
                {lang === 'pt' ? 'APLICAR' : 'APPLY'}
              </button>
            </div>

            {/* Mensagem Limpa para o Cliente (ZERO Menção de Comissão!) */}
            {appliedCoupon && (
              <p className="text-[10px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                <span>{lang === 'pt' ? '✓ CUPOM ATIVO • 10% DE DESCONTO APLICADO' : '✓ CODE APPLIED • 10% OFF DISCOUNT'}</span>
              </p>
            )}
          </div>

          {/* Discriminação de Valores */}
          <div className="space-y-2.5 text-xs uppercase tracking-wider">
            <div className="flex justify-between text-deep-black/70">
              <span>{lang === 'pt' ? 'SUBTOTAL:' : 'SUBTOTAL:'}</span>
              <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-gold font-bold">
                <span>{lang === 'pt' ? 'DESCONTO (10%):' : 'DISCOUNT (10%):'}</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-deep-black/70">
              <span className="flex items-center gap-1">
                <span>{lang === 'pt' ? 'FRETE DOMÉSTICO (EUA):' : 'DOMESTIC US SHIPPING:'}</span>
              </span>
              <span className="font-mono font-bold">${shippingRate.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg sm:text-xl font-black text-deep-black pt-3 border-t-2 border-deep-black">
              <span>TOTAL:</span>
              <span className="text-gold font-mono">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* BOTÃO OFICIAL DE COMPRA ONLINE */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-deep-black hover:bg-gold text-white hover:text-deep-black disabled:opacity-50 text-xs sm:text-sm font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-luxury"
            >
              {isSubmitting ? (
                <span>{lang === 'pt' ? 'PROCESSANDO COMPRA...' : 'PROCESSING ORDER...'}</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-gold" />
                  <span>
                    {lang === 'pt'
                      ? `FINALIZAR COMPRA ONLINE • $${total.toFixed(2)}`
                      : `PLACE ORDER NOW • $${total.toFixed(2)}`}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-deep-black/60 font-bold uppercase tracking-wider pt-2">
              <ShieldCheck className="w-4 h-4 text-gold" />
              <span>30-DAY HASSLE-FREE RETURNS • ENCRYPTED SSL</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
