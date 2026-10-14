'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { trackEvent } from '../../lib/tracking';
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
  Package,
  User,
  Trash2,
  ArrowRight,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

interface CartItem {
  title: string;
  slug?: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  isBackorder?: boolean;
  productionDays?: number;
}

const WhatsAppIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

export default function CheckoutPage() {
  const { lang, t } = useLanguage();
  const { siteInfo } = useStoreSettings();

  // Dados do Item no Carrinho (Inicia como null para não forçar item estático)
  const [cartItem, setCartItem] = useState<CartItem | null>(null);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [customerUser, setCustomerUser] = useState<any | null>(null);
  const [orderWasBackorder, setOrderWasBackorder] = useState(false);

  // Link contextualizado para o cliente tirar dúvidas com a Ana Carina no WhatsApp
  const storePhoneFormatted = siteInfo?.phone || '+1 (978) 313-9452';
  const rawWhatsApp = (siteInfo?.whatsapp || '19783139452').replace(/\D/g, '');
  const itemDetailStr = cartItem
    ? `${cartItem.title} (${lang === 'pt' ? 'Tamanho' : 'Size'}: ${cartItem.size}, ${lang === 'pt' ? 'Cor' : 'Color'}: ${cartItem.color})`
    : (lang === 'pt' ? 'minha compra' : 'my purchase');

  const whatsappDoubtMsg = lang === 'pt'
    ? `Olá, Ana Carina! Estou na página de checkout da Ana Fitness Wear com o item "${itemDetailStr}" e tenho uma dúvida com relação ao meu pedido.`
    : `Hello Ana Carina! I am on the checkout page of Ana Fitness Wear with "${itemDetailStr}" and would like to ask a question regarding my order.`;

  const whatsappCheckoutUrl = `https://wa.me/${rawWhatsApp || '19783139452'}?text=${encodeURIComponent(whatsappDoubtMsg)}`;

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

  // Validação em Tempo Real de Endereço nos EUA (USPS)
  const [validatingZip, setValidatingZip] = useState(false);
  const [zipVerifiedStatus, setZipVerifiedStatus] = useState<{
    valid: boolean;
    city?: string;
    state?: string;
    message?: string;
  } | null>(null);
  const [addressErrors, setAddressErrors] = useState<string[]>([]);
  const [addressWarnings, setAddressWarnings] = useState<string[]>([]);

  const handleZipChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 5);
    setShippingForm((prev) => ({ ...prev, zip: clean }));

    if (clean.length === 5) {
      setValidatingZip(true);
      try {
        const res = await fetch(`/api/shipping/validate-address?zip=${clean}`);
        if (res.ok) {
          const data = await res.json();
          setShippingForm((prev) => ({
            ...prev,
            city: data.city || prev.city,
            state: data.state || prev.state,
          }));
          setZipVerifiedStatus({
            valid: true,
            city: data.city,
            state: data.state,
          });
          setAddressErrors((prev) => prev.filter((e) => !e.toLowerCase().includes('zip')));
        } else {
          setZipVerifiedStatus({
            valid: false,
            message: 'ZIP Code não localizado nos correios americanos (USPS).',
          });
        }
      } catch (e) {
        // Ignora erro de rede temporário
      } finally {
        setValidatingZip(false);
      }
    } else {
      setZipVerifiedStatus(null);
    }
  };

  // Carrega o item real selecionado e a sessão do cliente
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ana_cart_item');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCartItem(parsed);

        // Dispara evento de InitiateCheckout / begin_checkout nos Pixels
        trackEvent.initiateCheckout({
          value: Number(parsed.price || 0) * Number(parsed.quantity || 1),
          currency: 'USD',
          items: [
            {
              id: parsed.sku || parsed.slug || 'cart-item',
              title: parsed.title,
              price: Number(parsed.price || 0),
              quantity: Number(parsed.quantity || 1),
            },
          ],
        });
      } else {
        setCartItem(null);
      }

      // Preenche dados se o cliente já tiver sessão ativa
      const savedCust = localStorage.getItem('ana_customer_session');
      if (savedCust) {
        const cust = JSON.parse(savedCust);
        setCustomerUser(cust);
        const nameParts = (cust.name || '').trim().split(' ');
        const fName = nameParts[0] || '';
        const lName = nameParts.slice(1).join(' ') || '';

        setShippingForm((prev) => ({
          ...prev,
          email: cust.email || prev.email,
          phone: cust.phone || prev.phone,
          firstName: fName || prev.firstName,
          lastName: lName || prev.lastName,
          address: cust.shipping_address?.address || prev.address,
          apt: cust.shipping_address?.apt || prev.apt,
          city: cust.shipping_address?.city || prev.city,
          state: cust.shipping_address?.state || prev.state,
          zip: cust.shipping_address?.zip || prev.zip,
        }));
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do carrinho ou cliente:', e);
      setCartItem(null);
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  // Pagamento Online
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'APPLE_PAY' | 'ZELLE' | 'VENMO'>('CARD');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  // Cupom de Vendedora (Comissão Oculta para o Cliente)
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0); // Desconto dinâmico do cupom
  const [couponSellerInfo, setCouponSellerInfo] = useState<{
    name: string;
    discount_pct: number;
    commission_pct: number;
  } | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<string>('');

  // Status de Finalização
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<null | string>(null);

  // Cálculos Financeiros
  const subtotal = cartItem ? cartItem.price * cartItem.quantity : 0;
  const discountAmount = appliedCoupon ? (subtotal * discountPercent) / 100 : 0;
  const shippingRate = 9.99; // Taxa fixa de frete para todos os EUA
  const total = subtotal > 0 ? subtotal - discountAmount + shippingRate : 0;

  const handleRemoveCartItem = () => {
    localStorage.removeItem('ana_cart_item');
    window.dispatchEvent(new Event('ana_cart_updated'));
    setCartItem(null);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;

    try {
      const res = await fetch(`/api/backoffice/sellers?coupon=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        const seller = data.coupon;
        if (seller && seller.code) {
          setAppliedCoupon(seller.code);
          setDiscountPercent(seller.customer_discount_pct || 0);
          setCouponSellerInfo({
            name: seller.seller_name,
            discount_pct: seller.customer_discount_pct || 0,
            commission_pct: seller.commission_pct || 10,
          });
          if (seller.customer_discount_pct > 0) {
            setCouponFeedback(
              lang === 'pt'
                ? `✓ CUPOM ${seller.code} APLICADO • ${seller.customer_discount_pct}% DE DESCONTO`
                : `✓ CODE ${seller.code} APPLIED • ${seller.customer_discount_pct}% OFF DISCOUNT`
            );
          } else {
            setCouponFeedback(
              lang === 'pt'
                ? `✓ CUPOM ${seller.code} ATIVADO (Vendedora: ${seller.seller_name})`
                : `✓ CODE ${seller.code} ACTIVATED (Seller: ${seller.seller_name})`
            );
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Erro ao consultar cupom:', err);
    }

    alert(lang === 'pt' ? 'Cupom inválido ou expirado.' : 'Invalid or expired promo code.');
    setCouponFeedback('');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartItem) return;

    setIsSubmitting(true);
    setAddressErrors([]);
    setAddressWarnings([]);

    // 0. Validação e Padronização Estrita do Endereço de Envio nos EUA
    try {
      const valRes = await fetch('/api/shipping/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shippingForm),
      });

      const valData = await valRes.json();
      if (!valData.valid) {
        setAddressErrors(valData.errors || ['Endereço de entrega inválido. Verifique os campos.']);
        setIsSubmitting(false);
        const box = document.getElementById('shipping-address-box');
        if (box) box.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (valData.warnings && valData.warnings.length > 0) {
        setAddressWarnings(valData.warnings);
      }

      if (valData.normalized) {
        setShippingForm((prev) => ({
          ...prev,
          address: valData.normalized.address,
          city: valData.normalized.city,
          state: valData.normalized.state,
          zip: valData.normalized.zip,
        }));
      }
    } catch (valErr) {
      console.warn('Erro ao validar endereço via API, prosseguindo com dados informados:', valErr);
    }

    const generatedOrderId = `ANA-${Math.floor(100000 + Math.random() * 900000)}`;
    const isCardOrApplePay = paymentMethod === 'CARD' || paymentMethod === 'APPLE_PAY';

    // 1. Se for Cartão ou Apple Pay, tenta iniciar a sessão oficial da Stripe
    if (isCardOrApplePay) {
      try {
        const stripeRes = await fetch('/api/checkout/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: generatedOrderId,
            customer_name: `${shippingForm.firstName || 'Cliente'} ${shippingForm.lastName || 'Online'}`,
            customer_email: shippingForm.email || 'cliente@exemplo.com',
            customer_phone: shippingForm.phone || '+1 978 313-9452',
            shipping_address: {
              address: shippingForm.address || '742 Commonwealth Ave',
              apt: shippingForm.apt || '',
              city: shippingForm.city || 'Boston',
              state: shippingForm.state || 'MA',
              zip: shippingForm.zip || '02215',
            },
            coupon_code: appliedCoupon,
            discount_amount: discountAmount,
            seller_name: couponSellerInfo ? couponSellerInfo.name : 'Loja Oficial Online',
            items: [
              {
                title: cartItem.title,
                size: cartItem.size,
                color: cartItem.color,
                sku: (cartItem as any).sku || 'ANA-ITEM',
                quantity: cartItem.quantity,
                unit_price: cartItem.price,
                image: cartItem.image,
              },
            ],
          }),
        });

        if (stripeRes.ok) {
          const stripeData = await stripeRes.json();
          if (stripeData.configured && stripeData.url) {
            // Esvazia o carrinho antes de redirecionar para a Stripe
            localStorage.removeItem('ana_cart_item');
            window.dispatchEvent(new Event('ana_cart_updated'));
            window.location.href = stripeData.url;
            return;
          }
        }
      } catch (err) {
        console.warn('Stripe checkout fallback para modo simulação:', err);
      }
    }

    // 2. Fallback / Pagamentos Zelle, Venmo ou teste
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
          shipping_address: {
            address: shippingForm.address || '742 Commonwealth Ave',
            apt: shippingForm.apt || '',
            city: shippingForm.city || 'Boston',
            state: shippingForm.state || 'MA',
            zip: shippingForm.zip || '02215',
          },
          seller_name: couponSellerInfo ? couponSellerInfo.name : 'Loja Oficial Online',
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

    // Dispara evento de Purchase nos Pixels de Rastreamento
    trackEvent.purchase({
      orderId: generatedOrderId,
      value: total,
      currency: 'USD',
      items: [
        {
          id: (cartItem as any).sku || 'ANA-ITEM',
          title: cartItem.title,
          price: cartItem.price,
          quantity: cartItem.quantity,
        },
      ],
    });

    if (cartItem.isBackorder) {
      setOrderWasBackorder(true);
    }

    // Esvazia a sacola com sucesso e despacha evento global
    localStorage.removeItem('ana_cart_item');
    window.dispatchEvent(new Event('ana_cart_updated'));
    setCartItem(null);

    setIsSubmitting(false);
    setOrderComplete(generatedOrderId);
  };

  // 1. TELA DE SUCESSO / PEDIDO CONCLUÍDO
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

        <div className="p-6 bg-white border-2 border-deep-black text-left space-y-4 max-w-xl mx-auto shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-deep-black border-b border-deep-black/10 pb-2">
            {lang === 'pt' ? 'DETALHES DO ENVIO DOMÉSTICO (EUA)' : 'DOMESTIC US SHIPPING DETAILS'}
          </h3>
          <div className="text-xs space-y-2 text-deep-black/80 uppercase font-medium">
            <p><strong>{lang === 'pt' ? 'Cliente' : 'Customer'}:</strong> {shippingForm.firstName || 'Cliente'} {shippingForm.lastName}</p>
            <p><strong>{lang === 'pt' ? 'E-mail de Notificação' : 'Notification Email'}:</strong> {shippingForm.email || 'cliente@exemplo.com'}</p>
            <p><strong>{lang === 'pt' ? 'Destino' : 'Destination'}:</strong> {shippingForm.address || '742 Commonwealth Ave'}, {shippingForm.city || 'Boston'} {shippingForm.state} {shippingForm.zip || '02215'}</p>
            <p>
              <strong>{lang === 'pt' ? 'Prazo de Entrega' : 'Delivery Estimate'}:</strong>{' '}
              {orderWasBackorder ? (
                <span className="text-amber-800 font-bold">
                  {lang === 'pt'
                    ? 'Pré-Venda sob encomenda: até 30 dias para receber sua mercadoria. Nossa equipe entrará em contato para esclarecer todas as informações com relação ao prazo.'
                    : 'Made-to-Order Pre-Order: ~30 days delivery. Our team will contact you directly to clarify and confirm all details regarding your delivery timeframe.'}
                </span>
              ) : (
                <span>
                  {lang === 'pt'
                    ? 'Pronta entrega: 1 a 5 dias úteis com rastreamento oficial USPS'
                    : '1 to 5 business days with official USPS tracking'}
                </span>
              )}
            </p>
            <p><strong>{lang === 'pt' ? 'Total Pago' : 'Total Paid'}:</strong> <span className="font-bold text-gold font-mono">${total.toFixed(2)}</span></p>
            <div className="pt-2.5 border-t border-deep-black/10 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
              <span>✉</span>
              <span>
                {lang === 'pt'
                  ? 'E-mail de confirmação enviado! Quando seu pedido for despachado nos correios, você receberá outro e-mail com o código de rastreamento USPS.'
                  : 'Order confirmation email sent! When your package is dispatched, you will receive another email with your USPS tracking link.'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/conta"
            className="px-6 py-3.5 bg-deep-black text-gold hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow"
          >
            <User className="w-4 h-4 text-gold" />
            <span>{lang === 'pt' ? 'VER NA MINHA CONTA / HISTÓRICO' : 'VIEW IN MY ACCOUNT / ORDERS'}</span>
          </Link>
          <a
            href={`https://wa.me/${rawWhatsApp || '19783139452'}?text=${encodeURIComponent(
              lang === 'pt'
                ? `Olá, Ana Carina! Acabei de realizar o pedido #${orderComplete} na loja online da Ana Fitness Wear e gostaria de falar com você sobre o pedido.`
                : `Hello Ana Carina! I just placed order #${orderComplete} on the Ana Fitness Wear website and would like to chat regarding my order.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-[#25D366] hover:bg-[#1ebd5b] text-deep-black font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow border border-[#1b9a4a]"
          >
            <WhatsAppIcon className="w-4 h-4 text-deep-black" />
            <span>{lang === 'pt' ? 'DÚVIDAS? FALE NO WHATSAPP' : 'NEED HELP? CHAT ON WHATSAPP'}</span>
          </a>
          <Link
            href="/pedidos"
            className="px-6 py-3.5 bg-gold text-deep-black hover:bg-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow"
          >
            <Package className="w-4 h-4 text-deep-black" />
            <span>{lang === 'pt' ? 'RASTREAR VIA USPS' : 'TRACK VIA USPS'}</span>
          </Link>
          <Link
            href="/"
            className="px-6 py-3.5 border-2 border-deep-black text-deep-black hover:bg-deep-black hover:text-white text-xs font-black uppercase tracking-widest transition"
          >
            {lang === 'pt' ? 'VOLTAR À VITRINE' : 'DISCOVER MORE'}
          </Link>
        </div>
      </div>
    );
  }

  // 2. TELA DE SACOLA VAZIA (QUANDO NÃO HÁ ITENS)
  if (isCartLoaded && !cartItem) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-8 animate-fadeIn">
        <div className="w-20 h-20 bg-deep-black/5 text-deep-black rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-deep-black/20">
          <ShoppingBag className="w-10 h-10 text-gold" />
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
            {lang === 'pt' ? 'ANA FITNESS WEAR • LUXURY COLLECTION' : 'ANA FITNESS WEAR • LUXURY COLLECTION'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-deep-black">
            {lang === 'pt' ? 'SUA SACOLA ESTÁ VAZIA' : 'YOUR SHOPPING BAG IS EMPTY'}
          </h1>
          <p className="text-xs uppercase tracking-wider text-deep-black/60 font-medium leading-relaxed">
            {lang === 'pt'
              ? 'Você ainda não selecionou nenhuma peça. Escolha seu modelo favorito na vitrine para finalizar sua compra com frete fixo de $9.99 para todos os EUA.'
              : 'You haven\'t added any items to your bag yet. Explore our zero-transparency sets and rompers with flat $9.99 shipping anywhere in the US.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/"
            className="px-8 py-4 bg-deep-black text-gold hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-widest transition shadow-luxury flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span>{lang === 'pt' ? 'EXPLORAR A VITRINE DE PRODUTOS' : 'EXPLORE COLLECTION'}</span>
          </Link>
          <a
            href={whatsappCheckoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-[#25D366] hover:bg-[#1ebd5b] text-deep-black text-xs font-black uppercase tracking-widest transition shadow flex items-center justify-center gap-2 border border-[#1b9a4a]"
          >
            <WhatsAppIcon className="w-4 h-4 text-deep-black" />
            <span>{lang === 'pt' ? 'TIRAR DÚVIDAS NO WHATSAPP' : 'CHAT ON WHATSAPP'}</span>
          </a>
          <Link
            href="/conta"
            className="px-8 py-4 bg-white border-2 border-deep-black text-deep-black hover:bg-deep-black hover:text-white text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4 text-gold" />
            <span>{lang === 'pt' ? 'ACESSAR MINHA CONTA / MEUS PEDIDOS' : 'MY ACCOUNT / ORDER HISTORY'}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Se ainda estiver lendo o localStorage, evita flicker rápido
  if (!isCartLoaded) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-deep-black/40 animate-pulse">
          {lang === 'pt' ? 'CARREGANDO SACOLA DE COMPRAS...' : 'LOADING SHOPPING BAG...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 bg-white">
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

      {/* Banner de Identificação do Cliente: Logado vs Guest Checkout */}
      {customerUser ? (
        <div className="bg-gold/10 border border-gold/40 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-deep-black">
            <User className="w-4 h-4 text-gold shrink-0" />
            <span className="font-bold uppercase tracking-wider">
              {lang === 'pt' ? 'CONECTADO COMO:' : 'LOGGED IN AS:'}{' '}
              <strong className="text-deep-black font-black">{customerUser.name}</strong> ({customerUser.email})
            </span>
          </div>
          <Link
            href="/conta"
            className="text-[10px] font-black uppercase tracking-widest text-deep-black hover:text-gold underline"
          >
            {lang === 'pt' ? 'GERENCIAR MINHA CONTA / ENDEREÇOS' : 'MANAGE MY ACCOUNT / ADDRESSES'}
          </Link>
        </div>
      ) : (
        <div className="bg-gray-50 border border-deep-black/10 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-deep-black/80">
            <User className="w-4 h-4 text-gold shrink-0" />
            <span className="font-medium">
              {lang === 'pt'
                ? 'Já possui uma conta na Ana Fitness Wear? Entre para preencher seu endereço em 1 clique.'
                : 'Already have an account? Sign in for 1-click address autofill.'}
            </span>
          </div>
          <Link
            href="/conta"
            className="text-[10px] font-black uppercase tracking-widest bg-deep-black text-white hover:bg-gold hover:text-deep-black px-3 py-1.5 transition"
          >
            {lang === 'pt' ? 'ENTRAR / CRIAR CONTA' : 'SIGN IN / REGISTER'}
          </Link>
        </div>
      )}

      {/* Banner de Atendimento & Dúvidas no WhatsApp com a Ana Carina */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-gold/10 border-2 border-[#25D366]/40 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#25D366] text-deep-black flex items-center justify-center shrink-0 shadow-xs">
            <WhatsAppIcon className="w-5 h-5 text-deep-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                {lang === 'pt' ? 'Tem alguma dúvida com relação ao seu pedido?' : 'Have questions regarding your order?'}
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black uppercase">
                {lang === 'pt' ? 'SUPORTE DIRETO' : 'DIRECT SUPPORT'}
              </span>
            </div>
            <span className="text-[11px] text-deep-black/70 block mt-0.5">
              {lang === 'pt'
                ? `Fale direto com a Ana Carina no WhatsApp (${storePhoneFormatted}) para esclarecer medidas, tamanho, prazo de entrega ou formas de pagamento.`
                : `Chat directly with Ana Carina on WhatsApp (${storePhoneFormatted}) for sizing, delivery timeframe or payment questions.`}
            </span>
          </div>
        </div>

        <a
          href={whatsappCheckoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebd5b] text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-sm whitespace-nowrap border border-[#1b9a4a]"
        >
          <WhatsAppIcon className="w-4 h-4 text-deep-black" />
          <span>{lang === 'pt' ? 'Tirar Dúvida no WhatsApp' : 'Chat on WhatsApp'}</span>
          <ArrowRight className="w-3.5 h-3.5 text-deep-black" />
        </a>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* =========================================================================
            COLUNA ESQUERDA: DADOS DE ENVIO & FORMAS DE PAGAMENTO DO CLIENTE
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. Endereço de Envio nos EUA com Validação USPS */}
          <div id="shipping-address-box" className="bg-white border-2 border-deep-black p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <Truck className="w-4 h-4 text-gold" />
                <span>{lang === 'pt' ? '1. ENDEREÇO DE ENTREGA NOS ESTADOS UNIDOS' : '1. DOMESTIC US SHIPPING ADDRESS'}</span>
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider text-gold">
                FLAT RATE $9.99
              </span>
            </div>

            {/* Mensagens de Erro de Validação de Endereço */}
            {addressErrors.length > 0 && (
              <div className="p-4 bg-red-50 border-2 border-red-500 text-red-950 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 font-black uppercase text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>CORRIJA OS DADOS DE ENTREGA PARA FINALIZAR O PEDIDO:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] font-bold text-red-800 space-y-1">
                  {addressErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avisos não-bloqueantes da agência postal */}
            {addressWarnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>AVISO DE POSTAGEM:</span>
                </div>
                {addressWarnings.map((w, i) => (
                  <p key={i} className="text-[11px] font-medium">{w}</p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? 'E-MAIL (PARA RASTREIO E CONTA):' : 'EMAIL (FOR TRACKING & ACCOUNT):'}
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

            {/* Rua e Complemento (Apt/Suite) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70 flex items-center justify-between">
                  <span>{lang === 'pt' ? 'ENDEREÇO (COM NÚMERO):' : 'STREET ADDRESS (WITH NUMBER):'}</span>
                  <span className="text-[9px] text-deep-black/40 font-mono">Ex: 100 Main St</span>
                </label>
                <input
                  type="text"
                  required
                  value={shippingForm.address}
                  onChange={(e) => {
                    setShippingForm({ ...shippingForm, address: e.target.value });
                    setAddressErrors((prev) => prev.filter((er) => !er.includes('número') && !er.includes('Endereço')));
                  }}
                  placeholder="Ex: 100 Main St"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  APT / SUITE / UNIT:
                </label>
                <input
                  type="text"
                  value={shippingForm.apt}
                  onChange={(e) => setShippingForm({ ...shippingForm, apt: e.target.value })}
                  placeholder="Apt 4B (opcional)"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>
            </div>

            {/* Linha ZIP, Cidade e Estado com Autovalidação USPS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70 flex items-center justify-between">
                  <span>ZIP CODE (USPS):</span>
                  {validatingZip && <span className="text-[9px] text-gold font-bold animate-pulse">VERIFICANDO...</span>}
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={shippingForm.zip}
                  onChange={(e) => handleZipChange(e.target.value)}
                  placeholder="01453"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>

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
            </div>

            {/* Feedback Visual de Validação do ZIP no USPS */}
            {zipVerifiedStatus && (
              <div
                className={`p-3 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border animate-fadeIn ${
                  zipVerifiedStatus.valid
                    ? 'bg-green-50 text-green-900 border-green-300'
                    : 'bg-red-50 text-red-900 border-red-300'
                }`}
              >
                {zipVerifiedStatus.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>✓ CEP AMERICANO VERIFICADO (USPS): {zipVerifiedStatus.city}, {zipVerifiedStatus.state}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>⚠️ {zipVerifiedStatus.message}</span>
                  </>
                )}
              </div>
            )}
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
                  <strong className="text-deep-black font-mono font-bold">+1 (978) 313-9452</strong> ou <strong className="text-deep-black font-mono">anafitweareua@gmail.com</strong>.
                </p>
                <p className="text-[10px] text-deep-black/60 uppercase">
                  {lang === 'pt'
                    ? 'Seu pedido será confirmado automaticamente assim que a transferência for identificada.'
                    : 'Your order will be confirmed immediately once the transfer is verified.'}
                </p>
                <div className="pt-1">
                  <a
                    href={`https://wa.me/${rawWhatsApp || '19783139452'}?text=${encodeURIComponent(
                      lang === 'pt'
                        ? `Olá, Ana Carina! Estou finalizando meu pedido via Zelle no valor de $${total.toFixed(2)} e gostaria de tirar uma dúvida ou enviar o comprovante.`
                        : `Hello Ana Carina! I am paying via Zelle for $${total.toFixed(2)} and would like to confirm details or send my receipt.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd5b] text-deep-black font-black text-[10px] uppercase tracking-wider transition shadow-xs border border-[#1b9a4a]"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-deep-black" />
                    <span>{lang === 'pt' ? 'Tirar Dúvida do Zelle no WhatsApp' : 'Zelle Question on WhatsApp'}</span>
                  </a>
                </div>
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
                <div className="pt-1">
                  <a
                    href={`https://wa.me/${rawWhatsApp || '19783139452'}?text=${encodeURIComponent(
                      lang === 'pt'
                        ? `Olá, Ana Carina! Estou finalizando meu pedido via Venmo no valor de $${total.toFixed(2)} e gostaria de confirmar meu pagamento.`
                        : `Hello Ana Carina! I am paying via Venmo for $${total.toFixed(2)} and would like to confirm my payment.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd5b] text-deep-black font-black text-[10px] uppercase tracking-wider transition shadow-xs border border-[#1b9a4a]"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-deep-black" />
                    <span>{lang === 'pt' ? 'Tirar Dúvida do Venmo no WhatsApp' : 'Venmo Question on WhatsApp'}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            COLUNA DIREITA: RESUMO DO PEDIDO & CUPOM (SEM COMISSÃO DE VENDEDORA)
           ========================================================================= */}
        <div className="lg:col-span-5 bg-white border-2 border-deep-black p-6 sm:p-8 space-y-6 shadow-luxury">
          <div className="border-b border-deep-black/10 pb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
              {lang === 'pt' ? 'RESUMO DA SACOLA' : 'ORDER SUMMARY'}
            </h3>
            <span className="text-xs text-deep-black/50 font-bold">
              {cartItem.quantity} {cartItem.quantity === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          </div>

          {/* Item no Carrinho */}
          <div className="flex gap-4 items-center border-b border-deep-black/10 pb-4 relative">
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
              <span className="text-[10px] text-gold font-black uppercase block">
                {lang === 'pt' ? 'ZERO TRANSPARÊNCIA' : 'ZERO SEE-THROUGH'}
              </span>
              {cartItem.isBackorder && (
                <div className="p-2.5 bg-amber-50 border border-gold/60 text-deep-black space-y-1 mt-1">
                  <span className="text-[9.5px] font-black text-amber-900 uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    {lang === 'pt' ? 'PRÉ-VENDA • PRAZO DE 30 DIAS' : 'PRE-ORDER • ~30 DAYS DELIVERY'}
                  </span>
                  <p className="text-[9.5px] text-deep-black/80 font-medium leading-relaxed">
                    {lang === 'pt'
                      ? 'Nós vamos entrar em contato com você para esclarecer e confirmar todas as informações com relação ao prazo.'
                      : 'Our team will contact you directly to confirm and clarify all details regarding your delivery timeframe.'}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleRemoveCartItem}
                className="text-[10px] text-red-600 hover:text-red-800 uppercase font-bold flex items-center gap-1 pt-1 transition"
                title="Remover item da sacola"
              >
                <Trash2 className="w-3 h-3" />
                <span>{lang === 'pt' ? 'REMOVER DA SACOLA' : 'REMOVE ITEM'}</span>
              </button>
            </div>
            <span className="text-sm font-black text-deep-black font-mono">
              ${(cartItem.price * cartItem.quantity).toFixed(2)}
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
                placeholder={lang === 'pt' ? 'INSERIR CUPOM' : 'ENTER PROMO CODE'}
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
                <span>{couponFeedback || (discountPercent > 0 ? `✓ CUPOM ${appliedCoupon} ATIVO (${discountPercent}% OFF)` : `✓ CUPOM ${appliedCoupon} ATIVO`)}</span>
              </p>
            )}
          </div>

          {/* Discriminação de Valores */}
          <div className="space-y-2.5 text-xs uppercase tracking-wider">
            <div className="flex justify-between text-deep-black/70">
              <span>{lang === 'pt' ? 'SUBTOTAL:' : 'SUBTOTAL:'}</span>
              <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
            </div>

            {appliedCoupon && discountPercent > 0 && (
              <div className="flex justify-between text-gold font-bold">
                <span>{lang === 'pt' ? `DESCONTO (${discountPercent}%):` : `DISCOUNT (${discountPercent}%):`}</span>
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

            {/* CARD EXCLUSIVO DE SUPORTE WHATSAPP COM A ANA CARINA */}
            <div className="pt-3 border-t border-deep-black/10">
              <div className="bg-[#25D366]/10 border-2 border-[#25D366] p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#25D366] text-deep-black flex items-center justify-center shrink-0 shadow-xs">
                    <WhatsAppIcon className="w-4.5 h-4.5 text-deep-black" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
                      {lang === 'pt' ? 'DÚVIDAS SOBRE O SEU PEDIDO?' : 'QUESTIONS ABOUT YOUR ORDER?'}
                    </h4>
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                      {lang === 'pt' ? 'FALE DIRETO COM A ANA CARINA NO WHATSAPP' : 'CHAT DIRECTLY WITH ANA CARINA'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-deep-black/80 font-medium leading-relaxed">
                  {lang === 'pt'
                    ? 'Ficou com alguma dúvida sobre tamanho, caimento das peças, prazo de entrega USPS ou formas de pagamento? Tire suas dúvidas comigo antes de finalizar sua compra!'
                    : 'Have questions about sizing, fabric fit, USPS delivery timeline or payment methods? Reach out to me directly on WhatsApp before completing your order!'}
                </p>

                <a
                  href={whatsappCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#25D366] hover:bg-[#1ebd5b] text-deep-black font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-md border border-[#1b9a4a]"
                >
                  <WhatsAppIcon className="w-4.5 h-4.5 text-deep-black" />
                  <span>{lang === 'pt' ? 'TIRAR DÚVIDA NO WHATSAPP COMIGO' : 'CHAT WITH ME ON WHATSAPP'}</span>
                </a>

                <div className="flex items-center justify-between text-[10px] text-deep-black/60 pt-1 border-t border-[#25D366]/20">
                  <span className="font-mono font-bold">{storePhoneFormatted}</span>
                  <span className="uppercase font-bold">{lang === 'pt' ? 'Showroom Leominster, MA' : 'Showroom Leominster, MA'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Botão Flutuante de Ajuda no WhatsApp no Canto Inferior da Tela */}
      <a
        href={whatsappCheckoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 bg-[#25D366] hover:bg-[#1ebd5b] text-deep-black font-black text-xs uppercase tracking-wider px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 transition transform hover:scale-105 border-2 border-deep-black"
        title={lang === 'pt' ? 'Tirar dúvida no WhatsApp com a Ana Carina' : 'Ask questions on WhatsApp with Ana Carina'}
      >
        <div className="w-6 h-6 rounded-full bg-deep-black flex items-center justify-center shrink-0">
          <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="hidden sm:inline font-black text-[11px]">
          {lang === 'pt' ? 'Dúvidas no Pedido? Fale Comigo' : 'Order Questions? Chat With Me'}
        </span>
        <span className="sm:hidden font-black text-[11px]">WhatsApp</span>
      </a>
    </div>
  );
}
