'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  ShoppingBag,
  Sparkles,
  Users,
  Flame,
  Clock,
  Send,
  Copy,
  Check,
  Search,
  PlusCircle,
  RefreshCw,
  Phone,
  MessageCircle,
  ExternalLink,
  Edit3,
  Download,
  AlertCircle,
  Heart,
  HelpCircle,
  Tag,
  CheckCircle2,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';

interface LeadsRecoveryViewProps {
  salesData?: any;
}

interface ContactItem {
  id: string;
  name: string;
  phone: string;
  phone_digits: string;
  email: string;
  city: string;
  state: string;
  sizes_bought: string[];
  orders_count: number;
  total_spent: number;
  last_product: string;
  last_order_date: string;
  sources: string[];
  notes: string;
  opted_out?: boolean;
  created_at: string;
  updated_at: string;
}

type SegmentTab = 'ALL' | 'LEADS' | 'CLIENTS' | 'VIP' | 'INACTIVE_30D';

interface MessageTemplate {
  id: string;
  title: string;
  shortDesc: string;
  icon: string;
  color: string;
  badge: string;
  text: string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'cart_abandoned',
    title: 'Carrinho Abandonado',
    shortDesc: 'Para quem separou peças no site mas não finalizou',
    icon: '🛒',
    color: 'amber',
    badge: 'LEADS',
    text: 'Oi {nome}! 💕 Aqui é da ANA Fitness Wear. Vi que você separou o {peça} no nosso site, mas não finalizou o pedido. Ficou com alguma dúvida sobre o tamanho {tamanho} ou valor de frete? Se você quiser, posso finalizar seu pedido por aqui direto no WhatsApp ou te enviar o link! ✨',
  },
  {
    id: 'size_restock',
    title: 'Novidades no Tamanho Dela',
    shortDesc: 'Avisa quando chegam peças no tamanho dela',
    icon: '✨',
    color: 'purple',
    badge: 'TAMANHO',
    text: 'Oi {nome}! Tudo bem, maravilhosa? 💖 Chegaram reposições lindas aqui na ANA Fitness Wear no seu tamanho {tamanho}, com tecido zero transparência e cós duplo anatômico! Quer que eu te mande fotos das novidades no seu tamanho?',
  },
  {
    id: 'miss_you_coupon',
    title: 'Cupom de Saudade (+30 dias)',
    shortDesc: 'Reativação de clientes sumidas há mais de 30 dias',
    icon: '💌',
    color: 'rose',
    badge: 'REATIVAÇÃO',
    text: 'Oi {nome}, quanta saudade de você por aqui! 🥰 Preparamos um carinho especial pra você voltar: um cupom exclusivo de desconto no site! Dá uma olhada nas peças novas e me avisa o que achou: https://anafitwear.com ✨',
  },
  {
    id: 'pending_payment',
    title: 'Reserva Pendente (Zelle/Cash App)',
    shortDesc: 'Para quem escolheu pagar via Zelle / Cash App',
    icon: '⚡',
    color: 'emerald',
    badge: 'PAGAMENTO',
    text: 'Oi {nome}! Sua peça {peça} já está separada aqui no nosso estoque com muito carinho. Como você optou por Zelle/Cash App, estou passando só pra te enviar a chave e já garantir o envio do seu pacote hoje mesmo! 📦',
  },
  {
    id: 'size_consulting',
    title: 'Consultoria de Medidas & Caimento',
    shortDesc: 'Tira dúvidas de tecido, caimento e tabela',
    icon: '💬',
    color: 'blue',
    badge: 'SUPORTE',
    text: 'Oi {nome}! Vi que você tem interesse no {peça}. Quer ajuda com nossa tabela de medidas pra ter certeza de que o caimento vai ficar perfeito no seu corpo? Qualquer dúvida estou por aqui! 💕',
  },
];

export function LeadsRecoveryView({ salesData }: LeadsRecoveryViewProps) {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState<SegmentTab>('ALL');
  const [sizeFilter, setSizeFilter] = useState<string>('ALL');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('cart_abandoned');
  const [customMessage, setCustomMessage] = useState<string>(MESSAGE_TEMPLATES[0].text);
  const [contactedMap, setContactedMap] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Novo Lead Manual
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    size: 'M',
    lastProduct: '',
    city: '',
    state: 'MA',
    source: 'CARRINHO_LEAD',
    notes: '',
  });

  // Modal Anotação Rápida
  const [editingNoteContact, setEditingNoteContact] = useState<ContactItem | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Carrega histórico de contatos do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ana_leads_contacted_today');
      if (stored) {
        setContactedMap(JSON.parse(stored));
      }
    } catch (_) {}
  }, []);

  const saveContacted = (contactId: string) => {
    const next = {
      ...contactedMap,
      [contactId]: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setContactedMap(next);
    try {
      localStorage.setItem('ana_leads_contacted_today', JSON.stringify(next));
    } catch (_) {}
  };

  // Carrega contatos da API
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backoffice/marketing-contacts', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.contacts)) {
          setContacts(data.contacts);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar contatos de leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [salesData?.sales?.length]);

  // Atualiza mensagem quando troca de template
  const handleSelectTemplate = (tmpl: MessageTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setCustomMessage(tmpl.text);
  };

  // Helper para resolver placeholders
  const resolveMessage = (templateText: string, contact: ContactItem): string => {
    // 1. Nome limpo
    let rawName = contact.name || '';
    if (
      !rawName ||
      rawName.toLowerCase() === 'cliente' ||
      rawName.toLowerCase() === 'cliente online' ||
      rawName.toLowerCase() === 'cliente vip'
    ) {
      rawName = 'maravilhosa';
    } else {
      // Primeiro nome com inicial maiúscula
      const first = rawName.trim().split(' ')[0];
      rawName = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    }

    // 2. Tamanho
    const sizes = Array.isArray(contact.sizes_bought) ? contact.sizes_bought.filter(Boolean) : [];
    const sizeText = sizes.length > 0 ? sizes.join('/') : 'seu tamanho';

    // 3. Peça
    const pieceText = contact.last_product || 'conjunto fitness';

    return templateText
      .replace(/{nome}/gi, rawName)
      .replace(/{tamanho}/gi, sizeText)
      .replace(/{peça}/gi, pieceText)
      .replace(/{peca}/gi, pieceText);
  };

  // Disparo direto WhatsApp
  const handleOpenWhatsApp = (contact: ContactItem) => {
    const rawDigits = contact.phone_digits || String(contact.phone || '').replace(/\D/g, '');
    if (!rawDigits) {
      alert(`O contato "${contact.name}" não possui número de telefone/WhatsApp cadastrado.`);
      return;
    }
    const cleanDigits = rawDigits.length === 10 ? `1${rawDigits}` : rawDigits;
    const finalMsg = resolveMessage(customMessage, contact);
    saveContacted(contact.id);
    const url = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(finalMsg)}`;
    window.open(url, '_blank');
  };

  // Copiar mensagem personalizada
  const handleCopyMessage = (contact: ContactItem) => {
    const finalMsg = resolveMessage(customMessage, contact);
    navigator.clipboard.writeText(finalMsg);
    setCopiedId(contact.id);
    saveContacted(contact.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Inserir tag de variável no editor
  const handleInsertTag = (tag: string) => {
    setCustomMessage((prev) => `${prev} ${tag}`);
  };

  // Identificação do tipo de contato e cálculo de inatividade
  const getContactClassification = (contact: ContactItem) => {
    const isLead = (contact.orders_count || 0) === 0 || contact.sources?.includes('CARRINHO_ABANDONADO');
    const isVip = (contact.orders_count || 0) >= 2;
    const isCustomer = (contact.orders_count || 0) === 1;

    let daysSinceLastOrder = -1;
    if (contact.last_order_date) {
      const orderTime = new Date(contact.last_order_date).getTime();
      if (!isNaN(orderTime)) {
        daysSinceLastOrder = Math.floor((Date.now() - orderTime) / (1000 * 60 * 60 * 24));
      }
    }

    const isInactive30d = (contact.orders_count || 0) >= 1 && daysSinceLastOrder >= 30;

    return {
      isLead,
      isVip,
      isCustomer,
      daysSinceLastOrder,
      isInactive30d,
    };
  };

  // KPIs
  const kpis = useMemo(() => {
    let total = contacts.length;
    let leads = 0;
    let customers = 0;
    let vips = 0;
    let inactive30d = 0;

    for (const c of contacts) {
      const { isLead, isCustomer, isVip, isInactive30d } = getContactClassification(c);
      if (isLead) leads++;
      if (isCustomer) customers++;
      if (isVip) vips++;
      if (isInactive30d) inactive30d++;
    }

    return { total, leads, customers, vips, inactive30d };
  }, [contacts]);

  // Lista filtrada
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const { isLead, isCustomer, isVip, isInactive30d } = getContactClassification(c);

      // Segment Filter
      if (activeSegment === 'LEADS' && !isLead) return false;
      if (activeSegment === 'CLIENTS' && !isCustomer) return false;
      if (activeSegment === 'VIP' && !isVip) return false;
      if (activeSegment === 'INACTIVE_30D' && !isInactive30d) return false;

      // Size Filter
      if (sizeFilter !== 'ALL') {
        const sizes = (c.sizes_bought || []).map((s) => s.toUpperCase());
        if (!sizes.includes(sizeFilter.toUpperCase())) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = String(c.name || '').toLowerCase().includes(q);
        const matchesPhone = String(c.phone || '').toLowerCase().includes(q);
        const matchesEmail = String(c.email || '').toLowerCase().includes(q);
        const matchesProduct = String(c.last_product || '').toLowerCase().includes(q);
        const matchesCity = String(c.city || '').toLowerCase().includes(q);
        const matchesNotes = String(c.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesProduct && !matchesCity && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [contacts, activeSegment, sizeFilter, searchQuery]);

  // Salvar novo lead manual
  const handleSaveNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name && !newLead.phone) {
      alert('Preencha pelo menos o Nome ou WhatsApp do lead.');
      return;
    }
    setSavingLead(true);
    try {
      const res = await fetch('/api/backoffice/marketing-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_contact',
          name: newLead.name,
          phone: newLead.phone,
          email: newLead.email,
          city: newLead.city,
          state: newLead.state,
          sizes: newLead.size ? [newLead.size] : [],
          last_product: newLead.lastProduct,
          source: newLead.source,
          notes: newLead.notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.contacts)) {
          setContacts(data.contacts);
        }
        setShowAddLeadModal(false);
        setNewLead({
          name: '',
          phone: '',
          email: '',
          size: 'M',
          lastProduct: '',
          city: '',
          state: 'MA',
          source: 'CARRINHO_LEAD',
          notes: '',
        });
      } else {
        alert('Erro ao salvar contato. Verifique os dados.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar lead.');
    } finally {
      setSavingLead(false);
    }
  };

  // Salvar anotação rápida
  const handleSaveNote = async () => {
    if (!editingNoteContact) return;
    setSavingNote(true);
    try {
      const res = await fetch('/api/backoffice/marketing-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_contact',
          id: editingNoteContact.id,
          notes: tempNote,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.contacts)) {
          setContacts(data.contacts);
        }
        setEditingNoteContact(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  // Exportar vCard para Lista de Transmissão no Celular
  const handleExportVCard = () => {
    const list = filteredContacts.filter((c) => Boolean(c.phone_digits || c.phone));
    if (list.length === 0) {
      alert('Nenhum contato com WhatsApp nesta lista filtrada.');
      return;
    }
    const vcards = list.map((c) => {
      const rawDigits = String(c.phone_digits || c.phone || '').replace(/\D/g, '');
      const fullNum = rawDigits.length === 10 ? `+1${rawDigits}` : `+${rawDigits}`;
      const sizeTag = Array.isArray(c.sizes_bought) && c.sizes_bought.length > 0 ? ` [${c.sizes_bought.join('/')}]` : '';
      const tagType = c.orders_count >= 2 ? 'VIP' : c.orders_count === 1 ? 'CLIENTE' : 'LEAD';
      const displayName = `ANA FIT (${tagType}) - ${c.name}${sizeTag}`;
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${displayName}`,
        `N:${c.name};ANA FIT;;;`,
        `TEL;TYPE=CELL:${fullNum}`,
      ];
      if (c.email) lines.push(`EMAIL:${c.email}`);
      if (c.last_product || c.notes) {
        lines.push(`NOTE:Peça: ${c.last_product || 'N/A'} | Notas: ${c.notes || ''}`);
      }
      lines.push('END:VCARD');
      return lines.join('\r\n');
    });

    const blob = new Blob([vcards.join('\r\n\r\n')], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contatos_whatsapp_anafit_${activeSegment.toLowerCase()}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================
          1. CABEÇALHO & VISÃO GERAL
         ======================================================== */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <Target className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Central de Recuperação no WhatsApp
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <span>Recuperação de Leads & Clientes</span>
              <span className="text-emerald-400 text-lg lg:text-xl font-mono">1-Clique</span>
            </h1>
            <p className="text-sm text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Recupere carrinhos abandonados, reative clientes sumidas (+30 dias) e envie novidades no tamanho exato de cada cliente diretamente pelo WhatsApp oficial <span className="font-bold text-white">(978) 798-7934</span>!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={fetchContacts}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur transition border border-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>

            <button
              type="button"
              onClick={handleExportVCard}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur transition border border-white/10"
              title="Baixar lista em formato vCard para adicionar direto aos contatos do celular"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar vCard Celular</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddLeadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Novo Lead Manual</span>
            </button>
          </div>
        </div>

        {/* Métricas / KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          <div
            onClick={() => setActiveSegment('ALL')}
            className={`p-3.5 rounded-xl cursor-pointer transition border ${
              activeSegment === 'ALL'
                ? 'bg-white/20 border-white/40 ring-2 ring-white/30'
                : 'bg-black/20 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Total na Base</span>
              <Users className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{kpis.total}</div>
            <div className="text-[10px] text-slate-300/80 mt-0.5">Todos os contatos</div>
          </div>

          <div
            onClick={() => setActiveSegment('LEADS')}
            className={`p-3.5 rounded-xl cursor-pointer transition border ${
              activeSegment === 'LEADS'
                ? 'bg-amber-500/30 border-amber-400/50 ring-2 ring-amber-400/30'
                : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            <div className="text-[11px] font-bold text-amber-300 flex items-center justify-between">
              <span>Possíveis Clientes</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{kpis.leads}</div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">Carrinhos / Sem compra</div>
          </div>

          <div
            onClick={() => setActiveSegment('CLIENTS')}
            className={`p-3.5 rounded-xl cursor-pointer transition border ${
              activeSegment === 'CLIENTS'
                ? 'bg-sky-500/30 border-sky-400/50 ring-2 ring-sky-400/30'
                : 'bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20'
            }`}
          >
            <div className="text-[11px] font-bold text-sky-300 flex items-center justify-between">
              <span>Já Compraram</span>
              <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-300 mt-1 font-mono">{kpis.customers}</div>
            <div className="text-[10px] text-sky-200/80 mt-0.5">1 compra realizada</div>
          </div>

          <div
            onClick={() => setActiveSegment('VIP')}
            className={`p-3.5 rounded-xl cursor-pointer transition border ${
              activeSegment === 'VIP'
                ? 'bg-purple-500/30 border-purple-400/50 ring-2 ring-purple-400/30'
                : 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20'
            }`}
          >
            <div className="text-[11px] font-bold text-purple-300 flex items-center justify-between">
              <span>Clientes VIP</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300 mt-1 font-mono">{kpis.vips}</div>
            <div className="text-[10px] text-purple-200/80 mt-0.5">2+ compras efetuadas</div>
          </div>

          <div
            onClick={() => setActiveSegment('INACTIVE_30D')}
            className={`p-3.5 rounded-xl cursor-pointer transition border ${
              activeSegment === 'INACTIVE_30D'
                ? 'bg-rose-500/30 border-rose-400/50 ring-2 ring-rose-400/30'
                : 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20'
            }`}
          >
            <div className="text-[11px] font-bold text-rose-300 flex items-center justify-between">
              <span>Sumidas (+30 dias)</span>
              <Clock className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-300 mt-1 font-mono">{kpis.inactive30d}</div>
            <div className="text-[10px] text-rose-200/80 mt-0.5">Prontas para reativação</div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. PAINEL DE MODELOS DE MENSAGEM (TEMPLATES WHATSAPP)
         ======================================================== */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Mensagem Pré-Pronta para Envio em 1-Clique</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Escolha um modelo abaixo ou personalize o texto. O sistema substitui automaticamente <span className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{'{nome}'}</span>, <span className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{'{tamanho}'}</span> e <span className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{'{peça}'}</span> ao clicar para enviar.
            </p>
          </div>

          {/* Variáveis Dinâmicas */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-medium">Inserir:</span>
            <button
              type="button"
              onClick={() => handleInsertTag('{nome}')}
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 font-mono text-gray-700 border border-gray-200 transition"
            >
              + {'{nome}'}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag('{tamanho}')}
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 font-mono text-gray-700 border border-gray-200 transition"
            >
              + {'{tamanho}'}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag('{peça}')}
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 font-mono text-gray-700 border border-gray-200 transition"
            >
              + {'{peça}'}
            </button>
            <button
              type="button"
              onClick={() => {
                const found = MESSAGE_TEMPLATES.find((t) => t.id === selectedTemplateId);
                if (found) setCustomMessage(found.text);
              }}
              className="text-xs px-2 py-1 rounded text-gray-500 hover:text-gray-800 transition"
              title="Restaurar texto padrão do modelo"
            >
              Restaurar
            </button>
          </div>
        </div>

        {/* Seletores de Templates Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-3">
          {MESSAGE_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl)}
                className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-lg">{tmpl.icon}</span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      tmpl.badge === 'LEADS'
                        ? 'bg-amber-100 text-amber-800'
                        : tmpl.badge === 'REATIVAÇÃO'
                        ? 'bg-rose-100 text-rose-800'
                        : tmpl.badge === 'PAGAMENTO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {tmpl.badge}
                  </span>
                </div>
                <div>
                  <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                    {tmpl.title}
                  </div>
                  <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{tmpl.shortDesc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Textarea de Pré-Visualização / Edição */}
        <div className="relative">
          <textarea
            rows={3}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full text-xs font-sans text-gray-800 bg-gray-50/70 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none transition"
            placeholder="Digite ou edite o texto da mensagem pré-pronta..."
          />
          <div className="absolute right-3 bottom-3 text-[10px] text-gray-400">
            {customMessage.length} caracteres
          </div>
        </div>
      </div>

      {/* ========================================================
          3. BARRA DE FILTROS & BUSCA
         ======================================================== */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-3">
        {/* Linha 1: Segmentos */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSegment('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSegment === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-white/20">{kpis.total}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSegment('LEADS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSegment === 'LEADS'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Possíveis Clientes (Leads)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-mono font-black">
                {kpis.leads}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSegment('CLIENTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSegment === 'CLIENTS'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Já Compraram (1x)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-mono font-black">
                {kpis.customers}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSegment('VIP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSegment === 'VIP'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clientes VIP (2x+)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-mono font-black">
                {kpis.vips}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSegment('INACTIVE_30D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSegment === 'INACTIVE_30D'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Sumidas (+30 dias)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-mono font-black">
                {kpis.inactive30d}
              </span>
            </button>
          </div>

          {/* Filtro por Tamanho */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-400 font-medium">Tamanho:</span>
            {['ALL', 'P', 'M', 'G', 'GG', 'UN'].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSizeFilter(sz)}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  sizeFilter === sz
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sz === 'ALL' ? 'Todos' : sz}
              </button>
            ))}
          </div>
        </div>

        {/* Linha 2: Busca */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, WhatsApp, e-mail, peça de interesse, cidade ou notas..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          4. LISTA DE CONTATOS / CARDS DE RECUPERAÇÃO
         ======================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50/80 border-b border-gray-200/80 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-700 flex items-center gap-2">
            <span>Resultados:</span>
            <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
              {filteredContacts.length} contatos
            </span>
            {activeSegment !== 'ALL' && (
              <span className="text-gray-400 font-normal">
                (filtrado por {activeSegment})
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500">
            Clique em <span className="font-semibold text-emerald-700">"ENVIAR NO WHATSAPP"</span> para abrir o chat já preenchido.
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-semibold">Carregando contatos e sincronizando carrinhos...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Target className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-700">Nenhum contato encontrado neste filtro.</p>
            <p className="text-xs text-gray-400 mt-1">Tente trocar de segmento ou limpar a busca.</p>
            <button
              type="button"
              onClick={() => {
                setActiveSegment('ALL');
                setSizeFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredContacts.map((contact) => {
              const { isLead, isCustomer, isVip, isInactive30d, daysSinceLastOrder } = getContactClassification(contact);
              const previewMessage = resolveMessage(customMessage, contact);
              const isContactedToday = Boolean(contactedMap[contact.id]);
              const contactedTime = contactedMap[contact.id];
              const sizes = Array.isArray(contact.sizes_bought) ? contact.sizes_bought.filter(Boolean) : [];

              return (
                <div
                  key={contact.id}
                  className={`p-4 lg:p-5 hover:bg-emerald-50/20 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isContactedToday ? 'bg-emerald-50/10' : ''
                  }`}
                >
                  {/* Bloco 1: Informações do Contato & Tags */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900 tracking-tight">
                        {contact.name || 'Cliente Sem Nome'}
                      </span>

                      {/* Tag Principal: Lead / Cliente / VIP / Sumida */}
                      {isLead && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30">
                          <Flame className="w-3 h-3 text-amber-600" />
                          <span>POSSÍVEL CLIENTE (LEAD)</span>
                        </span>
                      )}

                      {isCustomer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                          <ShoppingBag className="w-3 h-3 text-sky-600" />
                          <span>1 COMPRA FEITA</span>
                        </span>
                      )}

                      {isVip && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>VIP ({contact.orders_count} PEDIDOS • ${Number(contact.total_spent || 0).toFixed(0)})</span>
                        </span>
                      )}

                      {isInactive30d && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                          <Clock className="w-3 h-3 text-rose-600" />
                          <span>SUMIDA HÁ {daysSinceLastOrder} DIAS</span>
                        </span>
                      )}

                      {/* Origem */}
                      {contact.sources && contact.sources.length > 0 && (
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                          {contact.sources.join(' / ')}
                        </span>
                      )}
                    </div>

                    {/* Dados de Contato e Tamanho */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                      {contact.phone ? (
                        <span className="flex items-center gap-1 font-mono font-semibold text-emerald-800">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{contact.phone}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Sem WhatsApp cadastrado</span>
                      )}

                      {contact.email && (
                        <span className="text-gray-500 truncate max-w-xs">{contact.email}</span>
                      )}

                      {contact.city && (
                        <span className="text-gray-500">
                          📍 {contact.city}{contact.state ? `, ${contact.state}` : ''}
                        </span>
                      )}

                      {sizes.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Tamanho:</span>
                          {sizes.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-800 font-mono font-bold text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Peça de Interesse / Último Produto & Anotações */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {contact.last_product && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px]">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <span className="font-semibold text-gray-900">Peça:</span> {contact.last_product}
                        </span>
                      )}

                      {contact.notes && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                          <span>📝 {contact.notes}</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteContact(contact);
                          setTempNote(contact.notes || '');
                        }}
                        className="text-[11px] text-gray-400 hover:text-emerald-700 flex items-center gap-0.5 hover:underline"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{contact.notes ? 'Editar nota' : '+ Anotação'}</span>
                      </button>
                    </div>

                    {/* Prévia da Mensagem Personalizada que será enviada */}
                    <div className="bg-gray-50/80 rounded-lg p-2.5 border border-gray-200/60 text-xs text-gray-700 font-sans leading-relaxed">
                      <span className="font-bold text-emerald-800 text-[11px] block mb-0.5">
                        💬 Mensagem pronta para {contact.name.split(' ')[0]}:
                      </span>
                      <p className="line-clamp-2 italic text-gray-600">"{previewMessage}"</p>
                    </div>
                  </div>

                  {/* Bloco 2: Ações de Envio WhatsApp */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2 shrink-0">
                    {/* Botão Principal: 📲 Enviar no WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(contact)}
                      disabled={!contact.phone_digits && !contact.phone}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>ENVIAR NO WHATSAPP</span>
                    </button>

                    <div className="flex items-center gap-1.5 w-full justify-between lg:justify-end">
                      {/* Botão Copiar */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(contact)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
                        title="Copiar mensagem personalizada com o nome e tamanho dela"
                      >
                        {copiedId === contact.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-gray-500" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      {/* Status se já foi contatada hoje */}
                      {isContactedToday ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Enviado às {contactedTime}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => saveContacted(contact.id)}
                          className="text-[11px] text-gray-400 hover:text-emerald-700 hover:underline px-1"
                          title="Marcar como contatada manualmente"
                        >
                          Marcar enviada
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: NOVO LEAD MANUAL
         ======================================================== */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowAddLeadModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cadastrar Novo Lead Manual</h3>
                <p className="text-xs text-gray-500">Adicione uma interessada do WhatsApp, Instagram ou visita à loja</p>
              </div>
            </div>

            <form onSubmit={handleSaveNewLead} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome da Cliente / Lead *</label>
                <input
                  type="text"
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Ex: Larissa Mendes"
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="Ex: (978) 798-7934"
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tamanho Preferido</label>
                  <select
                    value={newLead.size}
                    onChange={(e) => setNewLead({ ...newLead, size: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="P">P (Small)</option>
                    <option value="M">M (Medium)</option>
                    <option value="G">G (Large)</option>
                    <option value="GG">GG (X-Large)</option>
                    <option value="UN">Tamanho Único</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Peça de Interesse</label>
                  <input
                    type="text"
                    value={newLead.lastProduct}
                    onChange={(e) => setNewLead({ ...newLead, lastProduct: e.target.value })}
                    placeholder="Ex: Conjunto Jacquard Marinho"
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Origem do Contato</label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="CARRINHO_LEAD">🛒 Carrinho no Site</option>
                    <option value="INSTAGRAM_DIRECT">📸 Instagram Direct</option>
                    <option value="WHATSAPP_MANUAL">💬 WhatsApp Oficial</option>
                    <option value="LOJA_FISICA">🏬 Loja / Showroom Balcão</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Anotações / Observações</label>
                <textarea
                  rows={2}
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Ex: Gostou do tecido zero transparência; chamar no dia do pagamento..."
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLead}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {savingLead ? 'Salvando...' : 'Salvar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDITAR ANOTAÇÃO RÁPIDA
         ======================================================== */}
      {editingNoteContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 relative">
            <button
              type="button"
              onClick={() => setEditingNoteContact(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 mb-1">
              Anotação para {editingNoteContact.name}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Salve preferências, avisos ou data para contato futuro.
            </p>

            <textarea
              rows={3}
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              placeholder="Digite a anotação..."
            />

            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setEditingNoteContact(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={savingNote}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50"
              >
                {savingNote ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
