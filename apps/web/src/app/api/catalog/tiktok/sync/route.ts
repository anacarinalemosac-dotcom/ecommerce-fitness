import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import {
  syncProductToTikTokShop,
  getTikTokSyncLog,
  TikTokShopCredentials,
  buildTikTokProductPayload,
} from '@/lib/tiktokShopService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SETTINGS_ROW_ID = '00000000-0000-0000-0000-000000000098';

// Helper para ler as credenciais do TikTok Shop salvas no site
async function getStoredTikTokCredentials(): Promise<TikTokShopCredentials & { autoSync?: boolean }> {
  try {
    const { data: row } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle();

    if (row?.description) {
      const parsed = JSON.parse(row.description);
      return {
        appKey: parsed.tiktokShopAppKey || process.env.TIKTOK_SHOP_APP_KEY || '',
        appSecret: parsed.tiktokShopAppSecret || process.env.TIKTOK_SHOP_APP_SECRET || '',
        accessToken: parsed.tiktokShopAccessToken || process.env.TIKTOK_SHOP_ACCESS_TOKEN || '',
        shopCipher: parsed.tiktokShopCipher || parsed.tiktokShopId || process.env.TIKTOK_SHOP_CIPHER || '',
        sellerId: parsed.tiktokShopId || parsed.tiktokSellerId || '7494943021231081116',
        autoSync: parsed.tiktokShopAutoSync === true,
      };
    }
  } catch (err) {
    console.warn('Erro ao ler credenciais do TikTok Shop:', err);
  }

  return {
    appKey: process.env.TIKTOK_SHOP_APP_KEY || '',
    appSecret: process.env.TIKTOK_SHOP_APP_SECRET || '',
    accessToken: process.env.TIKTOK_SHOP_ACCESS_TOKEN || '',
    sellerId: '7494943021231081116',
    autoSync: false,
  };
}

export async function GET() {
  try {
    const credentials = await getStoredTikTokCredentials();
    const logs = getTikTokSyncLog();

    const isConfigured = Boolean(
      credentials.appKey && credentials.appSecret && credentials.accessToken
    );

    return NextResponse.json({
      configured: isConfigured,
      sellerId: credentials.sellerId || '7494943021231081116',
      autoSync: credentials.autoSync,
      hasAppKey: Boolean(credentials.appKey),
      hasAppSecret: Boolean(credentials.appSecret),
      hasAccessToken: Boolean(credentials.accessToken),
      recentLogs: logs.slice(0, 20),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, action = 'sync', credentials: customCreds } = body;

    const storedCreds = await getStoredTikTokCredentials();
    const credentials: TikTokShopCredentials = {
      appKey: customCreds?.appKey || storedCreds.appKey,
      appSecret: customCreds?.appSecret || storedCreds.appSecret,
      accessToken: customCreds?.accessToken || storedCreds.accessToken,
      shopCipher: customCreds?.shopCipher || storedCreds.shopCipher,
      sellerId: customCreds?.sellerId || storedCreds.sellerId,
    };

    // AÇÃO: TESTE DE VALIDAÇÃO DE CONEXÃO E PAYLOAD
    if (action === 'test_connection') {
      const isReady = Boolean(
        credentials.appKey && credentials.appSecret && credentials.accessToken
      );
      return NextResponse.json({
        success: true,
        configured: isReady,
        message: isReady
          ? 'Credenciais do TikTok Shop configuradas e prontas para sincronização automática!'
          : 'Chaves pendentes: informe sua App Key, App Secret e Access Token para habilitar a transmissão automática.',
      });
    }

    // AÇÃO: SINCRONIZAÇÃO EM MASSA (ATÉ 200 PRODUTOS)
    if (action === 'bulk_sync' || productId === 'ALL') {
      const { data: dbProducts } = await supabaseServer
        .from('products')
        .select('*, categories(*)')
        .neq('slug', '__live_radar_state__')
        .neq('slug', '__site_settings_state__')
        .neq('slug', '__instagram_direct_state__')
        .order('created_at', { ascending: false })
        .limit(200);

      const prodsToSync = dbProducts || [];
      const results: any[] = [];

      for (const prod of prodsToSync) {
        let meta: any = {};
        try {
          if (prod.description && prod.description.startsWith('{')) {
            meta = JSON.parse(prod.description);
          }
        } catch (e) {}

        const merged = {
          ...prod,
          images: meta.images || [prod.primary_image],
          primaryImage: prod.primary_image || meta.primary_image,
          variants: meta.variants || [],
        };

        const res = await syncProductToTikTokShop(merged, credentials);
        results.push({
          id: prod.id,
          title: prod.title,
          ...res,
        });
      }

      return NextResponse.json({
        success: true,
        totalProcessed: results.length,
        results,
      });
    }

    // AÇÃO: SINCRONIZAR PRODUTO INDIVIDUAL
    if (!productId) {
      return NextResponse.json({ error: 'productId é obrigatório.' }, { status: 400 });
    }

    // Busca o produto no banco
    const { data: prod, error } = await supabaseServer
      .from('products')
      .select('*, categories(*)')
      .eq('id', productId)
      .maybeSingle();

    if (error || !prod) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    let meta: any = {};
    try {
      if (prod.description && prod.description.startsWith('{')) {
        meta = JSON.parse(prod.description);
      }
    } catch (e) {}

    const { data: variants } = await supabaseServer
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);

    const mergedProduct = {
      ...prod,
      images: Array.isArray(meta.images) && meta.images.length > 0 ? meta.images : [prod.primary_image],
      primaryImage: prod.primary_image || meta.primary_image,
      variants: (variants && variants.length > 0) ? variants : (meta.variants || []),
    };

    const syncResult = await syncProductToTikTokShop(mergedProduct, credentials);

    return NextResponse.json(syncResult);
  } catch (err: any) {
    console.error('Erro na rota /api/catalog/tiktok/sync:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
