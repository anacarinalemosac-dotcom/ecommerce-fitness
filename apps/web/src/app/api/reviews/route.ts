import { NextRequest, NextResponse } from 'next/server';
import { readReviews, writeReviews, ProductReview } from '@/lib/reviewsStore';
import { recordOrderEvent } from '@/lib/liveStore';
import { sendReviewCouponEmail } from '@/lib/emailService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const all = searchParams.get('all') === 'true'; // Para backoffice

    const reviews = await readReviews();

    let filtered = reviews;
    if (!all) {
      filtered = filtered.filter((r) => r.status === 'APPROVED');
    }
    if (slug) {
      filtered = filtered.filter((r) => r.productSlug === slug || (r.productTitle || '').toLowerCase().includes(slug.toLowerCase()));
    }

    const totalApproved = reviews.filter((r) => r.status === 'APPROVED');
    const avgRating = totalApproved.length > 0
      ? (totalApproved.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalApproved.length).toFixed(1)
      : '5.0';

    return NextResponse.json({
      success: true,
      reviews: filtered,
      totalCount: filtered.length,
      averageRating: avgRating,
      allCount: reviews.length,
    });
  } catch (error: any) {
    console.error('Erro ao buscar avaliações:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail = '',
      customerPhone = '',
      productTitle = 'Peça Fitness Ana Fitness Wear',
      productSlug = '',
      rating = 5,
      comment = '',
      city = 'Massachusetts, EUA',
      photoUrl = '',
    } = body;

    if (!customerName || !comment) {
      return NextResponse.json(
        { error: 'Por favor, informe seu nome e sua opinião sobre a peça.' },
        { status: 400 }
      );
    }

    const reviews = await readReviews();

    const cleanRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
    const handle = `@${customerName.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}`;

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerName: customerName.trim(),
      customerHandle: handle,
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      productSlug: (productSlug || '').trim(),
      productTitle: productTitle.trim(),
      rating: cleanRating,
      comment: comment.trim(),
      city: (city || 'EUA').trim(),
      photoUrl: photoUrl.trim() || undefined,
      status: 'APPROVED',
      verifiedBuyer: true,
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(newReview);
    await writeReviews(reviews);

    // Emite evento no radar ao vivo
    try {
      recordOrderEvent({
        orderId: `REV-${newReview.id.slice(-6)}`,
        customerName: `${newReview.customerName} (Avaliação ⭐ 5.0)`,
        city: newReview.city,
        amount: 0,
        itemsSummary: `${newReview.productTitle}: "${newReview.comment.slice(0, 40)}..."`,
      });
    } catch (_) {}

    // Envia o cupom por e-mail para o cliente caso o e-mail tenha sido informado
    let emailSent = false;
    if (newReview.customerEmail && newReview.customerEmail.includes('@')) {
      try {
        const mailRes = await sendReviewCouponEmail({
          customerEmail: newReview.customerEmail,
          customerName: newReview.customerName,
          couponCode: 'OBRIGADA10',
        });
        emailSent = Boolean(mailRes?.success);
      } catch (mailErr) {
        console.warn('Erro ao disparar e-mail de cupom de avaliação:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sua avaliação foi publicada com sucesso! Muito obrigado pelo carinho!',
      review: newReview,
      coupon: 'OBRIGADA10',
      discountPct: 10,
      emailSent,
    });
  } catch (error: any) {
    console.error('Erro ao gravar avaliação:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, delete: shouldDelete } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da avaliação obrigatório' }, { status: 400 });
    }

    let reviews = await readReviews();

    if (shouldDelete) {
      reviews = reviews.filter((r) => r.id !== id);
      await writeReviews(reviews);
      return NextResponse.json({ success: true, message: 'Avaliação excluída com sucesso' });
    }

    if (status) {
      reviews = reviews.map((r) => (r.id === id ? { ...r, status } : r));
      await writeReviews(reviews);
      return NextResponse.json({ success: true, message: 'Status atualizado com sucesso' });
    }

    return NextResponse.json({ error: 'Nenhuma ação informada' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro ao atualizar avaliação:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
