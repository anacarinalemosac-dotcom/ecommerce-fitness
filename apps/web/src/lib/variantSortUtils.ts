/**
 * Utility for sorting activewear variants and sizes consistently.
 * Always groups variants by color (so all items of the same color stay together),
 * and sorts sizes logically: PP -> P -> M -> G -> GG -> XGG -> One Size.
 */

export const SIZE_RANK_MAP: Record<string, number> = {
  // PP / XS
  'PP': 1,
  'XS': 1,
  'PP (XS)': 1,
  'XS (PP)': 1,
  'EXTRA SMALL': 1,
  '0': 1,
  '2': 1,

  // P / S
  'P': 2,
  'S': 2,
  'P (S)': 2,
  'S (P)': 2,
  'SMALL': 2,
  '4': 2,
  '6': 2,

  // M / M
  'M': 3,
  'M (M)': 3,
  'MEDIUM': 3,
  '8': 3,
  '10': 3,

  // G / L
  'G': 4,
  'L': 4,
  'G (L)': 4,
  'L (G)': 4,
  'LARGE': 4,
  '12': 4,
  '14': 4,

  // GG / XL
  'GG': 5,
  'XL': 5,
  'GG (XL)': 5,
  'XL (GG)': 5,
  'EXTRA LARGE': 5,
  '16': 5,

  // XGG / XXL / 2XL
  'XGG': 6,
  'XXL': 6,
  '2XL': 6,
  'XGG (XXL)': 6,
  'XXL (XGG)': 6,
  '18': 6,

  // Plus Sizes
  'G1': 7,
  '1X': 7,
  'G2': 8,
  '2X': 8,
  'G3': 9,
  '3X': 9,
  '3XL': 9,

  // Tamanho Único
  'ONE SIZE': 20,
  'ONESIZE': 20,
  'TAMANHO ÚNICO': 20,
  'TAMANHO UNICO': 20,
  'ÚNICO': 20,
  'UNICO': 20,
  'U': 20,
  'TU': 20,
};

export function getSizeRank(sizeStr?: string | null): number {
  if (!sizeStr) return 99;
  const clean = String(sizeStr).trim().toUpperCase();
  if (SIZE_RANK_MAP[clean] !== undefined) return SIZE_RANK_MAP[clean];

  for (const [key, rank] of Object.entries(SIZE_RANK_MAP)) {
    if (clean === key || clean.startsWith(`${key} `) || clean.endsWith(` ${key}`) || clean.includes(key)) {
      return rank;
    }
  }

  return 99;
}

export function sortSizesList(sizes: string[]): string[] {
  if (!Array.isArray(sizes)) return [];
  const unique = Array.from(new Set(sizes.map((s) => String(s || '').trim()).filter(Boolean)));
  return unique.sort((a, b) => {
    const rankA = getSizeRank(a);
    const rankB = getSizeRank(b);
    if (rankA !== rankB) return rankA - rankB;
    return a.localeCompare(b);
  });
}

/**
 * Organiza variantes agrupando estritamente por cor e ordenando os tamanhos em ordem crescente:
 * (ex: Verde Sage P, Verde Sage M, Verde Sage G, Verde Sage GG).
 * Impede que variações da mesma cor fiquem espalhadas no catálogo, no backoffice e no banco de dados.
 */
export function sortVariantsByColorAndSize<T extends { color?: string; size?: string }>(variants: T[]): T[] {
  if (!Array.isArray(variants)) return [];

  return [...variants].sort((a, b) => {
    const colorA = String(a.color || '').trim().toLowerCase();
    const colorB = String(b.color || '').trim().toLowerCase();

    // 1. Agrupa por Cor
    if (colorA !== colorB) {
      return colorA.localeCompare(colorB, 'pt', { sensitivity: 'base' });
    }

    // 2. Dentro da mesma cor, ordena por tamanho lógico (PP -> P -> M -> G -> GG -> XGG)
    const rankA = getSizeRank(a.size);
    const rankB = getSizeRank(b.size);
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // 3. Fallback alfabético de tamanho
    return String(a.size || '').localeCompare(String(b.size || ''));
  });
}
