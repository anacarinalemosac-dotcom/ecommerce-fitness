'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderTree,
  Sparkles,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
  catalogProducts?: any[];
}

export function CategoryManagementModal({
  isOpen,
  onClose,
  onCategoriesChanged,
  catalogProducts = [],
}: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backoffice/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsCreating(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/backoffice/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao cadastrar categoria.');
      }

      setFeedback({
        type: 'success',
        message: data.message || `✓ Categoria "${newCatName.trim()}" cadastrada com sucesso!`,
      });
      setNewCatName('');
      await fetchCategories();
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao cadastrar categoria.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    const prodCount = catalogProducts.filter(
      (p: any) =>
        p.category_id === cat.id ||
        (p.categories?.name || p.category || '').toLowerCase() === cat.name.toLowerCase()
    ).length;

    const confirmMsg = prodCount > 0
      ? `Atenção: A categoria "${cat.name}" possui ${prodCount} produto(s) associado(s).\nDeseja realmente excluí-la?`
      : `Deseja realmente excluir a categoria "${cat.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(cat.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/backoffice/categories?id=${cat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao excluir categoria.');
      }

      setFeedback({
        type: 'success',
        message: `✓ Categoria "${cat.name}" excluída com sucesso.`,
      });
      await fetchCategories();
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao excluir categoria.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-2 border-deep-black w-full max-w-2xl max-h-[90vh] flex flex-col shadow-luxury overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-deep-black text-white p-5 flex items-center justify-between border-b-2 border-gold">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center border border-gold">
              <FolderTree className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>GERENCIAR CATEGORIAS DO CATÁLOGO</span>
                <Sparkles className="w-3.5 h-3.5 text-gold" />
              </h2>
              <p className="text-[10px] text-white/70 uppercase">
                Cadastre novas categorias e organize a vitrine da loja
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-sm transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 text-xs font-black uppercase flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-deep-black text-gold border-b-2 border-gold'
                : 'bg-red-50 text-red-700 border-b-2 border-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-[9px] underline hover:opacity-80"
            >
              FECHAR
            </button>
          </div>
        )}

        {/* Corpo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Formulário para Cadastrar Nova Categoria */}
          <form onSubmit={handleCreate} className="p-4 bg-warm-light/20 border-2 border-deep-black space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gold" />
              <label className="text-xs font-black uppercase tracking-wider text-deep-black">
                Cadastrar Nova Categoria
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                placeholder="Ex: SAIAS, BIKINIS, ACESSÓRIOS, CASACOS..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 p-2.5 border-2 border-deep-black font-bold text-xs uppercase bg-white focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={isCreating || !newCatName.trim()}
                className="px-5 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition border border-gold flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>SALVANDO...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-gold" />
                    <span>+ CADASTRAR CATEGORIA</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[9.5px] text-deep-black/60 uppercase">
              A categoria será gravada diretamente no banco Supabase e ficará disponível para todos os produtos.
            </p>
          </form>

          {/* Lista de Categorias Cadastradas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-deep-black/70">
                CATEGORIAS ATIVAS NO BANCO ({categories.length})
              </span>
              <button
                type="button"
                onClick={fetchCategories}
                disabled={isLoading}
                className="text-[9px] font-black uppercase text-gold hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>ATUALIZAR LISTA</span>
              </button>
            </div>

            {isLoading && categories.length === 0 ? (
              <div className="py-8 text-center text-xs font-black uppercase text-deep-black/50">
                Carregando categorias...
              </div>
            ) : categories.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-deep-black/50 uppercase border border-dashed border-deep-black/20">
                Nenhuma categoria encontrada. Cadastre uma categoria acima!
              </div>
            ) : (
              <div className="divide-y divide-deep-black/10 border-2 border-deep-black bg-white">
                {categories.map((cat) => {
                  const prodCount = catalogProducts.filter(
                    (p: any) =>
                      p.category_id === cat.id ||
                      (p.categories?.name || p.category || '').toLowerCase() === cat.name.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                            {cat.name}
                          </span>
                          <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-deep-black/5 text-deep-black/70 border border-deep-black/10">
                            slug: {cat.slug}
                          </span>
                        </div>
                        <span className="text-[10px] text-deep-black/60 uppercase font-medium block">
                          {prodCount} {prodCount === 1 ? 'produto cadastrado' : 'produtos cadastrados'} nesta categoria
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={deletingId === cat.id}
                        onClick={() => handleDelete(cat)}
                        className="p-2 text-deep-black/40 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition disabled:opacity-30"
                        title={`Excluir categoria "${cat.name}"`}
                      >
                        {deletingId === cat.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 bg-gray-50 border-t-2 border-deep-black flex items-center justify-between">
          <span className="text-[10px] text-deep-black/60 uppercase">
            Total: {categories.length} categorias cadastradas
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition"
          >
            CONCLUÍDO
          </button>
        </div>
      </div>
    </div>
  );
}
