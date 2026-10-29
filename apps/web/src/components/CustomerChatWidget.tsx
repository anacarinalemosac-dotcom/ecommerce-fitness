'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Phone, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useStoreSettings } from '../context/StoreSettingsContext';

export function CustomerChatWidget() {
  const { lang } = useLanguage();
  const { siteInfo } = useStoreSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  const [chatStep, setChatStep] = useState<'welcome' | 'custom'>('welcome');

  // Número do WhatsApp oficial da loja
  const rawPhone = siteInfo.phone ? siteInfo.phone.replace(/\D/g, '') : '19783139452';
  const whatsappNumber = rawPhone.length === 10 ? `1${rawPhone}` : rawPhone;

  // Abre automaticamente uma mensagem de boas-vindas sutil após 6 segundos na primeira visita
  useEffect(() => {
    const timer = setTimeout(() => {
      const alreadyClosed = sessionStorage.getItem('ana_chat_auto_shown');
      if (!alreadyClosed) {
        setHasUnread(true);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenChat = () => {
    setIsOpen(true);
    setHasUnread(false);
    sessionStorage.setItem('ana_chat_auto_shown', 'true');
  };

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  const sendToWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${whatsappNumber}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;
    const fullMsg = lang === 'pt'
      ? `Olá, Ana Carina! Estou no site da Ana Fitness Wear e tenho uma dúvida:\n\n"${userMessage.trim()}"`
      : `Hello Ana Carina! I am on the Ana Fitness Wear website and have a question:\n\n"${userMessage.trim()}"`;
    sendToWhatsApp(fullMsg);
    setUserMessage('');
    setIsOpen(false);
  };

  const quickQuestions = [
    {
      labelPt: '📏 Como escolher meu tamanho ideal?',
      labelEn: '📏 How do I choose my size?',
      msgPt: 'Olá, Ana Carina! Gostaria de uma ajuda para escolher o tamanho ideal para meu corpo (P, M, G ou GG) nas peças da loja.',
      msgEn: 'Hello Ana Carina! I would like some help choosing the ideal size for my body (S, M, L or XL) for your activewear.',
    },
    {
      labelPt: '🚚 Prazo e frete para minha cidade nos EUA?',
      labelEn: '🚚 Delivery timeframe across the US?',
      msgPt: 'Olá, Ana Carina! Gostaria de saber o prazo estimado de entrega do frete fixo ($9.99 USPS) para o meu endereço nos EUA.',
      msgEn: 'Hello Ana Carina! I would like to know the delivery estimate with USPS Priority flat rate shipping to my US address.',
    },
    {
      labelPt: '💳 Como pagar no Affirm, Afterpay ou Zelle?',
      labelEn: '💳 How does Affirm, Afterpay or Zelle work?',
      msgPt: 'Olá, Ana Carina! Gostaria de tirar uma dúvida sobre as formas de pagamento parceladas no Affirm/Afterpay e descontos no Zelle.',
      msgEn: 'Hello Ana Carina! I have a question about Affirm / Afterpay 4x installments and payment options.',
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 font-sans">
      {/* 1. JANELA DO CHAT (ABERTA) */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[360px] bg-white border-2 border-deep-black shadow-luxury mb-3 flex flex-col overflow-hidden animate-fadeIn rounded-xs">
          {/* Header do Chat */}
          <div className="bg-deep-black text-white p-4 border-b-2 border-gold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/symbol-ana-fitness.png"
                  alt="Ana Carina"
                  className="w-10 h-10 object-contain rounded-full bg-white/10 p-1 border border-gold"
                  onError={(e) => {
                    // Fallback se imagem não existir
                    (e.target as any).style.display = 'none';
                  }}
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-deep-black animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Ana Carina Lemos
                  </h4>
                  <Sparkles className="w-3 h-3 text-gold" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{lang === 'pt' ? 'Online Agora • Atendimento VIP' : 'Online Now • VIP Support'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseChat}
              className="text-white/70 hover:text-gold p-1 transition cursor-pointer"
              title="Fechar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corpo das Mensagens */}
          <div className="p-4 bg-neutral-50 max-h-[340px] overflow-y-auto space-y-3 text-xs">
            {/* Mensagem da Ana Carina */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-deep-black text-gold flex items-center justify-center shrink-0 text-[10px] font-black border border-gold">
                AC
              </div>
              <div className="bg-white border border-deep-black/10 p-3 shadow-xs space-y-1.5 text-deep-black leading-relaxed">
                <p className="font-bold text-[11px]">
                  {lang === 'pt' ? 'Olá, maravilhosa! Seja muito bem-vinda à Ana Fitness Wear ✨' : 'Hello gorgeous! Welcome to Ana Fitness Wear ✨'}
                </p>
                <p className="text-[11px] text-deep-black/80">
                  {lang === 'pt'
                    ? 'Sou a Ana Carina. Quer ajuda com medidas, prazo de entrega nos EUA ou formas de pagamento parceladas no Affirm & Afterpay?'
                    : 'I am Ana Carina. Would you like help with sizing, delivery timeframe across the US or payment options?'}
                </p>
                <span className="text-[9px] text-deep-black/40 font-mono block text-right pt-0.5">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Perguntas Rápidas */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-deep-black/50 block px-1">
                {lang === 'pt' ? 'Perguntas Frequentes (1 clique):' : 'Quick Options (1 tap):'}
              </span>
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendToWhatsApp(lang === 'pt' ? q.msgPt : q.msgEn)}
                  className="w-full text-left p-2.5 bg-white hover:bg-gold/10 border border-deep-black/20 hover:border-gold text-[11px] font-bold text-deep-black transition flex items-center justify-between group shadow-2xs cursor-pointer"
                >
                  <span>{lang === 'pt' ? q.labelPt : q.labelEn}</span>
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Entrada de Mensagem */}
          <form onSubmit={handleCustomSubmit} className="p-3 bg-white border-t border-deep-black/10 flex items-center gap-2">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder={lang === 'pt' ? 'Digite sua dúvida ou mensagem...' : 'Type your question here...'}
              className="flex-1 px-3 py-2 text-xs bg-neutral-100 border border-deep-black/20 text-deep-black placeholder:text-deep-black/40 focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              title="Enviar para o WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Rodapé informativo */}
          <div className="px-3 py-1.5 bg-deep-black text-[9px] text-white/70 font-mono flex items-center justify-between uppercase">
            <span>ANA FITNESS WEAR LLC • MA, USA</span>
            <span className="text-gold font-bold">100% SEGURO</span>
          </div>
        </div>
      )}

      {/* 2. BOTÃO FLUTUANTE (FECHADO OU MINIMIZADO) */}
      {!isOpen && (
        <div className="flex items-center gap-2 group">
          {/* Balão de chamada convidativo */}
          <button
            type="button"
            onClick={handleOpenChat}
            className="hidden sm:flex items-center gap-2 bg-deep-black text-white px-3.5 py-2 border border-gold shadow-luxury hover:bg-gold hover:text-deep-black transition cursor-pointer text-xs font-black uppercase tracking-wider animate-bounce"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold group-hover:text-deep-black" />
            <span>{lang === 'pt' ? 'Dúvidas? Fale com a Ana' : 'Questions? Chat with Ana'}</span>
          </button>

          {/* Botão de Ícone Principal do Chat */}
          <button
            type="button"
            onClick={handleOpenChat}
            className="relative w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-luxury transition-transform hover:scale-105 border-2 border-deep-black cursor-pointer"
            aria-label="Abrir chat com a Ana Carina"
          >
            <MessageCircle className="w-7 h-7 text-deep-black" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                1
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-300 rounded-full border-2 border-deep-black" />
          </button>
        </div>
      )}
    </div>
  );
}
