'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Instagram,
  Send,
  Bot,
  Sparkles,
  Settings,
  Search,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare,
  Zap,
  Clock,
  ShieldCheck,
  X,
  Play,
  Copy,
  Sliders,
  Check,
  AlertCircle,
  HelpCircle,
  User,
} from 'lucide-react';
import {
  InstagramDirectRule,
  InstagramDirectMessage,
  InstagramDirectConversation,
  InstagramMetaConfig,
} from '@/lib/instagramDirectStore';

export function InstagramDirectView() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<InstagramDirectConversation[]>([]);
  const [rules, setRules] = useState<InstagramDirectRule[]>([]);
  const [config, setConfig] = useState<InstagramMetaConfig>({
    enabled: false,
    pageAccessToken: '',
    instagramAccountId: '',
    verifyToken: 'ana_fitness_meta_token_2026',
    autoResponderActive: true,
  });

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'bot'>('all');

  // Modais
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);

  // Estados dos formulários dos modais
  const [tempConfig, setTempConfig] = useState<InstagramMetaConfig>(config);
  const [simulateUser, setSimulateUser] = useState('@cliente_fitness');
  const [simulateMessage, setSimulateMessage] = useState('Olá! Qual o endereço do showroom para eu provar?');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  // Nova Regra
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleKeywords, setNewRuleKeywords] = useState('');
  const [newRuleReply, setNewRuleReply] = useState('');

  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carrega estado inicial
  const fetchState = async () => {
    try {
      const res = await fetch('/api/instagram/direct');
      const data = await res.json();
      if (data.success && data.data) {
        setConversations(data.data.conversations || []);
        setRules(data.data.rules || []);
        setConfig(data.data.config || config);
        setTempConfig(data.data.config || config);

        if (!selectedConvId && data.data.conversations?.length > 0) {
          setSelectedConvId(data.data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Instagram Direct:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Rola mensagens para o fim quando seleciona ou atualiza
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedConvId]);

  const activeConv = conversations.find((c) => c.id === selectedConvId);

  // Enviar mensagem como a Loja
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConvId || sendingMessage) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSendingMessage(true);

    try {
      const res = await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: selectedConvId,
          text: textToSend,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Atualiza localmente
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === selectedConvId) {
              return {
                ...c,
                lastMessage: textToSend,
                lastTimestamp: new Date().toISOString(),
                messages: [...c.messages, data.message],
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Enviar Resposta Rápida com 1 clique
  const handleSendQuickReply = (text: string) => {
    setInputText(text);
  };

  // Alternar Master Switch do Bot
  const handleToggleBot = async () => {
    const newStatus = !config.autoResponderActive;
    const updatedConfig = { ...config, autoResponderActive: newStatus };
    setConfig(updatedConfig);
    setTempConfig(updatedConfig);

    try {
      await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          config: updatedConfig,
        }),
      });
      setNotificationBanner(
        newStatus ? '🤖 Robô de respostas automáticas ATIVADO!' : '⏸️ Robô de respostas automáticas PAUSADO!'
      );
      setTimeout(() => setNotificationBanner(null), 3000);
    } catch (err) {
      console.error('Erro ao alterar status do robô:', err);
    }
  };

  // Simular mensagem de cliente
  const handleSimulateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulateMessage.trim()) return;

    try {
      const res = await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_customer',
          username: simulateUser,
          text: simulateMessage,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowSimulateModal(false);
        setSimulateMessage('');
        await fetchState();
        setSelectedConvId(data.conversation?.id || null);

        setNotificationBanner(
          data.botReplied
            ? `✅ Mensagem recebida e respondida pelo Robô (Regra: ${data.matchedRuleName})!`
            : '✅ Mensagem simulada recebida no Direct!'
        );
        setTimeout(() => setNotificationBanner(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao simular cliente:', err);
    }
  };

  // Alternar regra de automação
  const handleToggleRule = async (ruleId: string) => {
    const updatedRules = rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    setRules(updatedRules);

    try {
      await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_rules',
          rules: updatedRules,
        }),
      });
    } catch (err) {
      console.error('Erro ao atualizar regra:', err);
    }
  };

  // Salvar Nova Regra
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleReply.trim()) return;

    const keywordsArray = newRuleKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const newRule: InstagramDirectRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      triggerType: 'keywords',
      keywords: keywordsArray.length > 0 ? keywordsArray : [newRuleName.toLowerCase().trim()],
      replyText: newRuleReply.trim(),
      enabled: true,
    };

    const updatedRules = [...rules, newRule];
    setRules(updatedRules);

    try {
      await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_rules',
          rules: updatedRules,
        }),
      });
      setShowNewRuleModal(false);
      setNewRuleName('');
      setNewRuleKeywords('');
      setNewRuleReply('');
      setNotificationBanner('✨ Nova regra de automação criada com sucesso!');
      setTimeout(() => setNotificationBanner(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar nova regra:', err);
    }
  };

  // Excluir Regra
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Deseja excluir esta regra de automação?')) return;
    const updatedRules = rules.filter((r) => r.id !== ruleId);
    setRules(updatedRules);

    try {
      await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_rules',
          rules: updatedRules,
        }),
      });
    } catch (err) {
      console.error('Erro ao excluir regra:', err);
    }
  };

  // Limpar todo o histórico de conversas
  const handleClearConversations = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o histórico de conversas do Direct?')) return;
    try {
      await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_conversations' }),
      });
      setConversations([]);
      setSelectedConvId(null);
      setNotificationBanner('🧹 Histórico de conversas limpo com sucesso!');
      setTimeout(() => setNotificationBanner(null), 3000);
    } catch (err) {
      console.error('Erro ao limpar conversas:', err);
    }
  };

  // Excluir conversa individual
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir esta conversa?')) return;
    try {
      await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_conversation', conversationId: convId }),
      });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (selectedConvId === convId) setSelectedConvId(null);
      setNotificationBanner('Conversa removida com sucesso!');
      setTimeout(() => setNotificationBanner(null), 2500);
    } catch (err) {
      console.error('Erro ao excluir conversa:', err);
    }
  };

  // Salvar Configurações da Meta API
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(tempConfig);

    try {
      await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          config: tempConfig,
        }),
      });
      setShowConfigModal(false);
      setNotificationBanner('✅ Configurações da Meta Graph API salvas!');
      setTimeout(() => setNotificationBanner(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar configurações da Meta:', err);
    }
  };

  // Filtra conversas
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'unread') return c.unreadCount > 0;
    if (filterType === 'bot') return c.status === 'bot_handled';
    return true;
  });

  const webhookFullUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/instagram/webhook` : 'https://anafitnesswear.com/api/instagram/webhook';

  if (loading) {
    return (
      <div className="p-16 text-center text-xs font-black uppercase tracking-wider text-gray-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" />
        Carregando painel do Instagram Direct & Automações...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de Notificação */}
      {notificationBanner && (
        <div className="p-3 bg-emerald-950 text-emerald-100 border border-emerald-500 text-xs font-black uppercase tracking-wider flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notificationBanner}</span>
          </div>
          <button onClick={() => setNotificationBanner(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header com Controles e Status */}
      <div className="bg-gradient-to-r from-deep-black via-zinc-950 to-deep-black border border-gold/30 p-5 rounded-none shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-md">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                Instagram Direct & Atendimento Inteligente
              </h2>
              <p className="text-[11px] text-gray-400 font-medium">
                Atenda clientes de @anafitnessweareua direto pelo site e deixe o robô responder dúvidas frequentes 24/7.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Master Switch do Bot */}
          <button
            onClick={handleToggleBot}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition ${
              config.autoResponderActive
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
                : 'bg-zinc-900 border-zinc-700 text-gray-400 hover:border-zinc-500'
            }`}
            title="Ligar ou pausar respostas automáticas do Robô"
          >
            <Bot className={`w-4 h-4 ${config.autoResponderActive ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
            <span>ROBÔ: {config.autoResponderActive ? 'ATIVADO' : 'PAUSADO'}</span>
          </button>

          {/* Botão Regras de Automação */}
          <button
            onClick={() => setShowRulesModal(true)}
            className="px-3.5 py-2 bg-zinc-900 border border-gold/40 text-gold text-xs font-black uppercase tracking-wider hover:bg-gold hover:text-black transition flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Regras ({rules.filter((r) => r.enabled).length} Ativas)</span>
          </button>

          {/* Botão Simular Teste */}
          <button
            onClick={() => setShowSimulateModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black uppercase tracking-wider hover:brightness-110 transition flex items-center gap-1.5 shadow-md shadow-pink-900/30"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simular Teste</span>
          </button>

          {/* Botão Configurações Meta API */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 text-gray-300 text-xs font-black uppercase tracking-wider hover:border-white transition flex items-center gap-1.5"
            title="Configurações oficiais da Meta Graph API"
          >
            <Settings className="w-3.5 h-3.5 text-gray-400" />
            <span>Meta API</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Lista de Conversas (Esquerda) + Chat Aberto (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-zinc-800 bg-zinc-950 min-h-[620px] shadow-2xl">
        {/* Coluna Esquerda: Lista de Conversas Direct (4 cols) */}
        <div className="lg:col-span-4 border-r border-zinc-800 flex flex-col h-full bg-zinc-950/60">
          {/* Header da Coluna com Busca e Filtros */}
          <div className="p-3.5 border-b border-zinc-800 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente ou mensagem..."
                className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:border-gold outline-none placeholder:text-gray-600"
              />
            </div>

            {/* Filtros Rápidos & Limpar */}
            <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 transition border ${
                    filterType === 'all'
                      ? 'bg-gold text-black border-gold'
                      : 'text-gray-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  Todas ({conversations.length})
                </button>
                <button
                  onClick={() => setFilterType('unread')}
                  className={`px-2.5 py-1 transition border ${
                    filterType === 'unread'
                      ? 'bg-gold text-black border-gold'
                      : 'text-gray-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  Não Lidas ({conversations.filter((c) => c.unreadCount > 0).length})
                </button>
                <button
                  onClick={() => setFilterType('bot')}
                  className={`px-2.5 py-1 transition border ${
                    filterType === 'bot'
                      ? 'bg-gold text-black border-gold'
                      : 'text-gray-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  Bot
                </button>
              </div>

              {conversations.length > 0 && (
                <button
                  onClick={handleClearConversations}
                  className="px-2 py-1 text-gray-500 hover:text-red-400 hover:border-red-500/40 border border-transparent transition flex items-center gap-1"
                  title="Limpar todo o histórico de conversas"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-[10px]">Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 max-h-[580px]">
            {filteredConversations.length === 0 ? (
              <div className="p-10 text-center text-gray-500 text-xs space-y-2">
                <Instagram className="w-8 h-8 mx-auto mb-2 text-pink-500/60" />
                <p className="font-bold text-gray-300">Caixa de entrada limpa</p>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Nenhuma mensagem no momento. Novas mensagens enviadas para o Instagram @anafitnessweareua aparecerão aqui automaticamente.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      // Marca como lida localmente
                      if (conv.unreadCount > 0) {
                        setConversations((prev) =>
                          prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                        );
                        fetch('/api/instagram/direct', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'mark_as_read', conversationId: conv.id }),
                        });
                      }
                    }}
                    className={`w-full p-3.5 text-left transition flex items-start gap-3 relative cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 border-l-4 border-gold'
                        : 'hover:bg-zinc-900/40 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Avatar com Gradiente do Instagram */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600">
                        <img
                          src={conv.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                          alt={conv.username}
                          className="w-full h-full object-cover rounded-full bg-black"
                        />
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-black text-white truncate">
                          @{conv.username}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            className="p-1 text-gray-600 hover:text-red-400 hover:bg-zinc-800 rounded transition"
                            title="Excluir esta conversa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-400 truncate leading-relaxed">
                        {conv.lastMessage}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        {conv.status === 'bot_handled' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-950/80 border border-purple-500/40 text-[9px] font-bold text-purple-300">
                            <Bot className="w-2.5 h-2.5" />
                            Bot respondeu
                          </span>
                        )}
                        {conv.messages[conv.messages.length - 1]?.sender === 'store' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gold/10 border border-gold/30 text-[9px] font-bold text-gold">
                            <User className="w-2.5 h-2.5" />
                            <span>Você respondeu</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Janela de Chat Aberta (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-zinc-950">
          {activeConv ? (
            <>
              {/* Top Bar da Conversa */}
              <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-black/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 shrink-0">
                    <img
                      src={activeConv.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                      alt={activeConv.username}
                      className="w-full h-full object-cover rounded-full bg-black"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">@{activeConv.username}</span>
                      <a
                        href={`https://instagram.com/${activeConv.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 font-bold underline"
                      >
                        <span>Abrir perfil</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                      Direct Instagram • Leominster, MA
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-gray-400">
                    Status: {activeConv.status === 'bot_handled' ? 'Atendido pelo Robô' : 'Ativo'}
                  </span>
                </div>
              </div>

              {/* Área de Mensagens com Rolagem */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[440px] bg-gradient-to-b from-black via-zinc-950 to-zinc-950">
                {activeConv.messages.map((msg) => {
                  const isCustomer = msg.sender === 'customer';
                  const isBot = msg.sender === 'bot';
                  const isStore = msg.sender === 'store';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                    >
                      {/* Identificação de quem falou */}
                      <span className="text-[10px] text-gray-500 mb-1 px-1 flex items-center gap-1 font-bold uppercase">
                        {isCustomer && (
                          <>
                            <Instagram className="w-2.5 h-2.5 text-pink-500" />
                            <span>@{activeConv.username}</span>
                          </>
                        )}
                        {isBot && (
                          <>
                            <Bot className="w-2.5 h-2.5 text-purple-400" />
                            <span className="text-purple-400">Robô Automático ANA Fitness</span>
                          </>
                        )}
                        {isStore && (
                          <>
                            <User className="w-2.5 h-2.5 text-gold" />
                            <span className="text-gold">Ana (Atendimento Oficial)</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>

                      {/* Balão da Mensagem */}
                      <div
                        className={`max-w-[82%] p-3.5 rounded-sm text-xs leading-relaxed shadow-md ${
                          isCustomer
                            ? 'bg-zinc-900 text-gray-200 border border-zinc-800'
                            : isBot
                            ? 'bg-gradient-to-r from-purple-950/80 to-zinc-900 text-purple-100 border border-purple-500/40'
                            : 'bg-zinc-900 text-amber-50 border border-gold/40'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Barra de Respostas Rápidas (1 clique para acelerar o atendimento da Ana) */}
              <div className="p-2 border-t border-zinc-900 bg-black/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-[10px] text-gray-500 font-black uppercase shrink-0 pl-1">
                  Respostas Rápidas:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleSendQuickReply(
                      'Você pode conferir nossa coleção completa no site: https://anafitnesswear.com/ ou solicitar nosso catálogo em PDF atualizado! Qual peça você mais gostou?'
                    )
                  }
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-gold hover:text-black border border-zinc-800 hover:border-gold text-gray-300 whitespace-nowrap transition font-semibold"
                >
                  📲 Catálogo & Site
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendQuickReply(
                      'Nosso Showroom fica localizado em Leominster, Massachusetts! 📍 Você é super bem-vinda para provar as peças pessoalmente. Para agendar seu horário de hoje, nos chame no WhatsApp +1 (978) 313-9452!'
                    )
                  }
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-gold hover:text-black border border-zinc-800 hover:border-gold text-gray-300 whitespace-nowrap transition font-semibold"
                >
                  📍 Endereço do Showroom
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendQuickReply(
                      'Enviamos para qualquer estado dos EUA via USPS Priority Mail com taxa fixa de $9.99 (ou FRETE GRÁTIS acima de $150)! O prazo é de 2 a 4 dias úteis 📦'
                    )
                  }
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-gold hover:text-black border border-zinc-800 hover:border-gold text-gray-300 whitespace-nowrap transition font-semibold"
                >
                  📦 Frete USPS $9.99
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendQuickReply(
                      'Aceitamos Zelle oficial no número +1 (978) 313-9452 ou e-mail anafitweareua@gmail.com, além de Venmo, Cartão de Crédito e Crediário no Showroom! 💳'
                    )
                  }
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-gold hover:text-black border border-zinc-800 hover:border-gold text-gray-300 whitespace-nowrap transition font-semibold"
                >
                  💳 Zelle / Formas de Pagamento
                </button>
              </div>

              {/* Caixa de Entrada e Envio */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-black flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Responder para @${activeConv.username} no Instagram...`}
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-gold outline-none placeholder:text-gray-600"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sendingMessage}
                  className="px-5 py-2.5 bg-gold text-black font-black text-xs uppercase tracking-wider hover:bg-white transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Enviar</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-500">
              <Instagram className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-sm font-black uppercase tracking-wider text-gray-400">
                Selecione uma conversa ao lado
              </p>
              <p className="text-xs text-gray-600 mt-1 max-w-sm">
                Veja o histórico completo, envie mensagens ou clique em "Simular Teste" acima para ver o robô funcionando em tempo real.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REGRAS DE AUTOMAÇÃO DO ROBÔ                                       */}
      {/* ========================================================================= */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-gold/40 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-scaleUp">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Regras de Resposta Automática (Robô Instagram)
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <p className="text-xs text-gray-400 font-medium">
                  Quando uma cliente enviar um direct contendo as palavras-chave abaixo, o robô responderá instantaneamente.
                </p>
                <button
                  onClick={() => setShowNewRuleModal(true)}
                  className="px-3 py-1.5 bg-gold text-black font-black text-xs uppercase tracking-wider hover:bg-white transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Regra</span>
                </button>
              </div>

              {/* Lista das Regras */}
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-4 border transition ${
                      rule.enabled
                        ? 'bg-zinc-900/60 border-zinc-700'
                        : 'bg-zinc-950/40 border-zinc-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-xs font-black uppercase text-white flex items-center gap-2">
                          {rule.name}
                          {rule.triggerType === 'first_message' && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-blue-950 border border-blue-500/40 text-blue-300 font-bold">
                              1º Contato
                            </span>
                          )}
                        </span>

                        {rule.triggerType === 'keywords' && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {rule.keywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-black border border-zinc-800 text-[10px] text-gold font-mono"
                              >
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle On/Off */}
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule.id)}
                          className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition ${
                            rule.enabled
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                              : 'bg-zinc-800 text-gray-400 border-zinc-700'
                          }`}
                        >
                          {rule.enabled ? 'ATIVADA' : 'DESATIVADA'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-gray-500 hover:text-red-400 transition"
                          title="Excluir regra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2.5 p-2.5 bg-black/60 border border-zinc-800/60 text-xs text-gray-300 font-sans leading-relaxed">
                      <span className="text-[10px] font-black uppercase text-gold/80 block mb-1">
                        Resposta Automática do Robô:
                      </span>
                      {rule.replyText}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-black flex justify-end">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 bg-zinc-800 text-white text-xs font-black uppercase tracking-wider hover:bg-zinc-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CRIAR NOVA REGRA                                                 */}
      {/* ========================================================================= */}
      {showNewRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-gold/40 w-full max-w-lg p-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-gold" />
                Cadastrar Nova Resposta Automática
              </h3>
              <button onClick={() => setShowNewRuleModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Nome da Regra
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Informações sobre Tecido Canelado"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Palavras-chave (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: tecido, transparencia, poliamida, canelado"
                  value={newRuleKeywords}
                  onChange={(e) => setNewRuleKeywords(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:border-gold outline-none"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Se a cliente digitar qualquer uma dessas palavras no direct, o robô responderá.
                </span>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Mensagem de Resposta do Robô
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Digite a resposta que o robô deve enviar para a cliente..."
                  value={newRuleReply}
                  onChange={(e) => setNewRuleReply(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:border-gold outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewRuleModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-gray-300 text-xs font-black uppercase tracking-wider hover:bg-zinc-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold text-black text-xs font-black uppercase tracking-wider hover:bg-white transition"
                >
                  Salvar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SIMULADOR DE TESTE INSTANTÂNEO                                    */}
      {/* ========================================================================= */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-gold/40 w-full max-w-lg p-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-pink-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Simular Direct de Cliente & Testar Robô
                </h3>
              </div>
              <button onClick={() => setShowSimulateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Envie uma pergunta como se fosse uma cliente no Instagram. O sistema vai receber o direct e o robô vai responder automaticamente com base nas regras ativas!
            </p>

            <form onSubmit={handleSimulateCustomer} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Usuário do Instagram da Cliente
                </label>
                <input
                  type="text"
                  required
                  value={simulateUser}
                  onChange={(e) => setSimulateUser(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Mensagem Enviada pela Cliente
                </label>
                <textarea
                  rows={3}
                  required
                  value={simulateMessage}
                  onChange={(e) => setSimulateMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:border-gold outline-none leading-relaxed"
                />
              </div>

              {/* Exemplos Prontos de Teste */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Testes rápidos:</span>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSimulateMessage('Olá! Qual o endereço do showroom para provar?')}
                    className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-gray-300 hover:border-gold transition"
                  >
                    📍 Testar Showroom
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateMessage('Vocês têm catálogo com as fotos e valores?')}
                    className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-gray-300 hover:border-gold transition"
                  >
                    📲 Testar Catálogo
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateMessage('Quanto fica o frete para a Flórida?')}
                    className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-gray-300 hover:border-gold transition"
                  >
                    📦 Testar Frete USPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateMessage('Vocês aceitam Zelle como pagamento?')}
                    className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-gray-300 hover:border-gold transition"
                  >
                    💳 Testar Zelle
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-gray-300 text-xs font-black uppercase tracking-wider hover:bg-zinc-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black uppercase tracking-wider hover:brightness-110 transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Simular Envio Agora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIGURAÇÃO META GRAPH API (OFICIAL)                            */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-gold/40 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-scaleUp">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Conexão Oficial com a Meta Graph API (Instagram)
                </h3>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 text-xs text-gray-300 space-y-2 leading-relaxed">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Como conectar sua conta oficial da Meta / Instagram:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-gray-400 text-[11px]">
                  <li>
                    Acesse o portal de desenvolvedores da Meta:{' '}
                    <a
                      href="https://developers.facebook.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold underline"
                    >
                      developers.facebook.com
                    </a>
                  </li>
                  <li>Crie ou selecione um App com o produto <strong>Instagram Graph API</strong>.</li>
                  <li>
                    Gere o <strong>Page Access Token</strong> para a página conectada à conta @anafitnessweareua.
                  </li>
                  <li>Configure o Webhook abaixo para receber as mensagens em tempo real.</li>
                </ol>
              </div>

              {/* Informações do Webhook para Copiar */}
              <div className="space-y-3 p-3.5 bg-black border border-zinc-800">
                <span className="text-[11px] font-black uppercase text-gold block">
                  Dados do Webhook (Cole no Painel da Meta):
                </span>

                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                    URL de Retorno de Chamada (Callback URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookFullUrl}
                      className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-white text-xs font-mono select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookFullUrl);
                        setCopiedWebhookUrl(true);
                        setTimeout(() => setCopiedWebhookUrl(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 text-xs font-bold text-gray-200 hover:text-white transition flex items-center gap-1"
                    >
                      {copiedWebhookUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWebhookUrl ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                    Token de Verificação (Verify Token)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={tempConfig.verifyToken || 'ana_fitness_meta_token_2026'}
                      className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-white text-xs font-mono select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tempConfig.verifyToken || 'ana_fitness_meta_token_2026');
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 text-xs font-bold text-gray-200 hover:text-white transition flex items-center gap-1"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Formulário de Credenciais */}
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Page Access Token (Meta Graph API)
                  </label>
                  <input
                    type="password"
                    placeholder="EAAB..."
                    value={tempConfig.pageAccessToken}
                    onChange={(e) => setTempConfig({ ...tempConfig, pageAccessToken: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:border-gold outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Instagram Business Account ID
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 17841400000000000"
                    value={tempConfig.instagramAccountId}
                    onChange={(e) => setTempConfig({ ...tempConfig, instagramAccountId: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:border-gold outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="enableMetaApi"
                    checked={tempConfig.enabled}
                    onChange={(e) => setTempConfig({ ...tempConfig, enabled: e.target.checked })}
                    className="w-4 h-4 accent-gold cursor-pointer"
                  />
                  <label htmlFor="enableMetaApi" className="text-xs text-white font-bold cursor-pointer">
                    Habilitar envio oficial de directs pelo Meta Graph API
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 bg-zinc-800 text-gray-300 text-xs font-black uppercase tracking-wider hover:bg-zinc-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gold text-black text-xs font-black uppercase tracking-wider hover:bg-white transition"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
