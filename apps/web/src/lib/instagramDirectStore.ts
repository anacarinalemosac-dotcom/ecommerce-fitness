import { supabaseServer } from './supabaseServer';

export interface InstagramDirectRule {
  id: string;
  name: string;
  triggerType: 'first_message' | 'keywords' | 'off_hours';
  keywords: string[];
  replyText: string;
  enabled: boolean;
}

export interface InstagramDirectMessage {
  id: string;
  sender: 'customer' | 'store' | 'bot';
  senderName: string;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface InstagramDirectConversation {
  id: string;
  username: string;
  fullName: string;
  avatar?: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  status: 'active' | 'bot_handled' | 'resolved';
  messages: InstagramDirectMessage[];
}

export interface InstagramMetaConfig {
  enabled: boolean;
  pageAccessToken: string;
  instagramAccountId: string;
  verifyToken: string;
  autoResponderActive: boolean;
}

export interface InstagramDirectState {
  config: InstagramMetaConfig;
  rules: InstagramDirectRule[];
  conversations: InstagramDirectConversation[];
  updatedAt: string;
}

export const INSTAGRAM_STATE_ROW_ID = '00000000-0000-0000-0000-000000000095';
export const INSTAGRAM_STATE_SLUG = '__instagram_direct_state__';

export const DEFAULT_RULES: InstagramDirectRule[] = [
  {
    id: 'rule-welcome',
    name: 'Boas-vindas Imediata (Primeiro Direct)',
    triggerType: 'first_message',
    keywords: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi'],
    replyText: 'Olá! ✨ Bem-vinda à ANA Fitness Wear! Nosso Showroom fica em Leominster, MA e enviamos para todos os Estados Unidos com taxa fixa de $9.99 via USPS! Como posso te ajudar hoje?',
    enabled: true,
  },
  {
    id: 'rule-catalog',
    name: 'Catálogo & Fotos de Produtos',
    triggerType: 'keywords',
    keywords: ['catalogo', 'catálogo', 'fotos', 'colecao', 'coleção', 'modelos', 'pecas', 'peças', 'novidades'],
    replyText: 'Você pode conferir nossa coleção completa e pronta entrega no nosso site: https://anafitnesswear.com/ ou pedir nosso catálogo em PDF atualizado! Qual peça você gostaria de ver?',
    enabled: true,
  },
  {
    id: 'rule-prices',
    name: 'Valores & Preços Médios',
    triggerType: 'keywords',
    keywords: ['preco', 'preço', 'quanto custa', 'valor', 'valores', 'quanto e', 'quanto é', 'desconto'],
    replyText: 'Nossos conjuntos e peças em poliamida premium variam entre $35 e $78 USD, com tecido encorpado, zero transparência e alta sustentação! Qual modelo chamou sua atenção?',
    enabled: true,
  },
  {
    id: 'rule-address',
    name: 'Endereço & Showroom Físico (Leominster)',
    triggerType: 'keywords',
    keywords: ['endereco', 'endereço', 'onde fica', 'showroom', 'loja fisica', 'loja física', 'leominster', 'provar', 'retirar', 'visitar'],
    replyText: 'Nosso Showroom fica localizado em Leominster, Massachusetts! 📍 Você é super bem-vinda para provar as peças pessoalmente. Para agendar sua visita, nos avise aqui ou chame no WhatsApp +1 (978) 313-9452!',
    enabled: true,
  },
  {
    id: 'rule-sizes',
    name: 'Tabela de Medidas & Caimento',
    triggerType: 'keywords',
    keywords: ['tamanho', 'tamanhos', 'medida', 'medidas', 'veste', 'tabela', 'small', 'medium', 'large', 'p', 'm', 'g'],
    replyText: 'Nossas peças possuem excelente elasticidade e modelam o corpo sem apertar! Tamanhos: P (veste 34-36 / US 2-4), M (veste 38-40 / US 6-8) e G (veste 42-44 / US 10-12). Me conta: qual tamanho você costuma usar?',
    enabled: true,
  },
  {
    id: 'rule-shipping',
    name: 'Envio & Frete nos Estados Unidos',
    triggerType: 'keywords',
    keywords: ['frete', 'envio', 'usps', 'entrega', 'prazo', 'shipping', 'envia'],
    replyText: 'Enviamos para qualquer estado dos EUA via USPS Priority Mail com taxa fixa de apenas $9.99 (ou FRETE GRÁTIS em pedidos acima de $150)! O prazo médio é de 2 a 4 dias úteis 📦✨',
    enabled: true,
  },
  {
    id: 'rule-payments',
    name: 'Formas de Pagamento & Zelle',
    triggerType: 'keywords',
    keywords: ['pagamento', 'pagar', 'zelle', 'venmo', 'cartao', 'cartão', 'parcela', 'crediario', 'crediário'],
    replyText: 'Aceitamos Zelle (+1 978 313-9452 ou anafitweareua@gmail.com), Venmo, Cartão de Crédito/Apple Pay no site e Crediário facilitado no Showroom! 💳✨',
    enabled: true,
  },
];

export const DEFAULT_CONVERSATIONS: InstagramDirectConversation[] = [
  {
    id: 'conv-patricia',
    username: 'patricia_boston',
    fullName: 'Patrícia Oliveira',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Enviamos para qualquer estado dos EUA via USPS Priority Mail com taxa fixa...',
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    unreadCount: 0,
    status: 'bot_handled',
    messages: [
      {
        id: 'msg-p1',
        sender: 'customer',
        senderName: 'patricia_boston',
        text: 'Oi Ana! Tudo bem? Vocês enviam para Boston? Quanto fica o frete?',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: 'msg-p2',
        sender: 'bot',
        senderName: 'Robô ANA Fitness',
        text: 'Enviamos para qualquer estado dos EUA via USPS Priority Mail com taxa fixa de apenas $9.99 (ou FRETE GRÁTIS em pedidos acima de $150)! O prazo médio é de 2 a 4 dias úteis 📦✨',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
    ],
  },
  {
    id: 'conv-carol',
    username: 'carol_fit_usa',
    fullName: 'Caroline Souza',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Amei os conjuntos! O showroom fica aberto hoje?',
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    unreadCount: 1,
    status: 'active',
    messages: [
      {
        id: 'msg-c1',
        sender: 'customer',
        senderName: 'carol_fit_usa',
        text: 'Olá! Onde fica o endereço do showroom para provar?',
        timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      },
      {
        id: 'msg-c2',
        sender: 'bot',
        senderName: 'Robô ANA Fitness',
        text: 'Nosso Showroom fica localizado em Leominster, Massachusetts! 📍 Você é super bem-vinda para provar as peças pessoalmente. Para agendar sua visita, nos avise aqui ou chame no WhatsApp +1 (978) 313-9452!',
        timestamp: new Date(Date.now() - 1000 * 60 * 49).toISOString(),
      },
      {
        id: 'msg-c3',
        sender: 'customer',
        senderName: 'carol_fit_usa',
        text: 'Amei os conjuntos! O showroom fica aberto hoje à tarde por volta das 15h?',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
  },
  {
    id: 'conv-jessica',
    username: 'jessica_framingham',
    fullName: 'Jéssica Mendes',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Vocês têm catálogo com as fotos e valores?',
    lastTimestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    unreadCount: 0,
    status: 'bot_handled',
    messages: [
      {
        id: 'msg-j1',
        sender: 'customer',
        senderName: 'jessica_framingham',
        text: 'Vocês têm catálogo com as fotos e valores?',
        timestamp: new Date(Date.now() - 1000 * 60 * 185).toISOString(),
      },
      {
        id: 'msg-j2',
        sender: 'bot',
        senderName: 'Robô ANA Fitness',
        text: 'Você pode conferir nossa coleção completa e pronta entrega no nosso site: https://anafitnesswear.com/ ou pedir nosso catálogo em PDF atualizado! Qual peça você gostaria de ver?',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ],
  },
];

export async function getInstagramDirectState(): Promise<InstagramDirectState> {
  try {
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', INSTAGRAM_STATE_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed: InstagramDirectState = JSON.parse(row.description);
        if (parsed.conversations && parsed.rules) {
          return parsed;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Erro ao carregar estado do Instagram do Supabase:', err);
  }

  // Retorna estado padrão inicial
  const initialState: InstagramDirectState = {
    config: {
      enabled: false,
      pageAccessToken: '',
      instagramAccountId: '',
      verifyToken: 'ana_fitness_meta_token_2026',
      autoResponderActive: true,
    },
    rules: DEFAULT_RULES,
    conversations: DEFAULT_CONVERSATIONS,
    updatedAt: new Date().toISOString(),
  };

  return initialState;
}

export async function saveInstagramDirectState(state: InstagramDirectState): Promise<boolean> {
  try {
    state.updatedAt = new Date().toISOString();
    const { error } = await supabaseServer.from('products').upsert({
      id: INSTAGRAM_STATE_ROW_ID,
      title: '__INSTAGRAM_DIRECT_STATE__',
      slug: INSTAGRAM_STATE_SLUG,
      description: JSON.stringify(state),
    });

    if (error) {
      console.warn('Erro ao salvar estado do Instagram no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Falha ao salvar estado do Instagram:', err);
    return false;
  }
}

/**
 * Busca regra de automação compatível com o texto recebido
 */
export function matchAutoReplyRule(
  incomingText: string,
  rules: InstagramDirectRule[],
  isFirstMessage = false
): InstagramDirectRule | null {
  const normalized = incomingText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 1. Checa primeiro por regras de palavras-chave mais específicas
  for (const rule of rules) {
    if (!rule.enabled || rule.triggerType !== 'keywords') continue;

    for (const kw of rule.keywords) {
      const normalizedKw = kw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (normalized.includes(normalizedKw)) {
        return rule;
      }
    }
  }

  // 2. Se for primeira mensagem ou cumprimento genérico
  if (isFirstMessage) {
    const welcomeRule = rules.find((r) => r.triggerType === 'first_message' && r.enabled);
    if (welcomeRule) return welcomeRule;
  }

  return null;
}
