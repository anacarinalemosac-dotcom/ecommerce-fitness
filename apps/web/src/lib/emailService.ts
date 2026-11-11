import fs from 'fs';
import path from 'path';

export interface EmailRecord {
  id: string;
  order_id: string;
  to: string;
  subject: string;
  type: 'ORDER_CONFIRMATION' | 'SHIPPING_NOTIFICATION' | 'OWNER_SALE_NOTIFICATION' | 'GENERAL';
  status: 'SENT' | 'SIMULATED_SENT' | 'FAILED';
  error?: string;
  provider_id?: string;
  created_at: string;
  html_preview?: string;
}

const OUTBOX_FILE = path.join(process.cwd(), 'email_outbox_db.json');

// Lê caixa de saída de e-mails persistida
export function getEmailOutbox(): EmailRecord[] {
  try {
    if (fs.existsSync(OUTBOX_FILE)) {
      const raw = fs.readFileSync(OUTBOX_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao ler email_outbox_db.json:', err);
  }
  return [];
}

// Salva registro no log de saída
export function saveEmailRecord(record: EmailRecord) {
  try {
    const list = getEmailOutbox();
    const updated = [record, ...list.slice(0, 499)]; // Mantém os últimos 500 envios
    fs.writeFileSync(OUTBOX_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.warn('Erro ao gravar email_outbox_db.json:', err);
  }
}

// Helper para formatar moeda USD
function formatCurrency(val: number): string {
  return `$${Number(val || 0).toFixed(2)}`;
}

// ============================================================================
// TEMPLATE 1: CONFIRMAÇÃO DO PEDIDO (ORDER CONFIRMATION)
// ============================================================================
export function generateOrderConfirmationHtml(order: any): string {
  const orderId = order.order_id || order.id || 'ANA-ORDER';
  const customerName = order.customer_name || 'Cliente Especial';
  const addr = order.shipping_address || {};
  const isPickup =
    (addr?.delivery_method || order.delivery_method || '').toUpperCase() === 'PICKUP';
  const subtotal = Number(order.subtotal_products || order.subtotal_amount || 0);
  const shippingFee =
    order.shipping_fee !== undefined ? Number(order.shipping_fee) : isPickup ? 0 : 9.90;
  const discount = Number(order.discount_amount || 0);
  const total = Number(order.total_amount || Math.max(0, subtotal + shippingFee - discount));
  const paymentMethod = (order.payment_method || 'CARD').toUpperCase();
  const dateFormatted = order.created_at
    ? new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const addressStreet = isPickup ? '126 First St' : (addr?.address || 'Endereço informado no checkout');
  const addressApt = isPickup ? 'Apt 01' : (addr?.apt ? `Apt ${addr.apt}` : '');
  const addressCity = isPickup ? 'Leominster' : (addr?.city || 'Leominster');
  const addressState = isPickup ? 'MA' : (addr?.state || 'MA');
  const addressZip = isPickup ? '01453' : (addr?.zip || '01453');

  const rawItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : (Array.isArray(addr?.items) ? addr.items : []);

  const itemsHtml = rawItems.map((item: any) => {
    const title = item.title || 'Peça Fitness Exclusiva';
    const size = item.size || 'Único';
    const color = item.color || 'Padrão';
    const sku = item.sku || '';
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price || item.price || 44.90);
    const lineTotal = qty * unitPrice;
    const itemImg = item.image || item.image_url || item.thumbnail || '';

    return `
      <tr>
        ${itemImg ? `
        <td width="76" valign="top" style="padding: 12px 10px 12px 0; border-bottom: 1px solid #f0f0f0;">
          <img src="${itemImg}" alt="${title}" width="64" height="80" style="width: 64px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e5e5; display: block;" />
        </td>
        ` : ''}
        <td style="padding: 14px 10px; border-bottom: 1px solid #f0f0f0;" valign="middle">
          <div style="font-weight: 700; color: #111111; font-size: 14px; text-transform: uppercase;">
            ${title}
          </div>
          <div style="font-size: 12px; color: #777777; margin-top: 4px;">
            Tamanho: <strong style="color: #111;">${size}</strong> &bull; Cor: <strong style="color: #111;">${color}</strong> &bull; Qtd: <strong style="color: #111;">${qty}</strong>
          </div>
          ${sku ? `<div style="font-size: 11px; color: #555; font-family: monospace; margin-top: 3px;">SKU: <strong>${sku}</strong></div>` : ''}
        </td>
        <td style="padding: 14px 10px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 700; color: #111111; font-size: 14px; font-family: monospace;" valign="middle">
          ${formatCurrency(lineTotal)}
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmação do Pedido #${orderId} - ANA Fitness Wear</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f8; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Cabeçalho Dourado / Preto Luxo -->
          <tr>
            <td style="background-color: #0b0b0b; padding: 36px 30px; text-align: center; border-bottom: 3px solid #d4af37;">
              <div style="color: #d4af37; font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px;">
                LEOMINSTER, MASSACHUSETTS &bull; OFFICIAL STORE
              </div>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0;">
                ANA FITNESS WEAR
              </h1>
            </td>
          </tr>

          <!-- Banner de Status -->
          <tr>
            <td style="padding: 24px 30px; background-color: #faf8f2; border-bottom: 1px solid #eee; text-align: center;">
              <span style="display: inline-block; background-color: #0b0b0b; color: #d4af37; padding: 6px 14px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                ✓ PAGAMENTO CONFIRMADO
              </span>
              <h2 style="font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 12px 0 4px 0; color: #111;">
                OBRIGADO PELA SUA COMPRA, ${customerName.toUpperCase()}!
              </h2>
              <p style="font-size: 13px; color: #555555; margin: 0;">
                Seu pedido foi registrado e nossa equipe já está separando as suas peças para expedição imediata.
              </p>
            </td>
          </tr>

          <!-- Detalhes do Pedido e Identificação -->
          <tr>
            <td style="padding: 24px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fbfbfb; border: 1px solid #eee; padding: 14px 18px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 12px; color: #666; text-transform: uppercase;">
                    <strong>Número do Pedido:</strong> <span style="font-family: monospace; font-weight: 800; color: #0b0b0b; font-size: 13px;">#${orderId}</span>
                  </td>
                  <td style="font-size: 12px; color: #666; text-align: right; text-transform: uppercase;">
                    <strong>Data:</strong> ${dateFormatted}
                  </td>
                </tr>
              </table>

              <!-- Lista de Peças Compradas -->
              <h3 style="font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #111; margin: 0 0 10px 0; border-bottom: 2px solid #111; padding-bottom: 6px;">
                ITENS DO SEU PEDIDO
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                ${itemsHtml}
              </table>

              <!-- Totais Financeiros -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #eee; padding: 14px 18px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #555;">Subtotal das Peças:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; text-align: right; font-family: monospace;">${formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #555;">${isPickup ? 'Retirada no Showroom (Leominster, MA):' : 'Frete USPS Priority (Flat Rate):'}</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; text-align: right; font-family: monospace;">${isPickup ? '<span style="color: #2e7d32;">GRÁTIS ($0.00)</span>' : formatCurrency(shippingFee)}</td>
                </tr>
                ${discount > 0 ? `
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #2e7d32;">Desconto Aplicado (Combo / Cupom):</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; text-align: right; color: #2e7d32; font-family: monospace;">-${formatCurrency(discount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 0 0 0; font-size: 15px; font-weight: 900; color: #111; border-top: 1px solid #ddd;">TOTAL PAGO:</td>
                  <td style="padding: 10px 0 0 0; font-size: 17px; font-weight: 900; text-align: right; color: #111; border-top: 1px solid #ddd; font-family: monospace;">${formatCurrency(total)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 4px; font-size: 11px; color: #888; text-transform: uppercase;">
                    Forma de Pagamento: <strong>${paymentMethod}</strong>
                  </td>
                </tr>
              </table>

              <!-- Endereço de Entrega ou Retirada no Showroom -->
              <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: ${isPickup ? '#2e7d32' : '#888'}; text-transform: uppercase; margin-bottom: 6px;">
                  ${isPickup ? '📍 RETIRADA NO SHOWROOM OFICIAL (SEM FRETE)' : '📦 ENDEREÇO DE ENTREGA (USPS)'}
                </div>
                <div style="font-size: 14px; font-weight: 700; color: #111;">
                  ${isPickup ? 'Showroom Ana Fitness Wear' : customerName}
                </div>
                <div style="font-size: 13px; color: #444; line-height: 1.5; margin-top: 2px;">
                  ${addressStreet} ${addressApt ? `&bull; ${addressApt}` : ''}<br />
                  ${addressCity}, ${addressState} ${addressZip}<br />
                  United States
                </div>
              </div>

              <!-- Informação de Envio e Rastreamento -->
              <div style="background-color: #0b0b0b; color: #ffffff; padding: 20px; text-align: center; margin-bottom: 20px;">
                <div style="color: #d4af37; font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;">
                  ${isPickup ? '📍 PRÓXIMO PASSO: RETIRADA NO SHOWROOM' : '📦 PRÓXIMO PASSO: ENVIO & RASTREIO'}
                </div>
                <p style="font-size: 13px; color: #e0e0e0; margin: 0 0 10px 0; line-height: 1.5;">
                  ${isPickup
                    ? 'Suas peças já estão sendo separadas! Avisaremos no seu WhatsApp assim que o pedido estiver pronto para retirada em Leominster (126 First St, Apt 01).'
                    : 'Seu pacote será postado nos correios americanos (USPS Priority Mail / Ground Advantage) em <strong>1 a 2 dias úteis</strong>.'}
                </p>
                <p style="font-size: 12px; color: #d4af37; margin: 0; font-weight: 600;">
                  ${isPickup
                    ? 'Dúvidas ou agendamento de horário? Chame no WhatsApp: +1 (978) 313-9452'
                    : 'Assim que o pacote for coletado, você receberá um novo e-mail com o código de rastreio para acompanhar a entrega!'}
                </p>
              </div>

              <!-- Botão Acompanhar Pedido na Loja -->
              <div style="text-align: center; margin: 24px 0 10px 0;">
                <a href="https://anafitwear.com/pedidos?order_id=${encodeURIComponent(orderId)}" target="_blank" style="display: inline-block; background-color: #d4af37; color: #0b0b0b; padding: 14px 28px; font-size: 12px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
                  ACOMPANHAR MEU PEDIDO NA LOJA &rarr;
                </a>
              </div>

            </td>
          </tr>

          <!-- Rodapé de Contato & Redes -->
          <tr>
            <td style="background-color: #f2f2f2; padding: 24px 30px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; line-height: 1.6;">
              <div style="font-weight: 800; color: #111; text-transform: uppercase; margin-bottom: 4px;">
                ANA FITNESS WEAR LLC
              </div>
              <div>Leominster, MA &bull; United States</div>
              <div style="margin-top: 6px;">
                Suporte WhatsApp: <a href="https://wa.me/19783139452" style="color: #111; font-weight: 700; text-decoration: none;">+1 (978) 313-9452</a>
              </div>
              <div style="margin-top: 10px; font-size: 11px; color: #999;">
                Obrigado por vestir a nossa essência fitness premium!
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ============================================================================
// TEMPLATE 2: NOTIFICAÇÃO DE ENVIO COM CÓDIGO DE RASTREIO (SHIPPING NOTIFICATION)
// ============================================================================
export function generateShippingConfirmationHtml(order: any, trackingCode: string): string {
  const orderId = order.order_id || order.id || 'ANA-ORDER';
  const customerName = order.customer_name || 'Cliente Especial';
  const cleanTracking = (trackingCode || '').trim();
  const uspsTrackingLink = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(cleanTracking.replace(/\s+/g, ''))}`;
  const storeTrackingLink = `https://anafitwear.com/pedidos?order_id=${encodeURIComponent(orderId)}`;

  const addr = order.shipping_address;
  const addressStreet = addr?.address || 'Leominster Area';
  const addressApt = addr?.apt ? `Apt ${addr.apt}` : '';
  const addressCity = addr?.city || 'Boston';
  const addressState = addr?.state || 'MA';
  const addressZip = addr?.zip || '02215';

  const rawItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : (Array.isArray(addr?.items) ? addr.items : []);

  const itemsHtml = rawItems.map((item: any) => {
    const title = item.title || 'Peça Fitness Exclusiva';
    const size = item.size || 'M';
    const color = item.color || 'Preto Ônix';
    const qty = Number(item.quantity || 1);
    const itemImg = item.image || item.image_url || item.thumbnail || '';

    return `
      <tr>
        ${itemImg ? `
        <td width="64" valign="top" style="padding: 10px 8px 10px 0; border-bottom: 1px solid #f0f0f0;">
          <img src="${itemImg}" alt="${title}" width="54" height="68" style="width: 54px; height: 68px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e5e5; display: block;" />
        </td>
        ` : ''}
        <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;" valign="middle">
          <div style="font-weight: 700; color: #111111; font-size: 13px; text-transform: uppercase;">
            ${title}
          </div>
          <div style="font-size: 11px; color: #777777; margin-top: 2px;">
            Tam: <strong style="color: #111;">${size}</strong> &bull; Cor: <strong style="color: #111;">${color}</strong>
          </div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 700; color: #111111; font-size: 13px; font-family: monospace;" valign="middle">
          ${qty}x pacote
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seu Pedido #${orderId} Foi Enviado! - ANA Fitness Wear</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f8; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Cabeçalho Dourado / Preto Luxo -->
          <tr>
            <td style="background-color: #0b0b0b; padding: 36px 30px; text-align: center; border-bottom: 3px solid #d4af37;">
              <div style="color: #d4af37; font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px;">
                LEOMINSTER, MASSACHUSETTS &bull; OFFICIAL STORE
              </div>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0;">
                ANA FITNESS WEAR
              </h1>
            </td>
          </tr>

          <!-- Banner de Envio / A Caminho -->
          <tr>
            <td style="padding: 26px 30px; background-color: #faf8f2; border-bottom: 1px solid #eee; text-align: center;">
              <span style="display: inline-block; background-color: #004b87; color: #ffffff; padding: 6px 14px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                📦 PACOTE DESPACHADO VIA USPS
              </span>
              <h2 style="font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 14px 0 4px 0; color: #111;">
                SEU PEDIDO ESTÁ A CAMINHO!
              </h2>
              <p style="font-size: 14px; color: #444; margin: 0;">
                Olá, <strong>${customerName}</strong>! Temos uma ótima notícia: suas peças foram cuidadosamente embaladas e despachadas nos Correios dos EUA.
              </p>
            </td>
          </tr>

          <!-- BOX DE DESTAQUE: CÓDIGO DE RASTREIO USPS -->
          <tr>
            <td style="padding: 26px 30px;">
              
              <div style="background-color: #0b0b0b; border: 2px solid #d4af37; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="color: #d4af37; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">
                  TRANSPORTADORA: UNITED STATES POSTAL SERVICE (USPS)
                </div>
                <div style="color: #ffffff; font-size: 12px; text-transform: uppercase; margin-bottom: 10px;">
                  Código de Rastreamento Oficial:
                </div>
                <div style="background-color: #ffffff; color: #0b0b0b; padding: 12px 16px; font-family: monospace; font-size: 20px; font-weight: 900; letter-spacing: 2px; display: inline-block; margin-bottom: 18px; border: 1px solid #d4af37;">
                  ${cleanTracking}
                </div>
                <div>
                  <a href="${uspsTrackingLink}" target="_blank" style="display: inline-block; background-color: #d4af37; color: #0b0b0b; padding: 14px 26px; font-size: 12px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
                    RASTREAR MEU PACOTE NO SITE DA USPS &rarr;
                  </a>
                </div>
                <div style="margin-top: 12px;">
                  <a href="${storeTrackingLink}" target="_blank" style="color: #d4af37; font-size: 11px; text-decoration: underline;">
                    Ou veja o status direto no site da ANA Fitness
                  </a>
                </div>
              </div>

              <!-- Dica Importante sobre a Leitura dos Correios -->
              <div style="background-color: #f7f9fa; border-left: 3px solid #004b87; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #555; line-height: 1.5;">
                <strong>Nota sobre o rastreamento:</strong> O sistema dos Correios (USPS) pode levar algumas horas para registrar o primeiro evento de movimentação após a postagem em Massachusetts. O prazo médio de trânsito é de <strong>1 a 5 dias úteis</strong>.
              </div>

              <!-- Endereço de Destino -->
              <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #888; text-transform: uppercase; margin-bottom: 6px;">
                  DESTINO DA ENTREGA
                </div>
                <div style="font-size: 14px; font-weight: 700; color: #111;">
                  ${customerName}
                </div>
                <div style="font-size: 13px; color: #444; line-height: 1.5; margin-top: 2px;">
                  ${addressStreet} ${addressApt ? `&bull; ${addressApt}` : ''}<br />
                  ${addressCity}, ${addressState} ${addressZip}<br />
                  United States
                </div>
              </div>

              <!-- Peças Inclusas no Pacote -->
              ${rawItems.length > 0 ? `
              <h3 style="font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #111; margin: 0 0 10px 0; border-bottom: 2px solid #111; padding-bottom: 6px;">
                PEÇAS INCLUSAS NESTE PACOTE (#${orderId})
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                ${itemsHtml}
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Rodapé de Contato & Redes -->
          <tr>
            <td style="background-color: #f2f2f2; padding: 24px 30px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; line-height: 1.6;">
              <div style="font-weight: 800; color: #111; text-transform: uppercase; margin-bottom: 4px;">
                ANA FITNESS WEAR LLC
              </div>
              <div>Leominster, MA &bull; United States</div>
              <div style="margin-top: 6px;">
                Dúvidas sobre o envio? WhatsApp: <a href="https://wa.me/19783139452" style="color: #111; font-weight: 700; text-decoration: none;">+1 (978) 313-9452</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ============================================================================
// ENVIO EFETIVO VIA RESEND OU SIMULAÇÃO PERSISTIDA
// ============================================================================

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  order_id: string;
  type: 'ORDER_CONFIRMATION' | 'SHIPPING_NOTIFICATION' | 'OWNER_SALE_NOTIFICATION' | 'GENERAL';
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; simulated?: boolean; messageId?: string; error?: string }> {
  const { to, subject, html, order_id, type } = opts;

  if (!to || !to.includes('@')) {
    console.warn(`[EMAIL] Destinatário inválido ignorado para o pedido #${order_id}:`, to);
    return { success: false, error: 'E-mail inválido' };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'ANA Fitness Wear <orders@anafitwear.com>';

  // 1. Envio Real se houver chave do Resend configurada
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.id) {
        console.log(`✓ [EMAIL REAL ENVIADO] Para: ${to} | Assunto: ${subject} | Resend ID: ${resData.id}`);
        saveEmailRecord({
          id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          order_id,
          to,
          subject,
          type,
          status: 'SENT',
          provider_id: resData.id,
          created_at: new Date().toISOString(),
          html_preview: html,
        });
        return { success: true, messageId: resData.id };
      } else {
        // Fallback inteligente: se o domínio próprio ainda não foi verificado no DNS do Resend, tenta com onboarding@resend.dev
        if (resData.message && (resData.message.includes('domain') || resData.message.includes('verify')) && fromEmail !== 'ANA Fitness Wear <onboarding@resend.dev>') {
          console.log('Domínio próprio ainda não verificado no Resend. Tentando fallback com onboarding@resend.dev...');
          try {
            const fbResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: 'ANA Fitness Wear <onboarding@resend.dev>',
                to: [to],
                subject,
                html,
              }),
            });
            const fbData = await fbResponse.json();
            if (fbResponse.ok && fbData.id) {
              console.log(`✓ [EMAIL REAL ENVIADO COM SUCESSO VIA RESEND ONBOARDING] Para: ${to} | ID: ${fbData.id}`);
              saveEmailRecord({
                id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                order_id,
                to,
                subject,
                type,
                status: 'SENT',
                provider_id: fbData.id,
                created_at: new Date().toISOString(),
                html_preview: html,
              });
              return { success: true, messageId: fbData.id };
            }
          } catch (fbErr) {
            console.warn('Falha no fallback do Resend:', fbErr);
          }
        }

        console.warn(`⚠ [RESEND API ERRO]:`, resData);
        saveEmailRecord({
          id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          order_id,
          to,
          subject,
          type,
          status: 'FAILED',
          error: resData.message || JSON.stringify(resData),
          created_at: new Date().toISOString(),
          html_preview: html,
        });
        return { success: false, error: resData.message || 'Falha no Resend' };
      }
    } catch (err: any) {
      console.error(`Erro ao disparar via Resend:`, err);
      saveEmailRecord({
        id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        order_id,
        to,
        subject,
        type,
        status: 'FAILED',
        error: err.message,
        created_at: new Date().toISOString(),
        html_preview: html,
      });
      return { success: false, error: err.message };
    }
  }

  // 2. Modo Simulação transparente (quando chave ainda não estiver no .env)
  // Grava na outbox para que a Ana veja que o e-mail foi preparado e gerado
  console.log(`✉ [EMAIL SIMULADO & REGISTRADO NA OUTBOX]`);
  console.log(`   Destinatário: ${to}`);
  console.log(`   Assunto: ${subject}`);
  console.log(`   Pedido: #${order_id} | Tipo: ${type}`);

  const mockId = `sim-${Date.now()}`;
  saveEmailRecord({
    id: mockId,
    order_id,
    to,
    subject,
    type,
    status: 'SIMULATED_SENT',
    created_at: new Date().toISOString(),
    html_preview: html,
  });

  return { success: true, simulated: true, messageId: mockId };
}

// Disparo facilitado de Confirmação de Pedido
export async function sendOrderConfirmationEmail(order: any) {
  const recipientEmail = order.customer_email || order.shipping_address?.customer_email;
  const orderId = order.order_id || order.id || 'ANA-ORDER';

  if (!recipientEmail) {
    console.warn(`[EMAIL] Pedido #${orderId} sem customer_email. Confirmação não enviada.`);
    return { success: false, error: 'E-mail do cliente não informado.' };
  }

  const subject = `Confirmação do seu Pedido #${orderId} - ANA Fitness Wear`;
  const html = generateOrderConfirmationHtml(order);

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    order_id: orderId,
    type: 'ORDER_CONFIRMATION',
  });
}

// Disparo facilitado de Confirmação de Envio com Rastreio
export async function sendShippingNotificationEmail(order: any, trackingCode: string) {
  const recipientEmail = order.customer_email || order.shipping_address?.customer_email;
  const orderId = order.order_id || order.id || 'ANA-ORDER';

  if (!recipientEmail) {
    console.warn(`[EMAIL] Pedido #${orderId} sem customer_email. Rastreio não enviado por e-mail.`);
    return { success: false, error: 'E-mail do cliente não informado.' };
  }

  const cleanTracking = (trackingCode || order.tracking_code || '').trim() || 'Aguardando Coleta';
  const subject = `Seu Pedido #${orderId} Foi Enviado! 📦 Código de Rastreio USPS: ${cleanTracking}`;
  const html = generateShippingConfirmationHtml(order, cleanTracking);

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    order_id: orderId,
    type: 'SHIPPING_NOTIFICATION',
  });
}

// ============================================================================
// TEMPLATE 5: NOTIFICAÇÃO IMEDIATA DE NOVA VENDA PARA A LOJISTA (ANA)
// ============================================================================
export function generateOwnerSaleNotificationHtml(order: any): string {
  const orderId = order.order_id || order.id || 'ANA-ORDER';
  const customerName = order.customer_name || 'Cliente Online';
  const customerEmail = order.customer_email || order.shipping_address?.customer_email || 'Não informado';
  const customerPhone = order.customer_phone || order.shipping_address?.customer_phone || '';
  const cleanPhone = String(customerPhone || '').replace(/\D/g, '');
  const waPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;

  const addr = order.shipping_address || {};
  const isPickup =
    (addr?.delivery_method || order.delivery_method || '').toUpperCase() === 'PICKUP';
  const subtotal = Number(order.subtotal_products || order.subtotal_amount || 0);
  const shippingFee =
    order.shipping_fee !== undefined ? Number(order.shipping_fee) : isPickup ? 0 : 9.90;
  const discount = Number(order.discount_amount || 0);
  const total = Number(order.total_amount || Math.max(0, subtotal + shippingFee - discount));
  const paymentMethod = (order.payment_method || 'CARD').toUpperCase();
  const dateFormatted = new Date(order.created_at || Date.now()).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const rawItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : (Array.isArray(addr?.items) ? addr.items : []);

  const itemsHtml = rawItems.map((item: any) => {
    const title = item.title || 'Peça Fitness';
    const size = item.size || 'Único';
    const color = item.color || 'Padrão';
    const sku = item.sku || '-';
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price || item.price || 44.90);
    const lineTotal = qty * unitPrice;
    const itemImg = item.image || item.image_url || item.thumbnail || '';

    return `
      <tr>
        <td width="92" valign="top" style="padding: 12px 10px 12px 0; border-bottom: 1px solid #eeeeee;">
          ${itemImg ? `
            <img src="${itemImg}" alt="${title}" width="80" height="100" style="width: 80px; height: 100px; object-fit: cover; border-radius: 4px; border: 2px solid #d4af37; display: block;" />
          ` : `
            <div style="width: 80px; height: 100px; background-color: #f3f3f3; border: 1px dashed #ccc; border-radius: 4px; text-align: center; line-height: 100px; font-size: 10px; color: #999; font-weight: bold;">
              SEM FOTO
            </div>
          `}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eeeeee;" valign="middle">
          <div style="font-weight: 900; color: #111111; font-size: 14px; text-transform: uppercase;">
            ${title}
          </div>
          <div style="margin-top: 6px;">
            <span style="display: inline-block; background-color: #0b0b0b; color: #d4af37; padding: 3px 8px; font-size: 11px; font-weight: 900; border-radius: 2px;">
              TAM: ${size}
            </span>
            <span style="display: inline-block; background-color: #f3f3f3; color: #111111; padding: 3px 8px; font-size: 11px; font-weight: 700; border-radius: 2px; margin-left: 4px;">
              COR: ${color}
            </span>
          </div>
          <div style="margin-top: 6px; font-size: 11px; color: #333333; font-family: monospace;">
            <span style="display: inline-block; background-color: #fef3c7; color: #92400e; border: 1px solid #f59e0b; padding: 2px 6px; font-weight: 900;">
              SKU: ${sku}
            </span>
            &nbsp;&bull; Qtd: <strong>${qty}x</strong>
          </div>
        </td>
        <td style="padding: 12px 0 12px 8px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: 900; color: #111111; font-size: 14px; font-family: monospace;" valign="middle">
          ${formatCurrency(lineTotal)}
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NOVA VENDA! Pedido #${orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f6; padding: 24px 10px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width: 620px; width: 100%; background-color: #ffffff; border: 2px solid #0b0b0b; border-radius: 4px; overflow: hidden;">
          <tr>
            <td style="background-color: #0b0b0b; padding: 24px 28px; text-align: center; border-bottom: 3px solid #d4af37;">
              <div style="color: #10b981; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">
                💰 ALERTA DE VENDA • SEPARAR PEDIDO
              </div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0;">
                NOVA VENDA: #${orderId}
              </h1>
              <div style="color: #d4af37; font-size: 18px; font-weight: 900; font-family: monospace; margin-top: 6px;">
                TOTAL: ${formatCurrency(total)} (${paymentMethod})
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 28px;">
              <!-- Entrega / Ação -->
              <div style="background-color: ${isPickup ? '#ecfdf5' : '#fffbeb'}; border: 2px solid ${isPickup ? '#10b981' : '#f59e0b'}; padding: 14px 16px; margin-bottom: 20px;">
                <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: ${isPickup ? '#065f46' : '#92400e'};">
                  ${isPickup ? '📍 RETIRADA NO SHOWROOM (SEM FRETE)' : '📦 ENVIAR VIA USPS PARA A CLIENTE'}
                </div>
                <div style="font-size: 12px; color: #222; margin-top: 4px; line-height: 1.5;">
                  ${isPickup
                    ? 'A cliente optou por retirar em <strong>126 First St, Apt 01, Leominster, MA 01453</strong>. Combine o horário pelo WhatsApp!'
                    : `<strong>${customerName}</strong><br/>${addr?.address || ''} ${addr?.apt ? `• ${addr.apt}` : ''}<br/>${addr?.city || ''}, ${addr?.state || ''} ${addr?.zip || ''}`}
                </div>
              </div>

              <!-- Dados da Cliente -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 12px 14px; margin-bottom: 20px; font-size: 12px;">
                <tr>
                  <td>
                    <strong>Cliente:</strong> ${customerName}<br/>
                    <strong>E-mail:</strong> ${customerEmail}<br/>
                    <strong>Telefone / WhatsApp:</strong> ${customerPhone || 'Não informado'}
                    ${waPhone ? ` &nbsp;<a href="https://wa.me/${waPhone}" style="background-color: #25d366; color: #000; padding: 2px 8px; border-radius: 3px; text-decoration: none; font-weight: 900; font-size: 10px;">CHAMAR NO WHATSAPP &rarr;</a>` : ''}
                  </td>
                  <td align="right" valign="top" style="font-family: monospace; color: #555;">
                    ${dateFormatted}
                  </td>
                </tr>
              </table>

              <!-- Fotos Miniaturas das Peças Escolhidas -->
              <h3 style="font-size: 13px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #111; margin: 0 0 8px 0; border-bottom: 2px solid #0b0b0b; padding-bottom: 6px;">
                📸 PEÇAS ESCOLHIDAS PELA CLIENTE (${rawItems.length}):
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                ${itemsHtml}
              </table>

              <!-- Resumo Financeiro -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 12px 16px; margin-bottom: 24px; font-size: 13px;">
                <tr>
                  <td style="padding: 3px 0; color: #555;">Subtotal das Peças:</td>
                  <td style="padding: 3px 0; text-align: right; font-family: monospace; font-weight: 700;">${formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; color: #555;">Frete Cobrado:</td>
                  <td style="padding: 3px 0; text-align: right; font-family: monospace; font-weight: 700;">${formatCurrency(shippingFee)}</td>
                </tr>
                ${discount > 0 ? `
                <tr>
                  <td style="padding: 3px 0; color: #2e7d32;">Desconto (Combo/Cupom):</td>
                  <td style="padding: 3px 0; text-align: right; font-family: monospace; font-weight: 700; color: #2e7d32;">-${formatCurrency(discount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0 0 0; font-weight: 900; border-top: 1px solid #ddd;">TOTAL DO PEDIDO:</td>
                  <td style="padding: 8px 0 0 0; text-align: right; font-family: monospace; font-weight: 900; font-size: 16px; border-top: 1px solid #ddd;">${formatCurrency(total)}</td>
                </tr>
              </table>

              <div style="text-align: center;">
                <a href="https://anafitwear.com/backoffice?tab=sales" target="_blank" style="display: inline-block; background-color: #0b0b0b; color: #d4af37; padding: 14px 28px; font-size: 12px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; border: 2px solid #d4af37;">
                  ABRIR PEDIDO NO BACKOFFICE &rarr;
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendOwnerSaleNotificationEmail(order: any) {
  const orderId = order.order_id || order.id || 'ANA-ORDER';
  const customerName = order.customer_name || 'Cliente Online';
  const subtotal = Number(order.subtotal_products || order.subtotal_amount || 0);
  const shippingFee = order.shipping_fee !== undefined ? Number(order.shipping_fee) : 9.90;
  const discount = Number(order.discount_amount || 0);
  const total = Number(order.total_amount || Math.max(0, subtotal + shippingFee - discount));

  const configuredOwners = process.env.STORE_OWNER_EMAIL
    ? process.env.STORE_OWNER_EMAIL.split(',').map((s) => s.trim()).filter(Boolean)
    : ['anafitweareua@gmail.com', 'anacarinalemos.ac@gmail.com'];

  const uniqueRecipients = Array.from(new Set(configuredOwners));
  const subject = `🛍️ NOVA VENDA! Pedido #${orderId} • ${formatCurrency(total)} (${customerName})`;
  const html = generateOwnerSaleNotificationHtml(order);

  const results = [];
  for (const ownerEmail of uniqueRecipients) {
    const r = await sendEmail({
      to: ownerEmail,
      subject,
      html,
      order_id: orderId,
      type: 'OWNER_SALE_NOTIFICATION',
    });
    results.push({ email: ownerEmail, ...r });
  }
  return results;
}

// ============================================================================
// TEMPLATE 3: CUPOM PRESENTE DE AVALIAÇÃO (REVIEW REWARD COUPON)
// ============================================================================
export function generateReviewRewardCouponHtml(customerName: string, couponCode: string = 'OBRIGADA10'): string {
  const cleanName = customerName ? customerName.trim().toUpperCase() : 'CLIENTE ESPECIAL';
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seu Presente Chegou! 🎁 10% OFF - ANA Fitness Wear</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f8; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0b0b0b; padding: 36px 30px; text-align: center; border-bottom: 3px solid #d4af37;">
              <div style="color: #d4af37; font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px;">
                LEOMINSTER, MASSACHUSETTS &bull; OFFICIAL STORE
              </div>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0;">
                ANA FITNESS WEAR
              </h1>
            </td>
          </tr>

          <!-- Banner de Agradecimento -->
          <tr>
            <td style="padding: 28px 30px; background-color: #faf8f2; border-bottom: 1px solid #eee; text-align: center;">
              <span style="display: inline-block; background-color: #d4af37; color: #0b0b0b; padding: 6px 14px; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
                ★ PRESENTE EXCLUSIVO DE AVALIAÇÃO
              </span>
              <h2 style="font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 16px 0 6px 0; color: #111;">
                MUITO OBRIGADA, ${cleanName}! 💖
              </h2>
              <p style="font-size: 13px; color: #555555; line-height: 1.6; max-width: 480px; margin: 0 auto;">
                Sua avaliação foi recebida com muito carinho e já está ajudando outras mulheres a escolherem seus looks favoritos com confiança!
              </p>
            </td>
          </tr>

          <!-- Bloco do Cupom de Desconto -->
          <tr>
            <td style="padding: 36px 30px; text-align: center;">
              <div style="background: linear-gradient(135deg, #0b0b0b 0%, #1a1a1a 100%); border: 2px dashed #d4af37; border-radius: 8px; padding: 26px 20px; color: #ffffff; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; color: #d4af37; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">
                  SEU CUPOM DE 10% DE DESCONTO
                </div>
                <div style="font-size: 32px; font-weight: 900; color: #d4af37; font-family: monospace; letter-spacing: 4px; background: rgba(255,255,255,0.05); border: 1px solid #d4af37; display: inline-block; padding: 10px 24px; border-radius: 4px;">
                  ${couponCode}
                </div>
                <p style="font-size: 12px; color: #e0e0e0; margin-top: 12px; margin-bottom: 0;">
                  Válido para qualquer peça do nosso catálogo oficial.
                </p>
              </div>

              <!-- Instruções de Uso -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #eee; padding: 16px 20px; text-align: left; margin-bottom: 28px;">
                <tr>
                  <td style="font-size: 13px; color: #333; line-height: 1.6;">
                    <strong>Como usar seu cupom:</strong><br />
                    1. Acesse nosso site oficial <a href="https://anafitwear.com" style="color: #d4af37; font-weight: 700;">anafitwear.com</a>.<br />
                    2. Escolha suas peças favoritas e vá para a sacola de compras.<br />
                    3. No campo <strong>CUPOM DE DESCONTO</strong>, digite <span style="font-family: monospace; font-weight: 800; background: #eee; padding: 2px 6px;">${couponCode}</span> e garanta 10% OFF na hora!
                  </td>
                </tr>
              </table>

              <!-- Botão CTA -->
              <a href="https://anafitwear.com" target="_blank" style="display: inline-block; background-color: #0b0b0b; color: #d4af37; text-decoration: none; padding: 16px 36px; font-size: 13px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; border: 2px solid #d4af37; border-radius: 2px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                USAR MEU CUPOM NO SITE AGORA &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f2f2f2; padding: 24px 30px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; line-height: 1.6;">
              <div style="font-weight: 800; color: #111; text-transform: uppercase; margin-bottom: 4px;">
                ANA FITNESS WEAR LLC
              </div>
              <div>Showroom & Concierge: Leominster, MA &bull; United States</div>
              <div style="margin-top: 6px;">
                Atendimento VIP via WhatsApp: <a href="https://wa.me/19783139452" style="color: #111; font-weight: 700; text-decoration: none;">+1 (978) 313-9452</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Disparo facilitado de Cupom de Avaliação para o e-mail da cliente
export async function sendReviewCouponEmail(opts: { customerEmail: string; customerName: string; couponCode?: string }) {
  const { customerEmail, customerName, couponCode = 'OBRIGADA10' } = opts;
  const recipientEmail = (customerEmail || '').trim();

  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { success: false, error: 'E-mail do cliente não informado.' };
  }

  const subject = `Seu Presente Chegou! 🎁 10% OFF na sua próxima compra - ANA Fitness Wear`;
  const html = generateReviewRewardCouponHtml(customerName, couponCode);

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    order_id: 'REVIEW-COUPON',
    type: 'GENERAL',
  });
}

// ============================================================================
// TEMPLATE 4: SOLICITAÇÃO PÓS-ENTREGA DE AVALIAÇÃO DO LOOK COMPRADO
// ============================================================================
export function generatePostDeliveryReviewEmailHtml(order: any): string {
  const orderId = order.order_id || order.id || 'ANA-ORDER';
  const customerName = order.customer_name || 'Cliente Especial';
  const recipientEmail = order.customer_email || order.shipping_address?.customer_email || '';

  const addr = order.shipping_address;
  const rawItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : (Array.isArray(addr?.items) ? addr.items : []);

  const itemsHtml = rawItems.map((item: any) => {
    const title = item.title || item.product_title || 'Peça Fitness';
    const size = item.size || 'M';
    const color = item.color || 'Preto Ônix';
    const slug = item.slug || (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    const itemImg = item.image || item.image_url || item.thumbnail || item.photo || '';
    const reviewLink = `https://anafitwear.com/produto/${slug}?avaliar=true&email=${encodeURIComponent(recipientEmail)}&nome=${encodeURIComponent(customerName)}`;

    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; background-color: #fafafa; border: 1px solid #e0e0e0; padding: 14px;">
        <tr>
          ${itemImg ? `
          <td width="90" valign="top" style="padding-right: 14px;">
            <img src="${itemImg}" alt="${title}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; display: block;" />
          </td>
          ` : ''}
          <td valign="middle">
            <div style="font-weight: 800; color: #111111; font-size: 14px; text-transform: uppercase;">
              ${title}
            </div>
            <div style="font-size: 12px; color: #666666; margin-top: 2px;">
              Tamanho: <strong style="color: #111;">${size}</strong> &bull; Cor: <strong style="color: #111;">${color}</strong>
            </div>
            <div style="margin-top: 10px;">
              <a href="${reviewLink}" target="_blank" style="display: inline-block; background-color: #d4af37; color: #0b0b0b; padding: 10px 18px; font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
                ★ AVALIAR ESTA PEÇA (+10% OFF) &rarr;
              </a>
            </div>
          </td>
        </tr>
      </table>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seu look chegou! O que você achou? 💖 - ANA Fitness Wear</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f8; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0b0b0b; padding: 36px 30px; text-align: center; border-bottom: 3px solid #d4af37;">
              <div style="color: #d4af37; font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px;">
                LEOMINSTER, MASSACHUSETTS &bull; OFFICIAL ATELIER
              </div>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0;">
                ANA FITNESS WEAR
              </h1>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding: 26px 30px; background-color: #faf8f2; border-bottom: 1px solid #eee; text-align: center;">
              <span style="display: inline-block; background-color: #0b0b0b; color: #d4af37; padding: 6px 14px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                🛍️ PEDIDO ENTREGUE COM SUCESSO
              </span>
              <h2 style="font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 14px 0 6px 0; color: #111;">
                COMO FICOU SEU LOOK, ${customerName.toUpperCase()}? 💖
              </h2>
              <p style="font-size: 13px; color: #555555; line-height: 1.6; max-width: 480px; margin: 0 auto;">
                Seu pedido #${orderId} foi entregue! Esperamos que você tenha amado a modelagem anatômica, a firmeza do cós e o toque amanteigado das nossas peças.
              </p>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding: 28px 30px;">
              <p style="font-size: 13px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
                Poderia dedicar <strong>1 minutinho</strong> para nos contar como foi a sua experiência com a sua peça? Ao enviar sua avaliação diretamente na página do produto, você ganha <strong>10% OFF</strong> na sua próxima compra com o cupom <strong>OBRIGADA10</strong>!
              </p>

              <h3 style="font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #111; margin: 0 0 12px 0; border-bottom: 2px solid #111; padding-bottom: 6px;">
                SELECIONE A PEÇA QUE VOCÊ RECEBEU:
              </h3>

              ${itemsHtml}

              <div style="background-color: #fff8e1; border: 1px solid #ffd54f; padding: 14px 18px; margin-top: 20px; font-size: 12px; color: #7f6000;">
                ★ <strong>Garantia de 10% OFF:</strong> Ao enviar sua avaliação na página da peça, o cupom <strong>OBRIGADA10</strong> é enviado direto para seu e-mail para você continuar arrasando nos treinos!
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f2f2f2; padding: 24px 30px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; line-height: 1.6;">
              <div style="font-weight: 800; color: #111; text-transform: uppercase; margin-bottom: 4px;">
                ANA FITNESS WEAR LLC
              </div>
              <div>Leominster, MA &bull; United States</div>
              <div style="margin-top: 6px;">
                Atendimento VIP WhatsApp: <a href="https://wa.me/19783139452" style="color: #111; font-weight: 700; text-decoration: none;">+1 (978) 313-9452</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendPostDeliveryReviewEmail(order: any) {
  const recipientEmail = order.customer_email || order.shipping_address?.customer_email;
  const orderId = order.order_id || order.id || 'ANA-ORDER';

  if (!recipientEmail) {
    console.warn(`[EMAIL] Pedido #${orderId} sem customer_email. E-mail de avaliação pós-entrega não enviado.`);
    return { success: false, error: 'E-mail do cliente não informado.' };
  }

  const subject = `Seu look chegou! O que você achou? Conte para nós e ganhe 10% OFF 💖 - ANA Fitness Wear`;
  const html = generatePostDeliveryReviewEmailHtml(order);

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    order_id: orderId,
    type: 'GENERAL',
  });
}


