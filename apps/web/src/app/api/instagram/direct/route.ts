import { NextRequest, NextResponse } from 'next/server';
import {
  getInstagramDirectState,
  saveInstagramDirectState,
  matchAutoReplyRule,
  InstagramDirectMessage,
  InstagramDirectConversation,
} from '@/lib/instagramDirectStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const state = await getInstagramDirectState();
    return NextResponse.json({ success: true, data: state });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const state = await getInstagramDirectState();

    // 1. Enviar mensagem como a Loja (Ana)
    if (action === 'send_message') {
      const { conversationId, text } = body;
      if (!conversationId || !text?.trim()) {
        return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
      }

      const convIndex = state.conversations.findIndex((c) => c.id === conversationId);
      if (convIndex === -1) {
        return NextResponse.json({ success: false, error: 'Conversa não encontrada' }, { status: 404 });
      }

      const newMsg: InstagramDirectMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'store',
        senderName: 'Ana (ANA Fitness)',
        text: text.trim(),
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      state.conversations[convIndex].messages.push(newMsg);
      state.conversations[convIndex].lastMessage = text.trim();
      state.conversations[convIndex].lastTimestamp = newMsg.timestamp;
      state.conversations[convIndex].status = 'active';

      // Se Meta API estiver configurada com Access Token, faz o disparo oficial
      let metaDispatched = false;
      if (state.config.enabled && state.config.pageAccessToken) {
        try {
          const apiBase = state.config.pageAccessToken.startsWith('IGAA')
            ? 'https://graph.instagram.com/v19.0'
            : 'https://graph.facebook.com/v19.0';
          const metaRes = await fetch(
            `${apiBase}/me/messages?access_token=${state.config.pageAccessToken}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: { id: conversationId },
                message: { text: text.trim() },
              }),
            }
          );
          if (metaRes.ok) {
            metaDispatched = true;
          } else {
            const errData = await metaRes.json().catch(() => null);
            console.warn('Resposta Meta API no envio direto:', metaRes.status, errData);
          }
        } catch (metaErr) {
          console.warn('Erro ao disparar mensagem para Meta Graph API:', metaErr);
        }
      }

      await saveInstagramDirectState(state);
      return NextResponse.json({ success: true, message: newMsg, metaDispatched });
    }

    // 2. Simular mensagem de cliente ou teste no painel
    if (action === 'simulate_customer') {
      const { username, text } = body;
      if (!text?.trim()) {
        return NextResponse.json({ success: false, error: 'Texto da mensagem é obrigatório' }, { status: 400 });
      }

      const cleanUser = (username || 'cliente_teste').replace('@', '').trim().toLowerCase();
      let conv = state.conversations.find((c) => c.username === cleanUser);
      let isFirstMessage = false;

      if (!conv) {
        isFirstMessage = true;
        conv = {
          id: `conv-${cleanUser}-${Date.now()}`,
          username: cleanUser,
          fullName: `@${cleanUser}`,
          avatar: `https://images.unsplash.com/photo-${1500000000000 + (cleanUser.length * 100000)}?w=120&auto=format&fit=crop&q=80`,
          lastMessage: text.trim(),
          lastTimestamp: new Date().toISOString(),
          unreadCount: 0,
          status: 'active',
          messages: [],
        };
        state.conversations.unshift(conv);
      }

      const incomingMsg: InstagramDirectMessage = {
        id: `msg-in-${Date.now()}`,
        sender: 'customer',
        senderName: `@${cleanUser}`,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      conv.messages.push(incomingMsg);
      conv.lastMessage = text.trim();
      conv.lastTimestamp = incomingMsg.timestamp;
      conv.unreadCount = (conv.unreadCount || 0) + 1;

      // Executa motor de automação (Bot) se estiver ativo
      let botReplied = false;
      let matchedRuleName = '';
      if (state.config.autoResponderActive) {
        const matchedRule = matchAutoReplyRule(text.trim(), state.rules, isFirstMessage || conv.messages.length <= 2);
        if (matchedRule) {
          matchedRuleName = matchedRule.name;
          const botMsg: InstagramDirectMessage = {
            id: `msg-bot-${Date.now()}`,
            sender: 'bot',
            senderName: 'Robô ANA Fitness 🤖',
            text: matchedRule.replyText,
            timestamp: new Date(Date.now() + 500).toISOString(),
            status: 'sent',
          };
          conv.messages.push(botMsg);
          conv.lastMessage = matchedRule.replyText;
          conv.lastTimestamp = botMsg.timestamp;
          conv.status = 'bot_handled';
          botReplied = true;
        }
      }

      await saveInstagramDirectState(state);
      return NextResponse.json({ success: true, conversation: conv, botReplied, matchedRuleName });
    }

    // 3. Atualizar regras de automação
    if (action === 'update_rules') {
      const { rules } = body;
      if (!Array.isArray(rules)) {
        return NextResponse.json({ success: false, error: 'Lista de regras inválida' }, { status: 400 });
      }
      state.rules = rules;
      await saveInstagramDirectState(state);
      return NextResponse.json({ success: true, rules: state.rules });
    }

    // 4. Atualizar configurações de credenciais Meta API
    if (action === 'update_config') {
      const { config } = body;
      if (!config) {
        return NextResponse.json({ success: false, error: 'Configuração inválida' }, { status: 400 });
      }
      state.config = {
        ...state.config,
        ...config,
      };
      await saveInstagramDirectState(state);
      return NextResponse.json({ success: true, config: state.config });
    }

    // 5. Marcar conversa como lida
    if (action === 'mark_as_read') {
      const { conversationId } = body;
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.unreadCount = 0;
        await saveInstagramDirectState(state);
      }
      return NextResponse.json({ success: true });
    }

    // 6. Limpar todas as conversas
    if (action === 'clear_conversations') {
      state.conversations = [];
      await saveInstagramDirectState(state);
      return NextResponse.json({ success: true, conversations: [] });
    }

    // 7. Excluir uma conversa específica
    if (action === 'delete_conversation') {
      const { conversationId } = body;
      state.conversations = state.conversations.filter((c) => c.id !== conversationId);
      await saveInstagramDirectState(state);
      return NextResponse.json({ success: true, conversations: state.conversations });
    }

    // 8. Resetar / Restaurar padrão de fábrica
    if (action === 'reset_defaults') {
      await saveInstagramDirectState({
        config: {
          enabled: false,
          pageAccessToken: '',
          instagramAccountId: '',
          verifyToken: 'ana_fitness_meta_token_2026',
          autoResponderActive: true,
        },
        rules: state.rules,
        conversations: [],
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
