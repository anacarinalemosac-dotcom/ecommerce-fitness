'use client';

import React, { useState } from 'react';
import {
  Settings,
  CreditCard,
  Truck,
  ShieldCheck,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  DollarSign,
  Copy,
  Check,
  Smartphone,
  Activity,
  BarChart3,
  ShoppingBag,
  Radio,
  Globe,
  Download,
} from 'lucide-react';
import { useStoreSettings } from '../../context/StoreSettingsContext';

export function TechnicalSettingsView() {
  const { siteInfo, updateSiteInfo, changeMasterPassword, adminProfiles } = useStoreSettings();
  const [baseUrl, setBaseUrl] = useState('https://anafitwear.com');

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const [shippingRate, setShippingRate] = useState(siteInfo.flatShippingRate || 9.99);
  const [returnDays, setReturnDays] = useState(siteInfo.returnDays || 30);
  const [newMasterPass, setNewMasterPass] = useState('');
  const [confirmMasterPass, setConfirmMasterPass] = useState('');
  const [passSuccessMessage, setPassSuccessMessage] = useState(false);
  const [passErrorMessage, setPassErrorMessage] = useState('');
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Estados dos Pixels de Rastreamento
  const [metaPixelId, setMetaPixelId] = useState(siteInfo.metaPixelId || '');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(siteInfo.googleAnalyticsId || '');
  const [googleTagManagerId, setGoogleTagManagerId] = useState(siteInfo.googleTagManagerId || '');
  const [tiktokPixelId, setTiktokPixelId] = useState(siteInfo.tiktokPixelId || '');
  const [pinterestTagId, setPinterestTagId] = useState(siteInfo.pinterestTagId || '');
  const [savePixelsSuccess, setSavePixelsSuccess] = useState(false);

  // Estados da Conexão Direta TikTok Shop Open API (Opção 3)
  const [tiktokShopAppKey, setTiktokShopAppKey] = useState(siteInfo.tiktokShopAppKey || '');
  const [tiktokShopAppSecret, setTiktokShopAppSecret] = useState(siteInfo.tiktokShopAppSecret || '');
  const [tiktokShopAccessToken, setTiktokShopAccessToken] = useState(siteInfo.tiktokShopAccessToken || '');
  const [tiktokShopId, setTiktokShopId] = useState(siteInfo.tiktokShopId || '7494943021231081116');
  const [tiktokShopCipher, setTiktokShopCipher] = useState(siteInfo.tiktokShopCipher || '');
  const [tiktokShopAutoSync, setTiktokShopAutoSync] = useState(siteInfo.tiktokShopAutoSync || false);
  const [saveTikTokSuccess, setSaveTikTokSuccess] = useState(false);
  const [testingTikTok, setTestingTikTok] = useState(false);
  const [syncingAllTikTok, setSyncingAllTikTok] = useState(false);
  const [tiktokStatusMsg, setTiktokStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  React.useEffect(() => {
    if (siteInfo.metaPixelId !== undefined) setMetaPixelId(siteInfo.metaPixelId || '');
    if (siteInfo.googleAnalyticsId !== undefined) setGoogleAnalyticsId(siteInfo.googleAnalyticsId || '');
    if (siteInfo.googleTagManagerId !== undefined) setGoogleTagManagerId(siteInfo.googleTagManagerId || '');
    if (siteInfo.tiktokPixelId !== undefined) setTiktokPixelId(siteInfo.tiktokPixelId || '');
    if (siteInfo.pinterestTagId !== undefined) setPinterestTagId(siteInfo.pinterestTagId || '');
    if (siteInfo.tiktokShopAppKey !== undefined) setTiktokShopAppKey(siteInfo.tiktokShopAppKey || '');
    if (siteInfo.tiktokShopAppSecret !== undefined) setTiktokShopAppSecret(siteInfo.tiktokShopAppSecret || '');
    if (siteInfo.tiktokShopAccessToken !== undefined) setTiktokShopAccessToken(siteInfo.tiktokShopAccessToken || '');
    if (siteInfo.tiktokShopId !== undefined) setTiktokShopId(siteInfo.tiktokShopId || '7494943021231081116');
    if (siteInfo.tiktokShopCipher !== undefined) setTiktokShopCipher(siteInfo.tiktokShopCipher || '');
    if (siteInfo.tiktokShopAutoSync !== undefined) setTiktokShopAutoSync(siteInfo.tiktokShopAutoSync || false);
  }, [
    siteInfo.metaPixelId,
    siteInfo.googleAnalyticsId,
    siteInfo.googleTagManagerId,
    siteInfo.tiktokPixelId,
    siteInfo.pinterestTagId,
    siteInfo.tiktokShopAppKey,
    siteInfo.tiktokShopAppSecret,
    siteInfo.tiktokShopAccessToken,
    siteInfo.tiktokShopId,
    siteInfo.tiktokShopCipher,
    siteInfo.tiktokShopAutoSync,
  ]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleSavePixels = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfo({
      metaPixelId: metaPixelId.trim(),
      googleAnalyticsId: googleAnalyticsId.trim(),
      googleTagManagerId: googleTagManagerId.trim(),
      tiktokPixelId: tiktokPixelId.trim(),
      pinterestTagId: pinterestTagId.trim(),
    });
    setSavePixelsSuccess(true);
    setTimeout(() => setSavePixelsSuccess(false), 4000);
  };

  const handleSaveTikTokSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfo({
      tiktokShopAppKey: tiktokShopAppKey.trim(),
      tiktokShopAppSecret: tiktokShopAppSecret.trim(),
      tiktokShopAccessToken: tiktokShopAccessToken.trim(),
      tiktokShopId: tiktokShopId.trim() || '7494943021231081116',
      tiktokShopCipher: tiktokShopCipher.trim(),
      tiktokShopAutoSync,
    });
    setSaveTikTokSuccess(true);
    setTiktokStatusMsg({
      type: 'success',
      text: '✓ Credenciais do TikTok Shop salvas com sucesso! O sistema está pronto para sincronizar produtos.',
    });
    setTimeout(() => setSaveTikTokSuccess(false), 4000);
  };

  const handleTestTikTokConnection = async () => {
    setTestingTikTok(true);
    setTiktokStatusMsg(null);
    try {
      const res = await fetch('/api/catalog/tiktok/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          credentials: {
            appKey: tiktokShopAppKey.trim(),
            appSecret: tiktokShopAppSecret.trim(),
            accessToken: tiktokShopAccessToken.trim(),
            sellerId: tiktokShopId.trim(),
            shopCipher: tiktokShopCipher.trim(),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.configured) {
        setTiktokStatusMsg({
          type: 'success',
          text: `✓ Conexão validada! ${data.message}`,
        });
      } else {
        setTiktokStatusMsg({
          type: 'info',
          text: `ℹ ${data.message || 'Chaves ainda não configuradas ou em modo de validação.'}`,
        });
      }
    } catch (err: any) {
      setTiktokStatusMsg({
        type: 'error',
        text: `Erro ao testar conexão: ${err.message}`,
      });
    } finally {
      setTestingTikTok(false);
    }
  };

  const handleSyncAllTikTok = async () => {
    if (!window.confirm('Deseja iniciar a sincronização em lote de todos os produtos do catálogo para o TikTok Shop (até 200 produtos permitidos)?')) {
      return;
    }

    setSyncingAllTikTok(true);
    setTiktokStatusMsg(null);
    try {
      const res = await fetch('/api/catalog/tiktok/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_sync',
          credentials: {
            appKey: tiktokShopAppKey.trim(),
            appSecret: tiktokShopAppSecret.trim(),
            accessToken: tiktokShopAccessToken.trim(),
            sellerId: tiktokShopId.trim(),
            shopCipher: tiktokShopCipher.trim(),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTiktokStatusMsg({
          type: 'success',
          text: `🎉 Sincronização concluída! ${data.totalProcessed} produtos foram processados e validados segundo as diretrizes de qualidade do TikTok Shop US.`,
        });
      } else {
        setTiktokStatusMsg({
          type: 'error',
          text: `Aviso na sincronização: ${data.error || 'Não foi possível completar o envio.'}`,
        });
      }
    } catch (err: any) {
      setTiktokStatusMsg({
        type: 'error',
        text: `Falha na sincronização: ${err.message}`,
      });
    } finally {
      setSyncingAllTikTok(false);
    }
  };

  const handleSaveShipping = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfo({
      flatShippingRate: Number(shippingRate) || 9.99,
      returnDays: Number(returnDays) || 30,
    });
    setSaveSettingsSuccess(true);
    setTimeout(() => setSaveSettingsSuccess(false), 4000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterPass || newMasterPass.length < 4) {
      setPassErrorMessage('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (newMasterPass !== confirmMasterPass) {
      setPassErrorMessage('As senhas não coincidem!');
      return;
    }

    changeMasterPassword(newMasterPass);
    setPassErrorMessage('');
    setPassSuccessMessage(true);
    setNewMasterPass('');
    setConfirmMasterPass('');
    setTimeout(() => setPassSuccessMessage(false), 4000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              INFRAESTRUTURA & SEGURANÇA
            </span>
            <h2 className="text-lg font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold" />
              <span>7. CONFIGURAÇÕES TÉCNICAS E ACESSOS</span>
            </h2>
          </div>
        </div>
        <p className="text-xs text-deep-black/70 uppercase tracking-wide">
          Gerencie gateways de pagamento (Stripe / Zelle), tabela de frete USPS e controle de permissões de usuários.
        </p>
      </div>

      {saveSettingsSuccess && (
        <div className="p-4 bg-green-50 border-2 border-green-600 text-green-900 text-xs font-black uppercase tracking-wider flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-green-700" />
          <span>✓ Parâmetros de frete e prazos atualizados com sucesso!</span>
        </div>
      )}

      {/* 1. MEIOS DE PAGAMENTO & STATUS DE GATEWAYS */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gold" />
            <span>MEIOS DE PAGAMENTO & WEBHOOKS</span>
          </h3>
          <span className="text-[10px] text-green-700 font-black uppercase flex items-center gap-1.5 bg-green-50 px-2 py-0.5 border border-green-300">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
            <span>GATEWAYS ATIVOS</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Stripe */}
          <div className="p-5 border-2 border-deep-black space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-deep-black text-white flex items-center justify-center font-black text-xs">
                  S
                </div>
                <div>
                  <strong className="text-xs font-black uppercase text-deep-black block">STRIPE PAYMENTS</strong>
                  <span className="text-[10px] text-deep-black/60 font-mono">Cartões de Crédito / Débito & Apple Pay</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-300 text-[9px] font-black uppercase">
                CONECTADO
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-deep-black/10 pb-1.5">
                <span className="text-deep-black/60 font-bold uppercase">MOEDA BASE:</span>
                <span className="font-mono font-bold text-deep-black">USD ($ Dólares Americanos)</span>
              </div>
              <div className="flex justify-between border-b border-deep-black/10 pb-1.5">
                <span className="text-deep-black/60 font-bold uppercase">TAXA MÉDIA:</span>
                <span className="font-mono font-bold text-deep-black">2.9% + $0.30 por transação</span>
              </div>
              <div className="flex justify-between items-center border-b border-deep-black/10 pb-1.5">
                <span className="text-deep-black/60 font-bold uppercase">WEBHOOK:</span>
                <span className="font-mono text-[10px] text-deep-black truncate max-w-[200px]">/api/webhooks/stripe</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-deep-black/60 font-bold uppercase">STATUS WEBHOOK:</span>
                <span className="text-[10px] font-mono font-bold text-green-700">checkout.session.completed (OK)</span>
              </div>
            </div>
          </div>

          {/* Card Zelle & Venmo */}
          <div className="p-5 border-2 border-gold space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gold text-deep-black flex items-center justify-center font-black text-xs">
                  Z
                </div>
                <div>
                  <strong className="text-xs font-black uppercase text-deep-black block">ZELLE & VENMO (DIRETO)</strong>
                  <span className="text-[10px] text-deep-black/60 font-mono">Pagamento Direto sem Taxas (Showroom / PDV)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-gold/20 text-deep-black border border-gold text-[9px] font-black uppercase">
                0% TAXA
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-deep-black/10 pb-1.5">
                <span className="text-deep-black/60 font-bold uppercase">CHAVE ZELLE OFICIAL:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-deep-black">
                  <span>{siteInfo.phone}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(siteInfo.phone, 'zelle')}
                    className="p-1 hover:text-gold transition"
                  >
                    {copiedKey === 'zelle' ? <Check className="w-3 h-3 text-gold" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between border-b border-deep-black/10 pb-1.5">
                <span className="text-deep-black/60 font-bold uppercase">VENMO:</span>
                <span className="font-mono font-bold text-deep-black">@anafitnessweareua</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-deep-black/60 font-bold uppercase">LIQUIDAÇÃO:</span>
                <span className="font-bold text-deep-black">Imediata na conta bancária US</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CÁLCULO DE FRETE & PRAZOS (USPS) */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
            <Truck className="w-4 h-4 text-gold" />
            <span>TABELA DE FRETE & PRAZOS DE ENVIO (USPS)</span>
          </h3>
          <span className="text-[10px] text-deep-black/60 uppercase font-mono font-bold">
            Envio Doméstico (50 Estados)
          </span>
        </div>

        <form onSubmit={handleSaveShipping} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
              TAXA FIXA DE ENVIO ($ USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 font-mono font-bold text-deep-black">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={shippingRate}
                onChange={(e) => setShippingRate(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 border border-deep-black/30 text-xs font-mono font-black focus:outline-none focus:border-deep-black"
              />
            </div>
            <span className="text-[9px] text-deep-black/60 uppercase block">
              Cobrado automaticamente no checkout online.
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
              PRAZO PARA TROCAS & DEVOLUÇÕES (DIAS) *
            </label>
            <input
              type="number"
              min="7"
              max="90"
              required
              value={returnDays}
              onChange={(e) => setReturnDays(parseInt(e.target.value) || 30)}
              className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono font-black focus:outline-none focus:border-deep-black"
            />
            <span className="text-[9px] text-deep-black/60 uppercase block">
              Exibido no rodapé e nas páginas de políticas.
            </span>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow"
            >
              <Save className="w-4 h-4 text-gold" />
              <span>Salvar Parâmetros de Frete</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. PERMISSÕES DE USUÁRIOS & NÍVEIS DE ACESSO */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>PERMISSÕES DE USUÁRIOS & CONTROLE DE ACESSO</span>
          </h3>
          <span className="text-[10px] text-deep-black/60 uppercase font-mono font-bold">
            2 Níveis Hierárquicos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nível Administrador */}
          <div className="p-5 border-2 border-deep-black space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-deep-black text-gold text-[9px] font-black uppercase tracking-widest">
                NÍVEL 1: PROPRIETÁRIA / ADMIN
              </span>
              <Lock className="w-4 h-4 text-gold" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider text-deep-black">
              ACESSO MASTER TOTAL (BACKOFFICE)
            </h4>
            <ul className="text-xs text-deep-black/80 uppercase space-y-1.5 font-bold pt-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Visualização de Preço de Custo (cost_price) e Margem Unitária</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>DRE Completo e Lucro Líquido Real no Bolso</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Cadastro, aprovação e liquidação de comissões de vendedoras</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Importação em massa, baixa de estoque e personalização de tema</span>
              </li>
            </ul>
          </div>

          {/* Nível Vendedora / Operador */}
          <div className="p-5 border-2 border-deep-black/30 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-deep-black/10 text-deep-black text-[9px] font-black uppercase tracking-widest">
                NÍVEL 2: VENDEDORA / CAIXA
              </span>
              <Smartphone className="w-4 h-4 text-deep-black/60" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider text-deep-black">
              ACESSO RESTRITO (PDV & PORTAL)
            </h4>
            <ul className="text-xs text-deep-black/80 uppercase space-y-1.5 font-bold pt-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Acesso ao Caixa PDV (/pos) para registrar vendas balcão</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Acesso ao Portal da Vendedora (/vendedora) com senha individual</span>
              </li>
              <li className="flex items-center gap-1.5 text-red-700">
                <span className="w-3.5 h-3.5 flex items-center justify-center font-black">✕</span>
                <span>SEM ACESSO ao lucro líquido total ou custos de confecção</span>
              </li>
              <li className="flex items-center gap-1.5 text-red-700">
                <span className="w-3.5 h-3.5 flex items-center justify-center font-black">✕</span>
                <span>SEM ACESSO a configurações de tema ou dados de outras vendedoras</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Administradores Autorizados com Acesso Master Total */}
        <div className="p-5 border-2 border-gold bg-gold/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold/30 pb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
              <Key className="w-4 h-4 text-gold" />
              <span>USUÁRIOS COM ACESSO MASTER TOTAL AO ERP ({adminProfiles?.length || 2} USUÁRIAS)</span>
            </h4>
            <span className="self-start sm:self-auto px-2 py-0.5 bg-green-700 text-white text-[9px] font-black uppercase tracking-widest">
              ATIVOS & SINCRONIZADOS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(adminProfiles || []).map((adm) => (
              <div key={adm.id} className="p-4 bg-white border border-deep-black/20 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-deep-black">{adm.name}</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-deep-black text-gold">
                    {adm.name === 'Mayne' ? 'CO-ADMINISTRADORA / MASTER' : 'PROPRIETÁRIA / MASTER'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-deep-black/70 space-y-0.5">
                  <span className="block font-bold">E-mail: {adm.email}</span>
                  <span className="text-[10px] text-green-700 font-bold block pt-1">
                    ✓ Permissões Idênticas: Catálogo, Vendas, DRE, Margens, POS e Configurações
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alterar Senha Master */}
        <div className="pt-4 border-t border-deep-black/10">
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-gold" />
              <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
                ALTERAR SENHA MASTER DO BACKOFFICE
              </h4>
            </div>

            {passSuccessMessage && (
              <div className="p-3 bg-green-50 border border-green-400 text-green-900 text-xs font-black uppercase">
                ✓ Senha master atualizada com sucesso!
              </div>
            )}

            {passErrorMessage && (
              <div className="p-3 bg-red-50 border border-red-400 text-red-900 text-xs font-black uppercase">
                ⚠️ {passErrorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  NOVA SENHA MASTER *
                </label>
                <input
                  type="password"
                  required
                  value={newMasterPass}
                  onChange={(e) => setNewMasterPass(e.target.value)}
                  placeholder="Nova senha..."
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  CONFIRMAR NOVA SENHA *
                </label>
                <input
                  type="password"
                  required
                  value={confirmMasterPass}
                  onChange={(e) => setConfirmMasterPass(e.target.value)}
                  placeholder="Repita a nova senha..."
                  className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold focus:outline-none focus:border-deep-black"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-widest transition shadow"
            >
              ATUALIZAR SENHA MASTER
            </button>
          </form>
        </div>
      </div>

      {/* 4. PIXELS DE RASTREAMENTO & MARKETING ANALYTICS */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deep-black/10 pb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
            <Activity className="w-4 h-4 text-gold" />
            <span>4. PIXELS DE RASTREAMENTO & MARKETING ANALYTICS</span>
          </h3>
          <span className="text-[10px] text-deep-black/60 font-mono">
            Meta (FB/IG) • Google Analytics • GTM • TikTok • Pinterest
          </span>
        </div>

        <p className="text-xs text-deep-black/70 uppercase tracking-wide">
          Insira abaixo os IDs oficiais das suas contas de anúncio. O e-commerce injeta os scripts automaticamente e dispara eventos de conversão e-commerce padrão (<span className="font-mono font-bold">PageView</span>, <span className="font-mono font-bold">ViewContent</span>, <span className="font-mono font-bold">AddToCart</span>, <span className="font-mono font-bold">InitiateCheckout</span> e <span className="font-mono font-bold">Purchase</span>).
        </p>

        {savePixelsSuccess && (
          <div className="p-4 bg-green-50 border-2 border-green-600 text-green-900 text-xs font-black uppercase tracking-wider flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-green-700" />
            <span>✓ IDs dos Pixels de rastreamento salvos e sincronizados na nuvem com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSavePixels} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meta Pixel */}
            <div className="p-4 border border-deep-black/20 bg-stone-50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  META PIXEL (FACEBOOK & INSTAGRAM ADS)
                </label>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                    metaPixelId
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {metaPixelId ? '● ATIVO' : 'NÃO CONFIGURADO'}
                </span>
              </div>
              <input
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                placeholder="Ex: 1234567890123456"
                className="w-full px-3 py-2 border border-deep-black/30 font-mono text-xs bg-white font-bold focus:outline-none focus:border-deep-black"
              />
              <p className="text-[10px] text-deep-black/60 uppercase">
                Copie o ID numérico do seu Pixel no Gerenciador de Eventos da Meta (Meta Business Suite).
              </p>
            </div>

            {/* Google Analytics 4 */}
            <div className="p-4 border border-deep-black/20 bg-stone-50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                  GOOGLE ANALYTICS 4 (GA4 MEASUREMENT ID)
                </label>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                    googleAnalyticsId
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {googleAnalyticsId ? '● ATIVO' : 'NÃO CONFIGURADO'}
                </span>
              </div>
              <input
                type="text"
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                placeholder="Ex: G-XXXXXXXXXX"
                className="w-full px-3 py-2 border border-deep-black/30 font-mono text-xs bg-white font-bold focus:outline-none focus:border-deep-black"
              />
              <p className="text-[10px] text-deep-black/60 uppercase">
                ID da métrica encontrado no painel do Google Analytics 4 em Administrador &gt; Fluxos de Dados.
              </p>
            </div>

            {/* Google Tag Manager */}
            <div className="p-4 border border-deep-black/20 bg-stone-50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                  GOOGLE TAG MANAGER (GTM CONTAINER ID)
                </label>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                    googleTagManagerId
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {googleTagManagerId ? '● ATIVO' : 'OPCIONAL'}
                </span>
              </div>
              <input
                type="text"
                value={googleTagManagerId}
                onChange={(e) => setGoogleTagManagerId(e.target.value)}
                placeholder="Ex: GTM-XXXXXXX"
                className="w-full px-3 py-2 border border-deep-black/30 font-mono text-xs bg-white font-bold focus:outline-none focus:border-deep-black"
              />
              <p className="text-[10px] text-deep-black/60 uppercase">
                Opcional se você já usar Google Analytics direto. ID do contêiner GTM (formato GTM-XXXXXXX).
              </p>
            </div>

            {/* TikTok Pixel */}
            <div className="p-4 border border-deep-black/20 bg-stone-50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-600"></span>
                  TIKTOK PIXEL (TIKTOK ADS)
                </label>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                    tiktokPixelId
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {tiktokPixelId ? '● ATIVO' : 'NÃO CONFIGURADO'}
                </span>
              </div>
              <input
                type="text"
                value={tiktokPixelId}
                onChange={(e) => setTiktokPixelId(e.target.value)}
                placeholder="Ex: CXXXXXXXXXXXXXXX"
                className="w-full px-3 py-2 border border-deep-black/30 font-mono text-xs bg-white font-bold focus:outline-none focus:border-deep-black"
              />
              <p className="text-[10px] text-deep-black/60 uppercase">
                ID do Pixel do TikTok Ads encontrado em Ferramentas &gt; Eventos &gt; Web Events.
              </p>
            </div>

            {/* Pinterest Tag */}
            <div className="p-4 border border-deep-black/20 bg-stone-50 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  PINTEREST TAG (PINTEREST ADS)
                </label>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                    pinterestTagId
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {pinterestTagId ? '● ATIVO' : 'NÃO CONFIGURADO'}
                </span>
              </div>
              <input
                type="text"
                value={pinterestTagId}
                onChange={(e) => setPinterestTagId(e.target.value)}
                placeholder="Ex: 2612345678901"
                className="w-full max-w-md px-3 py-2 border border-deep-black/30 font-mono text-xs bg-white font-bold focus:outline-none focus:border-deep-black"
              />
              <p className="text-[10px] text-deep-black/60 uppercase">
                Tag ID encontrado no Gerenciador de Anúncios do Pinterest &gt; Conversões &gt; Tag do Pinterest.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>SALVAR PIXELS DE RASTREAMENTO</span>
            </button>
          </div>
        </form>
      </div>

      {/* 5. CATÁLOGO DINÂMICO & SOCIAL COMMERCE (TIKTOK SHOP / INSTAGRAM / META) */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deep-black/10 pb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gold" />
            <span>5. CATÁLOGO DINÂMICO &amp; SOCIAL COMMERCE (TIKTOK SHOP &amp; INSTAGRAM)</span>
          </h3>
          <span className="text-[10px] text-green-700 font-black uppercase flex items-center gap-1.5 bg-green-50 px-2 py-0.5 border border-green-300">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
            <span>SINCRONIZAÇÃO EM TEMPO REAL ATIVA</span>
          </span>
        </div>

        <p className="text-xs text-deep-black/70 uppercase tracking-wide leading-relaxed">
          Sincronize todo o estoque e catálogo da <strong className="text-deep-black">ANA FITNESS WEAR</strong> diretamente com o <strong className="text-deep-black">TikTok Shop</strong>, <strong className="text-deep-black">TikTok for Business</strong>, <strong className="text-deep-black">Instagram Shopping</strong> e <strong className="text-deep-black">Facebook Shop (Meta Commerce Manager)</strong>. 
          Ao cadastrar a URL do Feed abaixo, seus produtos aparecem automaticamente na aba Loja do seu perfil, podem ser marcados nos seus vídeos orgânicos e lives, e os clientes compram com 1 toque.
        </p>

        {/* URLs do Feed de Dados */}
        <div className="space-y-4">
          {/* Card Feed Principal XML */}
          <div className="p-5 border-2 border-deep-black bg-stone-50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-deep-black text-gold text-[9px] font-black uppercase tracking-widest">
                  OFICIAL • PADRÃO XML RSS 2.0
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                  Feed TikTok Shop &amp; Meta Catalog (Recomendado)
                </span>
              </div>
              <span className="text-[10px] font-mono text-green-700 font-bold">
                ✓ Compatível com TikTok Shop &amp; Meta Commerce
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 bg-white border border-deep-black/30 px-3 py-2 text-xs font-mono font-bold text-deep-black truncate select-all">
                {`${baseUrl}/api/catalog/tiktok`}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(`${baseUrl}/api/catalog/tiktok`, 'tiktok-xml')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                    copiedKey === 'tiktok-xml'
                      ? 'bg-green-600 text-white'
                      : 'bg-deep-black text-white hover:bg-gold hover:text-deep-black'
                  }`}
                >
                  {copiedKey === 'tiktok-xml' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar URL</span>
                    </>
                  )}
                </button>
                <a
                  href={`${baseUrl}/api/catalog/tiktok`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border border-deep-black bg-white hover:bg-stone-100 text-deep-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition"
                  title="Abrir Feed XML no navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Feed</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-deep-black/70">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Variações separadas por tamanho (S, M, L) e cor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Rastreamento UTM automático para vendas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>Frete fixo $9.99 USPS e estoque em tempo real</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feed CSV Alternativo */}
            <div className="p-4 border border-deep-black/20 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-gold" />
                  <span>Feed Alternativo em Formato CSV</span>
                </div>
                <span className="text-[9px] font-mono text-stone-500 uppercase">Planilha / Tabela</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${baseUrl}/api/catalog/tiktok?format=csv`}
                  className="flex-1 bg-stone-50 border border-deep-black/20 px-2 py-1.5 text-[11px] font-mono font-bold text-deep-black/80 truncate"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(`${baseUrl}/api/catalog/tiktok?format=csv`, 'tiktok-csv')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase transition shrink-0 ${
                    copiedKey === 'tiktok-csv' ? 'bg-green-600 text-white' : 'bg-deep-black text-white hover:bg-gold hover:text-deep-black'
                  }`}
                >
                  {copiedKey === 'tiktok-csv' ? 'Copiado!' : 'Copiar'}
                </button>
                <a
                  href={`${baseUrl}/api/catalog/tiktok?format=csv`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 border border-deep-black/30 hover:bg-stone-100 text-deep-black transition shrink-0"
                  title="Baixar ou visualizar CSV"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[10px] text-deep-black/60 uppercase">
                Utilize caso o TikTok ou Meta solicite arquivo em formato delimitado por vírgula (CSV).
              </p>
            </div>

            {/* Feed Meta / Instagram */}
            <div className="p-4 border border-deep-black/20 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gold" />
                  <span>Meta Catalog / Instagram Shopping</span>
                </div>
                <span className="text-[9px] font-mono text-stone-500 uppercase">Meta Commerce</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${baseUrl}/api/catalog/facebook`}
                  className="flex-1 bg-stone-50 border border-deep-black/20 px-2 py-1.5 text-[11px] font-mono font-bold text-deep-black/80 truncate"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(`${baseUrl}/api/catalog/facebook`, 'meta-feed')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase transition shrink-0 ${
                    copiedKey === 'meta-feed' ? 'bg-green-600 text-white' : 'bg-deep-black text-white hover:bg-gold hover:text-deep-black'
                  }`}
                >
                  {copiedKey === 'meta-feed' ? 'Copiado!' : 'Copiar'}
                </button>
                <a
                  href={`${baseUrl}/api/catalog/facebook`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 border border-deep-black/30 hover:bg-stone-100 text-deep-black transition shrink-0"
                  title="Abrir Feed Meta"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[10px] text-deep-black/60 uppercase">
                Endpoint otimizado com os mesmos cabeçalhos RSS 2.0 aceitos no Meta Commerce Manager.
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            INTEGRAÇÃO OFICIAL TIKTOK SHOP OPEN API (OPÇÃO 3: ENVIO EM TEMPO REAL)
           ========================================================================= */}
        <div className="p-6 border-2 border-gold bg-gradient-to-br from-white via-amber-50/20 to-white shadow-luxury space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-deep-black/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  OPÇÃO 3 ATIVADA • TIKTOK SHOP OPEN API
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black mt-0.5">
                CONEXÃO DIRETA EM TEMPO REAL (TRANSMISSÃO IMEDIATA)
              </h3>
              <p className="text-xs text-deep-black/70 mt-1 max-w-2xl leading-relaxed">
                Cadastre suas chaves de API da sua loja no TikTok Shop. Ao ativar, você clica em <strong>Salvar Produto</strong> no site e o look é criado diretamente no TikTok Shop US com suas fotos, tamanhos (S/M/L), estoque e descrição squat-proof!
              </p>
            </div>

            <div className="bg-deep-black text-white px-3 py-2 border border-gold/40 text-center shrink-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-gold block">
                COTA AUTORIZADA
              </span>
              <span className="text-lg font-mono font-black text-gold">200 PRODUTOS</span>
            </div>
          </div>

          {/* Mensagem de Feedback de Conexão ou Sincronização */}
          {tiktokStatusMsg && (
            <div
              className={`p-4 border-2 flex items-start gap-3 animate-fadeIn text-xs ${
                tiktokStatusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                  : tiktokStatusMsg.type === 'error'
                  ? 'bg-red-50 border-red-500 text-red-950 font-bold'
                  : 'bg-amber-50 border-amber-400 text-amber-950'
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="leading-relaxed">{tiktokStatusMsg.text}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveTikTokSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* App Key */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                  <span>APP KEY DO TIKTOK SHOP *</span>
                  <span className="text-[9px] text-stone-500 font-mono">partner.tiktokshop.com</span>
                </label>
                <input
                  type="text"
                  value={tiktokShopAppKey}
                  onChange={(e) => setTiktokShopAppKey(e.target.value)}
                  placeholder="Ex: 6b7a8c9d0e1f2..."
                  className="w-full bg-white border border-deep-black/30 px-3 py-2 text-xs font-mono font-bold text-deep-black focus:outline-none focus:border-gold"
                />
              </div>

              {/* App Secret */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                  <span>APP SECRET DO TIKTOK SHOP *</span>
                  <span className="text-[9px] text-stone-500 font-mono">HMAC-SHA256</span>
                </label>
                <input
                  type="password"
                  value={tiktokShopAppSecret}
                  onChange={(e) => setTiktokShopAppSecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-white border border-deep-black/30 px-3 py-2 text-xs font-mono font-bold text-deep-black focus:outline-none focus:border-gold"
                />
              </div>

              {/* Access Token */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black flex items-center justify-between">
                  <span>AUTHORIZED SHOP ACCESS TOKEN *</span>
                  <span className="text-[9px] text-stone-500 font-mono">Token de Autorização da Loja</span>
                </label>
                <input
                  type="text"
                  value={tiktokShopAccessToken}
                  onChange={(e) => setTiktokShopAccessToken(e.target.value)}
                  placeholder="Ex: TTP_abc123xyz789..."
                  className="w-full bg-white border border-deep-black/30 px-3 py-2 text-xs font-mono font-bold text-deep-black focus:outline-none focus:border-gold"
                />
              </div>

              {/* Seller ID / Shop ID */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black">
                  SELLER ID / SHOP ID (EUA)
                </label>
                <input
                  type="text"
                  value={tiktokShopId}
                  onChange={(e) => setTiktokShopId(e.target.value)}
                  placeholder="7494943021231081116"
                  className="w-full bg-white border border-deep-black/30 px-3 py-2 text-xs font-mono font-bold text-deep-black focus:outline-none focus:border-gold"
                />
                <span className="text-[9px] text-stone-500">ID da sua loja no TikTok Seller Center US</span>
              </div>

              {/* Shop Cipher (Opcional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-deep-black">
                  SHOP CIPHER (OPCIONAL)
                </label>
                <input
                  type="text"
                  value={tiktokShopCipher}
                  onChange={(e) => setTiktokShopCipher(e.target.value)}
                  placeholder="Ex: GCP_shop_xyz..."
                  className="w-full bg-white border border-deep-black/30 px-3 py-2 text-xs font-mono font-bold text-deep-black focus:outline-none focus:border-gold"
                />
                <span className="text-[9px] text-stone-500">Fornecido pelo TikTok se usar app global</span>
              </div>
            </div>

            {/* Checkbox de Envio Automático */}
            <div className="p-3.5 bg-warm-light/30 border border-deep-black/20 flex items-center gap-3">
              <input
                type="checkbox"
                id="tiktok-auto-sync"
                checked={tiktokShopAutoSync}
                onChange={(e) => setTiktokShopAutoSync(e.target.checked)}
                className="w-4 h-4 accent-gold cursor-pointer"
              />
              <label htmlFor="tiktok-auto-sync" className="text-xs font-bold text-deep-black cursor-pointer select-none">
                Sincronizar automaticamente para o TikTok Shop sempre que eu cadastrar ou salvar um produto no site
              </label>
            </div>

            {/* Ações: Salvar, Testar Conexão e Sincronizar Tudo */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border border-gold shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveTikTokSuccess ? 'CREDENCIAS SALVAS!' : 'SALVAR CREDENCIAIS TIKTOK SHOP'}</span>
              </button>

              <button
                type="button"
                disabled={testingTikTok}
                onClick={handleTestTikTokConnection}
                className="px-4 py-2.5 bg-white hover:bg-stone-100 text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border border-deep-black shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5 text-gold" />
                <span>{testingTikTok ? 'TESTANDO...' : 'TESTAR CONEXÃO'}</span>
              </button>

              <button
                type="button"
                disabled={syncingAllTikTok}
                onClick={handleSyncAllTikTok}
                className="px-4 py-2.5 bg-gold hover:bg-deep-black hover:text-gold text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border border-deep-black shadow-xs cursor-pointer disabled:opacity-50"
                title="Sincroniza todos os produtos cadastrados com o TikTok Shop"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{syncingAllTikTok ? 'TRANSMITINDO AO TIKTOK...' : '⚡ TRANSMITIR TODOS OS LOOKS AO TIKTOK (ATÉ 200)'}</span>
              </button>
            </div>
          </form>

          {/* Guia Rápido de Onde Pegar as Chaves */}
          <div className="p-4 bg-stone-50 border border-deep-black/15 text-xs text-deep-black/80 space-y-2">
            <h5 className="font-black uppercase tracking-wider text-deep-black flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-gold" />
              <span>Onde encontrar sua App Key e Access Token no TikTok:</span>
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
              <li>Acesse o portal de desenvolvedores do TikTok Shop em <a href="https://partner.tiktokshop.com" target="_blank" rel="noopener noreferrer" className="font-bold underline text-deep-black">partner.tiktokshop.com</a> com o mesmo login do Seller Center.</li>
              <li>Vá em <strong>App Management &gt; Create Custom App</strong> (Aplicativo Próprio da Loja) e selecione o mercado <strong>United States</strong>.</li>
              <li>Copie a <strong>App Key</strong> e a <strong>App Secret</strong> geradas e cole nos campos acima.</li>
              <li>Na aba de autorização, clique em <strong>Authorize My Shop</strong> para gerar o <strong>Access Token</strong> e cole aqui!</li>
            </ol>
          </div>
        </div>

        {/* Guia Prático Passo a Passo: Como Configurar no TikTok Shop */}
        <div className="p-5 border-2 border-gold/40 bg-gold/5 space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-gold" />
            <h4 className="text-xs font-black uppercase tracking-wider text-deep-black">
              GUIA RÁPIDO: COMO ATIVAR A VITRINE NO TIKTOK FOR BUSINESS / TIKTOK SHOP
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 border border-deep-black/10 space-y-2">
              <span className="w-6 h-6 rounded-full bg-deep-black text-gold text-xs font-black flex items-center justify-center">
                1
              </span>
              <h5 className="text-[11px] font-black uppercase text-deep-black">
                Acesse o Catálogo TikTok
              </h5>
              <p className="text-[10px] text-deep-black/70 leading-relaxed uppercase">
                Entre em <a href="https://business.tiktok.com" target="_blank" rel="noopener noreferrer" className="font-bold underline text-deep-black">business.tiktok.com</a> ou no painel do <strong className="text-deep-black">TikTok Shop Seller Center</strong>. Vá no menu <strong className="text-deep-black">Ativos (Assets) &gt; Catálogos (Catalogs)</strong>.
              </p>
            </div>

            <div className="bg-white p-4 border border-deep-black/10 space-y-2">
              <span className="w-6 h-6 rounded-full bg-deep-black text-gold text-xs font-black flex items-center justify-center">
                2
              </span>
              <h5 className="text-[11px] font-black uppercase text-deep-black">
                Adicionar via Feed de Dados
              </h5>
              <p className="text-[10px] text-deep-black/70 leading-relaxed uppercase">
                Clique em <strong className="text-deep-black">Adicionar Produtos</strong> e selecione a opção <strong className="text-deep-black">Programação de Feed de Dados (Data Feed Schedule)</strong>.
              </p>
            </div>

            <div className="bg-white p-4 border border-deep-black/10 space-y-2">
              <span className="w-6 h-6 rounded-full bg-deep-black text-gold text-xs font-black flex items-center justify-center">
                3
              </span>
              <h5 className="text-[11px] font-black uppercase text-deep-black">
                Cole a URL e Programe
              </h5>
              <p className="text-[10px] text-deep-black/70 leading-relaxed uppercase">
                Cole a URL do Feed acima (<span className="font-mono font-bold text-deep-black">{baseUrl}/api/catalog/tiktok</span>) e escolha atualização <strong className="text-deep-black">Diária (Daily)</strong> ou horária. Pronto! Seus produtos sincronizam sozinhos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
