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
      fetchSellerSales(data.seller.coupon_code, data.seller.name);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha no login.');
    } finally {
      setLoading(false);
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
          CASO 1: VENDEDORA NÃO LOGADA (TELA DE LOGIN SEGURO)
         ========================================================================= */}
      {!loggedSeller ? (
        <div className="max-w-md mx-auto space-y-8 animate-fadeIn pt-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-deep-black text-gold rounded-full flex items-center justify-center mx-auto shadow-luxury border border-gold">
              <Users className="w-7 h-7 text-gold" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              PORTAL DA EQUIPE & EMBAIXADORAS
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-deep-black">
              ACESSO DA VENDEDORA
            </h1>
            <p className="text-xs uppercase tracking-wider text-deep-black/60 font-medium">
              Consulte suas vendas comissionadas, saldo acumulado e seu link exclusivo de divulgação.
            </p>
          </div>

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

            {/* Credenciais Rápidas de Teste para Ana Carina */}
            <div className="pt-4 border-t border-deep-black/10 space-y-1.5 text-[10px] text-deep-black/60 uppercase">
              <p className="font-black text-deep-black">CREDENCIAIS CADASTRADAS:</p>
              <p>• Camila: Cupom <code className="font-bold text-gold font-mono">CAMILA10</code> • Senha <code className="font-mono">camila123</code></p>
              <p>• Juliana: Cupom <code className="font-bold text-gold font-mono">JULIANA10</code> • Senha <code className="font-mono">juliana123</code></p>
            </div>
          </form>
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
