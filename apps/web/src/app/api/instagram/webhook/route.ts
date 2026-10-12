import { NextRequest, NextResponse } from 'next/server';
import {
  getInstagramDirectState,
  saveInstagramDirectState,
  matchAutoReplyRule,
  InstagramDirectMessage,
  InstagramDirectConversation,
} from '@/lib/instagramDirectStore';

export const dynamic = 'force-dynamic';

/**
 * 1. GET - Validação do Webhook pela Meta (Instagram Messenger API)
 * A Meta envia uma requisição GET com hub.mode, hub.verify_token e hub.challenge
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const state = await getInstagramDirectState();
    const expectedToken = state.config?.verifyToken || 'ana_fitness_meta_token_2026';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('✅ Webhook do Instagram verificado com sucesso pela Meta!');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('❌ Falha na verificação do Webhook da Meta: Token inválido');
    return new Response('Forbidden', { status: 403 });
  } catch (err: any) {
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * 2. POST - Recebimento de mensagens em tempo real do Instagram Direct
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Valida se o evento é do Instagram
    if (payload.object !== 'instagram' && payload.object !== 'page') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const state = await getInstagramDirectState();
    let hasChanges = false;

    // Processa os eventos recebidos da Meta
    for (const entry of payload.entry || []) {
      for (const messagingEvent of entry.messaging || []) {
        const senderId = messagingEvent.sender?.id;
        const recipientId = messagingEvent.recipient?.id;
        const messageText = messagingEvent.message?.text;
        const messageMid = messagingEvent.message?.mid;

        // Ignora ecos (mensagens enviadas pela própria página) ou mensagens sem texto
        if (!senderId || !messageText || messagingEvent.message?.is_echo) {
          continue;
        }

        // Localiza ou cria a conversa
        let conv = state.conversations.find((c) => c.id === senderId || c.username === senderId);
        let isFirstMessage = false;

        if (!conv) {
          isFirstMessage = true;
          conv = {
            id: senderId,
            username: `cliente_${senderId.slice(-4)}`,
            fullName: `Cliente Instagram (${senderId.slice(-4)})`,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
            lastMessage: messageText,
            lastTimestamp: new Date().toISOString(),
            unreadCount: 1,
            status: 'active',
            messages: [],
          };
          state.conversations.unshift(conv);
        } else {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }

        const userMsg: InstagramDirectMessage = {
          id: messageMid || `msg-ig-${Date.now()}`,
          sender: 'customer',
          senderName: conv.username,
          text: messageText,
          timestamp: new Date().toISOString(),
        };

        conv.messages.push(userMsg);
        conv.lastMessage = messageText;
        conv.lastTimestamp = userMsg.timestamp;
        hasChanges = true;

        // Verifica regras de resposta automática do Bot se estiver ativo
        if (state.config.autoResponderActive) {
          const matchedRule = matchAutoReplyRule(messageText, state.rules, isFirstMessage);

          if (matchedRule) {
            const botMsg: InstagramDirectMessage = {
              id: `msg-bot-reply-${Date.now()}`,
              sender: 'bot',
              senderName: 'Robô ANA Fitness 🤖',
              text: matchedRule.replyText,
              timestamp: new Date(Date.now() + 1000).toISOString(),
              status: 'sent',
            };

            conv.messages.push(botMsg);
            conv.lastMessage = matchedRule.replyText;
            conv.lastTimestamp = botMsg.timestamp;
            conv.status = 'bot_handled';

            // Se as credenciais oficiais estiverem configuradas, envia a resposta para o direct do Instagram
            if (state.config.enabled && state.config.pageAccessToken) {
              try {
                await fetch(
                  `https://graph.facebook.com/v19.0/me/messages?access_token=${state.config.pageAccessToken}`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      recipient: { id: senderId },
                      message: { text: matchedRule.replyText },
                    }),
                  }
                );
              } catch (dispatchErr) {
                console.warn('Erro ao despachar resposta automática via Meta Graph API:', dispatchErr);
              }
            }
          }
        }
      }
    }

    if (hasChanges) {
      await saveInstagramDirectState(state);
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (err: any) {
    console.error('Erro no webhook do Instagram:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
