'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  Users,
  Lock,
  Tag,
  DollarSign,
  TrendingUp,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  LogOut,
  ShoppingBag,
  ExternalLink,
  Phone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  CreditCard,
  Edit3,
} from 'lucide-react';

export default function SellerPortalPage() {
  const { lang } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loggedSeller, setLoggedSeller] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sellerSales, setSellerSales] = useState<any[]>([]);

  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    password: '',
    coupon_code: '',
    payout_method: 'ZELLE',
    payout_key: '',
    payout_beneficiary: '',
  });

  // Modal para a vendedora editar seus dados de recebimento
  const [showEditPayoutModal, setShowEditPayoutModal] = useState(false);
  const [payoutFormData, setPayoutFormData] = useState({
    payout_method: 'ZELLE',
    payout_key: '',
    payout_beneficiary: '',
  });
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState(false);

  // Carrega vendas vinculadas à vendedora ao logar
  const fetchSellerSales = async (couponCode: string, sellerName: string) => {
    try {
      const res = await fetch('/api/backoffice/sales');
      if (res.ok) {
        const data = await res.json();
        const mySales = (data.sales || []).filter(
          (s: any) =>
            (s.coupon_code && s.coupon_code.toUpperCase() === couponCode.toUpperCase()) ||
            (s.seller_name && s.seller_name.toLowerCase().includes(sellerName.toLowerCase().split(' ')[0]))
        );
        setSellerSales(mySales);
      }
    } catch (e) {
      console.warn('Erro ao carregar vendas da vendedora:', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/backoffice/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          identifier,
          password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Credenciais inválidas.');
      }

      const data = await res.json();
      setLoggedSeller(data.seller);
      setPayoutFormData({
        payout_method: data.seller.payout_method || 'ZELLE',
        payout_key: data.seller.payout_key || data.seller.phone || '',
        payout_beneficiary: data.seller.payout_beneficiary || data.seller.name || '',
      });
      fetchSellerSales(data.seller.coupon_code, data.seller.name);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha no login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/backoffice/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          ...registerData,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao realizar cadastro.');
      }

      const data = await res.json();
      setLoggedSeller(data.seller);
      setPayoutFormData({
        payout_method: data.seller.payout_method || registerData.payout_method || 'ZELLE',
        payout_key: data.seller.payout_key || registerData.payout_key || '',
        payout_beneficiary: data.seller.payout_beneficiary || registerData.payout_beneficiary || '',
      });
      fetchSellerSales(data.seller.coupon_code, data.seller.name);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedSeller) return;
    setSavingPayout(true);

    try {
      const res = await fetch('/api/backoffice/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_payout',
          seller_id: loggedSeller.id,
          ...payoutFormData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLoggedSeller(data.seller);
        setShowEditPayoutModal(false);
        setPayoutSuccessMsg(true);
        setTimeout(() => setPayoutSuccessMsg(false), 4000);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao atualizar dados de pagamento.');
      }
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`);
    } finally {
      setSavingPayout(false);
    }
  };

  const handleLogout = () => {
    setLoggedSeller(null);
    setIdentifier('');
    setPassword('');
  };

  const copyShareLink = (coupon: string) => {
    const link = `https://anafitwear.com/?ref=${coupon}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-10 bg-white selection:bg-deep-black selection:text-gold min-h-[85vh]">
      {/* =========================================================================
          CASO 1: VENDEDORA NÃO LOGADA (LOGIN OU AUTO-CADASTRO)
         ========================================================================= */}
      {!loggedSeller ? (
        <div className="max-w-lg mx-auto space-y-8 animate-fadeIn pt-4">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-deep-black text-gold rounded-full flex items-center justify-center mx-auto shadow-luxury border border-gold">
              <Users className="w-7 h-7 text-gold" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              PORTAL DA EQUIPE & EMBAIXADORAS
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-deep-black">
              PORTAL DA VENDEDORA
            </h1>
            <p className="text-xs uppercase tracking-wider text-deep-black/60 font-medium">
              Acompanhe suas vendas comissionadas em dólares ($ USD), saldo acumulado e seu link exclusivo.
            </p>
          </div>

          {/* Abas Alternadoras: Entrar vs Quero me Cadastrar */}
          <div className="flex border-b-2 border-deep-black text-xs font-black uppercase tracking-widest">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 text-center transition ${
                authTab === 'login'
                  ? 'bg-deep-black text-gold'
                  : 'bg-white text-deep-black/60 hover:text-deep-black'
              }`}
            >
              JÁ TENHO CADASTRO (ENTRAR)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 text-center transition ${
                authTab === 'register'
                  ? 'bg-deep-black text-gold'
                  : 'bg-white text-deep-black/60 hover:text-deep-black'
              }`}
            >
              QUERO ME CADASTRAR ✦
            </button>
          </div>

          {/* FORMULÁRIO 1: LOGIN */}
          {authTab === 'login' && (
            <form onSubmit={handleLogin} className="bg-white border-2 border-deep-black p-6 sm:p-8 space-y-5 shadow-luxury">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-400 text-red-700 text-xs font-black uppercase tracking-wider">
                  ⚠ {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  SEU E-MAIL OU CÓDIGO DO CUPOM:
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: CAMILA10 OU JULIANA10"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs uppercase tracking-wider font-mono font-bold border border-deep-black/20 focus:outline-none focus:border-deep-black"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  SUA SENHA DE ACESSO:
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow"
              >
                {loading ? (
                  <span>ENTRANDO...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-gold" />
                    <span>ENTRAR NO MEU PAINEL</span>
                  </>
                )}
              </button>

              {/* Informação sobre como obter cadastro */}
              <div className="pt-4 border-t border-deep-black/10 text-center space-y-1 text-[10px] text-deep-black/60 uppercase">
                <p>Ainda não tem cupom cadastrado?</p>
                <button
                  type="button"
                  onClick={() => setAuthTab('register')}
                  className="text-gold font-black underline hover:text-deep-black"
                >
                  Clique aqui para criar seu cupom de vendedora
                </button>
              </div>
            </form>
          )}

          {/* FORMULÁRIO 2: CADASTRO DE NOVA VENDEDORA / AFILIADA */}
          {authTab === 'register' && (
            <form onSubmit={handleRegister} className="bg-white border-2 border-deep-black p-6 sm:p-8 space-y-5 shadow-luxury animate-fadeIn">
              <div className="p-3 bg-gold/10 border border-gold text-[11px] text-deep-black uppercase leading-relaxed font-bold">
                ✨ Cadastre-se em segundos! Você ganha <strong>10% de comissão em dólares ($ USD)</strong> sobre todas as vendas realizadas com o seu cupom.
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-400 text-red-700 text-xs font-black uppercase tracking-wider">
                  ⚠ {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  SEU NOME COMPLETO *
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: CAROLINA MENDES"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs uppercase tracking-wider font-bold border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    WHATSAPP / TELEFONE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (978) 000-0000"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    INSTAGRAM / REDE SOCIAL
                  </label>
                  <input
                    type="text"
                    placeholder="@seu_instagram"
                    value={registerData.instagram}
                    onChange={(e) => setRegisterData({ ...registerData, instagram: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-deep-black/20 focus:outline-none focus:border-deep-black"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  SEU E-MAIL DE ACESSO *
                </label>
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>

              {/* Cupom Desejado */}
              <div className="space-y-1.5 p-3.5 bg-deep-black/5 border border-deep-black/10">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gold" />
                  <span>CUPOM QUE VOCÊ DESEJA USAR *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: CAROL10 OU CAROLFIT"
                  value={registerData.coupon_code}
                  onChange={(e) => setRegisterData({ ...registerData, coupon_code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 text-sm uppercase tracking-wider font-mono font-black border border-deep-black/30 focus:outline-none focus:border-deep-black"
                />
                <span className="text-[9px] text-deep-black/60 uppercase block">
                  As pessoas usarão este código na sacola para gerar suas comissões.
                </span>
              </div>

              {/* Onde a dona deve pagar a comissão */}
              <div className="space-y-3 p-3.5 bg-deep-black/5 border border-deep-black/10">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-gold" />
                  <span>POR ONDE VOCÊ PREFERE RECEBER SUAS COMISSÕES? *</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-deep-black/70 uppercase block mb-1">MÉTODO PREFERIDO:</label>
                    <select
                      value={registerData.payout_method}
                      onChange={(e) => setRegisterData({ ...registerData, payout_method: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs font-bold uppercase border border-deep-black/20 focus:outline-none focus:border-deep-black bg-white"
                    >
                      <option value="ZELLE">ZELLE (EUA)</option>
                      <option value="VENMO">VENMO (EUA)</option>
                      <option value="CASHAPP">CASH APP (EUA)</option>
                      <option value="PIX">PIX (BANCO BRASIL)</option>
                      <option value="BANK">CONTA BANCÁRIA (EUA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-deep-black/70 uppercase block mb-1">CHAVE / CONTA / E-MAIL / @USUÁRIO: *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Telefone Zelle, @Venmo ou Chave Pix"
                      value={registerData.payout_key}
                      onChange={(e) => setRegisterData({ ...registerData, payout_key: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-deep-black/20 focus:outline-none focus:border-deep-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-deep-black/70 uppercase block mb-1">NOME DO TITULAR DA CONTA (OPCIONAL):</label>
                  <input
                    type="text"
                    placeholder="Nome completo do titular cadastrado no Zelle / Pix"
                    value={registerData.payout_beneficiary}
                    onChange={(e) => setRegisterData({ ...registerData, payout_beneficiary: e.target.value })}
                    className="w-full px-3 py-2 text-xs uppercase border border-deep-black/20 focus:outline-none focus:border-deep-black"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  CRIE UMA SENHA DE ACESSO *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-deep-black/20 focus:outline-none focus:border-deep-black"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gold hover:bg-deep-black hover:text-white text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow"
              >
                {loading ? (
                  <span>ATIVANDO CONTA...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>CRIAR MEU CADASTRO & ATIVAR CUPOM</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* =========================================================================
            CASO 2: VENDEDORA CONECTADA (DASHBOARD EXCLUSIVO)
           ========================================================================= */
        <div className="space-y-8 animate-fadeIn">
          {/* Header da Vendedora */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-deep-black text-white p-6 sm:p-8 border-2 border-gold shadow-luxury">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-white/10 text-[9px] font-black uppercase tracking-widest text-gold border border-gold/40">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                <span>PAINEL DA VENDEDORA CONECTADA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                OLÁ, {loggedSeller.name.toUpperCase()}!
              </h1>
              <p className="text-xs text-white/60 uppercase tracking-wider">
                Acompanhe o desempenho do seu cupom e suas vendas comissionadas em tempo real.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-white/30 hover:bg-white hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>SAIR</span>
            </button>
          </div>

          {/* Cartão do Cupom & Link de Divulgação */}
          <div className="bg-white border-2 border-deep-black p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-deep-black/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  SEU CÓDIGO EXCLUSIVO
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-deep-black bg-deep-black/5 px-4 py-1 border border-deep-black/20">
                    {loggedSeller.coupon_code}
                  </span>
                  <div className="text-xs uppercase font-bold text-deep-black/80 space-y-0.5">
                    <div>Sua Comissão: <strong className="text-gold font-mono">{loggedSeller.commission_pct}%</strong> por venda</div>
                    <div>Desconto para suas clientes: <strong className="text-deep-black font-mono">{loggedSeller.customer_discount_pct}% OFF</strong></div>
                  </div>
                </div>
              </div>

              {/* Botão Copiar Link */}
              <button
                type="button"
                onClick={() => copyShareLink(loggedSeller.coupon_code)}
                className="px-6 py-3.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow"
              >
                {copiedLink ? <Check className="w-4 h-4 text-gold" /> : <Copy className="w-4 h-4 text-gold" />}
                <span>{copiedLink ? 'LINK COPIADO!' : 'COPIAR LINK DE DIVULGAÇÃO'}</span>
              </button>
            </div>

            <p className="text-[11px] text-deep-black/60 uppercase font-mono">
              Link de Afiliada: <span className="text-deep-black font-bold">https://anafitwear.com/?ref={loggedSeller.coupon_code}</span>
            </p>
          </div>

          {/* 3 KPIs Financeiros da Vendedora */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Faturado */}
            <div className="bg-white border-2 border-deep-black p-6 space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
                FATURAMENTO GERADO (USD)
              </span>
              <p className="text-2xl sm:text-3xl font-black text-deep-black font-mono">
                ${(loggedSeller.total_revenue_generated || 0).toFixed(2)}
              </p>
              <span className="text-[9px] text-deep-black/50 uppercase font-bold block">
                {loggedSeller.total_sales_count || 0} vendas realizadas
              </span>
            </div>

            {/* Comissão Total Acumulada */}
            <div className="bg-deep-black text-white border-2 border-gold p-6 space-y-1 shadow-luxury">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                SUA COMISSÃO ACUMULADA ({loggedSeller.commission_pct}%)
              </span>
              <p className="text-2xl sm:text-3xl font-black text-gold font-mono">
                ${(loggedSeller.total_commission_earned || 0).toFixed(2)}
              </p>
              <span className="text-[9px] text-white/60 uppercase font-bold block">
                Já pago pela loja: ${(loggedSeller.total_commission_paid || 0).toFixed(2)}
              </span>
            </div>

            {/* Saldo Líquido a Receber */}
            <div className="bg-white border-2 border-deep-black p-6 space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
                SALDO PENDENTE A RECEBER
              </span>
              <p className="text-2xl sm:text-3xl font-black text-deep-black font-mono">
                ${Math.max(0, (loggedSeller.total_commission_earned || 0) - (loggedSeller.total_commission_paid || 0)).toFixed(2)}
              </p>
              <span className="text-[9px] text-green-700 font-black uppercase block">
                ✓ Disponível para repasse
              </span>
            </div>
          </div>

          {/* Cartão de Dados de Recebimento de Comissões */}
          <div className="bg-white border-2 border-deep-black p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-deep-black/10 pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                    ONDE VOCÊ RECEBE SUAS COMISSÕES
                  </span>
                  <h3 className="text-base font-black uppercase tracking-wider text-deep-black">
                    SEUS DADOS PARA PAGAMENTO PELA LOJA
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPayoutModal(true)}
                className="px-4 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition self-start sm:self-auto shadow"
              >
                EDITAR DADOS DE PAGAMENTO
              </button>
            </div>

            {payoutSuccessMsg && (
              <div className="p-3 bg-green-50 border border-green-500 text-green-800 text-xs font-black uppercase tracking-wider">
                ✓ Seus dados de recebimento foram atualizados com sucesso! A loja utilizará esta chave para repassar suas comissões.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs uppercase">
              <div className="p-3.5 bg-deep-black/5 border border-deep-black/10 space-y-1">
                <span className="text-[9px] font-black text-deep-black/60 block">MÉTODO ESCOLHIDO:</span>
                <span className="text-sm font-black text-deep-black">{loggedSeller.payout_method || 'ZELLE'}</span>
              </div>
              <div className="p-3.5 bg-deep-black/5 border border-deep-black/10 space-y-1">
                <span className="text-[9px] font-black text-deep-black/60 block">SUA CHAVE / CONTA / @USUÁRIO:</span>
                <span className="text-sm font-mono font-black text-gold">
                  {loggedSeller.payout_key || loggedSeller.phone || 'Não informada'}
                </span>
              </div>
              <div className="p-3.5 bg-deep-black/5 border border-deep-black/10 space-y-1">
                <span className="text-[9px] font-black text-deep-black/60 block">NOME DO TITULAR:</span>
                <span className="text-sm font-bold text-deep-black">
                  {loggedSeller.payout_beneficiary || loggedSeller.name}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-deep-black/60 uppercase">
              ✓ É por esta conta que a Ana Carina (proprietária da loja) fará os depósitos das suas comissões em dólares ($ USD).
            </p>
          </div>

          {/* Modal de Edição de Dados de Pagamento */}
          {showEditPayoutModal && (
            <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white border-2 border-deep-black w-full max-w-md p-6 sm:p-8 space-y-6 shadow-luxury">
                <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                      CONFIGURAÇÃO DE RECEBIMENTO
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-wider text-deep-black">
                      DADOS DE PAGAMENTO
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditPayoutModal(false)}
                    className="p-1 hover:text-gold transition text-deep-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSavePayout} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                      MÉTODO DE PAGAMENTO PREFERIDO *
                    </label>
                    <select
                      value={payoutFormData.payout_method}
                      onChange={(e) => setPayoutFormData({ ...payoutFormData, payout_method: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs font-bold uppercase border border-deep-black/30 focus:outline-none focus:border-deep-black bg-white"
                    >
                      <option value="ZELLE">ZELLE (EUA)</option>
                      <option value="VENMO">VENMO (EUA)</option>
                      <option value="CASHAPP">CASH APP (EUA)</option>
                      <option value="PIX">PIX (BANCO BRASIL)</option>
                      <option value="BANK">CONTA BANCÁRIA (EUA)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                      SUA CHAVE / TELEFONE / E-MAIL / @USUÁRIO *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Telefone Zelle, @Venmo ou Chave Pix"
                      value={payoutFormData.payout_key}
                      onChange={(e) => setPayoutFormData({ ...payoutFormData, payout_key: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-deep-black/30 focus:outline-none focus:border-deep-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                      NOME DO TITULAR DA CONTA
                    </label>
                    <input
                      type="text"
                      placeholder="Nome completo do titular cadastrado no Zelle / Pix"
                      value={payoutFormData.payout_beneficiary}
                      onChange={(e) => setPayoutFormData({ ...payoutFormData, payout_beneficiary: e.target.value })}
                      className="w-full px-3 py-2 text-xs uppercase border border-deep-black/30 focus:outline-none focus:border-deep-black"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditPayoutModal(false)}
                      className="px-4 py-2.5 border border-deep-black/30 hover:border-deep-black text-deep-black font-black uppercase tracking-wider text-xs transition"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      disabled={savingPayout}
                      className="px-6 py-2.5 bg-gold hover:bg-gold/90 text-deep-black font-black uppercase tracking-widest text-xs transition shadow"
                    >
                      {savingPayout ? 'SALVANDO...' : 'SALVAR DADOS'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Extrato Detalhado das Vendas da Vendedora */}
          <div className="bg-white border-2 border-deep-black overflow-x-auto shadow-sm">
            <div className="p-4 bg-deep-black text-white flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider">
                SUAS VENDAS REGISTRADAS COM O CUPOM {loggedSeller.coupon_code}
              </span>
              <span className="text-[10px] font-mono text-gold uppercase font-black">
                COMISSÃO CALCULADA DE {loggedSeller.commission_pct}%
              </span>
            </div>

            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black/5 text-[9px] font-black text-deep-black border-b border-deep-black/20">
                <tr>
                  <th className="p-3">DATA</th>
                  <th className="p-3">PEDIDO #</th>
                  <th className="p-3">CLIENTE</th>
                  <th className="p-3">PEÇAS VENDIDAS</th>
                  <th className="p-3 text-right">VALOR PAGO ($)</th>
                  <th className="p-3 text-right">SUA COMISSÃO ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {sellerSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-deep-black/40 font-bold">
                      NENHUMA VENDA REGISTRADA RECENTEMENTE COM O SEU CUPOM.
                    </td>
                  </tr>
                ) : (
                  sellerSales.map((sale: any, idx: number) => {
                    const myCommission = (Number(sale.subtotal_products) * (loggedSeller.commission_pct / 100));
                    return (
                      <tr key={idx} className="hover:bg-deep-black/5">
                        <td className="p-3 font-mono text-deep-black/60">
                          {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3 font-mono font-black text-deep-black">
                          {sale.order_id}
                        </td>
                        <td className="p-3 font-bold text-deep-black">
                          {sale.customer_name}
                        </td>
                        <td className="p-3">
                          {(sale.items || []).map((it: any, iIdx: number) => (
                            <span key={iIdx} className="block text-[10px]">
                              {it.title} ({it.color} • TAM {it.size})
                            </span>
                          ))}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-deep-black">
                          ${Number(sale.subtotal_products).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-gold bg-deep-black/5">
                          +${myCommission.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
