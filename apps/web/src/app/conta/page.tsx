'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  User,
  ShoppingBag,
  Package,
  Truck,
  MapPin,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  Edit2,
  Save,
  ArrowRight,
} from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function CustomerAccountPage() {
  const { lang } = useLanguage();

  // Sessão do Cliente
  const [customer, setCustomer] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'address' | 'profile'>('orders');

  // Modo de Autenticação (quando deslogado)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Formulário de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Formulário de Cadastro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState({
    address: '',
    apt: '',
    city: '',
    state: 'MA',
    zip: '',
  });

  // Histórico de Pedidos
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Edição de Endereço Salvo
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address: '',
    apt: '',
    city: '',
    state: 'MA',
    zip: '',
  });
  const [saveAddressLoading, setSaveAddressLoading] = useState(false);

  // Carrega sessão salva no navegador
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ana_customer_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCustomer(parsed);
        if (parsed.shipping_address) {
          setAddressForm(parsed.shipping_address);
        }
        fetchCustomerOrders(parsed.email);
      }
    } catch (e) {
      console.warn('Erro ao carregar sessão do cliente:', e);
    }
  }, []);

  // Busca histórico de pedidos do cliente por e-mail
  const fetchCustomerOrders = async (email: string) => {
    if (!email) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/orders/lookup?query=${encodeURIComponent(email.trim().toLowerCase())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
        } else if (data.order) {
          setOrders([data.order]);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn('Erro ao buscar pedidos:', e);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha no login');
      }

      setCustomer(data.customer);
      if (data.customer.shipping_address) {
        setAddressForm(data.customer.shipping_address);
      }
      localStorage.setItem('ana_customer_session', JSON.stringify(data.customer));
      window.dispatchEvent(new Event('ana_customer_updated'));

      fetchCustomerOrders(data.customer.email);
      setAuthSuccess(lang === 'pt' ? 'Login realizado com sucesso!' : 'Logged in successfully!');
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao realizar login.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Cadastro de Novo Cliente
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          shipping_address: regAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha no cadastro');
      }

      setCustomer(data.customer);
      if (data.customer.shipping_address) {
        setAddressForm(data.customer.shipping_address);
      }
      localStorage.setItem('ana_customer_session', JSON.stringify(data.customer));
      window.dispatchEvent(new Event('ana_customer_updated'));

      fetchCustomerOrders(data.customer.email);
      setAuthSuccess(lang === 'pt' ? 'Cadastro criado com sucesso!' : 'Account registered successfully!');
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao criar cadastro.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('ana_customer_session');
    window.dispatchEvent(new Event('ana_customer_updated'));
    setCustomer(null);
    setOrders([]);
    setLoginPassword('');
  };

  // Salvar Endereço Atualizado
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setSaveAddressLoading(true);

    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          email: customer.email,
          shipping_address: addressForm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomer(data.customer);
        localStorage.setItem('ana_customer_session', JSON.stringify(data.customer));
        window.dispatchEvent(new Event('ana_customer_updated'));
        setEditingAddress(false);
      }
    } catch (e) {
      console.warn('Erro ao salvar endereço:', e);
    } finally {
      setSaveAddressLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(code);
    setTimeout(() => setCopiedTracking(null), 3000);
  };

  // =========================================================================
  // SEÇÃO: CLIENTE NÃO LOGADO (LOGIN / CADASTRO)
  // =========================================================================
  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-10 bg-white min-h-[85vh]">
        {/* Top Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/15 border border-gold/40 text-[10px] font-black uppercase tracking-widest text-deep-black">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>ANA FITNESS WEAR • CUSTOMER PORTAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-deep-black">
            {lang === 'pt' ? 'MINHA CONTA & PEDIDOS' : 'MY ACCOUNT & ORDERS'}
          </h1>
          <p className="text-xs uppercase tracking-wider text-deep-black/60 font-medium leading-relaxed">
            {lang === 'pt'
              ? 'Acesse seu painel para acompanhar o rastreamento dos seus pacotes USPS, gerenciar endereços de entrega e finalizar compras com agilidade.'
              : 'Sign in to track USPS delivery status, manage domestic US addresses, and enjoy faster checkout.'}
          </p>
        </div>

        {/* Card Principal de Autenticação */}
        <div className="max-w-xl mx-auto bg-white border-2 border-deep-black shadow-luxury overflow-hidden">
          {/* Seletor de Abas: Entrar vs Cadastrar */}
          <div className="grid grid-cols-2 border-b-2 border-deep-black text-xs font-black uppercase tracking-widest">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
              className={`py-4 transition text-center flex items-center justify-center gap-2 ${
                authMode === 'login'
                  ? 'bg-deep-black text-white'
                  : 'bg-gray-50 text-deep-black hover:bg-gray-100'
              }`}
            >
              <Lock className="w-4 h-4 text-gold" />
              <span>{lang === 'pt' ? 'JÁ SOU CADASTRADA' : 'SIGN IN'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
              className={`py-4 transition text-center flex items-center justify-center gap-2 ${
                authMode === 'register'
                  ? 'bg-deep-black text-white'
                  : 'bg-gray-50 text-deep-black hover:bg-gray-100'
              }`}
            >
              <User className="w-4 h-4 text-gold" />
              <span>{lang === 'pt' ? 'CRIAR CADASTRO' : 'CREATE ACCOUNT'}</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Mensagens de Feedback */}
            {authError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold uppercase tracking-wider">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-green-50 border border-green-300 text-green-800 text-xs font-bold uppercase tracking-wider">
                {authSuccess}
              </div>
            )}

            {/* FORMULÁRIO DE LOGIN */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gold" />
                    <span>{lang === 'pt' ? 'E-MAIL:' : 'EMAIL ADDRESS:'}</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="mariana.salles@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gold" />
                    <span>{lang === 'pt' ? 'SENHA:' : 'PASSWORD:'}</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-xs border border-deep-black/20 focus:outline-none focus:border-deep-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-luxury disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-gold" />
                  <span>{authLoading ? (lang === 'pt' ? 'ENTRANDO...' : 'SIGNING IN...') : (lang === 'pt' ? 'ACESSAR MINHA CONTA' : 'SIGN IN TO ACCOUNT')}</span>
                </button>

                {/* Dica para demonstração imediata da dona ou cliente */}
                <div className="pt-2 text-[10px] text-deep-black/50 text-center font-bold uppercase tracking-wider bg-gold/5 p-2.5 border border-gold/30">
                  <p>{lang === 'pt' ? '💡 DICA PARA TESTE: E-mail Mariana Salles: mariana.salles@gmail.com | Senha: 123' : '💡 DEMO: Email: mariana.salles@gmail.com | Pass: 123'}</p>
                </div>
              </form>
            )}

            {/* FORMULÁRIO DE CADASTRO */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                    {lang === 'pt' ? 'NOME COMPLETO:' : 'FULL NAME:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Amanda Ferreira"
                    className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                      {lang === 'pt' ? 'E-MAIL:' : 'EMAIL:'}
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="amanda@exemplo.com"
                      className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                      {lang === 'pt' ? 'TELEFONE (SMS):' : 'PHONE (SMS):'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+1 (978) 000-0000"
                      className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                    {lang === 'pt' ? 'CRIE UMA SENHA:' : 'CREATE A PASSWORD:'}
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-xs border border-deep-black/20 focus:outline-none focus:border-deep-black"
                  />
                </div>

                {/* Endereço de Entrega Inicial (Opcional ou Recomendado) */}
                <div className="pt-2 border-t border-deep-black/10 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gold" />
                    <span>{lang === 'pt' ? 'ENDEREÇO DE ENTREGA NOS EUA (OPCIONAL):' : 'DOMESTIC US SHIPPING ADDRESS (OPTIONAL):'}</span>
                  </h4>

                  <input
                    type="text"
                    value={regAddress.address}
                    onChange={(e) => setRegAddress({ ...regAddress, address: e.target.value })}
                    placeholder="Street Address (ex: 123 Main St)"
                    className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={regAddress.city}
                      onChange={(e) => setRegAddress({ ...regAddress, city: e.target.value })}
                      placeholder="City (ex: Boston)"
                      className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                    />
                    <select
                      value={regAddress.state}
                      onChange={(e) => setRegAddress({ ...regAddress, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black bg-white"
                    >
                      {US_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      maxLength={5}
                      value={regAddress.zip}
                      onChange={(e) => setRegAddress({ ...regAddress, zip: e.target.value })}
                      placeholder="Zip (02215)"
                      className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-luxury disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                  <span>{authLoading ? (lang === 'pt' ? 'CRIANDO CONTA...' : 'CREATING ACCOUNT...') : (lang === 'pt' ? 'CONCLUIR MEU CADASTRO' : 'REGISTER ACCOUNT')}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Informações Institucionais e Vantagens */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6 text-center">
          <div className="p-6 border border-deep-black/10 bg-white space-y-2">
            <Truck className="w-6 h-6 text-gold mx-auto" />
            <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
              {lang === 'pt' ? 'RASTREAMENTO USPS' : 'USPS TRACKING'}
            </h3>
            <p className="text-[11px] text-deep-black/60 uppercase font-medium">
              {lang === 'pt' ? 'Acompanhe cada etapa da entrega do seu pacote pelo correio americano.' : 'Live package tracking directly through the United States Postal Service.'}
            </p>
          </div>

          <div className="p-6 border border-deep-black/10 bg-white space-y-2">
            <Sparkles className="w-6 h-6 text-gold mx-auto" />
            <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
              {lang === 'pt' ? 'CHECKOUT RÁPIDO' : '1-CLICK CHECKOUT'}
            </h3>
            <p className="text-[11px] text-deep-black/60 uppercase font-medium">
              {lang === 'pt' ? 'Seus dados de envio ficam salvos com segurança para suas próximas compras.' : 'Save your domestic delivery address for faster orders anytime.'}
            </p>
          </div>

          <div className="p-6 border border-deep-black/10 bg-white space-y-2">
            <ShieldCheck className="w-6 h-6 text-gold mx-auto" />
            <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
              {lang === 'pt' ? 'SEGURANÇA TOTAL' : 'ENCRYPTED PRIVACY'}
            </h3>
            <p className="text-[11px] text-deep-black/60 uppercase font-medium">
              {lang === 'pt' ? 'Seus dados pessoais nunca são compartilhados com terceiros.' : 'Your data is strictly encrypted and protected with industry standards.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SEÇÃO: CLIENTE LOGADO (DASHBOARD COMPLETO)
  // =========================================================================
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8 bg-white min-h-[85vh]">
      {/* Banner Superior do Cliente Logado */}
      <div className="p-6 sm:p-8 bg-deep-black text-white border-b-4 border-gold flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-luxury">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gold text-deep-black text-[9px] font-black uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-deep-black" />
            <span>CLIENTE VIP • ANA FITNESS WEAR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            {lang === 'pt' ? 'OLÁ,' : 'WELCOME,'} {customer.name}
          </h1>
          <p className="text-xs uppercase tracking-wider text-white/70 font-mono">
            {customer.email} {customer.phone && `• ${customer.phone}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/#vitrine"
            className="px-4 py-2.5 bg-gold text-deep-black hover:bg-white text-xs font-black uppercase tracking-widest transition flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-deep-black" />
            <span>{lang === 'pt' ? 'IR ÀS COMPRAS' : 'SHOP NOW'}</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2.5 border border-white/30 text-white hover:bg-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === 'pt' ? 'SAIR' : 'LOG OUT'}</span>
          </button>
        </div>
      </div>

      {/* Navegação entre Abas do Painel */}
      <div className="flex border-b-2 border-deep-black text-xs font-black uppercase tracking-widest gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`py-3.5 px-6 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-gold text-deep-black bg-gold/10'
              : 'border-transparent text-deep-black/60 hover:text-deep-black'
          }`}
        >
          <Package className="w-4 h-4 text-gold" />
          <span>{lang === 'pt' ? 'MEUS PEDIDOS' : 'MY ORDERS'} ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('address')}
          className={`py-3.5 px-6 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'address'
              ? 'border-gold text-deep-black bg-gold/10'
              : 'border-transparent text-deep-black/60 hover:text-deep-black'
          }`}
        >
          <MapPin className="w-4 h-4 text-gold" />
          <span>{lang === 'pt' ? 'ENDEREÇO DE ENVIO' : 'SHIPPING ADDRESS'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-3.5 px-6 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-gold text-deep-black bg-gold/10'
              : 'border-transparent text-deep-black/60 hover:text-deep-black'
          }`}
        >
          <User className="w-4 h-4 text-gold" />
          <span>{lang === 'pt' ? 'MEUS DADOS' : 'ACCOUNT INFO'}</span>
        </button>
      </div>

      {/* =====================================================================
          ABA 1: MEUS PEDIDOS & RASTREIO
         ===================================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {ordersLoading ? (
            <div className="p-12 text-center text-xs font-black uppercase tracking-widest text-deep-black/50 animate-pulse">
              {lang === 'pt' ? 'CONSULTANDO SEUS PEDIDOS...' : 'LOOKING UP YOUR ORDERS...'}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-deep-black/20 text-center space-y-4">
              <ShoppingBag className="w-12 h-12 text-gold mx-auto" />
              <h3 className="text-lg font-black uppercase tracking-wider text-deep-black">
                {lang === 'pt' ? 'NENHUM PEDIDO ENCONTRADO AINDA' : 'NO ORDERS FOUND YET'}
              </h3>
              <p className="text-xs uppercase tracking-wider text-deep-black/60 max-w-md mx-auto">
                {lang === 'pt'
                  ? 'Você ainda não possui pedidos registrados sob este e-mail. Caso tenha feito um pedido recente com outro e-mail, consulte pela página de rastreio.'
                  : 'You have not placed any orders with this email yet. If you used a different email during checkout, you can track it via the USPS tracking page.'}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link
                  href="/#vitrine"
                  className="px-6 py-3 bg-deep-black text-gold hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-widest transition shadow"
                >
                  {lang === 'pt' ? 'CONHECER A COLEÇÃO' : 'EXPLORE COLLECTION'}
                </Link>
                <Link
                  href="/pedidos"
                  className="px-6 py-3 border-2 border-deep-black text-deep-black hover:bg-deep-black hover:text-white text-xs font-black uppercase tracking-widest transition"
                >
                  {lang === 'pt' ? 'CONSULTAR OUTRO PEDIDO' : 'TRACK ANOTHER ORDER'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((ord: any) => {
                const isShipped = ord.status === 'SHIPPED';
                const isInProd = ord.status === 'IN_PRODUCTION';
                const isDelivered = ord.status === 'DELIVERED';

                return (
                  <div
                    key={ord.order_id}
                    className="border-2 border-deep-black p-6 sm:p-8 space-y-6 bg-white shadow-luxury"
                  >
                    {/* Header do Card do Pedido */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-deep-black/10 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black">
                            PEDIDO #{ord.order_id}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                              isShipped
                                ? 'bg-gold text-deep-black'
                                : isInProd
                                ? 'bg-blue-600 text-white'
                                : isDelivered
                                ? 'bg-green-700 text-white'
                                : 'bg-gray-800 text-white'
                            }`}
                          >
                            {ord.status || 'CONFIRMADO'}
                          </span>
                        </div>
                        <p className="text-[10px] text-deep-black/60 font-mono font-bold">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : 'Data recente'}
                        </p>
                      </div>

                      {/* Total Pago */}
                      <div className="sm:text-right">
                        <span className="text-[10px] text-deep-black/60 font-bold uppercase block">
                          {lang === 'pt' ? 'TOTAL DO PEDIDO' : 'TOTAL AMOUNT'}
                        </span>
                        <span className="text-xl font-black text-gold font-mono">
                          ${(ord.total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Bloco de Rastreio USPS */}
                    <div className="p-4 bg-gray-50 border border-deep-black/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-deep-black">
                          <Truck className="w-4 h-4 text-gold" />
                          <span>{ord.carrier || 'USPS Priority Mail ($9.99)'}</span>
                        </div>
                        <p className="text-[10px] text-deep-black/60 font-mono">
                          {lang === 'pt' ? 'CÓDIGO DE RASTREIO:' : 'TRACKING NUMBER:'}{' '}
                          <strong className="text-deep-black font-bold">{ord.tracking_code || 'USPS-PENDING-DISPATCH'}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {ord.tracking_code && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ord.tracking_code)}
                            className="px-3 py-1.5 border border-deep-black text-deep-black hover:bg-deep-black hover:text-white text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5"
                          >
                            {copiedTracking === ord.tracking_code ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-600" />
                                <span>COPIADO</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-gold" />
                                <span>COPIAR</span>
                              </>
                            )}
                          </button>
                        )}
                        <a
                          href={
                            ord.tracking_code && !ord.tracking_code.includes('PENDING')
                              ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${ord.tracking_code}`
                              : 'https://tools.usps.com'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gold" />
                          <span>{lang === 'pt' ? 'RASTREAR NO USPS' : 'TRACK ON USPS.COM'}</span>
                        </a>
                      </div>
                    </div>

                    {/* Itens Comprados */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-deep-black">
                        {lang === 'pt' ? 'ITENS DO PEDIDO:' : 'ITEMS PURCHASED:'}
                      </h4>
                      <div className="divide-y divide-deep-black/10">
                        {(ord.items || []).map((it: any, i: number) => (
                          <div key={i} className="py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt={it.title}
                                  className="w-12 h-14 object-cover border border-deep-black/20 shrink-0"
                                />
                              )}
                              <div>
                                <h5 className="text-xs font-black uppercase tracking-wider text-deep-black">
                                  {it.title}
                                </h5>
                                <p className="text-[10px] text-deep-black/60 font-mono">
                                  {lang === 'pt' ? 'TAMANHO' : 'SIZE'}: {it.size} • {it.color} • QTD: {it.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-deep-black font-mono">
                              ${((it.unit_price || 0) * (it.quantity || 1)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Endereço de Entrega */}
                    {ord.shipping_address && (
                      <div className="pt-2 border-t border-deep-black/10 text-[11px] text-deep-black/70 uppercase">
                        <strong>{lang === 'pt' ? 'ENDEREÇO DE ENTREGA:' : 'SHIPPING DESTINATION:'}</strong>{' '}
                        {ord.shipping_address.address}, {ord.shipping_address.city} {ord.shipping_address.state} {ord.shipping_address.zip}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          ABA 2: ENDEREÇO SALVO DE ENTREGA
         ===================================================================== */}
      {activeTab === 'address' && (
        <div className="max-w-2xl bg-white border-2 border-deep-black p-6 sm:p-8 space-y-6 shadow-luxury">
          <div className="flex items-center justify-between border-b border-deep-black/10 pb-4">
            <div className="space-y-1">
              <h2 className="text-base font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span>{lang === 'pt' ? 'ENDEREÇO PADRÃO DE ENTREGA (EUA)' : 'DEFAULT DOMESTIC US SHIPPING ADDRESS'}</span>
              </h2>
              <p className="text-xs text-deep-black/60 uppercase">
                {lang === 'pt'
                  ? 'Este endereço será preenchido automaticamente ao realizar compras no site.'
                  : 'This address will automatically pre-fill at checkout for instant purchases.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                {lang === 'pt' ? 'ENDEREÇO (STREET ADDRESS):' : 'STREET ADDRESS:'}
              </label>
              <input
                type="text"
                required
                value={addressForm.address}
                onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                placeholder="Ex: 742 Commonwealth Ave"
                className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                APT / SUITE / UNIT (OPCIONAL):
              </label>
              <input
                type="text"
                value={addressForm.apt || ''}
                onChange={(e) => setAddressForm({ ...addressForm, apt: e.target.value })}
                placeholder="Ex: Apt 4B"
                className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  {lang === 'pt' ? 'CIDADE:' : 'CITY:'}
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  placeholder="Ex: Boston"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                  ESTADO (STATE):
                </label>
                <select
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
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
                  value={addressForm.zip}
                  onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                  placeholder="02215"
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saveAddressLoading}
                className="px-8 py-3.5 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow"
              >
                <Save className="w-4 h-4 text-gold" />
                <span>{saveAddressLoading ? (lang === 'pt' ? 'SALVANDO...' : 'SAVING...') : (lang === 'pt' ? 'SALVAR ENDEREÇO' : 'SAVE ADDRESS')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          ABA 3: MEUS DADOS PESSOAIS
         ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white border-2 border-deep-black p-6 sm:p-8 space-y-6 shadow-luxury">
          <div className="border-b border-deep-black/10 pb-4">
            <h2 className="text-base font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
              <User className="w-4 h-4 text-gold" />
              <span>{lang === 'pt' ? 'DADOS DO CLIENTE' : 'CUSTOMER PROFILE'}</span>
            </h2>
          </div>

          <div className="space-y-4 text-xs uppercase tracking-wider">
            <div className="p-3 bg-gray-50 border border-deep-black/10 space-y-1">
              <span className="text-[10px] text-deep-black/60 font-bold block">
                {lang === 'pt' ? 'NOME CADASTRADO' : 'REGISTERED NAME'}
              </span>
              <p className="font-black text-deep-black text-sm">{customer.name}</p>
            </div>

            <div className="p-3 bg-gray-50 border border-deep-black/10 space-y-1">
              <span className="text-[10px] text-deep-black/60 font-bold block">
                {lang === 'pt' ? 'E-MAIL DA CONTA' : 'ACCOUNT EMAIL'}
              </span>
              <p className="font-mono font-bold text-deep-black">{customer.email}</p>
            </div>

            <div className="p-3 bg-gray-50 border border-deep-black/10 space-y-1">
              <span className="text-[10px] text-deep-black/60 font-bold block">
                {lang === 'pt' ? 'TELEFONE (NOTIFICAÇÕES SMS)' : 'PHONE NUMBER'}
              </span>
              <p className="font-mono font-bold text-deep-black">{customer.phone || 'Não informado'}</p>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Link
                href="/pedidos"
                className="text-[11px] font-black uppercase tracking-widest text-gold hover:text-deep-black underline"
              >
                {lang === 'pt' ? 'CONSULTAR PEDIDOS AVULSOS (USPS)' : 'TRACK ANY ORDER VIA USPS'}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 text-[10px] font-black uppercase tracking-widest transition"
              >
                {lang === 'pt' ? 'DESCONECTAR DA CONTA' : 'LOG OUT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
