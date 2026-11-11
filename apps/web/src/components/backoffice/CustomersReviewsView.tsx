'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Star,
  Eye,
  EyeOff,
  PlusCircle,
  Search,
  Download,
  Trash2,
  MapPin,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  Megaphone,
  Send,
  UserPlus,
  Contact,
  Mail,
} from 'lucide-react';

interface CustomersReviewsViewProps {
  salesData: any;
}

export function CustomersReviewsView({ salesData }: CustomersReviewsViewProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'reviews'>('customers');
  const [customerSearch, setCustomerSearch] = useState('');
  const [contactChannelFilter, setContactChannelFilter] = useState<'ALL' | 'WITH_PHONE' | 'WITH_EMAIL'>('ALL');
  const [sizeFilter, setSizeFilter] = useState<string>('ALL');
  const [reviewSearch, setReviewSearch] = useState('');
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showEmailCampaignModal, setShowEmailCampaignModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhones, setCopiedPhones] = useState(false);
  const [copiedCustomerLink, setCopiedCustomerLink] = useState<string | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Lista persistente da nuvem (/api/backoffice/marketing-contacts) sincronizada com vendas, PDV, condicionais e WhatsApp
  const [cloudContacts, setCloudContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sentCampaignIds, setSentCampaignIds] = useState<Record<string, boolean>>({});
  const [campaignTemplate, setCampaignTemplate] = useState(
    'Oi {nome}! 💕 Aqui é a Ana da ANA Fitness Wear! Chegaram conjuntos novos lindos no site (inclusive no tamanho {tamanho}) com zero transparência! Dá uma olhadinha antes que esgote: https://anafitwear.com ✨'
  );

  // Modal de adição manual (clientes/chats no celular)
  const [newContactForm, setNewContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: 'MA',
    sizes: [] as string[],
    notes: '',
  });
  const [savingContact, setSavingContact] = useState(false);

  // Campanha de E-mail Marketing
  const [emailSubject, setEmailSubject] = useState('✨ Chegaram Conjuntos Novos Exclusivos! - ANA Fitness Wear');
  const [emailIntro, setEmailIntro] = useState(
    'Acabamos de receber novos conjuntos fitness com zero transparência e modelagem anatômica perfeita! Garanta o seu antes que acabe no site.'
  );
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [campaignFeedback, setCampaignFeedback] = useState<string | null>(null);

  const fetchMarketingContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch('/api/backoffice/marketing-contacts', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.contacts)) {
          setCloudContacts(data.contacts);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar lista de contatos:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchMarketingContacts();
  }, [salesData?.sales?.length]);

  // Fallback mesclado com vendas em memória caso API ainda esteja carregando
  const mergedContacts = (() => {
    if (cloudContacts.length > 0) return cloudContacts;

    const sales = salesData?.sales || [];
    const fallbackMap: Record<string, any> = {};
    sales.forEach((s: any) => {
      const cleanPhone = String(s.customer_phone || '').replace(/\D/g, '');
      const phoneDigits = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;
      const key =
        phoneDigits ||
        (s.customer_email && s.customer_email.includes('@') ? s.customer_email.toLowerCase().trim() : '') ||
        (s.customer_name || 'cliente').toLowerCase().trim();
      const gross = (Number(s.subtotal_products) || 0) + (Number(s.shipping_fee) || 0) - (Number(s.discount_amount) || 0);
      const firstItemTitle = (s.items && s.items[0]) ? (s.items[0].title || s.items[0].sku || '') : '';
      const sizes = Array.isArray(s.items) ? s.items.map((it: any) => String(it.size || '').toUpperCase()).filter(Boolean) : [];

      if (!fallbackMap[key]) {
        fallbackMap[key] = {
          id: key,
          name: s.customer_name || 'Cliente',
          email: s.customer_email || '',
          phone: s.customer_phone || '',
          phone_digits: phoneDigits,
          city: s.shipping_address?.city || '',
          state: s.shipping_address?.state || '',
          sizes_bought: Array.from(new Set(sizes)),
          orders_count: 1,
          total_spent: gross,
          sources: [s.channel === 'ONLINE' ? 'SITE' : 'BALCAO_PDV'],
          last_order_date: s.created_at || new Date().toISOString(),
          last_product: firstItemTitle,
          notes: '',
        };
      } else {
        fallbackMap[key].orders_count += 1;
        fallbackMap[key].total_spent += gross;
        fallbackMap[key].phone = fallbackMap[key].phone || s.customer_phone || '';
        fallbackMap[key].phone_digits = fallbackMap[key].phone_digits || phoneDigits;
        fallbackMap[key].email = fallbackMap[key].email || s.customer_email || '';
        fallbackMap[key].sizes_bought = Array.from(new Set([...(fallbackMap[key].sizes_bought || []), ...sizes]));
      }
    });
    return Object.values(fallbackMap);
  })();

  const totalContactsCount = mergedContacts.length;
  const withPhoneCount = mergedContacts.filter((c) => Boolean(c.phone_digits || c.phone)).length;
  const withEmailCount = mergedContacts.filter((c) => Boolean(c.email && c.email.includes('@'))).length;

  const customersList = mergedContacts.filter((c) => {
    if (contactChannelFilter === 'WITH_PHONE' && !(c.phone_digits || c.phone)) return false;
    if (contactChannelFilter === 'WITH_EMAIL' && !(c.email && c.email.includes('@'))) return false;
    if (sizeFilter !== 'ALL') {
      const sizes = Array.isArray(c.sizes_bought) ? c.sizes_bought.map((s: string) => s.toUpperCase()) : [];
      if (!sizes.includes(sizeFilter.toUpperCase())) return false;
    }
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      String(c.name || '').toLowerCase().includes(q) ||
      String(c.email || '').toLowerCase().includes(q) ||
      String(c.phone || '').toLowerCase().includes(q) ||
      String(c.city || '').toLowerCase().includes(q) ||
      String(c.notes || '').toLowerCase().includes(q) ||
      String(c.last_product || '').toLowerCase().includes(q)
    );
  });

  // Base de Avaliações sincronizada com Cloud
  const [reviews, setReviews] = useState<any[]>([]);

  const fetchCloudReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch('/api/reviews?all=true');
      if (res.ok) {
        const data = await res.json();
        if (data.reviews && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar avaliações da nuvem:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchCloudReviews();
  }, []);

  const [newReviewForm, setNewReviewForm] = useState({
    customerName: '',
    customerHandle: '',
    productTitle: 'Samanta Romper',
    rating: 5,
    comment: '',
    city: 'Leominster, MA',
    photoUrl: '',
  });

  const handleToggleReviewStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'APPROVED' ? 'HIDDEN' : 'APPROVED';
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
    );

    try {
      await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
    } catch (err) {
      console.error('Erro ao alternar status do review:', err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta avaliação definitivamente?')) return;
    setReviews((prev) => prev.filter((r) => r.id !== id));

    try {
      await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delete: true }),
      });
    } catch (err) {
      console.error('Erro ao excluir review:', err);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newReviewForm.customerName,
          customerHandle: newReviewForm.customerHandle,
          productTitle: newReviewForm.productTitle,
          rating: Number(newReviewForm.rating) || 5,
          comment: newReviewForm.comment,
          city: newReviewForm.city,
          photoUrl: newReviewForm.photoUrl,
        }),
      });

      if (res.ok) {
        setShowAddReviewModal(false);
        setNewReviewForm({
          customerName: '',
          customerHandle: '',
          productTitle: 'Samanta Romper',
          rating: 5,
          comment: '',
          city: 'Leominster, MA',
          photoUrl: '',
        });
        await fetchCloudReviews();
      } else {
        alert('Erro ao gravar avaliação.');
      }
    } catch (err) {
      console.error('Erro ao adicionar avaliação:', err);
    }
  };

  // Salvar contato manual do telefone / WhatsApp
  const handleSaveManualContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactForm.name.trim() && !newContactForm.phone.trim()) {
      alert('Informe pelo menos o nome ou o telefone da cliente.');
      return;
    }
    setSavingContact(true);
    try {
      const res = await fetch('/api/backoffice/marketing-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_contact',
          name: newContactForm.name.trim() || 'Cliente WhatsApp',
          phone: newContactForm.phone.trim(),
          email: newContactForm.email.trim(),
          city: newContactForm.city.trim(),
          state: newContactForm.state.trim(),
          sizes: newContactForm.sizes,
          notes: newContactForm.notes.trim(),
          source: 'WHATSAPP_MANUAL',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar contato');
      if (Array.isArray(data.contacts)) {
        setCloudContacts(data.contacts);
      }
      setShowAddContactModal(false);
      setNewContactForm({ name: '', phone: '', email: '', city: '', state: 'MA', sizes: [], notes: '' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Remover "${name}" da lista de contatos de marketing?`)) return;
    try {
      const res = await fetch(`/api/backoffice/marketing-contacts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.contacts)) {
        setCloudContacts(data.contacts);
      }
    } catch (_) {}
  };

  // Exportar clientes em CSV
  const handleExportCustomersCsv = () => {
    if (customersList.length === 0) {
      alert('Nenhum cliente para exportar no momento.');
      return;
    }
    const headers = ['Nome', 'WhatsApp / Telefone', 'Email', 'Tamanhos', 'Cidade', 'Estado', 'Total Pedidos', 'Total Gasto ($)', 'Origem', 'Ultima Compra', 'Notas'];
    const rows = [headers.join(',')];

    customersList.forEach((c) => {
      rows.push([
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.email}"`,
        `"${(c.sizes_bought || []).join(' ')}"`,
        `"${c.city}"`,
        `"${c.state}"`,
        c.orders_count || 0,
        Number(c.total_spent || 0).toFixed(2),
        `"${(c.sources || []).join(' / ')}"`,
        `"${c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('pt-BR') : ''}"`,
        `"${String(c.notes || '').replace(/"/g, '""')}"`,
      ].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contatos_marketing_ana_fitness_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar vCard (.vcf) para importar todos os contatos direto no iPhone/Android (Lista de Transmissão WhatsApp)
  const handleExportVCard = () => {
    const withPhones = customersList.filter((c) => Boolean(c.phone_digits || c.phone));
    if (withPhones.length === 0) {
      alert('Nenhum contato com número de telefone encontrado nesta seleção.');
      return;
    }

    const vcards = withPhones.map((c) => {
      const rawDigits = String(c.phone_digits || c.phone || '').replace(/\D/g, '');
      const fullNum = rawDigits.length === 10 ? `+1${rawDigits}` : `+${rawDigits}`;
      const sizeTag = Array.isArray(c.sizes_bought) && c.sizes_bought.length > 0 ? ` (${c.sizes_bought.join('/')})` : '';
      const displayName = `ANA FIT - ${c.name}${sizeTag}`;
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${displayName}`,
        `N:${c.name};ANA FIT;;;`,
        `TEL;TYPE=CELL:${fullNum}`,
      ];
      if (c.email) lines.push(`EMAIL:${c.email}`);
      if (c.last_product || c.notes) {
        lines.push(`NOTE:Cliente ANA Fitness Wear${c.last_product ? ` | Ultima peça: ${c.last_product}` : ''}${c.notes ? ` | ${c.notes}` : ''}`);
      }
      lines.push('END:VCARD');
      return lines.join('\r\n');
    });

    const blob = new Blob([vcards.join('\r\n')], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ANA_Fitness_Contatos_WhatsApp_${withPhones.length}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAllPhones = () => {
    const nums = customersList
      .map((c) => {
        const d = String(c.phone_digits || c.phone || '').replace(/\D/g, '');
        if (!d) return '';
        return d.length === 10 ? `+1${d}` : `+${d}`;
      })
      .filter(Boolean);

    if (nums.length === 0) {
      alert('Nenhum número de telefone disponível nesta seleção.');
      return;
    }
    navigator.clipboard.writeText(nums.join('\n'));
    setCopiedPhones(true);
    setTimeout(() => setCopiedPhones(false), 3000);
  };

  const getCleanPhone = (phoneStr: string) => {
    const clean = String(phoneStr || '').replace(/\D/g, '');
    return clean.length === 10 ? `1${clean}` : clean;
  };

  const handleSendWhatsAppMarketing = (c: any) => {
    const phone = getCleanPhone(c.phone_digits || c.phone || '');
    const firstName = String(c.name || 'linda').trim().split(' ')[0];
    const sizeText = Array.isArray(c.sizes_bought) && c.sizes_bought.length > 0 ? c.sizes_bought.join(' / ') : 'seu tamanho';
    const personalizedMsg = campaignTemplate
      .replace(/\{nome\}/gi, firstName)
      .replace(/\{tamanho\}/gi, sizeText);

    setSentCampaignIds((prev) => ({ ...prev, [c.id || c.name]: true }));

    if (!phone) {
      navigator.clipboard.writeText(personalizedMsg);
      alert(`Mensagem personalizada copiada para ${c.name}!\n(Este contato ainda está sem WhatsApp cadastrado.)`);
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(personalizedMsg)}`, '_blank');
  };

  const handleSendWhatsAppReviewRequest = (c: any) => {
    const phone = getCleanPhone(c.phone_digits || c.phone || '');
    const prodParam = c.last_product ? `?produto=${encodeURIComponent(c.last_product)}` : '';
    const nameParam = c.name ? `${prodParam ? '&' : '?'}nome=${encodeURIComponent(c.name)}` : '';
    const emailParam = c.email ? `${prodParam || nameParam ? '&' : '?'}email=${encodeURIComponent(c.email)}` : '';
    const reviewUrl = `https://anafitwear.com/avaliar${prodParam}${nameParam}${emailParam}`;

    const message = `Olá ${c.name}! 🥰 Adoramos ter você como cliente da Ana Fitness Wear. 💖 Você já recebeu seus looks? Gostaríamos muito de saber o que achou das peças! Leva só 1 minutinho para avaliar no nosso site e você ainda ganha 10% OFF enviado direto para o seu e-mail:\n\n${reviewUrl}`;

    if (!phone) {
      navigator.clipboard.writeText(reviewUrl);
      alert(`Link de avaliação copiado para a cliente ${c.name}!\n\n${reviewUrl}`);
      return;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendEmailCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetIds = customersList.filter((c) => c.email && c.email.includes('@')).map((c) => c.id);
    if (targetIds.length === 0) {
      alert('Nenhum contato com e-mail válido selecionado.');
      return;
    }
    if (!confirm(`Enviar e-mail de lançamento para ${targetIds.length} cliente(s)?`)) return;

    setSendingCampaign(true);
    setCampaignFeedback(null);
    try {
      const res = await fetch('/api/backoffice/marketing-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_email_campaign',
          subject: emailSubject,
          message: emailIntro,
          contactIds: targetIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no disparo');
      setCampaignFeedback(`✓ ${data.message}`);
      setTimeout(() => setShowEmailCampaignModal(false), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingCampaign(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white border-2 border-deep-black p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              CRM INTEGRADO • LISTA AUTOMÁTICA DE CLIENTES & MARKETING
            </span>
            <h2 className="text-lg font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              <span>CONTATOS VIP, MARKETING DE NOVIDADES & REVIEWS</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddContactModal(true)}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Salvar Contato (Tel / Chat)</span>
            </button>
            <button
              type="button"
              onClick={handleExportVCard}
              className="px-3.5 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-gold border border-gold text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Baixa um arquivo .VCF que importa todas as clientes direto para a agenda do seu celular para Lista de Transmissão no WhatsApp"
            >
              <Contact className="w-3.5 h-3.5" />
              <span>Agenda Celular (.VCF)</span>
            </button>
            <button
              type="button"
              onClick={handleExportCustomersCsv}
              className="px-3.5 py-2.5 bg-white hover:bg-gold hover:text-deep-black text-deep-black border-2 border-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Exportar (.CSV)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddReviewModal(true)}
              className="px-3.5 py-2.5 bg-white hover:bg-deep-black hover:text-white text-deep-black border-2 border-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-gold" />
              <span>+ Review</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-deep-black/70 uppercase tracking-wide">
          Todo telefone adicionado em vendas no Site, PDV, Recibos do WhatsApp ou manualmente fica salvo aqui para quando chegarem conjuntos novos você enviar novidades em 1 clique.
        </p>

        {/* Central Rápida de Campanha: Quando Chegarem Conjuntos Novos */}
        <div className="bg-emerald-50/70 border-2 border-emerald-600 p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                📢 MENSAGEM PRONTA PARA QUANDO CHEGAREM CONJUNTOS NOVOS
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyAllPhones}
                className="px-3 py-1.5 bg-white hover:bg-deep-black hover:text-white text-deep-black border border-deep-black text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
              >
                {copiedPhones ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gold" />}
                <span>{copiedPhones ? 'Telefones Copiados!' : `Copiar ${withPhoneCount} Telefones`}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowEmailCampaignModal(true)}
                className="px-3 py-1.5 bg-deep-black hover:bg-gold hover:text-deep-black text-gold text-[10px] font-black uppercase flex items-center gap-1 border border-gold cursor-pointer"
              >
                <Mail className="w-3 h-3" />
                <span>Disparar E-mail Marketing ({withEmailCount})</span>
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-emerald-950/80 block">
              Edite o texto abaixo (use <code className="bg-white px-1">{'{nome}'}</code> e <code className="bg-white px-1">{'{tamanho}'}</code>) e clique em <strong>Mandar Novidade</strong> em cada cliente:
            </label>
            <textarea
              rows={2}
              value={campaignTemplate}
              onChange={(e) => setCampaignTemplate(e.target.value)}
              className="w-full p-2.5 border border-emerald-400 bg-white text-xs text-deep-black focus:outline-none focus:border-deep-black"
            />
          </div>
        </div>

        {/* Banner de Solicitação de Avaliações / Link Oficial */}
        <div className="bg-gradient-to-r from-gold/15 via-gold/5 to-white border border-gold p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                ⭐ Link Oficial de Avaliações (Dá 10% OFF OBRIGADA10)
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 border border-deep-black/30 text-deep-black select-all">
                https://anafitwear.com/avaliar
              </code>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText('https://anafitwear.com/avaliar');
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className="flex-1 md:flex-none px-3.5 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[11px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gold" />}
              <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
            <a
              href="/avaliar"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-white hover:bg-deep-black hover:text-white text-deep-black border border-deep-black text-[11px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir</span>
            </a>
          </div>
        </div>
      </div>

      {/* Navegação entre Lista de Contatos e Avaliações */}
      <div className="flex border-b border-deep-black/20 gap-3 text-xs font-black uppercase tracking-wider overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`pb-2.5 px-4 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'customers'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Users className="w-4 h-4 text-gold" />
          <span>Lista de Contatos & Marketing ({totalContactsCount})</span>
          {loadingContacts && <RefreshCw className="w-3 h-3 animate-spin text-gold" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`pb-2.5 px-4 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'reviews'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Star className="w-4 h-4 text-gold" />
          <span>Moderação de Avaliações ({reviews.length})</span>
          {loadingReviews && <RefreshCw className="w-3 h-3 animate-spin text-gold ml-1" />}
        </button>
      </div>

      {/* ABA 1: LISTA DE CONTATOS & MARKETING */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Barra de Busca e Filtros de Canal + Tamanho Comprado */}
          <div className="bg-white border-2 border-deep-black/20 p-3 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center gap-2 flex-1 border border-deep-black/25 px-3 py-2 bg-neutral-50">
                <Search className="w-4 h-4 text-deep-black/50 shrink-0" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Buscar por nome, WhatsApp, e-mail, cidade ou peça comprada..."
                  className="w-full text-xs font-bold uppercase focus:outline-none bg-transparent"
                />
              </div>

              <button
                type="button"
                onClick={fetchMarketingContacts}
                className="px-3.5 py-2 border-2 border-deep-black hover:bg-deep-black hover:text-gold text-deep-black text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingContacts ? 'animate-spin' : ''}`} />
                <span>Sincronizar</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setContactChannelFilter('ALL')}
                  className={`px-2.5 py-1 border cursor-pointer ${
                    contactChannelFilter === 'ALL' ? 'bg-deep-black text-gold border-deep-black' : 'bg-white text-deep-black border-deep-black/25'
                  }`}
                >
                  TODOS ({totalContactsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setContactChannelFilter('WITH_PHONE')}
                  className={`px-2.5 py-1 border cursor-pointer ${
                    contactChannelFilter === 'WITH_PHONE' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}
                >
                  📱 COM WHATSAPP ({withPhoneCount})
                </button>
                <button
                  type="button"
                  onClick={() => setContactChannelFilter('WITH_EMAIL')}
                  className={`px-2.5 py-1 border cursor-pointer ${
                    contactChannelFilter === 'WITH_EMAIL' ? 'bg-blue-700 text-white border-blue-800' : 'bg-blue-50 text-blue-900 border-blue-300'
                  }`}
                >
                  ✉️ COM E-MAIL ({withEmailCount})
                </button>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-deep-black/60 mr-1">FILTRAR POR TAMANHO:</span>
                {['ALL', 'P', 'M', 'G', 'GG', 'UN'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSizeFilter(sz)}
                    className={`px-2 py-1 border cursor-pointer ${
                      sizeFilter === sz ? 'bg-gold text-deep-black border-deep-black' : 'bg-white text-deep-black/70 border-deep-black/20'
                    }`}
                  >
                    {sz === 'ALL' ? 'TODOS' : sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* VISÃO MOBILE EM CARDS (CELULAR) */}
          <div className="block md:hidden space-y-3">
            {customersList.length === 0 ? (
              <div className="bg-white border-2 border-deep-black/20 p-6 text-center text-xs font-bold text-deep-black/60">
                Nenhum contato encontrado neste filtro. Clique em "+ Salvar Contato (Tel / Chat)" para adicionar agora.
              </div>
            ) : (
              customersList.map((c, idx) => (
                <div key={c.id || idx} className="bg-white border-2 border-deep-black p-4 space-y-2.5 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className="font-black text-sm text-deep-black uppercase block">{c.name}</strong>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {(c.sizes_bought || []).map((sz: string) => (
                          <span key={sz} className="px-1.5 py-0.5 bg-deep-black text-gold text-[9px] font-mono font-black">
                            TAM {sz}
                          </span>
                        ))}
                        {(c.sources || []).map((src: string) => (
                          <span key={src} className="px-1.5 py-0.5 bg-neutral-100 border border-deep-black/15 text-[8.5px] font-bold">
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-black text-sm text-gold block">${Number(c.total_spent || 0).toFixed(2)}</span>
                      <span className="text-[9px] text-deep-black/60">{c.orders_count || 0} compras</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono space-y-0.5 text-deep-black/80">
                    {c.phone && <div>📱 {c.phone}</div>}
                    {c.email && <div className="lowercase">✉️ {c.email}</div>}
                    {(c.city || c.state) && <div>📍 {[c.city, c.state].filter(Boolean).join(', ')}</div>}
                    {c.notes && <div className="text-[10px] font-sans italic text-deep-black/70">📝 {c.notes}</div>}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppMarketing(c)}
                      className={`flex-1 py-2 px-3 text-white text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                        sentCampaignIds[c.id || c.name] ? 'bg-emerald-800' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sentCampaignIds[c.id || c.name] ? '✓ Novidade Enviada' : 'Mandar Novidade WhatsApp'}</span>
                    </button>
                    {c.id && !String(c.id).startsWith('cliente') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(c.id, c.name)}
                        className="p-2 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white"
                        title="Remover contato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* VISÃO DESKTOP EM TABELA (COMPUTADOR) */}
          <div className="hidden md:block bg-white border-2 border-deep-black overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black text-white text-[10px] font-black">
                <tr>
                  <th className="p-4">CLIENTE / TAMANHO</th>
                  <th className="p-4">TELEFONE / E-MAIL</th>
                  <th className="p-4">ORIGEM / CIDADE</th>
                  <th className="p-4">COMPRAS</th>
                  <th className="p-4">TOTAL GASTO</th>
                  <th className="p-4">ÚLTIMA DATA</th>
                  <th className="p-4 text-right">AÇÕES DE MARKETING</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {customersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-deep-black/50 font-bold">
                      Nenhum contato localizado. Adicione pelo botão "+ Salvar Contato (Tel / Chat)" ou registre vendas com telefone.
                    </td>
                  </tr>
                ) : (
                  customersList.map((c, i) => {
                    const isSent = Boolean(sentCampaignIds[c.id || c.name]);
                    return (
                      <tr key={c.id || i} className="hover:bg-deep-black/5">
                        <td className="p-4">
                          <strong className="font-black text-deep-black block">{c.name}</strong>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {(c.sizes_bought || []).map((sz: string) => (
                              <span key={sz} className="px-1.5 py-0.5 bg-deep-black text-gold text-[9px] font-mono font-black">
                                TAM {sz}
                              </span>
                            ))}
                          </div>
                          {c.last_product && (
                            <span className="text-[10px] text-deep-black/60 font-mono block mt-1 truncate max-w-[220px]" title={c.last_product}>
                              Último: {c.last_product}
                            </span>
                          )}
                          {c.notes && (
                            <span className="text-[10px] text-amber-900 font-sans italic block mt-0.5">
                              📝 {c.notes}
                            </span>
                          )}
                        </td>
                        <td className="p-4 space-y-1 font-mono text-[10px]">
                          {c.phone ? (
                            <span className="text-emerald-900 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 font-bold inline-flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {c.phone}
                            </span>
                          ) : (
                            <span className="text-deep-black/35 block">Sem WhatsApp</span>
                          )}
                          {c.email && (
                            <span className="text-deep-black/70 lowercase block">
                              ✉️ {c.email}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-[10px]">
                          <div className="flex flex-wrap gap-1 mb-1">
                            {(c.sources || []).map((src: string) => (
                              <span key={src} className="px-1.5 py-0.5 bg-neutral-100 border border-deep-black/20 font-black">
                                {src}
                              </span>
                            ))}
                          </div>
                          {(c.city || c.state) && (
                            <span className="text-deep-black/60 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gold" />
                              {[c.city, c.state].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-deep-black">
                          {c.orders_count || 0}x
                        </td>
                        <td className="p-4 font-mono font-black text-gold text-sm">
                          ${Number(c.total_spent || 0).toFixed(2)}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-deep-black/60">
                          {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppMarketing(c)}
                              className={`px-2.5 py-1.5 text-white text-[9px] font-black uppercase flex items-center gap-1 transition shadow-2xs cursor-pointer ${
                                isSent ? 'bg-emerald-800' : 'bg-green-600 hover:bg-green-700'
                              }`}
                              title="Abrir WhatsApp da cliente com a mensagem de conjuntos novos personalizada"
                            >
                              <Send className="w-3 h-3" />
                              <span>{isSent ? '✓ Enviado' : 'Mandar Novidade'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppReviewRequest(c)}
                              className="px-2 py-1.5 bg-gold/20 hover:bg-gold text-deep-black border border-gold text-[9px] font-black uppercase flex items-center gap-1 transition cursor-pointer"
                              title="Pedir avaliação pelo WhatsApp (10% OFF)"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Review</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const prodParam = c.last_product ? `?produto=${encodeURIComponent(c.last_product)}` : '';
                                const nameParam = c.name ? `${prodParam ? '&' : '?'}nome=${encodeURIComponent(c.name)}` : '';
                                const emailParam = c.email ? `${prodParam || nameParam ? '&' : '?'}email=${encodeURIComponent(c.email)}` : '';
                                const link = `https://anafitwear.com/avaliar${prodParam}${nameParam}${emailParam}`;
                                navigator.clipboard.writeText(link);
                                setCopiedCustomerLink(c.name);
                                setTimeout(() => setCopiedCustomerLink(null), 2500);
                              }}
                              className="px-2 py-1.5 bg-white hover:bg-deep-black hover:text-white text-deep-black border border-deep-black/30 text-[9px] font-black uppercase transition cursor-pointer"
                              title="Copiar link de avaliação"
                            >
                              {copiedCustomerLink === c.name ? '✓' : 'Link'}
                            </button>

                            {c.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteContact(c.id, c.name)}
                                className="p-1.5 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition cursor-pointer"
                                title="Remover da lista"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
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

      {/* ABA 2: MODERAÇÃO DE AVALIAÇÕES (REVIEWS) */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white border border-deep-black/20 p-3">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-4 h-4 text-deep-black/50" />
              <input
                type="text"
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                placeholder="Filtrar por nome de cliente, peça ou cidade..."
                className="w-full text-xs font-bold uppercase focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={fetchCloudReviews}
              className="px-3 py-1.5 border border-deep-black/20 hover:border-gold text-deep-black text-[10px] font-black uppercase flex items-center gap-1 transition"
              title="Atualizar lista da nuvem"
            >
              <RefreshCw className={`w-3 h-3 ${loadingReviews ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews
              .filter((r) => {
                if (!reviewSearch) return true;
                const q = reviewSearch.toLowerCase();
                return (
                  (r.customerName || '').toLowerCase().includes(q) ||
                  (r.productTitle || '').toLowerCase().includes(q) ||
                  (r.city || '').toLowerCase().includes(q) ||
                  (r.comment || '').toLowerCase().includes(q)
                );
              })
              .map((rev) => (
                <div
                  key={rev.id}
                  className={`bg-white border-2 p-5 space-y-4 shadow-sm transition ${
                    rev.status === 'APPROVED' ? 'border-deep-black' : 'border-gray-300 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {rev.photoUrl ? (
                        <img
                          src={rev.photoUrl}
                          alt={rev.customerName}
                          className="w-10 h-10 rounded-full object-cover border border-deep-black"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center font-black text-gold border border-gold">
                          {(rev.customerName || 'C').charAt(0)}
                        </div>
                      )}
                      <div>
                        <strong className="text-xs font-black uppercase text-deep-black block">
                          {rev.customerName}
                        </strong>
                        <span className="text-[10px] text-deep-black/60 font-mono block">
                          {rev.customerHandle || '@cliente'} • {rev.city}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                        rev.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {rev.status === 'APPROVED' ? 'NO AR' : 'OCULTA'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-gold">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                      ))}
                    </div>
                    <span className="text-[10px] text-gold font-black uppercase block">
                      {rev.productTitle}
                    </span>
                  </div>

                  <p className="text-xs text-deep-black/80 italic leading-relaxed">
                    &quot;{rev.comment}&quot;
                  </p>

                  <div className="pt-3 border-t border-deep-black/10 flex items-center justify-between text-xs">
                    <span className="text-[9px] text-deep-black/50 font-mono">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('pt-BR') : rev.date || 'Recente'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleReviewStatus(rev.id, rev.status)}
                        className="px-2.5 py-1 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[9px] font-black uppercase transition flex items-center gap-1"
                        title={rev.status === 'APPROVED' ? 'Ocultar da loja' : 'Aprovar e exibir'}
                      >
                        {rev.status === 'APPROVED' ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Ocultar</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 text-gold" />
                            <span>Aprovar</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1 border border-deep-black/20 hover:border-red-600 hover:text-red-600 transition"
                        title="Excluir Avaliação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR CONTATO MANUALMENTE (CELULAR / WHATSAPP / CHAT) */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-2 border-deep-black w-full max-w-md p-6 space-y-5 shadow-luxury">
            <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
                  WHATSAPP / INSTAGRAM / TELEFONE
                </span>
                <h3 className="text-base font-black uppercase tracking-wider text-deep-black">
                  SALVAR CONTATO NA LISTA VIP
                </h3>
              </div>
              <button type="button" onClick={() => setShowAddContactModal(false)} className="p-1 hover:text-gold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualContact} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-deep-black block mb-1">Nome da Cliente *</label>
                <input
                  type="text"
                  required
                  value={newContactForm.name}
                  onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                  placeholder="Ex: Maria Clara"
                  className="w-full p-2.5 border-2 border-deep-black font-bold uppercase focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-deep-black block mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="tel"
                    required
                    value={newContactForm.phone}
                    onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })}
                    placeholder="(978) 555-1234"
                    className="w-full p-2.5 border-2 border-deep-black font-mono font-bold focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-deep-black block mb-1">E-mail (Opcional)</label>
                  <input
                    type="email"
                    value={newContactForm.email}
                    onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full p-2.5 border-2 border-deep-black font-mono focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-deep-black block mb-1">Tamanho(s) que ela veste:</label>
                <div className="flex flex-wrap gap-1.5">
                  {['P', 'M', 'G', 'GG', 'UN'].map((sz) => {
                    const active = newContactForm.sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setNewContactForm((prev) => ({
                            ...prev,
                            sizes: active ? prev.sizes.filter((s) => s !== sz) : [...prev.sizes, sz],
                          }));
                        }}
                        className={`px-3 py-1.5 border font-black uppercase cursor-pointer ${
                          active ? 'bg-deep-black text-gold border-deep-black' : 'bg-white text-deep-black border-deep-black/30'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-deep-black block mb-1">Observação / Preferência (Opcional)</label>
                <input
                  type="text"
                  value={newContactForm.notes}
                  onChange={(e) => setNewContactForm({ ...newContactForm, notes: e.target.value })}
                  placeholder="Ex: Gosta de conjuntos bordô / macacão"
                  className="w-full p-2.5 border-2 border-deep-black focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2.5 border border-deep-black/30 font-black uppercase text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs cursor-pointer disabled:opacity-50"
                >
                  {savingContact ? 'Salvando...' : 'Salvar Contato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DISPARO DE E-MAIL MARKETING DE NOVIDADES */}
      {showEmailCampaignModal && (
        <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-2 border-gold w-full max-w-lg p-6 space-y-4 shadow-luxury">
            <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  E-MAIL MARKETING • NOVOS CONJUNTOS
                </span>
                <h3 className="text-base font-black uppercase tracking-wider text-deep-black">
                  ENVIAR NOVIDADES PARA {customersList.filter((c) => c.email && c.email.includes('@')).length} E-MAILS
                </h3>
              </div>
              <button type="button" onClick={() => setShowEmailCampaignModal(false)} className="p-1 hover:text-gold">
                <X className="w-5 h-5" />
              </button>
            </div>

            {campaignFeedback && (
              <div className="p-3 bg-emerald-600 text-white text-xs font-black uppercase">
                {campaignFeedback}
              </div>
            )}

            <form onSubmit={handleSendEmailCampaign} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-deep-black block mb-1">Assunto do E-mail *</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2.5 border-2 border-deep-black font-bold focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-deep-black block mb-1">Mensagem de Lançamento *</label>
                <textarea
                  rows={4}
                  required
                  value={emailIntro}
                  onChange={(e) => setEmailIntro(e.target.value)}
                  className="w-full p-2.5 border-2 border-deep-black leading-relaxed focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailCampaignModal(false)}
                  className="px-4 py-2.5 border border-deep-black/30 font-black uppercase text-xs"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={sendingCampaign}
                  className="px-6 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-gold border border-gold font-black uppercase text-xs cursor-pointer disabled:opacity-50"
                >
                  {sendingCampaign ? 'Disparando...' : 'DISPARAR AGORA →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR NOVA AVALIAÇÃO / PROVA SOCIAL */}
      {showAddReviewModal && (
        <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-2 border-deep-black w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-luxury">
            <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  PROVA SOCIAL OFICIAL
                </span>
                <h3 className="text-lg font-black uppercase tracking-wider text-deep-black">
                  CADASTRAR AVALIAÇÃO DE CLIENTE
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddReviewModal(false)}
                className="p-1 hover:text-gold transition text-deep-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    NOME DA CLIENTE *
                  </label>
                  <input
                    type="text"
                    required
                    value={newReviewForm.customerName}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, customerName: e.target.value })}
                    placeholder="Ex: Vanessa Guimarães"
                    className="w-full px-3 py-2 border border-deep-black/30 font-bold uppercase focus:outline-none focus:border-deep-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    INSTAGRAM / HANDLE
                  </label>
                  <input
                    type="text"
                    value={newReviewForm.customerHandle}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, customerHandle: e.target.value })}
                    placeholder="@vanessa_fit"
                    className="w-full px-3 py-2 border border-deep-black/30 font-mono focus:outline-none focus:border-deep-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    PEÇA COMPRADA *
                  </label>
                  <input
                    type="text"
                    required
                    value={newReviewForm.productTitle}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, productTitle: e.target.value })}
                    placeholder="Ex: Samanta Romper"
                    className="w-full px-3 py-2 border border-deep-black/30 font-black uppercase focus:outline-none focus:border-deep-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    AVALIAÇÃO EM ESTRELAS *
                  </label>
                  <select
                    value={newReviewForm.rating}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-deep-black/30 font-bold focus:outline-none focus:border-deep-black"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Estrelas - Excelente)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Estrelas - Muito Bom)</option>
                    <option value={3}>⭐⭐⭐ (3 Estrelas - Bom)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  CIDADE / ESTADO
                </label>
                <input
                  type="text"
                  value={newReviewForm.city}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, city: e.target.value })}
                  placeholder="Ex: Boston, MA"
                  className="w-full px-3 py-2 border border-deep-black/30 font-bold uppercase focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  URL DA FOTO DA CLIENTE (OPCIONAL)
                </label>
                <input
                  type="url"
                  value={newReviewForm.photoUrl}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, photoUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-deep-black/30 font-mono focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  DEPOIMENTO DA CLIENTE *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newReviewForm.comment}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, comment: e.target.value })}
                  placeholder="Escreva o feedback enviado pela cliente..."
                  className="w-full px-3 py-2 border border-deep-black/30 leading-relaxed focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(false)}
                  className="px-4 py-2.5 border border-deep-black/30 text-deep-black font-black uppercase text-xs"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gold hover:bg-gold/90 text-deep-black font-black uppercase tracking-widest text-xs shadow"
                >
                  SALVAR AVALIAÇÃO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
