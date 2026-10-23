// Formatador amigável da forma de pagamento para mensagens
export function formatPaymentMethodLabel(method: string): string {
  const m = (method || '').toUpperCase();
  if (m === 'CASH') return '💵 Dinheiro (Cash)';
  if (m === 'ZELLE') return '⚡ Zelle';
  if (m === 'CARD' || m === 'CREDIT_CARD' || m === 'DEBIT_CARD') return '💳 Cartão de Crédito/Débito';
  if (m === 'VENMO') return '📱 Venmo';
  if (m === 'APPLE_PAY') return '🍏 Apple Pay';
  if (m === 'CREDIARIO') return '📋 Crediário da Loja';
  return method || 'Outro';
}

// 1. Mensagem de Recibo & Agradecimento para Pagamentos à Vista (Dinheiro, Zelle, Cartão, Venmo)
export function generateReceiptWhatsAppMessage(sale: any): string {
  const customer = sale.customer_name || 'Cliente';
  const orderId = sale.order_id || sale.id?.slice(0, 8);
  const payLabel = formatPaymentMethodLabel(sale.payment_method);
  const total = Number(sale.total_paid ?? (sale.subtotal_products - (sale.discount_amount || 0))).toFixed(2);
  const discount = Number(sale.discount_amount || 0);

  const saleDate = sale.created_at
    ? new Date(sale.created_at).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  let msg = `✨ *ANA FITNESS WEAR • RECIBO & AGRADECIMENTO* ✨\n\n`;
  msg += `Olá *${customer}*! 💕\n`;
  msg += `Muito obrigada pela sua compra! É uma alegria enorme ter você vestindo a *ANA FITNESS WEAR*. ✨\n\n`;
  msg += `🧾 *COMPROVANTE DE PAGAMENTO:*\n`;
  msg += `▫️ *Pedido:* #${orderId}\n`;
  msg += `▫️ *Data:* ${saleDate}\n`;
  msg += `▫️ *Forma de Pagamento:* ${payLabel}\n`;
  msg += `▫️ *Status:* ✅ *PAGO COM SUCESSO*\n`;
  msg += `▫️ *Valor Total:* $${total} USD\n`;
  if (discount > 0) {
    msg += `▫️ *Desconto Concedido:* -$${discount.toFixed(2)} USD\n`;
  }

  const items = Array.isArray(sale.items) ? sale.items : [];
  if (items.length > 0) {
    msg += `\n🛍️ *PEÇAS ADQUIRIDAS:*\n`;
    items.forEach((it: any) => {
      const title = it.title || it.name || 'Peça Fitness';
      const color = it.color || '';
      const size = it.size || '';
      const qty = it.quantity || 1;
      const price = Number(it.unit_price || it.price || 0).toFixed(2);
      const detail = [color, size].filter(Boolean).join(' - ');
      msg += `▪️ *${qty}x* ${title}${detail ? ` (${detail})` : ''} • $${price}\n`;
    });
  }

  msg += `\n📍 *Showroom:* Leominster, Massachusetts\n`;
  msg += `🌐 *Site Oficial:* www.anafitnesswear.com\n`;
  msg += `📸 *Instagram:* @anafitnesswear\n\n`;
  msg += `Qualquer dúvida ou ajuste que precisar, estamos sempre por aqui para te atender! Esperamos te ver novamente em breve. 🥰✨`;

  return msg;
}

// 2. Mensagem formatada para cobrança / Carnê de Crediário no WhatsApp
export function generateCrediarioWhatsAppMessage(sale: any): string {
  const customer = sale.customer_name || 'Cliente';
  const orderId = sale.order_id || sale.id?.slice(0, 8);
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

// 3. Impressão de Recibo Oficial da Venda (Dinheiro, Zelle, Cartão, etc.)
export function printSaleReceipt(sale: any) {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const customer = sale.customer_name || 'Cliente Balcão';
  const phone = sale.customer_phone || '';
  const orderId = sale.order_id || sale.id?.slice(0, 8);
  const payLabel = formatPaymentMethodLabel(sale.payment_method);
  const total = Number(sale.total_paid ?? (sale.subtotal_products - (sale.discount_amount || 0))).toFixed(2);
  const subtotal = Number(sale.subtotal_products || total).toFixed(2);
  const discount = Number(sale.discount_amount || 0);

  const itemsHtml = (sale.items || []).map((it: any) => {
    const title = it.title || it.name || 'Peça Fitness';
    const detail = [it.color, it.size].filter(Boolean).join(' / ');
    const qty = it.quantity || 1;
    const price = Number(it.unit_price || it.price || 0).toFixed(2);
    const lineTotal = (qty * Number(it.unit_price || it.price || 0)).toFixed(2);
    return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 6px 0;"><strong>${title}</strong>${detail ? `<br/><span style="color: #666; font-size: 11px;">${detail}</span>` : ''}</td>
        <td style="padding: 6px 0; text-align: center;">${qty}</td>
        <td style="padding: 6px 0; text-align: right;">$${price}</td>
        <td style="padding: 6px 0; text-align: right; font-weight: bold;">$${lineTotal}</td>
      </tr>
    `;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Recibo de Venda - #${orderId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; max-width: 480px; margin: 0 auto; font-size: 13px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .brand { font-size: 20px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }
          .tagline { font-size: 10px; color: #666; margin-top: 2px; }
          .info-box { background: #f8f8f8; border: 1px solid #e0e0e0; padding: 10px; margin-bottom: 16px; font-size: 11px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 4px; }
          .totals { border-top: 2px solid #000; padding-top: 8px; font-size: 12px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .grand-total { font-size: 16px; font-weight: 900; border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
          .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #555; border-top: 1px solid #ddd; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">ANA FITNESS WEAR</div>
          <div class="tagline">✨ Wear Your Strength ✨ • Showroom Leominster, MA</div>
          <div style="font-weight: 800; margin-top: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">RECIBO OFICIAL DE COMPRA</div>
        </div>

        <div class="info-box">
          <div><strong>PEDIDO:</strong> #${orderId} | <strong>DATA:</strong> ${new Date(sale.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
          <div><strong>CLIENTE:</strong> ${customer}${phone ? ` | <strong>TEL:</strong> ${phone}` : ''}</div>
          <div><strong>VENDEDORA:</strong> ${sale.seller_name || 'Showroom Leominster'}</div>
          <div><strong>FORMA DE PAGAMENTO:</strong> ${payLabel}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qtd</th>
              <th style="text-align: right;">Unit</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal de Produtos:</span>
            <span>$${subtotal}</span>
          </div>
          ${discount > 0 ? `
          <div class="totals-row" style="color: #15803d; font-weight: bold;">
            <span>Desconto Concedido:</span>
            <span>-$${discount.toFixed(2)}</span>
          </div>` : ''}
          <div class="totals-row grand-total">
            <span>TOTAL PAGO (${payLabel}):</span>
            <span>$${total} USD</span>
          </div>
        </div>

        <div class="footer">
          <p style="font-weight: bold; margin-bottom: 4px;">Muito obrigada pela preferência e carinho! 💕</p>
          <p style="margin: 0;">Showroom: Leominster, Massachusetts • @anafitnesswear</p>
          <p style="margin: 2px 0 0 0; font-size: 10px; color: #888;">www.anafitnesswear.com</p>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// 4. Impressão de Carnê de Crediário com Canhotos e Promissória
export function printCrediarioCarnet(sale: any) {
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
