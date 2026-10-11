'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ScanBarcode,
  Plus,
  Trash2,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle,
  UserCheck,
  DollarSign,
  ArrowLeft,
  Sparkles,
  Search,
  Package,
  Layers,
  Receipt,
  RotateCcw,
  ExternalLink,
  Lock,
  Store,
  PackageMinus,
} from 'lucide-react';
import { StockWriteOffModal } from '../../components/StockWriteOffModal';
import { useStoreSettings } from '../../context/StoreSettingsContext';

interface CartItem {
  sku: string;
  name: string;
  size: string;
  color: string;
  price: number;
  costPrice: number;
  quantity: number;
  stock: number;
  image?: string;
}

export default function PosTerminalPage() {
  const { products, refreshProducts, adminUser, loginAdmin } = useStoreSettings();
  const [posUnlocked, setPosUnlocked] = useState(false);
  const [posPinInput, setPosPinInput] = useState('');
  const [posPinError, setPosPinError] = useState('');

  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  
  const [seller, setSeller] = useState('Balcão Loja');
  const [customerName, setCustomerName] = useState('Cliente Balcão');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ZELLE' | 'VENMO' | 'CARD' | 'CASH'>('ZELLE');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);

  // Filtragem de catálogo para seleção rápida no PDV
  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.variants && p.variants.some((v: any) => v.sku?.toLowerCase().includes(q)))
    );
  });

  // Bipar código de barras ou SKU
  const handleAddBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim().toUpperCase();
    if (!query) return;

    // 1. Procura se bate com SKU exato de variante
    let matchedItem: CartItem | null = null;

    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        const foundVar = p.variants.find((v: any) => v.sku?.toUpperCase() === query || v.barcode === query);
        if (foundVar) {
          matchedItem = {
            sku: foundVar.sku || `${p.sku}-${foundVar.size}`,
            name: p.title,
            size: foundVar.size || 'M',
            color: foundVar.color || 'Preto Ônix',
            price: Number(foundVar.price) || p.price,
            costPrice: Number(foundVar.cost_price) || p.costPrice || 15.0,
            quantity: 1,
            stock: foundVar.stock_quantity ?? p.stock ?? 10,
            image: foundVar.images?.[0] || p.primaryImage,
          };
          break;
        }
      }

      // Procura no produto base
      if (p.sku?.toUpperCase() === query || p.barcode === query) {
        matchedItem = {
          sku: p.sku,
          name: p.title,
          size: p.sizes?.[0] || 'M',
          color: p.colors?.[0]?.name || 'Preto Ônix',
          price: p.price,
          costPrice: p.costPrice || 15.0,
          quantity: 1,
          stock: p.stock ?? 10,
          image: p.primaryImage,
        };
        break;
      }
    }

    if (matchedItem) {
      addItemToCart(matchedItem);
      setBarcodeInput('');
    } else {
      // Fallback: adicionar como item avulso com o SKU bipado
      addItemToCart({
        sku: query,
        name: `PEÇA FITNESS (${query})`,
        size: 'M',
        color: 'Preto Ônix',
        price: 39.9,
        costPrice: 15.0,
        quantity: 1,
        stock: 5,
      });
      setBarcodeInput('');
    }
  };

  const addItemToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.sku === item.sku);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += item.quantity;
        return copy;
      }
      return [...prev, item];
    });
  };

  const handleSelectProductModal = (prod: any) => {
    setSelectedProduct(prod);
    const initialColor = prod.colors?.[0]?.name || 'Preto Ônix';
    setSelectedColor(initialColor);
    const initialSize = prod.sizes?.[0] || 'M';
    setSelectedSize(initialSize);
  };

  const handleConfirmAddSelectedProduct = () => {
    if (!selectedProduct) return;

    // Busca variante correspondente
    const matchingVariant = selectedProduct.variants?.find(
      (v: any) => v.color?.toLowerCase() === selectedColor.toLowerCase() && v.size === selectedSize
    );

    const sku = matchingVariant?.sku || `${selectedProduct.sku}-${selectedColor.slice(0, 3).toUpperCase()}-${selectedSize}`;
    const price = matchingVariant?.price ? Number(matchingVariant.price) : selectedProduct.price;
    const costPrice = matchingVariant?.cost_price ? Number(matchingVariant.cost_price) : (selectedProduct.costPrice || 15.0);
    const stock = matchingVariant?.stock_quantity ?? selectedProduct.sizeStock?.[selectedSize] ?? selectedProduct.stock ?? 5;
    const image = matchingVariant?.images?.[0] || selectedProduct.primaryImage;

    addItemToCart({
      sku,
      name: selectedProduct.title,
      size: selectedSize,
      color: selectedColor,
      price,
      costPrice,
      quantity: 1,
      stock,
      image,
    });

    setSelectedProduct(null);
  };

  const handleUpdateQuantity = (sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.sku === sku) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemove = (sku: string) => {
    setCart(cart.filter((item) => item.sku !== sku));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCost = cart.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const commission = totalAfterDiscount * 0.1; // 10% comissão vendedora balcão

  // Finalização da venda com registro direto no ERP / API
  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        order_id: `POS-LEO-${Math.floor(1000 + Math.random() * 9000)}`,
        channel: 'POS_COUNTER',
        customer_name: customerName.trim() || 'Cliente Balcão Leominster',
        customer_phone: customerPhone.trim() || undefined,
        seller_name: seller,
        payment_method: paymentMethod,
        subtotal_products: subtotal,
        discount_amount: discountAmount,
        shipping_fee: 0.00,
        shipping_cost: 0.00,
        items: cart.map((item) => ({
          title: item.name,
          size: item.size,
          color: item.color,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.price,
          cost_price: item.costPrice,
        })),
      };

      const res = await fetch('/api/backoffice/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao registrar venda');
      }

      const data = await res.json();
      setCompletedSale(data.sale || payload);
      setCart([]);
      if (refreshProducts) {
        refreshProducts();
      }
    } catch (err: any) {
      console.error('Erro na venda PDV:', err);
      setErrorMessage(err.message || 'Falha ao registrar venda');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // TELA DE PROTEÇÃO / PIN DE SEGURANÇA DO PDV BALCÃO
  // =========================================================================
  if (!adminUser.isLoggedIn && !posUnlocked) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-white selection:bg-deep-black selection:text-gold">
        <div className="max-w-md w-full bg-white border-2 border-deep-black p-8 sm:p-10 shadow-luxury space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-deep-black text-gold border border-gold/40 shadow-sm">
              <Store className="w-6 h-6 text-gold" />
            </div>
            <div className="inline-block px-2.5 py-0.5 bg-gold/15 text-[9px] font-black uppercase tracking-widest text-deep-black border border-gold/30">
              TERMINAL PDV BALCÃO BLOQUEADO
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-deep-black">
              CAIXA SHOWROOM LEOMINSTER
            </h1>
            <p className="text-xs text-deep-black/60 uppercase font-medium">
              ANA FITNESS WEAR • ACESSO RESTRITO A OPERADORAS
            </p>
          </div>

          {posPinError && (
            <div className="p-3 bg-red-50 border-2 border-red-600 text-red-700 text-xs font-bold uppercase text-center animate-shake">
              ⚠️ {posPinError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const clean = posPinInput.trim();
              if (clean === '1234' || clean === 'admin123' || clean === 'ana2026' || clean === 'anafit' || loginAdmin('pos@anafitwear.com', clean)) {
                setPosUnlocked(true);
                setPosPinError('');
              } else {
                setPosPinError('PIN ou Senha de operadora incorreta!');
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                PIN de Operadora (ex: 1234) ou Senha Master
              </label>
              <input
                type="password"
                required
                value={posPinInput}
                onChange={(e) => setPosPinInput(e.target.value)}
                className="w-full p-4 border-2 border-deep-black font-black text-center text-lg tracking-widest focus:outline-none focus:border-gold font-mono"
                placeholder="••••"
                maxLength={20}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-md border border-deep-black"
            >
              <Lock className="w-4 h-4 text-gold" />
              <span>DESBLOQUEAR TERMINAL DE CAIXA</span>
            </button>
          </form>

          <div className="pt-4 border-t border-deep-black/10 text-center">
            <p className="text-[10px] text-deep-black/50 uppercase font-bold">
              🔒 Terminal protegido contra uso indevido por clientes da loja online.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 bg-white min-h-[85vh]">
      {/* Banner de Uso Interno */}
      <div className="bg-deep-black text-gold p-3 border border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-black uppercase tracking-wider">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <span>TERMINAL PDV BALCÃO • SHOWROOM LEOMINSTER, MA (USO INTERNO)</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPosUnlocked(false)}
            className="p-1.5 px-2 bg-red-600 text-white hover:bg-red-700 text-[10px] font-black uppercase flex items-center gap-1 transition"
            title="Bloquear terminal imediatamente"
          >
            <Lock className="w-3 h-3" />
            <span>BLOQUEAR CAIXA</span>
          </button>
          <span className="text-white/40">|</span>
          <Link href="/backoffice" className="text-white hover:text-gold underline text-[10px] font-bold">
            VER RELATÓRIO NO ERP BACKOFFICE →
          </Link>
          <span className="text-white/40">|</span>
          <Link href="/checkout" className="text-white hover:text-gold underline text-[10px] font-bold">
            CHECKOUT ONLINE DO CLIENTE →
          </Link>
        </div>
      </div>

      {/* Top Bar do Terminal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-deep-black/15 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-deep-black/50 hover:text-deep-black transition text-xs flex items-center gap-1 font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> VOLTAR À LOJA
            </Link>
            <span className="text-deep-black/30">•</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold">
              LEOMINSTER, MASSACHUSETTS (MOEDA: DÓLAR $ USD)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
            PDV EXPRESS BALCÃO • ANA FITNESS WEAR
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setShowWriteOffModal(true)}
            className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-2 border-2 border-deep-black shadow-sm shrink-0"
            title="Dar saída no estoque para uso próprio da dona, mostruário de vendedoras ou brindes sem custo"
          >
            <PackageMinus className="w-4 h-4 text-white" />
            <span>- RETIRADA / USO PRÓPRIO & MOSTRUÁRIO</span>
          </button>

          {/* Vendedora Ativa Selecionável */}
          <div className="flex items-center gap-3 bg-white border border-deep-black/20 p-2.5">
            <UserCheck className="w-5 h-5 text-gold shrink-0" />
            <div className="text-right">
              <label className="text-[9px] font-black uppercase tracking-widest text-deep-black/50 block">
                OPERADORA CONECTADA:
              </label>
              <select
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                className="text-xs font-black uppercase tracking-wider text-deep-black bg-transparent border-0 focus:outline-none cursor-pointer"
              >
                <option value="Juliana Silva (PDV Balcão Leominster)">Juliana Silva (PDV Balcão Leominster)</option>
                <option value="Ana Carina (Proprietária / Showroom)">Ana Carina (Proprietária / Showroom)</option>
                <option value="Camila (Vendedora Showroom)">Camila (Vendedora Showroom)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Saída / Baixa de Estoque sem Custo */}
      <StockWriteOffModal
        isOpen={showWriteOffModal}
        onClose={() => setShowWriteOffModal(false)}
        onSuccess={() => {
          if (refreshProducts) refreshProducts();
        }}
        catalogProducts={products}
      />

      {/* MODAL DE SUCESSO DA VENDA */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-gold p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto text-gold">
                <CheckCircle className="w-10 h-10 text-gold" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                COMPROVANTE DE VENDA BALCÃO
              </span>
              <h2 className="text-2xl font-black uppercase tracking-wider text-deep-black">
                VENDA CONCLUÍDA COM SUCESSO!
              </h2>
              <p className="text-xs font-mono text-deep-black/60 uppercase">
                PEDIDO #{completedSale.order_id} • {completedSale.payment_method}
              </p>
            </div>

            <div className="bg-deep-black/5 p-4 border border-deep-black/10 space-y-2 text-xs uppercase tracking-wider">
              <div className="flex justify-between">
                <span className="text-deep-black/60">CLIENTE:</span>
                <span className="font-black text-deep-black">{completedSale.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-deep-black/60">VENDEDORA:</span>
                <span className="font-bold text-deep-black">{completedSale.seller_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-deep-black/60">FORMA DE PAGAMENTO:</span>
                <span className="font-black text-gold">{completedSale.payment_method}</span>
              </div>
              <div className="flex justify-between border-t border-deep-black/10 pt-2 text-sm font-black">
                <span>VALOR TOTAL RECEBIDO:</span>
                <span className="font-mono text-deep-black">${Number(completedSale.subtotal_products).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gold font-bold text-[11px]">
                <span>COMISSÃO DA VENDEDORA (10%):</span>
                <span className="font-mono">
                  ${(Number(completedSale.subtotal_products) * 0.1).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>NOVA VENDA NO BALCÃO</span>
              </button>
              <Link
                href="/backoffice"
                className="py-3 px-4 border-2 border-deep-black hover:bg-deep-black hover:text-white font-black text-xs uppercase tracking-wider text-center transition flex items-center justify-center gap-1.5"
              >
                <span>VER NO ERP</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELETOR DE COR E TAMANHO DO PRODUTO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-deep-black/70 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-deep-black p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-gold tracking-widest block">SELECIONAR GRADE</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">{selectedProduct.title}</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-xs font-black p-1 hover:text-gold"
              >
                ✕
              </button>
            </div>

            {/* Seletor de Cores */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center justify-between">
                <span>COR DA PEÇA:</span>
                <span className="text-gold">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(selectedProduct.colors || [{ name: 'Preto Ônix', hex: '#0A0A0A' }]).map((c: any) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border flex items-center gap-2 transition ${
                      selectedColor === c.name
                        ? 'border-deep-black bg-deep-black text-white'
                        : 'border-deep-black/20 hover:border-deep-black'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seletor de Tamanhos */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center justify-between">
                <span>TAMANHO & ESTOQUE:</span>
                <span className="text-gold">TAM {selectedSize}</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(selectedProduct.sizes || ['P', 'M', 'G', 'GG']).map((s: string) => {
                  const stock = selectedProduct.sizeStock?.[s] ?? 5;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`p-2 border text-center transition ${
                        selectedSize === s
                          ? 'border-gold bg-gold text-deep-black font-black'
                          : 'border-deep-black/20 hover:border-deep-black'
                      }`}
                    >
                      <span className="text-xs font-black block">{s}</span>
                      <span className="text-[9px] text-deep-black/60 block font-mono">
                        {stock > 0 ? `${stock} un` : 'Esgotado'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-2.5 border border-deep-black text-xs font-black uppercase tracking-wider hover:bg-deep-black hover:text-white transition"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmAddSelectedProduct}
                className="flex-1 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition"
              >
                + ADICIONAR AO PDV
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border-2 border-red-500 text-red-700 text-xs font-black uppercase tracking-wider">
          ⚠ {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Painel Esquerdo: Leitor de Código de Barras, Busca de Produtos & Lista de Itens */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scanner / Input de Barcode */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-3 shadow-sm">
            <label className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center justify-between">
              <span>BIPAR CÓDIGO DE BARRAS / SKU EXATO:</span>
              <span className="text-gold font-bold">MOEDA: DÓLAR ($ USD)</span>
            </label>
            <form onSubmit={handleAddBarcode} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="EX: SAM-BLK-S OU BAI-BLK-M"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-xs uppercase tracking-wider font-mono border border-deep-black/30 bg-white focus:outline-none focus:border-deep-black"
                  autoFocus
                />
                <ScanBarcode className="w-5 h-5 text-deep-black/40 absolute left-3 top-3" />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" /> BIPAR
              </button>
            </form>
          </div>

          {/* Seleção Rápida de Peças do Catálogo Oficial */}
          <div className="bg-white border-2 border-deep-black p-5 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deep-black/10 pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gold" />
                <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                  CATÁLOGO INTEGRADO ({products.length} PRODUTOS)
                </span>
              </div>
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="BUSCAR PEÇA OU MODELO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-[11px] uppercase tracking-wider border border-deep-black/20 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-deep-black/40 absolute left-2 top-2" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
              {filteredProducts.slice(0, 9).map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleSelectProductModal(prod)}
                  className="p-2 border border-deep-black/15 hover:border-deep-black hover:bg-deep-black/5 transition text-left flex items-center gap-2 group"
                >
                  <div className="w-10 h-12 bg-deep-black/10 shrink-0 overflow-hidden">
                    <img src={prod.primaryImage} alt={prod.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-tight text-deep-black truncate group-hover:text-gold">
                      {prod.title}
                    </p>
                    <p className="text-[9px] font-mono text-gold font-black">
                      ${Number(prod.price).toFixed(2)}
                    </p>
                    <span className="text-[8px] text-deep-black/50 uppercase font-bold block">
                      + Escolher grade
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Itens do Carrinho PDV */}
          <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gold" />
                <span>ITENS BIPADOS / ADICIONADOS ({cart.length})</span>
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                SINCRONIZADO COM SUPABASE
              </span>
            </div>

            {cart.length === 0 ? (
              <p className="text-xs text-deep-black/40 uppercase tracking-widest py-8 text-center font-bold">
                NENHUM ITEM BIPADO NO TERMINAL. USE O LEITOR OU O CATÁLOGO ACIMA.
              </p>
            ) : (
              <div className="divide-y divide-deep-black/10">
                {cart.map((item) => (
                  <div key={item.sku} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-10 h-12 object-cover border border-deep-black/20" />
                      )}
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
                          {item.name}
                        </h3>
                        <p className="text-[10px] text-deep-black/60 font-mono uppercase tracking-wider">
                          SKU: {item.sku} • TAM {item.size} • {item.color}
                        </p>
                        <span className="text-[9px] text-deep-black/70 font-bold uppercase">
                          Estoque: {item.stock} un | Custo: ${item.costPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Controles de Quantidade */}
                      <div className="flex items-center border border-deep-black/20">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.sku, -1)}
                          className="px-2 py-1 text-xs font-black hover:bg-deep-black/10"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono font-black">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.sku, 1)}
                          className="px-2 py-1 text-xs font-black hover:bg-deep-black/10"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-sm font-black text-deep-black uppercase font-mono min-w-[60px] text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => handleRemove(item.sku)}
                        className="p-1.5 text-deep-black/40 hover:text-red-600 transition"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Painel Direito: Dados do Cliente, Fechamento de Venda & Pagamentos EUA */}
        <div className="lg:col-span-5 bg-deep-black text-white p-6 sm:p-8 space-y-6 shadow-luxury">
          {/* Identificação do Cliente Balcão */}
          <div className="space-y-3 pb-4 border-b border-white/10">
            <label className="text-[10px] font-black uppercase tracking-widest text-gold block">
              IDENTIFICAÇÃO DO CLIENTE (BALCÃO / SHOWROOM):
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="NOME DA CLIENTE"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs uppercase tracking-wider font-bold bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-gold"
              />
              <input
                type="text"
                placeholder="TELEFONE / WHATSAPP (+1 978...)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs uppercase tracking-wider font-mono bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Resumo da Venda */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              RESUMO DA VENDA BALCÃO (USD)
            </span>
            <div className="space-y-2 text-xs uppercase tracking-wider">
              <div className="flex justify-between text-white/70">
                <span>SUBTOTAL ({cart.length} ITENS):</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>

              {/* Desconto Opcional */}
              <div className="flex justify-between items-center text-white/70">
                <span>DESCONTO BALCÃO ($):</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className="w-20 px-2 py-1 text-right text-xs bg-white/10 border border-white/20 text-white font-mono focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex justify-between text-gold font-bold bg-white/5 p-2.5 border border-gold/20">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> COMISSÃO VENDEDORA (10%):
                </span>
                <span className="font-mono">${commission.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xl font-black text-white pt-3 border-t border-white/20">
                <span>TOTAL A COBRAR:</span>
                <span className="text-gold font-mono">${totalAfterDiscount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Formas de Pagamento dos EUA */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/70 flex items-center justify-between">
              <span>FORMA DE PAGAMENTO (EUA):</span>
              <span className="text-gold text-[9px]">
                {paymentMethod === 'ZELLE' && 'TAXA 0% • INSTANTÂNEO'}
                {paymentMethod === 'VENMO' && 'TAXA 1.9%'}
                {paymentMethod === 'CARD' && 'TAXA 2.9% + $0.30'}
                {paymentMethod === 'CASH' && 'TAXA 0% • DINHEIRO'}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('ZELLE')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1.5 border transition ${
                  paymentMethod === 'ZELLE'
                    ? 'border-gold bg-gold text-deep-black font-black'
                    : 'border-white/20 text-white/70 hover:border-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>ZELLE</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('VENMO')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1.5 border transition ${
                  paymentMethod === 'VENMO'
                    ? 'border-gold bg-gold text-deep-black font-black'
                    : 'border-white/20 text-white/70 hover:border-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>VENMO</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1.5 border transition ${
                  paymentMethod === 'CARD'
                    ? 'border-gold bg-gold text-deep-black font-black'
                    : 'border-white/20 text-white/70 hover:border-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>CARD</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1.5 border transition ${
                  paymentMethod === 'CASH'
                    ? 'border-gold bg-gold text-deep-black font-black'
                    : 'border-white/20 text-white/70 hover:border-white'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>CASH</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleFinalizeSale}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-4 bg-gold hover:bg-white text-deep-black disabled:opacity-50 font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg"
          >
            {isSubmitting ? (
              <span>REGISTRANDO NO ERP...</span>
            ) : (
              <span>CONCLUIR VENDA NO BALCÃO (${totalAfterDiscount.toFixed(2)})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
