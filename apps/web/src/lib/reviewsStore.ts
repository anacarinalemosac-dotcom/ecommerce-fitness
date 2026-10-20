import { supabaseServer } from '@/lib/supabaseServer';
import fs from 'fs';
import path from 'path';

export const REVIEWS_ROW_ID = '00000000-0000-0000-0000-000000000095';
export const REVIEWS_SLUG = '__reviews_db_state__';
export const REVIEWS_FILE = path.join(process.cwd(), 'reviews_db.json');

export interface ProductReview {
  id: string;
  customerName: string;
  customerHandle?: string;
  customerEmail?: string;
  customerPhone?: string;
  productSlug?: string;
  productTitle: string;
  rating: number; // 1 to 5
  comment: string;
  city: string;
  photoUrl?: string;
  status: 'APPROVED' | 'PENDING' | 'HIDDEN';
  verifiedBuyer: boolean;
  createdAt: string;
}

export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    customerName: 'Mariana Salles',
    customerHandle: '@marianasalles_fit',
    productSlug: 'samanta-romper',
    productTitle: 'Samanta Romper',
    rating: 5,
    comment: 'O tecido é surreal de perfeito! Zero transparência de verdade mesmo no agachamento pesado. O cós duplo anatômico segura tudo no lugar. Já quero todas as cores!',
    city: 'Boston, MA',
    photoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80',
    status: 'APPROVED',
    verifiedBuyer: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev-2',
    customerName: 'Beatriz Lima',
    customerHandle: '@beatriz_fitness',
    productSlug: 'blusa-bailarina',
    productTitle: 'Bailarina Top',
    rating: 5,
    comment: 'Modelagem impecável! O bojo removível dá uma sustentação maravilhosa sem apertar. Chegou super rápido aqui em Massachusetts.',
    city: 'Framingham, MA',
    photoUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&q=80',
    status: 'APPROVED',
    verifiedBuyer: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev-3',
    customerName: 'Camila Duarte',
    customerHandle: '@camila_duarte',
    productSlug: 'monique-flare-pants-set',
    productTitle: 'Monique Flare Pants Set',
    rating: 5,
    comment: 'A calça flare alonga a silhueta de uma forma inacreditável. Amei a poliamida nobre com elastano, super macia e confortável para o dia todo!',
    city: 'Worcester, MA',
    photoUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80',
    status: 'APPROVED',
    verifiedBuyer: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev-4',
    customerName: 'Juliana Mendes',
    customerHandle: '@jumendes_usa',
    productSlug: 'samanta-romper',
    productTitle: 'Beach Samanta Romper',
    rating: 5,
    comment: 'Chegou em 2 dias aqui em Leominster! O detalhe das costas abertas é perfeito e não fica descendo no treino. Recomendo de olhos fechados!',
    city: 'Leominster, MA',
    photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
    status: 'APPROVED',
    verifiedBuyer: true,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let memoryReviews: ProductReview[] | null = null;
let lastReviewsFetch = 0;

export async function readReviews(): Promise<ProductReview[]> {
  const now = Date.now();
  if (memoryReviews && now - lastReviewsFetch < 3000) {
    return memoryReviews;
  }

  // 1. Tenta carregar do Supabase (Nuvem em produção / Vercel)
  try {
    const { data: row, error } = await supabaseServer
      .from('products')
      .select('description')
      .eq('id', REVIEWS_ROW_ID)
      .maybeSingle();

    if (!error && row?.description) {
      try {
        const parsed = JSON.parse(row.description);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryReviews = parsed;
          lastReviewsFetch = now;
          return memoryReviews;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Erro ao ler reviews do Supabase:', err);
  }

  // 2. Fallback para arquivo local
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const raw = fs.readFileSync(REVIEWS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryReviews = parsed;
        lastReviewsFetch = now;
        return memoryReviews;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler reviews_db.json:', e);
  }

  // 3. Fallback inicial
  memoryReviews = [...INITIAL_REVIEWS];
  lastReviewsFetch = now;
  return memoryReviews;
}

export async function writeReviews(reviews: ProductReview[]): Promise<void> {
  memoryReviews = reviews;
  lastReviewsFetch = Date.now();
  const serialized = JSON.stringify(reviews, null, 2);

  // 1. Salva no Supabase (Nuvem permanente para produção)
  try {
    await supabaseServer.from('products').upsert({
      id: REVIEWS_ROW_ID,
      title: '__REVIEWS_DB_STATE__',
      slug: REVIEWS_SLUG,
      description: serialized,
    });
  } catch (err) {
    console.warn('Erro ao salvar reviews no Supabase:', err);
  }

  // 2. Salva no arquivo local
  try {
    fs.writeFileSync(REVIEWS_FILE, serialized, 'utf8');
  } catch (e) {
    console.error('Erro ao salvar reviews_db.json:', e);
  }
}
