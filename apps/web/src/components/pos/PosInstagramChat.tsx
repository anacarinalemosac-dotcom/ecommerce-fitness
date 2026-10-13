'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Instagram,
  Send,
  Bot,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Trash2,
  Play,
  CheckCircle2,
  User,
  X,
  MessageSquare,
  Zap,
  FileText,
  Smartphone,
} from 'lucide-react';
import {
  InstagramDirectConversation,
  InstagramMetaConfig,
} from '@/lib/instagramDirectStore';
import { WhatsAppCatalogPdfModal } from '@/components/WhatsAppCatalogPdfModal';

interface PosInstagramChatProps {
  onNotifySale?: (message: string) => void;
  className?: string;
}

export function PosInstagramChat({ className = '' }: PosInstagramChatProps) {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<InstagramDirectConversation[]>([]);
  const [config, setConfig] = useState<InstagramMetaConfig>({
    enabled: false,
    pageAccessToken: '',
    instagramAccountId: '',
    verifyToken: 'ana_fitness_meta_token_2026',
    autoResponderActive: true,
  });
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showWhatsAppCatalogModal, setShowWhatsAppCatalogModal] = useState(false);
  const [simulateUser, setSimulateUser] = useState('@cliente_showroom');
  const [simulateMessage, setSimulateMessage] = useState('Olá! Qual o horário de funcionamento do showroom hoje?');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef<number>(0);

  // Busca estado das conversas no backend
  const fetchState = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/instagram/direct');
      const data = await res.json();
      if (data.success && data.data) {
        const convList: InstagramDirectConversation[] = data.data.conversations || [];
        setConversations(convList);
        setConfig(data.data.config || config);

        // Se nenhuma selecionada ou a selecionada sumiu, seleciona a primeira
        if (convList.length > 0) {
          setSelectedConvId((current) => {
            if (current && convList.some((c) => c.id === current)) return current;
            return convList[0].id;
          });
        }

        // Calcula total de mensagens para alerta sonoro/visual sutil
        const totalMsgs = convList.reduce((acc, c) => acc + (c.messages?.length || 0), 0);
        if (prevMsgCountRef.current > 0 && totalMsgs > prevMsgCountRef.current) {
          // Nova mensagem recebida em tempo real!
          const lastConv = convList[0];
          setNotificationBanner(`💬 Nova mensagem de @${lastConv?.username || 'cliente'} no Instagram!`);
          setTimeout(() => setNotificationBanner(null), 4000);
        }
        prevMsgCountRef.current = totalMsgs;
      }
    } catch (err) {
      console.warn('Erro ao carregar Instagram Direct no PDV:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Carrega na montagem e ativa Polling em tempo real a cada 4 segundos
  useEffect(() => {
    fetchState(false);
    const interval = setInterval(() => {
      fetchState(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Rola mensagens para o fim DENTRO da caixinha (sem mexer na rolagem da página inteira)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversations, selectedConvId]);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  // Enviar mensagem de resposta do balcão
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConv || sendingMessage) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSendingMessage(true);

    try {
      const res = await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: activeConv.id,
          text: textToSend,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConv.id) {
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
      console.error('Erro ao enviar mensagem no PDV:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Alterna status do Robô Automático
  const handleToggleBot = async () => {
    const newStatus = !config.autoResponderActive;
    const updated = { ...config, autoResponderActive: newStatus };
    setConfig(updated);

    try {
      await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_config', config: updated }),
      });
      setNotificationBanner(newStatus ? '🤖 Robô Instagram ATIVADO!' : '⏸️ Robô Instagram PAUSADO!');
      setTimeout(() => setNotificationBanner(null), 3000);
    } catch (e) {
      console.warn('Erro ao alternar bot:', e);
    }
  };

  // Simular mensagem de teste
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
        await fetchState(true);
        if (data.conversation?.id) {
          setSelectedConvId(data.conversation.id);
        }
        setNotificationBanner(
          data.botReplied
            ? `✅ Mensagem recebida e respondida pelo Robô (${data.matchedRuleName})!`
            : '✅ Mensagem de teste recebida no Direct!'
        );
        setTimeout(() => setNotificationBanner(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao simular cliente:', err);
    }
  };

  // Limpar conversa atual
  const handleDeleteActiveConv = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeConv || !confirm(`Excluir conversa com @${activeConv.username}?`)) return;

    try {
      await fetch('/api/instagram/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_conversation', conversationId: activeConv.id }),
      });
      setConversations((prev) => prev.filter((c) => c.id !== activeConv.id));
      setSelectedConvId(null);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className={`bg-neutral-950 border-2 border-deep-black shadow-luxury flex flex-col text-white ${className}`}>
      {/* 1. Header do Instagram Direct no PDV */}
      <div className="p-3.5 bg-deep-black border-b border-gold/30 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
            <Instagram className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                INSTAGRAM DIRECT
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Conexão ao vivo" />
            </div>
            <span className="text-[10px] text-gold font-bold tracking-widest block font-mono">
              @anafitnessweareua • AO VIVO NO BALCÃO
            </span>
          </div>
        </div>

        {/* Controles de Ação do Topo */}
        <div className="flex items-center gap-1.5">
          {/* Botão Liga/Desliga Robô */}
          <button
            type="button"
            onClick={handleToggleBot}
            className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 transition ${
              config.autoResponderActive
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 hover:bg-emerald-900'
                : 'bg-zinc-900 text-gray-400 border-zinc-700 hover:text-white'
            }`}
            title="Ligar ou pausar respostas automáticas do robô 24/7"
          >
            <Bot className={`w-3 h-3 ${config.autoResponderActive ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
            <span>ROBÔ: {config.autoResponderActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Botão Catálogo WhatsApp (PDF) */}
          <button
            type="button"
            onClick={() => setShowWhatsAppCatalogModal(true)}
            className="px-2 py-1 bg-emerald-950/90 text-emerald-300 border border-emerald-500 hover:bg-emerald-900 text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1 shadow-xs"
            title="Gerar catálogo WhatsApp em PDF (Apenas peças no ar)"
          >
            <FileText className="w-2.5 h-2.5 text-emerald-400" />
            <span>CATÁLOGO WHATSAPP</span>
          </button>

          {/* Botão de Teste Rápido */}
          <button
            type="button"
            onClick={() => setShowSimulateModal(true)}
            className="px-2 py-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[9px] font-black uppercase tracking-wider hover:brightness-110 transition flex items-center gap-1 shadow-xs"
            title="Simular pergunta de cliente para testar"
          >
            <Play className="w-2.5 h-2.5" />
            <span>TESTAR</span>
          </button>

          {/* Botão de Atualizar Manual */}
          <button
            type="button"
            onClick={() => fetchState(false)}
            className="p-1.5 bg-zinc-900 border border-zinc-700 hover:border-gold text-gray-300 hover:text-gold transition"
            title="Atualizar conversas agora"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Banner de Notificação em Tempo Real */}
      {notificationBanner && (
        <div className="p-2 bg-emerald-950 border-b border-emerald-500 text-emerald-200 text-[10px] font-black uppercase tracking-wider flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{notificationBanner}</span>
          </div>
          <button onClick={() => setNotificationBanner(null)} className="text-emerald-400 hover:text-white ml-2">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2. Barra de Clientes / Conversas Ativas (Abas horizontais) */}
      <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider shrink-0 pl-1">
          CLIENTES ({conversations.length}):
        </span>

        {conversations.length === 0 ? (
          <span className="text-[10px] text-gray-500 italic font-mono">
            Nenhuma mensagem pendente no momento
          </span>
        ) : (
          conversations.map((conv) => {
            const isSelected = activeConv?.id === conv.id;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedConvId(conv.id)}
                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-none flex items-center gap-1.5 shrink-0 border transition ${
                  isSelected
                    ? 'bg-gold text-deep-black border-gold shadow-sm'
                    : 'bg-zinc-950 text-gray-300 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                <span className="truncate max-w-[110px]">@{conv.username}</span>
                {conv.unreadCount > 0 && (
                  <span className="px-1 py-0.2 bg-red-600 text-white rounded-full text-[8px] font-black">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* 3. Área de Mensagens da Conversa Ativa */}
      <div className="flex-1 flex flex-col min-h-[380px] max-h-[460px] bg-gradient-to-b from-black via-zinc-950 to-zinc-950">
        {activeConv ? (
          <>
            {/* Top Bar da Conversa Ativa */}
            <div className="px-3 py-2 bg-black/80 border-b border-zinc-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full p-[1px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 shrink-0">
                  <img
                    src={activeConv.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                    alt={activeConv.username}
                    className="w-full h-full object-cover rounded-full bg-black"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-black text-xs text-white block truncate">
                    @{activeConv.username}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono block">
                    Direct Instagram • Leominster Showroom
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://instagram.com/${activeConv.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-0.5 underline font-bold"
                  title="Abrir perfil no Instagram"
                >
                  <span>Perfil</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <button
                  type="button"
                  onClick={handleDeleteActiveConv}
                  className="p-1 text-gray-500 hover:text-red-400 transition"
                  title="Excluir esta conversa"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Balões de Mensagem */}
            <div ref={messagesContainerRef} className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
              {activeConv.messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-[11px]">
                  Nenhuma mensagem nesta conversa ainda.
                </div>
              ) : (
                activeConv.messages.map((msg) => {
                  const isCustomer = msg.sender === 'customer';
                  const isBot = msg.sender === 'bot';
                  const isStore = msg.sender === 'store';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                    >
                      {/* Identificação de quem falou */}
                      <span className="text-[9px] text-gray-500 mb-0.5 px-1 flex items-center gap-1 font-bold uppercase font-mono">
                        {isCustomer && (
                          <>
                            <Instagram className="w-2.5 h-2.5 text-pink-500" />
                            <span>@{activeConv.username}</span>
                          </>
                        )}
                        {isBot && (
                          <>
                            <Bot className="w-2.5 h-2.5 text-purple-400" />
                            <span className="text-purple-300 font-bold">Robô Auto</span>
                          </>
                        )}
                        {isStore && (
                          <>
                            <User className="w-2.5 h-2.5 text-gold" />
                            <span className="text-gold font-bold">Balcão PDV</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>

                      {/* Balão */}
                      <div
                        className={`max-w-[88%] p-2.5 text-xs leading-relaxed shadow-sm rounded-none ${
                          isCustomer
                            ? 'bg-zinc-900 text-gray-200 border border-zinc-800'
                            : isBot
                            ? 'bg-purple-950/80 text-purple-100 border border-purple-500/40'
                            : 'bg-zinc-900 text-amber-50 border border-gold/40'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 4. Respostas Rápidas do Balcão (1 Clique) */}
            <div className="p-1.5 bg-black/90 border-t border-zinc-900 flex items-center gap-1 overflow-x-auto text-[10px]">
              <span className="text-[9px] text-gray-500 font-black uppercase shrink-0 pl-1">
                Rápidas:
              </span>
              <button
                type="button"
                onClick={() => setShowWhatsAppCatalogModal(true)}
                className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/70 text-emerald-300 whitespace-nowrap transition text-[9px] font-bold flex items-center gap-1"
                title="Abrir Catálogo WhatsApp PDF (Apenas peças no ar)"
              >
                <Smartphone className="w-2.5 h-2.5 text-emerald-400" />
                <span>📲 Catálogo WhatsApp (PDF)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setInputText('📍 Nosso Showroom fica em Leominster, MA! Venha nos visitar hoje para provar as peças 💕')
                }
                className="px-2 py-0.5 bg-zinc-900 hover:bg-gold hover:text-black border border-zinc-800 text-gray-300 whitespace-nowrap transition text-[9px] font-bold"
              >
                📍 Showroom
              </button>
              <button
                type="button"
                onClick={() =>
                  setInputText('📲 Veja a coleção completa a pronta entrega no site: https://anafitnesswear.com/ ✨')
                }
                className="px-2 py-0.5 bg-zinc-900 hover:bg-gold hover:text-black border border-zinc-800 text-gray-300 whitespace-nowrap transition text-[9px] font-bold"
              >
                📲 Catálogo
              </button>
              <button
                type="button"
                onClick={() =>
                  setInputText('💵 Aceitamos Zelle (+1 978 313-9452), Venmo, Cartão ou Crediário da Loja!')
                }
                className="px-2 py-0.5 bg-zinc-900 hover:bg-gold hover:text-black border border-zinc-800 text-gray-300 whitespace-nowrap transition text-[9px] font-bold"
              >
                💵 Zelle
              </button>
              <button
                type="button"
                onClick={() =>
                  setInputText('📦 Frete fixo USPS $9.99 para qualquer estado dos EUA (Grátis acima de $150)!')
                }
                className="px-2 py-0.5 bg-zinc-900 hover:bg-gold hover:text-black border border-zinc-800 text-gray-300 whitespace-nowrap transition text-[9px] font-bold"
              >
                📦 Frete EUA
              </button>
            </div>

            {/* 5. Campo de Envio de Resposta pelo Balcão */}
            <form onSubmit={handleSendMessage} className="p-2.5 bg-black border-t border-zinc-800 flex gap-1.5">
              <input
                type="text"
                placeholder={`Responder para @${activeConv.username} no Instagram...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-zinc-900 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={sendingMessage || !inputText.trim()}
                className="px-4 py-2 bg-gold hover:bg-white text-deep-black font-black text-xs uppercase tracking-wider flex items-center gap-1 transition shrink-0 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ENVIAR</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center mx-auto opacity-80">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Instagram Direct Conectado
              </h4>
              <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                Nenhuma mensagem no momento. Quando clientes enviarem direct para @anafitnessweareua, aparecerá aqui automaticamente em tempo real!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSimulateModal(true)}
              className="mt-2 px-3 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider hover:brightness-110 transition flex items-center gap-1.5 shadow"
            >
              <Play className="w-3 h-3" />
              <span>Simular Mensagem de Teste</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL PARA SIMULAR PERGUNTA DE TESTE DE CLIENTE */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-gold p-5 max-w-md w-full space-y-4 shadow-2xl text-white animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-pink-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Simular Mensagem de Cliente no Instagram
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateCustomer} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-300">
                  @ Nome da Cliente no Instagram:
                </label>
                <input
                  type="text"
                  required
                  value={simulateUser}
                  onChange={(e) => setSimulateUser(e.target.value)}
                  placeholder="@mariana_fitness"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs font-mono focus:border-gold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-300">
                  Mensagem que a cliente enviou no Direct:
                </label>
                <textarea
                  required
                  rows={3}
                  value={simulateMessage}
                  onChange={(e) => setSimulateMessage(e.target.value)}
                  placeholder="Ex: Vocês abrem hoje? Qual o endereço em Leominster?"
                  className="w-full px-3 py-2 bg-black border border-zinc-800 text-white text-xs focus:border-gold outline-none resize-none"
                />
                <span className="text-[9px] text-gray-500">
                  💡 Se o Robô estiver ativado, ele responderá automaticamente com base nas palavras-chave configuradas!
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="flex-1 py-2 border border-zinc-800 text-gray-400 hover:text-white text-xs font-black uppercase transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black uppercase tracking-wider hover:brightness-110 transition shadow flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Teste</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CATÁLOGO WHATSAPP EM PDF (Apenas peças no ar) */}
      <WhatsAppCatalogPdfModal
        isOpen={showWhatsAppCatalogModal}
        onClose={() => setShowWhatsAppCatalogModal(false)}
      />
    </div>
  );
}
