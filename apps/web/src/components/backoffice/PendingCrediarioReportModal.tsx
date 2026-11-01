'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Search,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  FileText,
  ChevronRight,
  Filter,
  Phone,
  MapPin,
  ExternalLink,
  Sparkles,
  CreditCard,
  Ban,
  Receipt,
  User,
} from 'lucide-react';
import { computeSaleFinancials } from '@/lib/salesFinancials';
import { printCrediarioCarnet } from '@/lib/whatsappMessages';

export interface PendingCrediarioReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: any[];
  initialFilter?: 'ALL' | 'THIS_MONTH' | 'OVERDUE';
  onOpenPaymentModal?: (sale: any, installmentNumber?: number, amount?: number) => void;
  onSelectSale?: (sale: any) => void;
}

export function PendingCrediarioReportModal({
  isOpen,
  onClose,
  sales = [],
  initialFilter = 'ALL',
  onOpenPaymentModal,
  onSelectSale,
}: PendingCrediarioReportModalProps) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'THIS_MONTH' | 'OVERDUE'>(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');

  // Sincroniza filtro inicial ao abrir
  React.useEffect(() => {
    if (isOpen) {
      setFilterTab(initialFilter);
    }
  }, [isOpen, initialFilter]);

  // Fuso horário oficial de Massachusetts (EDT / EST)
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  }, []);
  const currentMonthStr = todayStr.substring(0, 7); // 'YYYY-MM'

  // Mapeamento e cálculo de todos os crediários e saldos em aberto
  const pendingItems = useMemo(() => {
    const activeSales = (sales || []).filter((s: any) => s.status !== 'CANCELLED');
    const list: any[] = [];

    activeSales.forEach((s: any) => {
      const fin = computeSaleFinancials(s);
      const m = (s.payment_method || '').toUpperCase();
      const isCrediario = m === 'CREDIARIO' || !!s.crediario;

      const downPay = Math.max(0, Number(s.crediario?.down_payment) || 0);
      const paymentsList = Array.isArray(s.payments)
        ? s.payments
        : (Array.isArray(s.crediario?.payments) ? s.crediario.payments : []);
      const installments: any[] = Array.isArray(s.crediario?.installments) ? s.crediario.installments : [];

      let paidAmount = 0;
      if (paymentsList.length > 0) {
        paidAmount = paymentsList.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      } else if (isCrediario) {
        const paidInsts = installments.filter((i: any) => i.status === 'PAID').reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
        paidAmount = downPay + paidInsts;
      } else {
        paidAmount = Number(s.amount_paid) || 0;
      }

      let remainingBalance = 0;
      if (s.remaining_balance !== undefined && !isNaN(Number(s.remaining_balance))) {
        remainingBalance = Math.max(0, Number(s.remaining_balance));
      } else if (isCrediario) {
        remainingBalance = Math.max(0, Number((fin.afterDiscount - paidAmount).toFixed(2)));
      } else if (s.payment_status === 'WAITING_PAYMENT' || s.payment_status === 'PARTIAL') {
        remainingBalance = Math.max(0, Number((fin.afterDiscount - paidAmount).toFixed(2)));
      }

      // Se não há saldo pendente e todas as parcelas estão pagas, ignora
      const pendingInstallments = installments.filter((i: any) => i.status === 'PENDING');
      const hasPendingInstallments = pendingInstallments.length > 0;

      if (remainingBalance <= 0.01 && !hasPendingInstallments) {
        return;
      }

      // Identifica parcelas vencidas e vencendo no mês
      let hasOverdue = false;
      let hasDueThisMonth = false;
      let overdueAmount = 0;
      let thisMonthAmount = 0;

      if (installments.length > 0) {
        pendingInstallments.forEach((inst: any) => {
          const due = inst.due_date || '';
          const amt = Number(inst.amount) || 0;
          if (due && due < todayStr) {
            hasOverdue = true;
            overdueAmount += amt;
          }
          if (due && due.startsWith(currentMonthStr)) {
            hasDueThisMonth = true;
            thisMonthAmount += amt;
          }
        });
      } else {
        // Sem grade explícita de parcelas
        const saleMonth = (s.created_at || '').substring(0, 7);
        if (saleMonth === currentMonthStr) {
          hasDueThisMonth = true;
          thisMonthAmount = remainingBalance;
        } else if (s.created_at && s.created_at.substring(0, 10) < todayStr) {
          hasOverdue = true;
          overdueAmount = remainingBalance;
        }
      }

      // Próxima parcela a vencer
      const sortedPending = [...pendingInstallments].sort((a, b) => {
        return (a.due_date || '').localeCompare(b.due_date || '');
      });
      const nextDue = sortedPending[0] || null;

      list.push({
        id: s.id || s.order_id,
        orderId: s.order_id || s.id,
        customerName: s.customer_name || s.shipping_address?.customer_name || 'Cliente Showroom',
        customerPhone: s.customer_phone || s.shipping_address?.phone || '',
        customerDoc: s.crediario?.customer_doc || '',
        customerCity: s.shipping_address?.city || 'Showroom Leominster, MA',
        totalAfterDiscount: fin.afterDiscount,
        paidAmount,
        remainingBalance,
        isCrediario,
        paymentMethod: s.payment_method || 'CREDIARIO',
        paymentStatus: s.payment_status || 'PARTIAL',
        installments,
        pendingInstallments,
        nextDue,
        hasOverdue,
        hasDueThisMonth,
        overdueAmount,
        thisMonthAmount,
        createdAt: s.created_at,
        items: s.items || [],
        saleRaw: s,
      });
    });

    // Ordenação: primeiro os atrasados, depois os com vencimento mais próximo
    return list.sort((a, b) => {
      if (a.hasOverdue && !b.hasOverdue) return -1;
      if (!a.hasOverdue && b.hasOverdue) return 1;
      const dateA = a.nextDue?.due_date || a.createdAt || '';
      const dateB = b.nextDue?.due_date || b.createdAt || '';
      return dateA.localeCompare(dateB);
    });
  }, [sales, todayStr, currentMonthStr]);

  // Totais consolidados
  const totalOutstanding = useMemo(() => {
    return pendingItems.reduce((acc, it) => acc + it.remainingBalance, 0);
  }, [pendingItems]);

  const totalThisMonth = useMemo(() => {
    return pendingItems.reduce((acc, it) => acc + it.thisMonthAmount, 0);
  }, [pendingItems]);

  const totalOverdue = useMemo(() => {
    return pendingItems.reduce((acc, it) => acc + it.overdueAmount, 0);
  }, [pendingItems]);

  // Itens filtrados por busca e aba
  const filteredItems = useMemo(() => {
    return pendingItems.filter((it) => {
      // Filtro de aba
      if (filterTab === 'THIS_MONTH' && !it.hasDueThisMonth) return false;
      if (filterTab === 'OVERDUE' && !it.hasOverdue) return false;

      // Filtro de busca
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = it.customerName.toLowerCase().includes(q);
        const matchPhone = it.customerPhone.toLowerCase().includes(q);
        const matchOrder = String(it.orderId).toLowerCase().includes(q);
        const matchDoc = it.customerDoc.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchOrder && !matchDoc) return false;
      }

      return true;
    });
  }, [pendingItems, filterTab, searchTerm]);

  // Impressão oficial do relatório em janela própria (PDF / Impressora)
  const handlePrintReport = () => {
    if (typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = filteredItems.map((it, idx) => {
      const nextDueDateFormatted = it.nextDue?.due_date
        ? it.nextDue.due_date.split('-').reverse().join('/')
        : 'À Combinar';

      let statusBadge = '<span style="color: #15803d; font-weight: bold;">EM DIA</span>';
      if (it.hasOverdue) {
        statusBadge = '<span style="color: #b91c1c; font-weight: bold; background: #fee2e2; padding: 2px 6px;">⚠️ ATRASADA</span>';
      } else if (it.hasDueThisMonth) {
        statusBadge = '<span style="color: #b45309; font-weight: bold; background: #fef3c7; padding: 2px 6px;">📅 VENCE NO MÊS</span>';
      }

      const instInfo = it.nextDue
        ? `Parc. ${it.nextDue.number}/${it.installments.length} ($${Number(it.nextDue.amount).toFixed(2)})`
        : `${it.pendingInstallments.length} parc. pend.`;

      return `
        <tr style="border-bottom: 1px solid #ddd; font-size: 11px;">
          <td style="padding: 8px 6px; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px 6px;">
            <strong>${it.customerName}</strong>
            ${it.customerDoc ? `<br/><span style="color:#666; font-size: 9px;">DOC: ${it.customerDoc}</span>` : ''}
          </td>
          <td style="padding: 8px 6px; font-family: monospace;">${it.customerPhone || '-'}</td>
          <td style="padding: 8px 6px; font-family: monospace;">#${it.orderId}</td>
          <td style="padding: 8px 6px; text-align: right; font-family: monospace;">$${it.totalAfterDiscount.toFixed(2)}</td>
          <td style="padding: 8px 6px; text-align: right; font-family: monospace; color: #15803d;">$${it.paidAmount.toFixed(2)}</td>
          <td style="padding: 8px 6px; text-align: right; font-family: monospace; font-weight: 900; color: #b91c1c; background: #fff1f2;">$${it.remainingBalance.toFixed(2)}</td>
          <td style="padding: 8px 6px; font-family: monospace;">${nextDueDateFormatted}<br/><span style="color:#666; font-size: 9px;">${instInfo}</span></td>
          <td style="padding: 8px 6px; text-align: center;">${statusBadge}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Crediários e Saldos Pendentes - ANA FITNESS WEAR</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; font-size: 12px; margin: 0; }
            .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
            .brand { font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
            .tagline { font-size: 11px; color: #666; margin-top: 2px; }
            .report-title { font-size: 15px; font-weight: 900; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; color: #000; }
            .kpis { display: flex; justify-content: space-between; background: #f4f4f4; border: 1px solid #ccc; padding: 12px; margin-bottom: 16px; font-size: 12px; }
            .kpi-box { text-align: center; }
            .kpi-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; }
            .kpi-val { font-size: 18px; font-weight: 900; font-family: monospace; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #000; color: #fff; text-transform: uppercase; font-size: 9px; padding: 8px 6px; text-align: left; }
            .footer { margin-top: 24px; border-top: 1px solid #ccc; padding-top: 12px; text-align: center; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">ANA FITNESS WEAR</div>
            <div class="tagline">Showroom Leominster, Massachusetts • www.anafitnesswear.com</div>
            <div class="report-title">RELATÓRIO OFICIAL DE CREDIÁRIOS & SALDOS PENDENTES</div>
            <div style="font-size: 10px; color: #555; margin-top: 4px;">Gerado em: ${new Date().toLocaleString('pt-BR')} (Fuso Leominster / NY)</div>
          </div>

          <div class="kpis">
            <div class="kpi-box">
              <div class="kpi-title">Clientes Devedores</div>
              <div class="kpi-val">${filteredItems.length}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Saldo Total a Receber</div>
              <div class="kpi-val" style="color: #b91c1c;">$${totalOutstanding.toFixed(2)}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Pendente Este Mês</div>
              <div class="kpi-val" style="color: #b45309;">$${totalThisMonth.toFixed(2)}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-title">Total Atrasado</div>
              <div class="kpi-val" style="color: #991b1b;">$${totalOverdue.toFixed(2)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Pedido</th>
                <th style="text-align: right;">Total Venda</th>
                <th style="text-align: right;">Já Pago</th>
                <th style="text-align: right;">Saldo Devedor</th>
                <th>Próx. Vencimento</th>
                <th style="text-align: center;">Situação</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <p>Ana Fitness Wear • Relatório Confidencial de Cobrança e Gestão de Carnês</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Envio amigável de cobrança via WhatsApp
  const handleSendWhatsAppReminder = (item: any) => {
    const cleanPhone = String(item.customerPhone || '').replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;

    const nextDueDateFormatted = item.nextDue?.due_date
      ? item.nextDue.due_date.split('-').reverse().join('/')
      : 'breve';

    const instText = item.nextDue
      ? `Parcela ${item.nextDue.number}/${item.installments.length} no valor de *$${Number(item.nextDue.amount).toFixed(2)} USD* (vencimento em *${nextDueDateFormatted}*)`
      : `saldo de *$${item.remainingBalance.toFixed(2)} USD*`;

    let msg = `Olá *${item.customerName}*! Tudo bem? 💕\n\n`;
    msg += `Passando com carinho para lembrar sobre o seu crediário na *Ana Fitness Wear* ✨\n\n`;
    msg += `▫️ *Pedido:* #${item.orderId}\n`;
    msg += `▫️ *Referência:* ${instText}\n`;
    msg += `▫️ *Saldo Devedor Restante:* $${item.remainingBalance.toFixed(2)} USD\n\n`;
    msg += `💳 *FORMAS DE PAGAMENTO:* \n`;
    msg += `• *Zelle:* anafitweareua@gmail.com\n`;
    msg += `• *Venmo:* @anafitnesswear\n`;
    msg += `• *Dinheiro / Cash:* Showroom em Leominster, MA\n\n`;
    msg += `Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem. Muito obrigada pela confiança e carinho! 🥰✨`;

    if (fullPhone) {
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-deep-black/85 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border-3 border-gold max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="bg-deep-black text-white p-4 sm:p-5 border-b-2 border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-gold inline-block animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gold font-mono">
                PAINEL EXECUTIVO • CONTROLE DE CARNÊS & COBRANÇA
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gold" />
              <span>RELATÓRIO DE CREDIÁRIOS PENDENTES</span>
            </h2>
            <p className="text-[11px] text-white/70 uppercase">
              Lista completa de clientes com saldo a receber, parcelas a vencer e atrasadas.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrintReport}
              className="px-3.5 py-2 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow cursor-pointer"
              title="Imprimir relatório gerencial ou salvar em PDF"
            >
              <Printer className="w-4 h-4 text-deep-black" />
              <span>IMPRIMIR / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Fechar relatório"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 4 Cards de Métricas de Destaque no Topo do Relatório */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-gray-50 border-b border-deep-black/10">
          {/* 1. Clientes Devedores */}
          <div className="p-3 bg-white border border-deep-black/15 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-deep-black/60 flex items-center gap-1">
                <User className="w-3 h-3 text-gold" />
                <span>CLIENTES</span>
              </span>
              <span className="text-[8px] font-mono text-deep-black/60 uppercase">TOTAL</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-deep-black font-mono">
              {pendingItems.length}
            </div>
            <span className="text-[9px] text-deep-black/60 font-bold uppercase block">
              com saldo em aberto
            </span>
          </div>

          {/* 2. Saldo Total a Receber */}
          <div className="p-3 bg-amber-50 border-2 border-amber-500 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-amber-950 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-amber-700" />
                <span>TOTAL A RECEBER</span>
              </span>
              <span className="px-1 py-0.2 bg-amber-700 text-white text-[7.5px] font-black font-mono uppercase">
                PENDENTE
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono">
              ${totalOutstanding.toFixed(2)}
            </div>
            <span className="text-[9px] text-amber-800 font-bold uppercase block">
              saldo devedor acumulado
            </span>
          </div>

          {/* 3. Vencendo no Mês */}
          <div className="p-3 bg-white border-2 border-deep-black space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-deep-black flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gold" />
                <span>NESTE MÊS</span>
              </span>
              <span className="px-1 py-0.2 bg-gold/30 text-deep-black text-[7.5px] font-black font-mono uppercase">
                {currentMonthStr}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-deep-black font-mono">
              ${totalThisMonth.toFixed(2)}
            </div>
            <span className="text-[9px] text-deep-black/60 font-bold uppercase block">
              parcelas do mês atual
            </span>
          </div>

          {/* 4. Total Atrasado */}
          <div className="p-3 bg-red-50 border-2 border-red-500 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-red-950 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span>ATRASADO</span>
              </span>
              <span className="px-1 py-0.2 bg-red-600 text-white text-[7.5px] font-black font-mono uppercase">
                VENCIDO
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-red-600 font-mono">
              ${totalOverdue.toFixed(2)}
            </div>
            <span className="text-[9px] text-red-800 font-bold uppercase block">
              requer cobrança prioritária
            </span>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="p-3 sm:p-4 bg-white border-b border-deep-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Abas de Filtro */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition border cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-deep-black text-gold border-deep-black shadow-xs'
                  : 'bg-gray-100 text-deep-black/70 border-deep-black/15 hover:border-deep-black'
              }`}
            >
              TODOS OS PENDENTES ({pendingItems.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('THIS_MONTH')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition border cursor-pointer ${
                filterTab === 'THIS_MONTH'
                  ? 'bg-deep-black text-gold border-deep-black shadow-xs'
                  : 'bg-gray-100 text-deep-black/70 border-deep-black/15 hover:border-deep-black'
              }`}
            >
              📅 VENCENDO ESTE MÊS ({pendingItems.filter((i) => i.hasDueThisMonth).length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('OVERDUE')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition border cursor-pointer ${
                filterTab === 'OVERDUE'
                  ? 'bg-red-700 text-white border-red-800 shadow-xs'
                  : 'bg-red-50 text-red-800 border-red-300 hover:border-red-600'
              }`}
            >
              ⚠️ ATRASADOS ({pendingItems.filter((i) => i.hasOverdue).length})
            </button>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-deep-black/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, telefone, pedido..."
              className="w-full pl-8 pr-3 py-1.5 border border-deep-black/30 text-xs text-deep-black font-medium uppercase placeholder:text-deep-black/40 focus:border-gold focus:outline-hidden"
            />
          </div>
        </div>

        {/* Tabela / Lista de Clientes com Rolagem Suave */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center bg-white border border-deep-black/10 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-black uppercase tracking-wider text-deep-black">
                Nenhum crediário pendente encontrado
              </h3>
              <p className="text-xs text-deep-black/60 uppercase">
                Não há registros com os filtros atuais ou todas as parcelas foram quitadas com sucesso!
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const nextDueDateFormatted = item.nextDue?.due_date
                ? item.nextDue.due_date.split('-').reverse().join('/')
                : null;

              return (
                <div
                  key={item.id}
                  className={`bg-white border-2 p-4 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    item.hasOverdue
                      ? 'border-red-400 hover:border-red-600 bg-red-50/20'
                      : 'border-deep-black/20 hover:border-gold'
                  }`}
                >
                  {/* Coluna 1: Cliente e Pedido */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm uppercase text-deep-black tracking-wide">
                        {item.customerName}
                      </span>
                      {item.hasOverdue && (
                        <span className="px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase font-mono animate-pulse">
                          ⚠️ PARCELA ATRASADA
                        </span>
                      )}
                      {item.hasDueThisMonth && !item.hasOverdue && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-deep-black text-[8px] font-black uppercase font-mono">
                          📅 VENCE ESTE MÊS
                        </span>
                      )}
                      <span className="text-[9px] font-mono font-bold text-deep-black/60 bg-gray-100 px-1.5 py-0.5 border border-deep-black/10">
                        PEDIDO #{item.orderId}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-deep-black/70 flex-wrap">
                      {item.customerPhone && (
                        <span className="font-mono flex items-center gap-1 font-bold">
                          <Phone className="w-3 h-3 text-gold" />
                          <span>{item.customerPhone}</span>
                        </span>
                      )}
                      {item.customerCity && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-deep-black/40" />
                          <span>{item.customerCity}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-deep-black/50 font-mono">
                        Compra: {new Date(item.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {/* Resumo de Peças */}
                    {item.items && item.items.length > 0 && (
                      <p className="text-[10px] text-deep-black/60 truncate uppercase">
                        <strong>Peças:</strong> {item.items.map((i: any) => `${i.quantity || 1}x ${i.title || i.name}`).join(', ')}
                      </p>
                    )}

                    {/* Status das Parcelas do Carnê */}
                    {item.installments && item.installments.length > 0 && (
                      <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
                        {item.installments.map((inst: any, idx: number) => {
                          const isPaid = inst.status === 'PAID';
                          const isPast = inst.due_date && inst.due_date < todayStr && !isPaid;
                          const [y, m, d] = (inst.due_date || '').split('-');
                          const dFmt = d && m ? `${d}/${m}` : inst.due_date;

                          return (
                            <span
                              key={idx}
                              className={`text-[8.5px] font-mono px-2 py-0.5 border font-bold ${
                                isPaid
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : isPast
                                  ? 'bg-red-100 text-red-800 border-red-400 font-black'
                                  : 'bg-amber-50 text-amber-900 border-amber-300'
                              }`}
                            >
                              {inst.number}ª Parc: ${Number(inst.amount).toFixed(2)} ({dFmt}) • {isPaid ? 'PAGA' : isPast ? 'ATRASADA' : 'EM ABERTO'}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Coluna 2: Bloco de Valores */}
                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-deep-black/10 pt-2 md:pt-0 md:pl-4 shrink-0 gap-1 text-right">
                    <div>
                      <span className="text-[8.5px] uppercase font-bold text-deep-black/60 block">
                        Saldo Devedor:
                      </span>
                      <div className="text-xl sm:text-2xl font-black font-mono text-red-600">
                        ${item.remainingBalance.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-[10px] text-deep-black/70 font-mono">
                      <span>Total: ${item.totalAfterDiscount.toFixed(2)}</span>
                      <span className="text-emerald-700 font-bold ml-1.5">
                        (Pago: ${item.paidAmount.toFixed(2)})
                      </span>
                    </div>

                    {nextDueDateFormatted && (
                      <div className="text-[9.5px] font-mono text-deep-black/80 mt-0.5">
                        Próx: <strong className="text-deep-black">{nextDueDateFormatted}</strong>
                        {item.nextDue && (
                          <span className="text-gold font-bold ml-1">
                            (${Number(item.nextDue.amount).toFixed(2)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Coluna 3: Ações Rápidas (Cobrar WhatsApp, Dar Baixa, Carnê, Raio-X) */}
                  <div className="flex items-center md:flex-col gap-1.5 shrink-0 border-t md:border-t-0 md:border-l border-deep-black/10 pt-2 md:pt-0 md:pl-4 justify-end">
                    {/* Botão Cobrar no WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReminder(item)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 border border-emerald-900 shadow-2xs cursor-pointer w-full"
                      title="Enviar mensagem amigável de cobrança no WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                      <span>COBRAR NO WHATSAPP</span>
                    </button>

                    {/* Botão Dar Baixa / Abater */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenPaymentModal) {
                          onOpenPaymentModal(
                            item.saleRaw,
                            item.nextDue?.number,
                            item.nextDue?.amount ? Number(item.nextDue.amount) : item.remainingBalance
                          );
                        }
                      }}
                      className="px-3 py-1.5 bg-deep-black hover:bg-gold hover:text-deep-black text-white text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 border border-gold shadow-2xs cursor-pointer w-full"
                      title="Registrar pagamento ou abate parcial no pedido"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-gold hover:text-deep-black" />
                      <span>+ DAR BAIXA ($)</span>
                    </button>

                    {/* Botão Imprimir Carnê Promissória */}
                    <div className="flex items-center gap-1 w-full">
                      <button
                        type="button"
                        onClick={() => printCrediarioCarnet(item.saleRaw)}
                        className="px-2 py-1 bg-white hover:bg-gray-100 text-deep-black text-[9px] font-black uppercase tracking-wider border border-deep-black/30 transition flex items-center justify-center gap-1 cursor-pointer flex-1"
                        title="Imprimir carnê com promissória e canhotos"
                      >
                        <FileText className="w-3 h-3 text-deep-black" />
                        <span>CARNÊ</span>
                      </button>

                      {/* Ver Pedido Raio-X */}
                      {onSelectSale && (
                        <button
                          type="button"
                          onClick={() => onSelectSale(item.saleRaw)}
                          className="px-2 py-1 bg-white hover:bg-gray-100 text-deep-black text-[9px] font-black uppercase tracking-wider border border-deep-black/30 transition flex items-center justify-center gap-1 cursor-pointer flex-1"
                          title="Abrir detalhes completos da venda"
                        >
                          <ExternalLink className="w-3 h-3 text-deep-black" />
                          <span>PEDIDO</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-deep-black text-white border-t-2 border-gold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] uppercase font-mono text-white/80">
            Mostrando <strong className="text-gold">{filteredItems.length}</strong> de{' '}
            <strong>{pendingItems.length}</strong> clientes com saldo pendente • Saldo exibido:{' '}
            <strong className="text-gold">
              ${filteredItems.reduce((acc, it) => acc + it.remainingBalance, 0).toFixed(2)} USD
            </strong>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrintReport}
              className="px-4 py-2 bg-gold hover:bg-white text-deep-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer className="w-4 h-4 text-deep-black" />
              <span>IMPRIMIR RELATÓRIO</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/30 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              FECHAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
