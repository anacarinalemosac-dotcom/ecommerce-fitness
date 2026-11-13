import { NextRequest, NextResponse } from 'next/server';
import {
  getEmailOutbox,
  saveEmailRecord,
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
  sendTestEmail,
  generateOrderConfirmationHtml,
  generateShippingConfirmationHtml,
} from '@/lib/emailService';
import { getEmailConfig, saveEmailConfig, getMaskedEmailConfig, EmailConfig } from '@/lib/emailConfig';
import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    let outbox = getEmailOutbox();
    if (orderId) {
      outbox = outbox.filter((e) => e.order_id === orderId);
    }

    const config = getEmailConfig();
    const maskedConfig = getMaskedEmailConfig(config);

    const sentCount = outbox.filter((e) => e.status === 'SENT').length;
    const failedCount = outbox.filter((e) => e.status === 'FAILED').length;
    const simulatedCount = outbox.filter((e) => e.status === 'SIMULATED_SENT').length;

    const hasRealProvider =
      (config.provider === 'gmail' && Boolean(config.gmailUser && config.gmailAppPassword)) ||
      (config.provider === 'resend' && Boolean(config.resendApiKey || process.env.RESEND_API_KEY)) ||
      (config.provider === 'custom_smtp' && Boolean(config.smtpHost && config.smtpUser && config.smtpPass));

    return NextResponse.json({
      success: true,
      config: maskedConfig,
      emails: outbox,
      total: outbox.length,
      stats: {
        total: outbox.length,
        sentCount,
        failedCount,
        simulatedCount,
      },
      hasRealProvider,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // ------------------------------------------------------------------------
    // AÇÃO 1: SALVAR CONFIGURAÇÃO DO PROVEDOR DE E-MAIL
    // ------------------------------------------------------------------------
    if (action === 'save_config') {
      const newConfigPayload: Partial<EmailConfig> = body.config || {};
      const current = getEmailConfig();

      // Se a senha do Gmail ou SMTP não for enviada ou for apenas máscara, mantém a atual
      if (newConfigPayload.gmailAppPassword && newConfigPayload.gmailAppPassword.includes('••••')) {
        delete newConfigPayload.gmailAppPassword;
      }
      if (newConfigPayload.resendApiKey && newConfigPayload.resendApiKey.includes('••••')) {
        delete newConfigPayload.resendApiKey;
      }
      if (newConfigPayload.smtpPass && newConfigPayload.smtpPass.includes('••••')) {
        delete newConfigPayload.smtpPass;
      }

      const updated = await saveEmailConfig(newConfigPayload);
      return NextResponse.json({
        success: true,
        message: 'Configurações de e-mail salvas com sucesso!',
        config: getMaskedEmailConfig(updated),
      });
    }

    // ------------------------------------------------------------------------
    // AÇÃO 2: TESTAR CONEXÃO E DISPARO DE E-MAIL NA HORA
    // ------------------------------------------------------------------------
    if (action === 'test_connection') {
      const targetEmail = body.target_email || body.email;
      const testResult = await sendTestEmail(targetEmail);

      if (!testResult.success) {
        return NextResponse.json({
          success: false,
          error: testResult.error || 'Falha ao autenticar ou enviar e-mail de teste.',
          provider: testResult.provider,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'E-mail de teste disparado com sucesso! Verifique a sua caixa de entrada.',
        result: testResult,
      });
    }

    // ------------------------------------------------------------------------
    // AÇÃO 3: PRÉ-VISUALIZAR HTML DO E-MAIL
    // ------------------------------------------------------------------------
    if (action === 'preview_order_email') {
      const sampleOrder = body.order || {
        order_id: 'ANA-982341',
        created_at: new Date().toISOString(),
        customer_name: 'Camila Rodrigues',
        customer_email: 'cliente@exemplo.com',
        customer_phone: '+1 (978) 555-0199',
        payment_method: 'CARD',
        subtotal_products: 89.80,
        shipping_fee: 9.90,
        discount_amount: 10.00,
        total_amount: 89.70,
        delivery_method: 'DELIVERY',
        shipping_address: {
          address: '742 Commonwealth Ave',
          apt: 'Apt 4B',
          city: 'Boston',
          state: 'MA',
          zip: '02215',
        },
        items: [
          {
            title: 'Set Ana Suplex Bicolor Turquesa e Bege',
            size: 'M',
            color: 'Azul Turquesa',
            sku: 'ANA-TURQ-M',
            quantity: 1,
            unit_price: 44.90,
            image: 'https://grmlmouqkixvfxbdifrc.supabase.co/storage/v1/object/public/products/1794313586030-kxs3id.png',
          },
          {
            title: 'Romper Beach Samanta Terracotta',
            size: 'ONE SIZE',
            color: 'Terracotta',
            sku: 'ROM-TERR-UNI',
            quantity: 1,
            unit_price: 44.90,
            image: 'https://grmlmouqkixvfxbdifrc.supabase.co/storage/v1/object/public/products/1791762039158-erloxq.JPG',
          },
        ],
      };

      const html = generateOrderConfirmationHtml(sampleOrder);
      return NextResponse.json({ success: true, html });
    }

    // ------------------------------------------------------------------------
    // AÇÃO 4: REENVIAR E-MAIL DE QUALQUER PEDIDO PARA O CLIENTE
    // ------------------------------------------------------------------------
    const { order_id, type = 'ORDER_CONFIRMATION', tracking_code, email, name, phone, source, notes } = body;

    // Se for lead institucional, formulário de contato ou inscrição VIP da newsletter
    if (!order_id && email) {
      const emailRecord = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        order_id: source || 'CONTACT_LEAD',
        to: email,
        subject: source === 'footer_newsletter' ? 'Inscrição VIP Newsletter' : (notes?.split(']')[0]?.replace('[', '') || 'Mensagem do Site'),
        type: 'GENERAL' as const,
        status: 'SIMULATED_SENT' as const,
        created_at: new Date().toISOString(),
        html_preview: `<p><strong>Nome:</strong> ${name || 'N/A'}</p><p><strong>Telefone:</strong> ${phone || 'N/A'}</p><p><strong>E-mail:</strong> ${email}</p><p><strong>Mensagem:</strong> ${notes || 'Inscrição VIP na Newsletter confirmada.'}</p>`,
      };
      saveEmailRecord(emailRecord as any);
      return NextResponse.json({ success: true, lead: true, id: emailRecord.id });
    }

    if (!order_id) {
      return NextResponse.json({ error: 'order_id ou action é obrigatório' }, { status: 400 });
    }

    // 1. Busca primeiro no Supabase
    let order: any = null;
    try {
      const { data: dbOrder } = await supabaseServer
        .from('orders')
        .select('*')
        .or(`id.eq.${order_id},shipping_address->>order_number.eq.${order_id}`)
        .maybeSingle();

      if (dbOrder) {
        const sAddr = dbOrder.shipping_address || {};
        order = {
          id: dbOrder.id,
          order_id: sAddr.order_number || dbOrder.id,
          created_at: dbOrder.created_at,
          customer_name: dbOrder.customer_name || 'Cliente',
          customer_email: email || dbOrder.customer_email || sAddr.customer_email,
          customer_phone: dbOrder.customer_phone || sAddr.customer_phone,
          payment_method: dbOrder.payment_method || 'CARD',
          subtotal_products: dbOrder.subtotal_amount || 0,
          shipping_fee: sAddr.shipping_fee !== undefined ? sAddr.shipping_fee : 9.90,
          discount_amount: dbOrder.discount_amount || 0,
          total_amount: dbOrder.total_amount || 0,
          delivery_method: sAddr.delivery_method || 'DELIVERY',
          shipping_address: sAddr.address || sAddr,
          items: sAddr.items || [],
          tracking_code: tracking_code || sAddr.tracking_code,
        };
      }
    } catch (_) {}

    // 2. Fallback no arquivo local de vendas
    if (!order) {
      const salesFile = path.join(process.cwd(), 'sales_history_db.json');
      if (fs.existsSync(salesFile)) {
        try {
          const sales = JSON.parse(fs.readFileSync(salesFile, 'utf8'));
          order = sales.find((s: any) => s.order_id === order_id || s.id === order_id);
          if (order && email) {
            order.customer_email = email;
          }
        } catch (_) {}
      }
    }

    if (!order) {
      return NextResponse.json({ error: `Pedido #${order_id} não localizado no sistema.` }, { status: 404 });
    }

    let result;
    if (type === 'SHIPPING_NOTIFICATION') {
      result = await sendShippingNotificationEmail(order, tracking_code || order.tracking_code || '9400100000000000000000');
    } else {
      result = await sendOrderConfirmationEmail(order);
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Erro no endpoint /api/backoffice/emails:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
