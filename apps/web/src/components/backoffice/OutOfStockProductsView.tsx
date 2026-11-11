'use client';

import React, { useState } from 'react';
import { Package, RefreshCw, Edit3, EyeOff, ArrowUpRight, CheckCircle2, Search } from 'lucide-react';

interface OutOfStockProductsViewProps {
  products: any[];
  onRefresh: () => void;
  onEditProduct: (item: any) => void;
  onRestockProduct?: (productId: string, newStock: number) => Promise<void>;
}

export function OutOfStockProductsView({
  products,
  onRefresh,
  onEditProduct,
}: OutOfStockProductsViewProps) {
  const [search, setSearch] = useState('');
  const [restockValues, setRestockValues] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [restockedBanner, setRestockedBanner] = useState<string | null>(null);

  const outOfStockList = (products || []).filter((p: any) => {
    if (!p || p.slug?.startsWith('__') || p.title?.startsWith('__')) return false;
    const vars = Array.isArray(p.variants) ? p.variants : [];
    const totalStock =
      vars.length > 0
        ? vars.reduce((s: number, v: any) => s + (Number(v.stock_quantity ?? v.stock ?? 0) || 0), 0)
        : Number(p.total_stock ?? p.stock ?? 0);
    if (totalStock > 0) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchTitle = String(p.title || '').toLowerCase().includes(q);
      const matchSku =
        String(p.sku || '').toLowerCase().includes(q) ||
        vars.some((v: any) => String(v.sku || '').toLowerCase().includes(q));
      if (!matchTitle && !matchSku) return false;
    }
    return true;
  });

  const handleQuickRestock = async (item: any) => {
    const qty = parseInt(restockValues[item.id] || '1', 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Informe uma quantidade maior que 0 para colocar de volta no site.');
      return;
    }
    setSavingId(item.id);
    try {
      const res = await fetch('/api/backoffice/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          stock_quantity: qty,
          visible_online: true,
          is_draft: false,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao repor estoque');
      }
      setRestockedBanner(`✓ "${item.title}" atualizado para ${qty} unid. e publicado novamente no site!`);
      setTimeout(() => setRestockedBanner(null), 4000);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Cabeçalho da Aba Produto Esgotado */}
      <div className="bg-red-50 border-2 border-red-600 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest">
              FORA DO SITE • ESTOQUE ZERADO
            </span>
            <h2 className="text-base sm:text-xl font-black text-red-950 uppercase tracking-wider">
              🚫 PRODUTO ESGOTADO ({outOfStockList.length})
            </h2>
          </div>
          <p className="text-xs text-red-900 font-medium">
            Toda peça que zera o estoque sai automaticamente da loja virtual para suas clientes e vem para esta aba. Se receber reposição, basta informar a quantidade para publicar de volta.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="px-4 py-2.5 bg-white hover:bg-deep-black hover:text-gold text-deep-black border-2 border-deep-black text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>ATUALIZAR LISTA</span>
        </button>
      </div>

      {restockedBanner && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-black uppercase flex items-center gap-2 border-2 border-emerald-800 shadow">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{restockedBanner}</span>
        </div>
      )}

      {/* Busca rápida dentro dos esgotados */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto esgotado por nome ou SKU..."
          className="w-full pl-9 pr-4 py-2.5 border-2 border-deep-black/30 focus:border-deep-black focus:outline-none text-xs font-bold uppercase bg-white"
        />
        <Search className="w-4 h-4 text-deep-black/50 absolute left-3 top-3" />
      </div>

      {outOfStockList.length === 0 ? (
        <div className="bg-white border-2 border-deep-black/20 p-10 text-center space-y-2">
          <Package className="w-8 h-8 text-emerald-600 mx-auto" />
          <div className="text-sm font-black uppercase text-deep-black">
            Nenhum produto esgotado no momento!
          </div>
          <p className="text-xs text-deep-black/60">
            Todas as peças cadastradas possuem saldo em estoque.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outOfStockList.map((item: any) => {
            const vars = Array.isArray(item.variants) ? item.variants : [];
            const firstImg =
              item.meta?.primary_image ||
              item.primary_image ||
              item.primaryImage ||
              vars[0]?.images?.[0] ||
              vars[0]?.image ||
              '';
            const skuLabel =
              vars.map((v: any) => `${v.sku || 'SKU'} (${v.size || '-'})`).join(' • ') ||
              item.sku ||
              '-';
            const basePrice = Number(item.meta?.price ?? item.price ?? vars[0]?.price ?? 0);

            return (
              <div
                key={item.id || item.slug}
                className="bg-white border-2 border-deep-black p-4 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  {firstImg ? (
                    <img
                      src={firstImg}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded border border-deep-black/20 shrink-0 grayscale-[20%]"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-neutral-100 border border-dashed border-deep-black/20 flex items-center justify-center text-[9px] font-bold text-deep-black/40 shrink-0">
                      SEM FOTO
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase">
                        ESGOTADO (0 UNID.)
                      </span>
                      <span className="px-1.5 py-0.5 bg-neutral-200 text-deep-black text-[9px] font-bold uppercase inline-flex items-center gap-1">
                        <EyeOff className="w-2.5 h-2.5" />
                        FORA DO SITE
                      </span>
                    </div>
                    <h3 className="font-black text-xs sm:text-sm text-deep-black uppercase leading-tight">
                      {item.title}
                    </h3>
                    <div className="text-[10px] font-mono text-amber-900 bg-amber-50 border border-amber-300 px-1.5 py-0.5 truncate" title={skuLabel}>
                      {skuLabel}
                    </div>
                    <div className="text-xs font-mono font-black text-deep-black">
                      Preço: ${basePrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Reposição Rápida de Estoque ou Editar Grade Completa */}
                <div className="pt-2 border-t border-deep-black/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qtd"
                      value={restockValues[item.id] ?? '1'}
                      onChange={(e) => setRestockValues((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      className="w-16 p-2 border-2 border-deep-black font-mono font-bold text-xs text-center bg-white"
                    />
                    <button
                      type="button"
                      disabled={savingId === item.id}
                      onClick={() => handleQuickRestock(item)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{savingId === item.id ? 'SALVANDO...' : 'REPOR E VOLTAR PRO SITE'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditProduct(item)}
                    className="w-full py-1.5 border border-deep-black hover:bg-deep-black hover:text-white text-deep-black font-black text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-gold" />
                    <span>EDITAR GRADE / TAMANHOS / CORES</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
