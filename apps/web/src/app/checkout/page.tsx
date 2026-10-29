'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { trackEvent } from '../../lib/tracking';
import { UrgencyCountdownTimer } from '../../components/UrgencyCountdownTimer';
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
  Copy,
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
      let savedCart = localStorage.getItem('ana_cart_item');
      if (!savedCart) {
        // Se a sacola foi esvaziada acidentalmente por navegação, recupera do backup
        const backupCart = localStorage.getItem('ana_cart_item_backup');
        if (backupCart) {
          savedCart = backupCart;
          localStorage.setItem('ana_cart_item', backupCart);
        }
      } else {
        localStorage.setItem('ana_cart_item_backup', savedCart);
      }

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

  // Notificação caso o cliente volte do Stripe sem pagar
  const [isCanceledNotice, setIsCanceledNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('canceled') === 'true') {
        setIsCanceledNotice(true);
      }
    }
  }, []);

  // Pagamento Online
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'APPLE_PAY' | 'AFFIRM' | 'AFTERPAY' | 'ZELLE' | 'VENMO'>('CARD');

  // Autenticação Obrigatória no Checkout (Cadastro ou Login prévio para histórico)
  const [checkoutAuthMode, setCheckoutAuthMode] = useState<'register' | 'login'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const handleCheckoutAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      if (checkoutAuthMode === 'login') {
        const res = await fetch('/api/customer/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            email: authEmail.trim(),
            password: authPassword.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setAuthError(data.error || (lang === 'pt' ? 'E-mail ou senha incorretos.' : 'Incorrect email or password.'));
          setAuthLoading(false);
          return;
        }

        setCustomerUser(data.customer);
        localStorage.setItem('ana_customer_session', JSON.stringify(data.customer));
        window.dispatchEvent(new Event('ana_customer_updated'));

        const nameParts = (data.customer.name || '').trim().split(' ');
        const fName = nameParts[0] || '';
        const lName = nameParts.slice(1).join(' ') || '';
        setShippingForm((prev) => ({
          ...prev,
          email: data.customer.email || prev.email,
          phone: data.customer.phone || prev.phone,
          firstName: fName || prev.firstName,
          lastName: lName || prev.lastName,
          address: data.customer.shipping_address?.address || prev.address,
          apt: data.customer.shipping_address?.apt || prev.apt,
          city: data.customer.shipping_address?.city || prev.city,
          state: data.customer.shipping_address?.state || prev.state,
          zip: data.customer.shipping_address?.zip || prev.zip,
        }));
        setAuthSuccess(lang === 'pt' ? '✓ Login realizado com sucesso! Compra liberada.' : '✓ Logged in successfully! Purchase unlocked.');
      } else {
        if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
          setAuthError(lang === 'pt' ? 'Por favor, informe seu nome completo, e-mail e crie uma senha.' : 'Please enter your full name, email and create a password.');
          setAuthLoading(false);
          return;
        }

        const res = await fetch('/api/customer/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            name: authName.trim(),
            email: authEmail.trim(),
            phone: authPhone.trim(),
            password: authPassword.trim(),
            shipping_address: {
              address: shippingForm.address,
              apt: shippingForm.apt,
              city: shippingForm.city,
              state: shippingForm.state,
              zip: shippingForm.zip,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          if (res.status === 409) {
            setAuthError(lang === 'pt' ? 'Este e-mail já possui cadastro. Clique na aba "Já Tenho Conta" para entrar.' : 'Email already registered. Click "Already Have Account" to sign in.');
          } else {
            setAuthError(data.error || (lang === 'pt' ? 'Erro ao criar conta.' : 'Error creating account.'));
          }
          setAuthLoading(false);
          return;
        }

        setCustomerUser(data.customer);
        localStorage.setItem('ana_customer_session', JSON.stringify(data.customer));
        window.dispatchEvent(new Event('ana_customer_updated'));

        const nameParts = (authName || '').trim().split(' ');
        const fName = nameParts[0] || '';
        const lName = nameParts.slice(1).join(' ') || '';
        setShippingForm((prev) => ({
          ...prev,
          email: authEmail.trim(),
          phone: authPhone.trim() || prev.phone,
          firstName: fName || prev.firstName,
          lastName: lName || prev.lastName,
        }));
        setAuthSuccess(lang === 'pt' ? '✓ Cadastro criado com sucesso! Compra vinculada ao seu histórico.' : '✓ Account registered! Purchase linked to your history.');
      }
    } catch (err: any) {
      setAuthError(lang === 'pt' ? 'Falha ao conectar ao servidor. Tente novamente.' : 'Failed to connect. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogoutCustomer = () => {
    localStorage.removeItem('ana_customer_session');
    window.dispatchEvent(new Event('ana_customer_updated'));
    setCustomerUser(null);
    setAuthSuccess('');
    setAuthError('');
  };

  // Cupom de Desconto & Promoções / Vendedora
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0); // Desconto dinâmico do cupom (%)
  const [fixedDiscountAmount, setFixedDiscountAmount] = useState(0); // Desconto fixo em dólar ($)
  const [isFreeShipping, setIsFreeShipping] = useState(false); // Frete grátis via cupom
  const [couponType, setCouponType] = useState<'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING'>('PERCENTAGE');
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
  const discountAmount = appliedCoupon
    ? (couponType === 'FIXED'
        ? Math.min(subtotal, fixedDiscountAmount)
        : (subtotal * discountPercent) / 100)
    : 0;
  const shippingRate = isFreeShipping ? 0 : 9.99; // Taxa fixa de frete para todos os EUA (ou Grátis via cupom)
  const total = subtotal > 0 ? Math.max(0, subtotal - discountAmount) + shippingRate : 0;

  const handleRemoveCartItem = () => {
    localStorage.removeItem('ana_cart_item');
    localStorage.removeItem('ana_cart_item_backup');
    window.dispatchEvent(new Event('ana_cart_updated'));
    setCartItem(null);
  };

  // Auto-aplica cupom vindo de link de indicação / vendedora ou promoção
  useEffect(() => {
    try {
      const savedCoupon = localStorage.getItem('ana_applied_coupon');
      if (savedCoupon && !appliedCoupon) {
        const clean = savedCoupon.trim().toUpperCase();
        setCouponInput(clean);
        fetch(
          `/api/backoffice/coupons?code=${encodeURIComponent(clean)}&subtotal=${encodeURIComponent(
            subtotal
          )}&channel=ONLINE`
        )
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.valid) {
              setAppliedCoupon(data.code || clean);
              setCouponFeedback(data.message);
              if (data.discount_type === 'FREE_SHIPPING') {
                setIsFreeShipping(true);
                setCouponType('FREE_SHIPPING');
              } else if (data.discount_type === 'FIXED') {
                setFixedDiscountAmount(Number(data.discount_value) || 0);
                setCouponType('FIXED');
              } else {
                setDiscountPercent(Number(data.discount_value) || 0);
                setCouponType('PERCENTAGE');
              }
              if (data.seller_name) {
                setCouponSellerInfo({
                  name: data.seller_name,
                  discount_pct: data.discount_value || 0,
                  commission_pct: data.commission_pct || 0,
                });
              }
            }
          })
          .catch(() => {});
      }
    } catch (_) {}
  }, [lang, appliedCoupon, subtotal]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;

    try {
      const res = await fetch(
        `/api/backoffice/coupons?code=${encodeURIComponent(clean)}&subtotal=${encodeURIComponent(
          subtotal
        )}&channel=ONLINE`
      );
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.code || clean);
        setCouponFeedback(data.message);

        if (data.discount_type === 'FREE_SHIPPING') {
          setIsFreeShipping(true);
          setDiscountPercent(0);
          setFixedDiscountAmount(0);
          setCouponType('FREE_SHIPPING');
        } else if (data.discount_type === 'FIXED') {
          setIsFreeShipping(false);
          setDiscountPercent(0);
          setFixedDiscountAmount(Number(data.discount_value) || 0);
          setCouponType('FIXED');
        } else {
          setIsFreeShipping(false);
          setDiscountPercent(Number(data.discount_value) || 0);
          setFixedDiscountAmount(0);
          setCouponType('PERCENTAGE');
        }

        if (data.seller_name) {
          setCouponSellerInfo({
            name: data.seller_name,
            discount_pct: data.discount_value || 0,
            commission_pct: data.commission_pct || 0,
          });
        }
        return;
      } else if (data.message) {
        alert(data.message);
        setCouponFeedback('');
        return;
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

    // Garante que o cliente esteja cadastrado/logado para salvar no histórico
    if (!customerUser) {
      alert(
        lang === 'pt'
          ? 'Por favor, realize seu cadastro ou faça login na Etapa 1 acima para que sua compra fique salva no seu histórico.'
          : 'Please sign up or log in in Step 1 above so your order is saved to your account history.'
      );
      setIsSubmitting(false);
      const authBox = document.getElementById('checkout-auth-box');
      if (authBox) authBox.scrollIntoView({ behavior: 'smooth' });
      return;
    }

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
    const isStripeMethod =
      paymentMethod === 'CARD' ||
      paymentMethod === 'APPLE_PAY' ||
      paymentMethod === 'AFFIRM' ||
      paymentMethod === 'AFTERPAY';

    // 1. Se for Cartão, Apple Pay, Affirm ou Afterpay, inicia a sessão oficial da Stripe
    if (isStripeMethod) {
      try {
        const stripeRes = await fetch('/api/checkout/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: generatedOrderId,
            payment_method: paymentMethod.toLowerCase(),
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

        const stripeData = await stripeRes.json();
        if (stripeRes.ok && stripeData.configured && stripeData.url) {
          // Redireciona imediatamente para o ambiente oficial de pagamento (Stripe / Afterpay / Affirm)
          window.location.href = stripeData.url;
          return;
        } else {
          // Se o Stripe falhar ou o método não estiver ativo, NUNCA aprova pedido falso!
          setIsSubmitting(false);
          const errorMsg =
            stripeData?.error ||
            stripeData?.message ||
            (lang === 'pt'
              ? 'Não foi possível conectar com o checkout online do Stripe/Afterpay. Por favor, verifique se a forma de pagamento está ativa no Stripe ou tente com Cartão.'
              : 'Unable to connect to Stripe/Afterpay online checkout. Please try again or use another payment method.');
          setAddressErrors([errorMsg]);
          const box = document.getElementById('payment-methods-box');
          if (box) box.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setAddressErrors([
          err?.message ||
            (lang === 'pt'
              ? 'Erro de comunicação com o processador de pagamento. Tente novamente.'
              : 'Connection error communicating with payment processor.'),
        ]);
        return;
      }
    }

    // 2. Pagamentos Manuais Offline (Apenas Zelle e Venmo)
    if (paymentMethod !== 'ZELLE' && paymentMethod !== 'VENMO') {
      setIsSubmitting(false);
      return;
    }
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

    // Incrementa contador de uso do cupom no Supabase
    if (appliedCoupon) {
      try {
        fetch('/api/backoffice/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'increment_usage', code: appliedCoupon }),
        }).catch(() => {});
      } catch (_) {}
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

      {/* Aviso Amigável caso a cliente tenha voltado do Stripe sem concluir */}
      {isCanceledNotice && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs font-bold flex items-center justify-between gap-3 animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              {lang === 'pt'
                ? 'Você retornou da tela de pagamento do Stripe. Não se preocupe: seus itens continuam 100% salvos na sua sacola de compras para você finalizar quando quiser!'
                : 'You returned from the Stripe payment screen. Your items remain safely in your shopping bag so you can complete your purchase whenever you are ready!'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCanceledNotice(false)}
            className="text-amber-800 hover:text-deep-black font-black uppercase text-[10px] shrink-0 underline cursor-pointer"
          >
            {lang === 'pt' ? 'Fechar' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Relógio de Reserva & Urgência do Checkout */}
      <UrgencyCountdownTimer mode="checkout" />

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* =========================================================================
            COLUNA ESQUERDA: DADOS DE ENVIO & FORMAS DE PAGAMENTO DO CLIENTE
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-8">
          {/* =========================================================================
              ETAPA 1: CADASTRO OU LOGIN OBRIGATÓRIO (PARA REGISTRO NO HISTÓRICO)
             ========================================================================= */}
          {customerUser ? (
            <div className="bg-emerald-50 border-2 border-emerald-500 p-5 space-y-2 animate-fadeIn shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-950 font-black uppercase text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>1. IDENTIFICAÇÃO CONFIRMADA: COMPRA VINCULADA AO SEU HISTÓRICO</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutCustomer}
                  className="text-[10px] font-black uppercase text-deep-black/60 hover:text-red-600 underline cursor-pointer"
                >
                  [SAIR / TROCAR DE CONTA]
                </button>
              </div>
              <div className="text-xs text-emerald-900 font-medium">
                {lang === 'pt' ? 'Cliente VIP:' : 'Customer:'} <strong className="text-deep-black font-black">{customerUser.name}</strong> &bull; E-mail: <strong className="text-deep-black font-bold">{customerUser.email}</strong> {customerUser.phone && `• Tel: ${customerUser.phone}`}
              </div>
              <p className="text-[10px] text-emerald-800 uppercase font-mono pt-1">
                {lang === 'pt'
                  ? '✓ Seus dados de envio foram carregados. Este pedido será salvo na sua conta com histórico e rastreio USPS.'
                  : '✓ Shipping details loaded. This order will be recorded in your customer account history.'}
              </p>
            </div>
          ) : (
            <div id="checkout-auth-box" className="bg-white border-2 border-deep-black p-6 sm:p-8 space-y-5 shadow-luxury animate-fadeIn">
              <div className="border-b border-deep-black/10 pb-3 flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                  <User className="w-4 h-4 text-gold" />
                  <span>1. CADASTRO DA CLIENTE (OBRIGATÓRIO PARA HISTÓRICO)</span>
                </h2>
                <span className="px-2 py-0.5 bg-gold/20 text-deep-black text-[9px] font-black uppercase border border-gold/40">
                  PASSO 1 DE 3
                </span>
              </div>

              <p className="text-xs text-deep-black/80 font-medium leading-relaxed">
                {lang === 'pt'
                  ? 'Para que o seu pedido fique gravado no seu histórico de compras e você possa acompanhar o rastreio dos Correios (USPS) a qualquer momento, realize seu cadastro rápido abaixo (ou entre com sua conta existente):'
                  : 'To record your order in your customer history and track USPS shipping updates, please create a quick account below or sign in:'}
              </p>

              {/* Seletor: Novo Cadastro vs Já Tenho Conta */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setCheckoutAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                  className={`py-3 px-3 text-[11px] font-black uppercase tracking-wider border transition text-center cursor-pointer ${
                    checkoutAuthMode === 'register'
                      ? 'border-deep-black bg-deep-black text-white shadow-sm'
                      : 'border-deep-black/20 text-deep-black hover:border-gold bg-white'
                  }`}
                >
                  {lang === 'pt' ? 'NOVO CADASTRO (1ª COMPRA)' : 'NEW ACCOUNT (REGISTER)'}
                </button>

                <button
                  type="button"
                  onClick={() => { setCheckoutAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`py-3 px-3 text-[11px] font-black uppercase tracking-wider border transition text-center cursor-pointer ${
                    checkoutAuthMode === 'login'
                      ? 'border-deep-black bg-deep-black text-white shadow-sm'
                      : 'border-deep-black/20 text-deep-black hover:border-gold bg-white'
                  }`}
                >
                  {lang === 'pt' ? 'JÁ TENHO CONTA (ENTRAR)' : 'ALREADY HAVE ACCOUNT'}
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-green-50 border border-green-300 text-green-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Formulário In-Checkout */}
              <div className="space-y-4 pt-1">
                {checkoutAuthMode === 'register' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                        {lang === 'pt' ? 'NOME COMPLETO:' : 'FULL NAME:'}
                      </label>
                      <input
                        type="text"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Ex: Mariana Silva"
                        className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                          {lang === 'pt' ? 'E-MAIL (PARA RASTREIO E CONTA):' : 'EMAIL ADDRESS:'}
                        </label>
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="mariana@gmail.com"
                          className="w-full px-3.5 py-2.5 text-xs border border-deep-black/20 focus:outline-none focus:border-deep-black"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                          {lang === 'pt' ? 'TELEFONE / WHATSAPP:' : 'PHONE NUMBER:'}
                        </label>
                        <input
                          type="tel"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          placeholder="+1 (978) 000-0000"
                          className="w-full px-3.5 py-2.5 text-xs border border-deep-black/20 focus:outline-none focus:border-deep-black"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                        {lang === 'pt' ? 'CRIE UMA SENHA PARA SUA CONTA:' : 'CREATE A PASSWORD:'}
                      </label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full px-3.5 py-2.5 text-xs border border-deep-black/20 focus:outline-none focus:border-deep-black"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckoutAuth}
                      disabled={authLoading}
                      className="w-full py-4 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-luxury cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? (
                        <span>{lang === 'pt' ? 'CRIANDO CONTA...' : 'CREATING ACCOUNT...'}</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-gold" />
                          <span>{lang === 'pt' ? 'CRIAR CONTA & LIBERAR COMPRA →' : 'REGISTER & UNLOCK CHECKOUT →'}</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                          {lang === 'pt' ? 'SEU E-MAIL CADASTRADO:' : 'YOUR REGISTERED EMAIL:'}
                        </label>
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="mariana@gmail.com"
                          className="w-full px-3.5 py-2.5 text-xs border border-deep-black/20 focus:outline-none focus:border-deep-black"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                          {lang === 'pt' ? 'SUA SENHA:' : 'YOUR PASSWORD:'}
                        </label>
                        <input
                          type="password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Sua senha"
                          className="w-full px-3.5 py-2.5 text-xs border border-deep-black/20 focus:outline-none focus:border-deep-black"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCheckoutAuth}
                        disabled={authLoading}
                        className="w-full py-4 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-luxury cursor-pointer disabled:opacity-50"
                      >
                        {authLoading ? (
                          <span>{lang === 'pt' ? 'ENTRANDO...' : 'SIGNING IN...'}</span>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-gold" />
                            <span>{lang === 'pt' ? 'ENTRAR NA MINHA CONTA & LIBERAR COMPRA →' : 'SIGN IN & UNLOCK CHECKOUT →'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. Endereço de Envio nos EUA com Validação USPS */}
          <div id="shipping-address-box" className={`bg-white border-2 border-deep-black p-6 sm:p-8 space-y-5 transition ${!customerUser ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <Truck className="w-4 h-4 text-gold" />
                <span>{lang === 'pt' ? '2. ENDEREÇO DE ENTREGA NOS ESTADOS UNIDOS' : '2. DOMESTIC US SHIPPING ADDRESS'}</span>
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider text-gold">
                FLAT RATE $9.99
              </span>
            </div>

            {!customerUser && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{lang === 'pt' ? '🔒 Cadastre-se ou faça login na Etapa 1 acima para liberar este formulário.' : '🔒 Register or sign in in Step 1 above to unlock this form.'}</span>
              </div>
            )}

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

          {/* 3. Formas de Pagamento Online */}
          <div className={`bg-white border-2 border-deep-black p-6 sm:p-8 space-y-5 transition ${!customerUser ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="border-b border-deep-black/10 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" />
                <span>{lang === 'pt' ? '3. FORMA DE PAGAMENTO' : '3. PAYMENT METHOD'}</span>
              </h2>
            </div>

            {!customerUser && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{lang === 'pt' ? '🔒 Formas de pagamento liberadas após o cadastro ou login na Etapa 1.' : '🔒 Payment methods unlocked after registration in Step 1.'}</span>
              </div>
            )}

            {/* Abas de Seleção de Pagamento */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider border transition flex flex-col items-center justify-center gap-1 min-h-[74px] ${
                  paymentMethod === 'CARD'
                    ? 'border-deep-black bg-deep-black text-white shadow-sm'
                    : 'border-deep-black/20 text-deep-black hover:border-gold bg-white'
                }`}
              >
                <CreditCard className="w-4 h-4 text-gold" />
                <span>CREDIT CARD</span>
                <span className={`text-[8px] font-mono ${paymentMethod === 'CARD' ? 'text-white/60' : 'text-deep-black/50'}`}>
                  VISA • MASTER • AMEX
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('APPLE_PAY')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider border transition flex flex-col items-center justify-center gap-1 min-h-[74px] ${
                  paymentMethod === 'APPLE_PAY'
                    ? 'border-deep-black bg-deep-black text-white shadow-sm'
                    : 'border-deep-black/20 text-deep-black hover:border-gold bg-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-gold" />
                <span>APPLE PAY</span>
                <span className={`text-[8px] font-mono ${paymentMethod === 'APPLE_PAY' ? 'text-white/60' : 'text-deep-black/50'}`}>
                  1-CLICK CHECKOUT
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('AFFIRM')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider border transition flex flex-col items-center justify-center gap-1 min-h-[74px] relative ${
                  paymentMethod === 'AFFIRM'
                    ? 'border-[#004BFF] bg-[#004BFF] text-white shadow-sm'
                    : 'border-deep-black/20 text-deep-black hover:border-[#004BFF] bg-white'
                }`}
              >
                <span className={`font-black text-xs tracking-tight ${paymentMethod === 'AFFIRM' ? 'text-white' : 'text-[#004BFF]'}`}>
                  affirm
                </span>
                <span>PARCELAMENTO</span>
                <span className={`text-[8px] font-bold ${paymentMethod === 'AFFIRM' ? 'text-white/80' : 'text-emerald-700'}`}>
                  4x SEM JUROS
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('AFTERPAY')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider border transition flex flex-col items-center justify-center gap-1 min-h-[74px] relative ${
                  paymentMethod === 'AFTERPAY'
                    ? 'border-[#10b981] bg-[#b2fce4] text-deep-black shadow-sm ring-2 ring-[#10b981]'
                    : 'border-deep-black/20 text-deep-black hover:border-[#10b981] bg-white'
                }`}
              >
                <span className="font-black text-xs tracking-tight text-deep-black">
                  afterpay ↗
                </span>
                <span>PARCELAMENTO</span>
                <span className="text-[8px] font-bold text-emerald-800">
                  4x QUINZENAIS
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ZELLE')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider border transition flex flex-col items-center justify-center gap-1 min-h-[74px] ${
                  paymentMethod === 'ZELLE'
                    ? 'border-deep-black bg-deep-black text-white shadow-sm'
                    : 'border-deep-black/20 text-deep-black hover:border-gold bg-white'
                }`}
              >
                <span className="font-mono text-gold font-black text-xs">ZELLE</span>
                <span>ZELLE PAY</span>
                <span className={`text-[8px] font-mono ${paymentMethod === 'ZELLE' ? 'text-white/60' : 'text-deep-black/50'}`}>
                  INSTANT TRANSFER
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('VENMO')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider border transition flex flex-col items-center justify-center gap-1 min-h-[74px] ${
                  paymentMethod === 'VENMO'
                    ? 'border-deep-black bg-deep-black text-white shadow-sm'
                    : 'border-deep-black/20 text-deep-black hover:border-[#008CFF] bg-white'
                }`}
              >
                <span className="font-mono text-[#008CFF] font-black text-xs">VENMO</span>
                <span>VENMO PAY</span>
                <span className={`text-[8px] font-mono ${paymentMethod === 'VENMO' ? 'text-white/60' : 'text-deep-black/50'}`}>
                  @Accleaningproservices
                </span>
              </button>
            </div>

            {/* Informações de Pagamento Seguro via Stripe */}
            {paymentMethod === 'CARD' && (
              <div className="p-4 sm:p-5 border-2 border-deep-black bg-deep-black/5 space-y-3 animate-fadeIn text-xs text-deep-black">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gold" />
                    <span className="font-black uppercase tracking-wider text-deep-black">
                      {lang === 'pt' ? 'PAGAMENTO SEGURO VIA STRIPE' : 'SECURE STRIPE PAYMENT'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black uppercase font-mono">
                    CRIPTOGRAFIA 256-BIT SSL
                  </span>
                </div>

                <p className="text-deep-black/80 font-medium leading-relaxed">
                  {lang === 'pt'
                    ? 'Ao clicar no botão "PAGAR COM CARTÃO", você será direcionada para a página oficial e 100% segura da Stripe para preencher os dados do seu cartão com proteção bancária e antifraude.'
                    : 'When you click "PAY WITH CARD", you will be redirected to the official, 100% secure Stripe Checkout page to enter your card details with banking-level fraud protection.'}
                </p>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="px-2 py-1 bg-white border border-deep-black/20 font-black text-[9px] font-mono shadow-2xs">VISA</span>
                  <span className="px-2 py-1 bg-white border border-deep-black/20 font-black text-[9px] font-mono shadow-2xs">MASTERCARD</span>
                  <span className="px-2 py-1 bg-white border border-deep-black/20 font-black text-[9px] font-mono shadow-2xs">AMERICAN EXPRESS</span>
                  <span className="px-2 py-1 bg-white border border-deep-black/20 font-black text-[9px] font-mono shadow-2xs">DISCOVER</span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-deep-black/70 pt-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                  <span>
                    {lang === 'pt'
                      ? 'Nenhum dado do seu cartão é armazenado na nossa loja. Transação certificada PCI-DSS Nível 1.'
                      : 'No card numbers are stored on our servers. Certified PCI-DSS Level 1 transaction.'}
                  </span>
                </div>
              </div>
            )}

            {/* Apple Pay Direct */}
            {paymentMethod === 'APPLE_PAY' && (
              <div className="p-4 sm:p-5 bg-deep-black text-white text-center space-y-2 animate-fadeIn border-2 border-gold">
                <span className="text-xs font-black uppercase tracking-widest text-gold block">
                  APPLE PAY INSTANT CHECKOUT
                </span>
                <p className="text-xs text-white/80 uppercase">
                  {lang === 'pt'
                    ? 'Ao clicar no botão abaixo, a Stripe abrirá a janela de autorização direta do Apple Pay via Face ID ou Touch ID no seu aparelho.'
                    : 'When you click the button below, Stripe will open the Apple Pay window for direct authorization via Face ID or Touch ID.'}
                </p>
              </div>
            )}

            {/* Informações Affirm */}
            {paymentMethod === 'AFFIRM' && (
              <div className="p-4 sm:p-5 border-2 border-[#004BFF] bg-[#004BFF]/5 space-y-4 animate-fadeIn text-xs text-deep-black">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#004BFF] text-white font-black text-xs tracking-tight rounded-xs">
                      affirm
                    </span>
                    <span className="font-black uppercase tracking-wider text-deep-black">
                      {lang === 'pt' ? 'PARCELAMENTO VIA AFFIRM' : 'FINANCING WITH AFFIRM'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black uppercase font-mono">
                    0% APR DISPONÍVEL
                  </span>
                </div>

                <div className="bg-white p-3.5 border border-[#004BFF]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-deep-black/70 uppercase">
                      {lang === 'pt' ? 'Plano 4 Parcelas Sem Juros:' : '4 Interest-Free Payments Plan:'}
                    </span>
                    <span className="text-sm font-black font-mono text-[#004BFF]">
                      4x de ${(total / 4).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-deep-black/80 font-medium leading-relaxed">
                    {lang === 'pt'
                      ? `Pague a 1ª parcela de $${(total / 4).toFixed(2)} hoje e as outras 3 a cada 2 semanas com zero juros e sem taxas adicionais.`
                      : `Pay $${(total / 4).toFixed(2)} today, and the remaining 3 every 2 weeks with 0% APR and no hidden fees.`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2.5 bg-white border border-deep-black/10 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black text-deep-black">
                        {lang === 'pt' ? 'SEM JUROS OCULTOS' : 'NO HIDDEN FEES'}
                      </strong>
                      <span className="text-deep-black/70">
                        {lang === 'pt' ? 'Você nunca paga 1 centavo além do combinado.' : 'You will never pay a penny more than agreed.'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white border border-deep-black/10 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black text-deep-black">
                        {lang === 'pt' ? 'APROVAÇÃO INSTANTÂNEA' : 'INSTANT DECISION'}
                      </strong>
                      <span className="text-deep-black/70">
                        {lang === 'pt' ? 'Não afeta seu Credit Score na consulta.' : 'Does not impact your credit score to check.'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white border border-deep-black/10 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black text-deep-black">
                        {lang === 'pt' ? 'ENVIO IMEDIATO' : 'FAST SHIPPING'}
                      </strong>
                      <span className="text-deep-black/70">
                        {lang === 'pt' ? 'Seu pedido é enviado normalmente via USPS.' : 'Your order is processed & shipped immediately via USPS.'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-deep-black/60 italic">
                  {lang === 'pt'
                    ? 'Ao clicar no botão de finalizar pedido, você será direcionada para a tela oficial da Stripe / Affirm para confirmar seu parcelamento com segurança.'
                    : 'When you click place order, you will be directed to the official Stripe / Affirm portal to securely confirm your plan.'}
                </p>
              </div>
            )}

            {/* Informações Afterpay */}
            {paymentMethod === 'AFTERPAY' && (
              <div className="p-4 sm:p-5 border-2 border-[#10b981] bg-[#b2fce4]/15 space-y-4 animate-fadeIn text-xs text-deep-black">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#b2fce4] text-deep-black border border-[#10b981] font-black text-xs tracking-tight rounded-xs">
                      afterpay ↗
                    </span>
                    <span className="font-black uppercase tracking-wider text-deep-black">
                      {lang === 'pt' ? 'PARCELAMENTO EM 4x QUINZENAIS' : '4 BI-WEEKLY PAYMENTS WITH AFTERPAY'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-300 text-[9px] font-black uppercase font-mono">
                    ZERO JUROS
                  </span>
                </div>

                {/* Cronograma das 4 Parcelas */}
                <div className="bg-white p-3.5 border border-[#10b981]/30 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/70 block">
                    {lang === 'pt' ? 'CRONOGRAMA DE PAGAMENTO AFTERPAY:' : 'AFTERPAY PAYMENT SCHEDULE:'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-[#b2fce4]/30 border border-[#10b981]/40 rounded-xs">
                      <span className="block text-[9px] font-black text-emerald-900 uppercase">1ª (HOJE)</span>
                      <strong className="block text-xs font-mono font-black text-deep-black">${(total / 4).toFixed(2)}</strong>
                      <span className="block text-[8px] text-deep-black/60">{lang === 'pt' ? 'No checkout' : 'Due today'}</span>
                    </div>
                    <div className="p-2 bg-gray-50 border border-deep-black/10 rounded-xs">
                      <span className="block text-[9px] font-bold text-deep-black/70 uppercase">2ª (2 SEMANAS)</span>
                      <strong className="block text-xs font-mono font-black text-deep-black">${(total / 4).toFixed(2)}</strong>
                      <span className="block text-[8px] text-deep-black/60">{lang === 'pt' ? 'Automático' : 'Auto-pay'}</span>
                    </div>
                    <div className="p-2 bg-gray-50 border border-deep-black/10 rounded-xs">
                      <span className="block text-[9px] font-bold text-deep-black/70 uppercase">3ª (4 SEMANAS)</span>
                      <strong className="block text-xs font-mono font-black text-deep-black">${(total / 4).toFixed(2)}</strong>
                      <span className="block text-[8px] text-deep-black/60">{lang === 'pt' ? 'Automático' : 'Auto-pay'}</span>
                    </div>
                    <div className="p-2 bg-gray-50 border border-deep-black/10 rounded-xs">
                      <span className="block text-[9px] font-bold text-deep-black/70 uppercase">4ª (6 SEMANAS)</span>
                      <strong className="block text-xs font-mono font-black text-deep-black">${(total / 4).toFixed(2)}</strong>
                      <span className="block text-[8px] text-deep-black/60">{lang === 'pt' ? 'Última parcela' : 'Final payment'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-deep-black/80 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    {lang === 'pt'
                      ? 'Sem juros quando pago em dia. Seus produtos são despachados imediatamente com rastreamento USPS.'
                      : 'No interest fees when paid on time. Your pieces ship immediately with USPS tracking.'}
                  </span>
                </div>
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
              <div className="p-4 border border-[#008CFF]/40 bg-[#008CFF]/5 space-y-3 animate-fadeIn text-xs text-deep-black">
                <div className="flex items-center justify-between">
                  <h4 className="font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#008CFF] inline-block" />
                    <span>{lang === 'pt' ? 'PAGAMENTO VIA VENMO:' : 'PAYMENT VIA VENMO:'}</span>
                  </h4>
                  <span className="text-[9px] font-mono font-black text-[#008CFF] uppercase bg-white px-2 py-0.5 border border-[#008CFF]/30 shadow-2xs">
                    VENMO OFICIAL
                  </span>
                </div>
                <p className="text-deep-black/85 font-medium leading-relaxed">
                  {lang === 'pt'
                    ? 'Envie o valor total da compra para o Venmo oficial da loja: '
                    : 'Send the total purchase amount to our official Venmo account: '}
                  <strong className="text-deep-black font-mono font-black text-sm block sm:inline mt-1 sm:mt-0 bg-white px-1.5 py-0.5 border border-deep-black/20">
                    @Accleaningproservices
                  </strong>
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <a
                    href="https://venmo.com/u/Accleaningproservices"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#008CFF] hover:bg-[#0074d9] text-white font-black text-[10px] uppercase tracking-wider transition shadow-2xs"
                  >
                    <span>{lang === 'pt' ? '↗ ABRIR APP VENMO' : '↗ OPEN VENMO APP'}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('@Accleaningproservices');
                      alert(lang === 'pt' ? 'Usuário do Venmo @Accleaningproservices copiado com sucesso!' : 'Venmo handle @Accleaningproservices copied successfully!');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-deep-black/30 bg-white hover:bg-gray-100 text-deep-black font-black text-[10px] uppercase tracking-wider transition shadow-2xs cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-gold" />
                    <span>{lang === 'pt' ? 'COPIAR @' : 'COPY @'}</span>
                  </button>
                  <a
                    href={`https://wa.me/${rawWhatsApp || '19783139452'}?text=${encodeURIComponent(
                      lang === 'pt'
                        ? `Olá, Ana Carina! Estou finalizando meu pedido via Venmo (@Accleaningproservices) no valor de $${total.toFixed(2)} e gostaria de tirar uma dúvida ou enviar o comprovante.`
                        : `Hello Ana Carina! I am paying via Venmo (@Accleaningproservices) for $${total.toFixed(2)} and would like to confirm details or send my receipt.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd5b] text-deep-black font-black text-[10px] uppercase tracking-wider transition shadow-2xs border border-[#1b9a4a]"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-deep-black" />
                    <span>{lang === 'pt' ? 'Tirar Dúvida no WhatsApp' : 'Questions on WhatsApp'}</span>
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

            {appliedCoupon && discountAmount > 0 && (
              <div className="flex justify-between text-gold font-bold">
                <span>
                  {couponType === 'PERCENTAGE'
                    ? lang === 'pt'
                      ? `DESCONTO (${discountPercent}%):`
                      : `DISCOUNT (${discountPercent}%):`
                    : lang === 'pt'
                    ? 'DESCONTO (CUPOM):'
                    : 'DISCOUNT (PROMO):'}
                </span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-deep-black/70">
              <span className="flex items-center gap-1">
                <span>{lang === 'pt' ? 'FRETE DOMÉSTICO (EUA):' : 'DOMESTIC US SHIPPING:'}</span>
              </span>
              <span className={`font-mono font-bold ${isFreeShipping ? 'text-green-700' : ''}`}>
                {isFreeShipping ? (lang === 'pt' ? 'GRÁTIS (CUPOM)' : 'FREE (PROMO)') : `$${shippingRate.toFixed(2)}`}
              </span>
            </div>

            <div className="flex justify-between text-lg sm:text-xl font-black text-deep-black pt-3 border-t-2 border-deep-black">
              <span>TOTAL:</span>
              <span className="text-gold font-mono">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* BOTÃO OFICIAL DE COMPRA ONLINE */}
          <div className="space-y-3 pt-2">
            {!customerUser ? (
              <button
                type="button"
                onClick={() => {
                  const box = document.getElementById('checkout-auth-box');
                  if (box) box.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-4 bg-gray-200 hover:bg-gold text-deep-black text-xs sm:text-sm font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-2 border-deep-black cursor-pointer shadow-luxury"
              >
                <Lock className="w-4 h-4 text-gold" />
                <span>
                  {lang === 'pt' ? '🔒 REQUER CADASTRO NA ETAPA 1 ACIMA' : '🔒 PLEASE REGISTER IN STEP 1 ABOVE'}
                </span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-deep-black hover:bg-gold text-white hover:text-deep-black disabled:opacity-50 text-xs sm:text-sm font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-luxury cursor-pointer"
              >
                {isSubmitting ? (
                  <span>
                    {paymentMethod === 'CARD' || paymentMethod === 'APPLE_PAY' || paymentMethod === 'AFFIRM' || paymentMethod === 'AFTERPAY'
                      ? (lang === 'pt' ? 'REDIRECIONANDO PARA O STRIPE...' : 'REDIRECTING TO STRIPE...')
                      : (lang === 'pt' ? 'PROCESSANDO PEDIDO...' : 'PROCESSING ORDER...')}
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-gold" />
                    <span>
                      {paymentMethod === 'CARD' && (lang === 'pt' ? `PAGAR COM CARTÃO (STRIPE) • $${total.toFixed(2)}` : `PAY WITH CARD (STRIPE) • $${total.toFixed(2)}`)}
                      {paymentMethod === 'APPLE_PAY' && (lang === 'pt' ? `PAGAR COM APPLE PAY • $${total.toFixed(2)}` : `PAY WITH APPLE PAY • $${total.toFixed(2)}`)}
                      {paymentMethod === 'AFFIRM' && (lang === 'pt' ? `PAGAR COM AFFIRM • 4x DE $${(total / 4).toFixed(2)}` : `PAY WITH AFFIRM • 4x OF $${(total / 4).toFixed(2)}`)}
                      {paymentMethod === 'AFTERPAY' && (lang === 'pt' ? `PAGAR COM AFTERPAY • 4x DE $${(total / 4).toFixed(2)}` : `PAY WITH AFTERPAY • 4x OF $${(total / 4).toFixed(2)}`)}
                      {paymentMethod === 'ZELLE' && (lang === 'pt' ? `FINALIZAR PEDIDO (ZELLE) • $${total.toFixed(2)}` : `CONFIRM ORDER (ZELLE) • $${total.toFixed(2)}`)}
                      {paymentMethod === 'VENMO' && (lang === 'pt' ? `FINALIZAR PEDIDO (VENMO) • $${total.toFixed(2)}` : `CONFIRM ORDER (VENMO) • $${total.toFixed(2)}`)}
                    </span>
                  </>
                )}
              </button>
            )}

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
