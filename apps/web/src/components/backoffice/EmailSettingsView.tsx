'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  Key,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Server,
  Settings,
  HelpCircle,
  Copy,
  Check,
  X,
  FileText,
  BadgeDollarSign,
  Package,
  Save,
} from 'lucide-react';

interface EmailOutboxItem {
  id: string;
  order_id: string;
  to: string;
  subject: string;
  type: string;
  status: 'SENT' | 'SIMULATED_SENT' | 'FAILED';
  error?: string;
  provider_id?: string;
  created_at: string;
  html_preview?: string;
}

interface MaskedConfig {
  provider: 'gmail' | 'resend' | 'custom_smtp' | 'simulated';
  fromName: string;
  fromEmail: string;
  ownerNotificationEmail: string;
  sendToCustomerOnPurchase: boolean;
  sendToOwnerOnPurchase: boolean;
  sendOnShippingWithTracking: boolean;
  gmailUser?: string;
  gmailAppPasswordMasked?: string;
  hasGmailPassword?: boolean;
  resendApiKeyMasked?: string;
  hasResendApiKey?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassMasked?: string;
  hasSmtpPass?: boolean;
}

export function EmailSettingsView() {
  const [config, setConfig] = useState<MaskedConfig | null>(null);
  const [outbox, setOutbox] = useState<EmailOutboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form edit states
  const [provider, setProvider] = useState<'gmail' | 'resend' | 'custom_smtp' | 'simulated'>('gmail');
  const [fromName, setFromName] = useState('ANA Fitness Wear');
  const [fromEmail, setFromEmail] = useState('anafitweareua@gmail.com');
  const [ownerNotificationEmail, setOwnerNotificationEmail] = useState('anafitweareua@gmail.com');
  const [sendToCustomerOnPurchase, setSendToCustomerOnPurchase] = useState(true);
  const [sendToOwnerOnPurchase, setSendToOwnerOnPurchase] = useState(true);
  const [sendOnShippingWithTracking, setSendOnShippingWithTracking] = useState(true);

  // Gmail
  const [gmailUser, setGmailUser] = useState('anafitweareua@gmail.com');
  const [gmailAppPassword, setGmailAppPassword] = useState('');

  // Resend
  const [resendApiKey, setResendApiKey] = useState('');

  // SMTP
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  // Preview Modal
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchEmailData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/backoffice/emails', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setProvider(data.config.provider || 'gmail');
        setFromName(data.config.fromName || 'ANA Fitness Wear');
        setFromEmail(data.config.fromEmail || 'anafitweareua@gmail.com');
        setOwnerNotificationEmail(data.config.ownerNotificationEmail || 'anafitweareua@gmail.com');
        setSendToCustomerOnPurchase(data.config.sendToCustomerOnPurchase !== false);
        setSendToOwnerOnPurchase(data.config.sendToOwnerOnPurchase !== false);
        setSendOnShippingWithTracking(data.config.sendOnShippingWithTracking !== false);
        setGmailUser(data.config.gmailUser || 'anafitweareua@gmail.com');
        setTestEmail(data.config.ownerNotificationEmail?.split(',')[0] || data.config.gmailUser || 'anafitweareua@gmail.com');
        setSmtpHost(data.config.smtpHost || 'smtp.gmail.com');
        setSmtpPort(data.config.smtpPort || 465);
        setSmtpSecure(data.config.smtpSecure !== false);
        setSmtpUser(data.config.smtpUser || '');
      }
      if (Array.isArray(data.emails)) {
        setOutbox(data.emails);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de e-mail:', err);
      showToast('Erro ao carregar configurações de e-mail.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmailData();
  }, [fetchEmailData]);

  // Salvar Configuração
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: any = {
        provider,
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim(),
        ownerNotificationEmail: ownerNotificationEmail.trim(),
        sendToCustomerOnPurchase,
        sendToOwnerOnPurchase,
        sendOnShippingWithTracking,
        gmailUser: gmailUser.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort) || 465,
        smtpSecure,
        smtpUser: smtpUser.trim(),
      };

      if (gmailAppPassword.trim()) {
        payload.gmailAppPassword = gmailAppPassword.trim();
      }
      if (resendApiKey.trim()) {
        payload.resendApiKey = resendApiKey.trim();
      }
      if (smtpPass.trim()) {
        payload.smtpPass = smtpPass.trim();
      }

      const res = await fetch('/api/backoffice/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', config: payload }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar configurações.');
      }

      setConfig(data.config);
      setGmailAppPassword(''); // limpa do input para segurança
      setResendApiKey('');
      setSmtpPass('');
      showToast('Configurações de e-mail salvas com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar config:', err);
      showToast(err.message || 'Erro ao salvar configuração.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Testar Conexão
  const handleTestConnection = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Por favor, informe um e-mail válido para receber o teste.');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const res = await fetch('/api/backoffice/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          target_email: testEmail.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `E-mail de teste disparado com sucesso para ${testEmail}! Verifique sua caixa de entrada e spam.`,
        });
        showToast('E-mail de teste entregue com sucesso!');
        fetchEmailData();
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Falha ao autenticar com o provedor de e-mail.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Erro de comunicação ao enviar teste.',
      });
    } finally {
      setTesting(false);
    }
  };

  // Reenviar E-mail
  const handleResend = async (orderId: string, email: string) => {
    try {
      setResendingId(orderId);
      const res = await fetch('/api/backoffice/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          type: 'ORDER_CONFIRMATION',
          email,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Confirmação do pedido #${orderId} reenviada para ${email}!`);
        fetchEmailData();
      } else {
        showToast(data.error || 'Erro ao reenviar e-mail.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao reenviar.', 'error');
    } finally {
      setResendingId(null);
    }
  };

  // Abrir Prévia de Confirmação de Pedido
  const handleOpenPreviewSample = async () => {
    try {
      const res = await fetch('/api/backoffice/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview_order_email' }),
      });
      const data = await res.json();
      if (data.html) {
        setPreviewHtml(data.html);
        setPreviewTitle('Prévia: Confirmação de Pedido Recebida pela Cliente');
      }
    } catch (_) {}
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold transition-all transform duration-300 ${
            toastMsg.type === 'success'
              ? 'bg-deep-black text-gold border-gold/40 shadow-gold/20'
              : 'bg-red-950 text-red-200 border-red-700'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-gold" /> : <XCircle className="w-5 h-5 text-red-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="bg-white dark:bg-deep-black/60 rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Como o Cliente Recebe o E-mail de Compra
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                Oficial
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cadastre aqui o e-mail que dispara as mensagens quando uma compra é feita, teste na hora e acompanhe a caixa de saída.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleOpenPreviewSample}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gold hover:text-deep-black text-gray-800 dark:text-gray-200 text-xs font-bold border border-gray-300 dark:border-white/10 transition cursor-pointer"
            title="Ver layout do e-mail que o cliente recebe com logotipo, fotos dos looks e endereço"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Modelo do E-mail</span>
          </button>

          <button
            type="button"
            onClick={fetchEmailData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-bold border border-gray-300 dark:border-white/10 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-gold' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Banner de Status Atual do Envio */}
      <div
        className={`rounded-2xl p-5 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          provider === 'gmail' && config?.hasGmailPassword
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
            : provider === 'resend' && config?.hasResendApiKey
            ? 'bg-purple-500/10 border-purple-500/40 text-purple-950 dark:text-purple-100'
            : provider === 'custom_smtp' && config?.hasSmtpPass
            ? 'bg-blue-500/10 border-blue-500/40 text-blue-950 dark:text-blue-100'
            : 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100'
        }`}
      >
        <div className="flex items-start gap-3">
          {provider === 'gmail' && config?.hasGmailPassword ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          ) : provider === 'resend' && config?.hasResendApiKey ? (
            <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          )}
          <div>
            <div className="text-sm font-black uppercase tracking-wide">
              {provider === 'gmail' && config?.hasGmailPassword
                ? '🟢 Conexão Ativa via Gmail (Google Workspace SMTP)'
                : provider === 'resend' && config?.hasResendApiKey
                ? '🟢 Conexão Ativa via Resend API'
                : provider === 'custom_smtp' && config?.hasSmtpPass
                ? '🟢 Conexão Ativa via Servidor SMTP Próprio'
                : '🟡 Modo Simulação / Credenciais Pendentes'}
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {provider === 'gmail' && config?.hasGmailPassword
                ? `Disparos automáticos saindo por "${fromName}" <${gmailUser}> para todos os clientes.`
                : provider === 'resend' && config?.hasResendApiKey
                ? `Disparos automáticos saindo pela API do Resend.`
                : 'Os e-mails de compra estão sendo registrados na Caixa de Saída abaixo para conferência, mas para enviar direto para a caixa de entrada dos clientes informe a Senha de Aplicativo do Gmail ou Chave de API.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-black/10 dark:bg-white/10">
            {outbox.filter((e) => e.status === 'SENT').length} Enviados Realmente
          </span>
        </div>
      </div>

      {/* Formulário Principal de Cadastro */}
      <form onSubmit={handleSaveConfig} className="bg-white dark:bg-deep-black/60 rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
        {/* Escolha do Provedor de Envio */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">
            1. Selecione o Provedor de Envio de E-mails:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Opção Gmail */}
            <div
              onClick={() => setProvider('gmail')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition relative ${
                provider === 'gmail'
                  ? 'border-gold bg-gold/10 ring-2 ring-gold/20'
                  : 'border-gray-200 dark:border-white/10 hover:border-gold/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-xs uppercase flex items-center gap-1.5 text-gray-900 dark:text-white">
                  <Mail className="w-4 h-4 text-red-500" />
                  Gmail / Google
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  RECOMENDADO
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                Envia direto pelo seu e-mail do Gmail sem custo e sem precisar configurar DNS.
              </p>
            </div>

            {/* Opção Resend */}
            <div
              onClick={() => setProvider('resend')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition relative ${
                provider === 'resend'
                  ? 'border-gold bg-gold/10 ring-2 ring-gold/20'
                  : 'border-gray-200 dark:border-white/10 hover:border-gold/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-xs uppercase flex items-center gap-1.5 text-gray-900 dark:text-white">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Resend API
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  API OFICIAL
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                Disparo via API moderna com chave `re_...` e domínio verificado.
              </p>
            </div>

            {/* Opção SMTP Personalizado */}
            <div
              onClick={() => setProvider('custom_smtp')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition relative ${
                provider === 'custom_smtp'
                  ? 'border-gold bg-gold/10 ring-2 ring-gold/20'
                  : 'border-gray-200 dark:border-white/10 hover:border-gold/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-xs uppercase flex items-center gap-1.5 text-gray-900 dark:text-white">
                  <Server className="w-4 h-4 text-blue-500" />
                  SMTP Próprio
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  AVANÇADO
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                Zoho, Hostinger, Outlook, Amazon SES ou qualquer servidor SMTP.
              </p>
            </div>

            {/* Opção Simulação */}
            <div
              onClick={() => setProvider('simulated')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition relative ${
                provider === 'simulated'
                  ? 'border-gold bg-gold/10 ring-2 ring-gold/20'
                  : 'border-gray-200 dark:border-white/10 hover:border-gold/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-xs uppercase flex items-center gap-1.5 text-gray-900 dark:text-white">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Modo Simulado
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                  TESTES
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                Registra o pedido na Caixa de Saída para você conferir sem enviar pela web.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================
            CAMPOS ESPECÍFICOS DO GMAIL (RECOMENDADO)
           =================================================================== */}
        {provider === 'gmail' && (
          <div className="bg-gray-50 dark:bg-white/[0.02] border-2 border-gold/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gold">
              <Key className="w-4 h-4" />
              <span>Configuração da Conta Gmail para Disparos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Seu E-mail do Gmail / Google:
                </label>
                <input
                  type="email"
                  required
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-gold"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Os e-mails de compra serão enviados a partir desta conta.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Senha de Aplicativo do Google (16 Letras):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={gmailAppPassword}
                    onChange={(e) => setGmailAppPassword(e.target.value)}
                    placeholder={config?.hasGmailPassword ? config.gmailAppPasswordMasked : 'xxxx xxxx xxxx xxxx'}
                    className="w-full px-3.5 pr-10 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-white/15 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-bold">
                  {config?.hasGmailPassword && !gmailAppPassword
                    ? '✓ Senha de aplicativo já cadastrada no sistema (deixe em branco para manter a mesma).'
                    : 'Cole a senha de 16 caracteres gerada na sua conta Google.'}
                </span>
              </div>
            </div>

            {/* Como Gerar a Senha no Google */}
            <div className="bg-white dark:bg-black/50 border border-gold/30 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-300 space-y-2">
              <div className="font-black text-gray-900 dark:text-white uppercase flex items-center gap-1.5 text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-gold" />
                Como gerar a sua Senha de Aplicativo no Google em 1 minuto:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                <li>
                  Acesse sua conta Google em{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold font-bold underline inline-flex items-center gap-1"
                  >
                    myaccount.google.com/apppasswords <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>Certifique-se de que a <strong>Verificação em 2 etapas</strong> está ativada.</li>
                <li>No campo &quot;Nome do App&quot;, digite <strong>Ana Fitness Store</strong> e clique em <strong>Criar</strong>.</li>
                <li>O Google exibirá um código amarelo de 16 letras (ex: <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded font-mono">abcd efgh ijkl mnop</code>).</li>
                <li>Copie e cole esse código no campo acima!</li>
              </ol>
            </div>
          </div>
        )}

        {/* ===================================================================
            CAMPOS ESPECÍFICOS DO RESEND
           =================================================================== */}
        {provider === 'resend' && (
          <div className="bg-gray-50 dark:bg-white/[0.02] border-2 border-purple-500/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-purple-400">
              <Sparkles className="w-4 h-4" />
              <span>Configuração da Chave Resend API</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Chave de API do Resend (API Key):
                </label>
                <input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder={config?.hasResendApiKey ? config.resendApiKeyMasked : 're_123456789...'}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-white/15 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Gerada em <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-purple-400 underline">resend.com/api-keys</a>.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  E-mail Remetente Configurado no Resend:
                </label>
                <input
                  type="text"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="orders@anafitwear.com ou onboarding@resend.dev"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Se o domínio próprio ainda não estiver verificado, use <code className="font-mono">onboarding@resend.dev</code>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            CAMPOS ESPECÍFICOS DE SMTP PERSONALIZADO
           =================================================================== */}
        {provider === 'custom_smtp' && (
          <div className="bg-gray-50 dark:bg-white/[0.02] border-2 border-blue-500/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-400">
              <Server className="w-4 h-4" />
              <span>Configuração do Servidor SMTP</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Host SMTP:
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.zoho.com ou smtp.titan.email"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Porta SMTP:
                </label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  placeholder="465 ou 587"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Criptografia SSL/TLS:
                </label>
                <select
                  value={smtpSecure ? 'true' : 'false'}
                  onChange={(e) => setSmtpSecure(e.target.value === 'true')}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="true">SSL (Porta 465)</option>
                  <option value="false">TLS / STARTTLS (Porta 587)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Usuário SMTP:
                </label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="seu-email@dominio.com"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Senha SMTP:
                </label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={config?.hasSmtpPass ? config.smtpPassMasked : '••••••••••••'}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-black border border-gray-300 dark:border-white/15 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            CONFIGURAÇÕES GERAIS DE IDENTIFICAÇÃO E NOTIFICAÇÃO
           =================================================================== */}
        <div className="border-t border-gray-200 dark:border-white/10 pt-5 space-y-4">
          <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
            2. Identificação da Loja e Destinatários:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Nome do Remetente (Exibido no Cabeçalho do E-mail):
              </label>
              <input
                type="text"
                required
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="ANA Fitness Wear"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-gold"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Nome oficial que a cliente visualiza no inbox (ex: &quot;ANA Fitness Wear&quot;).
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                E-mail para Alerta de Venda da Dona (Cópia Oculta):
              </label>
              <input
                type="text"
                required
                value={ownerNotificationEmail}
                onChange={(e) => setOwnerNotificationEmail(e.target.value)}
                placeholder="anafitweareua@gmail.com, anacarinalemos.ac@gmail.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-gold"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                E-mails que recebem a notificação de cada nova venda com a foto das peças a separar.
              </span>
            </div>
          </div>

          {/* Toggles de Disparo */}
          <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
              Gatilhos de Disparo Automático:
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={sendToCustomerOnPurchase}
                onChange={(e) => setSendToCustomerOnPurchase(e.target.checked)}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span>Disparar confirmação de pedido para a cliente assim que a compra for aprovada</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={sendToOwnerOnPurchase}
                onChange={(e) => setSendToOwnerOnPurchase(e.target.checked)}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span>Disparar alerta com foto das peças para a dona da loja ao vender (para separar look)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={sendOnShippingWithTracking}
                onChange={(e) => setSendOnShippingWithTracking(e.target.checked)}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span>Disparar e-mail com código de rastreamento USPS quando o pedido for despachado</span>
            </label>
          </div>
        </div>

        {/* Botão Salvar Configuração */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-deep-black text-xs font-black uppercase tracking-widest shadow-lg shadow-gold/20 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin text-deep-black" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Salvando...' : 'Salvar Configurações de E-mail'}</span>
          </button>
        </div>
      </form>

      {/* =====================================================================
          CARD DE TESTE EM TEMPO REAL
         ===================================================================== */}
      <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-2xl p-6 border-2 border-gold/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-white">
              Testar Envio Real de E-mail Agora
            </h3>
            <p className="text-xs text-gray-400">
              Dispare um e-mail de teste para o seu endereço para garantir que a autenticação está 100% pronta.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Digite o e-mail para receber o teste"
            className="w-full sm:flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-gold"
          />

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-deep-black text-xs font-black uppercase tracking-wider transition shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-gold/20"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin text-deep-black" /> : <Send className="w-4 h-4" />}
            <span>{testing ? 'Testando Disparo...' : '⚡ Enviar E-mail de Teste'}</span>
          </button>
        </div>

        {/* Feedback do Teste */}
        {testResult && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold border flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                : 'bg-red-500/20 border-red-500 text-red-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            )}
            <div>
              <div className="font-bold uppercase tracking-wide">
                {testResult.success ? '✓ Sucesso na Entrega do E-mail' : '⚠ Erro na Conexão com o Provedor'}
              </div>
              <p className="mt-0.5 opacity-90">{testResult.message || testResult.error}</p>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          HISTÓRICO DA CAIXA DE SAÍDA (OUTBOX)
         ===================================================================== */}
      <div className="bg-white dark:bg-deep-black/60 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              Caixa de Saída & Registro de Envios
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                {outbox.length} Disparos
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Histórico de confirmações de pedidos e notificações enviadas aos clientes.
            </p>
          </div>
        </div>

        {outbox.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-30 text-gold" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Nenhum e-mail disparado ainda.</p>
            <p className="text-xs mt-1">Os e-mails de compra aparecerão aqui em tempo real assim que as vendas acontecerem.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Pedido</th>
                  <th className="py-3 px-4">Destinatário</th>
                  <th className="py-3 px-4">Assunto / Tipo</th>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {outbox.slice(0, 30).map((item) => (
                  <tr key={item.id} className="hover:bg-gold/5 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                      #{item.order_id}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">
                      {item.to}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 dark:text-white truncate max-w-xs">
                        {item.subject}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase">
                        {item.type}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Enviado
                        </span>
                      ) : item.status === 'FAILED' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/15 text-red-500 border border-red-500/30 cursor-pointer"
                          title={item.error}
                        >
                          <XCircle className="w-3 h-3" /> Falha
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-500 border border-blue-500/30">
                          Simulado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {item.html_preview && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewHtml(item.html_preview || '');
                              setPreviewTitle(`Prévia do E-mail: #${item.order_id} (${item.to})`);
                            }}
                            className="px-2 py-1 rounded bg-gray-100 hover:bg-gold hover:text-deep-black text-gray-700 text-[10px] font-bold transition cursor-pointer"
                            title="Ver conteúdo visual deste e-mail"
                          >
                            Ver HTML
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleResend(item.order_id, item.to)}
                          disabled={resendingId === item.order_id}
                          className="px-2.5 py-1 rounded bg-gold/15 hover:bg-gold text-gold hover:text-deep-black text-[10px] font-black uppercase transition cursor-pointer border border-gold/30 disabled:opacity-50"
                          title="Reenviar este e-mail imediatamente para a cliente"
                        >
                          {resendingId === item.order_id ? 'Enviando...' : 'Reenviar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL DE PRÉ-VISUALIZAÇÃO DO E-MAIL
         ===================================================================== */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border-2 border-gold rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-deep-black text-white flex items-center justify-between border-b border-gold/40">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gold">
                <Mail className="w-4 h-4" />
                <span>{previewTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewHtml(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
              <iframe
                title="Preview"
                srcDoc={previewHtml}
                className="w-full h-[650px] bg-white border border-gray-300 rounded shadow-sm"
              />
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Este é exatamente o visual luxuoso com as fotos das peças que sua cliente recebe no e-mail.
              </span>
              <button
                type="button"
                onClick={() => setPreviewHtml(null)}
                className="px-4 py-2 rounded-xl bg-deep-black text-gold text-xs font-black uppercase tracking-wider hover:bg-gold hover:text-deep-black transition cursor-pointer"
              >
                Fechar Prévia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
