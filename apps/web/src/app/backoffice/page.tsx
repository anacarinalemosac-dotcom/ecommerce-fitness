'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Activity,
  Factory,
  Users,
  Palette,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Eye,
  CheckCircle2,
  Upload,
  Package,
  PlusCircle,
  Image as ImageIcon,
  Tag,
  Barcode,
  Check,
  Truck,
  ShieldCheck,
  Star,
  ExternalLink,
  Edit3,
  Trash2,
  Grid,
  RefreshCw,
  BarChart3,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  Filter,
  FileSpreadsheet,
  Receipt,
  X,
  ChevronRight,
  Percent,
  Store,
  Lock,
  Clock,
  Copy,
  Key,
  Share2,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  MapPin,
  Smartphone,
  Laptop,
  Radio,
  Download,
  PackageMinus,
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Settings,
  Layers,
  CalendarDays,
  Send,
  Printer,
  Instagram,
  Wallet,
  Ban,
  Building2,
  MessageCircle,
} from 'lucide-react';
import { soundManager, requestNotificationPermission, sendBrowserNotification } from '@/lib/notificationSounds';
import { ProductVariantMatrixForm } from '../../components/ProductVariantMatrixForm';
import { CsvProductImportModal, downloadCsvTemplate, downloadExcelTemplate } from '../../components/CsvProductImportModal';
import { StockWriteOffModal } from '../../components/StockWriteOffModal';
import { WhatsAppCatalogPdfModal } from '../../components/WhatsAppCatalogPdfModal';
import { CategoryManagementModal } from '../../components/CategoryManagementModal';
import { EditSaleModal } from '../../components/EditSaleModal';
import { CancelSaleModal } from '../../components/CancelSaleModal';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { DashboardMetricsView } from '../../components/backoffice/DashboardMetricsView';
import { AppearanceCmsView } from '../../components/backoffice/AppearanceCmsView';
import { CustomersReviewsView } from '../../components/backoffice/CustomersReviewsView';
import { TechnicalSettingsView } from '../../components/backoffice/TechnicalSettingsView';
import { InstagramDirectView } from '../../components/backoffice/InstagramDirectView';
import { SimpleFinancesView } from '../../components/backoffice/SimpleFinancesView';
import { SuppliersManagementView } from '../../components/backoffice/SuppliersManagementView';
import { AccessReportsView } from '../../components/backoffice/AccessReportsView';
import { SalesReportModal } from '../../components/backoffice/SalesReportModal';

interface ProductProfit {
  sku: string;
  title: string;
  costPrice: number;
  salePrice: number;
  sellerCommissionRate: number; // ex: 10%
  gatewayRate: number; // ex: 2.9%
}

interface CatalogProduct {
  id: string;
  title: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  costPrice: number;
  badge: 'BEST SELLER' | 'LANÇAMENTO' | 'PRÉ-VENDA';
  fit: string;
  primaryImage: string;
  secondaryImage: string;
  stock: number;
  allowBackorder: boolean;
  productionDays: number;
  zeroTransparency: boolean;
  removableCups: boolean;
  sizes: string[];
  colorName: string;
  colorHex: string;
  sku: string;
  barcode: string;
}

const INITIAL_CATALOG: CatalogProduct[] = [
  {
    id: 'p1',
    title: 'SAMANTA ROMPER',
    slug: 'samanta-romper',
    category: 'MACAQUINHOS',
    price: 44.9,
    originalPrice: 49.9,
    costPrice: 16.0,
    badge: 'LANÇAMENTO',
    fit: 'ALTA SUSTENTAÇÃO • SEAMLESS SCULPT',
    primaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    stock: 10,
    allowBackorder: true,
    productionDays: 5,
    zeroTransparency: true,
    removableCups: true,
    sizes: ['S', 'M', 'L'],
    colorName: 'Preto Ônix',
    colorHex: '#0A0A0A',
    sku: 'SAM-BLK-S',
    barcode: '789100000001',
  },
  {
    id: 'p2',
    title: 'BAILARINA TOP',
    slug: 'blusa-bailarina',
    category: 'TOPS',
    price: 34.9,
    costPrice: 12.0,
    badge: 'BEST SELLER',
    fit: 'MÉDIO IMPACTO • BOJO REMOVÍVEL',
    primaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    stock: 15,
    allowBackorder: true,
    productionDays: 5,
    zeroTransparency: true,
    removableCups: true,
    sizes: ['S', 'M', 'L'],
    colorName: 'Preto Ônix',
    colorHex: '#0A0A0A',
    sku: 'BAI-BLK-S',
    barcode: '789100000002',
  },
  {
    id: 'p3',
    title: 'MONIQUE FLARE PANTS SET',
    slug: 'monique-flare-pants-set',
    category: 'CONJUNTOS',
    price: 49.9,
    costPrice: 19.0,
    badge: 'BEST SELLER',
    fit: 'CÓS DUPLO ANATÔMICO • ZERO TRANSPARÊNCIA',
    primaryImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    stock: 7,
    allowBackorder: true,
    productionDays: 5,
    zeroTransparency: true,
    removableCups: true,
    sizes: ['S', 'M', 'L'],
    colorName: 'Champagne Gold',
    colorHex: '#D4AF37',
    sku: 'MON-GLD-M',
    barcode: '789100000003',
  },
  {
    id: 'p4',
    title: 'KELY PANTS SET',
    slug: 'conjunto-calca-kely',
    category: 'CONJUNTOS',
    price: 39.9,
    originalPrice: 49.9,
    costPrice: 16.0,
    badge: 'PRÉ-VENDA',
    fit: 'CONFECCIONADO SOB MEDIDA (PRAZO 30 DIAS)',
    primaryImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=900&q=80',
    stock: 0,
    allowBackorder: true,
    productionDays: 30,
    zeroTransparency: true,
    removableCups: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colorName: 'Preto Ônix',
    colorHex: '#0A0A0A',
    sku: 'KEL-BLK-M',
    barcode: '789100000004',
  },
];

// Abre janela de impressão com carnê e nota promissória oficial
function printCrediarioCarnet(sale: any) {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const cred = sale.crediario;
  const customer = sale.customer_name || 'Cliente';
  const phone = sale.customer_phone || '';
  const doc = cred?.customer_doc || 'Não informado';
  const total = Number(sale.subtotal_products - (sale.discount_amount || 0)).toFixed(2);
  const downPayment = Number(cred?.down_payment || 0).toFixed(2);
  const remaining = Number(cred?.remaining_balance || total).toFixed(2);

  const installmentsHtml = (cred?.installments || []).map((inst: any) => {
    const [y, m, d] = (inst.due_date || '').split('-');
    const dateFormatted = d && m && y ? `${d}/${m}/${y}` : inst.due_date;
    const isPaid = inst.status === 'PAID';
    return `
      <div style="border: 2px dashed #000; padding: 12px; margin-bottom: 12px; font-family: monospace; page-break-inside: avoid; background: ${isPaid ? '#f0fdf4' : '#fff'};">
        <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px;">
          <span>CARNÊ / PROMISSÓRIA - PARCELA ${inst.number}/${cred?.installments_count || cred?.installments?.length}</span>
          <span style="font-size: 15px;">VALOR: $${Number(inst.amount).toFixed(2)} USD ${isPaid ? '✓ PAGO' : ''}</span>
        </div>
        <div style="margin-top: 8px; font-size: 11px; line-height: 1.5;">
          <div><strong>PEDIDO:</strong> #${sale.order_id} | <strong>DATA COMPRA:</strong> ${new Date(sale.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
          <div><strong>CLIENTE:</strong> ${customer} | <strong>DOC:</strong> ${doc}</div>
          <div><strong>TELEFONE:</strong> ${phone}</div>
          <div style="margin-top: 4px; font-size: 13px;"><strong>DATA DE VENCIMENTO:</strong> <span style="font-size: 15px; font-weight: bold; background-color: #fef08a; padding: 2px 6px;">${dateFormatted}</span></div>
        </div>
        <div style="margin-top: 14px; border-top: 1px solid #999; padding-top: 6px; font-size: 9px; display: flex; justify-content: space-between; color: #555;">
          <span>Data Pgto: ${isPaid && inst.paid_at ? new Date(inst.paid_at).toLocaleDateString('pt-BR') : '___/___/______'}</span>
          <span>Meio: ${isPaid && inst.paid_method ? `[X] ${inst.paid_method}` : '[ ] Dinheiro  [ ] Zelle'}</span>
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
          <div class="title">ANA FITNESS WEAR</div>
          <div style="font-size: 11px; letter-spacing: 2px;">CARNÊ DE CREDIÁRIO & NOTA PROMISSÓRIA</div>
          <div style="font-size: 10px; color: #555; margin-top: 4px;">SHOWROOM LEOMINSTER, MASSACHUSETTS • +1 (978) 313-9452</div>
        </div>
        <div class="info">
          <div><strong>CLIENTE:</strong> ${customer}</div>
          <div><strong>DOC (CPF / ID):</strong> ${doc}</div>
          <div><strong>WHATSAPP:</strong> ${phone}</div>
          <div><strong>TOTAL COMPRA:</strong> $${total} USD | <strong>ENTRADA:</strong> $${downPayment} USD | <strong>SALDO:</strong> $${remaining} USD</div>
        </div>
        ${installmentsHtml}
        <div class="terms">
          Reconheço a dívida referente às mercadorias adquiridas sob o Pedido #${sale.order_id} e comprometo-me a efetuar o pagamento das parcelas discriminadas acima nas respectivas datas de vencimento.
        </div>
        <div class="sig">
          Assinatura da Cliente: __________________________________________________
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default function BackofficeDashboard() {
  const { adminUser, loginAdmin, logoutAdmin, refreshProducts, siteInfo } = useStoreSettings();
  const [authEmail, setAuthEmail] = useState('anafitweareua@gmail.com');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'catalog' | 'sales' | 'commissions' | 'finances' | 'reports' | 'cms' | 'customers' | 'settings' | 'margins' | 'live' | 'backorders' | 'theme' | 'whatsapp-catalog' | 'instagram-direct' | 'suppliers'
  >('dashboard');
  const [cmsSubTab, setCmsSubTab] = useState<'media' | 'categories' | 'colors' | 'typography' | 'pages'>('categories');
  const [onlineCount, setOnlineCount] = useState(0);

  // Catálogo de produtos
  const [products, setProducts] = useState<CatalogProduct[]>(INITIAL_CATALOG);
  const [supabaseProducts, setSupabaseProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [writeOffModalTab, setWriteOffModalTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [writeOffsData, setWriteOffsData] = useState<{
    writeOffs: any[];
    summary: { totalDocuments: number; totalItemsWithdrawn: number; totalCostValue: number };
  }>({
    writeOffs: [],
    summary: { totalDocuments: 0, totalItemsWithdrawn: 0, totalCostValue: 0 },
  });
  const [loadingWriteOffs, setLoadingWriteOffs] = useState(false);
  const [showWhatsAppCatalogModal, setShowWhatsAppCatalogModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Filtros e Busca Rápida no Catálogo de Produtos
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productStatusFilter, setProductStatusFilter] = useState<'ALL' | 'ACTIVE' | 'HIDDEN' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Relatório de Vendas e Lucro Real
  const [salesData, setSalesData] = useState<any | null>(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesChannelFilter, setSalesChannelFilter] = useState<'ALL' | 'ONLINE' | 'POS_COUNTER'>('ALL');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<'ALL' | 'CARD' | 'ZELLE' | 'VENMO' | 'CASH' | 'CREDIARIO'>('ALL');
  const [salesPeriodFilter, setSalesPeriodFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'>('ALL');
  const [salesCustomStartDate, setSalesCustomStartDate] = useState('');
  const [salesCustomEndDate, setSalesCustomEndDate] = useState('');
  const [showSalesReportModal, setShowSalesReportModal] = useState(false);
  const [salesPreorderOnly, setSalesPreorderOnly] = useState(false);
  const [salesSearch, setSalesSearch] = useState('');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<any | null>(null);
  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [cancellingSale, setCancellingSale] = useState<any | null>(null);

  // Modal de Baixa de Pagamento no Crediário: "Pagou como? Zelle? Cash? Card? Venmo?"
  const [crediarioPayModal, setCrediarioPayModal] = useState<{
    isOpen: boolean;
    order: any | null;
    installmentNumber?: number;
    amount?: number;
  }>({
    isOpen: false,
    order: null,
  });

  const handleOpenCrediarioPayModal = (sale: any, installmentNumber?: number, amount?: number) => {
    setCrediarioPayModal({
      isOpen: true,
      order: sale,
      installmentNumber,
      amount,
    });
  };

  const handleExecuteCrediarioPayment = async (orderId: string, method: string = 'CASH', installmentNumber?: number) => {
    try {
      const payload: any = {
        order_id: orderId,
        payment_method: method,
        action: installmentNumber !== undefined ? 'pay_installment' : 'pay_crediario_full',
      };
      if (installmentNumber !== undefined) {
        payload.installment_number = installmentNumber;
      }

      const res = await fetch('/api/backoffice/sales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (selectedSaleDetail && (selectedSaleDetail.order_id === orderId || selectedSaleDetail.id === orderId)) {
          const updatedCred = { ...(selectedSaleDetail.crediario || {}) };
          if (updatedCred.installments) {
            updatedCred.installments = updatedCred.installments.map((inst: any) => {
              if (installmentNumber === undefined || inst.number === installmentNumber) {
                return {
                  ...inst,
                  status: 'PAID',
                  paid_at: new Date().toISOString(),
                  paid_method: method,
                  payment_method: method,
                };
              }
              return inst;
            });
          }
          const allPaid = (updatedCred.installments || []).every((i: any) => i.status === 'PAID');
          setSelectedSaleDetail({
            ...selectedSaleDetail,
            payment_status: allPaid ? 'PAID' : 'PARTIAL',
            crediario: updatedCred,
          });
        }

        setCrediarioPayModal({ isOpen: false, order: null });
        fetchSalesData();
        setSaveSuccessMessage(true);
        setTimeout(() => setSaveSuccessMessage(false), 3000);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao registrar baixa no crediário.');
      }
    } catch (err: any) {
      alert(`Falha ao registrar baixa: ${err.message}`);
    }
  };

  // 1. Atualização Interativa da Situação de Entrega (Logística: Aguardando, Separando, Despachada, Entregue)
  const handleUpdateFulfillmentStatus = async (orderId: string, newFulfillment: string, trackingCode?: string) => {
    let finalTracking = trackingCode;
    if (newFulfillment === 'SHIPPED' && !finalTracking) {
      const target = (salesData?.sales || []).find((s: any) => s.order_id === orderId || s.id === orderId);
      const existingCode = target?.tracking_code || '';
      const entered = window.prompt(
        `📦 Despachar Pedido #${orderId}\n\nInforme o Código de Rastreamento dos Correios (USPS):\n(A cliente receberá automaticamente um e-mail com link oficial de rastreamento do USPS)`,
        existingCode || ''
      );
      if (entered === null) {
        return; // Cancelado pela usuária
      }
      finalTracking = entered.trim() || ('9400' + Math.floor(100000000000000000 + Math.random() * 900000000000000000));
    }

    try {
      const res = await fetch('/api/backoffice/sales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          fulfillment_status: newFulfillment,
          tracking_code: finalTracking,
        }),
      });
      if (res.ok) {
        fetchSalesData();
        setSaveSuccessMessage(true);
        setTimeout(() => setSaveSuccessMessage(false), 3000);
      } else {
        const data = await res.json();
        alert(`Erro ao atualizar entrega: ${data.error || 'Erro no servidor'}`);
      }
    } catch (err: any) {
      alert(`Falha ao atualizar entrega: ${err.message}`);
    }
  };

  // Atualização interativa de status geral legado do pedido
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, trackingCode?: string) => {
    if (newStatus === 'CANCELLED') {
      const target = (salesData?.sales || []).find((s: any) => s.order_id === orderId || s.id === orderId);
      if (target) {
        setCancellingSale(target);
        return;
      }
    }

    let finalTracking = trackingCode;
    if (newStatus === 'SHIPPED' && !finalTracking) {
      const target = (salesData?.sales || []).find((s: any) => s.order_id === orderId || s.id === orderId);
      const existingCode = target?.tracking_code || '';
      const entered = window.prompt(
        `📦 Despachar Pedido #${orderId}\n\nInforme o Código de Rastreamento dos Correios (USPS):\n(A cliente receberá automaticamente um e-mail de confirmação de envio com o link oficial de rastreamento do USPS)`,
        existingCode || ''
      );
      if (entered === null) return;
      finalTracking = entered.trim() || ('9400' + Math.floor(100000000000000000 + Math.random() * 900000000000000000));
    }

    try {
      const res = await fetch('/api/backoffice/sales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          status: newStatus,
          tracking_code: finalTracking,
        }),
      });
      if (res.ok) {
        fetchSalesData();
        setSaveSuccessMessage(true);
        setTimeout(() => setSaveSuccessMessage(false), 3000);
      } else {
        const data = await res.json();
        alert(`Erro ao atualizar status: ${data.error || 'Erro no servidor'}`);
      }
    } catch (err: any) {
      alert(`Falha ao atualizar status: ${err.message}`);
    }
  };

  // Dar baixa em parcela de Crediário
  const handlePayInstallment = async (orderId: string, installmentNumber: number, method: string = 'CASH') => {
    return handleExecuteCrediarioPayment(orderId, method, installmentNumber);
  };

  // Exportação completa do catálogo atual em CSV
  const handleExportCatalogCsv = () => {
    const listToExport = supabaseProducts.length > 0 ? supabaseProducts : products;
    if (!listToExport || listToExport.length === 0) {
      alert('Nenhum produto cadastrado para exportar.');
      return;
    }
    const headers = ['sku', 'title', 'category', 'tags', 'color', 'size', 'price', 'cost_price', 'stock_quantity', 'allow_backorder', 'description', 'image_url'];
    const rows: string[] = [headers.join(',')];

    listToExport.forEach((p: any) => {
      if (p.product_variants && p.product_variants.length > 0) {
        p.product_variants.forEach((v: any) => {
          rows.push([
            `"${v.sku || p.sku || ''}"`,
            `"${(p.title || '').replace(/"/g, '""')}"`,
            `"${p.categories?.name || p.category || ''}"`,
            `"${(p.tags || []).join(';')}"`,
            `"${v.color || p.colorName || 'Preto Ônix'}"`,
            `"${v.size || 'M'}"`,
            v.price || p.price || 0,
            v.cost_price || p.costPrice || 0,
            v.stock_quantity !== undefined ? v.stock_quantity : (p.stock || 0),
            v.allow_backorder ? 'sim' : 'nao',
            `"${(p.description || p.fit || '').replace(/"/g, '""')}"`,
            `"${(v.images && v.images[0]) || p.primaryImage || ''}"`
          ].join(','));
        });
      } else {
        rows.push([
          `"${p.sku || ''}"`,
          `"${(p.title || '').replace(/"/g, '""')}"`,
          `"${p.category || ''}"`,
          `""`,
          `"${p.colorName || 'Preto Ônix'}"`,
          `"${(p.sizes || []).join('/') || 'M'}"`,
          p.price || 0,
          p.costPrice || 0,
          p.stock || 0,
          p.allowBackorder ? 'sim' : 'nao',
          `"${(p.fit || '').replace(/"/g, '""')}"`,
          `"${p.primaryImage || ''}"`
        ].join(','));
      }
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `catalogo_ana_fitness_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchSupabaseProducts = async () => {
    setLoadingSupabase(true);
    try {
      const res = await fetch(`/api/backoffice/products?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) {
          setSupabaseProducts(data.products);
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar produtos do Supabase:', err);
    } finally {
      setLoadingSupabase(false);
    }
  };

  const handleToggleVisibility = async (productId: string, newVisibility: boolean) => {
    try {
      const res = await fetch('/api/backoffice/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, visible_online: newVisibility }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao atualizar status de visibilidade');
      }

      // Atualiza lista do backoffice e sincroniza vitrine da loja
      await fetchSupabaseProducts();
      if (refreshProducts) {
        await refreshProducts();
      }
      try {
        soundManager.playVisitorDing();
      } catch (_) {}
    } catch (err: any) {
      alert(`Erro ao alterar visibilidade: ${err.message}`);
    }
  };

  const fetchSalesData = async () => {
    setLoadingSales(true);
    try {
      const res = await fetch(`/api/backoffice/sales?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (res.ok) {
        const data = await res.json();
        setSalesData(data);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados de vendas:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchWriteOffs = async () => {
    setLoadingWriteOffs(true);
    try {
      const res = await fetch(`/api/backoffice/inventory/write-off?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (res.ok) {
        const data = await res.json();
        setWriteOffsData({
          writeOffs: Array.isArray(data.writeOffs) ? data.writeOffs : [],
          summary: data.summary || { totalDocuments: 0, totalItemsWithdrawn: 0, totalCostValue: 0 },
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar retiradas de estoque:', err);
    } finally {
      setLoadingWriteOffs(false);
    }
  };

  // Gestão de Vendedoras & Comissões
  const [sellers, setSellers] = useState<any[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [sellerFormData, setSellerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    coupon_code: '',
    commission_pct: 10,
    customer_discount_pct: 0,
    channel: 'ALL' as 'ALL' | 'ONLINE' | 'POS_COUNTER',
    active: true,
    payout_method: 'ZELLE' as 'ZELLE' | 'VENMO' | 'CASHAPP' | 'PIX' | 'BANK',
    payout_key: '',
    payout_beneficiary: '',
  });
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutSeller, setPayoutSeller] = useState<any | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<'ZELLE' | 'VENMO' | 'CASHAPP' | 'PIX' | 'CASH'>('ZELLE');
  const [copiedCouponLink, setCopiedCouponLink] = useState<string | null>(null);
  const [copiedPayoutKey, setCopiedPayoutKey] = useState<string | null>(null);

  // Aprovação e Reprovação de Vendedoras (Novos Cadastros)
  const [approvingSeller, setApprovingSeller] = useState<any | null>(null);
  const [approveCommissionPct, setApproveCommissionPct] = useState<number>(10);
  const [approveDiscountPct, setApproveDiscountPct] = useState<number>(0);
  const [approvePassword, setApprovePassword] = useState<string>('ana123');

  const handleOpenApproveModal = (seller: any) => {
    setApprovingSeller(seller);
    setApproveCommissionPct(seller.commission_pct !== undefined ? Number(seller.commission_pct) : 10);
    setApproveDiscountPct(seller.customer_discount_pct !== undefined ? Number(seller.customer_discount_pct) : 0);
    setApprovePassword(seller.password || 'ana123');
  };

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingSeller) return;
    try {
      const res = await fetch('/api/backoffice/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          seller_id: approvingSeller.id,
          commission_pct: approveCommissionPct,
          customer_discount_pct: approveDiscountPct,
          password: approvePassword,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers);
        setApprovingSeller(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao aprovar vendedora.');
      }
    } catch (err: any) {
      alert(`Falha ao aprovar: ${err.message}`);
    }
  };

  const handleDeleteOrRejectSeller = async (seller: any) => {
    const isPending = seller.approval_status === 'PENDING';
    const msg = isPending
      ? `Deseja recusar e EXCLUIR a solicitação de cadastro de "${seller.name}" (Cupom: ${seller.coupon_code})?`
      : `Deseja realmente EXCLUIR a vendedora "${seller.name}" (Cupom: ${seller.coupon_code})?`;
    if (!confirm(msg)) return;

    try {
      const res = await fetch('/api/backoffice/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          seller_id: seller.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao excluir vendedora.');
      }
    } catch (err: any) {
      alert(`Falha ao excluir: ${err.message}`);
    }
  };

  const handleCopyPayoutKey = (key: string, id: string) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedPayoutKey(id);
    setTimeout(() => setCopiedPayoutKey(null), 3000);
  };

  const fetchSellers = async () => {
    setLoadingSellers(true);
    try {
      const res = await fetch('/api/backoffice/sellers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sellers)) {
          setSellers(data.sellers);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar vendedoras:', err);
    } finally {
      setLoadingSellers(false);
    }
  };

  const handleOpenAddSeller = () => {
    setEditingSellerId(null);
    setSellerFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      coupon_code: '',
      commission_pct: 10,
      customer_discount_pct: 0,
      channel: 'ALL',
      active: true,
      payout_method: 'ZELLE',
      payout_key: '',
      payout_beneficiary: '',
    });
    setShowSellerModal(true);
  };

  const handleOpenEditSeller = (seller: any) => {
    setEditingSellerId(seller.id);
    setSellerFormData({
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      password: seller.password || 'ana123',
      coupon_code: seller.coupon_code,
      commission_pct: seller.commission_pct,
      customer_discount_pct: seller.customer_discount_pct,
      channel: seller.channel || 'ALL',
      active: seller.active,
      payout_method: seller.payout_method || 'ZELLE',
      payout_key: seller.payout_key || '',
      payout_beneficiary: seller.payout_beneficiary || '',
    });
    setShowSellerModal(true);
  };

  const handleSaveSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/backoffice/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          seller: {
            id: editingSellerId,
            ...sellerFormData,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers);
        setShowSellerModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar vendedora.');
      }
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`);
    }
  };

  const handleToggleSellerActive = async (sellerId: string) => {
    try {
      const res = await fetch('/api/backoffice/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_active',
          seller_id: sellerId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers);
      }
    } catch (e) {
      console.warn('Erro ao alternar status da vendedora:', e);
    }
  };

  const handleOpenPayout = (seller: any) => {
    const pending = Math.max(0, (seller.total_commission_earned || 0) - (seller.total_commission_paid || 0));
    setPayoutSeller(seller);
    setPayoutAmount(pending.toFixed(2));
    setPayoutMethod((seller.payout_method as any) || 'ZELLE');
    setShowPayoutModal(true);
  };

  const handleConfirmPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutSeller) return;
    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Informe um valor válido de repasse.');
      return;
    }
    try {
      const res = await fetch('/api/backoffice/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_paid',
          seller_id: payoutSeller.id,
          amount: amountNum,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers);
        setShowPayoutModal(false);
        setPayoutSeller(null);
      }
    } catch (err: any) {
      alert(`Falha ao registrar pagamento: ${err.message}`);
    }
  };

  const getAffiliateLink = (coupon: string) => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}/?ref=${coupon}`;
    }
    return `https://anafitnesswear.com/?ref=${coupon}`;
  };

  const copySellerLink = (coupon: string) => {
    const link = getAffiliateLink(coupon);
    navigator.clipboard.writeText(link);
    setCopiedCouponLink(coupon);
    setTimeout(() => setCopiedCouponLink(null), 3000);
  };

  // Notificações e Radar de Clientes Online (Estilo Wix)
  const [liveFeed, setLiveFeed] = useState<{
    activeCount: number;
    activeVisitors: any[];
    topCities: { city: string; count: number }[];
    recentEvents: any[];
  }>({
    activeCount: 4,
    activeVisitors: [],
    topCities: [],
    recentEvents: [],
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotificationsActive, setBrowserNotificationsActive] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const processedEventIdsRef = useRef<Set<string>>(new Set());

  const addToast = (toast: {
    id: string;
    type: 'visitor' | 'order';
    title: string;
    desc: string;
    city: string;
    amount?: number;
    orderId?: string;
  }) => {
    setToasts((prev) => [toast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 7000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setBrowserNotificationsActive(true);
      }
    }
  }, []);

  const handleEnableBrowserNotifications = async () => {
    const granted = await requestNotificationPermission();
    setBrowserNotificationsActive(granted);
    if (granted) {
      if (soundEnabled) soundManager.playCashRegister();
      sendBrowserNotification('🎉 Alertas de Venda Ativados!', {
        body: 'Perfeito! Seu celular agora vai apitar e tocar o som de caixa registradora a cada nova venda.',
      });
    } else {
      alert('As notificações precisam ser autorizadas no seu aparelho. Se o aviso não apareceu, verifique as Configurações do seu celular > Notificações > Navegador/Web.');
    }
  };

  const fetchLiveFeed = async () => {
    try {
      const res = await fetch(`/api/live/feed?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLiveFeed(data);
        setOnlineCount(data.activeCount || 0);

        if (Array.isArray(data.recentEvents)) {
          data.recentEvents.forEach((evt: any) => {
            if (!processedEventIdsRef.current.has(evt.id)) {
              processedEventIdsRef.current.add(evt.id);

              // Dispara se o evento tiver acontecido há menos de 30 segundos
              if (Date.now() - evt.timestamp < 30000) {
                if (evt.type === 'NEW_VISITOR') {
                  if (soundEnabled) soundManager.playVisitorDing();
                  sendBrowserNotification('🔔 Novo Cliente Online!', {
                    body: evt.description,
                  });
                  addToast({
                    id: evt.id,
                    type: 'visitor',
                    title: 'CLIENTE ONLINE AGORA!',
                    desc: evt.description,
                    city: evt.city,
                  });
                } else if (evt.type === 'NEW_ORDER') {
                  if (soundEnabled) soundManager.playCashRegister();
                  sendBrowserNotification(`💰 NOVA VENDA: $${Number(evt.amount).toFixed(2)}!`, {
                    body: evt.description,
                  });
                  addToast({
                    id: evt.id,
                    type: 'order',
                    title: 'NOVA VENDA CONFIRMADA!',
                    desc: evt.description,
                    city: evt.city,
                    amount: evt.amount,
                    orderId: evt.orderId,
                  });
                  fetchSalesData();
                  fetchSellers();
                }
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar feed ao vivo:', e);
    }
  };



  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'sales' || tab === 'orders' || tab === 'pedidos') {
        setActiveTab('sales');
      }
    }

    fetchSupabaseProducts();
    fetchSalesData();
    fetchWriteOffs();
    fetchSellers();
    fetchLiveFeed();

    const liveInterval = setInterval(fetchLiveFeed, 3500);
    return () => clearInterval(liveInterval);
  }, [soundEnabled]);

  const handleDeleteSupabaseProduct = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente excluir o produto "${title}" e todas as suas variações do Supabase?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/backoffice/products?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSaveSuccessMessage(true);
        setTimeout(() => setSaveSuccessMessage(false), 4000);
        fetchSupabaseProducts();
      } else {
        const data = await res.json();
        alert(`Erro ao excluir: ${data.error || 'Erro no servidor'}`);
      }
    } catch (err: any) {
      alert(`Falha na exclusão: ${err.message}`);
    }
  };

  const [productsMargin, setProductsMargin] = useState<ProductProfit[]>([
    {
      sku: 'SAM-BLK-P',
      title: 'Samanta Romper (Lançamento)',
      costPrice: 16.0,
      salePrice: 44.9,
      sellerCommissionRate: 10.0,
      gatewayRate: 2.9,
    },
    {
      sku: 'BAI-BLK-P',
      title: 'Best Seller Bailarina Top',
      costPrice: 12.0,
      salePrice: 34.9,
      sellerCommissionRate: 10.0,
      gatewayRate: 2.9,
    },
    {
      sku: 'MON-BLK-M',
      title: 'Monique Flare Pants - Set',
      costPrice: 19.0,
      salePrice: 49.9,
      sellerCommissionRate: 10.0,
      gatewayRate: 2.9,
    },
    {
      sku: 'KEL-BLK-M',
      title: 'Kely Pants Set (Pré-venda Sob Medida)',
      costPrice: 16.0,
      salePrice: 39.9,
      sellerCommissionRate: 10.0,
      gatewayRate: 2.9,
    },
  ]);

  const [savingCostId, setSavingCostId] = useState<string | null>(null);

  const updateCost = async (idOrSku: string, newCost: number) => {
    setProductsMargin((prev) =>
      prev.map((p) => (p.sku === idOrSku ? { ...p, costPrice: newCost } : p))
    );

    setSupabaseProducts((prev) =>
      prev.map((p) => {
        const match = p.id === idOrSku || p.sku === idOrSku || p.meta?.general_sku === idOrSku || p.variants?.[0]?.sku === idOrSku;
        if (match) {
          return {
            ...p,
            cost_price: newCost,
            costPrice: newCost,
            variants: (p.variants || []).map((v: any) => ({ ...v, cost_price: newCost, costPrice: newCost })),
          };
        }
        return p;
      })
    );

    setProducts((prev) =>
      prev.map((p) => {
        const match = p.id === idOrSku || p.sku === idOrSku;
        if (match) {
          return {
            ...p,
            costPrice: newCost,
          };
        }
        return p;
      })
    );

    const targetProduct = supabaseProducts.find(
      (p) => p.id === idOrSku || p.sku === idOrSku || p.meta?.general_sku === idOrSku || p.variants?.[0]?.sku === idOrSku
    );
    const targetId = targetProduct?.id || idOrSku;

    if (targetId && !targetId.startsWith('p') && typeof targetId === 'string' && targetId.length > 10) {
      setSavingCostId(targetId);
      try {
        await fetch('/api/backoffice/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetId, cost_price: newCost }),
        });
      } catch (err) {
        console.warn('Erro ao salvar custo no Supabase:', err);
      } finally {
        setTimeout(() => setSavingCostId(null), 1200);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => Math.max(4, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filtragem da lista de vendas (Multiperíodos e Filtros Operacionais)
  const filteredSalesList = (salesData?.sales || []).filter((s: any) => {
    // Filtro por Canal
    if (salesChannelFilter !== 'ALL' && s.channel !== salesChannelFilter) {
      return false;
    }
    // Filtro por Meio de Pagamento
    if (salesPaymentFilter !== 'ALL' && s.payment_method !== salesPaymentFilter) {
      return false;
    }
    // Filtro por Período
    if (salesPeriodFilter !== 'ALL') {
      if (!s.created_at) return false;
      const orderDate = new Date(s.created_at);
      const nyDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(orderDate);
      const nowNy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

      if (salesPeriodFilter === 'TODAY') {
        if (nyDateStr !== nowNy) return false;
      } else if (salesPeriodFilter === 'YESTERDAY') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayNy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(yesterday);
        if (nyDateStr !== yesterdayNy) return false;
      } else if (salesPeriodFilter === 'THIS_WEEK') {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
        startOfWeek.setHours(0, 0, 0, 0);
        if (orderDate < startOfWeek) return false;
      } else if (salesPeriodFilter === 'THIS_MONTH') {
        const currentMonth = nowNy.substring(0, 7);
        if (!nyDateStr.startsWith(currentMonth)) return false;
      } else if (salesPeriodFilter === 'LAST_MONTH') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const lastMonthStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d).substring(0, 7);
        if (!nyDateStr.startsWith(lastMonthStr)) return false;
      } else if (salesPeriodFilter === 'CUSTOM') {
        if (salesCustomStartDate && nyDateStr < salesCustomStartDate) return false;
        if (salesCustomEndDate && nyDateStr > salesCustomEndDate) return false;
      }
    }
    // Filtro Exclusivo de Pré-Vendas
    if (salesPreorderOnly) {
      const isPre = s.status === 'IN_PRODUCTION' || (s.items && s.items.some((i: any) => (i.title || '').toLowerCase().includes('pré-venda') || (i.title || '').toLowerCase().includes('pre-order')));
      if (!isPre) return false;
    }
    // Filtro de Busca
    if (salesSearch) {
      const q = salesSearch.toLowerCase();
      const matchOrder = s.order_id?.toLowerCase().includes(q);
      const matchCustomer = s.customer_name?.toLowerCase().includes(q);
      const matchPhone = s.customer_phone?.toLowerCase().includes(q);
      const matchDoc = s.crediario?.customer_doc?.toLowerCase().includes(q);
      const matchItem = s.items?.some((i: any) => i.title?.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q));
      if (!matchOrder && !matchCustomer && !matchPhone && !matchDoc && !matchItem) return false;
    }
    return true;
  });

  // Totais matemáticos consolidados do relatório (todas as vendas ativas filtradas)
  const filteredSalesTotals = useMemo(() => {
    const activeList = filteredSalesList.filter((s: any) => s.status !== 'CANCELLED');
    const totalSalesGross = activeList.reduce((acc: number, s: any) => acc + (Number(s.subtotal_products) || 0) + (Number(s.shipping_fee) || 0), 0);
    const totalCogs = activeList.reduce((acc: number, s: any) => acc + (Number(s.cost_of_goods) || 0), 0);
    const totalDiscounts = activeList.reduce((acc: number, s: any) => acc + (Number(s.discount_amount) || 0), 0);
    const totalFees = activeList.reduce((acc: number, s: any) => acc + (Number(s.payment_fee) || 0), 0);
    const totalCommissions = activeList.reduce((acc: number, s: any) => acc + (Number(s.commission_amount) || 0), 0);
    const totalShippingCollected = activeList.reduce((acc: number, s: any) => acc + (Number(s.shipping_fee) || 0), 0);
    const totalShippingCost = activeList.reduce((acc: number, s: any) => acc + (Number(s.shipping_cost) || 0), 0);
    const totalProfit = activeList.reduce((acc: number, s: any) => acc + (Number(s.net_profit) || 0), 0);
    const marginPct = totalSalesGross > 0 ? (totalProfit / totalSalesGross) * 100 : 0;

    return {
      count: activeList.length,
      totalSalesGross,
      totalCogs,
      totalDiscounts,
      totalFees,
      totalCommissions,
      totalShippingCollected,
      totalShippingCost,
      totalProfit,
      marginPct,
    };
  }, [filteredSalesList]);

  const getSalesPeriodLabel = () => {
    switch (salesPeriodFilter) {
      case 'TODAY': return 'Hoje';
      case 'YESTERDAY': return 'Ontem';
      case 'THIS_WEEK': return 'Esta Semana';
      case 'THIS_MONTH': return 'Este Mês';
      case 'LAST_MONTH': return 'Mês Anterior';
      case 'CUSTOM':
        return `Personalizado (${salesCustomStartDate || 'Início'} até ${salesCustomEndDate || 'Hoje'})`;
      default:
        return 'Todas as Vendas';
    }
  };

  // Exportação oficial do Relatório de Vendas em Excel (CSV)
  const handleExportSalesCsv = () => {
    if (filteredSalesList.length === 0) {
      alert('Nenhuma venda encontrada para exportar com os filtros atuais.');
      return;
    }
    const headers = [
      'Pedido',
      'Data_Hora',
      'Canal',
      'Vendedora',
      'Cliente',
      'Telefone',
      'Forma_Pagamento',
      'Valor_Venda_USD',
      'Custo_Pecas_USD',
      'Taxas_Juros_Pagas_USD',
      'Comissao_Paga_USD',
      'Desconto_Efetuado_USD',
      'Lucro_Liquido_USD',
      'Margem_Lucro_Pct',
      'Status_Entrega',
      'Status_Pagamento',
      'Itens_Comprados',
    ];
    const rows: string[] = [headers.join(',')];

    filteredSalesList.forEach((s: any) => {
      const itemsDesc = (s.items || [])
        .map((i: any) => `${i.title} (${i.color || ''} ${i.size || ''}) x${i.quantity || 1}`)
        .join('; ');
      rows.push([
        `"${s.order_id}"`,
        `"${s.created_at ? new Date(s.created_at).toLocaleString('pt-BR') : ''}"`,
        `"${s.channel === 'ONLINE' ? 'LOJA ONLINE' : 'PDV BALCAO'}"`,
        `"${(s.seller_name || '').replace(/"/g, '""')}"`,
        `"${(s.customer_name || '').replace(/"/g, '""')}"`,
        `"${s.customer_phone || ''}"`,
        `"${s.payment_method || ''}"`,
        (Number(s.subtotal_products) + Number(s.shipping_fee)).toFixed(2),
        Number(s.cost_of_goods || 0).toFixed(2),
        Number(s.payment_fee || 0).toFixed(2),
        Number(s.commission_amount || 0).toFixed(2),
        Number(s.discount_amount || 0).toFixed(2),
        Number(s.net_profit || 0).toFixed(2),
        `${s.profit_margin_pct || 0}%`,
        `"${s.fulfillment_status || 'DELIVERED'}"`,
        `"${s.payment_status || 'PAID'}"`,
        `"${itemsDesc.replace(/"/g, '""')}"`,
      ].join(','));
    });

    // Rodapé consolidado no final do CSV
    rows.push('');
    rows.push([
      '"TOTAIS DO RELATÓRIO"',
      `"${filteredSalesTotals.count} VENDAS"`,
      '""',
      '""',
      '""',
      '""',
      '""',
      filteredSalesTotals.totalSalesGross.toFixed(2),
      filteredSalesTotals.totalCogs.toFixed(2),
      filteredSalesTotals.totalFees.toFixed(2),
      filteredSalesTotals.totalCommissions.toFixed(2),
      filteredSalesTotals.totalDiscounts.toFixed(2),
      filteredSalesTotals.totalProfit.toFixed(2),
      `"${filteredSalesTotals.marginPct.toFixed(1)}%"`,
      '""',
      '""',
      '""',
    ].join(','));

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_vendas_ana_fitness_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Impressão Oficial e Geração de PDF do Relatório Gerencial
  const handlePrintSalesReportWindow = () => {
    if (typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const period = getSalesPeriodLabel();
    const rowsHtml = filteredSalesList.map((sale: any) => {
      const isOnline = sale.channel === 'ONLINE';
      const saleGross = (Number(sale.subtotal_products) + Number(sale.shipping_fee)).toFixed(2);
      const cogs = Number(sale.cost_of_goods || 0).toFixed(2);
      const fee = Number(sale.payment_fee || 0).toFixed(2);
      const commission = Number(sale.commission_amount || 0).toFixed(2);
      const discount = Number(sale.discount_amount || 0).toFixed(2);
      const profit = Number(sale.net_profit || 0).toFixed(2);
      const isCancelled = sale.status === 'CANCELLED';

      return `
        <tr style="${isCancelled ? 'text-decoration: line-through; color: #999; background: #fff1f2;' : ''}">
          <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">
            <strong>${sale.order_id}</strong><br />
            <small style="color: #666;">${sale.created_at ? new Date(sale.created_at).toLocaleDateString('pt-BR') : ''}</small>
          </td>
          <td style="padding: 6px; border: 1px solid #ddd;">
            <strong>${sale.customer_name || 'Cliente'}</strong><br />
            <small style="color: #666;">${isOnline ? 'Loja Online' : 'PDV Balcão'} • ${sale.seller_name || ''}</small>
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold; font-family: monospace;">
            ${sale.payment_method || '-'}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold;">
            $${saleGross}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">
            $${cogs}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; color: #b91c1c;">
            -$${fee}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">
            -$${commission}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; color: #b45309;">
            -$${discount}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold; color: ${Number(profit) >= 0 ? '#047857' : '#b91c1c'};">
            $${profit}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 10px;">
            ${sale.fulfillment_status === 'DELIVERED' ? 'Entregue' : sale.fulfillment_status === 'SHIPPED' ? 'Despachada' : 'Aguardando'}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 10px;">
            ${sale.payment_status === 'PAID' ? 'Quitado' : sale.payment_status === 'PARTIAL' ? 'Parcial' : 'Em Aberto'}
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Vendas - ANA FITNESS WEAR</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; color: #000; }
            .header { border-bottom: 3px solid #000; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
            .logo { font-size: 24px; font-weight: 900; letter-spacing: 1px; }
            .subtitle { font-size: 11px; color: #555; text-transform: uppercase; margin-top: 2px; }
            .summary-box { background: #f4f4f4; border: 2px solid #000; padding: 14px; margin-bottom: 20px; font-family: monospace; }
            .summary-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-top: 10px; text-align: center; }
            .summary-item { background: #fff; border: 1px solid #ccc; padding: 8px; }
            .summary-item .label { font-size: 9px; font-weight: bold; color: #666; text-transform: uppercase; }
            .summary-item .val { font-size: 15px; font-weight: 900; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { background: #000; color: #fff; padding: 8px; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
            tfoot td { background: #000; color: #fff; font-weight: 900; padding: 10px 6px; }
            @media print {
              body { padding: 0; }
              @page { size: landscape; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">ANA FITNESS WEAR</div>
              <div class="subtitle">RELATÓRIO GERENCIAL & EXTRATO DE VENDAS • LEOMINSTER, MASSACHUSETTS</div>
            </div>
            <div style="text-align: right; font-size: 11px; font-family: monospace;">
              <div><strong>PERÍODO:</strong> ${period.toUpperCase()}</div>
              <div><strong>EMISSÃO:</strong> ${new Date().toLocaleString('pt-BR')}</div>
              <div><strong>TOTAL REGISTROS:</strong> ${filteredSalesList.length}</div>
            </div>
          </div>

          <div class="summary-box">
            <div style="font-weight: 900; font-size: 12px; border-bottom: 1px solid #ccc; padding-bottom: 6px;">
              SOMA GERAL & FECHAMENTO (TOTAL DE TUDO):
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="label">Total de Venda</div>
                <div class="val">$${filteredSalesTotals.totalSalesGross.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total de Custo</div>
                <div class="val" style="color: #444;">-$${filteredSalesTotals.totalCogs.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total de Juro / Taxas</div>
                <div class="val" style="color: #b91c1c;">-$${filteredSalesTotals.totalFees.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total de Comissão</div>
                <div class="val">-$${filteredSalesTotals.totalCommissions.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total de Desconto</div>
                <div class="val" style="color: #b45309;">-$${filteredSalesTotals.totalDiscounts.toFixed(2)}</div>
              </div>
              <div class="summary-item" style="border: 2px solid #000; background: #faf5e4;">
                <div class="label" style="color: #000;">Total de Lucro Real</div>
                <div class="val" style="color: #047857;">$${filteredSalesTotals.totalProfit.toFixed(2)}</div>
                <div style="font-size: 9px; color: #555;">Margem: ${filteredSalesTotals.marginPct.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Pedido / Data</th>
                <th style="text-align: left;">Cliente & Canal</th>
                <th>Pgto</th>
                <th style="text-align: right;">Total Venda</th>
                <th style="text-align: right;">Custo Peça</th>
                <th style="text-align: right;">Taxas/Juros</th>
                <th style="text-align: right;">Comissão</th>
                <th style="text-align: right;">Desconto</th>
                <th style="text-align: right;">Lucro Real</th>
                <th>Entrega</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-transform: uppercase;">SOMA DE TUDO (${filteredSalesTotals.count} VENDAS):</td>
                <td style="text-align: right; color: #facc15;">$${filteredSalesTotals.totalSalesGross.toFixed(2)}</td>
                <td style="text-align: right;">-$${filteredSalesTotals.totalCogs.toFixed(2)}</td>
                <td style="text-align: right; color: #f87171;">-$${filteredSalesTotals.totalFees.toFixed(2)}</td>
                <td style="text-align: right;">-$${filteredSalesTotals.totalCommissions.toFixed(2)}</td>
                <td style="text-align: right; color: #fde047;">-$${filteredSalesTotals.totalDiscounts.toFixed(2)}</td>
                <td style="text-align: right; color: #4ade80; font-size: 13px;">$${filteredSalesTotals.totalProfit.toFixed(2)}</td>
                <td colspan="2" style="text-align: center; color: #facc15;">${filteredSalesTotals.marginPct.toFixed(1)}% MARGEM</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 9px; color: #666; display: flex; justify-content: space-between;">
            <span>Ana Fitness Wear • Massachusetts USA</span>
            <span>Documento gerado automaticamente pelo sistema ERP Backoffice</span>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Catálogo Base e Filtragem Avançada com Busca
  const baseCatalogList = supabaseProducts.length > 0 ? supabaseProducts : products;

  const availableCatalogCategories = Array.from(
    new Set(
      baseCatalogList
        .map((p: any) => (p.categories?.name || p.category || '').toString().trim().toUpperCase())
        .filter(Boolean)
    )
  ).sort();

  const totalCatalogCount = baseCatalogList.length;
  const activeCatalogCount = baseCatalogList.filter((p: any) => p.visible_online !== false).length;
  const hiddenCatalogCount = baseCatalogList.filter((p: any) => p.visible_online === false).length;
  const inStockCatalogCount = baseCatalogList.filter((p: any) => {
    const totalStock = p.total_stock ?? p.stock ?? (p.variants || []).reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0);
    return totalStock > 0;
  }).length;
  const outOfStockCatalogCount = baseCatalogList.filter((p: any) => {
    const totalStock = p.total_stock ?? p.stock ?? (p.variants || []).reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0);
    return totalStock <= 0;
  }).length;

  const filteredCatalogProducts = baseCatalogList.filter((item: any) => {
    const itemVariants = item.variants || (item.sizes ? item.sizes.map((sz: string) => ({
      size: sz,
      color: item.colorName || 'Preto Ônix',
      sku: `${item.sku || 'PROD'}-${sz}`,
      stock_quantity: Math.round((item.stock || 0) / item.sizes.length),
    })) : []);
    const totalStock = item.total_stock ?? item.stock ?? itemVariants.reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0);

    // Filtro por Status
    if (productStatusFilter === 'ACTIVE' && item.visible_online === false) return false;
    if (productStatusFilter === 'HIDDEN' && item.visible_online !== false) return false;
    if (productStatusFilter === 'IN_STOCK' && totalStock <= 0) return false;
    if (productStatusFilter === 'OUT_OF_STOCK' && totalStock > 0) return false;

    // Filtro por Categoria
    const cat = (item.categories?.name || item.category || '').toString().trim().toUpperCase();
    if (productCategoryFilter !== 'ALL' && cat !== productCategoryFilter) return false;

    // Busca Textual (Nome, SKU, Fornecedor, Slug, Variações)
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const skuMatch = (item.sku || '').toLowerCase().includes(q);
      const slugMatch = (item.slug || '').toLowerCase().includes(q);
      const supplierMatch = (item.suppliers?.company_name || '').toLowerCase().includes(q);
      const catMatch = cat.toLowerCase().includes(q);
      const ribbonMatch = (item.meta?.ribbon || '').toLowerCase().includes(q);
      const variantMatch = itemVariants.some((v: any) =>
        (v.sku || '').toLowerCase().includes(q) ||
        (v.color || '').toLowerCase().includes(q) ||
        (v.size || '').toLowerCase().includes(q) ||
        (v.barcode || '').toLowerCase().includes(q)
      );

      if (!titleMatch && !skuMatch && !slugMatch && !supplierMatch && !catMatch && !ribbonMatch && !variantMatch) {
        return false;
      }
    }

    return true;
  });

  // =========================================================================
  // TELA DE PROTEÇÃO / LOGIN OBRIGATÓRIO DO BACKOFFICE
  // =========================================================================
  if (!adminUser.isLoggedIn) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-white selection:bg-deep-black selection:text-gold">
        <div className="max-w-md w-full bg-white border-2 border-deep-black p-8 sm:p-10 shadow-luxury space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-deep-black text-gold border border-gold/40 shadow-sm">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <div className="inline-block px-2.5 py-0.5 bg-gold/15 text-[9px] font-black uppercase tracking-widest text-deep-black border border-gold/30">
              SISTEMA PROTEGIDO POR SENHA
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-deep-black">
              ERP BACKOFFICE • ACESSO RESTRITO
            </h1>
            <p className="text-xs text-deep-black/60 uppercase font-medium">
              ANA FITNESS WEAR LLC • GESTÃO DA PROPRIETÁRIA
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border-2 border-red-600 text-red-700 text-xs font-bold uppercase text-center animate-shake">
              ⚠️ {authError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const ok = loginAdmin(authEmail, authPass);
              if (ok) {
                setAuthError('');
                fetchSalesData();
                fetchSupabaseProducts();
              } else {
                setAuthError('Senha incorreta! Digite a senha master da loja.');
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                E-mail da Administradora / Dono
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full p-3 border-2 border-deep-black font-bold text-xs focus:outline-none focus:border-gold"
                placeholder="anafitweareua@gmail.com ou anacarinalemos.ac@gmail.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-deep-black">
                Senha Master da Loja
              </label>
              <input
                type="password"
                required
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
                className="w-full p-3 border-2 border-deep-black font-bold text-xs focus:outline-none focus:border-gold font-mono"
                placeholder="Digite sua senha..."
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-md border border-deep-black"
            >
              <Key className="w-4 h-4 text-gold" />
              <span>DESBLOQUEAR ERP & PEDIDOS</span>
            </button>
          </form>

          <div className="pt-4 border-t border-deep-black/10 text-center">
            <p className="text-[10px] text-deep-black/50 uppercase font-bold">
              🔒 Apenas você tem acesso aos dados financeiros, clientes e extratos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 bg-white selection:bg-deep-black selection:text-gold relative">
      {/* =========================================================================
          NOTIFICAÇÕES FLUTUANTES EM TEMPO REAL (ESTILO WIX LIVE NOTIFIER)
         ========================================================================= */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 border-2 shadow-2xl transition-all transform animate-fadeIn ${
              toast.type === 'order'
                ? 'bg-deep-black text-white border-gold'
                : 'bg-white text-deep-black border-deep-black'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                  {toast.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-xs hover:text-gold transition text-white/70"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-bold uppercase mt-1 leading-snug">
              {toast.desc}
            </p>
            <div className="mt-2 pt-2 border-t border-deep-black/10 flex items-center justify-between text-[10px] uppercase font-mono">
              <span className="flex items-center gap-1 text-gold font-bold">
                <MapPin className="w-3 h-3 text-gold" />
                <span>{toast.city}</span>
              </span>
              <span className="text-white/60">AGORA MESMO</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header do ERP Backoffice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-deep-black text-white p-6 sm:p-8 border border-gold/30 shadow-luxury">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-white/10 text-[10px] font-black uppercase tracking-widest text-gold border border-gold/30 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span>PAINEL MASTER • {adminUser?.name?.toUpperCase() || 'ADMINISTRADORA'}</span>
          </div>
          <span className="text-[10px] uppercase font-black text-gold tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> GESTÃO OFICIAL: CATÁLOGO, VENDAS, LUCRO REAL & ESTOQUE (USD)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider flex items-center gap-3">
            <img src="/symbol-ana-fitness.png" alt="Ana Fitness" className="w-8 h-8 object-contain" />
            <span>ERP BACKOFFICE ANA FITNESS WEAR</span>
          </h1>
          <p className="text-xs text-white/60 uppercase tracking-wider">
            Sede em Leominster, MA • Moeda oficial Dólar ($ USD) • Frete Fixo $9.99 (USPS).
          </p>
        </div>

        {/* Visitantes Online & Controles de Som/Notificação Wix */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          {/* Botão de Som On/Off */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 border transition flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
              soundEnabled
                ? 'bg-gold text-deep-black border-gold shadow'
                : 'bg-white/10 text-white/70 border-white/20 hover:text-white'
            }`}
            title={soundEnabled ? 'Som ativado (clique para silenciar)' : 'Som desativado (clique para ativar)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? 'SOM ATIVO' : 'MUDO'}</span>
          </button>

          {/* Botão de Notificações do Navegador */}
          <button
            type="button"
            onClick={handleEnableBrowserNotifications}
            className={`p-2 sm:p-2.5 border transition flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
              browserNotificationsActive
                ? 'bg-gold text-deep-black border-gold shadow-sm'
                : 'bg-white/10 text-white/80 border-white/20 hover:text-white'
            }`}
            title="Receber notificações no computador/celular"
          >
            {browserNotificationsActive ? <BellRing className="w-4 h-4 text-deep-black" /> : <Bell className="w-4 h-4 text-gold" />}
            <span className="text-[10px] sm:text-xs font-black">{browserNotificationsActive ? 'ALERTAS ATIVOS' : 'ALERTAS PUSH'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className="flex items-center gap-3 bg-white/10 border border-gold/30 px-3.5 py-2 hover:border-gold transition cursor-pointer"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
            </span>
            <div className="text-left text-xs uppercase tracking-wider">
              <span className="text-[9px] text-white/60 block font-bold">RADAR AO VIVO:</span>
              <span className="text-sm font-black text-gold font-mono">{liveFeed.activeCount} VISITANTES</span>
            </div>
          </button>

          {/* Botão de Bloquear Painel / Sair da Sessão */}
          <button
            type="button"
            onClick={logoutAdmin}
            className="p-2.5 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-500/30 transition flex items-center gap-1.5 text-xs font-black uppercase tracking-wider shadow-sm"
            title="Bloquear painel imediatamente"
          >
            <Lock className="w-4 h-4 text-red-500" />
            <span className="hidden md:inline">BLOQUEAR / SAIR</span>
          </button>
        </div>
      </div>

      {/* Banner de Ativação de Notificações Push para Celular */}
      {!browserNotificationsActive && (
        <div className="bg-amber-50 border-2 border-gold p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold text-deep-black font-black shrink-0 shadow-xs">
              <BellRing className="w-5 h-5 text-deep-black animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-deep-black tracking-wide">
                ATIVAR AVISO DE VENDAS NO CELULAR
              </p>
              <p className="text-[11px] text-deep-black/80 font-medium">
                Toque no botão ao lado para seu celular tocar o som de caixa registradora e notificar toda nova venda!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnableBrowserNotifications}
            className="px-4 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-gold shrink-0 cursor-pointer shadow-md"
          >
            <Bell className="w-4 h-4 text-gold" />
            <span>ATIVAR ALERTAS NO MEU CELULAR</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          CENTRO DE COMANDO & AÇÕES RÁPIDAS DA ADMINISTRAÇÃO (ACESSO DIRETO NO TOPO)
          Todos os botões principais concentrados no topo para nunca precisar rolar a página
         ========================================================================= */}
      <section className="bg-gradient-to-r from-deep-black via-zinc-950 to-deep-black border-2 border-gold p-4 sm:p-5 shadow-luxury space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gold/20 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-gold rounded-full animate-pulse shadow-xs" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>CENTRO DE COMANDO & AÇÕES RÁPIDAS DA ADMINISTRAÇÃO</span>
            </span>
            <span className="hidden lg:inline-block text-[9px] bg-gold/20 text-gold border border-gold/40 px-2 py-0.5 font-bold uppercase font-mono">
              PAINEL EXECUTIVO
            </span>
          </div>
          <p className="text-[11px] text-white/70 uppercase font-medium">
            Acesso instantâneo com 1 clique para todas as rotinas do negócio (sem rolar a tela)
          </p>
        </div>

        {/* Grade de Ações Rápidas de Alta Prioridade */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {/* 1. Cadastrar Novo Produto */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('catalog');
              setEditingProduct(null);
              setShowAddForm(true);
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }
            }}
            className="p-3 bg-gold hover:bg-white text-deep-black font-black text-xs uppercase tracking-wider transition flex flex-col items-center justify-center text-center gap-1.5 shadow-md border border-gold cursor-pointer group"
            title="Abrir formulário de cadastro de novo produto com grade cor x tamanho"
          >
            <PlusCircle className="w-5 h-5 text-deep-black group-hover:scale-110 transition-transform" />
            <span className="leading-tight text-[11px] font-black">+ NOVO PRODUTO</span>
            <span className="text-[8px] opacity-75 font-bold">Com Grade</span>
          </button>

          {/* 2. PDV Balcão (Venda no Showroom) */}
          <Link
            href="/pos"
            target="_blank"
            className="p-3 bg-white/10 hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-wider transition flex flex-col items-center justify-center text-center gap-1.5 border border-white/20 hover:border-gold shadow-sm group"
            title="Abrir o PDV Balcão para registrar vendas físicas no showroom"
          >
            <Store className="w-5 h-5 text-gold group-hover:text-deep-black transition-colors" />
            <span className="leading-tight text-[11px] font-black">PDV BALCÃO</span>
            <span className="text-[8px] text-gold/80 group-hover:text-deep-black/80 font-bold">Vender Agora ↗</span>
          </Link>

          {/* 3. Retirada / Uso Próprio & Brindes */}
          <button
            type="button"
            onClick={() => {
              setWriteOffModalTab('NEW');
              setShowWriteOffModal(true);
            }}
            className="p-3 bg-red-600/20 hover:bg-red-600 hover:text-white text-red-400 border border-red-500/40 hover:border-red-500 font-black text-xs uppercase tracking-wider transition flex flex-col items-center justify-center text-center gap-1.5 shadow-sm cursor-pointer group"
            title="Registrar saída de peças para uso próprio, brinde influencer ou mostruário sem custo"
          >
            <PackageMinus className="w-5 h-5 text-red-400 group-hover:text-white transition-colors" />
            <span className="leading-tight text-[11px] font-black">- RETIRADA PEÇA</span>
            <span className="text-[8px] opacity-80 font-bold">Uso Próprio/Brinde</span>
          </button>

          {/* 4. Histórico de Retiradas / Despesas */}
          <button
            type="button"
            onClick={() => {
              setWriteOffModalTab('HISTORY');
              setShowWriteOffModal(true);
            }}
            className="p-3 bg-white/5 hover:bg-white/15 text-white/90 border border-white/15 hover:border-gold/40 font-black text-xs uppercase tracking-wider transition flex flex-col items-center justify-center text-center gap-1.5 shadow-sm cursor-pointer"
            title="Ver histórico de saídas de mercadoria e total lançado como despesa"
          >
            <Receipt className="w-5 h-5 text-amber-400" />
            <span className="leading-tight text-[11px] font-black">HISTÓRICO SAÍDAS</span>
            <span className="text-[8px] text-amber-300 font-bold font-mono">
              -${(writeOffsData?.summary?.totalCostValue || 0).toFixed(2)}
            </span>
          </button>

          {/* 5. Vendas & Lucro Real */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('sales');
              fetchSalesData();
              fetchWriteOffs();
            }}
            className={`p-3 transition flex flex-col items-center justify-center text-center gap-1.5 shadow-sm border cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-gold/20 border-gold text-gold font-black'
                : 'bg-white/5 hover:bg-white/15 text-white/90 border-white/15 hover:border-gold/40'
            }`}
            title="Ir para o Painel de Vendas e Lucro Real"
          >
            <BarChart3 className="w-5 h-5 text-gold" />
            <span className="leading-tight text-[11px] font-black">VENDAS & LUCRO</span>
            <span className="text-[8px] opacity-75 font-bold font-mono">
              {salesData?.sales?.length || 0} pedidos
            </span>
          </button>

          {/* 6. Catálogo WhatsApp (PDF) */}
          <button
            type="button"
            onClick={() => setShowWhatsAppCatalogModal(true)}
            className="p-3 bg-emerald-600/20 hover:bg-[#25d366] hover:text-black text-[#25d366] border border-emerald-500/40 hover:border-[#25d366] font-black text-xs uppercase tracking-wider transition flex flex-col items-center justify-center text-center gap-1.5 shadow-sm cursor-pointer group"
            title="Gerar catálogo PDF formatado para envio no WhatsApp"
          >
            <Smartphone className="w-5 h-5 text-[#25d366] group-hover:text-black transition-colors" />
            <span className="leading-tight text-[11px] font-black">CATÁLOGO PDF</span>
            <span className="text-[8px] opacity-80 font-bold">WhatsApp</span>
          </button>

          {/* 7. Entrada de Notas / Precificação */}
          <button
            type="button"
            onClick={() => setActiveTab('finances')}
            className={`p-3 transition flex flex-col items-center justify-center text-center gap-1.5 shadow-sm border cursor-pointer ${
              activeTab === 'finances'
                ? 'bg-gold/20 border-gold text-gold font-black'
                : 'bg-white/5 hover:bg-white/15 text-white/90 border-white/15 hover:border-gold/40'
            }`}
            title="Lançar notas de confecção, despesas e calculadora de precificação"
          >
            <DollarSign className="w-5 h-5 text-gold" />
            <span className="leading-tight text-[11px] font-black">NOTAS & FINANÇAS</span>
            <span className="text-[8px] opacity-75 font-bold">DRE & Custos</span>
          </button>

          {/* 8. Vendedoras & Cupons */}
          <button
            type="button"
            onClick={() => setActiveTab('commissions')}
            className={`p-3 transition flex flex-col items-center justify-center text-center gap-1.5 shadow-sm border cursor-pointer ${
              activeTab === 'commissions'
                ? 'bg-gold/20 border-gold text-gold font-black'
                : 'bg-white/5 hover:bg-white/15 text-white/90 border-white/15 hover:border-gold/40'
            }`}
            title="Gerenciar vendedoras, cupons e comissões"
          >
            <Users className="w-5 h-5 text-gold" />
            <span className="leading-tight text-[11px] font-black">VENDEDORAS</span>
            <span className="text-[8px] opacity-75 font-bold font-mono">
              {sellers.length} cadastradas
            </span>
          </button>
        </div>

        {/* Segunda Linha de Ferramentas / Ações Secundárias */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-1.5 bg-white/5 hover:bg-gold hover:text-deep-black text-white/80 font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1.5 border border-white/15 cursor-pointer"
            >
              <Tag className="w-3 h-3 text-gold" />
              <span>+ Gerenciar Categorias</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCsvImportModal(true)}
              className="px-3 py-1.5 bg-white/5 hover:bg-gold hover:text-deep-black text-white/80 font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1.5 border border-white/15 cursor-pointer"
            >
              <Upload className="w-3 h-3 text-gold" />
              <span>Importar Planilha (Excel/CSV)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCatalogCsv}
              className="px-3 py-1.5 bg-white/5 hover:bg-white hover:text-deep-black text-white/80 font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1.5 border border-white/15 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Exportar Catálogo (.csv)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('instagram-direct')}
              className="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-600 hover:text-white text-pink-300 font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1.5 border border-pink-500/30 cursor-pointer"
            >
              <Instagram className="w-3 h-3 text-pink-400" />
              <span>Direct Instagram & Bot</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/links"
              target="_blank"
              className="px-3 py-1.5 bg-gold/10 hover:bg-gold hover:text-deep-black text-gold font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1.5 border border-gold/40"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Link da Bio (/links)</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 bg-white/10 hover:bg-white hover:text-deep-black text-white font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1.5 border border-white/20"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Ver Loja Online</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs de Navegação do Backoffice - Os 7 Pilares Profissionais */}
      <div className="flex border-b-2 border-deep-black/10 gap-2 sm:gap-4 text-xs font-black uppercase tracking-widest overflow-x-auto pb-1 scrollbar-none">
        {/* 1. Painel Geral (Dashboard & Métricas) */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'dashboard'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-gold" />
          <span>1. DASHBOARD & MÉTRICAS</span>
        </button>

        {/* 2. Gestão de Catálogo e Produtos */}
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'catalog'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Package className="w-4 h-4 text-gold" />
          <span>2. CATÁLOGO & PRODUTOS ({supabaseProducts.length || products.length})</span>
        </button>

        {/* 3. Vendas, Pedidos e Omnichannel */}
        <button
          onClick={() => {
            setActiveTab('sales');
            fetchSalesData();
          }}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'sales'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Receipt className="w-4 h-4 text-gold" />
          <span>3. PAINEL DE VENDAS & RESULTADOS</span>
          <span className="bg-gold text-deep-black text-[8px] font-black px-1.5 py-0.5 rounded-full">
            {salesData?.sales?.length || 0}
          </span>
        </button>

        {/* 4. Vendedoras, Cupons e Comissões */}
        <button
          onClick={() => setActiveTab('commissions')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'commissions'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Users className="w-4 h-4 text-gold" />
          <span>4. VENDEDORAS & CUPONS</span>
          {sellers.filter((s: any) => s.approval_status === 'PENDING').length > 0 ? (
            <span className="bg-amber-500 text-deep-black text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
              {sellers.filter((s: any) => s.approval_status === 'PENDING').length} PENDENTE(S)
            </span>
          ) : (
            <span className="bg-deep-black/10 text-deep-black text-[8px] font-bold px-1.5 py-0.5 rounded-full">
              {sellers.length}
            </span>
          )}
        </button>

        {/* 5. Financeiro da Loja */}
        <button
          onClick={() => setActiveTab('finances')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'finances'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Wallet className="w-4 h-4 text-gold" />
          <span>5. FINANCEIRO DA LOJA</span>
          <span className="bg-gold text-deep-black text-[8px] font-black px-1.5 py-0.5 rounded-full">
            COMPRAS & PREÇO
          </span>
        </button>

        {/* Fornecedores & Confecções */}
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'suppliers'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Building2 className="w-4 h-4 text-gold" />
          <span>FORNECEDORES</span>
          <span className="bg-gold text-deep-black text-[8px] font-black px-1.5 py-0.5 rounded-full">
            CONFECÇÕES
          </span>
        </button>

        {/* Relatórios de Acessos & Tráfego */}
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'reports'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-gold" />
          <span>RELATÓRIOS</span>
          <span className="bg-gold text-deep-black text-[8px] font-black px-1.5 py-0.5 rounded-full">
            ACESSOS
          </span>
        </button>

        {/* 6. Aparência da Loja (CMS Visual) */}
        <button
          onClick={() => setActiveTab('cms')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'cms'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Palette className="w-4 h-4 text-gold" />
          <span>6. APARÊNCIA DA LOJA (CMS)</span>
        </button>

        {/* 7. Clientes e Prova Social (Reviews) */}
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'customers'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Star className="w-4 h-4 text-gold" />
          <span>7. CLIENTES & REVIEWS</span>
        </button>

        {/* 8. Configurações Técnicas e Acessos */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 shrink-0 ${
            activeTab === 'settings'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Settings className="w-4 h-4 text-gold" />
          <span>8. CONFIGURAÇÕES & ACESSOS</span>
        </button>

        {/* Atalhos Rápidos */}
        <button
          onClick={() => setActiveTab('live')}
          className={`pb-3 flex items-center gap-1.5 transition border-b-2 shrink-0 ${
            activeTab === 'live'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Activity className="w-4 h-4 text-gold" />
          <span>RADAR AO VIVO</span>
        </button>

        <button
          onClick={() => setActiveTab('backorders')}
          className={`pb-3 flex items-center gap-1.5 transition border-b-2 shrink-0 ${
            activeTab === 'backorders'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <Factory className="w-4 h-4 text-gold" />
          <span>PRÉ-VENDAS</span>
        </button>

        <button
          onClick={() => setActiveTab('margins')}
          className={`pb-3 flex items-center gap-1.5 transition border-b-2 shrink-0 ${
            activeTab === 'margins'
              ? 'border-gold text-deep-black font-black'
              : 'border-transparent text-deep-black/50 hover:text-deep-black'
          }`}
        >
          <DollarSign className="w-4 h-4 text-gold" />
          <span>MARGENS</span>
        </button>

        {/* Botão de Destaque: Catálogo WhatsApp (PDF) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('whatsapp-catalog');
            setShowWhatsAppCatalogModal(true);
          }}
          className={`pb-3 flex items-center gap-1.5 transition border-b-2 shrink-0 ${
            activeTab === 'whatsapp-catalog'
              ? 'border-green-600 text-green-700 font-black'
              : 'border-transparent text-green-700 hover:text-green-900 font-black cursor-pointer'
          }`}
          title="Ver e gerar catálogo em PDF para divulgação no WhatsApp"
        >
          <Smartphone className="w-4 h-4 text-green-600" />
          <span>📲 CATÁLOGO WHATSAPP (PDF)</span>
        </button>

        {/* Botão de Destaque: Direct Instagram & Bot */}
        <button
          type="button"
          onClick={() => setActiveTab('instagram-direct')}
          className={`pb-3 flex items-center gap-1.5 transition border-b-2 shrink-0 ${
            activeTab === 'instagram-direct'
              ? 'border-pink-600 text-pink-700 font-black'
              : 'border-transparent text-pink-700 hover:text-pink-900 font-black cursor-pointer'
          }`}
          title="Atendimento do Direct do Instagram e Respostas Automáticas do Robô"
        >
          <Instagram className="w-4 h-4 text-pink-600" />
          <span>📸 DIRECT INSTAGRAM & BOT</span>
        </button>
      </div>

      {/* Notificação de Sucesso */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-950 text-emerald-100 border-2 border-emerald-500 flex items-center justify-between text-xs font-black uppercase tracking-wider animate-fadeIn shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-white">✓ Produto gravado com sucesso no Supabase! Grade de variantes persistida e catálogo atualizado.</span>
          </div>
          <Link href="/" target="_blank" className="text-emerald-400 hover:text-white underline flex items-center gap-1 font-bold">
            <span>Ver na Loja</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* =========================================================================
          TAB 1: PAINEL GERAL (DASHBOARD & MÉTRICAS)
         ========================================================================= */}
      {activeTab === 'dashboard' && (
        <DashboardMetricsView
          salesData={salesData}
          products={supabaseProducts.length > 0 ? supabaseProducts : products}
          sellers={sellers}
          liveVisitors={liveFeed?.activeCount || onlineCount}
          liveFeed={liveFeed}
          onNavigateTab={setActiveTab}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          writeOffsSummary={writeOffsData.summary}
          onOpenWriteOffModal={(tab) => {
            setWriteOffModalTab(tab || 'NEW');
            setShowWriteOffModal(true);
          }}
        />
      )}

      {/* =========================================================================
          TAB 2: CATÁLOGO & CADASTRO ÚNICO DE PRODUTOS COM GRADE
         ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-8">
          {/* Barra de Ações Superior */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-deep-black p-5">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
                <Package className="w-5 h-5 text-gold" />
                <span>CENTRAL OFICIAL DE PRODUTOS • SUPABASE INTEGRADO</span>
              </h2>
              <p className="text-xs text-deep-black/70 uppercase tracking-wide mt-0.5">
                Tela única oficial para gerenciar dados de vitrine, fotos, custos, fornecedores e matriz SKU (Cor × Tamanho).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Botão Baixar Modelo Excel / CSV */}
              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="px-3.5 py-3 border-2 border-deep-black bg-white hover:bg-gold hover:text-deep-black text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-sm"
                title="Baixar planilha modelo Excel (.xlsx) para importação em massa"
              >
                <Download className="w-3.5 h-3.5 text-gold" />
                <span>Baixar Modelo Excel (.xlsx)</span>
              </button>

              {/* Botão Exportar Catálogo Atual (CSV) */}
              <button
                type="button"
                onClick={handleExportCatalogCsv}
                className="px-3.5 py-3 border-2 border-deep-black bg-white hover:bg-gold hover:text-deep-black text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-sm"
                title="Exportar todo o catálogo cadastrado no Supabase em formato CSV"
              >
                <Download className="w-3.5 h-3.5 text-deep-black" />
                <span>Exportar Catálogo (.csv)</span>
              </button>

              {/* Botão Importar Planilha (Excel / CSV) */}
              <button
                type="button"
                onClick={() => setShowCsvImportModal(true)}
                className="px-4 py-3 bg-gold hover:bg-deep-black hover:text-white text-deep-black font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shrink-0 shadow-md border-2 border-deep-black"
                title="Importar produtos em massa a partir de um arquivo Excel (.xlsx) ou CSV"
              >
                <Upload className="w-4 h-4 text-deep-black" />
                <span>Importar Planilha (Excel / CSV)</span>
              </button>

              {/* Botão Saída / Baixa de Estoque sem Custo (Uso Próprio e Vendedoras) */}
              <button
                type="button"
                onClick={() => setShowWriteOffModal(true)}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shrink-0 shadow-md border-2 border-deep-black"
                title="Dar saída no estoque para uso próprio da dona, mostruário de vendedoras sem custo ou brindes"
              >
                <PackageMinus className="w-4 h-4 text-white" />
                <span>- RETIRADA / USO PRÓPRIO & MOSTRUÁRIO</span>
              </button>

              {/* Botão Gerar Catálogo WhatsApp (PDF) */}
              <button
                type="button"
                onClick={() => setShowWhatsAppCatalogModal(true)}
                className="px-4 py-3 bg-[#25d366] hover:bg-[#1ebd5b] text-black font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shrink-0 shadow-md border-2 border-deep-black cursor-pointer"
                title="Gerar catálogo com foto, preço original, promoção e estoque por tamanho para divulgação no WhatsApp"
              >
                <Smartphone className="w-4 h-4 text-black" />
                <span>CATÁLOGO WHATSAPP (PDF)</span>
              </button>

              {/* Botão Trocar Capas das Categorias */}
              <button
                type="button"
                onClick={() => {
                  setCmsSubTab('categories');
                  setActiveTab('cms');
                }}
                className="px-3.5 py-3 border-2 border-gold bg-gold/10 hover:bg-gold hover:text-deep-black text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-sm"
                title="Trocar fotos de capa das categorias (Sets, Rompers, Tops, etc) na página inicial"
              >
                <Layers className="w-3.5 h-3.5 text-gold" />
                <span>Capas das Categorias</span>
              </button>

              {/* Botão Gerenciar Categorias */}
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="px-3.5 py-3 border-2 border-deep-black bg-white hover:bg-gold hover:text-deep-black text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-sm cursor-pointer"
                title="Cadastrar novas categorias, excluir ou organizar o catálogo"
              >
                <Tag className="w-3.5 h-3.5 text-gold" />
                <span>+ Categorias</span>
              </button>

              <button
                type="button"
                onClick={fetchSupabaseProducts}
                className="px-3 py-3 border-2 border-deep-black hover:bg-deep-black hover:text-white text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5"
                title="Recarregar produtos do Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSupabase ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowAddForm(!showAddForm);
                }}
                className="px-5 py-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shrink-0 shadow-md border border-gold/40"
              >
                <PlusCircle className="w-4 h-4 text-gold group-hover:text-deep-black" />
                <span>{showAddForm ? 'FECHAR FORMULÁRIO' : '+ CADASTRAR NOVO PRODUTO COM GRADE'}</span>
              </button>
            </div>
          </div>

          {/* Modal de Gerenciamento de Categorias */}
          <CategoryManagementModal
            isOpen={showCategoryModal}
            onClose={() => setShowCategoryModal(false)}
            onCategoriesChanged={() => {
              fetchSupabaseProducts();
            }}
            catalogProducts={supabaseProducts.length > 0 ? supabaseProducts : products}
          />

          {/* Modal de Importação em Massa via CSV */}
          <CsvProductImportModal
            isOpen={showCsvImportModal}
            onClose={() => setShowCsvImportModal(false)}
            onSuccess={(summary) => {
              setSaveSuccessMessage(true);
              setTimeout(() => setSaveSuccessMessage(false), 5000);
              fetchSupabaseProducts();
            }}
          />

          {/* FORMULÁRIO DE CADASTRO E EDIÇÃO COM GRADE DE VARIAÇÕES (MATRIZ COR X TAMANHO) */}
          {showAddForm && (
            <div className="bg-white border-2 border-deep-black p-6 sm:p-8 shadow-luxury space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-deep-black/10 pb-4 gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                    {editingProduct ? 'EDITANDO PRODUTO E MATRIZ SKU NO SUPABASE' : 'NOVO CADASTRO DE PRODUTO & GRADE DE VARIAÇÕES'}
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-wider text-deep-black mt-1">
                    {editingProduct ? `EDITANDO: ${editingProduct.title}` : 'CADASTRO DE PRODUTO COM GRADE (MATRIZ COR × TAMANHO)'}
                  </h3>
                  <p className="text-xs text-deep-black/60 uppercase">
                    Gravação direta no banco de dados Supabase (tabelas <strong>'products'</strong> e <strong>'product_variants'</strong>).
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Seletor Rápido de Produtos para Editar ou Alternar */}
                  <div className="flex items-center gap-1.5 bg-warm-light/40 px-2.5 py-1.5 border-2 border-deep-black shadow-xs">
                    <Search className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span className="text-[9px] font-black uppercase text-deep-black/70 shrink-0">LOCALIZAR:</span>
                    <select
                      value={editingProduct?.id || ''}
                      onChange={(e) => {
                        const selId = e.target.value;
                        if (!selId) {
                          setEditingProduct(null);
                        } else {
                          const found = baseCatalogList.find((p: any) => p.id === selId);
                          if (found) {
                            const itemVariants = found.variants || (found.sizes ? found.sizes.map((sz: string) => ({
                              size: sz,
                              color: found.colorName || 'Preto Ônix',
                              sku: `${found.sku || 'PROD'}-${sz}`,
                              stock_quantity: Math.round((found.stock || 0) / found.sizes.length),
                            })) : []);
                            const firstImage = itemVariants[0]?.images?.[0] || found.primaryImage || found.primary_image || found.meta?.primary_image || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';
                            setEditingProduct({
                              ...found,
                              variants: itemVariants,
                              primaryImage: firstImage,
                              primary_image: firstImage,
                              images: found.images || found.galleryImages || found.meta?.images || found.meta?.gallery || (firstImage ? [firstImage] : []),
                            });
                          }
                        }
                      }}
                      className="bg-transparent text-xs font-bold text-deep-black uppercase focus:outline-none cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
                    >
                      <option value="">-- NOVO CADASTRO EM BRANCO --</option>
                      {baseCatalogList.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.sku || p.category || 'SEM SKU'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProduct(null);
                    }}
                    className="text-xs font-black uppercase px-3.5 py-2 border-2 border-deep-black hover:bg-deep-black hover:text-white transition shadow-xs"
                  >
                    ✕ FECHAR
                  </button>
                </div>
              </div>

              {/* Componente Modular de Grade de Variações */}
              <ProductVariantMatrixForm
                key={editingProduct?.id || 'new-product'}
                initialProduct={editingProduct}
                onSaveSuccess={(saved) => {
                  setShowAddForm(false);
                  setEditingProduct(null);
                  setSaveSuccessMessage(true);
                  setTimeout(() => setSaveSuccessMessage(false), 5000);
                  if (saved?.product) {
                    setSupabaseProducts((prev) => {
                      const idx = prev.findIndex((p: any) => p.id === saved.product.id);
                      if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], ...saved.product, variants: saved.variants || copy[idx].variants };
                        return copy;
                      }
                      return [saved.product, ...prev];
                    });
                  }
                  fetchSupabaseProducts();
                }}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingProduct(null);
                }}
              />
            </div>
          )}

          {/* BARRA DE PESQUISA E FILTROS DO CATÁLOGO DE PRODUTOS */}
          <div className="bg-white border-2 border-deep-black p-4 space-y-3 shadow-sm">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Campo de Busca Rápida com Ícone e Botão Limpar */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="DIGITE O NOME DO PRODUTO, SKU, CATEGORIA, FORNECEDOR OU COR/TAMANHO..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 text-xs uppercase tracking-wider border-2 border-deep-black/30 focus:border-deep-black focus:outline-none font-bold placeholder:text-deep-black/40 bg-warm-light/20"
                />
                <Search className="w-4 h-4 text-deep-black/50 absolute left-3 top-3" />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-2.5 p-1 hover:bg-deep-black/10 text-deep-black/60 hover:text-deep-black"
                    title="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtro de Categoria */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 border border-deep-black/30 px-3 py-2 bg-warm-light/20 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-gold" />
                  <span className="text-[10px] font-black uppercase text-deep-black/60">CATEGORIA:</span>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="text-xs font-black uppercase bg-transparent border-0 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">TODAS AS CATEGORIAS ({totalCatalogCount})</option>
                    {availableCatalogCategories.map((cat) => {
                      const count = baseCatalogList.filter((p: any) => (p.categories?.name || p.category || '').toString().trim().toUpperCase() === cat).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Pílulas de Filtro Rápido de Status */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-deep-black/10">
              <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/50 mr-1">STATUS:</span>
              <button
                type="button"
                onClick={() => setProductStatusFilter('ALL')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition ${
                  productStatusFilter === 'ALL'
                    ? 'bg-deep-black text-white border-deep-black'
                    : 'bg-white text-deep-black/70 border-deep-black/20 hover:border-deep-black'
                }`}
              >
                TODOS ({totalCatalogCount})
              </button>
              <button
                type="button"
                onClick={() => setProductStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition flex items-center gap-1 ${
                  productStatusFilter === 'ACTIVE'
                    ? 'bg-green-700 text-white border-green-800'
                    : 'bg-white text-green-700 border-green-300 hover:border-green-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>NO AR NA LOJA ({activeCatalogCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setProductStatusFilter('HIDDEN')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition flex items-center gap-1 ${
                  productStatusFilter === 'HIDDEN'
                    ? 'bg-gray-800 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-700'
                }`}
              >
                <span>OCULTOS ({hiddenCatalogCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setProductStatusFilter('IN_STOCK')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition ${
                  productStatusFilter === 'IN_STOCK'
                    ? 'bg-deep-black text-white border-deep-black'
                    : 'bg-white text-deep-black/70 border-deep-black/20 hover:border-deep-black'
                }`}
              >
                EM ESTOQUE ({inStockCatalogCount})
              </button>
              <button
                type="button"
                onClick={() => setProductStatusFilter('OUT_OF_STOCK')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border transition ${
                  productStatusFilter === 'OUT_OF_STOCK'
                    ? 'bg-gold text-deep-black border-deep-black font-black'
                    : 'bg-white text-gold border-gold/40 hover:border-gold'
                }`}
              >
                PRÉ-VENDA / ZERADOS ({outOfStockCatalogCount})
              </button>

              {(productSearch || productCategoryFilter !== 'ALL' || productStatusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setProductSearch('');
                    setProductCategoryFilter('ALL');
                    setProductStatusFilter('ALL');
                  }}
                  className="ml-auto px-2 py-1 text-[9px] font-black uppercase text-red-600 hover:bg-red-50 border border-red-200 transition"
                >
                  ✕ LIMPAR FILTROS
                </button>
              )}
            </div>
          </div>

          {/* Tabela de Produtos Cadastrados no Catálogo */}
          <div className="bg-white border-2 border-deep-black overflow-x-auto shadow-sm">
            <div className="p-4 bg-deep-black/5 border-b border-deep-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-gold" />
                <span className="text-xs font-black uppercase tracking-wider text-deep-black">
                  PRODUTOS CADASTRADOS NO ERP (TABELAS 'PRODUCTS' & 'PRODUCT_VARIANTS')
                </span>
              </div>
              <span className="text-[10px] font-mono text-deep-black/60 uppercase font-bold">
                {productSearch || productCategoryFilter !== 'ALL' || productStatusFilter !== 'ALL'
                  ? `EXIBINDO ${filteredCatalogProducts.length} DE ${totalCatalogCount} PRODUTOS`
                  : `${totalCatalogCount} PRODUTOS NO ERP`}
              </span>
            </div>

            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black text-white text-[10px] font-black">
                <tr>
                  <th className="p-4">FOTO</th>
                  <th className="p-4">PRODUTO & FORNECEDOR</th>
                  <th className="p-4">GRADE DE VARIAÇÕES (COR × TAMANHO)</th>
                  <th className="p-4">PREÇO DE VENDA</th>
                  <th className="p-4">CUSTO</th>
                  <th className="p-4">ESTOQUE TOTAL</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4">VISIBILIDADE NA LOJA</th>
                  <th className="p-4 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {filteredCatalogProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center bg-warm-light/10">
                      <div className="max-w-md mx-auto space-y-2">
                        <Search className="w-8 h-8 text-deep-black/30 mx-auto" />
                        <p className="text-sm font-black uppercase text-deep-black">
                          NENHUM PRODUTO ENCONTRADO COM ESSES TERMOS
                        </p>
                        <p className="text-xs text-deep-black/60 uppercase">
                          {productSearch ? `Nenhum resultado para "${productSearch}".` : 'Nenhum produto atende aos filtros de categoria/status selecionados.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearch('');
                            setProductCategoryFilter('ALL');
                            setProductStatusFilter('ALL');
                          }}
                          className="mt-3 px-4 py-2 bg-deep-black text-white hover:bg-gold hover:text-deep-black text-xs font-black uppercase tracking-wider transition border border-deep-black shadow-sm"
                        >
                          LIMPAR BUSCA E RESTAURAR LISTA
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCatalogProducts.map((item: any) => {
                  const itemVariants = item.variants || (item.sizes ? item.sizes.map((sz: string) => ({
                    size: sz,
                    color: item.colorName || 'Preto Ônix',
                    sku: `${item.sku || 'PROD'}-${sz}`,
                    stock_quantity: Math.round((item.stock || 0) / item.sizes.length),
                  })) : []);

                  const totalStock = item.total_stock ?? item.stock ?? itemVariants.reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0);
                  const firstImage = itemVariants[0]?.images?.[0] || item.primaryImage || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80';
                  const supplierName = item.suppliers?.company_name || 'Confecções FitPro Brasil';
                  const categoryName = item.categories?.name || item.category || 'CONJUNTOS';
                  const basePrice = itemVariants[0]?.price ?? item.price ?? 44.9;
                  const baseCost = itemVariants[0]?.cost_price ?? item.costPrice ?? 16.0;

                  return (
                    <tr key={item.id} className="hover:bg-deep-black/5">
                      <td className="p-4">
                        <div className="w-12 aspect-[4/5] bg-deep-black/10 overflow-hidden border border-deep-black/20 relative">
                          <img src={firstImage} alt={item.title} className="w-full h-full object-cover" />
                          {itemVariants.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-deep-black text-gold text-[7px] font-black px-1">
                              {itemVariants.length}v
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-deep-black block">{item.title}</span>
                          {item.meta?.ribbon && (
                            <span className="px-1.5 py-0.5 bg-gold text-deep-black text-[8px] font-black uppercase border border-deep-black">
                              {item.meta.ribbon}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gold font-bold">{categoryName}</span>
                          <span className="text-deep-black/30">•</span>
                          <span className="text-[9px] text-deep-black/60 font-bold truncate max-w-[140px]" title={supplierName}>
                            {supplierName}
                          </span>
                          {(item.meta?.general_sku || item.sku) && (
                            <>
                              <span className="text-deep-black/30">•</span>
                              <span className="text-[8.5px] font-mono text-deep-black/50">
                                SKU: {item.meta?.general_sku || item.sku}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {itemVariants.map((vr: any, vIdx: number) => (
                            <span
                              key={vIdx}
                              className={`text-[8px] font-mono font-black px-1.5 py-0.5 border flex items-center gap-1 ${
                                (vr.stock_quantity || 0) > 0
                                    ? 'bg-deep-black/5 text-deep-black border-deep-black/20'
                                    : 'bg-gold/10 text-deep-black border-gold/40'
                              }`}
                              title={`SKU: ${vr.sku || 'N/A'} | Estoque: ${vr.stock_quantity ?? 0} unid`}
                            >
                              <span>{vr.color?.slice(0, 4) || 'COR'}-{vr.size}</span>
                              <span className="text-deep-black/50">({vr.stock_quantity ?? 0})</span>
                            </span>
                          ))}
                          {itemVariants.length === 0 && (
                            <span className="text-[9px] text-deep-black/40">Sem grade gerada</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-mono font-black text-deep-black">
                        <div>
                          <span>${Number(basePrice).toFixed(2)}</span>
                          {item.meta?.compare_price && Number(item.meta.compare_price) > Number(basePrice) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-deep-black/40 line-through">
                                ${Number(item.meta.compare_price).toFixed(2)}
                              </span>
                              <span className="text-[8px] bg-red-600 text-white font-black px-1">
                                -{Math.round(((Number(item.meta.compare_price) - Number(basePrice)) / Number(item.meta.compare_price)) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-mono text-deep-black/70">
                        <div className="flex items-center gap-1">
                          <span>$</span>
                          <input
                            type="number"
                            step="0.5"
                            value={Number(baseCost)}
                            onChange={(e) => updateCost(item.id, parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 border border-deep-black/20 hover:border-deep-black text-xs font-mono font-bold bg-white focus:outline-none focus:border-gold"
                            title="Preço de Custo (atualiza automaticamente no Supabase)"
                          />
                          {savingCostId === item.id && (
                            <span className="text-[8px] text-green-700 font-black animate-pulse">✓</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold">
                        <span className={totalStock > 0 ? 'text-deep-black' : 'text-gold'}>
                          {totalStock} UNID.
                        </span>
                      </td>

                      <td className="p-4">
                        {totalStock > 0 ? (
                          <span className="px-2 py-0.5 bg-deep-black text-white text-[9px] font-black border border-deep-black inline-block">
                            PRONTA ENTREGA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-deep-black text-gold text-[9px] font-black border border-gold inline-block">
                            PRÉ-VENDA (30 DIAS)
                          </span>
                        )}
                      </td>

                      {/* VISIBILIDADE NA VITRINE / CONTROLE RÁPIDO */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {item.visible_online ? (
                            <span className="px-2 py-0.5 bg-green-700 text-white text-[9px] font-black border border-green-800 flex items-center gap-1 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              <span>NO AR NA LOJA</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[9px] font-black border border-gray-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                              <span>OCULTO / RASCUNHO</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(item.id, !item.visible_online)}
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 border transition flex items-center gap-1 ${
                              item.visible_online
                                ? 'border-red-300 text-red-600 hover:bg-red-600 hover:text-white'
                                : 'border-deep-black bg-deep-black text-gold hover:bg-gold hover:text-deep-black shadow-xs'
                            }`}
                            title={item.visible_online ? 'Ocultar da vitrine da loja virtual' : 'Publicar na vitrine da loja virtual'}
                          >
                            {item.visible_online ? '✕ Ocultar do Site' : '✓ Ativar na Vitrine'}
                          </button>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct({
                                ...item,
                                cost_price: baseCost,
                                costPrice: baseCost,
                                variants: itemVariants,
                                primaryImage: item.primaryImage || item.primary_image || item.meta?.primary_image || firstImage,
                                primary_image: item.primary_image || item.primaryImage || item.meta?.primary_image || firstImage,
                                images: item.images || item.galleryImages || item.meta?.images || item.meta?.gallery || (firstImage ? [firstImage] : []),
                              });
                              setShowAddForm(true);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="p-1.5 border border-deep-black hover:bg-deep-black hover:text-white transition flex items-center gap-1 text-[10px] font-black"
                            title="Editar Produto e Grade no Supabase"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-gold" />
                            <span>EDITAR</span>
                          </button>

                          {item.id && !item.id.startsWith('p') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSupabaseProduct(item.id, item.title)}
                              className="p-1.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white transition"
                              title="Excluir do Supabase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <Link
                            href={`/produto/${item.slug || 'samanta-romper'}`}
                            target="_blank"
                            className="p-1.5 bg-white border border-deep-black hover:bg-gold hover:text-deep-black text-deep-black font-black text-[10px] transition inline-flex items-center gap-1"
                            title="Ver produto na vitrine pública"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PAINEL DE VENDAS & RESULTADOS (4 MÉTRICAS PRIORITÁRIAS DA ANA CARINA)
         ========================================================================= */}
      {activeTab === 'sales' && (() => {
        const allSales = (salesData?.sales || []) as any[];
        const activeSales = allSales.filter((s: any) => s.status !== 'CANCELLED');

        // Fuso de Massachusetts (EDT / EST)
        const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
        const currentMonthStr = todayStr.substring(0, 7);

        // 1. Venda do Dia (Hoje)
        const todayOrders = activeSales.filter((s: any) => {
          if (!s.created_at) return false;
          const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(s.created_at));
          return dStr === todayStr;
        });
        const todayRevenue = todayOrders.reduce((acc: number, s: any) => acc + (Number(s.subtotal_products) || 0) + (Number(s.shipping_fee) || 0), 0);
        const todayProfit = todayOrders.reduce((acc: number, s: any) => acc + (Number(s.net_profit) || 0), 0);

        // 2. Acumulado do Mês
        const monthOrders = activeSales.filter((s: any) => {
          if (!s.created_at) return false;
          const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(s.created_at));
          return dStr.startsWith(currentMonthStr);
        });
        const monthRevenue = monthOrders.reduce((acc: number, s: any) => acc + (Number(s.subtotal_products) || 0) + (Number(s.shipping_fee) || 0), 0);
        const monthProfit = monthOrders.reduce((acc: number, s: any) => acc + (Number(s.net_profit) || 0), 0);

        // 3. O Meu Lucro
        const totalNetProfit = salesData?.summary?.totalNetProfit ?? activeSales.reduce((acc: number, s: any) => acc + (Number(s.net_profit) || 0), 0);
        const totalGrossRevenue = salesData?.summary?.totalGrossRevenue ?? activeSales.reduce((acc: number, s: any) => acc + (Number(s.subtotal_products) || 0) + (Number(s.shipping_fee) || 0), 0);

        // 3.1 Despesas de Produtos Retirados (Uso Próprio, Brindes, Influencers, Mostruário)
        const totalWriteOffCost = writeOffsData?.summary?.totalCostValue || 0;
        const totalWriteOffPieces = writeOffsData?.summary?.totalItemsWithdrawn || 0;
        const totalWriteOffDocs = writeOffsData?.summary?.totalDocuments || 0;
        const finalNetProfitInPocket = totalNetProfit - totalWriteOffCost;
        const avgMarginPct = totalGrossRevenue > 0 ? ((finalNetProfitInPocket / totalGrossRevenue) * 100).toFixed(1) : '0.0';

        // 4. Os Itens Entregues
        const deliveredOrders = activeSales.filter((s: any) => s.status === 'DELIVERED' || s.status === 'COMPLETED');
        const totalDeliveredPieces = deliveredOrders.reduce((sum: number, s: any) => {
          const pieces = (s.items || []).reduce((pSum: number, item: any) => pSum + (Number(item.quantity) || 1), 0);
          return sum + pieces;
        }, 0);
        const totalDeliveredOrdersCount = deliveredOrders.length;

        return (
          <div className="space-y-8 animate-fadeIn">
            {/* Banner Conceitual de Transparência Financeira */}
            <div className="bg-deep-black text-white border-2 border-gold p-6 sm:p-8 space-y-3 shadow-luxury">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                    PAINEL EXECUTIVO DE VENDAS & RESULTADOS • MOEDA USD ($)
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-gold" />
                    <span>MEUS RESULTADOS CONSOLIDADOS</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setShowSalesReportModal(true)}
                    className="px-3.5 py-2 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>RELATÓRIO & FECHAMENTO</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportSalesCsv}
                    className="px-3 py-2 bg-white/10 hover:bg-white hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
                    title="Baixar planilha Excel com extrato e fechamento"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXCEL (CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintSalesReportWindow}
                    className="px-3 py-2 bg-white/10 hover:bg-white hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
                    title="Imprimir relatório gerencial com soma de tudo"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>IMPRIMIR / PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetchSalesData();
                      fetchWriteOffs();
                    }}
                    className="px-3 py-2 border border-gold hover:bg-gold hover:text-deep-black text-gold text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSales ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">ATUALIZAR</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 text-xs text-white/80 uppercase font-mono tracking-wide leading-relaxed bg-white/5 p-4 border border-white/10">
                <span className="text-gold font-black">FÓRMULA EXATA DE LUCRO LÍQUIDO NO SEU BOLSO: </span>
                <span>
                  (Receita de Peças + Fretes Cobrados $9.99) - Custo das Peças (COGS) - Taxas Gateway (Stripe/Venmo) - Custo Envio USPS ($7.50) - Comissões Vendedoras (10%) - <strong className="text-amber-300">Despesas Produtos Retirados (Uso Próprio/Brindes)</strong> ={' '}
                </span>
                <strong className="text-gold font-black underline">LUCRO REAL NO SEU BOLSO ($ USD)</strong>
              </div>
            </div>

            {/* =========================================================================
                AS 5 MÉTRICAS PRIORITÁRIAS DA ANA CARINA
                1. Venda do Dia | 2. Acumulado do Mês | 3. O Meu Lucro | 4. Produtos Retirados | 5. Itens Entregues
               ========================================================================= */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-deep-black flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-gold inline-block" />
                  <span>SEUS 5 RESULTADOS PRINCIPAIS</span>
                </span>
                <span className="text-[10px] text-deep-black/60 font-mono font-bold uppercase">
                  Fuso Leominster/MA (EDT)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. VENDA DO DIA */}
                <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 text-gold" />
                        <span>1. VENDA DO DIA</span>
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase font-mono border border-emerald-300">
                        HOJE
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-deep-black font-mono mt-2">
                      ${todayRevenue.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-deep-black/60 uppercase font-bold mt-1">
                      {todayOrders.length === 1 ? '1 pedido registrado hoje' : `${todayOrders.length} pedidos registrados hoje`}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-deep-black/10 flex items-center justify-between text-[10px]">
                    <span className="text-deep-black/60 font-bold uppercase">Lucro Hoje:</span>
                    <span className="font-mono font-black text-emerald-700">
                      ${todayProfit.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 2. ACUMULADO DO MÊS */}
                <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-gold" />
                        <span>2. ACUMULADO DO MÊS</span>
                      </span>
                      <span className="px-1.5 py-0.5 bg-gold/20 text-deep-black border border-gold/40 text-[9px] font-black uppercase font-mono">
                        MÊS CORRENTE
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-deep-black font-mono mt-2">
                      ${monthRevenue.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-deep-black/60 uppercase font-bold mt-1">
                      {monthOrders.length === 1 ? '1 pedido acumulado no mês' : `${monthOrders.length} pedidos acumulados no mês`}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-deep-black/10 flex items-center justify-between text-[10px]">
                    <span className="text-deep-black/60 font-bold uppercase">Lucro no Mês:</span>
                    <span className="font-mono font-black text-deep-black">
                      ${monthProfit.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 3. O MEU LUCRO (DESTAQUE OURO E PRETO) */}
                <div className="bg-deep-black text-white border-2 border-gold p-5 space-y-2 shadow-luxury flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-gold" />
                        <span>3. O MEU LUCRO</span>
                      </span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gold text-deep-black text-[9px] font-black uppercase">
                        <Sparkles className="w-2.5 h-2.5 text-deep-black" />
                        <span>NO SEU BOLSO</span>
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-gold font-mono mt-2">
                      ${finalNetProfitInPocket.toFixed(2)}
                    </div>
                    <div className="space-y-0.5 mt-2 text-[10px] uppercase font-mono border-t border-gold/20 pt-1.5">
                      <div className="flex justify-between text-white/70">
                        <span>Lucro das Vendas:</span>
                        <span className="font-bold text-white">${totalNetProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-amber-300">
                        <span>(-) Produtos Retirados:</span>
                        <span className="font-bold text-amber-300">-${totalWriteOffCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gold/30 flex items-center justify-between text-[10px]">
                    <span className="text-white/60 font-bold uppercase">Margem Real Final:</span>
                    <span className="font-mono font-black text-gold">
                      {avgMarginPct}%
                    </span>
                  </div>
                </div>

                {/* 4. DESPESAS DE PRODUTOS RETIRADOS */}
                <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-red-500 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 flex items-center gap-1.5">
                        <PackageMinus className="w-4 h-4 text-red-600" />
                        <span>4. PRODUTOS RETIRADOS</span>
                      </span>
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-800 border border-red-300 text-[9px] font-black uppercase font-mono">
                        DESPESA
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-red-600 font-mono mt-2">
                      -${totalWriteOffCost.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-deep-black/70 uppercase font-bold mt-1">
                      {totalWriteOffPieces} peça(s) retirada(s) ({totalWriteOffDocs} baixas)
                    </p>
                    <p className="text-[10px] text-deep-black/50 uppercase mt-0.5">
                      Uso próprio, brindes, influencer e mostruário
                    </p>
                  </div>
                  <div className="pt-2 border-t border-deep-black/10 flex items-center justify-between text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setWriteOffModalTab('HISTORY');
                        setShowWriteOffModal(true);
                      }}
                      className="font-black uppercase text-red-700 hover:text-deep-black underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Extrato</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWriteOffModalTab('NEW');
                        setShowWriteOffModal(true);
                      }}
                      className="text-[9px] font-black uppercase bg-deep-black hover:bg-gold hover:text-deep-black text-white px-2 py-1 shadow-xs cursor-pointer"
                    >
                      + Lançar Saída
                    </button>
                  </div>
                </div>

                {/* 5. ITENS ENTREGUES */}
                <div className="bg-white border-2 border-deep-black p-5 space-y-2 shadow-sm hover:border-gold transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>5. ITENS ENTREGUES</span>
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black uppercase font-mono">
                        CONCLUÍDOS
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-deep-black font-mono mt-2">
                      {totalDeliveredPieces} <span className="text-sm font-black text-deep-black/60 uppercase">peças</span>
                    </div>
                    <p className="text-[11px] text-deep-black/60 uppercase font-bold mt-1">
                      {totalDeliveredOrdersCount === 1 ? '1 pedido entregue com sucesso' : `${totalDeliveredOrdersCount} pedidos entregues com sucesso`}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-deep-black/10 flex items-center justify-between text-[10px]">
                    <span className="text-deep-black/60 font-bold uppercase">Taxa de Conclusão:</span>
                    <span className="font-mono font-black text-emerald-700">
                      {activeSales.length > 0 ? `${Math.round((totalDeliveredOrdersCount / activeSales.length) * 100)}% dos pedidos` : '100%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DRE SIMPLIFICADO: DEDUÇÕES OPERACIONAIS & DETALHE DE CUSTOS */}
            <div className="bg-white border-2 border-deep-black p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-deep-black/10 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/70 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-gold" />
                  <span>DRE OPERACIONAL • ONDE CADA DÓLAR FOI ALOCADO</span>
                </span>
                <span className="text-[9px] font-mono text-deep-black/50 uppercase">
                  Total Faturado Bruto: ${totalGrossRevenue.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {/* COGS */}
                <div className="p-3 bg-deep-black/5 border border-deep-black/10 space-y-1">
                  <span className="text-[9px] font-black uppercase text-deep-black/60 block">CUSTO PEÇAS (COGS)</span>
                  <p className="text-lg font-black text-deep-black font-mono">
                    -${(salesData?.summary?.totalCostOfGoods || 0).toFixed(2)}
                  </p>
                  <span className="text-[8px] text-deep-black/50 uppercase font-bold block">Confecção & Tecido</span>
                </div>

                {/* Fretes Cobrados */}
                <div className="p-3 bg-deep-black/5 border border-deep-black/10 space-y-1">
                  <span className="text-[9px] font-black uppercase text-deep-black/60 block">FRETES RECOLHIDOS</span>
                  <p className="text-lg font-black text-emerald-700 font-mono">
                    +${(salesData?.summary?.totalShippingCollected || 0).toFixed(2)}
                  </p>
                  <span className="text-[8px] text-deep-black/50 uppercase font-bold block">
                    Custo USPS: -${(salesData?.summary?.totalShippingCost || 0).toFixed(2)}
                  </span>
                </div>

                {/* Taxas Gateway */}
                <div className="p-3 bg-deep-black/5 border border-deep-black/10 space-y-1">
                  <span className="text-[9px] font-black uppercase text-deep-black/60 block">TAXAS GATEWAYS</span>
                  <p className="text-lg font-black text-red-600 font-mono">
                    -${(salesData?.summary?.totalPaymentFees || 0).toFixed(2)}
                  </p>
                  <span className="text-[8px] text-deep-black/50 uppercase font-bold block">Stripe, Venmo, Cartão</span>
                </div>

                {/* Comissões */}
                <div className="p-3 bg-deep-black/5 border border-deep-black/10 space-y-1">
                  <span className="text-[9px] font-black uppercase text-deep-black/60 block">COMISSÕES VENDEDORAS</span>
                  <p className="text-lg font-black text-deep-black font-mono">
                    -${(salesData?.summary?.totalCommissions || 0).toFixed(2)}
                  </p>
                  <span className="text-[8px] text-deep-black/50 uppercase font-bold block">Equipe balcão / afiliadas</span>
                </div>

                {/* Despesas de Retiradas */}
                <div className="p-3 bg-red-50 border border-red-200 space-y-1">
                  <span className="text-[9px] font-black uppercase text-red-800 block">PRODUTOS RETIRADOS</span>
                  <p className="text-lg font-black text-red-600 font-mono">
                    -${totalWriteOffCost.toFixed(2)}
                  </p>
                  <span className="text-[8px] text-red-700 uppercase font-bold block">Uso Próprio & Brindes</span>
                </div>

                {/* Lucro Retido */}
                <div className="p-3 bg-gold/10 border border-gold/40 space-y-1">
                  <span className="text-[9px] font-black uppercase text-deep-black/60 block">MARGEM LÍQUIDA</span>
                  <p className="text-lg font-black text-deep-black font-mono">
                    {avgMarginPct}%
                  </p>
                  <span className="text-[8px] text-deep-black/60 uppercase font-bold block">Retenção líquida real</span>
                </div>
              </div>
            </div>

          {/* PAINÉIS DE BREAKDOWN ANALÍTICO: FORMAS DE PAGAMENTO & CANAIS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Breakdown por Forma de Pagamento nos EUA */}
            <div className="lg:col-span-7 bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gold" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
                    BREAKDOWN POR FORMA DE PAGAMENTO (EUA)
                  </h3>
                </div>
                <span className="text-[10px] text-deep-black/60 uppercase font-mono font-bold">
                  TAXAS DEDUZIDAS NA FONTE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* ZELLE */}
                <div className="p-3 bg-deep-black/5 border border-deep-black/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-deep-black">ZELLE</span>
                    <span className="text-[8px] bg-green-100 text-green-800 font-black px-1 border border-green-300">
                      0% TAXA
                    </span>
                  </div>
                  <p className="text-base font-black text-deep-black font-mono">
                    ${(salesData?.paymentBreakdown?.ZELLE?.total || 0).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-deep-black/60 uppercase font-bold">
                    Líquido: ${(salesData?.paymentBreakdown?.ZELLE?.net || 0).toFixed(2)}
                  </p>
                  <span className="text-[8px] text-deep-black/40 block font-mono">
                    {salesData?.paymentBreakdown?.ZELLE?.count || 0} pedidos
                  </span>
                </div>

                {/* VENMO */}
                <div className="p-3 bg-deep-black/5 border border-deep-black/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-deep-black">VENMO</span>
                    <span className="text-[8px] bg-blue-100 text-blue-800 font-black px-1 border border-blue-300">
                      1.9% TAXA
                    </span>
                  </div>
                  <p className="text-base font-black text-deep-black font-mono">
                    ${(salesData?.paymentBreakdown?.VENMO?.total || 0).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-red-600 uppercase font-bold">
                    Taxas: -${(salesData?.paymentBreakdown?.VENMO?.fees || 0).toFixed(2)}
                  </p>
                  <span className="text-[8px] text-deep-black/40 block font-mono">
                    {salesData?.paymentBreakdown?.VENMO?.count || 0} pedidos
                  </span>
                </div>

                {/* CARD / STRIPE */}
                <div className="p-3 bg-deep-black/5 border border-deep-black/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-deep-black">CARTÃO</span>
                    <span className="text-[8px] bg-amber-100 text-amber-900 font-black px-1 border border-amber-300">
                      2.9%+$0.30
                    </span>
                  </div>
                  <p className="text-base font-black text-deep-black font-mono">
                    ${(salesData?.paymentBreakdown?.CARD?.total || 0).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-red-600 uppercase font-bold">
                    Taxas: -${(salesData?.paymentBreakdown?.CARD?.fees || 0).toFixed(2)}
                  </p>
                  <span className="text-[8px] text-deep-black/40 block font-mono">
                    {salesData?.paymentBreakdown?.CARD?.count || 0} pedidos
                  </span>
                </div>

                {/* CASH */}
                <div className="p-3 bg-deep-black/5 border border-deep-black/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-deep-black">CASH (ESPÉCIE)</span>
                    <span className="text-[8px] bg-green-100 text-green-800 font-black px-1 border border-green-300">
                      0% TAXA
                    </span>
                  </div>
                  <p className="text-base font-black text-deep-black font-mono">
                    ${(salesData?.paymentBreakdown?.CASH?.total || 0).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-deep-black/60 uppercase font-bold">
                    Líquido: ${(salesData?.paymentBreakdown?.CASH?.net || 0).toFixed(2)}
                  </p>
                  <span className="text-[8px] text-deep-black/40 block font-mono">
                    {salesData?.paymentBreakdown?.CASH?.count || 0} pedidos
                  </span>
                </div>

                {/* CREDIÁRIO */}
                <div className="p-3 bg-deep-black/5 border border-deep-black/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-deep-black">CREDIÁRIO</span>
                    <span className="text-[8px] bg-amber-100 text-amber-900 font-black px-1 border border-amber-300">
                      0% TAXA
                    </span>
                  </div>
                  <p className="text-base font-black text-deep-black font-mono">
                    ${(salesData?.paymentBreakdown?.CREDIARIO?.total || 0).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-deep-black/60 uppercase font-bold">
                    Líquido: ${(salesData?.paymentBreakdown?.CREDIARIO?.net || 0).toFixed(2)}
                  </p>
                  <span className="text-[8px] text-deep-black/40 block font-mono">
                    {salesData?.paymentBreakdown?.CREDIARIO?.count || 0} compras
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown por Canal de Venda */}
            <div className="lg:col-span-5 bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-gold" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-deep-black">
                    CANAIS DE VENDA
                  </h3>
                </div>
                <span className="text-[10px] text-gold font-black uppercase">
                  ONLINE VS SHOWROOM
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Loja Online */}
                <div className="p-3.5 border border-deep-black/20 bg-deep-black text-white space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gold block">
                    LOJA ONLINE (E-COMMERCE)
                  </span>
                  <p className="text-lg font-black font-mono text-white">
                    ${(salesData?.channelBreakdown?.ONLINE?.revenue || 0).toFixed(2)}
                  </p>
                  <div className="text-[9px] text-white/70 uppercase space-y-0.5 pt-1 border-t border-white/20">
                    <div>Lucro Líquido: <strong className="text-gold font-mono">${(salesData?.channelBreakdown?.ONLINE?.profit || 0).toFixed(2)}</strong></div>
                    <div>{salesData?.channelBreakdown?.ONLINE?.count || 0} pedidos online</div>
                    <div className="text-[8px] text-white/50">Frete cliente: $9.99 fixo</div>
                  </div>
                </div>

                {/* PDV Balcão Showroom */}
                <div className="p-3.5 border border-deep-black/20 bg-white text-deep-black space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-deep-black/60 block">
                    PDV SHOWROOM BALCÃO
                  </span>
                  <p className="text-lg font-black font-mono text-deep-black">
                    ${(salesData?.channelBreakdown?.POS_COUNTER?.revenue || 0).toFixed(2)}
                  </p>
                  <div className="text-[9px] text-deep-black/70 uppercase space-y-0.5 pt-1 border-t border-deep-black/10">
                    <div>Lucro Líquido: <strong className="text-deep-black font-mono">${(salesData?.channelBreakdown?.POS_COUNTER?.profit || 0).toFixed(2)}</strong></div>
                    <div>{salesData?.channelBreakdown?.POS_COUNTER?.count || 0} vendas balcão</div>
                    <div className="text-[8px] text-gold font-bold">10% comissão vendedora</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FILTROS E BUSCA DE PEDIDOS */}
          <div className="bg-white border-2 border-deep-black p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="BUSCAR POR CLIENTE, PEDIDO OU SKU..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs uppercase tracking-wider border border-deep-black/20 focus:outline-none focus:border-deep-black font-mono"
              />
              <Search className="w-4 h-4 text-deep-black/40 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Seletor Avançado de Período do Relatório */}
              <div className="flex items-center gap-1.5 border border-deep-black/30 bg-deep-black/5 px-2.5 py-1 text-xs shrink-0">
                <CalendarDays className="w-3.5 h-3.5 text-gold" />
                <span className="text-[10px] font-black uppercase text-deep-black/70">PERÍODO:</span>
                <select
                  value={salesPeriodFilter}
                  onChange={(e) => setSalesPeriodFilter(e.target.value as any)}
                  className="text-xs font-black uppercase bg-transparent border-0 focus:outline-none cursor-pointer text-deep-black"
                >
                  <option value="ALL">TODAS AS VENDAS</option>
                  <option value="TODAY">HOJE</option>
                  <option value="YESTERDAY">ONTEM</option>
                  <option value="THIS_WEEK">ESTA SEMANA</option>
                  <option value="THIS_MONTH">ESTE MÊS</option>
                  <option value="LAST_MONTH">MÊS ANTERIOR</option>
                  <option value="CUSTOM">PERSONALIZADO (DATAS)</option>
                </select>
              </div>

              {salesPeriodFilter === 'CUSTOM' && (
                <div className="flex items-center gap-1.5 border border-deep-black/30 bg-white px-2 py-1 text-xs shrink-0">
                  <span className="text-[9px] font-black uppercase text-deep-black/60">DE:</span>
                  <input
                    type="date"
                    value={salesCustomStartDate}
                    onChange={(e) => setSalesCustomStartDate(e.target.value)}
                    className="text-xs font-mono font-bold bg-white px-1.5 py-0.5 border border-deep-black/20"
                  />
                  <span className="text-[9px] font-black uppercase text-deep-black/60">ATÉ:</span>
                  <input
                    type="date"
                    value={salesCustomEndDate}
                    onChange={(e) => setSalesCustomEndDate(e.target.value)}
                    className="text-xs font-mono font-bold bg-white px-1.5 py-0.5 border border-deep-black/20"
                  />
                </div>
              )}

              <div className="flex items-center gap-1 border border-deep-black/20 px-2 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-gold" />
                <span className="text-[10px] font-black uppercase text-deep-black/60">CANAL:</span>
                <select
                  value={salesChannelFilter}
                  onChange={(e) => setSalesChannelFilter(e.target.value as any)}
                  className="text-xs font-black uppercase bg-transparent border-0 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TODOS</option>
                  <option value="ONLINE">LOJA ONLINE</option>
                  <option value="POS_COUNTER">PDV BALCÃO</option>
                </select>
              </div>

              <div className="flex items-center gap-1 border border-deep-black/20 px-2 py-1 text-xs">
                <span className="text-[10px] font-black uppercase text-deep-black/60">PGTO:</span>
                <select
                  value={salesPaymentFilter}
                  onChange={(e) => setSalesPaymentFilter(e.target.value as any)}
                  className="text-xs font-black uppercase bg-transparent border-0 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TODOS</option>
                  <option value="ZELLE">ZELLE</option>
                  <option value="VENMO">VENMO</option>
                  <option value="CARD">CARTÃO</option>
                  <option value="CASH">CASH</option>
                  <option value="CREDIARIO">CREDIÁRIO (CARNÊ)</option>
                </select>
              </div>

              {/* Botão Filtro de Pré-Vendas Exclusivo */}
              <button
                type="button"
                onClick={() => setSalesPreorderOnly(!salesPreorderOnly)}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition border flex items-center gap-1.5 ${
                  salesPreorderOnly
                    ? 'bg-gold text-deep-black border-gold shadow'
                    : 'bg-white text-deep-black/70 border-deep-black/20 hover:border-deep-black'
                }`}
                title="Filtrar exclusivamente pedidos sob encomenda com confecção pendente"
              >
                <Factory className="w-3.5 h-3.5 text-gold" />
                <span>{salesPreorderOnly ? '✓ APENAS PRÉ-VENDAS' : 'FILTRO PRÉ-VENDAS'}</span>
              </button>
            </div>
          </div>

          {/* TABELA DETALHADA DE VENDAS & PEDIDOS */}
          <div className="bg-white border-2 border-deep-black overflow-x-auto shadow-sm">
            <div className="p-4 bg-deep-black text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gold" />
                <span className="text-xs font-black uppercase tracking-wider">
                  EXTRATO INDIVIDUAL DE PEDIDOS ({filteredSalesList.length} REGISTROS)
                </span>
              </div>
              <span className="text-[10px] font-mono text-gold uppercase font-black">
                VALORES LÍQUIDOS CALCULADOS AUTOMATICAMENTE
              </span>
            </div>

            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black/5 text-[9px] font-black text-deep-black border-b border-deep-black/20">
                <tr>
                  <th className="p-3">PEDIDO # / DATA</th>
                  <th className="p-3">CANAL & OPERADORA</th>
                  <th className="p-3">CLIENTE</th>
                  <th className="p-3">ITENS & GRADE (COR/TAM)</th>
                  <th className="p-3">PGTO</th>
                  <th className="p-3 text-right">VALOR VENDA</th>
                  <th className="p-3 text-right">CUSTO PEÇAS</th>
                  <th className="p-3 text-right">TAXAS / JUROS</th>
                  <th className="p-3 text-right">COMISSÃO</th>
                  <th className="p-3 text-right">DESCONTO</th>
                  <th className="p-3 text-right">LUCRO REAL</th>
                  <th className="p-3 text-center">SITUAÇÃO ENTREGA (LOGÍSTICA)</th>
                  <th className="p-3 text-center">SITUAÇÃO PAGAMENTO (FINANCEIRO)</th>
                  <th className="p-3 text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {filteredSalesList.map((sale: any) => {
                  const isOnline = sale.channel === 'ONLINE';
                  const isWriteOff = sale.order_id?.startsWith('OUT-') || sale.channel === 'WRITE_OFF' || (Number(sale.subtotal_products) === 0 && Number(sale.cost_of_goods) > 0);
                  return (
                    <tr key={sale.id || sale.order_id} className="hover:bg-deep-black/5">
                      {/* Pedido & Data */}
                      <td className="p-3 font-mono">
                        <span className="font-black text-deep-black block">{sale.order_id}</span>
                        <span className="text-[9px] text-deep-black/50">
                          {new Date(sale.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Canal & Operadora */}
                      <td className="p-3">
                        <span className={`inline-block px-1.5 py-0.5 text-[8px] font-black border uppercase ${
                          isWriteOff
                            ? 'bg-purple-900 text-gold border-gold'
                            : isOnline
                            ? 'bg-deep-black text-white border-deep-black'
                            : 'bg-gold/20 text-deep-black border-gold/40'
                        }`}>
                          {isWriteOff ? 'RETIRADA SEM CUSTO' : isOnline ? 'LOJA ONLINE' : 'PDV BALCÃO'}
                        </span>
                        <span className="text-[9px] text-deep-black/60 block font-bold truncate max-w-[120px] mt-0.5" title={sale.seller_name}>
                          {sale.seller_name}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="p-3 font-bold text-deep-black">
                        <span className="block">{sale.customer_name}</span>
                        {sale.customer_phone && (
                          <span className="text-[9px] text-deep-black/60 block font-mono">
                            📞 {sale.customer_phone}
                          </span>
                        )}
                        {sale.customer_email && (
                          <span className="text-[9px] text-deep-black/50 block font-mono lowercase truncate max-w-[140px]">
                            ✉️ {sale.customer_email}
                          </span>
                        )}
                        {sale.shipping_address && (
                          <span className="text-[9px] text-gold font-bold block mt-0.5">
                            📍 {sale.shipping_address.city}, {sale.shipping_address.state} {sale.shipping_address.zip}
                          </span>
                        )}
                      </td>

                      {/* Itens e Grade */}
                      <td className="p-3">
                        <div className="space-y-1 max-w-xs">
                          {(sale.items || []).map((it: any, iIdx: number) => (
                            <div key={iIdx} className="text-[10px] leading-tight">
                              <span className="font-black text-deep-black">{it.title}</span>
                              <span className="text-gold font-bold ml-1 font-mono">
                                ({it.color} • TAM {it.size}) ×{it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 text-[8px] font-black font-mono border inline-block ${
                            sale.payment_method === 'ZELLE'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : sale.payment_method === 'VENMO'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : sale.payment_method === 'CARD'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : sale.payment_method === 'CREDIARIO'
                              ? 'bg-amber-500 text-deep-black border-amber-600 font-black shadow-xs'
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}>
                            {sale.payment_method}
                          </span>
                          {sale.crediario?.installments && (
                            <span className="block text-[8px] font-mono font-bold text-amber-950 bg-amber-100 px-1 py-0.5 border border-amber-300">
                              {sale.crediario.installments.filter((i: any) => i.status === 'PAID').length}/{sale.crediario.installments.length} PG
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Valor Venda */}
                      <td className="p-3 text-right font-mono font-black text-deep-black">
                        ${(Number(sale.subtotal_products) + Number(sale.shipping_fee)).toFixed(2)}
                      </td>

                      {/* Custo Peças */}
                      <td className="p-3 text-right font-mono text-deep-black/70">
                        ${Number(sale.cost_of_goods || 0).toFixed(2)}
                      </td>

                      {/* Taxas Pagas / Juros */}
                      <td className="p-3 text-right font-mono text-red-600 font-bold">
                        {Number(sale.payment_fee || 0) > 0 ? `-$${Number(sale.payment_fee).toFixed(2)}` : '$0.00'}
                      </td>

                      {/* Comissão Vendedora */}
                      <td className="p-3 text-right font-mono text-deep-black/70">
                        {Number(sale.commission_amount || 0) > 0 ? (
                          <span className="text-red-700 font-bold">-${Number(sale.commission_amount).toFixed(2)}</span>
                        ) : (
                          <span className="text-deep-black/40">$0.00</span>
                        )}
                      </td>

                      {/* Desconto Efetuado */}
                      <td className="p-3 text-right font-mono">
                        {Number(sale.discount_amount || 0) > 0 ? (
                          <span className="text-amber-700 font-bold">-${Number(sale.discount_amount).toFixed(2)}</span>
                        ) : (
                          <span className="text-deep-black/40">$0.00</span>
                        )}
                      </td>

                      {/* Lucro Líquido Real */}
                      <td className={`p-3 text-right font-mono font-black bg-deep-black/5 ${
                        Number(sale.net_profit) < 0 ? 'text-red-600' : 'text-gold'
                      }`}>
                        {Number(sale.net_profit) < 0
                          ? `-$${Math.abs(Number(sale.net_profit)).toFixed(2)}`
                          : `$${Number(sale.net_profit).toFixed(2)}`}
                        <span className="text-[8px] text-deep-black/50 block font-normal">
                          {isWriteOff ? 'CUSTO ABSORVIDO' : `${sale.profit_margin_pct}%`}
                        </span>
                      </td>

                      {/* 1. Situação de Entrega (Logística: Aguardando, Separando, Despachada, Entregue) */}
                      <td className="p-3 text-center">
                        <select
                          value={sale.fulfillment_status || 'DELIVERED'}
                          onChange={(e) => handleUpdateFulfillmentStatus(sale.order_id, e.target.value)}
                          className={`text-[8.5px] font-black uppercase px-2 py-1 border cursor-pointer ${
                            (sale.fulfillment_status || '') === 'DELIVERED'
                              ? 'bg-deep-black text-gold border-gold'
                              : (sale.fulfillment_status || '') === 'SHIPPED'
                              ? 'bg-purple-100 text-purple-900 border-purple-400'
                              : (sale.fulfillment_status || '') === 'IN_PRODUCTION'
                              ? 'bg-blue-100 text-blue-900 border-blue-400'
                              : 'bg-amber-100 text-amber-900 border-amber-400'
                          }`}
                          title="Clique para atualizar a situação de entrega (Logística)"
                        >
                          <option value="AWAITING_SEPARATION">🕒 1. AGUARDANDO SEPARAÇÃO</option>
                          <option value="IN_PRODUCTION">✂️ 2. SEPARANDO MERCADORIA</option>
                          <option value="SHIPPED">📦 3. DESPACHADA (USPS)</option>
                          <option value="DELIVERED">🛍️ 4. MERCADORIA ENTREGUE</option>
                        </select>
                        {sale.tracking_code && (
                          <span className="block text-[8px] font-mono text-purple-700 font-bold mt-0.5" title={`Rastreio USPS: ${sale.tracking_code}`}>
                            USPS: {String(sale.tracking_code).slice(0, 10)}...
                          </span>
                        )}
                      </td>

                      {/* 2. Situação de Pagamento (Financeiro: Quitado, Parcial, Em Aberto, Cancelado) */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {sale.payment_status === 'CANCELLED' ? (
                            <span className="text-[8.5px] font-black uppercase px-2 py-0.5 bg-red-100 text-red-900 border border-red-300">
                              ✕ CANCELADO
                            </span>
                          ) : (sale.payment_status === 'PAID' || sale.payment_status === 'COMPLETED') ? (
                            <span className="text-[8.5px] font-black uppercase px-2 py-0.5 bg-green-100 text-green-900 border border-green-400 flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-green-700" />
                              <span>PAGAMENTO EFETUADO</span>
                            </span>
                          ) : (
                            <div className="space-y-1 w-full flex flex-col items-center">
                              <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 border block ${
                                sale.payment_status === 'PARTIAL'
                                  ? 'bg-amber-100 text-amber-950 border-amber-400'
                                  : 'bg-amber-50 text-amber-900 border-amber-300'
                              }`}>
                                {sale.payment_status === 'PARTIAL' ? '🟡 PARCIALMENTE PAGO' : '⏳ EM ABERTO (CREDIÁRIO)'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenCrediarioPayModal(sale)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[8.5px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 border border-emerald-900 shadow-2xs cursor-pointer w-full max-w-[125px]"
                                title="Dar baixa no pagamento e informar meio (Zelle ou Cash)"
                              >
                                <DollarSign className="w-2.5 h-2.5 text-gold" />
                                <span>+ DAR BAIXA</span>
                              </button>
                            </div>
                          )}

                          {/* Se for Crediário, exibe resumo de parcelas */}
                          {sale.crediario?.installments && (
                            <span className="text-[7.5px] font-mono text-deep-black/60 font-bold block">
                              {sale.crediario.installments.filter((i: any) => i.status === 'PAID').length} de {sale.crediario.installments.length} parcelas pagas
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Botões Ação: Editar Venda, Cancelar & Raio-X */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setEditingSale(sale)}
                            className="px-2 py-1 bg-gold hover:bg-deep-black hover:text-gold text-deep-black text-[9px] font-black uppercase transition tracking-wider flex items-center gap-1 border border-deep-black shadow-2xs"
                            title="Editar esta venda (data, cliente, itens, pagamento)"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>EDITAR</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancellingSale(sale)}
                            className={`px-2 py-1 text-[9px] font-black uppercase transition tracking-wider flex items-center gap-1 border ${
                              sale.status === 'CANCELLED'
                                ? 'bg-red-50 text-red-600 border-red-300 hover:bg-red-600 hover:text-white'
                                : 'bg-red-100 hover:bg-red-600 hover:text-white text-red-900 border-red-400'
                            }`}
                            title={sale.status === 'CANCELLED' ? 'Ver detalhes do cancelamento ou excluir' : 'Cancelar esta venda e estornar itens ao estoque'}
                          >
                            <Ban className="w-3 h-3" />
                            <span>{sale.status === 'CANCELLED' ? 'CANCELADA' : 'CANCELAR'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSaleDetail(sale)}
                            className="px-2 py-1 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[9px] font-black uppercase transition tracking-wider"
                            title="Ver Raio-X Detalhado do Lucro"
                          >
                            RAIO-X
                          </button>
                          {/* Pedir Avaliação WhatsApp */}
                          {!isWriteOff && sale.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => {
                                const cleanPhone = String(sale.customer_phone || '').replace(/\D/g, '');
                                const fullPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;
                                const firstItem = (sale.items && sale.items[0]) ? (sale.items[0].product_title || sale.items[0].sku || '') : '';
                                const prodParam = firstItem ? `?produto=${encodeURIComponent(firstItem)}` : '';
                                const nameParam = sale.customer_name ? `${prodParam ? '&' : '?'}nome=${encodeURIComponent(sale.customer_name)}` : '';
                                const emailParam = sale.customer_email ? `${prodParam || nameParam ? '&' : '?'}email=${encodeURIComponent(sale.customer_email)}` : '';
                                const reviewUrl = `https://anafitwear.com/avaliar${prodParam}${nameParam}${emailParam}`;
                                const msg = `Olá ${sale.customer_name || 'linda'}! 🥰 Adoramos ter você na família Ana Fitness Wear. Seu look já chegou? Gostaríamos muito de saber o que achou! Leva só 1 minutinho para avaliar no nosso site e você ganha 10% OFF enviado direto para o seu e-mail:\n\n${reviewUrl}`;
                                if (fullPhone) {
                                  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                                } else {
                                  navigator.clipboard.writeText(reviewUrl);
                                  alert(`Link copiado para a cliente!\n\n${reviewUrl}`);
                                }
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase transition tracking-wider flex items-center gap-1 border border-emerald-800 shadow-2xs cursor-pointer"
                              title="Enviar solicitação de avaliação no WhatsApp (Cliente ganha 10% OFF)"
                            >
                              <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                              <span>PEDIR REVIEW</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Rodapé Oficial da Tabela com a Soma Exata dos Totais Solicitados */}
              <tfoot className="bg-deep-black text-white font-mono text-xs border-t-4 border-gold">
                <tr>
                  <td colSpan={5} className="p-3 font-black text-gold uppercase tracking-wider">
                    SOMA TOTAL ({filteredSalesTotals.count} VENDAS NO PERÍODO):
                  </td>
                  <td className="p-3 text-right font-black text-gold text-sm">
                    ${filteredSalesTotals.totalSalesGross.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-white/80">
                    -${filteredSalesTotals.totalCogs.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-red-400">
                    -${filteredSalesTotals.totalFees.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-white/80">
                    -${filteredSalesTotals.totalCommissions.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-amber-300">
                    -${filteredSalesTotals.totalDiscounts.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-black text-gold text-sm">
                    ${filteredSalesTotals.totalProfit.toFixed(2)}
                  </td>
                  <td colSpan={3} className="p-3 text-center text-gold font-bold text-[10px]">
                    MARGEM: {filteredSalesTotals.marginPct.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* =========================================================================
              PAINEL EXECUTIVO: FECHAMENTO CONSOLIDADO / TOTAL DE TUDO
              SOMA: Total de Venda, Total de Juro/Taxas, Total de Lucro, Total de Comissão e Total de Tudo
             ========================================================================= */}
          <div className="bg-deep-black text-white border-2 border-gold p-6 space-y-4 shadow-luxury">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-gold" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                    FECHAMENTO CONTÁBIL DAS VENDAS FILTRADAS
                  </span>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                    SOMA GERAL & TOTAL DE TUDO ({getSalesPeriodLabel().toUpperCase()})
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowSalesReportModal(true)}
                  className="px-3.5 py-1.5 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>VER RELATÓRIO EXPANDIDO</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintSalesReportWindow}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>IMPRIMIR / PDF</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* 1. TOTAL DE VENDA */}
              <div className="p-3.5 bg-white/10 border border-white/20 space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-white/70 block">
                  1. TOTAL DE VENDA
                </span>
                <p className="text-lg sm:text-xl font-black font-mono text-white">
                  ${filteredSalesTotals.totalSalesGross.toFixed(2)}
                </p>
                <span className="text-[8px] text-white/50 uppercase block">Faturamento Bruto</span>
              </div>

              {/* TOTAL DE CUSTO */}
              <div className="p-3.5 bg-white/10 border border-white/20 space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-white/70 block">
                  TOTAL DE CUSTO
                </span>
                <p className="text-lg sm:text-xl font-black font-mono text-white/80">
                  -${filteredSalesTotals.totalCogs.toFixed(2)}
                </p>
                <span className="text-[8px] text-white/50 uppercase block">Custo Confecção</span>
              </div>

              {/* TOTAL DE DESCONTO */}
              <div className="p-3.5 bg-white/10 border border-white/20 space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block">
                  TOTAL DESCONTOS
                </span>
                <p className="text-lg sm:text-xl font-black font-mono text-amber-300">
                  -${filteredSalesTotals.totalDiscounts.toFixed(2)}
                </p>
                <span className="text-[8px] text-white/50 uppercase block">Cupons & Balcão</span>
              </div>

              {/* 2. TOTAL DE JURO / TAXAS */}
              <div className="p-3.5 bg-white/10 border border-red-500/30 space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-red-400 block">
                  2. TOTAL JUROS / TAXAS
                </span>
                <p className="text-lg sm:text-xl font-black font-mono text-red-400">
                  -${filteredSalesTotals.totalFees.toFixed(2)}
                </p>
                <span className="text-[8px] text-white/50 uppercase block">Gateways & Cartão</span>
              </div>

              {/* 3. TOTAL DE COMISSÃO */}
              <div className="p-3.5 bg-white/10 border border-white/20 space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-white/70 block">
                  3. TOTAL COMISSÃO
                </span>
                <p className="text-lg sm:text-xl font-black font-mono text-white">
                  -${filteredSalesTotals.totalCommissions.toFixed(2)}
                </p>
                <span className="text-[8px] text-white/50 uppercase block">Vendedoras Balcão/Online</span>
              </div>

              {/* 4. TOTAL DE LUCRO & 5. TOTAL DE TUDO */}
              <div className="p-3.5 bg-gold text-deep-black border-2 border-gold space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-deep-black/80 block">
                  4. TOTAL LUCRO REAL
                </span>
                <p className="text-lg sm:text-xl font-black font-mono text-deep-black">
                  ${filteredSalesTotals.totalProfit.toFixed(2)}
                </p>
                <span className="text-[8px] font-bold text-deep-black/70 uppercase block">
                  Margem: {filteredSalesTotals.marginPct.toFixed(1)}% retida
                </span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono uppercase tracking-wide gap-2">
              <span className="text-gold font-bold">
                🏆 BALANÇO CONSOLIDADO (TOTAL DE TUDO):
              </span>
              <span className="text-white/80">
                ${filteredSalesTotals.totalSalesGross.toFixed(2)} (Venda) - ${filteredSalesTotals.totalCogs.toFixed(2)} (Custo) - ${filteredSalesTotals.totalDiscounts.toFixed(2)} (Desc) - ${filteredSalesTotals.totalFees.toFixed(2)} (Taxas/Juros) - ${filteredSalesTotals.totalCommissions.toFixed(2)} (Comissão) ={' '}
                <strong className="text-gold underline">${filteredSalesTotals.totalProfit.toFixed(2)} USD LIMPO NO BOLSO</strong>
              </span>
            </div>
          </div>

          {/* MODAL RAIO-X FINANCEIRO DO PEDIDO SELECIONADO */}
          {selectedSaleDetail && (
            <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4">
              <div className="bg-white border-4 border-gold p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between border-b border-deep-black/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-gold" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                        RAIO-X FINANCEIRO DA VENDA
                      </span>
                      <h3 className="text-base font-black uppercase tracking-wider text-deep-black">
                        PEDIDO #{selectedSaleDetail.order_id}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSaleDetail(null)}
                    className="p-1.5 text-deep-black hover:text-gold transition font-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Dados da Venda e Envio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs uppercase tracking-wider bg-deep-black/5 p-4 border border-deep-black/10">
                  <div className="space-y-1">
                    <span className="text-[9px] text-deep-black/50 font-bold block">CLIENTE & CONTATO:</span>
                    <strong className="text-deep-black block">{selectedSaleDetail.customer_name}</strong>
                    {selectedSaleDetail.customer_phone && (
                      <span className="text-[10px] text-deep-black/70 font-mono block">📞 {selectedSaleDetail.customer_phone}</span>
                    )}
                    {selectedSaleDetail.customer_email && (
                      <span className="text-[10px] text-deep-black/70 lowercase font-mono block">✉️ {selectedSaleDetail.customer_email}</span>
                    )}
                    <span className="text-[9px] text-deep-black/50 block font-mono mt-1">
                      {selectedSaleDetail.channel} • {selectedSaleDetail.payment_method}
                    </span>
                  </div>

                  <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-deep-black/10 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-[9px] text-gold font-black block">📍 ENDEREÇO DE ENTREGA (USPS):</span>
                    {selectedSaleDetail.shipping_address ? (
                      <div className="text-[10px] text-deep-black font-medium leading-relaxed">
                        <div>{selectedSaleDetail.shipping_address.address} {selectedSaleDetail.shipping_address.apt}</div>
                        <div className="font-bold">{selectedSaleDetail.shipping_address.city}, {selectedSaleDetail.shipping_address.state} {selectedSaleDetail.shipping_address.zip}</div>
                        <div className="text-[9px] text-deep-black/50 font-mono">United States (Domestic Delivery)</div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-deep-black/60 italic">Retirada no Showroom ou endereço padrão Leominster, MA</span>
                    )}
                  </div>
                </div>

                {/* SEÇÃO ESPECIAL DE GESTÃO DO CREDIÁRIO / CARNÊ */}
                {(selectedSaleDetail.payment_method === 'CREDIARIO' || selectedSaleDetail.crediario) && (
                  <div className="bg-amber-50/90 border-2 border-amber-300 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-amber-800" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                          CARNÊ DE CREDIÁRIO • {selectedSaleDetail.crediario?.installments_count || selectedSaleDetail.crediario?.installments?.length || 1}X
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedSaleDetail.crediario?.installments?.some((i: any) => i.status !== 'PAID') && (
                          <button
                            type="button"
                            onClick={() => handleOpenCrediarioPayModal(selectedSaleDetail)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition shadow-xs cursor-pointer"
                            title="Quitar todo o saldo pendente do crediário e selecionar meio (Zelle ou Cash)"
                          >
                            <DollarSign className="w-3 h-3 text-gold" />
                            <span>QUITAR TUDO</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => printCrediarioCarnet(selectedSaleDetail)}
                          className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>IMPRIMIR CARNÊ</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2.5 border border-amber-200">
                      <div>
                        <span className="text-deep-black/60 block font-bold">DOC / IDENTIFICAÇÃO:</span>
                        <strong className="text-deep-black font-mono">
                          {selectedSaleDetail.crediario?.customer_doc || 'Não informado'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-deep-black/60 block font-bold">ENTRADA PAGA:</span>
                        <strong className="text-green-700 font-mono">
                          ${Number(selectedSaleDetail.crediario?.down_payment || 0).toFixed(2)} ({selectedSaleDetail.crediario?.down_payment_method || 'CASH'})
                        </strong>
                      </div>
                      {selectedSaleDetail.crediario?.customer_address && (
                        <div className="col-span-2">
                          <span className="text-deep-black/60 block font-bold">ENDEREÇO DA CLIENTE:</span>
                          <span className="text-deep-black">{selectedSaleDetail.crediario.customer_address}</span>
                        </div>
                      )}
                      {selectedSaleDetail.crediario?.notes && (
                        <div className="col-span-2">
                          <span className="text-deep-black/60 block font-bold">OBSERVAÇÕES:</span>
                          <span className="text-deep-black italic">{selectedSaleDetail.crediario.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* PARCELAS INDIVIDUAIS */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-950 block">
                        STATUS DAS PARCELAS E CONTROLE DE COBRANÇA:
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {(selectedSaleDetail.crediario?.installments || []).map((inst: any) => {
                          const [y, m, d] = (inst.due_date || '').split('-');
                          const dateFormatted = d && m && y ? `${d}/${m}/${y}` : inst.due_date;
                          const isPaid = inst.status === 'PAID';

                          return (
                            <div
                              key={inst.number}
                              className={`p-2.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                                isPaid ? 'bg-green-50 border-green-300' : 'bg-white border-amber-200'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <strong className="text-deep-black">
                                    Parcela {inst.number}/{selectedSaleDetail.crediario?.installments_count || selectedSaleDetail.crediario?.installments?.length}:
                                  </strong>
                                  <span className="font-mono font-black text-deep-black">
                                    ${Number(inst.amount).toFixed(2)} USD
                                  </span>
                                  {isPaid ? (
                                    <span className="text-[9px] bg-green-200 text-green-900 font-black px-1.5 py-0.5 rounded">
                                      ✓ PAGA ({inst.paid_method || inst.payment_method || 'CASH'})
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300">
                                      VENCE EM {dateFormatted}
                                    </span>
                                  )}
                                </div>
                                {isPaid && inst.paid_at && (
                                  <span className="text-[9px] text-green-800 font-mono block">
                                    Baixa registrada em: {new Date(inst.paid_at).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>

                              {!isPaid && (
                                <div className="flex items-center gap-1.5">
                                  {/* Botão Baixa Dinheiro */}
                                  <button
                                    type="button"
                                    onClick={() => handlePayInstallment(selectedSaleDetail.order_id, inst.number, 'CASH')}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-[9px] font-black uppercase transition cursor-pointer"
                                    title="Receber parcela em Dinheiro (Cash)"
                                  >
                                    + CASH
                                  </button>
                                  {/* Botão Baixa Zelle */}
                                  <button
                                    type="button"
                                    onClick={() => handlePayInstallment(selectedSaleDetail.order_id, inst.number, 'ZELLE')}
                                    className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white text-[9px] font-black uppercase transition cursor-pointer"
                                    title="Receber parcela via Zelle"
                                  >
                                    + ZELLE
                                  </button>
                                  {/* Botão Baixa Cartão */}
                                  <button
                                    type="button"
                                    onClick={() => handlePayInstallment(selectedSaleDetail.order_id, inst.number, 'CARD')}
                                    className="px-2 py-1 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[9px] font-black uppercase transition cursor-pointer"
                                    title="Receber parcela no Cartão"
                                  >
                                    + CARD
                                  </button>
                                  {/* Botão Baixa Venmo */}
                                  <button
                                    type="button"
                                    onClick={() => handlePayInstallment(selectedSaleDetail.order_id, inst.number, 'VENMO')}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase transition cursor-pointer"
                                    title="Receber parcela via Venmo"
                                  >
                                    + VENMO
                                  </button>
                                  {/* Lembrete WhatsApp */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cleanPhone = (selectedSaleDetail.customer_phone || '').replace(/\D/g, '');
                                      const reminderMsg = `Olá *${selectedSaleDetail.customer_name}*! Lembrete amigável da Ana Fitness Wear 💕\nA sua Parcela *${inst.number}/${selectedSaleDetail.crediario?.installments_count || selectedSaleDetail.crediario?.installments?.length}* no valor de *$${Number(inst.amount).toFixed(2)} USD* vence no dia *${dateFormatted}*.\n\nPara pagar via Zelle: *anafitweareua@gmail.com*\nQualquer dúvida estamos à disposição! ✨`;
                                      const url = cleanPhone
                                        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderMsg)}`
                                        : `https://wa.me/?text=${encodeURIComponent(reminderMsg)}`;
                                      window.open(url, '_blank');
                                    }}
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-black uppercase flex items-center gap-1 transition cursor-pointer"
                                    title="Enviar lembrete amigável no WhatsApp"
                                  >
                                    <Send className="w-2.5 h-2.5" />
                                    <span>LEMBRETE</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Peças da Venda com Preço de Venda e Preço de Custo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                      PEÇAS VENDIDAS & PREÇO DE CUSTO (CMV):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSale(selectedSaleDetail);
                        setSelectedSaleDetail(null);
                      }}
                      className="text-[9px] font-black uppercase text-gold hover:text-white bg-deep-black px-2.5 py-1 border border-gold flex items-center gap-1 transition shadow-xs"
                      title="Editar preço de custo ou valor das peças"
                    >
                      <Edit3 className="w-3 h-3 text-gold" />
                      <span>ATUALIZAR PREÇO DE CUSTO</span>
                    </button>
                  </div>

                  <div className="border-2 border-deep-black/20 divide-y divide-deep-black/10 bg-white">
                    {(selectedSaleDetail.items || []).map((it: any, idx: number) => {
                      const cost = it.cost_price !== undefined && it.cost_price !== null ? Number(it.cost_price) : 0;
                      const price = Number(it.unit_price) || 0;
                      const qty = Number(it.quantity) || 1;
                      const itemSubtotal = price * qty;
                      const itemCostTotal = cost * qty;
                      const itemProfit = itemSubtotal - itemCostTotal;

                      return (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-deep-black block uppercase text-[11px]">{it.title}</strong>
                            <span className="text-[9px] text-deep-black/60 font-mono">
                              Tam: {it.size || 'One Size'} • Cor: {it.color || 'Padrão'} • Qtd: {qty}x
                            </span>
                          </div>
                          <div className="text-right font-mono space-y-0.5">
                            <div className="text-deep-black font-bold">
                              Venda: ${price.toFixed(2)} (${itemSubtotal.toFixed(2)})
                            </div>
                            <div className="text-[10px] text-amber-900 bg-amber-100 font-black px-1.5 py-0.5 rounded inline-block">
                              ★ Custo Unit: ${cost.toFixed(2)}
                            </div>
                            <div className="text-[9px] text-green-700 font-black block">
                              Lucro: +${itemProfit.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Memória de Cálculo Passo a Passo */}
                <div className="space-y-2 text-xs uppercase tracking-wider">
                  <span className="text-[10px] font-black uppercase tracking-widest text-deep-black block">
                    MEMÓRIA DE CÁLCULO DO LUCRO LÍQUIDO REAL:
                  </span>

                  <div className="space-y-1.5 bg-white border border-deep-black/20 p-4">
                    <div className="flex justify-between text-deep-black">
                      <span>(+) PREÇO DAS PEÇAS:</span>
                      <span className="font-mono font-bold">${Number(selectedSaleDetail.subtotal_products).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-deep-black">
                      <span>(+) FRETE COBRADO DO CLIENTE:</span>
                      <span className="font-mono font-bold">${Number(selectedSaleDetail.shipping_fee).toFixed(2)}</span>
                    </div>

                    {selectedSaleDetail.discount_amount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>(-) DESCONTO CONCEDIDO:</span>
                        <span className="font-mono font-bold">-${Number(selectedSaleDetail.discount_amount).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-black text-deep-black border-t border-deep-black/10 pt-1.5">
                      <span>(=) FATURAMENTO BRUTO:</span>
                      <span className="font-mono">
                        ${(Number(selectedSaleDetail.subtotal_products) + Number(selectedSaleDetail.shipping_fee) - Number(selectedSaleDetail.discount_amount || 0)).toFixed(2)}
                      </span>
                    </div>

                    <div className="border-t border-deep-black/10 pt-1.5 space-y-1 text-red-600">
                      <div className="flex justify-between">
                        <span>(-) CUSTO DE CONFECÇÃO (COGS):</span>
                        <span className="font-mono">-${Number(selectedSaleDetail.cost_of_goods).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>(-) TAXA MEIO PGTO ({selectedSaleDetail.payment_method}):</span>
                        <span className="font-mono">-${Number(selectedSaleDetail.payment_fee).toFixed(2)}</span>
                      </div>
                      {selectedSaleDetail.shipping_cost > 0 && (
                        <div className="flex justify-between">
                          <span>(-) CUSTO ETIQUETA USPS:</span>
                          <span className="font-mono">-${Number(selectedSaleDetail.shipping_cost).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>(-) COMISSÃO VENDEDORA ({selectedSaleDetail.seller_name}):</span>
                        <span className="font-mono">
                          {Number(selectedSaleDetail.commission_amount || 0) > 0
                            ? `-$${Number(selectedSaleDetail.commission_amount).toFixed(2)}`
                            : '$0.00 (Sem comissão)'}
                        </span>
                      </div>
                    </div>

                    {/* Resultado Líquido Final */}
                    <div className="flex justify-between items-center text-sm font-black bg-deep-black text-gold p-3 mt-3 border border-gold">
                      <span>(=) LUCRO LÍQUIDO REAL NO BOLSO:</span>
                      <span className="text-base font-mono">${Number(selectedSaleDetail.net_profit).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSale(selectedSaleDetail);
                      setSelectedSaleDetail(null);
                    }}
                    className="w-full py-3 bg-gold hover:bg-deep-black hover:text-gold text-deep-black border-2 border-deep-black font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>EDITAR ESTA VENDA / ATUALIZAR PREÇO DE CUSTO</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCancellingSale(selectedSaleDetail);
                      setSelectedSaleDetail(null);
                    }}
                    className="w-full py-2.5 bg-red-100 hover:bg-red-700 hover:text-white text-red-900 border-2 border-red-500 font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    <span>CANCELAR ESTA VENDA (ESTORNAR ESTOQUE)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSaleDetail(null)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-deep-black hover:text-white text-deep-black text-xs font-black uppercase tracking-widest transition"
                  >
                    FECHAR DETALHES
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Edição de Venda */}
          <EditSaleModal
            isOpen={Boolean(editingSale)}
            onClose={() => setEditingSale(null)}
            sale={editingSale}
            onSaveSuccess={() => {
              fetchSalesData();
              setSaveSuccessMessage(true);
              setTimeout(() => setSaveSuccessMessage(false), 5000);
            }}
          />

          {/* Modal de Cancelamento & Estorno de Venda */}
          <CancelSaleModal
            isOpen={Boolean(cancellingSale)}
            onClose={() => setCancellingSale(null)}
            sale={cancellingSale}
            onSuccess={() => {
              fetchSalesData();
              setSaveSuccessMessage(true);
              setTimeout(() => setSaveSuccessMessage(false), 5000);
            }}
          />

          {/* Modal de Confirmação de Baixa no Pagamento / Crediário: "Pagou como? Zelle? Cash? Card? Venmo?" */}
          {crediarioPayModal.isOpen && crediarioPayModal.order && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/85 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white border-4 border-gold w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
                {/* Cabeçalho */}
                <div className="bg-deep-black text-white p-5 flex items-center justify-between border-b-2 border-gold">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center border border-gold">
                      <DollarSign className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                        BAIXA DE PAGAMENTO • CREDIÁRIO
                      </span>
                      <h3 className="text-base font-black uppercase tracking-wider text-white">
                        PEDIDO #{crediarioPayModal.order.order_id}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setCrediarioPayModal({ isOpen: false, order: null })}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition font-black cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Conteúdo do Modal */}
                <div className="p-6 space-y-5 text-deep-black">
                  <div className="bg-neutral-50 border border-deep-black/15 p-3.5 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-deep-black/60 font-bold uppercase">Cliente:</span>
                      <span className="font-black uppercase">{crediarioPayModal.order.customer_name}</span>
                    </div>
                    {crediarioPayModal.installmentNumber !== undefined ? (
                      <div className="flex justify-between text-xs pt-1 border-t border-deep-black/10">
                        <span className="text-deep-black/60 font-bold uppercase">Recebendo Parcela:</span>
                        <span className="font-black text-deep-black font-mono">
                          Parcela {crediarioPayModal.installmentNumber} • ${Number(crediarioPayModal.amount || 0).toFixed(2)} USD
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs pt-1 border-t border-deep-black/10">
                        <span className="text-deep-black/60 font-bold uppercase">Operação:</span>
                        <span className="font-black text-emerald-800 uppercase">
                          QUITAÇÃO TOTAL DO CREDIÁRIO
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pergunta Chave do Usuário: "Pagou como? Zelle? Cash?" */}
                  <div className="space-y-1 text-center">
                    <label className="text-sm font-black uppercase tracking-wider text-deep-black block">
                      COMO O CLIENTE FEZ O PAGAMENTO?
                    </label>
                    <span className="text-[10px] text-deep-black/60 block font-bold">
                      Selecione se foi no Zelle, no Cash, Cartão ou Venmo:
                    </span>
                  </div>

                  {/* 4 Grandes Botões de Meio de Pagamento */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* 1. ZELLE */}
                    <button
                      type="button"
                      onClick={() => handleExecuteCrediarioPayment(
                        crediarioPayModal.order.order_id,
                        'ZELLE',
                        crediarioPayModal.installmentNumber
                      )}
                      className="p-4 bg-purple-50 hover:bg-purple-700 text-purple-950 hover:text-white border-2 border-purple-400 hover:border-purple-800 transition flex flex-col items-center justify-center gap-1.5 shadow-sm group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-700 text-white flex items-center justify-center font-black text-base group-hover:bg-white group-hover:text-purple-700 transition">
                        Z
                      </div>
                      <strong className="text-xs font-black uppercase tracking-wider">ZELLE</strong>
                      <span className="text-[9px] uppercase tracking-wider opacity-75 font-mono">Transferência Zelle</span>
                    </button>

                    {/* 2. CASH / DINHEIRO */}
                    <button
                      type="button"
                      onClick={() => handleExecuteCrediarioPayment(
                        crediarioPayModal.order.order_id,
                        'CASH',
                        crediarioPayModal.installmentNumber
                      )}
                      className="p-4 bg-green-50 hover:bg-green-700 text-green-950 hover:text-white border-2 border-green-500 hover:border-green-800 transition flex flex-col items-center justify-center gap-1.5 shadow-sm group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-green-700 text-white flex items-center justify-center font-black text-base group-hover:bg-white group-hover:text-green-700 transition">
                        $
                      </div>
                      <strong className="text-xs font-black uppercase tracking-wider">CASH (DINHEIRO)</strong>
                      <span className="text-[9px] uppercase tracking-wider opacity-75 font-mono">Em Espécie no Balcão</span>
                    </button>

                    {/* 3. CARD / CARTÃO */}
                    <button
                      type="button"
                      onClick={() => handleExecuteCrediarioPayment(
                        crediarioPayModal.order.order_id,
                        'CARD',
                        crediarioPayModal.installmentNumber
                      )}
                      className="p-4 bg-neutral-100 hover:bg-deep-black text-deep-black hover:text-gold border-2 border-deep-black transition flex flex-col items-center justify-center gap-1.5 shadow-sm group cursor-pointer"
                    >
                      <CreditCard className="w-8 h-8 text-deep-black group-hover:text-gold transition" />
                      <strong className="text-xs font-black uppercase tracking-wider">CARTÃO (CARD)</strong>
                      <span className="text-[9px] uppercase tracking-wider opacity-75 font-mono">Débito ou Crédito</span>
                    </button>

                    {/* 4. VENMO */}
                    <button
                      type="button"
                      onClick={() => handleExecuteCrediarioPayment(
                        crediarioPayModal.order.order_id,
                        'VENMO',
                        crediarioPayModal.installmentNumber
                      )}
                      className="p-4 bg-blue-50 hover:bg-blue-600 text-blue-950 hover:text-white border-2 border-blue-400 hover:border-blue-700 transition flex flex-col items-center justify-center gap-1.5 shadow-sm group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-base group-hover:bg-white group-hover:text-blue-600 transition">
                        V
                      </div>
                      <strong className="text-xs font-black uppercase tracking-wider">VENMO</strong>
                      <span className="text-[9px] uppercase tracking-wider opacity-75 font-mono">App Venmo</span>
                    </button>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setCrediarioPayModal({ isOpen: false, order: null })}
                      className="px-4 py-2 text-xs font-black uppercase text-deep-black/60 hover:text-deep-black transition cursor-pointer"
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* =========================================================================
          TAB 2: CUSTOS & MARGEM UNITÁRIA
         ========================================================================= */}
      {activeTab === 'margins' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-deep-black p-5 space-y-2">
            <div className="flex items-center gap-2 text-deep-black font-black text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-gold" />
              <span>COLUNA PROTEGIDA (cost_price): SEUS CLIENTES NUNCA TÊM ACESSO A ESTES DADOS</span>
            </div>
            <p className="text-xs text-deep-black/70 uppercase tracking-wide">
              Insira o valor em dólares ($) que você pagou para a confecção em cada peça. O sistema calcula automaticamente:
              <strong> Preço de Venda - Custo da Peça - Comissão da Vendedora - Taxas de Cartão/Zelle = LUCRO LÍQUIDO REAL</strong>.
            </p>
          </div>

          <div className="bg-white border-2 border-deep-black overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black text-white text-[10px] font-black">
                <tr>
                  <th className="p-4">SKU</th>
                  <th className="p-4">PEÇA FITNESS</th>
                  <th className="p-4">CUSTO CONFECÇÃO ($)</th>
                  <th className="p-4">PREÇO VENDA ($)</th>
                  <th className="p-4">COMISSÃO (10%)</th>
                  <th className="p-4">TAXA CARTÃO (2.9%)</th>
                  <th className="p-4">LUCRO LÍQUIDO ($)</th>
                  <th className="p-4">MARGEM REAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {((baseCatalogList && baseCatalogList.length > 0)
                  ? baseCatalogList.map((p: any) => {
                      const itemVariants = p.variants || [];
                      const baseCost = (p.cost_price !== undefined && p.cost_price !== null)
                        ? Number(p.cost_price)
                        : (p.costPrice !== undefined && p.costPrice !== null)
                        ? Number(p.costPrice)
                        : (itemVariants[0]?.cost_price !== undefined && itemVariants[0]?.cost_price !== null)
                        ? Number(itemVariants[0].cost_price)
                        : 16.0;
                      const basePrice = Number(p.price ?? itemVariants[0]?.price ?? 44.9);
                      const sku = p.sku || p.meta?.general_sku || itemVariants[0]?.sku || `PROD-${p.id?.slice(0, 4) || '1'}`;
                      return {
                        id: p.id,
                        sku,
                        title: p.title || 'Produto sem título',
                        costPrice: baseCost,
                        salePrice: basePrice,
                        sellerCommissionRate: 10.0,
                        gatewayRate: 2.9,
                      };
                    })
                  : productsMargin
                ).map((item) => {
                  const comm = item.salePrice * (item.sellerCommissionRate / 100);
                  const gateway = item.salePrice * (item.gatewayRate / 100);
                  const netProfit = item.salePrice - item.costPrice - comm - gateway;
                  const marginPct = item.salePrice > 0 ? ((netProfit / item.salePrice) * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={item.id || item.sku} className="hover:bg-deep-black/5">
                      <td className="p-4 font-mono font-bold text-deep-black">{item.sku}</td>
                      <td className="p-4 font-black text-deep-black">{item.title}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.5"
                            value={item.costPrice}
                            onChange={(e) => updateCost(item.id || item.sku, parseFloat(e.target.value) || 0)}
                            className="w-20 p-1.5 border border-deep-black/30 text-xs font-mono font-bold bg-white focus:outline-none focus:border-deep-black"
                          />
                          {savingCostId === item.id && (
                            <span className="text-[9px] text-green-700 font-black animate-pulse">✓ SALVO</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold">${item.salePrice.toFixed(2)}</td>
                      <td className="p-4 font-mono text-deep-black/70">-${comm.toFixed(2)}</td>
                      <td className="p-4 font-mono text-deep-black/70">-${gateway.toFixed(2)}</td>
                      <td className="p-4 font-mono font-black text-gold">${netProfit.toFixed(2)}</td>
                      <td className="p-4 font-mono font-black">
                        <span className="px-2 py-0.5 bg-deep-black text-white text-[10px]">
                          {marginPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: VISITANTES ONLINE EM TEMPO REAL & RADAR WIX
         ========================================================================= */}
      {activeTab === 'live' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Banner de Status do Radar Wix */}
          <div className="bg-deep-black text-white p-6 sm:p-8 border-2 border-gold shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-white/10 text-[9px] font-black uppercase tracking-widest text-gold border border-gold/40">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span>RADAR WIX EM TEMPO REAL • ATUALIZANDO A CADA 3.5s</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Radio className="w-6 h-6 text-gold animate-pulse" />
                <span>MONITORAMENTO DE CLIENTES ONLINE & CIDADES</span>
              </h2>
              <p className="text-xs text-white/70 uppercase tracking-wider">
                Você é avisada com som de sino quando um novo cliente entra e som de caixa registradora quando uma compra acontece.
              </p>
            </div>

            {/* Ações de Teste de Som e Notificações */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => soundManager.playVisitorDing()}
                className="px-3 py-2 bg-white/10 hover:bg-gold hover:text-deep-black text-white text-[10px] font-black uppercase tracking-wider transition border border-white/20 flex items-center gap-1.5"
                title="Tocar o som de sino que toca quando um cliente entra"
              >
                <Bell className="w-3.5 h-3.5 text-gold" />
                <span>TESTAR SINO WIX 🔔</span>
              </button>

              <button
                type="button"
                onClick={() => soundManager.playCashRegister()}
                className="px-3 py-2 bg-gold hover:bg-white text-deep-black text-[10px] font-black uppercase tracking-wider transition shadow flex items-center gap-1.5"
                title="Tocar o som de caixa registradora de venda"
              >
                <DollarSign className="w-3.5 h-3.5 text-deep-black" />
                <span>TESTAR SOM VENDA 💰</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const demoCities = ['Leominster, MA', 'Boston, MA', 'Worcester, MA', 'Framingham, MA', 'Miami, FL', 'New York, NY'];
                    const randomCity = demoCities[Math.floor(Math.random() * demoCities.length)];
                    const [cName, cState] = randomCity.split(', ');
                    const simId = `sim-${Date.now()}`;
                    await fetch('/api/live/heartbeat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: simId,
                        page: '/',
                        pageTitle: 'Vitrine Ana Fitness Wear (Oficial)',
                        device: 'iPhone 15 Pro (Apple)',
                        userCity: cName,
                        userRegion: cState,
                      }),
                    });
                    setTimeout(fetchLiveFeed, 300);
                  } catch (e) {
                    console.warn('Erro ao simular visita:', e);
                  }
                }}
                className="px-3 py-2 bg-green-700 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-wider transition shadow flex items-center gap-1.5"
                title="Simula um cliente navegando para validar o radar, o sino e o contador"
              >
                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>SIMULAR VISITA AO VIVO 📡</span>
              </button>
            </div>
          </div>

          {/* Cards de Métricas em Tempo Real */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-deep-black p-6 space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
                ONLINE NO SITE AGORA
              </span>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-ping" />
                <p className="text-3xl font-black text-deep-black font-mono">
                  {liveFeed.activeCount} CLIENTES
                </p>
              </div>
              <span className="text-[9px] text-green-700 uppercase font-black block">
                Navegando em anafitwear.com
              </span>
            </div>

            <div className="bg-white border-2 border-deep-black p-6 space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
                CIDADES CONECTADAS
              </span>
              <p className="text-xl font-black text-deep-black truncate">
                {liveFeed.topCities.length > 0
                  ? liveFeed.topCities.map((c) => c.city).slice(0, 2).join(' • ')
                  : 'LEOMINSTER & BOSTON'}
              </p>
              <span className="text-[9px] text-deep-black/60 uppercase font-bold block">
                {liveFeed.topCities.length} localidades ativas
              </span>
            </div>

            <div className="bg-white border-2 border-deep-black p-6 space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
                ALERTA SONORO (WIX CHIME)
              </span>
              <p className="text-xl font-black text-gold">
                {soundEnabled ? '🔔 ATIVO (TOCANDO)' : '🔇 SILENCIADO'}
              </p>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-[9px] underline uppercase font-black text-deep-black hover:text-gold"
              >
                {soundEnabled ? 'Clique para desativar som' : 'Clique para ativar som'}
              </button>
            </div>

            <div className="bg-white border-2 border-deep-black p-6 space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
                NOTIFICAÇÕES PUSH
              </span>
              <p className="text-xl font-black text-deep-black">
                {browserNotificationsActive ? '📲 AUTORIZADAS' : '⚠️ PENDENTE'}
              </p>
              <button
                type="button"
                onClick={handleEnableBrowserNotifications}
                className="text-[9px] underline uppercase font-black text-gold hover:text-deep-black"
              >
                {browserNotificationsActive ? 'Ativo no navegador' : 'Ativar no computador/celular'}
              </button>
            </div>
          </div>

          {/* Tabela de Visitantes Online com Cidade e Página */}
          <div className="bg-white border-2 border-deep-black overflow-x-auto shadow-sm">
            <div className="p-4 bg-deep-black text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider">
                  VISITANTES CONECTADOS NESTE MOMENTO (ÚLTIMOS 3 MINUTOS)
                </span>
              </div>
              <span className="text-[10px] font-mono text-gold uppercase font-bold">
                {liveFeed.activeVisitors.length} DETECTADOS
              </span>
            </div>

            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black/5 text-[10px] font-black text-deep-black border-b border-deep-black/20">
                <tr>
                  <th className="p-4">CIDADE & ESTADO</th>
                  <th className="p-4">PÁGINA SENDO VISTA</th>
                  <th className="p-4">DISPOSITIVO</th>
                  <th className="p-4">TEMPO NO SITE</th>
                  <th className="p-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {liveFeed.activeVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-deep-black/50 font-bold">
                      Aguardando novos visitantes. Acesse anafitwear.com no celular para se ver online aqui!
                    </td>
                  </tr>
                ) : (
                  liveFeed.activeVisitors.map((vis) => {
                    const isCheckout = vis.page.includes('/checkout');
                    const elapsedSec = Math.floor((Date.now() - vis.firstSeen) / 1000);
                    const elapsedMin = Math.floor(elapsedSec / 60);

                    return (
                      <tr key={vis.id} className="hover:bg-deep-black/5">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gold shrink-0" />
                            <div>
                              <span className="font-black text-deep-black block text-sm">
                                {vis.city}, {vis.region}
                              </span>
                              <span className="text-[9px] text-deep-black/50 font-mono">
                                Estados Unidos (US)
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-deep-black block">
                            {vis.pageTitle}
                          </span>
                          <span className="text-[10px] text-deep-black/50 font-mono block">
                            {vis.page}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-1 bg-deep-black/5 border border-deep-black/10 font-mono text-[10px] font-bold text-deep-black">
                            {vis.device}
                          </span>
                        </td>

                        <td className="p-4 font-mono font-bold text-deep-black">
                          {elapsedMin > 0 ? `${elapsedMin} min atrás` : `${elapsedSec}s atrás`}
                        </td>

                        <td className="p-4 text-right">
                          <span
                            className={`px-2.5 py-1 text-[9px] font-black uppercase border ${
                              isCheckout
                                ? 'bg-gold text-deep-black border-gold animate-pulse'
                                : 'bg-green-100 text-green-800 border-green-400'
                            }`}
                          >
                            {isCheckout ? '🛒 FINALIZANDO COMPRA' : '🟢 NAVEGANDO AGORA'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Feed de Eventos Recentes (Estilo Linha do Tempo ao Vivo Wix) */}
          <div className="bg-white border-2 border-deep-black p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-deep-black">
                  HISTÓRICO RECENTE DE EVENTOS & COMPRAS
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono text-deep-black/60 font-bold">
                ÚLTIMOS EVENTOS
              </span>
            </div>

            <div className="space-y-3">
              {liveFeed.recentEvents.length === 0 ? (
                <p className="text-xs text-deep-black/50 uppercase py-4">Nenhum evento registrado ainda.</p>
              ) : (
                liveFeed.recentEvents.slice(0, 10).map((evt) => {
                  const isOrder = evt.type === 'NEW_ORDER';
                  return (
                    <div
                      key={evt.id}
                      className={`p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isOrder
                          ? 'bg-deep-black text-white border-gold'
                          : 'bg-deep-black/5 text-deep-black border-deep-black/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{isOrder ? '💰' : '🔔'}</span>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black uppercase tracking-wider text-[11px] text-gold">
                              {evt.title}
                            </span>
                            <span className="text-[9px] opacity-60 font-mono">
                              • {evt.city}
                            </span>
                          </div>
                          <p className="font-medium uppercase text-[11px]">
                            {evt.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-[10px] font-mono opacity-60">
                          {new Date(evt.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                        {isOrder && (
                          <a
                            href={`https://wa.me/19783139452?text=${encodeURIComponent(`🎉 Notificação de Pedido #${evt.orderId}: ${evt.description} (Cidade: ${evt.city})`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-gold text-deep-black font-black text-[9px] uppercase hover:bg-white transition"
                          >
                            NOTIFICAR NO WHATSAPP
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PRÉ-VENDAS SOB MEDIDA
         ========================================================================= */}
      {activeTab === 'backorders' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-deep-black p-5 space-y-2">
            <div className="flex items-center gap-2 text-deep-black font-black text-xs uppercase tracking-wider">
              <Factory className="w-4 h-4 text-gold" />
              <span>PEDIDOS EM CONFECÇÃO SOB MEDIDA (PRAZO DE 30 DIAS)</span>
            </div>
            <p className="text-xs text-deep-black/70 uppercase tracking-wide">
              Pedidos que o cliente comprou mesmo quando o estoque estava zerado (allow_backorder ativo).
            </p>
          </div>

          <div className="bg-white border-2 border-deep-black overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black text-white text-[10px] font-black">
                <tr>
                  <th className="p-4">PEDIDO</th>
                  <th className="p-4">CLIENTE</th>
                  <th className="p-4">PEÇA SOLICITADA</th>
                  <th className="p-4">PRAZO</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4 text-right">AÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                <tr>
                  <td colSpan={6} className="p-8 text-center text-deep-black/50 font-bold uppercase text-xs">
                    Nenhuma encomenda ou pré-venda em confecção no momento.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: COMISSÕES & VENDEDORAS (PORTAL COMPLETO)
         ========================================================================= */}
      {activeTab === 'commissions' && (() => {
        const pendingSellers = sellers.filter((s) => s.approval_status === 'PENDING');
        const activeSellersCount = sellers.filter((s) => s.active).length;

        return (
        <div className="space-y-8 animate-fadeIn">
          {/* Métricas Consolidadas das Vendedoras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-deep-black p-5 space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
                FATURAMENTO TOTAL AFILIADAS
              </span>
              <p className="text-2xl sm:text-3xl font-black text-deep-black font-mono">
                ${sellers.reduce((acc, s) => acc + (Number(s.total_revenue_generated) || 0), 0).toFixed(2)}
              </p>
              <span className="text-[9px] text-deep-black/50 uppercase font-bold block">
                {sellers.reduce((acc, s) => acc + (Number(s.total_sales_count) || 0), 0)} pedidos intermediados
              </span>
            </div>

            <div className="bg-white border-2 border-deep-black p-5 space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-black/60 block">
                COMISSÃO TOTAL GERADA
              </span>
              <p className="text-2xl sm:text-3xl font-black text-gold font-mono">
                ${sellers.reduce((acc, s) => acc + (Number(s.total_commission_earned) || 0), 0).toFixed(2)}
              </p>
              <span className="text-[9px] text-deep-black/50 uppercase font-bold block">
                Valor bruto devido às vendedoras
              </span>
            </div>

            <div className="bg-deep-black text-white border-2 border-gold p-5 space-y-1 shadow-luxury">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                SALDO PENDENTE A PAGAR
              </span>
              <p className="text-2xl sm:text-3xl font-black text-gold font-mono">
                ${Math.max(0, sellers.reduce((acc, s) => acc + ((Number(s.total_commission_earned) || 0) - (Number(s.total_commission_paid) || 0)), 0)).toFixed(2)}
              </p>
              <span className="text-[9px] text-white/70 uppercase font-bold block">
                Aguardando repasse via Zelle / Venmo
              </span>
            </div>

            <div className={`p-5 space-y-1 shadow-sm border-2 ${pendingSellers.length > 0 ? 'bg-amber-50 border-amber-500' : 'bg-white border-deep-black'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest block ${pendingSellers.length > 0 ? 'text-amber-900' : 'text-deep-black/60'}`}>
                  SOLICITAÇÕES DE CADASTRO
                </span>
                {pendingSellers.length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <p className={`text-2xl sm:text-3xl font-black font-mono ${pendingSellers.length > 0 ? 'text-amber-700' : 'text-deep-black'}`}>
                {pendingSellers.length > 0 ? `${pendingSellers.length} PENDENTE(S)` : `${activeSellersCount} ATIVAS`}
              </p>
              <span className={`text-[9px] uppercase font-bold block ${pendingSellers.length > 0 ? 'text-amber-800' : 'text-green-700'}`}>
                {pendingSellers.length > 0 ? 'Aguardando sua aprovação' : `${sellers.length} cadastradas no total`}
              </span>
            </div>
          </div>

          {/* =========================================================================
              SEÇÃO EXCLUSIVA: SOLICITAÇÕES DE NOVAS VENDEDORAS AGUARDANDO APROVAÇÃO
             ========================================================================= */}
          {pendingSellers.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-500 p-6 space-y-4 shadow-luxury animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-950">
                    🚨 {pendingSellers.length} NOVA(S) VENDEDORA(S) SOLICITARAM CADASTRO (AGUARDANDO SUA APROVAÇÃO)
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider border border-amber-400">
                  APROVAÇÃO NECESSÁRIA
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed uppercase">
                Essas pessoas preencheram a solicitação em <strong>anafitwear.com/vendedora</strong>, mas <strong>o cupom e o acesso delas estão 100% BLOQUEADOS</strong> até você clicar em aprovar. Você pode revisar, ajustar as porcentagens e aprovar ou recusar:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {pendingSellers.map((seller) => (
                  <div key={seller.id} className="bg-white border-2 border-amber-400 p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-black text-sm text-deep-black uppercase">{seller.name}</h4>
                        <span className="text-[11px] font-mono text-deep-black/70 block">{seller.email}</span>
                        {seller.phone && (
                          <span className="text-[11px] font-mono text-deep-black/70 block">WhatsApp: {seller.phone}</span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-mono font-black text-xs block">
                          CUPOM: {seller.coupon_code}
                        </span>
                        <span className="text-[9px] text-deep-black/50 block font-bold uppercase mt-1">
                          Senha: {seller.password}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-deep-black/5 border border-deep-black/10 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-deep-black/60 uppercase">DADOS DE PAGAMENTO:</span>
                        <span className="px-1.5 py-0.5 bg-deep-black text-gold font-mono font-black text-[9px]">
                          {seller.payout_method || 'ZELLE'}
                        </span>
                      </div>
                      <div className="font-mono font-bold text-xs text-deep-black">
                        {seller.payout_key || 'Chave não informada'}
                      </div>
                      {seller.payout_beneficiary && (
                        <div className="text-[10px] text-deep-black/70">
                          Titular: {seller.payout_beneficiary}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-300 text-green-900 text-[10px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-700 shrink-0" />
                      <span>Termo de Conduta Ética & Tolerância Zero: ACEITO</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteOrRejectSeller(seller)}
                        className="px-3 py-2 border border-red-300 hover:bg-red-50 text-red-700 text-xs font-black uppercase tracking-wider transition"
                      >
                        ❌ RECUSAR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(seller)}
                        className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-black uppercase tracking-wider transition shadow flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>✅ APROVAR VENDEDORA</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Banner de Controle de Regras (Desconto Cliente vs Comissão Vendedora) */}
          <div className="bg-white border-2 border-deep-black p-6 space-y-3 shadow-luxury">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-deep-black">
                  CONTROLE INDEPENDENTE: DESCONTO DO CLIENTE VS COMISSÃO DA VENDEDORA
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-gold/20 text-deep-black text-[9px] font-black uppercase border border-gold">
                REGRAS 100% FLEXÍVEIS
              </span>
            </div>
            <p className="text-xs text-deep-black/80 leading-relaxed uppercase">
              • <strong>Comissão da Vendedora (%):</strong> Você define quanto ela ganha sobre cada venda (ex: 10%, 12%, 15%).<br />
              • <strong>Desconto do Cliente (%):</strong> Você decide se a cliente ganha desconto ou não ao usar o cupom. Se colocar <strong>0% de desconto</strong>, a cliente paga o preço normal da loja (sem desconto) e a venda continua 100% atribuída à vendedora para pagamento da comissão!<br />
              • <strong>Portal Exclusivo das Vendedoras:</strong> Cada vendedora acessa <strong>anafitwear.com/vendedora</strong> com o e-mail/cupom e senha cadastrados abaixo. Elas <strong>NUNCA</strong> têm acesso aos seus custos de confecção ou lucros da empresa.
            </p>
          </div>

          {/* Barra de Ações & Botão de Cadastro */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddSeller}
                className="px-5 py-3 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow"
              >
                <PlusCircle className="w-4 h-4 text-gold" />
                <span>+ CADASTRAR NOVA VENDEDORA / CUPOM</span>
              </button>

              <button
                type="button"
                onClick={fetchSellers}
                disabled={loadingSellers}
                className="p-3 border border-deep-black/30 hover:border-deep-black bg-white text-deep-black text-xs transition"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSellers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <Link
              href="/vendedora"
              target="_blank"
              className="px-4 py-3 border-2 border-deep-black bg-white hover:bg-deep-black hover:text-white text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center gap-2 self-start sm:self-auto"
            >
              <Lock className="w-4 h-4 text-gold" />
              <span>ABRIR PORTAL DA VENDEDORA (/vendedora) ↗</span>
            </Link>
          </div>

          {/* Tabela de Vendedoras e Cupons */}
          <div className="bg-white border-2 border-deep-black overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs uppercase tracking-wider">
              <thead className="bg-deep-black text-white text-[10px] font-black">
                <tr>
                  <th className="p-4">VENDEDORA</th>
                  <th className="p-4">SENHA</th>
                  <th className="p-4">CUPOM & REGRAS</th>
                  <th className="p-4">DADOS DE REPASSE (RECEBIMENTO)</th>
                  <th className="p-4">FATURAMENTO</th>
                  <th className="p-4">COMISSÃO</th>
                  <th className="p-4">JÁ PAGO</th>
                  <th className="p-4">SALDO A PAGAR</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deep-black/10">
                {sellers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-deep-black/50 font-bold">
                      Nenhuma vendedora cadastrada no momento. Clique no botão acima para adicionar.
                    </td>
                  </tr>
                ) : (
                  sellers.map((seller) => {
                    const pending = Math.max(0, (Number(seller.total_commission_earned) || 0) - (Number(seller.total_commission_paid) || 0));
                    return (
                      <tr key={seller.id} className="hover:bg-deep-black/5">
                        <td className="p-4">
                          <span className="font-black text-deep-black block">{seller.name}</span>
                          <span className="text-[10px] text-deep-black/60 font-mono block">{seller.email}</span>
                          {seller.phone && (
                            <span className="text-[10px] text-deep-black/60 font-mono block">{seller.phone}</span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-1 bg-deep-black/5 border border-deep-black/20 font-mono text-[10px] font-bold text-deep-black">
                            {seller.password || 'ana123'}
                          </span>
                        </td>

                        <td className="p-4 space-y-1">
                          <div className="font-mono font-black text-sm text-deep-black">
                            {seller.coupon_code}
                          </div>
                          <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                            <span className="px-1.5 py-0.5 bg-gold text-deep-black">
                              {seller.commission_pct}% COMISSÃO
                            </span>
                            {Number(seller.customer_discount_pct) > 0 ? (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-800 border border-green-300">
                                {seller.customer_discount_pct}% OFF CLIENTE
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300">
                                0% OFF (PREÇO CHEIO)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-deep-black text-gold font-black text-[9px] uppercase tracking-wider">
                              {seller.payout_method || 'ZELLE'}
                            </span>
                            {seller.payout_key ? (
                              <button
                                type="button"
                                onClick={() => handleCopyPayoutKey(seller.payout_key, seller.id)}
                                className="px-1.5 py-0.5 border border-deep-black/30 hover:border-deep-black text-[9px] font-bold text-deep-black flex items-center gap-1 bg-white transition"
                                title="Copiar chave de pagamento"
                              >
                                {copiedPayoutKey === seller.id ? (
                                  <Check className="w-2.5 h-2.5 text-gold" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-deep-black/60" />
                                )}
                                <span className="font-mono">{copiedPayoutKey === seller.id ? 'COPIADA!' : seller.payout_key}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-deep-black/40 italic">Não informada</span>
                            )}
                          </div>
                          {seller.payout_beneficiary && (
                            <span className="text-[9px] text-deep-black/60 block truncate max-w-[160px]">
                              Titular: {seller.payout_beneficiary}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className="font-mono font-bold text-deep-black block">
                            ${(Number(seller.total_revenue_generated) || 0).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-deep-black/50 block font-mono">
                            {seller.total_sales_count || 0} vendas
                          </span>
                        </td>

                        <td className="p-4 font-mono font-bold text-deep-black">
                          ${(Number(seller.total_commission_earned) || 0).toFixed(2)}
                        </td>

                        <td className="p-4 font-mono text-deep-black/70">
                          ${(Number(seller.total_commission_paid) || 0).toFixed(2)}
                        </td>

                        <td className="p-4 font-mono font-black text-gold">
                          ${pending.toFixed(2)}
                        </td>

                        <td className="p-4">
                          {seller.approval_status === 'PENDING' ? (
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-400 block text-center">
                                PENDENTE
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenApproveModal(seller)}
                                className="w-full px-1.5 py-0.5 bg-green-700 hover:bg-green-800 text-white text-[9px] font-black uppercase tracking-wider transition text-center shadow-sm"
                              >
                                APROVAR
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleSellerActive(seller.id)}
                              className={`px-2 py-0.5 text-[9px] font-black uppercase transition ${
                                seller.active
                                  ? 'bg-green-100 text-green-800 border border-green-400 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 border border-red-400 hover:bg-red-200'
                              }`}
                            >
                              {seller.active ? 'ATIVA' : 'INATIVA'}
                            </button>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pending > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenPayout(seller)}
                                className="px-2.5 py-1.5 bg-gold hover:bg-gold/90 text-deep-black font-black text-[10px] uppercase tracking-wider transition shadow-sm"
                                title="Registrar Pagamento"
                              >
                                PAGAR REPASSE
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => copySellerLink(seller.coupon_code)}
                              className="p-1.5 border border-deep-black/20 hover:border-deep-black bg-white text-deep-black transition"
                              title="Copiar Link de Afiliada"
                            >
                              {copiedCouponLink === seller.coupon_code ? (
                                <Check className="w-3.5 h-3.5 text-gold" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-deep-black" />
                              )}
                            </button>

                            <a
                              href={`https://wa.me/${(seller.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Olá ${seller.name}! ✨ Aqui está seu link exclusivo de divulgação da ANA FITNESS WEAR com o seu cupom ${seller.coupon_code}:\n\n🔗 ${getAffiliateLink(seller.coupon_code)}\n\nTodas as compras feitas por esse link já ativam o seu cupom automaticamente para suas clientes e registram seus ${seller.commission_pct}% de comissão no seu painel!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 border border-[#25D366]/40 hover:border-[#25D366] bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition"
                              title="Enviar link e cupom para WhatsApp da Vendedora"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleOpenEditSeller(seller)}
                              className="p-1.5 border border-deep-black/20 hover:border-deep-black bg-white text-deep-black transition"
                              title="Editar Vendedora"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteOrRejectSeller(seller)}
                              className="p-1.5 border border-deep-black/20 hover:border-red-600 hover:text-red-600 bg-white text-deep-black transition"
                              title={seller.approval_status === 'PENDING' ? 'Recusar Solicitação' : 'Excluir Vendedora'}
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

          {/* =========================================================================
              MODAL 1: CADASTRAR / EDITAR VENDEDORA
             ========================================================================= */}
          {showSellerModal && (
            <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
              <div className="bg-white border-2 border-deep-black w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-luxury my-8">
                <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                      CONFIGURAÇÃO DE EQUIPE
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-wider text-deep-black">
                      {editingSellerId ? 'EDITAR VENDEDORA / CUPOM' : 'CADASTRAR NOVA VENDEDORA'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSellerModal(false)}
                    className="p-1 hover:text-gold transition text-deep-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveSeller} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                        NOME COMPLETO *
                      </label>
                      <input
                        type="text"
                        required
                        value={sellerFormData.name}
                        onChange={(e) => setSellerFormData({ ...sellerFormData, name: e.target.value })}
                        placeholder="Ex: Carolina Mendes"
                        className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                        WHATSAPP / TELEFONE
                      </label>
                      <input
                        type="text"
                        value={sellerFormData.phone}
                        onChange={(e) => setSellerFormData({ ...sellerFormData, phone: e.target.value })}
                        placeholder="+1 (978) 000-0000"
                        className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono focus:outline-none focus:border-deep-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                        E-MAIL DE ACESSO AO PORTAL
                      </label>
                      <input
                        type="email"
                        value={sellerFormData.email}
                        onChange={(e) => setSellerFormData({ ...sellerFormData, email: e.target.value })}
                        placeholder="carol@exemplo.com"
                        className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono focus:outline-none focus:border-deep-black"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center justify-between">
                        <span>SENHA DE ACESSO DA VENDEDORA *</span>
                        <span className="text-[9px] text-green-700 font-bold">🔒 NUNCA É PERDIDA</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sellerFormData.password}
                        onChange={(e) => setSellerFormData({ ...sellerFormData, password: e.target.value })}
                        placeholder="Ex: carol123"
                        className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono font-bold focus:outline-none focus:border-deep-black"
                      />
                      <span className="text-[9px] text-deep-black/60 uppercase block">
                        Ao alterar comissão, dados ou cupom, a senha é sempre preservada intacta.
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-deep-black/5 border border-deep-black/10 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-gold" />
                        <span>CÓDIGO DO CUPOM DA VENDEDORA *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sellerFormData.coupon_code}
                        onChange={(e) => setSellerFormData({ ...sellerFormData, coupon_code: e.target.value.toUpperCase() })}
                        placeholder="EX: CAROL10"
                        className="w-full px-3 py-2 border border-deep-black/30 text-sm font-mono font-black uppercase tracking-wider focus:outline-none focus:border-deep-black"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Comissão da Vendedora */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                          % COMISSÃO DA VENDEDORA
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            required
                            value={sellerFormData.commission_pct}
                            onChange={(e) => setSellerFormData({ ...sellerFormData, commission_pct: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono font-black focus:outline-none focus:border-deep-black"
                          />
                          <span className="absolute right-3 top-2 font-mono font-bold text-deep-black">%</span>
                        </div>
                        <span className="text-[9px] text-deep-black/60 uppercase block">
                          Valor que Ana Carina paga à vendedora.
                        </span>
                      </div>

                      {/* Desconto do Cliente */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                          % DESCONTO PARA O CLIENTE
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            required
                            value={sellerFormData.customer_discount_pct}
                            onChange={(e) => setSellerFormData({ ...sellerFormData, customer_discount_pct: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono font-black focus:outline-none focus:border-deep-black"
                          />
                          <span className="absolute right-3 top-2 font-mono font-bold text-deep-black">%</span>
                        </div>
                        <span className="text-[9px] text-deep-black/60 uppercase block">
                          <strong>Coloque 0%</strong> se o cliente pagar preço cheio.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dados de Repasse / Pagamento */}
                  <div className="p-4 bg-gold/10 border border-gold/40 space-y-4">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-gold" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                        DADOS BANCÁRIOS / REPASSE DA COMISSÃO
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                          MÉTODO PREFERIDO DE REPASSE
                        </label>
                        <select
                          value={sellerFormData.payout_method}
                          onChange={(e) => setSellerFormData({ ...sellerFormData, payout_method: e.target.value as any })}
                          className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black bg-white"
                        >
                          <option value="ZELLE">ZELLE (Telefone ou E-mail)</option>
                          <option value="VENMO">VENMO (@usuario)</option>
                          <option value="CASHAPP">CASH APP ($cashtag)</option>
                          <option value="PIX">PIX (Banco Brasileiro)</option>
                          <option value="BANK">CONTA BANCÁRIA (Routing/Account)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                          CHAVE / TELEFONE / E-MAIL DE RECEBIMENTO
                        </label>
                        <input
                          type="text"
                          value={sellerFormData.payout_key}
                          onChange={(e) => setSellerFormData({ ...sellerFormData, payout_key: e.target.value })}
                          placeholder="Ex: +1 (508) 000-0000 ou @venmo"
                          className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono font-bold focus:outline-none focus:border-deep-black bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                        NOME DO TITULAR DA CONTA (BENEFICIÁRIO)
                      </label>
                      <input
                        type="text"
                        value={sellerFormData.payout_beneficiary}
                        onChange={(e) => setSellerFormData({ ...sellerFormData, payout_beneficiary: e.target.value })}
                        placeholder="Nome exato cadastrado no banco ou Zelle"
                        className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSellerModal(false)}
                      className="px-4 py-2.5 border border-deep-black/30 hover:border-deep-black text-deep-black font-black uppercase tracking-wider text-xs transition"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white font-black uppercase tracking-widest text-xs transition shadow"
                    >
                      {editingSellerId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR VENDEDORA'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL 2: REGISTRAR REPASSE DE PAGAMENTO
             ========================================================================= */}
          {showPayoutModal && payoutSeller && (
            <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white border-2 border-deep-black w-full max-w-md p-6 sm:p-8 space-y-6 shadow-luxury">
                <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                      REPASSE DE COMISSÃO
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-wider text-deep-black">
                      REGISTRAR PAGAMENTO
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="p-1 hover:text-gold transition text-deep-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 bg-deep-black/5 border border-deep-black/10 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-deep-black/60 font-bold uppercase">VENDEDORA:</span>
                    <span className="font-black text-deep-black">{payoutSeller.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-deep-black/60 font-bold uppercase">CUPOM:</span>
                    <span className="font-mono font-bold text-deep-black">{payoutSeller.coupon_code}</span>
                  </div>
                  <div className="flex justify-between text-gold font-black border-t border-deep-black/10 pt-2">
                    <span>SALDO PENDENTE ATUAL:</span>
                    <span className="font-mono text-sm font-black">
                      ${Math.max(0, (Number(payoutSeller.total_commission_earned) || 0) - (Number(payoutSeller.total_commission_paid) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Bloco Dourado: Chave de Recebimento da Vendedora */}
                <div className="p-4 bg-gold/15 border-2 border-gold space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-gold" />
                      COMO ELA RECEBE AS COMISSÕES
                    </span>
                    <span className="px-2 py-0.5 bg-deep-black text-gold font-black text-[9px] uppercase tracking-wider">
                      {payoutSeller.payout_method || 'ZELLE'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-deep-black/60 block">
                      CHAVE CADASTRADA PELA VENDEDORA:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-white border border-deep-black/20 font-mono font-black text-xs text-deep-black truncate select-all">
                        {payoutSeller.payout_key || payoutSeller.phone || 'Chave não informada'}
                      </div>
                      {(payoutSeller.payout_key || payoutSeller.phone) && (
                        <button
                          type="button"
                          onClick={() => handleCopyPayoutKey(payoutSeller.payout_key || payoutSeller.phone, 'modal')}
                          className="px-3 py-2 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow whitespace-nowrap"
                        >
                          {copiedPayoutKey === 'modal' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-gold" />
                              <span>COPIADA!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>COPIAR</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {payoutSeller.payout_beneficiary && (
                    <div className="text-[10px] text-deep-black font-bold flex justify-between pt-0.5">
                      <span className="text-deep-black/60">TITULAR:</span>
                      <span className="font-mono">{payoutSeller.payout_beneficiary}</span>
                    </div>
                  )}

                  <p className="text-[9px] text-deep-black/70 italic leading-snug pt-1 border-t border-gold/30">
                    👉 Copie a chave acima, faça o envio pelo app do seu banco (Chase, BoA, Zelle ou Venmo) e confirme o registro abaixo.
                  </p>
                </div>

                <form onSubmit={handleConfirmPayout} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                      VALOR DO REPASSE PAGO ($ USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-mono font-bold text-deep-black">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 border border-deep-black/30 text-sm font-mono font-black focus:outline-none focus:border-deep-black"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                      MÉTODO UTILIZADO PARA PAGAMENTO
                    </label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-deep-black/30 text-xs font-bold uppercase focus:outline-none focus:border-deep-black"
                    >
                      <option value="ZELLE">ZELLE (Transferência Instantânea)</option>
                      <option value="VENMO">VENMO</option>
                      <option value="CASHAPP">CASH APP</option>
                      <option value="PIX">PIX (Banco Brasileiro)</option>
                      <option value="CASH">CASH (Dinheiro em Mãos)</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPayoutModal(false)}
                      className="px-4 py-2.5 border border-deep-black/30 hover:border-deep-black text-deep-black font-black uppercase tracking-wider text-xs transition"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gold hover:bg-gold/90 text-deep-black font-black uppercase tracking-widest text-xs transition shadow"
                    >
                      CONFIRMAR REPASSE
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL 3: APROVAR E ATIVAR VENDEDORA
             ========================================================================= */}
          {approvingSeller && (
            <div className="fixed inset-0 z-50 bg-deep-black/80 flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white border-2 border-deep-black w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-luxury">
                <div className="flex justify-between items-center border-b border-deep-black/10 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                      REVISÃO DE CADASTRO
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-wider text-deep-black">
                      APROVAR E ATIVAR VENDEDORA
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApprovingSeller(null)}
                    className="p-1 hover:text-gold transition text-deep-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 bg-deep-black/5 border border-deep-black/10 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-deep-black/60 font-bold uppercase">CANDIDATA:</span>
                    <span className="font-black text-deep-black">{approvingSeller.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-deep-black/60 font-bold uppercase">CUPOM SOLICITADO:</span>
                    <span className="font-mono font-black text-deep-black text-sm">{approvingSeller.coupon_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-deep-black/60 font-bold uppercase">CONTATO:</span>
                    <span className="font-mono text-deep-black">
                      {approvingSeller.phone || approvingSeller.email}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-deep-black/10 pt-2">
                    <span className="text-deep-black/60 font-bold uppercase">DADOS DE REPASSE:</span>
                    <span className="font-mono font-bold text-deep-black">
                      {approvingSeller.payout_method || 'ZELLE'}: {approvingSeller.payout_key || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-deep-black/10 pt-2">
                    <span className="text-deep-black/60 font-bold uppercase">SENHA DE ACESSO:</span>
                    <span className="font-mono font-bold text-deep-black flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-deep-black/10 text-deep-black font-bold text-[10px]">
                        {approvingSeller.password || 'ana123'}
                      </span>
                      <span className="text-[9px] text-green-700 font-bold">✓ Preservada</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-300 text-green-900 text-[10px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-700 shrink-0" />
                    <span>Termo de Conduta Ética e Tolerância Zero: ACEITO PELA CANDIDATA</span>
                  </div>
                </div>

                <form onSubmit={handleConfirmApprove} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                        % COMISSÃO DA VENDEDORA *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          required
                          value={approveCommissionPct}
                          onChange={(e) => setApproveCommissionPct(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono font-black focus:outline-none focus:border-deep-black"
                        />
                        <span className="absolute right-3 top-2 font-mono font-bold text-deep-black">%</span>
                      </div>
                      <span className="text-[9px] text-deep-black/60 uppercase block">
                        Quanto você paga à vendedora.
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-deep-black">
                        % DESCONTO PARA O CLIENTE *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          required
                          value={approveDiscountPct}
                          onChange={(e) => setApproveDiscountPct(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono font-black focus:outline-none focus:border-deep-black"
                        />
                        <span className="absolute right-3 top-2 font-mono font-bold text-deep-black">%</span>
                      </div>
                      <span className="text-[9px] text-deep-black/60 uppercase block">
                        Coloque 0% se o cliente pagar preço normal.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-deep-black/10">
                    <label className="text-[10px] font-black uppercase tracking-widest text-deep-black flex items-center justify-between">
                      <span>SENHA DE ACESSO DA VENDEDORA:</span>
                      <span className="text-[9px] text-green-700 font-bold">🔒 NUNCA É PERDIDA</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={approvePassword}
                      onChange={(e) => setApprovePassword(e.target.value)}
                      placeholder="Senha da vendedora"
                      className="w-full px-3 py-2 border border-deep-black/30 text-xs font-mono font-bold focus:outline-none focus:border-deep-black bg-gray-50"
                    />
                    <span className="text-[9px] text-deep-black/60 uppercase block">
                      A senha que a vendedora cadastrou é sempre preservada. Se desejar alterá-la para ela, você pode editar acima.
                    </span>
                  </div>

                  <div className="p-3 bg-green-50 border border-green-300 text-green-900 text-[10px] uppercase font-bold leading-relaxed">
                    ✨ Ao clicar em confirmar, o cupom <strong>{approvingSeller.coupon_code}</strong> será ativado imediatamente para compras na loja e o login da vendedora no portal será liberado!
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setApprovingSeller(null)}
                      className="px-4 py-2.5 border border-deep-black/30 hover:border-deep-black text-deep-black font-black uppercase tracking-wider text-xs transition"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white font-black uppercase tracking-widest text-xs transition shadow flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>CONFIRMAR & ATIVAR VENDEDORA</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {activeTab === 'finances' && (
        <SimpleFinancesView
          salesData={salesData}
          sellers={sellers}
          onOpenWriteOffModal={() => {
            setWriteOffModalTab('NEW');
            setShowWriteOffModal(true);
          }}
        />
      )}

      {/* =========================================================================
          TAB: FORNECEDORES & CONFECÇÕES PARCEIRAS
         ========================================================================= */}
      {activeTab === 'suppliers' && (
        <SuppliersManagementView
          products={baseCatalogList}
          onShowFeedback={(msg) => {
            setSaveSuccessMessage(true);
            setTimeout(() => setSaveSuccessMessage(false), 5000);
          }}
        />
      )}

      {/* =========================================================================
          TAB: RELATÓRIOS DE ACESSOS E TRÁFEGO (CIDADE, DISPOSITIVO, PÁGINAS, TEMPO)
         ========================================================================= */}
      {activeTab === 'reports' && <AccessReportsView />}

      {/* =========================================================================
          TAB 6: APARÊNCIA DA LOJA (CMS VISUAL)
         ========================================================================= */}
      {(activeTab === 'cms' || activeTab === 'theme') && <AppearanceCmsView initialSubTab={cmsSubTab} />}

      {/* =========================================================================
          TAB 6: CLIENTES E PROVA SOCIAL (REVIEWS)
         ========================================================================= */}
      {activeTab === 'customers' && <CustomersReviewsView salesData={salesData} />}

      {/* =========================================================================
          TAB 7: CONFIGURAÇÕES TÉCNICAS E ACESSOS
         ========================================================================= */}
      {activeTab === 'settings' && <TechnicalSettingsView />}

      {/* =========================================================================
          TAB 8: CATÁLOGO DE DIVULGAÇÃO EM PDF (WHATSAPP)
         ========================================================================= */}
      {activeTab === 'whatsapp-catalog' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border-2 border-deep-black p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-green-700 font-black text-xs uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-green-600" />
                <span>RELATÓRIO & CATÁLOGO OFICIAL DE DIVULGAÇÃO (WHATSAPP)</span>
              </div>
              <p className="text-xs text-deep-black/70 uppercase tracking-wide mt-1">
                Visualização formatada para divulgação com fotos lado a lado, preços originais, promoções e estoque por tamanho.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Link
                href="/backoffice/catalogo-pdf"
                target="_blank"
                className="px-4 py-2.5 border-2 border-deep-black bg-white hover:bg-gray-100 text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir em Nova Aba (PDF)</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowWhatsAppCatalogModal(true)}
                className="px-5 py-2.5 bg-gold hover:bg-deep-black hover:text-gold text-deep-black font-black text-xs uppercase tracking-wider transition flex items-center gap-2 border-2 border-deep-black shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4 stroke-[3]" />
                <span>CONFIGURAR & BAIXAR PDF</span>
              </button>
            </div>
          </div>

          {/* Banner de Capa */}
          <div className="bg-deep-black text-white p-6 border-2 border-gold shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-gold">
                {siteInfo?.storeName || 'ANA FITNESS WEAR'}
              </h2>
              <p className="text-xs font-black uppercase tracking-widest text-white/80 mt-1">
                CATÁLOGO DE PRODUTOS & PRONTA ENTREGA • GRUPOS WHATSAPP
              </p>
            </div>
            <div className="text-left md:text-right space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#25d366] text-black font-black text-xs">
                <span>📲 PEDIDOS WHATSAPP: {siteInfo?.whatsapp || siteInfo?.phone || '+1 (978) 313-9452'}</span>
              </div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">
                {siteInfo?.address || 'Showroom Leominster, MA'} • ATUALIZADO EM {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          <div className="text-center p-8 bg-white border-2 border-deep-black space-y-4">
            <p className="text-sm font-black uppercase text-deep-black">
              Clique abaixo para abrir a janela com os filtros ou abrir a página direta para salvar o PDF:
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowWhatsAppCatalogModal(true)}
                className="px-6 py-3 bg-[#25d366] hover:bg-green-600 text-black font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-md border-2 border-deep-black cursor-pointer"
              >
                <Printer className="w-4 h-4 stroke-[3]" />
                <span>ABRIR CATÁLOGO & GERAR PDF</span>
              </button>
              <Link
                href="/backoffice/catalogo-pdf"
                target="_blank"
                className="px-6 py-3 bg-white hover:bg-gray-100 text-deep-black font-black text-xs uppercase tracking-widest transition flex items-center gap-2 border-2 border-deep-black shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>VER EM PÁGINA CHEIA (PRONTO P/ SALVAR)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 12. Direct Instagram & Atendimento Automatizado (Robô Meta API) */}
      {activeTab === 'instagram-direct' && <InstagramDirectView />}

      {/* Modal Oficial de Baixa / Saída de Estoque Sem Custo (Uso Próprio, Brindes, Amostras) */}
      <StockWriteOffModal
        isOpen={showWriteOffModal}
        onClose={() => setShowWriteOffModal(false)}
        onSuccess={() => {
          setSaveSuccessMessage(true);
          setTimeout(() => setSaveSuccessMessage(false), 5000);
          fetchSupabaseProducts();
          fetchSalesData();
          fetchWriteOffs();
        }}
        catalogProducts={baseCatalogList}
        initialTab={writeOffModalTab}
      />

      {/* Modal de Catálogo PDF para Divulgação no WhatsApp (Renderizado no nível raiz para funcionar em QUALQUER aba) */}
      <WhatsAppCatalogPdfModal
        isOpen={showWhatsAppCatalogModal}
        onClose={() => setShowWhatsAppCatalogModal(false)}
        catalogProducts={baseCatalogList}
        siteInfo={siteInfo}
      />

      {/* Modal Oficial de Relatório de Vendas e Fechamento com Soma de Tudo */}
      <SalesReportModal
        isOpen={showSalesReportModal}
        onClose={() => setShowSalesReportModal(false)}
        sales={filteredSalesList}
        totals={filteredSalesTotals}
        periodLabel={getSalesPeriodLabel()}
        onExportCsv={handleExportSalesCsv}
        onPrintReport={handlePrintSalesReportWindow}
      />
    </div>
  );
}
