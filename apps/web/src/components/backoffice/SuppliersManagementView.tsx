'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  User,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  Layers,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

export interface Supplier {
  id: string;
  company_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  created_at?: string;
}

interface SuppliersManagementViewProps {
  products?: any[];
  onShowFeedback?: (msg: string) => void;
}

export function SuppliersManagementView({
  products = [],
  onShowFeedback,
}: SuppliersManagementViewProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de Adicionar / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Busca fornecedores na API
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/backoffice/suppliers');
      const data = await res.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (err: any) {
      console.error('Erro ao carregar fornecedores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Contagem de produtos por fornecedor
  const productCountBySupplier = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!products || !Array.isArray(products)) return counts;

    products.forEach((p) => {
      const supId = p.supplier_id || p.suppliers?.id;
      if (supId) {
        counts[supId] = (counts[supId] || 0) + 1;
      } else {
        const supName = (p.suppliers?.company_name || '').toLowerCase();
        if (supName) {
          counts[supName] = (counts[supName] || 0) + 1;
        }
      }
    });
    return counts;
  }, [products]);

  // Filtro de Busca
  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.company_name.toLowerCase().includes(q) ||
        (s.contact_name && s.contact_name.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [suppliers, searchQuery]);

  // Abertura do Modal para Novo
  const handleOpenNew = () => {
    setEditingSupplier(null);
    setFormData({
      company_name: '',
      contact_name: '',
      phone: '',
      email: '',
    });
    setShowModal(true);
  };

  // Abertura do Modal para Edição
  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      company_name: sup.company_name || '',
      contact_name: sup.contact_name || '',
      phone: sup.phone || '',
      email: sup.email || '',
    });
    setShowModal(true);
  };

  // Salvar (Criar ou Atualizar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      alert('O nome da confecção ou empresa é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      const isEditing = !!editingSupplier;
      const res = await fetch('/api/backoffice/suppliers', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSupplier?.id,
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.success || data.supplier) {
        await fetchSuppliers();
        setShowModal(false);
        const msg = isEditing
          ? `Fornecedor "${formData.company_name}" atualizado com sucesso!`
          : `Novo fornecedor "${formData.company_name}" cadastrado com sucesso!`;
        setFeedbackBanner(msg);
        if (onShowFeedback) onShowFeedback(msg);
        setTimeout(() => setFeedbackBanner(null), 5000);
      } else {
        alert(data.error || 'Erro ao salvar fornecedor.');
      }
    } catch (err: any) {
      alert('Erro na requisição: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Excluir Fornecedor
  const handleDelete = async (sup: Supplier) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o fornecedor "${sup.company_name}"?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/backoffice/suppliers?id=${sup.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchSuppliers();
        const msg = `Fornecedor "${sup.company_name}" removido com sucesso.`;
        setFeedbackBanner(msg);
        if (onShowFeedback) onShowFeedback(msg);
        setTimeout(() => setFeedbackBanner(null), 4000);
      } else {
        alert(data.error || 'Erro ao excluir fornecedor.');
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  // Formata telefone para link do WhatsApp
  const cleanPhoneForWa = (phoneStr?: string) => {
    if (!phoneStr) return '';
    return phoneStr.replace(/\D/g, '');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header com Visual Luxuoso */}
      <div className="bg-gradient-to-r from-deep-black via-zinc-950 to-deep-black text-white p-6 sm:p-8 border-2 border-gold shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-white/10 text-[9px] font-black uppercase tracking-widest text-gold border border-gold/40">
            <Building2 className="w-3.5 h-3.5 text-gold" />
            <span>CONFECÇÕES & ATELIÊS PARCEIROS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <span>FORNECEDORES DA ANA FITNESS WEAR</span>
          </h2>
          <p className="text-xs text-white/70 uppercase tracking-wider max-w-2xl leading-relaxed">
            Cadastre os contatos das confecções, fábricas parceiras e ateliês de costura. Vincule suas peças a cada confecção para rastrear custos e recompras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-5 py-3 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4 text-deep-black" />
            <span>+ CADASTRAR FORNECEDOR</span>
          </button>

          <button
            type="button"
            onClick={fetchSuppliers}
            className="p-3 bg-white/10 hover:bg-white hover:text-deep-black text-white transition border border-white/20"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Banner de Feedback */}
      {feedbackBanner && (
        <div className="p-3.5 bg-emerald-950 text-emerald-200 border-2 border-emerald-500 text-xs font-black uppercase tracking-wider flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackBanner}</span>
          </div>
          <button onClick={() => setFeedbackBanner(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-deep-black p-5 space-y-1 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
            TOTAL DE FORNECEDORES
          </span>
          <div className="text-2xl sm:text-3xl font-black text-deep-black font-mono">
            {suppliers.length}
          </div>
          <p className="text-[10px] text-deep-black/60 uppercase">
            Confecções e ateliês ativos cadastrados
          </p>
        </div>

        <div className="bg-white border-2 border-deep-black p-5 space-y-1 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
            COM WHATSAPP / CONTATO DIRETO
          </span>
          <div className="text-2xl sm:text-3xl font-black text-green-700 font-mono">
            {suppliers.filter((s) => !!s.phone).length}
          </div>
          <p className="text-[10px] text-deep-black/60 uppercase">
            Disponíveis para contato rápido em 1 clique
          </p>
        </div>

        <div className="bg-white border-2 border-deep-black p-5 space-y-1 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60">
            CATÁLOGO VINCULADO
          </span>
          <div className="text-2xl sm:text-3xl font-black text-gold font-mono">
            {products.length} PEÇAS
          </div>
          <p className="text-[10px] text-deep-black/60 uppercase">
            Peças no catálogo da loja
          </p>
        </div>
      </div>

      {/* 3. Barra de Busca e Filtro */}
      <div className="bg-white border-2 border-deep-black p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-deep-black/40 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome da confecção, responsável ou telefone..."
            className="w-full pl-9 pr-3 py-2 text-xs font-bold uppercase border border-deep-black/20 focus:outline-none focus:border-deep-black bg-white"
          />
        </div>

        <span className="text-[11px] font-black uppercase tracking-wider text-deep-black/60">
          Exibindo {filteredSuppliers.length} de {suppliers.length} fornecedores
        </span>
      </div>

      {/* 4. Tabela de Fornecedores */}
      <div className="bg-white border-2 border-deep-black overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs uppercase tracking-wider">
            <thead className="bg-deep-black text-white text-[10px] font-black">
              <tr>
                <th className="p-3.5">EMPRESA / CONFECÇÃO</th>
                <th className="p-3.5">CONTATO / RESPONSÁVEL</th>
                <th className="p-3.5">WHATSAPP / TELEFONE</th>
                <th className="p-3.5">E-MAIL</th>
                <th className="p-3.5 text-center">PEÇAS VINCULADAS</th>
                <th className="p-3.5 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deep-black/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-deep-black/50 font-bold uppercase animate-pulse">
                    Carregando fornecedores...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-deep-black/50 font-bold uppercase space-y-2">
                    <Building2 className="w-8 h-8 mx-auto text-gold mb-1" />
                    <p>Nenhum fornecedor encontrado.</p>
                    <button
                      type="button"
                      onClick={handleOpenNew}
                      className="px-4 py-2 bg-deep-black text-gold hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-wider transition"
                    >
                      + Cadastrar Primeiro Fornecedor
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => {
                  const piecesCount =
                    productCountBySupplier[sup.id] ||
                    productCountBySupplier[sup.company_name.toLowerCase()] ||
                    0;
                  const waNumber = cleanPhoneForWa(sup.phone);

                  return (
                    <tr key={sup.id} className="hover:bg-deep-black/5 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gold shrink-0" />
                          <div>
                            <span className="font-black text-deep-black block text-xs">
                              {sup.company_name}
                            </span>
                            <span className="text-[9px] text-deep-black/50 font-mono block">
                              ID: {sup.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-deep-black">
                        {sup.contact_name ? (
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-deep-black/50" />
                            <span>{sup.contact_name}</span>
                          </span>
                        ) : (
                          <span className="text-deep-black/40 font-normal italic">Não informado</span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono font-bold">
                        {sup.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-deep-black">{sup.phone}</span>
                            {waNumber && (
                              <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 rounded transition"
                                title="Abrir conversa no WhatsApp"
                              >
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-deep-black/40 font-sans font-normal italic">Não informado</span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-[11px]">
                        {sup.email ? (
                          <a
                            href={`mailto:${sup.email}`}
                            className="text-deep-black hover:text-gold underline flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3 text-deep-black/50" />
                            <span>{sup.email}</span>
                          </a>
                        ) : (
                          <span className="text-deep-black/40 font-sans font-normal italic">Não informado</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black border ${
                            piecesCount > 0
                              ? 'bg-gold/15 text-deep-black border-gold'
                              : 'bg-gray-100 text-gray-500 border-gray-300'
                          }`}
                        >
                          {piecesCount} {piecesCount === 1 ? 'peça' : 'peças'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sup)}
                            className="p-1.5 border border-deep-black/20 hover:border-gold hover:text-gold text-deep-black transition"
                            title="Editar fornecedor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(sup)}
                            className="p-1.5 border border-deep-black/20 hover:border-red-600 hover:text-red-600 text-deep-black transition"
                            title="Excluir fornecedor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* =========================================================================
          MODAL: CADASTRAR OU EDITAR FORNECEDOR
         ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border-2 border-deep-black w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-luxury my-8">
            <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  CONTROLE DE CONFECÇÕES
                </span>
                <h3 className="text-lg font-black uppercase tracking-wider text-deep-black">
                  {editingSupplier ? 'EDITAR FORNECEDOR' : 'CADASTRAR NOVO FORNECEDOR'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:text-gold transition text-deep-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  NOME DA EMPRESA OU CONFECÇÃO *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Confecções FitPro Brasil, Ateliê Fitness Minas, Malharia Sul..."
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                  PESSOA DE CONTATO / RESPONSÁVEL
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mariana Ramos (Gerente de Produção)"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-deep-black/30 text-xs font-bold focus:outline-none focus:border-deep-black bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    TELEFONE / WHATSAPP
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: +55 11 98765-4321 ou (508) 555-1234"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-deep-black/30 text-xs font-mono font-bold focus:outline-none focus:border-deep-black bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                    E-MAIL DE CONTATO
                  </label>
                  <input
                    type="email"
                    placeholder="Ex: compras@confeccao.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-deep-black/30 text-xs font-mono focus:outline-none focus:border-deep-black bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-deep-black/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-deep-black text-deep-black hover:bg-deep-black/5 text-xs font-black uppercase tracking-wider transition"
                >
                  CANCELAR
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-deep-black text-gold hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>SALVANDO...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingSupplier ? 'ATUALIZAR FORNECEDOR' : 'CADASTRAR FORNECEDOR'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
