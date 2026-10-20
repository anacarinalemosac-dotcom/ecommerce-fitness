'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  PlusCircle,
  Search,
  Download,
  Trash2,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  ShoppingBag,
  Heart,
  MessageSquare,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';

interface CustomersReviewsViewProps {
  salesData: any;
}

export function CustomersReviewsView({ salesData }: CustomersReviewsViewProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'reviews'>('customers');
  const [customerSearch, setCustomerSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCustomerLink, setCopiedCustomerLink] = useState<string | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // 1. Extração da Base de Clientes a partir das vendas registradas
  const sales = salesData?.sales || [];
  const customerMap: Record<string, {
    name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    ordersCount: number;
    totalSpent: number;
    channel: string;
    lastOrderDate: string;
    lastProduct?: string;
  }> = {};

  sales.forEach((s: any) => {
    const key = (s.customer_email || s.customer_name || 'cliente').toLowerCase().trim();
    const gross = (Number(s.subtotal_products) || 0) + (Number(s.shipping_fee) || 0) - (Number(s.discount_amount) || 0);
    const firstItemTitle = (s.items && s.items[0]) ? (s.items[0].product_title || s.items[0].sku || '') : '';

    if (!customerMap[key]) {
      customerMap[key] = {
        name: s.customer_name || 'Cliente',
        email: s.customer_email || '',
        phone: s.customer_phone || '',
        city: s.shipping_address?.city || (s.channel === 'ONLINE' ? 'Online' : 'Leominster'),
        state: s.shipping_address?.state || (s.channel === 'ONLINE' ? 'EUA' : 'MA'),
        ordersCount: 1,
        totalSpent: gross,
        channel: s.channel === 'ONLINE' ? 'Loja Online' : 'Balcão Leominster',
        lastOrderDate: s.created_at || new Date().toISOString(),
        lastProduct: firstItemTitle,
      };
    } else {
      customerMap[key].ordersCount += 1;
      customerMap[key].totalSpent += gross;
      if (s.created_at && new Date(s.created_at) > new Date(customerMap[key].lastOrderDate)) {
        customerMap[key].lastOrderDate = s.created_at;
        if (firstItemTitle) customerMap[key].lastProduct = firstItemTitle;
      }
    }
  });

  const customersList = Object.values(customerMap).filter((c) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  });

  // 2. Base de Avaliações / Prova Social sincronizada com API Cloud (Supabase)
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

  // Exportar clientes em CSV
  const handleExportCustomersCsv = () => {
    if (customersList.length === 0) {
      alert('Nenhum cliente para exportar no momento.');
      return;
    }
    const headers = ['Nome', 'Email', 'Telefone', 'Cidade', 'Estado', 'Total Pedidos', 'Valor Total Gasto ($)', 'Canal', 'Ultima Compra'];
    const rows = [headers.join(',')];

    customersList.forEach((c) => {
      rows.push([
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.city}"`,
        `"${c.state}"`,
        c.ordersCount,
        c.totalSpent.toFixed(2),
        `"${c.channel}"`,
        `"${new Date(c.lastOrderDate).toLocaleDateString()}"`,
      ].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `base_clientes_ana_fitness_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCleanPhone = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    return clean.length === 10 ? `1${clean}` : clean;
  };

  const handleSendWhatsAppReviewRequest = (c: any) => {
    const phone = getCleanPhone(c.phone);
    const prodParam = c.lastProduct ? `?produto=${encodeURIComponent(c.lastProduct)}` : '';
    const nameParam = c.name ? `${prodParam ? '&' : '?'}nome=${encodeURIComponent(c.name)}` : '';
    const reviewUrl = `https://anafitwear.com/avaliar${prodParam}${nameParam}`;

    const message = `Olá ${c.name}! 🥰 Adoramos ter você como cliente da Ana Fitness Wear. 💖 Você já recebeu seus looks? Gostaríamos muito de saber o que achou das peças! Leva só 1 minutinho para avaliar no nosso site e você ainda ganha 10% OFF na sua próxima compra com cupom exclusivo:\n\n${reviewUrl}`;

    if (!phone) {
      navigator.clipboard.writeText(reviewUrl);
      alert(`Link de avaliação copiado para a cliente ${c.name}!\n\n${reviewUrl}`);
      return;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white border-2 border-deep-black p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              CRM INTEGRADO & GESTÃO DA COMUNIDADE
            </span>
            <h2 className="text-lg font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              <span>6. CLIENTES E PROVA SOCIAL (REVIEWS)</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCustomersCsv}
              className="px-3.5 py-2.5 bg-white hover:bg-gold hover:text-deep-black text-deep-black border-2 border-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Exportar Clientes (.CSV)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddReviewModal(true)}
              className="px-3.5 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow"
            >
              <PlusCircle className="w-3.5 h-3.5 text-gold" />
              <span>+ Cadastrar Avaliação</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-deep-black/70 uppercase tracking-wide">
          Consulte o histórico de consumo das suas clientes (LTV), dados de contato e modere os depoimentos exibidos na vitrine.
        </p>

        {/* Banner de Solicitação de Avaliações / Link Oficial */}
        <div className="bg-gradient-to-r from-gold/15 via-gold/5 to-white border-2 border-gold p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gold text-deep-black flex items-center justify-center font-black text-xs">
                ⭐
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                Link Oficial de Solicitação de Avaliações para Clientes
              </span>
            </div>
            <p className="text-xs text-deep-black/80 font-medium leading-relaxed">
              Envie este link para qualquer cliente pelo WhatsApp ou Instagram. A cliente avalia com 1 a 5 estrelas, escreve a opinião, anexa fotos e recebe na hora um <strong>cupom de 10% OFF (OBRIGADA10)</strong> para recomprar na loja!
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <code className="text-xs font-mono font-bold bg-white px-2.5 py-1 border border-deep-black/30 text-deep-black select-all">
                https://anafitwear.com/avaliar
              </code>
              <span className="text-[10px] text-deep-black/60 font-bold uppercase">
                (Também disponível em /review)
              </span>
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
              className="flex-1 md:flex-none px-4 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow"
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gold" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link Oficial'}</span>
            </button>
            <a
              href="/avaliar"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-white hover:bg-deep-black hover:text-white text-deep-black border-2 border-deep-black text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm"
              title="Abrir página pública de avaliação"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir</span>
            </a>
          </div>
        </div>
      </div>

      {/* Navegação entre Base de Clientes e Avaliações */}
      <div className="flex border-b border-deep-black/20 gap-3 text-xs font-black uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`pb-2.5 px-4 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'customers'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Users className="w-4 h-4 text-gold" />
          <span>Base de Clientes ({customersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`pb-2.5 px-4 flex items-center gap-2 transition border-b-2 ${
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

      {/* ABA 1: BASE DE CLIENTES (CRM) */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white border border-deep-black/20 p-3">
            <Search className="w-4 h-4 text-deep-black/50" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Buscar cliente por nome, e-mail ou telefone..."
              className="w-full text-xs font-bold uppercase focus:outline-none"
            />
          </div>

          <div className="bg-white border-2 border-deep-black overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black text-white text-[10px] font-black">
                <tr>
                  <th className="p-4">CLIENTE</th>
                  <th className="p-4">CONTATOS & AÇÃO</th>
                  <th className="p-4">CIDADE / ESTADO</th>
                  <th className="p-4">CANAL HABITUAL</th>
                  <th className="p-4">PEDIDOS</th>
                  <th className="p-4">LTV (TOTAL GASTO)</th>
                  <th className="p-4">TICKET MÉDIO</th>
                  <th className="p-4">ÚLTIMA COMPRA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {customersList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-deep-black/50 font-bold">
                      Nenhum cliente registrado ainda. Quando compras forem realizadas no site ou PDV, aparecerão aqui automaticamente.
                    </td>
                  </tr>
                ) : (
                  customersList.map((c, i) => {
                    const avg = c.ordersCount > 0 ? c.totalSpent / c.ordersCount : 0;
                    return (
                      <tr key={i} className="hover:bg-deep-black/5">
                        <td className="p-4">
                          <strong className="font-black text-deep-black block">{c.name}</strong>
                          {c.lastProduct && (
                            <span className="text-[10px] text-deep-black/60 font-mono block">
                              Último: {c.lastProduct}
                            </span>
                          )}
                        </td>
                        <td className="p-4 space-y-1.5">
                          {c.email && (
                            <span className="text-[10px] text-deep-black/70 lowercase font-mono block">
                              ✉️ {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="text-[10px] text-deep-black/70 font-mono block">
                              📞 {c.phone}
                            </span>
                          )}

                          {/* Botão Pedir Review pelo WhatsApp */}
                          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppReviewRequest(c)}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[9px] font-black uppercase flex items-center gap-1 transition shadow-2xs cursor-pointer"
                              title="Enviar convite amigável no WhatsApp da cliente com link para avaliar e receber 10% OFF"
                            >
                              <MessageCircle className="w-3 h-3 text-white fill-white" />
                              <span>Pedir Review (WhatsApp)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const prodParam = c.lastProduct ? `?produto=${encodeURIComponent(c.lastProduct)}` : '';
                                const nameParam = c.name ? `${prodParam ? '&' : '?'}nome=${encodeURIComponent(c.name)}` : '';
                                const link = `https://anafitwear.com/avaliar${prodParam}${nameParam}`;
                                navigator.clipboard.writeText(link);
                                setCopiedCustomerLink(c.name);
                                setTimeout(() => setCopiedCustomerLink(null), 2500);
                              }}
                              className="p-1 border border-deep-black/30 hover:border-deep-black bg-white text-deep-black text-[9px] font-black uppercase transition"
                              title="Copiar link direto personalizado para esta cliente"
                            >
                              {copiedCustomerLink === c.name ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-deep-black/70" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold text-deep-black">
                            📍 {c.city}, {c.state}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-deep-black/5 border border-deep-black/20 text-[9px] font-black">
                            {c.channel}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-deep-black">
                          {c.ordersCount} compras
                        </td>
                        <td className="p-4 font-mono font-black text-gold text-sm">
                          ${c.totalSpent.toFixed(2)}
                        </td>
                        <td className="p-4 font-mono font-bold text-deep-black">
                          ${avg.toFixed(2)}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-deep-black/60">
                          {new Date(c.lastOrderDate).toLocaleDateString()}
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
                    "{rev.comment}"
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
