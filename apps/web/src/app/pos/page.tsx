'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Percent,
  Tag,
  X,
  Calendar,
  CalendarDays,
  FileText,
  Send,
  Printer,
  Clock,
  User,
  MapPin,
  Phone,
  AlertCircle,
  Check,
  Instagram,
  MessageCircle,
  Ban,
} from 'lucide-react';
import { StockWriteOffModal } from '../../components/StockWriteOffModal';
import { PosInstagramChat } from '../../components/pos/PosInstagramChat';
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
  itemDiscount?: number; // Desconto em dólar ($) específico por peça
}

// Gera mensagem formatada para cobrança/carnê no WhatsApp
function generateCrediarioWhatsAppMessage(sale: any): string {
  const customer = sale.customer_name || 'Cliente';
  const orderId = sale.order_id;
  const cred = sale.crediario;
  const total = Number(sale.subtotal_products - (sale.discount_amount || 0)).toFixed(2);
  const downPayment = Number(cred?.down_payment || 0).toFixed(2);
  const remaining = Number(cred?.remaining_balance || total).toFixed(2);

  let msg = `✨ *ANA FITNESS WEAR • CARNÊ DE CREDIÁRIO* ✨\n\n`;
  msg += `Olá *${customer}*! Segue o comprovante e as datas de vencimento da sua compra em crediário:\n\n`;
  msg += `🛍️ *Pedido:* #${orderId}\n`;
  msg += `💰 *Valor Total:* $${total} USD\n`;
  if (Number(downPayment) > 0) {
    msg += `💵 *Entrada Paga:* $${downPayment} USD (${cred?.down_payment_method || 'CASH'})\n`;
  }
  msg += `📋 *Saldo Parcelado:* $${remaining} USD em *${cred?.installments_count || 1}x*\n\n`;
  msg += `📅 *DATAS DE VENCIMENTO DAS PARCELAS:*\n`;

  (cred?.installments || []).forEach((inst: any) => {
    const [y, m, d] = (inst.due_date || '').split('-');
    const dateFormatted = d && m && y ? `${d}/${m}/${y}` : inst.due_date;
    msg += `▫️ *Parcela ${inst.number}/${cred?.installments_count}:* $${Number(inst.amount).toFixed(2)} USD • *Vence em ${dateFormatted}*\n`;
  });

  msg += `\n📍 *Showroom:* Leominster, Massachusetts\n`;
  msg += `Muito obrigada pela preferência e confiança! Qualquer dúvida estamos à disposição. 💕`;
  return msg;
}

// Abre janela de impressão com carnê e nota promissória oficial
function printCrediarioCarnet(sale: any) {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const cred = sale.crediario;
  const customer = sale.customer_name || 'Cliente';
  const phone = sale.customer_phone || '';
  const doc = cred?.customer_doc || 'Não informado';
  const address = cred?.customer_address || 'Não informado';
  const total = Number(sale.subtotal_products - (sale.discount_amount || 0)).toFixed(2);
  const downPayment = Number(cred?.down_payment || 0).toFixed(2);
  const remaining = Number(cred?.remaining_balance || total).toFixed(2);

  const installmentsHtml = (cred?.installments || []).map((inst: any) => {
    const [y, m, d] = (inst.due_date || '').split('-');
    const dateFormatted = d && m && y ? `${d}/${m}/${y}` : inst.due_date;
    return `
      <div style="border: 2px dashed #000; padding: 12px; margin-bottom: 12px; font-family: monospace; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px;">
          <span>CARNÊ / PROMISSÓRIA - PARCELA ${inst.number}/${cred?.installments_count}</span>
          <span style="font-size: 15px;">VALOR: $${Number(inst.amount).toFixed(2)} USD</span>
        </div>
        <div style="margin-top: 8px; font-size: 11px; line-height: 1.5;">
          <div><strong>PEDIDO:</strong> #${sale.order_id} | <strong>DATA COMPRA:</strong> ${new Date(sale.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
          <div><strong>CLIENTE:</strong> ${customer} | <strong>DOC:</strong> ${doc}</div>
          <div><strong>TELEFONE:</strong> ${phone}</div>
          <div style="margin-top: 4px; font-size: 13px;"><strong>DATA DE VENCIMENTO:</strong> <span style="font-size: 15px; font-weight: bold; background-color: #fef08a; padding: 2px 6px;">${dateFormatted}</span></div>
        </div>
        <div style="margin-top: 14px; border-top: 1px solid #999; padding-top: 6px; font-size: 9px; display: flex; justify-content: space-between; color: #555;">
          <span>Data Pgto: ___/___/______</span>
          <span>Meio: [ ] Dinheiro  [ ] Zelle</span>
          <span>Visto do Recebedor: ____________________</span>
        </div>
      </div>
    `;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Carnê de Crediário - ${sale.order_id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
          .info { margin-bottom: 16px; font-size: 12px; line-height: 1.6; background: #f9f9f9; padding: 12px; border: 1px solid #ddd; }
          .terms { font-size: 10px; border: 1px solid #000; padding: 10px; margin-top: 20px; line-height: 1.4; background: #fdfdfd; }
          .sig { margin-top: 36px; text-align: center; border-top: 1px solid #000; width: 60%; margin-left: auto; margin-right: auto; padding-top: 8px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ANA FITNESS WEAR LLC</div>
          <div style="font-size: 12px; margin-top: 2px;">Showroom & Loja Oficial • Leominster, Massachusetts</div>
          <div style="font-weight: bold; margin-top: 6px; font-size: 14px; text-transform: uppercase;">CARNÊ DE CREDIÁRIO & NOTA PROMISSÓRIA DA LOJA</div>
        </div>
        <div class="info">
          <div><strong>PEDIDO:</strong> #${sale.order_id} | <strong>VENDEDORA:</strong> ${sale.seller_name || 'Showroom Leominster'}</div>
          <div><strong>CLIENTE:</strong> ${customer} | <strong>DOC:</strong> ${doc}</div>
          <div><strong>TELEFONE:</strong> ${phone} | <strong>ENDEREÇO:</strong> ${address}</div>
          <div style="margin-top: 4px; font-weight: bold;">
            TOTAL: $${total} USD | ENTRADA: $${downPayment} USD | SALDO PARCELADO: $${remaining} USD em ${cred?.installments_count || 1}x
          </div>
        </div>

        <h3 style="text-transform: uppercase; font-size: 13px; margin-bottom: 10px; font-weight: bold;">Lâminas / Canhotos das Parcelas:</h3>
        ${installmentsHtml}

        <div class="terms">
          <strong>TERMO DE COMPROMISSO E CONFISSÃO DE DÍVIDA:</strong><br/>
          Pelo presente instrumento, reconheço e declaro-me devedor(a) da quantia total mencionada acima perante a <strong>ANA FITNESS WEAR LLC</strong>, comprometendo-me irrevogavelmente a efetuar a liquidação das parcelas discriminadas nas suas respectivas datas de vencimento.
        </div>

        <div class="sig">
          <strong>${customer}</strong><br/>
          Assinatura da Devedora / Cliente
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
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
  
  const [seller, setSeller] = useState('Ana Karina');
  // Comissão Vendedora PDV (Opcional e 100% editável pelo operador: $0, %, ou valor em $)
  const [commissionMode, setCommissionMode] = useState<'NONE' | 'PERCENT' | 'FIXED'>('NONE');
  const [commissionInputValue, setCommissionInputValue] = useState<string>('0');

  const DEFAULT_POS_SELLERS = [
    { id: 'seller-beatriz', name: 'Beatriz Figueredo', coupon_code: 'BEATRIZ10', commission_pct: 10 },
    { id: 'seller-camila', name: 'Camila Rocha', coupon_code: 'CAMILA10', commission_pct: 10 },
    { id: 'seller-juliana', name: 'Juliana Mendes', coupon_code: 'JULIANA10', commission_pct: 10 },
    { id: 'seller-mariana', name: 'Mariana Salles', coupon_code: 'MARIANA10', commission_pct: 10 },
  ];

  const [registeredSellers, setRegisteredSellers] = useState<any[]>(DEFAULT_POS_SELLERS);
  const [customerName, setCustomerName] = useState('Cliente Balcão');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDoc, setCustomerDoc] = useState(''); // CPF, ID ou Passaporte
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const handleSellerChange = (newSeller: string) => {
    setSeller(newSeller);
    if (!newSeller || newSeller.toLowerCase().includes('ana karina') || newSeller.toLowerCase().includes('loja oficial')) {
      setCommissionMode('NONE');
      setCommissionInputValue('0');
    } else {
      const found = registeredSellers.find((s) => s.name.toLowerCase() === newSeller.toLowerCase());
      const defaultPct = found?.commission_pct !== undefined ? String(found.commission_pct) : '10';
      setCommissionMode('PERCENT');
      setCommissionInputValue(defaultPct);
    }
  };

  // Busca vendedoras reais cadastradas e aprovadas
  useEffect(() => {
    fetch('/api/backoffice/sellers')
      .then((r) => r.json())
      .then((d) => {
        const rawList = Array.isArray(d.sellers) ? d.sellers : (Array.isArray(d.data) ? d.data : []);
        const approved = rawList.filter(
          (s: any) => (s.active !== false) && (s.approval_status === 'APPROVED' || !s.approval_status) && s.name
        );
        if (approved.length > 0) {
          setRegisteredSellers(approved);
        } else {
          setRegisteredSellers(DEFAULT_POS_SELLERS);
        }
      })
      .catch((e) => {
        console.warn('Erro ao buscar vendedoras no PDV, mantendo lista padrão:', e);
        setRegisteredSellers(DEFAULT_POS_SELLERS);
      });
  }, []);

  // Meios de Pagamento (incluindo CREDIÁRIO / Carnê Próprio da Loja)
  const [paymentMethod, setPaymentMethod] = useState<'ZELLE' | 'VENMO' | 'CARD' | 'CASH' | 'CREDIARIO'>('ZELLE');

  // Helper para gerar datas de vencimento no formato YYYY-MM-DD
  const getFutureDateStr = (daysAhead: number = 30) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Configurações do Crediário
  const [crediarioInstallmentsCount, setCrediarioInstallmentsCount] = useState<number>(2);
  const [crediarioDownPayment, setCrediarioDownPayment] = useState<number>(0);
  const [crediarioDownPaymentMethod, setCrediarioDownPaymentMethod] = useState<'CASH' | 'ZELLE' | 'CARD'>('CASH');
  const [crediarioFirstDueDate, setCrediarioFirstDueDate] = useState<string>(() => getFutureDateStr(30));
  const [crediarioInterval, setCrediarioInterval] = useState<'MONTHLY' | 'BIWEEKLY'>('MONTHLY');
  const [customInstallmentDates, setCustomInstallmentDates] = useState<Record<number, string>>({});
  const [customInstallmentAmounts, setCustomInstallmentAmounts] = useState<Record<number, number>>({});
  
  // Sistema de Desconto Flexível do PDV (% ou $ e Preço Final Fechado)
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED' | 'TARGET_TOTAL'>('PERCENT');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  
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

  // Subtotal considerando possíveis descontos unitários por peça
  const subtotal = cart.reduce((acc, item) => {
    const effectiveUnitPrice = Math.max(0, item.price - (item.itemDiscount || 0));
    return acc + effectiveUnitPrice * item.quantity;
  }, 0);
  const totalCost = cart.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);

  // Desconto global do PDV (calculado em % livre, valor fixo em $ livre, ou preço final desejado)
  const calculatedDiscountAmount = useMemo(() => {
    const rawVal = discountInput !== '' ? (parseFloat(discountInput) || 0) : discountValue;
    if (rawVal <= 0) return 0;

    if (discountType === 'PERCENT') {
      const pct = Math.min(100, Math.max(0, rawVal));
      return Number(((subtotal * pct) / 100).toFixed(2));
    }
    if (discountType === 'FIXED') {
      return Number(Math.min(subtotal, Math.max(0, rawVal)).toFixed(2));
    }
    if (discountType === 'TARGET_TOTAL') {
      const target = Math.max(0, rawVal);
      return Number(Math.max(0, subtotal - target).toFixed(2));
    }
    return 0;
  }, [discountType, discountInput, discountValue, subtotal]);

  const totalAfterDiscount = Math.max(0, subtotal - calculatedDiscountAmount);
  
  // Comissão Vendedora PDV (Totalmente editável: Sem comissão $0, % livre ou $ fixo livre)
  const commission = useMemo(() => {
    if (commissionMode === 'NONE') return 0;
    const raw = parseFloat(commissionInputValue) || 0;
    if (raw <= 0) return 0;
    if (commissionMode === 'PERCENT') {
      return Number(((totalAfterDiscount * raw) / 100).toFixed(2));
    }
    if (commissionMode === 'FIXED') {
      return Number(raw.toFixed(2));
    }
    return 0;
  }, [commissionMode, commissionInputValue, totalAfterDiscount]);

  // Saldo que fica no Crediário (após abater eventual entrada em dinheiro/Zelle)
  const effectiveDownPayment = Math.min(totalAfterDiscount, Math.max(0, crediarioDownPayment));
  const remainingCrediarioBalance = Math.max(0, totalAfterDiscount - effectiveDownPayment);

  // Lista gerada de parcelas do Crediário com datas de vencimento automáticas e customizáveis
  const generatedInstallments = useMemo(() => {
    if (paymentMethod !== 'CREDIARIO') return [];

    const count = Math.max(1, crediarioInstallmentsCount);
    const baseAmt = Math.floor((remainingCrediarioBalance / count) * 100) / 100;
    const remainder = Number((remainingCrediarioBalance - (baseAmt * count)).toFixed(2));

    const list = [];
    const dateParts = (crediarioFirstDueDate || getFutureDateStr(30)).split('-').map(Number);
    const startYear = dateParts[0] || new Date().getFullYear();
    const startMonth = (dateParts[1] || (new Date().getMonth() + 1)) - 1;
    const startDay = dateParts[2] || new Date().getDate();

    for (let i = 0; i < count; i++) {
      const d = new Date(startYear, startMonth, startDay);
      if (crediarioInterval === 'BIWEEKLY') {
        d.setDate(d.getDate() + (i * 15));
      } else {
        d.setMonth(d.getMonth() + i);
      }
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const autoDate = `${y}-${m}-${dayStr}`;

      const finalDate = customInstallmentDates[i + 1] || autoDate;
      const defaultAmount = i === 0 ? Number((baseAmt + remainder).toFixed(2)) : baseAmt;
      const finalAmount = customInstallmentAmounts[i + 1] !== undefined
        ? customInstallmentAmounts[i + 1]
        : defaultAmount;

      list.push({
        number: i + 1,
        amount: finalAmount,
        due_date: finalDate,
        status: 'PENDING' as const,
      });
    }

    return list;
  }, [
    paymentMethod,
    remainingCrediarioBalance,
    crediarioInstallmentsCount,
    crediarioFirstDueDate,
    crediarioInterval,
    customInstallmentDates,
    customInstallmentAmounts,
  ]);

  // Finalização da venda com registro direto no ERP / API
  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage('');

    // Validação específica de dados para Crediário (Documento e Telefone são 100% opcionais)
    if (paymentMethod === 'CREDIARIO') {
      if (!customerName.trim() || customerName.trim() === 'Cliente Balcão') {
        setErrorMessage('⚠️ Para venda em Crediário, digite o Nome da cliente.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const crediarioPayload = paymentMethod === 'CREDIARIO' ? {
        customer_doc: customerDoc.trim() || undefined,
        customer_address: customerAddress.trim() || undefined,
        notes: customerNotes.trim() || undefined,
        down_payment: effectiveDownPayment,
        down_payment_method: effectiveDownPayment > 0 ? crediarioDownPaymentMethod : undefined,
        remaining_balance: remainingCrediarioBalance,
        installments_count: crediarioInstallmentsCount,
        installments: generatedInstallments,
      } : undefined;

      const selectedSellerRecord = registeredSellers.find((s) => s.name.toLowerCase() === seller.toLowerCase());
      const linkedCoupon = discountReason.trim()
        ? discountReason.trim().toUpperCase()
        : (selectedSellerRecord?.coupon_code ? selectedSellerRecord.coupon_code.toUpperCase() : undefined);

      const payload = {
        order_id: `POS-LEO-${Math.floor(1000 + Math.random() * 9000)}`,
        channel: 'POS_COUNTER',
        customer_name: customerName.trim() || 'Cliente Balcão Leominster',
        customer_phone: customerPhone.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        seller_name: seller,
        coupon_code: linkedCoupon,
        payment_method: paymentMethod,
        subtotal_products: subtotal,
        discount_amount: calculatedDiscountAmount,
        commission_amount: commission,
        shipping_fee: 0.00,
        shipping_cost: 0.00,
        items: cart.map((item) => ({
          title: item.name,
          size: item.size,
          color: item.color,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: Math.max(0, item.price - (item.itemDiscount || 0)),
          cost_price: item.costPrice,
        })),
        crediario: crediarioPayload,
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
      setCompletedSale(data.sale || {
        ...payload,
        total_paid: totalAfterDiscount,
        discount_amount: calculatedDiscountAmount,
        commission_amount: commission,
        discount_reason: discountReason.trim() || undefined,
      });
      setCart([]);
      setDiscountInput('');
      setDiscountValue(0);
      setDiscountReason('');
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
              if (clean === '1234' || clean === 'admin123' || clean === 'ana2026' || clean === 'anafit' || clean === 'Anafit1234' || clean.toLowerCase() === 'anafit1234' || loginAdmin('pos@anafitwear.com', clean)) {
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
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-white min-h-[90vh]">
      {/* Banner de Uso Interno */}
      <div className="bg-deep-black text-gold p-3 border border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-black uppercase tracking-wider">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <span>TERMINAL PDV BALCÃO • SHOWROOM LEOMINSTER, MA (USO INTERNO)</span>
        </span>
        <div className="flex items-center gap-3">
          <a
            href="#pos-instagram-chat"
            className="px-2.5 py-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[10px] font-black uppercase flex items-center gap-1.5 transition hover:brightness-110 shadow-xs"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>INSTAGRAM DIRECT AO VIVO</span>
          </a>
          <span className="text-white/40">|</span>
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
                onChange={(e) => handleSellerChange(e.target.value)}
                className="text-xs font-black uppercase tracking-wider text-deep-black bg-transparent border-0 focus:outline-none cursor-pointer"
              >
                <option value="Ana Karina">Ana Karina (Showroom Leominster)</option>
                {registeredSellers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} {s.coupon_code ? `(${s.coupon_code})` : ''}
                  </option>
                ))}
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
              <div className="flex justify-between border-t border-deep-black/10 pt-2 text-xs">
                <span className="text-deep-black/60">SUBTOTAL BRUTO:</span>
                <span className="font-mono text-deep-black font-bold">${Number(completedSale.subtotal_products).toFixed(2)}</span>
              </div>
              {Number(completedSale.discount_amount) > 0 && (
                <div className="flex justify-between text-green-700 font-black text-xs bg-green-50 p-1.5 border border-green-200">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-green-600" />
                    <span>DESCONTO APLICADO {completedSale.coupon_code ? `(${completedSale.coupon_code})` : ''}:</span>
                  </span>
                  <span className="font-mono">-${Number(completedSale.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-deep-black/10 pt-2 text-sm font-black">
                <span>{completedSale.payment_method === 'CREDIARIO' ? 'TOTAL DA COMPRA:' : 'VALOR TOTAL RECEBIDO:'}</span>
                <span className="font-mono text-deep-black">
                  ${(Number(completedSale.total_paid ?? (completedSale.subtotal_products - (completedSale.discount_amount || 0)))).toFixed(2)}
                </span>
              </div>
              {completedSale.payment_method === 'CREDIARIO' && (
                <>
                  <div className="flex justify-between text-xs text-deep-black/80 font-bold">
                    <span>ENTRADA RECEBIDA ({completedSale.crediario?.down_payment_method || 'CASH'}):</span>
                    <span className="font-mono text-green-700">${Number(completedSale.crediario?.down_payment || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-amber-900 font-black">
                    <span>SALDO NO CREDIÁRIO ({completedSale.crediario?.installments_count || 1}X):</span>
                    <span className="font-mono">${Number(completedSale.crediario?.remaining_balance || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-gold font-bold text-[11px]">
                <span>COMISSÃO DA VENDEDORA:</span>
                <span className="font-mono">
                  ${Number(completedSale.commission_amount !== undefined ? completedSale.commission_amount : 0).toFixed(2)}
                  {Number(completedSale.commission_amount || 0) === 0 ? ' (SEM COMISSÃO)' : ''}
                </span>
              </div>
            </div>

            {/* SEÇÃO ESPECIAL DE CARNÊ QUANDO FOR CREDIÁRIO */}
            {completedSale.crediario && (
              <div className="bg-amber-50/80 border-2 border-amber-300 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                    <CalendarDays className="w-4 h-4 text-amber-700" />
                    <span>CARNÊ GERADO COM DATAS DE VENCIMENTO</span>
                  </div>
                  {completedSale.crediario.customer_doc && (
                    <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                      DOC: {completedSale.crediario.customer_doc}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(completedSale.crediario.installments || []).map((inst: any) => {
                    const [y, m, d] = (inst.due_date || '').split('-');
                    const dateFormatted = d && m && y ? `${d}/${m}/${y}` : inst.due_date;
                    return (
                      <div key={inst.number} className="flex justify-between items-center text-xs bg-white p-2 border border-amber-200">
                        <span className="font-bold text-deep-black">
                          Parcela {inst.number}/{completedSale.crediario.installments_count}:
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-deep-black">
                            ${Number(inst.amount).toFixed(2)}
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-300">
                            Vence: {dateFormatted}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = generateCrediarioWhatsAppMessage(completedSale);
                      const cleanPhone = (completedSale.customer_phone || '').replace(/\D/g, '');
                      const url = cleanPhone
                        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
                        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                      window.open(url, '_blank');
                    }}
                    className="py-2.5 px-3 bg-green-600 hover:bg-green-700 text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ENVIAR NO WHATSAPP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => printCrediarioCarnet(completedSale)}
                    className="py-2.5 px-3 bg-amber-700 hover:bg-amber-800 text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>IMPRIMIR CARNÊ</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setCompletedSale(null);
                  setCart([]);
                  setDiscountInput('');
                  setDiscountValue(0);
                  setDiscountReason('');
                  setCustomerName('Cliente Balcão');
                  setCustomerPhone('');
                  setCustomerEmail('');
                  setCustomerDoc('');
                  setCustomerAddress('');
                  setCustomerNotes('');
                  setPaymentMethod('ZELLE');
                  setCrediarioDownPayment(0);
                  setCustomInstallmentDates({});
                  setCustomInstallmentAmounts({});
                }}
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

            {/* Botão de Cancelamento Imediato no PDV caso o operador tenha errado */}
            <div className="pt-1">
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Deseja cancelar esta venda (#${completedSale.order_id}) e estornar as peças de volta para o estoque?`)) return;
                  try {
                    const res = await fetch('/api/backoffice/sales', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'cancel_sale',
                        order_id: completedSale.order_id,
                        restore_stock: true,
                        cancel_commission: true,
                        cancellation_reason: 'Cancelado imediatamente no caixa do PDV',
                      }),
                    });
                    const d = await res.json();
                    if (!res.ok || d.error) throw new Error(d.error || 'Erro ao cancelar');
                    alert(`Venda #${completedSale.order_id} cancelada com sucesso! Peças devolvidas ao estoque.`);
                    setCompletedSale(null);
                  } catch (e: any) {
                    alert(`Erro ao cancelar venda: ${e.message}`);
                  }
                }}
                className="w-full py-2.5 px-3 bg-red-100 hover:bg-red-700 hover:text-white text-red-900 border border-red-400 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                title="Cancelar esta venda e devolver peças para o estoque"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>CANCELAR / ESTORNAR ESTA VENDA</span>
              </button>
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Leitor de Código de Barras, Busca de Produtos & Lista de Itens */}
        <div className="xl:col-span-4 lg:col-span-6 space-y-6">
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

                    <div className="flex items-center gap-3">
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

                      {/* Desconto unitário específico nesta peça */}
                      <div className="flex items-center gap-1 bg-warm-light/20 border border-deep-black/20 px-1.5 py-0.5" title="Desconto especial nesta peça ($)">
                        <Tag className="w-3 h-3 text-gold" />
                        <span className="text-[9px] font-bold text-deep-black/60">Desc:</span>
                        <input
                          type="number"
                          min="0"
                          max={item.price}
                          step="1"
                          placeholder="$0"
                          value={item.itemDiscount || ''}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setCart(cart.map((c) => c.sku === item.sku ? { ...c, itemDiscount: Math.min(item.price, val) } : c));
                          }}
                          className="w-14 px-1 py-0.5 text-[10px] font-mono border-0 bg-transparent text-right font-black focus:outline-none"
                        />
                      </div>

                      <div className="min-w-[65px] text-right">
                        {(item.itemDiscount || 0) > 0 ? (
                          <>
                            <span className="text-[10px] line-through text-deep-black/40 block font-mono">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <span className="text-sm font-black text-green-700 uppercase font-mono">
                              ${((item.price - (item.itemDiscount || 0)) * item.quantity).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-black text-deep-black uppercase font-mono">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>

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

        {/* Painel Central: Dados do Cliente, Fechamento de Venda & Pagamentos EUA */}
        <div className="xl:col-span-4 lg:col-span-6 bg-deep-black text-white p-6 sm:p-8 space-y-6 shadow-luxury">
          {/* Identificação do Cliente Balcão */}
          <div className="space-y-3 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gold" />
                <span>IDENTIFICAÇÃO DO CLIENTE (BALCÃO / SHOWROOM):</span>
              </label>
              {paymentMethod === 'CREDIARIO' && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gold text-deep-black">
                  CREDIÁRIO (CARNÊ)
                </span>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder={paymentMethod === 'CREDIARIO' ? "NOME DA CLIENTE *" : "NOME DA CLIENTE"}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs uppercase tracking-wider font-bold bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-gold"
                required={paymentMethod === 'CREDIARIO'}
              />
              <input
                type="text"
                placeholder={paymentMethod === 'CREDIARIO' ? "TELEFONE / WHATSAPP (OPCIONAL)" : "TELEFONE / WHATSAPP (+1 978...)"}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs uppercase tracking-wider font-mono bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-gold"
              />

              {/* Dados Adicionais Opcionais para Crediário */}
              {paymentMethod === 'CREDIARIO' && (
                <div className="space-y-2 pt-1 animate-fadeIn bg-gold/10 p-3 border border-gold/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gold flex items-center gap-1">
                      <FileText className="w-3 h-3 text-gold" />
                      <span>DADOS ADICIONAIS DO CREDIÁRIO / CARNÊ:</span>
                    </span>
                    <span className="text-[8px] text-white/70 font-bold uppercase">NÃO EXIGIDOS / OPCIONAIS</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="CPF / ID / PASSAPORTE (OPCIONAL)"
                      value={customerDoc}
                      onChange={(e) => setCustomerDoc(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono uppercase bg-deep-black/60 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-gold"
                      title="Documento da cliente (opcional - não obrigatório)"
                    />
                    <input
                      type="email"
                      placeholder="E-MAIL (OPCIONAL)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono lowercase bg-deep-black/60 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-gold"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="ENDEREÇO DA CLIENTE (OPCIONAL)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs uppercase bg-deep-black/60 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-gold"
                    title="Endereço da cliente para o carnê (opcional)"
                  />
                  <input
                    type="text"
                    placeholder="OBSERVAÇÕES DO CREDIÁRIO (OPCIONAL)"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] uppercase bg-deep-black/60 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-gold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Seção Completa de Desconto 100% Livre do PDV */}
          <div className="space-y-3 bg-white/5 p-4 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-gold" />
                <span>DESCONTO LIVRE NA VENDA:</span>
              </label>

              {/* 3 Opções Livres de Desconto */}
              <div className="flex items-center border border-white/20 bg-deep-black">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('PERCENT');
                    setDiscountInput('');
                    setDiscountValue(0);
                  }}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition ${
                    discountType === 'PERCENT'
                      ? 'bg-gold text-deep-black font-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Dar desconto em Porcentagem livre (%)"
                >
                  <Percent className="w-3 h-3" />
                  <span>% LIVRE</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('FIXED');
                    setDiscountInput('');
                    setDiscountValue(0);
                  }}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition ${
                    discountType === 'FIXED'
                      ? 'bg-gold text-deep-black font-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Dar desconto em Valor em Dólar livre ($)"
                >
                  <DollarSign className="w-3 h-3" />
                  <span>$ DÓLAR</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('TARGET_TOTAL');
                    setDiscountInput('');
                    setDiscountValue(0);
                  }}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition ${
                    discountType === 'TARGET_TOTAL'
                      ? 'bg-gold text-deep-black font-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Definir diretamente o Preço Final que a cliente vai pagar"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>PREÇO FINAL</span>
                </button>
              </div>
            </div>

            {/* Campo Livre de Entrada de Desconto */}
            <div className="space-y-1">
              <span className="text-[9px] text-white/60 font-bold uppercase block">
                {discountType === 'PERCENT' && 'DIGITE QUALQUER % DE DESCONTO (EX: 5, 10, 15, 20...):'}
                {discountType === 'FIXED' && 'DIGITE QUALQUER VALOR DE DESCONTO EM $ (EX: 5.00, 10.00, 25.50...):'}
                {discountType === 'TARGET_TOTAL' && `SUBTOTAL É $${subtotal.toFixed(2)}. DIGITE POR QUANTO QUER FECHAR O VALOR FINAL:`}
              </span>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDiscountInput(v);
                      setDiscountValue(parseFloat(v) || 0);
                    }}
                    placeholder={
                      discountType === 'PERCENT'
                        ? 'Digite a % desejada (ex: 15)'
                        : discountType === 'FIXED'
                        ? 'Digite o valor em $ (ex: 20.00)'
                        : `Digite o valor final da compra (ex: ${(subtotal * 0.9).toFixed(2)})`
                    }
                    className="w-full pl-3 pr-24 py-2.5 text-base font-black font-mono bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-black text-gold font-mono uppercase">
                    {discountType === 'PERCENT' ? '% OFF' : discountType === 'FIXED' ? '$ OFF' : 'TOTAL $'}
                  </span>
                </div>

                {calculatedDiscountAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountInput('');
                      setDiscountValue(0);
                      setDiscountReason('');
                    }}
                    className="px-3 py-2.5 bg-red-600/30 hover:bg-red-600 text-white text-xs font-black uppercase border border-red-500/40 transition flex items-center gap-1 shrink-0"
                    title="Remover desconto"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>LIMPAR</span>
                  </button>
                )}
              </div>
            </div>

            {/* Atalhos Rápidos Opcionais de 1 Toque */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/50 block">
                OU ESCOLHA RAPIDAMENTE UM DOS ATALHOS:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {discountType === 'PERCENT' && (
                  [5, 10, 15, 20, 25, 30, 40, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setDiscountInput(String(pct));
                        setDiscountValue(pct);
                      }}
                      className={`px-2.5 py-1 text-[10px] font-black uppercase font-mono border transition ${
                        parseFloat(discountInput) === pct
                          ? 'bg-gold text-deep-black border-gold shadow-sm font-black'
                          : 'bg-white/5 text-white/80 border-white/20 hover:border-gold hover:text-gold'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))
                )}

                {discountType === 'FIXED' && (
                  [5, 10, 15, 20, 25, 30, 40, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setDiscountInput(String(val));
                        setDiscountValue(val);
                      }}
                      className={`px-2.5 py-1 text-[10px] font-black uppercase font-mono border transition ${
                        parseFloat(discountInput) === val
                          ? 'bg-gold text-deep-black border-gold shadow-sm font-black'
                          : 'bg-white/5 text-white/80 border-white/20 hover:border-gold hover:text-gold'
                      }`}
                    >
                      ${val}
                    </button>
                  ))
                )}

                {discountType === 'TARGET_TOTAL' && (
                  [
                    Math.round(subtotal * 0.95),
                    Math.round(subtotal * 0.90),
                    Math.round(subtotal * 0.85),
                    Math.round(subtotal * 0.80),
                  ]
                    .filter((val, idx, arr) => val > 0 && val < subtotal && arr.indexOf(val) === idx)
                    .map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setDiscountInput(String(val));
                          setDiscountValue(val);
                        }}
                        className={`px-2.5 py-1 text-[10px] font-black uppercase font-mono border transition ${
                          parseFloat(discountInput) === val
                            ? 'bg-gold text-deep-black border-gold shadow-sm font-black'
                            : 'bg-white/5 text-white/80 border-white/20 hover:border-gold hover:text-gold'
                        }`}
                      >
                        Fechar por ${val}
                      </button>
                    ))
                )}
              </div>
            </div>

            {/* Motivo do Desconto ou Cupom */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label className="text-[9px] font-black uppercase tracking-wider text-white/60 flex items-center justify-between">
                <span>MOTIVO DO DESCONTO OU CUPOM (OPCIONAL):</span>
                {discountReason && <span className="text-gold font-mono font-bold">{discountReason}</span>}
              </label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value.toUpperCase())}
                placeholder="DIGITE O MOTIVO (EX: AMIGA, VIP, CLIENTE ANTIGA, MOSTRUÁRIO, CUPOM)"
                className="w-full px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-gold font-mono"
              />

              <div className="flex flex-wrap gap-1 pt-1">
                {['VIP', 'AMIGA', 'CLIENTE FIEL', 'MOSTRUÁRIO', 'DEF-LEVE', 'PROMO BALCÃO'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setDiscountReason(tag)}
                    className="px-2 py-0.5 text-[8px] font-black uppercase bg-white/5 text-white/70 hover:text-gold hover:bg-white/10 border border-white/10 transition"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
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

              {/* Linha Destacada de Desconto Concedido */}
              {calculatedDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-green-400 font-bold bg-green-950/40 border border-green-500/30 p-2.5">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-green-400" />
                    <span>
                      DESCONTO APLICADO (
                      {discountType === 'PERCENT'
                        ? `${discountValue}% OFF`
                        : discountType === 'TARGET_TOTAL'
                        ? `TOTAL FECHADO EM $${(subtotal - calculatedDiscountAmount).toFixed(2)}`
                        : `-$${calculatedDiscountAmount.toFixed(2)}`}
                      {discountReason ? ` • ${discountReason}` : ''}):
                    </span>
                  </span>
                  <span className="font-mono font-black text-sm">-${calculatedDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {/* =========================================================================
                  SEÇÃO PRINCIPAL: VENDEDORA & COMISSÃO DA VENDA (100% SELECIONÁVEL & EDITÁVEL)
                 ========================================================================= */}
              <div className="bg-deep-black/60 border-2 border-gold/50 p-3 space-y-2.5 shadow-sm">
                <div className="flex justify-between items-center text-gold font-bold border-b border-white/10 pb-2">
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-gold" />
                    <span>VENDEDORA & COMISSÃO:</span>
                  </span>
                  <span className="font-mono text-sm font-black text-gold">
                    ${commission.toFixed(2)}
                    {commissionMode === 'NONE' && (
                      <span className="text-[9px] text-white/50 font-normal ml-1">($0)</span>
                    )}
                    {commissionMode === 'PERCENT' && (
                      <span className="text-[9px] text-gold/80 font-normal ml-1">({commissionInputValue}%)</span>
                    )}
                    {commissionMode === 'FIXED' && (
                      <span className="text-[9px] text-gold/80 font-normal ml-1">($ FIXO)</span>
                    )}
                  </span>
                </div>

                {/* 1. SELETOR DA VENDEDORA RESPONSÁVEL PELA VENDA */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-white/70 flex items-center justify-between">
                    <span>SELECIONE QUEM RECEBE A COMISSÃO:</span>
                    <span className="text-[8px] font-mono text-gold uppercase">
                      {seller.toLowerCase().includes('ana karina') ? 'VENDA DIRETA' : 'COMISSÃO ATIVA'}
                    </span>
                  </label>
                  <select
                    value={seller}
                    onChange={(e) => handleSellerChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-black uppercase tracking-wider bg-deep-black text-white border-2 border-gold/40 focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="Ana Karina">
                      🏢 VENDA PRÓPRIA / BALCÃO (ANA KARINA) - SEM COMISSÃO
                    </option>
                    <optgroup label="✨ Vendedoras / Consultoras Oficiais">
                      {registeredSellers.map((s) => (
                        <option key={s.id || s.name} value={s.name}>
                          👩‍💼 {s.name} {s.coupon_code ? `(${s.coupon_code})` : ''} • Padrão: {s.commission_pct || 10}%
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* 2. BOTÕES RÁPIDOS DE COMISSÃO */}
                <div className="space-y-1.5 pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-wider text-white/50">
                      APLICAR COMISSÃO PARA: <strong className="text-gold">{seller}</strong>
                    </span>
                    {commissionMode === 'NONE' ? (
                      <span className="text-[8.5px] font-mono font-bold text-red-400 bg-red-950/40 px-1.5 py-0.5 border border-red-500/30">
                        SEM COMISSÃO ($0)
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-mono font-bold text-green-400 bg-green-950/40 px-1.5 py-0.5 border border-green-500/30">
                        ✓ COMISSÃO ATIVA
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCommissionMode('NONE');
                        setCommissionInputValue('0');
                      }}
                      className={`py-1.5 px-1 text-[8px] font-black uppercase border transition text-center ${
                        commissionMode === 'NONE'
                          ? 'bg-red-600 text-white border-red-500 shadow-xs'
                          : 'bg-white/5 text-white/70 border-white/20 hover:border-gold hover:text-white'
                      }`}
                      title="Venda sem repasse de comissão ($0.00)"
                    >
                      $0 SEM COMISSÃO
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCommissionMode('PERCENT');
                        setCommissionInputValue('5');
                      }}
                      className={`py-1.5 px-1 text-[8px] font-black uppercase border transition text-center ${
                        commissionMode === 'PERCENT' && commissionInputValue === '5'
                          ? 'bg-gold text-deep-black border-gold shadow-xs'
                          : 'bg-white/5 text-white/70 border-white/20 hover:border-gold hover:text-white'
                      }`}
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCommissionMode('PERCENT');
                        setCommissionInputValue('10');
                      }}
                      className={`py-1.5 px-1 text-[8px] font-black uppercase border transition text-center ${
                        commissionMode === 'PERCENT' && commissionInputValue === '10'
                          ? 'bg-gold text-deep-black border-gold shadow-xs'
                          : 'bg-white/5 text-white/70 border-white/20 hover:border-gold hover:text-white'
                      }`}
                    >
                      10% (PADRÃO)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCommissionMode('FIXED');
                        if (commissionMode !== 'FIXED') setCommissionInputValue('10');
                      }}
                      className={`py-1.5 px-1 text-[8px] font-black uppercase border transition text-center ${
                        commissionMode === 'FIXED'
                          ? 'bg-gold text-deep-black border-gold shadow-xs'
                          : 'bg-white/5 text-white/70 border-white/20 hover:border-gold hover:text-white'
                      }`}
                    >
                      $ VALOR FIXO
                    </button>
                  </div>

                  {/* 3. INPUT MANUAL LIVRE (SE QUISER AJUSTAR VALOR OU PORCENTAGEM) */}
                  {commissionMode !== 'NONE' && (
                    <div className="flex items-center gap-2 pt-1 bg-white/5 p-2 border border-white/10">
                      <span className="text-[9px] font-bold text-white/70 uppercase shrink-0">
                        {commissionMode === 'PERCENT' ? 'PORCENTAGEM:' : 'VALOR FIXO:'}
                      </span>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={commissionInputValue}
                          onChange={(e) => setCommissionInputValue(e.target.value)}
                          placeholder={commissionMode === 'PERCENT' ? 'Digite a % (ex: 8.5)' : 'Digite em $ (ex: 15.00)'}
                          className="w-full px-2 py-1 text-xs font-mono font-bold bg-deep-black border border-gold/40 text-gold placeholder-white/30 focus:outline-none focus:border-gold"
                        />
                        <span className="absolute right-2 top-1 text-[9px] font-mono font-bold text-gold/80">
                          {commissionMode === 'PERCENT' ? '% sobre líquido' : 'USD'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Feedback visual de destino */}
                  <div className="text-[10px] text-white/75 pt-1 flex items-center justify-between">
                    <span>Crédito da comissão:</span>
                    <span className="font-bold">
                      {commission > 0 ? (
                        <span className="text-green-400">✓ ${commission.toFixed(2)} para {seller}</span>
                      ) : (
                        <span className="text-white/50">Nenhuma comissão a pagar ($0.00)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xl font-black text-white pt-3 border-t border-white/20">
                <span>TOTAL A COBRAR:</span>
                <div className="text-right">
                  {calculatedDiscountAmount > 0 && (
                    <span className="text-xs line-through text-white/40 block font-mono">
                      ${subtotal.toFixed(2)}
                    </span>
                  )}
                  <span className="text-gold font-mono">${totalAfterDiscount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formas de Pagamento dos EUA & Crediário Próprio */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/70 flex items-center justify-between">
              <span>FORMA DE PAGAMENTO:</span>
              <span className="text-gold text-[9px] font-mono font-bold">
                {paymentMethod === 'ZELLE' && 'TAXA 0% • INSTANTÂNEO'}
                {paymentMethod === 'VENMO' && 'TAXA 1.9%'}
                {paymentMethod === 'CARD' && 'TAXA 2.9% + $0.30'}
                {paymentMethod === 'CASH' && 'TAXA 0% • DINHEIRO'}
                {paymentMethod === 'CREDIARIO' && 'CARNÊ DA LOJA • PARCELADO'}
              </span>
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('ZELLE')}
                className={`p-2 sm:p-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 border transition ${
                  paymentMethod === 'ZELLE'
                    ? 'border-gold bg-gold text-deep-black font-black'
                    : 'border-white/20 text-white/70 hover:border-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>ZELLE</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('VENMO')}
                className={`p-2 sm:p-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 border transition ${
                  paymentMethod === 'VENMO'
                    ? 'border-gold bg-gold text-deep-black font-black'
                    : 'border-white/20 text-white/70 hover:border-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>VENMO</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-2 sm:p-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 border transition ${
                  paymentMethod === 'CARD'
                    ? 'border-gold bg-gold text-deep-black font-black'
                    : 'border-white/20 text-white/70 hover:border-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>CARD</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-2 sm:p-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 border transition ${
                  paymentMethod === 'CASH'
                    ? 'border-gold bg-gold text-deep-black font-black'
                    : 'border-white/20 text-white/70 hover:border-white'
                }`}
              >
                <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>CASH</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIARIO')}
                className={`p-2 sm:p-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 border transition ${
                  paymentMethod === 'CREDIARIO'
                    ? 'border-gold bg-gold text-deep-black font-black shadow-luxury'
                    : 'border-gold/40 text-gold hover:border-gold hover:bg-gold/10'
                }`}
                title="Vender a prazo com carnê e datas de vencimento"
              >
                <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>CREDIÁRIO</span>
              </button>
            </div>
          </div>

          {/* PAINEL COMPLETO DO PLANO DE CREDIÁRIO */}
          {paymentMethod === 'CREDIARIO' && (
            <div className="space-y-4 bg-white/5 p-4 sm:p-5 border-2 border-gold animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gold" />
                  <span>PLANO DO CREDIÁRIO & VENCIMENTOS</span>
                </span>
                <span className="text-[9px] font-mono text-gold uppercase font-bold">
                  CARNÊ DA LOJA
                </span>
              </div>

              {/* 1. Entrada Paga no Ato */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/80">
                    VALOR DA ENTRADA PAGA NO ATO ($ USD):
                  </label>
                  <span className="text-gold font-mono font-bold">
                    SALDO PARCELADO: ${remainingCrediarioBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-white/50">$</span>
                    <input
                      type="number"
                      min="0"
                      max={totalAfterDiscount}
                      step="1"
                      value={crediarioDownPayment || ''}
                      onChange={(e) => setCrediarioDownPayment(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-sm font-black font-mono bg-white/10 border border-white/20 text-white focus:outline-none focus:border-gold"
                    />
                  </div>
                  {crediarioDownPayment > 0 && (
                    <select
                      value={crediarioDownPaymentMethod}
                      onChange={(e) => setCrediarioDownPaymentMethod(e.target.value as any)}
                      className="p-2 text-xs font-bold uppercase bg-white/10 border border-white/20 text-gold focus:outline-none focus:border-gold"
                      title="Forma como a entrada foi paga"
                    >
                      <option value="CASH">ENTRADA EM DINHEIRO</option>
                      <option value="ZELLE">ENTRADA NO ZELLE</option>
                      <option value="CARD">ENTRADA NO CARTÃO</option>
                    </select>
                  )}
                </div>

                {/* Atalhos Rápidos de Entrada */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'Sem entrada ($0)', val: 0 },
                    { label: '$10', val: 10 },
                    { label: '$20', val: 20 },
                    { label: '$30', val: 30 },
                    { label: `50% ($${(totalAfterDiscount / 2).toFixed(2)})`, val: Number((totalAfterDiscount / 2).toFixed(2)) },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCrediarioDownPayment(preset.val)}
                      className={`px-2 py-0.5 text-[9px] font-black uppercase font-mono border transition ${
                        crediarioDownPayment === preset.val
                          ? 'bg-gold text-deep-black border-gold'
                          : 'bg-white/5 text-white/70 border-white/20 hover:border-gold hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Número de Parcelas & Frequência */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/80 block">
                  QUANTIDADE DE PARCELAS:
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCrediarioInstallmentsCount(num)}
                      className={`py-2 text-xs font-black font-mono uppercase border transition ${
                        crediarioInstallmentsCount === num
                          ? 'bg-gold text-deep-black border-gold shadow'
                          : 'bg-white/5 text-white/70 border-white/20 hover:border-gold hover:text-white'
                      }`}
                    >
                      {num}x
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Data do 1º Vencimento & Intervalo */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/80">
                    DATA DO 1º VENCIMENTO:
                  </label>
                  <div className="flex items-center gap-1 border border-white/20 bg-deep-black p-0.5">
                    <button
                      type="button"
                      onClick={() => setCrediarioInterval('MONTHLY')}
                      className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                        crediarioInterval === 'MONTHLY' ? 'bg-gold text-deep-black' : 'text-white/60'
                      }`}
                    >
                      MENSAL (30 DIAS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCrediarioInterval('BIWEEKLY')}
                      className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                        crediarioInterval === 'BIWEEKLY' ? 'bg-gold text-deep-black' : 'text-white/60'
                      }`}
                    >
                      QUINZENAL (15 DIAS)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={crediarioFirstDueDate}
                    onChange={(e) => setCrediarioFirstDueDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-white/10 border border-white/20 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                {/* Atalhos Rápidos de Datas de Vencimento */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '+15 Dias', val: getFutureDateStr(15) },
                    { label: '+30 Dias', val: getFutureDateStr(30) },
                    {
                      label: 'Próx. Dia 5',
                      val: (() => {
                        const d = new Date();
                        if (d.getDate() >= 5) d.setMonth(d.getMonth() + 1);
                        d.setDate(5);
                        return d.toISOString().split('T')[0];
                      })(),
                    },
                    {
                      label: 'Próx. Dia 10',
                      val: (() => {
                        const d = new Date();
                        if (d.getDate() >= 10) d.setMonth(d.getMonth() + 1);
                        d.setDate(10);
                        return d.toISOString().split('T')[0];
                      })(),
                    },
                    {
                      label: 'Próx. Dia 20',
                      val: (() => {
                        const d = new Date();
                        if (d.getDate() >= 20) d.setMonth(d.getMonth() + 1);
                        d.setDate(20);
                        return d.toISOString().split('T')[0];
                      })(),
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCrediarioFirstDueDate(preset.val)}
                      className={`px-2 py-0.5 text-[9px] font-black uppercase font-mono border transition ${
                        crediarioFirstDueDate === preset.val
                          ? 'bg-gold text-deep-black border-gold'
                          : 'bg-white/5 text-white/70 border-white/20 hover:border-gold hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Demonstrativo Interativo das Parcelas */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center justify-between">
                  <span>CRONOGRAMA DO CARNÊ ({generatedInstallments.length} PARCELAS):</span>
                  <span className="text-[9px] font-mono text-white/60">EDITÁVEL</span>
                </span>

                <div className="space-y-1.5 bg-black/40 p-2.5 border border-white/10 max-h-52 overflow-y-auto">
                  {generatedInstallments.map((inst) => {
                    const [y, m, d] = (inst.due_date || '').split('-');
                    const dateFormatted = d && m && y ? `${d}/${m}/${y}` : inst.due_date;
                    return (
                      <div
                        key={inst.number}
                        className="p-2 bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-gold text-deep-black text-[10px] font-black flex items-center justify-center font-mono">
                            {inst.number}
                          </span>
                          <div>
                            <span className="font-black text-white block">
                              PARCELA {inst.number}/{generatedInstallments.length}
                            </span>
                            <span className="text-[9px] text-gold font-mono font-bold">
                              Vence em: {dateFormatted}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Campo para editar valor da parcela se desejar */}
                          <div className="flex items-center gap-1 bg-white/10 px-2 py-1 border border-white/20">
                            <span className="text-[10px] font-mono text-white/50">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={
                                customInstallmentAmounts[inst.number] !== undefined
                                  ? customInstallmentAmounts[inst.number]
                                  : inst.amount
                              }
                              onChange={(e) => {
                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                setCustomInstallmentAmounts((prev) => ({ ...prev, [inst.number]: val }));
                              }}
                              className="w-16 bg-transparent text-right font-mono font-black text-xs text-gold focus:outline-none"
                            />
                          </div>

                          {/* Seletor de data de vencimento da parcela */}
                          <input
                            type="date"
                            value={customInstallmentDates[inst.number] || inst.due_date}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomInstallmentDates((prev) => ({ ...prev, [inst.number]: val }));
                            }}
                            className="px-2 py-1 bg-white/10 border border-white/20 text-white font-mono text-[11px] focus:outline-none focus:border-gold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleFinalizeSale}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-4 bg-gold hover:bg-white text-deep-black disabled:opacity-50 font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg border-2 border-gold"
          >
            {isSubmitting ? (
              <span>REGISTRANDO NO ERP...</span>
            ) : paymentMethod === 'CREDIARIO' ? (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-deep-black" />
                <span>
                  GERAR CREDIÁRIO ({crediarioInstallmentsCount}x DE ${(remainingCrediarioBalance / crediarioInstallmentsCount).toFixed(2)})
                </span>
              </span>
            ) : (
              <span>CONCLUIR VENDA NO BALCÃO (${totalAfterDiscount.toFixed(2)})</span>
            )}
          </button>
        </div>

        {/* Painel Direito: CHAT DO INSTAGRAM DIRECT AO VIVO NO BALCÃO */}
        <div id="pos-instagram-chat" className="xl:col-span-4 lg:col-span-12 space-y-6">
          <PosInstagramChat />
        </div>
      </div>
    </div>
  );
}
