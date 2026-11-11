import { NextRequest, NextResponse } from 'next/server';
import {
  loadMarketingContacts,
  saveMarketingContacts,
  syncMarketingContactsFromAllSources,
  upsertMarketingContactAndPersist,
} from '@/lib/marketingContactsStore';
import { sendMarketingLaunchEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const contacts = await syncMarketingContactsFromAllSources();
    const withPhone = contacts.filter((c) => Boolean(c.phone_digits)).length;
    const withEmail = contacts.filter((c) => Boolean(c.email)).length;
    return NextResponse.json(
      {
        success: true,
        contacts,
        summary: {
          total: contacts.length,
          withPhone,
          withEmail,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('Erro ao listar contatos de marketing:', err);
    return NextResponse.json({ error: err.message || 'Erro ao carregar contatos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'sync_from_orders') {
      const contacts = await syncMarketingContactsFromAllSources();
      return NextResponse.json({ success: true, contacts });
    }

    if (action === 'add_contact' || !action) {
      const { name, phone, email, city, state, sizes, preferred_sizes, notes, last_product, source } = body;
      if (!name && !phone && !email) {
        return NextResponse.json({ error: 'Informe pelo menos Nome, WhatsApp/Telefone ou E-mail.' }, { status: 400 });
      }
      const sizesArr = Array.isArray(sizes || preferred_sizes)
        ? sizes || preferred_sizes
        : typeof preferred_sizes === 'string'
        ? preferred_sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      const contacts = await upsertMarketingContactAndPersist({
        name: name || 'Cliente WhatsApp',
        phone: phone || '',
        email: email || '',
        city: city || '',
        state: state || '',
        sizes: sizesArr,
        last_product: last_product || '',
        notes: notes || '',
        source: source || 'WHATSAPP_MANUAL',
      });

      return NextResponse.json({
        success: true,
        contacts,
        message: 'Contato salvo na lista VIP de marketing!',
      });
    }

    if (action === 'toggle_opt_out') {
      const { id, opted_out } = body;
      const list = await loadMarketingContacts();
      const next = list.map((c) => (c.id === id ? { ...c, opted_out: Boolean(opted_out), updated_at: new Date().toISOString() } : c));
      await saveMarketingContacts(next);
      return NextResponse.json({ success: true, contacts: next });
    }

    if (action === 'update_contact') {
      const { id, name, phone, email, city, state, sizes, notes } = body;
      const list = await loadMarketingContacts();
      const digits = String(phone || '').replace(/\D/g, '');
      const phoneDigits = digits.length === 10 ? `1${digits}` : digits;
      const next = list.map((c) =>
        c.id === id
          ? {
              ...c,
              name: name !== undefined ? String(name).trim() : c.name,
              phone: phone !== undefined ? String(phone).trim() : c.phone,
              phone_digits: phone !== undefined ? phoneDigits : c.phone_digits,
              email: email !== undefined ? String(email).trim().toLowerCase() : c.email,
              city: city !== undefined ? String(city).trim() : c.city,
              state: state !== undefined ? String(state).trim().toUpperCase() : c.state,
              sizes_bought: Array.isArray(sizes) ? sizes : c.sizes_bought,
              notes: notes !== undefined ? String(notes).trim() : c.notes,
              updated_at: new Date().toISOString(),
            }
          : c
      );
      await saveMarketingContacts(next);
      return NextResponse.json({ success: true, contacts: next });
    }

    if (action === 'send_email_campaign') {
      const { subject, message, contactIds, featuredProducts = [] } = body;
      const list = await loadMarketingContacts();
      const targets = list.filter((c) => {
        if (c.opted_out || !c.email || !c.email.includes('@')) return false;
        if (Array.isArray(contactIds) && contactIds.length > 0) {
          return contactIds.includes(c.id);
        }
        return true;
      });

      if (targets.length === 0) {
        return NextResponse.json(
          { error: 'Nenhum contato com e-mail válido selecionado para disparo.' },
          { status: 400 }
        );
      }

      let sentCount = 0;
      let failedCount = 0;
      const campaignSubject =
        String(subject || '').trim() || '✨ Chegaram Conjuntos Novos Exclusivos! - ANA Fitness Wear';
      const campaignIntro =
        String(message || '').trim() ||
        'Acabamos de receber conjuntos novos com zero transparência e modelagem anatômica perfeita! Garanta o seu antes que esgote.';

      for (const recipient of targets) {
        try {
          const res = await sendMarketingLaunchEmail({
            to: recipient.email,
            customerName: recipient.name,
            subject: campaignSubject,
            introText: campaignIntro,
            featuredProducts,
          });
          if (res.success) sentCount++;
          else failedCount++;
        } catch {
          failedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        sentCount,
        failedCount,
        totalTargeted: targets.length,
        message: `Campanha processada: ${sentCount} enviado(s)${failedCount > 0 ? `, ${failedCount} falha(s)` : ''}.`,
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err: any) {
    console.error('Erro no POST de marketing-contacts:', err);
    return NextResponse.json({ error: err.message || 'Erro no servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    const list = await loadMarketingContacts();
    const next = list.filter((c) => c.id !== id);
    await saveMarketingContacts(next);
    return NextResponse.json({ success: true, contacts: next });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
