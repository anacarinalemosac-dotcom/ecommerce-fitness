/**
 * Utility to resolve luxury activewear colors and dual-tone gradients.
 * Supports Portuguese and English color names, bicolor/tricolor combinations,
 * and thumbnail image previews for color swatches.
 */

const BASE_COLOR_MAP: Record<string, string> = {
  // Pretos / Escuros
  'preto': '#111111',
  'black': '#111111',
  'onix': '#1C1C1E',
  'ônix': '#1C1C1E',
  'preto onix': '#111111',
  'preto ônix': '#111111',
  'chumbo': '#3A3D40',
  'grafite': '#3E424B',
  'graphite': '#3E424B',
  'charcoal': '#36454F',
  'charcoal gray': '#36454F',
  'cinza': '#707070',
  'gray': '#707070',
  'grey': '#707070',
  'silver': '#C0C0C0',
  'prata': '#C0C0C0',

  // Brancos / Neutros
  'branco': '#FFFFFF',
  'white': '#FFFFFF',
  'off': '#FAF9F6',
  'off white': '#FAF9F6',
  'off-white': '#FAF9F6',
  'gelo': '#E8ECEF',

  // Beges / Nudes / Terrosos
  'bege': '#DECBB5',
  'beige': '#DECBB5',
  'bage': '#DECBB5',
  'geige': '#DECBB5',
  'nude': '#D9B99B',
  'areia': '#D2B48C',
  'sand': '#D2B48C',
  'caramelo': '#C18751',
  'caramel': '#C18751',
  'caramel brown': '#9A6335',
  'cappuccino': '#A47551',
  'marrom': '#5C3826',
  'marron': '#5C3826',
  'brown': '#5C3826',
  'brow': '#5C3826',
  'chocolate': '#4B2810',
  'chocolate brown': '#3D1F08',
  'mocha': '#4E3127',
  'mocha brown': '#4E3127',
  'cafe': '#3B2219',
  'café': '#3B2219',
  'coffee': '#3B2219',
  'terracota': '#C05C46',
  'terracotta': '#C05C46',
  'tijolo': '#B24C3D',

  // Vermelhos / Bordôs / Vinhos
  'bordo': '#722F37',
  'bordô': '#722F37',
  'burgundy': '#722F37',
  'vinho': '#5E1914',
  'wine': '#5E1914',
  'marsala': '#683332',
  'vermelho': '#C92A2A',
  'red': '#C92A2A',
  'cereja': '#DE3163',
  'cherry': '#DE3163',

  // Rosas / Lilases / Roxos
  'rosa': '#E8869B',
  'pink': '#E8869B',
  'rose': '#D4838F',
  'rosé': '#D4838F',
  'dusty pink': '#DCAE96',
  'fucsia': '#D81B60',
  'fuchsia': '#D81B60',
  'pink choque': '#E91E63',
  'hot pink': '#E91E63',
  'guava': '#E06D53',
  'goiaba': '#E06D53',
  'coral': '#FF6F61',
  'lilas': '#B799FF',
  'lilás': '#B799FF',
  'lilac': '#B799FF',
  'lavanda': '#C5A3FF',
  'lavender': '#C5A3FF',
  'mauve': '#A37081',
  'malva': '#A37081',
  'acai': '#4A154B',
  'açaí': '#4A154B',
  'roxo': '#5B2C6F',
  'purple': '#5B2C6F',
  'uva': '#4E1A3D',

  // Azuis
  'azul': '#2B5B84',
  'blue': '#2B5B84',
  'azul marinho': '#14213D',
  'navy': '#14213D',
  'blue navy': '#14213D',
  'azul claro': '#7BAFD4',
  'light blue': '#7BAFD4',
  'blue baby': '#89CFF0',
  'blue sky': '#87CEEB',
  'blue mist': '#8EA4B5',
  'azul turquesa': '#00A896',
  'turquesa': '#00A896',
  'turquoise': '#00A896',
  'blue turquesa': '#00A896',
  'azul petroleo': '#1E4E5F',
  'teal': '#008080',
  'deep teal': '#005F60',
  'royal': '#27408B',
  'blue royal': '#27408B',
  'indigo': '#3F51B5',

  // Verdes
  'verde': '#2E6F40',
  'green': '#2E6F40',
  'verde oliva': '#556B2F',
  'oliva': '#556B2F',
  'olive': '#556B2F',
  'green oliva': '#556B2F',
  'verde militar': '#4B5320',
  'military green': '#4B5320',
  'green militar': '#4B5320',
  'verde musgo': '#4A5D3E',
  'moss': '#4A5D3E',
  'green moss': '#4A5D3E',
  'verde menta': '#48B692',
  'menta': '#48B692',
  'mint': '#48B692',
  'green menta': '#48B692',
  'green aqua': '#3AB09E',
  'aqua': '#00FFFF',
  'emerald': '#097969',
  'esmeralda': '#097969',
  'leaf': '#4B7B4B',
  'green leaf': '#4B7B4B',
  'lima': '#32CD32',
  'limao': '#32CD32',
  'limão': '#32CD32',
  'lime': '#32CD32',

  // Amarelos / Laranjas / Ouro
  'amarelo': '#F4B41A',
  'yellow': '#F4B41A',
  'ouro': '#D4AF37',
  'gold': '#D4AF37',
  'dourado': '#D4AF37',
  'mostarda': '#E1AD01',
  'mustard': '#E1AD01',
  'laranja': '#E86100',
  'orange': '#E86100',
  'abobora': '#D35400',
  'abóbora': '#D35400',
  'burnt orange': '#CC5500',
  'bronze': '#CD7F32',
  'cobre': '#B87333',
  'copper': '#B87333',
};

function normalizeName(str: string): string {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function resolveSingleColorHex(name: string): string {
  const norm = normalizeName(name);
  if (BASE_COLOR_MAP[norm]) return BASE_COLOR_MAP[norm];

  // Busca por termos parciais conhecidos
  for (const [key, hex] of Object.entries(BASE_COLOR_MAP)) {
    if (norm === key || norm.startsWith(`${key} `) || norm.endsWith(` ${key}`) || norm.includes(key)) {
      return hex;
    }
  }

  return '#111111';
}

export interface ColorSwatchStyle {
  background: string;
  isBicolor: boolean;
  colors: string[];
  thumbnailUrl?: string;
}

/**
 * Retorna o estilo CSS visual completo para qualquer cor, seja unicolor ou bicolor.
 * Se houver imagem associada à variação, a miniatura pode ser exibida no swatch.
 */
export function getSwatchStyle(colorName: string, imageUrl?: string): ColorSwatchStyle {
  const raw = String(colorName || '').trim();
  const lower = raw.toLowerCase();

  // Detecta separadores comuns de combinações bicolores/tricolores
  const splitRegex = /\s*(?:\/|\+|\be\b|\band\b|&|\bcom\b)\s*/i;
  const parts = lower.split(splitRegex).map((s) => s.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const hex1 = resolveSingleColorHex(parts[0]);
    const hex2 = resolveSingleColorHex(parts[1]);

    if (parts.length >= 3) {
      const hex3 = resolveSingleColorHex(parts[2]);
      return {
        background: `linear-gradient(135deg, ${hex1} 33%, ${hex2} 33% 66%, ${hex3} 66%)`,
        isBicolor: true,
        colors: [hex1, hex2, hex3],
        thumbnailUrl: imageUrl,
      };
    }

    return {
      background: `linear-gradient(135deg, ${hex1} 50%, ${hex2} 50%)`,
      isBicolor: true,
      colors: [hex1, hex2],
      thumbnailUrl: imageUrl,
    };
  }

  // Cor única
  const singleHex = resolveSingleColorHex(raw);
  return {
    background: singleHex,
    isBicolor: false,
    colors: [singleHex],
    thumbnailUrl: imageUrl,
  };
}
