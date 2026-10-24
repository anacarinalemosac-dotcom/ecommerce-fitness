import { NextRequest, NextResponse } from 'next/server';
import {
  readCoupons,
  writeCoupons,
  validateCouponCode,
  CouponRecord,
  DiscountType,
} from '@/lib/couponsStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const subtotal = parseFloat(searchParams.get('subtotal') || '0') || 0;
    const channel = (searchParams.get('channel') as 'ONLINE' | 'POS') || 'ONLINE';

    // Se fornecido código, valida o cupom para o Checkout ou PDV
    if (code) {
      const result = await validateCouponCode(code, subtotal, channel);
      if (!result.valid) {
        return NextResponse.json({ success: false, ...result }, { status: 400 });
      }
      return NextResponse.json(
        { success: true, ...result },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // Se não fornecido código, retorna todos os cupons cadastrados
    const coupons = await readCoupons();
    return NextResponse.json(
      { success: true, coupons },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('Erro na rota de cupons GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao processar cupons' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const coupons = await readCoupons();

    // 1. Criar novo cupom
    if (action === 'create') {
      const {
        code,
        description,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        max_uses,
        valid_from,
        valid_until,
        applies_to = 'ALL',
        seller_name = 'Loja Oficial Ana Fitness Wear',
      } = body.coupon || {};

      const cleanCode = (code || '').trim().toUpperCase().replace(/\s+/g, '');
      if (!cleanCode) {
        return NextResponse.json(
          { success: false, error: 'O código do cupom é obrigatório.' },
          { status: 400 }
        );
      }

      // Verifica duplicidade de código
      const exists = coupons.some((c) => c.code.toUpperCase() === cleanCode);
      if (exists) {
        return NextResponse.json(
          { success: false, error: `Já existe um cupom com o código "${cleanCode}".` },
          { status: 400 }
        );
      }

      const numVal = parseFloat(discount_value) || 0;
      if (discount_type !== 'FREE_SHIPPING' && numVal <= 0) {
        return NextResponse.json(
          { success: false, error: 'O valor do desconto deve ser maior que zero.' },
          { status: 400 }
        );
      }

      const newCoupon: CouponRecord = {
        id: `coup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: cleanCode,
        description: description ? description.trim() : undefined,
        discount_type: (discount_type as DiscountType) || 'PERCENTAGE',
        discount_value: numVal,
        min_order_amount: min_order_amount ? parseFloat(min_order_amount) : undefined,
        max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : undefined,
        max_uses: max_uses ? parseInt(max_uses, 10) : undefined,
        times_used: 0,
        valid_from: valid_from || undefined,
        valid_until: valid_until || undefined,
        active: true,
        applies_to: applies_to || 'ALL',
        seller_name: seller_name || 'Loja Oficial Ana Fitness Wear',
        created_at: new Date().toISOString(),
      };

      const updated = [newCoupon, ...coupons];
      await writeCoupons(updated);

      return NextResponse.json({
        success: true,
        message: `Cupom "${cleanCode}" criado com sucesso!`,
        coupon: newCoupon,
        coupons: updated,
      });
    }

    // 2. Atualizar cupom existente
    if (action === 'update') {
      const { id } = body.coupon || {};
      if (!id) {
        return NextResponse.json({ success: false, error: 'ID do cupom não informado.' }, { status: 400 });
      }

      const cleanCode = (body.coupon.code || '').trim().toUpperCase().replace(/\s+/g, '');
      const numVal = parseFloat(body.coupon.discount_value) || 0;

      const updated = coupons.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          code: cleanCode || c.code,
          description: body.coupon.description !== undefined ? body.coupon.description.trim() : c.description,
          discount_type: body.coupon.discount_type || c.discount_type,
          discount_value: numVal >= 0 ? numVal : c.discount_value,
          min_order_amount: body.coupon.min_order_amount !== undefined ? (parseFloat(body.coupon.min_order_amount) || undefined) : c.min_order_amount,
          max_discount_amount: body.coupon.max_discount_amount !== undefined ? (parseFloat(body.coupon.max_discount_amount) || undefined) : c.max_discount_amount,
          max_uses: body.coupon.max_uses !== undefined ? (parseInt(body.coupon.max_uses, 10) || undefined) : c.max_uses,
          valid_from: body.coupon.valid_from !== undefined ? (body.coupon.valid_from || undefined) : c.valid_from,
          valid_until: body.coupon.valid_until !== undefined ? (body.coupon.valid_until || undefined) : c.valid_until,
          active: body.coupon.active !== undefined ? Boolean(body.coupon.active) : c.active,
          applies_to: body.coupon.applies_to || c.applies_to,
        };
      });

      await writeCoupons(updated);
      return NextResponse.json({
        success: true,
        message: 'Cupom atualizado com sucesso!',
        coupons: updated,
      });
    }

    // 3. Pausar ou Ativar Cupom (1 Clique)
    if (action === 'toggle_status') {
      const { id } = body;
      const target = coupons.find((c) => c.id === id);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Cupom não encontrado.' }, { status: 404 });
      }

      const updated = coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c));
      await writeCoupons(updated);

      return NextResponse.json({
        success: true,
        message: `Cupom "${target.code}" agora está ${!target.active ? 'ATIVADO' : 'PAUSADO'}.`,
        coupons: updated,
      });
    }

    // 4. Excluir cupom
    if (action === 'delete') {
      const { id } = body;
      const updated = coupons.filter((c) => c.id !== id);
      await writeCoupons(updated);

      return NextResponse.json({
        success: true,
        message: 'Cupom removido com sucesso!',
        coupons: updated,
      });
    }

    // 5. Incrementar contador de uso após venda concluída
    if (action === 'increment_usage') {
      const { code } = body;
      if (!code) {
        return NextResponse.json({ success: false, error: 'Código não informado' }, { status: 400 });
      }

      const clean = code.trim().toUpperCase();
      const updated = coupons.map((c) =>
        c.code.toUpperCase() === clean ? { ...c, times_used: (c.times_used || 0) + 1 } : c
      );
      await writeCoupons(updated);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (err: any) {
    console.error('Erro no POST de cupons:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
