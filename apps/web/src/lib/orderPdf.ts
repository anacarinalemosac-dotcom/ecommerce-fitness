import { jsPDF } from 'jspdf';
import { formatPaymentMethodLabel } from './whatsappMessages';

export interface NormalizedOrderPdfItem {
  title: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
}

export interface NormalizedOrderForPdf {
  orderId: string;
  createdAtLabel: string;
  statusLabel: string;
  channel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  sellerName: string;
  paymentLabel: string;
  isPickup: boolean;
  deliveryAddressLines: string[];
  trackingCode: string;
  items: NormalizedOrderPdfItem[];
  totalUnits: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  crediario?: any;
}

export interface OrderPdfOptions {
  lang?: 'pt' | 'en';
  skipImages?: boolean;
}

/**
 * Remove emojis/glyphs fora do encoding WinAnsi do jsPDF mantendo acentos portugueses.
 */
export function toPdfText(input: unknown): string {
  const str = String(input ?? '');
  return str
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/\u200D/g, '')
    .replace(/\u2022/g, '-')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDateForPdf(rawDate: any, lang: 'pt' | 'en'): string {
  const d = rawDate ? new Date(rawDate) : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US');
  }
  return d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPaymentForPdf(method: string | undefined, lang: 'pt' | 'en'): string {
  const m = String(method || '').toUpperCase().trim();
  if (m === 'AFTERPAY') return 'Afterpay (4x sem juros)';
  if (m === 'AFFIRM') return 'Affirm (4x sem juros)';
  if (m === 'APPLE_PAY') return 'Apple Pay (Stripe)';
  if (m === 'CARD') return lang === 'pt' ? 'Cartão de Crédito / Débito' : 'Credit / Debit Card';
  if (m === 'CASHAPP' || m === 'CASH_APP') return 'Cash App';
  if (m === 'ZELLE') return 'Zelle';
  if (m === 'VENMO') return 'Venmo';
  if (m === 'CASH') return lang === 'pt' ? 'Dinheiro (Cash)' : 'Cash';
  if (m === 'CREDIARIO') return lang === 'pt' ? 'Crediário / Carnê da Loja' : 'Store Installment Plan';
  return toPdfText(formatPaymentMethodLabel(m)) || (lang === 'pt' ? 'Online' : 'Online');
}

export function normalizeOrderForPdf(order: any, lang: 'pt' | 'en' = 'pt'): NormalizedOrderForPdf {
  const rawOrderId = String(order?.order_id || order?.orderNumber || order?.id?.slice(0, 8) || 'ANA-PEDIDO').trim();
  const orderId = rawOrderId.replace(/^#/, '');
  const addr = order?.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address : {};
  const isPickup =
    order?.delivery_method === 'PICKUP' ||
    addr?.delivery_method === 'PICKUP' ||
    (order?.channel === 'POS_COUNTER' && !addr?.address);

  const deliveryLines: string[] = [];
  if (isPickup) {
    deliveryLines.push(
      lang === 'pt'
        ? 'Retirada no Showroom - 126 First St, Apt 01, Leominster, MA 01453'
        : 'Showroom Pickup - 126 First St, Apt 01, Leominster, MA 01453'
    );
  } else {
    const street = [addr.address || addr.street, addr.apt].filter(Boolean).join(', ');
    const cityStateZip = [[addr.city, addr.state].filter(Boolean).join(', '), addr.zip].filter(Boolean).join(' ');
    if (street) deliveryLines.push(toPdfText(street));
    if (cityStateZip) deliveryLines.push(toPdfText(cityStateZip));
    if (deliveryLines.length === 0) {
      deliveryLines.push(lang === 'pt' ? 'Entrega nos Estados Unidos (USPS)' : 'US Domestic Delivery (USPS)');
    }
  }

  const rawItems = Array.isArray(order?.items) ? order.items : [];
  const items: NormalizedOrderPdfItem[] = rawItems.map((it: any) => {
    const qty = Math.max(1, Number(it?.quantity) || 1);
    const unitPrice = Number(it?.unit_price ?? it?.price ?? 0) || 0;
    return {
      title: toPdfText(it?.title || it?.product_title || it?.name || (lang === 'pt' ? 'Peça Fitness' : 'Fitness Piece')),
      size: toPdfText(it?.size || '-'),
      color: toPdfText(it?.color || '-'),
      sku: toPdfText(it?.sku || 'ANA-ITEM'),
      quantity: qty,
      unitPrice,
      lineTotal: Number((qty * unitPrice).toFixed(2)),
      image: typeof it?.image === 'string' && it.image.trim() ? it.image.trim() : undefined,
    };
  });

  const itemsSum = items.reduce((acc, it) => acc + it.lineTotal, 0);
  const rawSubtotal = Number(order?.subtotal_products ?? order?.subtotal ?? 0) || 0;
  const subtotal = rawSubtotal > 0 ? rawSubtotal : itemsSum;
  const discount = Math.max(0, Number(order?.discount_amount ?? order?.discount ?? 0) || 0);
  const shippingFee =
    order?.shipping_fee !== undefined && order?.shipping_fee !== null
      ? Math.max(0, Number(order.shipping_fee) || 0)
      : 0;
  const computedTotal = Math.max(0, subtotal - discount + shippingFee);
  const explicitTotal = order?.total_amount ?? order?.total;
  const total =
    explicitTotal !== undefined && explicitTotal !== null && Number(explicitTotal) >= 0
      ? Number(explicitTotal)
      : computedTotal;

  const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);

  return {
    orderId,
    createdAtLabel: toPdfText(formatDateForPdf(order?.created_at, lang)),
    statusLabel: toPdfText(order?.status || (lang === 'pt' ? 'CONFIRMADO' : 'CONFIRMED')),
    channel: toPdfText(order?.channel || 'ONLINE'),
    customerName: toPdfText(order?.customer_name || (lang === 'pt' ? 'Cliente' : 'Customer')),
    customerEmail: toPdfText(order?.customer_email || ''),
    customerPhone: toPdfText(order?.customer_phone || ''),
    sellerName: toPdfText(order?.seller_name || 'Ana Fitness Wear'),
    paymentLabel: toPdfText(formatPaymentForPdf(order?.payment_method, lang)),
    isPickup,
    deliveryAddressLines: deliveryLines,
    trackingCode: toPdfText(order?.tracking_code || ''),
    items,
    totalUnits,
    subtotal,
    discount,
    shippingFee,
    total,
    crediario: order?.crediario,
  };
}

const imageDataUrlCache = new Map<string, Promise<string | null>>();

function loadImageAsJpegDataUrl(rawUrl: string): Promise<string | null> {
  if (typeof window === 'undefined' || !rawUrl) return Promise.resolve(null);
  if (rawUrl.startsWith('data:image/jpeg') || rawUrl.startsWith('data:image/png')) {
    return Promise.resolve(rawUrl);
  }
  const existing = imageDataUrlCache.get(rawUrl);
  if (existing) return existing;

  const resolvedUrl =
    rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')
      ? rawUrl
      : `${window.location.origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

  const promise = new Promise<string | null>((resolve) => {
    let settled = false;
    const finish = (val: string | null) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(val);
      }
    };
    const timer = setTimeout(() => finish(null), 2500);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const targetW = 120;
        const targetH = 150;
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);

        const imgRatio = img.width / Math.max(1, img.height);
        const boxRatio = targetW / targetH;
        let drawW = targetW;
        let drawH = targetH;
        let dx = 0;
        let dy = 0;
        if (imgRatio > boxRatio) {
          drawW = targetH * imgRatio;
          dx = (targetW - drawW) / 2;
        } else {
          drawH = targetW / Math.max(0.01, imgRatio);
          dy = (targetH - drawH) / 2;
        }
        ctx.drawImage(img, dx, dy, drawW, drawH);
        finish(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        finish(null);
      }
    };
    img.onerror = () => finish(null);
    img.src = resolvedUrl;
  });

  imageDataUrlCache.set(rawUrl, promise);
  return promise;
}

export async function createOrderPdfDocument(order: any, options: OrderPdfOptions = {}): Promise<{ doc: jsPDF; filename: string; normalized: NormalizedOrderForPdf }> {
  const lang: 'pt' | 'en' = options.lang === 'en' ? 'en' : 'pt';
  const normalized = normalizeOrderForPdf(order, lang);

  // Carrega miniaturas das peças em paralelo (com timeout rápido para não travar)
  const imageMap = new Map<string, string | null>();
  if (!options.skipImages && typeof window !== 'undefined') {
    const uniqueUrls = Array.from(
      new Set(normalized.items.map((it) => it.image).filter((u): u is string => Boolean(u)))
    );
    await Promise.all(
      uniqueUrls.map(async (url) => {
        const dataUrl = await loadImageAsJpegDataUrl(url);
        imageMap.set(url, dataUrl);
      })
    );
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Paleta Ana Fitness Wear
  const deepBlack: [number, number, number] = [13, 13, 13];
  const gold: [number, number, number] = [200, 161, 101];
  const mutedGray: [number, number, number] = [95, 95, 100];
  const lightBg: [number, number, number] = [248, 247, 244];
  const borderGray: [number, number, number] = [220, 220, 220];
  const emerald: [number, number, number] = [21, 128, 61];

  const drawTopHeader = (isContinuation = false): number => {
    doc.setFillColor(...deepBlack);
    doc.rect(0, 0, pageWidth, isContinuation ? 20 : 34, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, isContinuation ? 20 : 34, pageWidth, 1.4, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isContinuation ? 12 : 17);
    doc.text('ANA FITNESS WEAR', margin, isContinuation ? 10 : 14);

    doc.setTextColor(...gold);
    doc.setFontSize(isContinuation ? 8 : 9);
    doc.text(
      isContinuation
        ? toPdfText(`${lang === 'pt' ? 'PEDIDO' : 'ORDER'} #${normalized.orderId} - ${lang === 'pt' ? 'CONTINUACAO' : 'CONTINUED'}`)
        : toPdfText(lang === 'pt' ? 'COMPROVANTE DO PEDIDO & PECAS COMPRADAS' : 'ORDER RECEIPT & PURCHASED PIECES'),
      margin,
      isContinuation ? 16 : 21
    );

    if (!isContinuation) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(215, 215, 215);
      doc.text('Showroom: Leominster, MA 01453  |  WhatsApp: +1 (978) 313-9452  |  www.anafitwear.com', margin, 28);

      // Bloco direito no cabeçalho
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...gold);
      doc.text(`#${normalized.orderId}`, pageWidth - margin, 14, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(235, 235, 235);
      doc.text(normalized.createdAtLabel, pageWidth - margin, 21, { align: 'right' });
      doc.text(toPdfText(`${normalized.paymentLabel}`), pageWidth - margin, 28, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(220, 220, 220);
      doc.text(normalized.customerName, pageWidth - margin, 13, { align: 'right' });
    }

    return isContinuation ? 27 : 42;
  };

  let y = drawTopHeader(false);

  const drawItemsTableHeader = (currY: number): number => {
    doc.setFillColor(...deepBlack);
    doc.rect(margin, currY, contentWidth, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...gold);
    doc.text(toPdfText(lang === 'pt' ? 'PECA / TAMANHO / COR' : 'ITEM / SIZE / COLOR'), margin + 3, currY + 5);
    doc.text(toPdfText(lang === 'pt' ? 'QTD' : 'QTY'), pageWidth - margin - 46, currY + 5, { align: 'right' });
    doc.text(toPdfText(lang === 'pt' ? 'UNITARIO' : 'UNIT'), pageWidth - margin - 24, currY + 5, { align: 'right' });
    doc.text('TOTAL', pageWidth - margin - 3, currY + 5, { align: 'right' });
    return currY + 9.5;
  };

  const ensureSpace = (neededHeight: number, withItemsHeader = false) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = drawTopHeader(true);
      if (withItemsHeader) {
        y = drawItemsTableHeader(y);
      }
    }
  };

  // Cartões de Cliente & Entrega (2 colunas)
  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap) / 2;
  const addrLinesWrapped = normalized.deliveryAddressLines.flatMap((line) =>
    doc.splitTextToSize(line, cardWidth - 8)
  );
  const infoCardHeight = Math.max(26, 16 + addrLinesWrapped.length * 4 + (normalized.trackingCode ? 5 : 0));

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.rect(margin, y, cardWidth, infoCardHeight, 'FD');
  doc.rect(margin + cardWidth + cardGap, y, cardWidth, infoCardHeight, 'FD');

  // Esquerda: Cliente
  const leftX = margin + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...gold);
  doc.text(toPdfText(lang === 'pt' ? 'DADOS DO CLIENTE' : 'CUSTOMER DETAILS'), leftX, y + 5.5);

  doc.setFontSize(9.5);
  doc.setTextColor(...deepBlack);
  const nameLines = doc.splitTextToSize(normalized.customerName, cardWidth - 8);
  doc.text(nameLines, leftX, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedGray);
  let leftTextY = y + 11 + nameLines.length * 4;
  if (normalized.customerPhone) {
    doc.text(toPdfText(`Tel: ${normalized.customerPhone}`), leftX, leftTextY);
    leftTextY += 4.2;
  }
  if (normalized.customerEmail) {
    const emailLines = doc.splitTextToSize(normalized.customerEmail, cardWidth - 8);
    doc.text(emailLines, leftX, leftTextY);
  }

  // Direita: Entrega / Pagamento
  const rightX = margin + cardWidth + cardGap + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...gold);
  doc.text(
    toPdfText(normalized.isPickup ? (lang === 'pt' ? 'RETIRADA NO SHOWROOM' : 'SHOWROOM PICKUP') : (lang === 'pt' ? 'ENTREGA & PAGAMENTO' : 'DELIVERY & PAYMENT')),
    rightX,
    y + 5.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...deepBlack);
  doc.text(addrLinesWrapped, rightX, y + 11);
  let rightTextY = y + 11 + addrLinesWrapped.length * 4;
  doc.setTextColor(...mutedGray);
  doc.text(toPdfText(`${lang === 'pt' ? 'Pagamento' : 'Payment'}: ${normalized.paymentLabel}`), rightX, rightTextY);
  rightTextY += 4.2;
  if (normalized.trackingCode && !normalized.trackingCode.includes('PENDING')) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...deepBlack);
    doc.text(toPdfText(`USPS Tracking: ${normalized.trackingCode}`), rightX, rightTextY);
  }

  y += infoCardHeight + 6;

  // Título da lista de peças
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...deepBlack);
  doc.text(
    toPdfText(
      lang === 'pt'
        ? `PECAS COMPRADAS (${normalized.items.length} ${normalized.items.length === 1 ? 'ITEM' : 'ITENS'} / ${normalized.totalUnits} ${normalized.totalUnits === 1 ? 'UNIDADE' : 'UNIDADES'})`
        : `ITEMS PURCHASED (${normalized.items.length} LINE(S) / ${normalized.totalUnits} UNIT(S))`
    ),
    margin,
    y
  );
  y += 3.5;

  y = drawItemsTableHeader(y);

  if (normalized.items.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...mutedGray);
    doc.text(
      toPdfText(lang === 'pt' ? 'Nenhuma peca detalhada registrada neste pedido.' : 'No item details recorded for this order.'),
      margin + 3,
      y + 6
    );
    y += 14;
  } else {
    normalized.items.forEach((item, index) => {
      const thumbW = 13;
      const thumbH = 16.5;
      const detailsX = margin + thumbW + 5;
      const maxTitleWidth = contentWidth - thumbW - 5 - 58;
      const titleLines = doc.splitTextToSize(item.title, maxTitleWidth);
      const rowHeight = Math.max(thumbH + 4, 8 + titleLines.length * 4.3 + 5);

      ensureSpace(rowHeight + 2, true);

      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 249);
        doc.rect(margin, y - 1, contentWidth, rowHeight, 'F');
      }

      const thumbDataUrl = item.image ? imageMap.get(item.image) : null;
      const thumbY = y + 1;
      if (thumbDataUrl) {
        try {
          doc.addImage(thumbDataUrl, 'JPEG', margin + 2, thumbY, thumbW, thumbH);
        } catch {
          doc.setFillColor(238, 235, 228);
          doc.rect(margin + 2, thumbY, thumbW, thumbH, 'F');
        }
      } else {
        doc.setFillColor(238, 235, 228);
        doc.rect(margin + 2, thumbY, thumbW, thumbH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...mutedGray);
        doc.text('AFW', margin + 2 + thumbW / 2, thumbY + thumbH / 2 + 1, { align: 'center' });
      }
      doc.setDrawColor(...borderGray);
      doc.rect(margin + 2, thumbY, thumbW, thumbH, 'S');

      // Nome da peça
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...deepBlack);
      doc.text(titleLines, detailsX, y + 4.8);

      // Tamanho / Cor / SKU
      const metaY = y + 4.8 + titleLines.length * 4.2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(...mutedGray);
      const variantLine = toPdfText(
        `${lang === 'pt' ? 'Tamanho' : 'Size'}: ${item.size}   |   ${lang === 'pt' ? 'Cor' : 'Color'}: ${item.color}   |   SKU: ${item.sku}`
      );
      doc.text(doc.splitTextToSize(variantLine, maxTitleWidth), detailsX, metaY);

      // Quantidade, Unitário, Total da linha
      const numsY = y + 6.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...deepBlack);
      doc.text(`${item.quantity}x`, pageWidth - margin - 46, numsY, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.text(`$${item.unitPrice.toFixed(2)}`, pageWidth - margin - 24, numsY, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.text(`$${item.lineTotal.toFixed(2)}`, pageWidth - margin - 3, numsY, { align: 'right' });

      y += rowHeight;
      doc.setDrawColor(...borderGray);
      doc.line(margin, y, pageWidth - margin, y);
      y += 2;
    });
  }

  // Bloco de Totais Financeiros
  y += 3;
  const totalsBoxHeight = 32 + (normalized.discount > 0 ? 5.5 : 0);
  ensureSpace(totalsBoxHeight + 10);

  const boxWidth = 86;
  const boxX = pageWidth - margin - boxWidth;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...deepBlack);
  doc.setLineWidth(0.4);
  doc.rect(boxX, y, boxWidth, totalsBoxHeight, 'FD');
  doc.setLineWidth(0.2);

  let rowY = y + 6.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedGray);
  doc.text(toPdfText(lang === 'pt' ? 'Subtotal das Peças:' : 'Items Subtotal:'), boxX + 4, rowY);
  doc.setTextColor(...deepBlack);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${normalized.subtotal.toFixed(2)}`, boxX + boxWidth - 4, rowY, { align: 'right' });
  rowY += 5.5;

  if (normalized.discount > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...emerald);
    doc.text(toPdfText(lang === 'pt' ? 'Descontos (Combo/Cupom):' : 'Discounts (Combo/Coupon):'), boxX + 4, rowY);
    doc.text(`-$${normalized.discount.toFixed(2)}`, boxX + boxWidth - 4, rowY, { align: 'right' });
    rowY += 5.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedGray);
  doc.text(toPdfText(lang === 'pt' ? 'Frete / Entrega (USPS):' : 'Shipping (USPS):'), boxX + 4, rowY);
  doc.setTextColor(...deepBlack);
  doc.setFont('helvetica', 'bold');
  doc.text(
    normalized.shippingFee > 0 ? `$${normalized.shippingFee.toFixed(2)}` : (lang === 'pt' ? 'GRATIS ($0.00)' : 'FREE ($0.00)'),
    boxX + boxWidth - 4,
    rowY,
    { align: 'right' }
  );
  rowY += 4.5;

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(boxX + 4, rowY, boxX + boxWidth - 4, rowY);
  doc.setLineWidth(0.2);
  rowY += 6.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...deepBlack);
  doc.text(toPdfText(lang === 'pt' ? 'TOTAL DO PEDIDO:' : 'ORDER TOTAL:'), boxX + 4, rowY);
  doc.text(`$${normalized.total.toFixed(2)} USD`, boxX + boxWidth - 4, rowY, { align: 'right' });

  // Nota ao lado esquerdo do bloco de totais
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...deepBlack);
  doc.text(
    toPdfText(lang === 'pt' ? 'GARANTIA ANA FITNESS WEAR' : 'ANA FITNESS WEAR GUARANTEE'),
    margin,
    y + 7
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...mutedGray);
  const guaranteeLines = doc.splitTextToSize(
    toPdfText(
      lang === 'pt'
        ? 'Você tem 30 dias para trocas simples. Qualquer dúvida sobre seu pedido ou rastreamento USPS, chame a Ana Carina no WhatsApp +1 (978) 313-9452.'
        : '30-day hassle-free exchanges. For questions regarding your pieces or USPS tracking, contact us on WhatsApp at +1 (978) 313-9452.'
    ),
    contentWidth - boxWidth - 8
  );
  doc.text(guaranteeLines, margin, y + 12.5);

  y += totalsBoxHeight + 6;

  // Cronograma de Crediário (se aplicável)
  const installments = Array.isArray(normalized.crediario?.installments) ? normalized.crediario.installments : [];
  if (installments.length > 0) {
    const instHeight = 14 + installments.length * 5.2;
    ensureSpace(instHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...deepBlack);
    doc.text(toPdfText(lang === 'pt' ? 'PARCELAS DO CREDIARIO:' : 'INSTALLMENT SCHEDULE:'), margin, y + 4);
    let iy = y + 9;
    installments.forEach((inst: any) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...deepBlack);
      const due = inst.due_date ? new Date(inst.due_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
      const st = inst.status === 'PAID' ? 'PAGO' : 'PENDENTE';
      doc.text(
        toPdfText(`Parcela ${inst.number}/${installments.length}  -  Vencimento: ${due}  -  Valor: $${Number(inst.amount || 0).toFixed(2)}  -  ${st}`),
        margin + 2,
        iy
      );
      iy += 5;
    });
    y = iy + 2;
  }

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...borderGray);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedGray);
    doc.text(
      toPdfText(lang === 'pt' ? 'Ana Fitness Wear - Obrigado pela sua compra! Confira suas pecas acima.' : 'Ana Fitness Wear - Thank you for shopping with us!'),
      margin,
      pageHeight - 7
    );
    doc.text(`${p} / ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  const safeOrderId = normalized.orderId.replace(/[^A-Za-z0-9_-]/g, '') || 'ANA-PEDIDO';
  const filename = `Pedido-${safeOrderId}.pdf`;
  return { doc, filename, normalized };
}

export async function downloadOrderPdf(order: any, options: OrderPdfOptions = {}): Promise<string> {
  const { doc, filename } = await createOrderPdfDocument(order, options);
  doc.save(filename);
  return filename;
}

export async function buildOrderPdfArrayBuffer(order: any, options: OrderPdfOptions = {}): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const { doc, filename } = await createOrderPdfDocument(order, { ...options, skipImages: options.skipImages ?? true });
  return {
    buffer: doc.output('arraybuffer'),
    filename,
  };
}
