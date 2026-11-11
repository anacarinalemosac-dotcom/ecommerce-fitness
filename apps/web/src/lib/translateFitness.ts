/**
 * Motor Completo de Tradução Especializado em Moda Fitness (Inglês ⇄ Português)
 * Traduz automaticamente títulos de peças, categorias, cores, selos, banners e descrições completas
 * tanto no sentido Inglês -> Português quanto Português -> Inglês.
 */

export type StoreLang = 'en' | 'pt';

function applyRules(text: string, rules: Array<[RegExp, string]>): string {
  if (!text || typeof text !== 'string') return '';
  let result = text;
  for (const [regex, replacement] of rules) {
    result = result.replace(regex, replacement);
  }
  return result.replace(/[ \t]{2,}/g, ' ').trim();
}

function preserveTitleCase(original: string, translated: string): string {
  if (!original || !translated) return translated;
  const letters = original.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length > 0 && letters === letters.toUpperCase()) {
    return translated.toUpperCase();
  }
  return translated;
}

/* ============================================================================
   1. TRADUTOR DE TÍTULOS DE PEÇAS (PRODUCT TITLES)
   ============================================================================ */

const TITLE_EXACT_OVERRIDES_PT: Record<string, string> = {
  'SET CHARCOAL GRAY & BEIGE — CINZA-CHUMBO E BEGE.': 'CONJUNTO CINZA CHUMBO E BEGE',
  'BREAK POLYAMIDE FIT GABRIELLY': 'MACAQUINHO TOMARA QUE CAIA POLIAMIDA FIT GABRIELLY',
  'LIVING POLYAMIDE COMFY + TOP SARA LEGGINGS': 'LEGGING POLIAMIDA CONFORTÁVEL LIVING + TOP SARA',
  'SLIM LEGGINGS WITH POCKET POLYAMIDE SOFT + TANK TOP LUIZA': 'LEGGING SLIM COM BOLSO POLIAMIDA MACIA + REGATA LUIZA',
  'LEGGINGS WITH POLYAMIDE FIT POCKET + AGATA BLOUSE': 'LEGGING COM BOLSO POLIAMIDA FIT + BLUSA AGATA',
  'LEGGINGS WITH COMPRESSION POCKET + CLEAR TOP': 'LEGGING COMPRESSÃO COM BOLSO + TOP CLARA',
  'ULTRA LIGHT WINDBREAKER': 'JAQUETA CORTA-VENTO ULTRALEVE',
  'COMFY POLYAMIDE SKIRT SHORTS W/ POCKET + JOLIE TOP': 'SHORT SAIA POLIAMIDA CONFORTÁVEL COM BOLSO + TOP JOLIE',
  'TANK TOP': 'REGATA FEMININA',
  'FISHNET TOP': 'TOP TELINHA',
  'DEISE DRY MESH TOP': 'TOP TELA DRY DEISE',
  'NULA SLEEVE SUPLEX POWER PANTS SET': 'CONJUNTO CALÇA MANGA NULA SUPLEX POWER',
  'RED & BROWN SUPLEX ACTIVEWEAR SET': 'CONJUNTO FITNESS SUPLEX VERMELHO E MARROM',
  'SUPLEX POWER JUMPSUIT': 'MACACÃO SUPLEX POWER',
};

const TITLE_EXACT_OVERRIDES_EN: Record<string, string> = {
  'SET CHARCOAL GRAY & BEIGE — CINZA-CHUMBO E BEGE.': 'CHARCOAL GRAY & BEIGE SET',
  'BREAK POLYAMIDE FIT GABRIELLY': 'GABRIELLY STRAPLESS POLYAMIDE ROMPER',
  'LIVING POLYAMIDE COMFY + TOP SARA LEGGINGS': 'LIVING COMFY POLYAMIDE LEGGINGS + SARA TOP',
  'LEGGINGS WITH COMPRESSION POCKET + CLEAR TOP': 'COMPRESSION POCKET LEGGINGS + CLARA TOP',
  'LEGGING SUPLEX DE CINTURA ALTA': 'HIGH-WAISTED SUPLEX LEGGINGS',
  'LEGGING SCULPT EFEITO LEVANTA BUMBUM': 'SCULPT BOOTY-LIFT LEGGINGS',
  'TOP NADADOR ALTA SUSTENTAÇÃO': 'HIGH SUPPORT RACERBACK SPORTS BRA',
  'CONJUNTO ANA BICOLOR AZUL TURQUESA E BEGE': 'ANA TWO-TONE TURQUOISE BLUE & BEIGE SET',
  'CONJUNTO BICOLOR': 'TWO-TONE FITNESS SET',
  'CONJUNTO MANGA NULA': 'ONE-SHOULDER FITNESS SET',
  'REGATÃO DE TULE': 'TULLE LONG TANK TOP',
  'TULLE REGATÃO': 'TULLE LONG TANK TOP',
  'TOP DE TELA': 'MESH ATHLETIC TOP',
  'TOP TELINHA DRY': 'DRY MESH ATHLETIC TOP',
  'TOP TELINHA': 'MESH ATHLETIC TOP',
  'TOP POLIAMIDA MANGA LONGA BAILARINA': 'BAILARINA LONG SLEEVE POLYAMIDE TOP',
  'FRETE': 'SHIPPING FEE',
};

const TITLE_RULES_EN_TO_PT: Array<[RegExp, string]> = [
  // Limpeza de artefatos e duplicações
  [/\(CÓPIA\)/gi, '(Cópia)'],
  [/\(CÃ“PIA\)/gi, '(Cópia)'],
  [/\(COPY\)/gi, '(Cópia)'],

  // Padrões compostos de produto (mais longos primeiro)
  [/\bSKIRT SHORTS\b/gi, 'Short Saia'],
  [/\bTANK TOP\b/gi, 'Regata'],
  [/\bWINDBREAKER\b/gi, 'Corta-Vento'],
  [/\bULTRA LIGHT\b/gi, 'Ultraleve'],
  [/\bACTIVEWEAR SET\b/gi, 'Conjunto Fitness'],
  [/\bMATCHING SET\b/gi, 'Conjunto'],
  [/\bMATCHING SETS\b/gi, 'Conjuntos'],
  [/\bPANTS SET\b/gi, 'Conjunto Calça'],
  [/\bSET de PANTS\b/gi, 'Conjunto Calça'],
  [/\bSET PANTS\b/gi, 'Conjunto Calça'],
  [/\bSET SHORTS\b/gi, 'Conjunto Short'],
  [/\bSHORTS SET\b/gi, 'Conjunto Short'],
  [/\bFLARE COMPRESSION PANTS\b/gi, 'Calça Flare Compressão'],
  [/\bCOMPRESSION POCKET\b/gi, 'Compressão com Bolso'],
  [/\bWITH POLYAMIDE FIT POCKET\b/gi, 'Poliamida Fit com Bolso'],
  [/\bWITH POCKET POLYAMIDE SOFT\b/gi, 'com Bolso Poliamida Macia'],
  [/\bWITH POCKETS?\b/gi, 'com Bolso'],
  [/\bW\/\s*POCKETS?\b/gi, 'com Bolso'],
  [/\bPOLYAMIDE FIT\b/gi, 'Poliamida Fit'],
  [/\bPOLYAMIDE SOFT\b/gi, 'Poliamida Macia'],
  [/\bPOLYAMIDE VEST\b/gi, 'Colete Poliamida'],
  [/\bCOMFY POLYAMIDE\b/gi, 'Poliamida Confortável'],
  [/\bCOMFY\b/gi, 'Confortável'],
  [/\bPOLYAMIDE\b/gi, 'Poliamida'],
  [/\bLONG SLEEVE\b/gi, 'Manga Longa'],
  [/\bSHORT SLEEVE\b/gi, 'Manga Curta'],
  [/\bONE-?SHOULDER\b/gi, 'Manga Nula'],
  [/\bSLEEVE\b/gi, 'Manga'],
  [/\bSTRAPLESS\b/gi, 'Tomara que Caia'],
  [/\bOPEN-BACK\b/gi, 'Costas Abertas'],
  [/\bHIGH-WAISTED\b/gi, 'Cintura Alta'],
  [/\bHIGH WAIST\b/gi, 'Cintura Alta'],
  [/\bDRY MESH\b/gi, 'Tela Dry'],
  [/\bFISHNET\b/gi, 'Telinha'],
  [/\bMESH\b/gi, 'Tela'],
  [/\bTULLE\b/gi, 'Tule'],
  [/\bBASIC\b/gi, 'Básica'],
  [/\bCOMPRESSION\b/gi, 'Compressão'],
  [/\bACTIVEWEAR\b/gi, 'Fitness'],

  // Peças principais
  [/\bROMPER BEACH\b/gi, 'Macaquinho Praia'],
  [/\bBEACH\b/gi, 'Praia'],
  [/\bROMPERS?\b/gi, 'Macaquinho'],
  [/\bJUMPSUITS?\b/gi, 'Macacão'],
  [/\bLEGGINGS?\b/gi, 'Legging'],
  [/\bPANTS\b/gi, 'Calça'],
  [/\bSHORTS\b/gi, 'Short'],
  [/\bVEST\b/gi, 'Colete'],
  [/\bJACKET\b/gi, 'Jaqueta'],
  [/\bBLOUSE\b/gi, 'Blusa'],
  [/\bCLEAR TOP\b/gi, 'Top Clara'],
  [/\bSETS?\b/gi, 'Conjunto'],

  // Cores compostas (antes das cores simples!)
  [/\bCOFFEE WITH MILK\b/gi, 'Café com Leite'],
  [/\bRED CHERRY\b/gi, 'Vermelho Cereja'],
  [/\bCHERRY RED\b/gi, 'Vermelho Cereja'],
  [/\bPINKISH RED\b/gi, 'Vermelho Rosado'],
  [/\bEMERALD GREEN\b/gi, 'Verde Esmeralda'],
  [/\bDUSTY PINK\b/gi, 'Rosa Antigo'],
  [/\bMOSS GREEN\b/gi, 'Verde Musgo'],
  [/\bGREEN MOSS\b/gi, 'Verde Musgo'],
  [/\bSAGE GREEN\b/gi, 'Verde Sálvia'],
  [/\bDEEP TEAL BLUE\b/gi, 'Azul Petróleo Escuro'],
  [/\bDEEP TEAL\b/gi, 'Verde Petróleo Escuro'],
  [/\bTEAL GREEN\b/gi, 'Verde Petróleo'],
  [/\bMINT GREEN\b/gi, 'Verde Menta'],
  [/\bGREEN MENTA\b/gi, 'Verde Menta'],
  [/\bOLIVE GREEN\b/gi, 'Verde Oliva'],
  [/\bGREEN OLIVA\b/gi, 'Verde Oliva'],
  [/\bMILITARY GREEN\b/gi, 'Verde Militar'],
  [/\bGREEN MILITAR\b/gi, 'Verde Militar'],
  [/\bAQUA GREEN\b/gi, 'Verde Água'],
  [/\bGREEN AQUA\b/gi, 'Verde Água'],
  [/\bGREEN LEAF\b/gi, 'Verde Folha'],
  [/\bLIGHT GREEN\b/gi, 'Verde Claro'],
  [/\bCARAMEL BROWN\b/gi, 'Marrom Caramelo'],
  [/\bCHOCOLATE BROWN\b/gi, 'Marrom Chocolate'],
  [/\bTAUPE BROWN\b/gi, 'Marrom Taupe'],
  [/\bTERRACOTTA BROWN\b/gi, 'Marrom Terracota'],
  [/\bDARK BROWN\b/gi, 'Marrom Escuro'],
  [/\bMOCHA BROWN\b/gi, 'Marrom Mocha'],
  [/\bCHARCOAL GRAY\b/gi, 'Cinza Chumbo'],
  [/\bCHARCOAL\b/gi, 'Cinza Chumbo'],
  [/\bGRAPHITE GRAY\b/gi, 'Cinza Grafite'],
  [/\bGRAY PURPLE\b/gi, 'Cinza Arroxeado'],
  [/\bBABY PINK\b/gi, 'Rosa Bebê'],
  [/\bPINK BEBÊ\b/gi, 'Rosa Bebê'],
  [/\bBUBBLEGUM PINK\b/gi, 'Rosa Chiclete'],
  [/\bLIGHT PINK\b/gi, 'Rosa Claro'],
  [/\bAÇAÍ PINK\b/gi, 'Rosa Açaí'],
  [/\bPINK AÇAÍ\b/gi, 'Rosa Açaí'],
  [/\bPITAYA PINK\b/gi, 'Rosa Pitaya'],
  [/\bPINK DRAGON FRUIT\b/gi, 'Rosa Pitaya'],
  [/\bPINK GUAVA\b/gi, 'Rosa Goiaba'],
  [/\bPINK PINK\b/gi, 'Rosa Pink'],
  [/\bLILAC MAUVE\b/gi, 'Lilás Malva'],
  [/\bMAUVE LILAC\b/gi, 'Lilás Malva'],
  [/\bPLUM PURPLE\b/gi, 'Roxo Ameixa'],
  [/\bNAVY BLUE\b/gi, 'Azul Marinho'],
  [/\bBLUE NAVY\b/gi, 'Azul Marinho'],
  [/\bROYAL BLUE\b/gi, 'Azul Royal'],
  [/\bBLUE ROYAL\b/gi, 'Azul Royal'],
  [/\bLIGHT BLUE\b/gi, 'Azul Claro'],
  [/\bBLUE LIGHT\b/gi, 'Azul Claro'],
  [/\bBABY BLUE\b/gi, 'Azul Bebê'],
  [/\bBLUE BABY\b/gi, 'Azul Bebê'],
  [/\bSKY BLUE\b/gi, 'Azul Céu'],
  [/\bBLUE SKY\b/gi, 'Azul Céu'],
  [/\bTURQUOISE BLUE\b/gi, 'Azul Turquesa'],
  [/\bBLUE TURQUESA\b/gi, 'Azul Turquesa'],
  [/\bBLUE MIST\b/gi, 'Azul Neblina'],
  [/\bLIGHT YELLOW\b/gi, 'Amarelo Claro'],
  [/\bYELLOW LIGHT\b/gi, 'Amarelo Claro'],
  [/\bYELLOW LIGH\b/gi, 'Amarelo Claro'],
  [/\bBUTTER YELLOW\b/gi, 'Amarelo Manteiga'],
  [/\bYELLOW BUTTER\b/gi, 'Amarelo Manteiga'],
  [/\bBURNT ORANGE\b/gi, 'Laranja Queimado'],
  [/\bPURE WHITE\b/gi, 'Branco Puro'],
  [/\bOFF WHITE\b/gi, 'Off-White'],
  [/\bONYX BLACK\b/gi, 'Preto Ônix'],
  [/\bSTAR FRUIT\b/gi, 'Carambola'],

  // Cores simples
  [/\bBURGUNDY\b/gi, 'Bordô'],
  [/\bBORDO\b/gi, 'Bordô'],
  [/\bWINE\b/gi, 'Vinho'],
  [/\bBEIGE\b/gi, 'Bege'],
  [/\bBAGE\b/gi, 'Bege'],
  [/\bRED\b/gi, 'Vermelho'],
  [/\bGREEN\b/gi, 'Verde'],
  [/\bBLUE\b/gi, 'Azul'],
  [/\bPINK\b/gi, 'Rosa'],
  [/\bLILAC\b/gi, 'Lilás'],
  [/\bLAVENDER\b/gi, 'Lavanda'],
  [/\bPURPLE\b/gi, 'Roxo'],
  [/\bYELLOW\b/gi, 'Amarelo'],
  [/\bORANGE\b/gi, 'Laranja'],
  [/\bGRAY\b/gi, 'Cinza'],
  [/\bGREY\b/gi, 'Cinza'],
  [/\bGRAPHITE\b/gi, 'Grafite'],
  [/\bBROWN\b/gi, 'Marrom'],
  [/\bCARAMEL\b/gi, 'Caramelo'],
  [/\bTERRACOTTA\b/gi, 'Terracota'],
  [/\bBLACK\b/gi, 'Preto'],
  [/\bWHITE\b/gi, 'Branco'],
  [/\bCOFFEE\b/gi, 'Café'],
  [/\bSAND\b/gi, 'Areia'],
  [/\bGUAVA\b/gi, 'Goiaba'],
  [/\bSALMON\b/gi, 'Salmão'],
  [/\bVANILLA\b/gi, 'Baunilha'],
  [/\bTILE\b/gi, 'Telha'],
  [/\bROSE GOLD\b/gi, 'Rose Gold'],
  [/\bROSE\b/gi, 'Rosé'],

  // Conectores
  [/\s+AND\s+/gi, ' E '],
  [/\s+&\s+/gi, ' E '],
];

const TITLE_RULES_PT_TO_EN: Array<[RegExp, string]> = [
  [/\(CÓPIA\)/gi, '(Copy)'],
  [/\(CÃ“PIA\)/gi, '(Copy)'],
  [/\bEFEITO LEVANTA BUMBUM\b/gi, 'Booty-Lift'],
  [/\bALTA SUSTENTAÇÃO\b/gi, 'High Support'],
  [/\bCINTURA ALTA\b/gi, 'High-Waisted'],
  [/\bMANGA LONGA\b/gi, 'Long Sleeve'],
  [/\bMANGA NULA\b/gi, 'One-Shoulder'],
  [/\bTOMARA QUE CAIA\b/gi, 'Strapless'],
  [/\bCORTA-VENTO\b/gi, 'Windbreaker'],
  [/\bULTRALEVE\b/gi, 'Ultra Light'],
  [/\bCONJUNTO FITNESS\b/gi, 'Activewear Set'],
  [/\bCONJUNTO CALÇA\b/gi, 'Pants Set'],
  [/\bSET de PANTS\b/gi, 'Pants Set'],
  [/\bSET PANTS\b/gi, 'Pants Set'],
  [/\bCONJUNTO SHORT\b/gi, 'Shorts Set'],
  [/\bSET SHORTS\b/gi, 'Shorts Set'],
  [/\bCONJUNTO DUPLO\b/gi, 'Double Set'],
  [/\bSET DUPLO\b/gi, 'Double Set'],
  [/\bSHORT SAIA\b/gi, 'Skirt Shorts'],
  [/\bCONJUNTOS?\b/gi, 'Set'],
  [/\bMACAQUINHOS?\b/gi, 'Romper'],
  [/\bMACACÃO\b/gi, 'Jumpsuit'],
  [/\bMACACAO\b/gi, 'Jumpsuit'],
  [/\bCOLETE\b/gi, 'Vest'],
  [/\bJAQUETA\b/gi, 'Jacket'],
  [/\bREGATÃO\b/gi, 'Long Tank Top'],
  [/\bREGATA\b/gi, 'Tank Top'],
  [/\bBLUSA\b/gi, 'Blouse'],
  [/\bCALÇA\b/gi, 'Pants'],
  [/\bLEGGINGS?\b/gi, 'Leggings'],
  [/\bCANELADO\b/gi, 'Ribbed'],
  [/\bONDINHA\b/gi, 'Wave'],
  [/\bCOMPRESSÃO\b/gi, 'Compression'],
  [/\bPOLIAMIDA CONFORTÁVEL\b/gi, 'Comfy Polyamide'],
  [/\bCONFORTÁVEL\b/gi, 'Comfy'],
  [/\bPOLIAMIDA MACIA\b/gi, 'Soft Polyamide'],
  [/\bPOLIAMIDA\b/gi, 'Polyamide'],
  [/\bBÁSICA\b/gi, 'Basic'],
  [/\bBASICA\b/gi, 'Basic'],
  [/\bTELINHA DRY\b/gi, 'Dry Mesh'],
  [/\bTOP DE TELA\b/gi, 'Mesh Top'],
  [/\bTOP TELINHA\b/gi, 'Mesh Top'],
  [/\bDE TULE\b/gi, 'Tulle'],
  [/\bTULE\b/gi, 'Tulle'],
  [/\bBICOLOR\b/gi, 'Two-Tone'],
  [/\bNADADOR\b/gi, 'Racerback'],
  [/\bCOM BOLSOS?\b/gi, 'with Pocket'],
  [/\bPROMOCAO\b/gi, 'Promo'],
  [/\bPROMOÇÃO\b/gi, 'Promo'],
  [/\bPRAIA\b/gi, 'Beach'],
  [/\bCLARA\b/gi, 'Clara'],

  // Cores PT -> EN
  [/\bCAFÉ COM LEITE\b/gi, 'Coffee with Milk'],
  [/\bVERMELHO CEREJA\b/gi, 'Cherry Red'],
  [/\bVERMELHO ROSADO\b/gi, 'Pinkish Red'],
  [/\bVERDE ESMERALDA\b/gi, 'Emerald Green'],
  [/\bROSA ANTIGO\b/gi, 'Dusty Pink'],
  [/\bVERDE MUSGO\b/gi, 'Moss Green'],
  [/\bVERDE SÁLVIA\b/gi, 'Sage Green'],
  [/\bVERDE PETRÓLEO\b/gi, 'Teal Green'],
  [/\bVERDE MENTA\b/gi, 'Mint Green'],
  [/\bVERDE OLIVA\b/gi, 'Olive Green'],
  [/\bVERDE MILITAR\b/gi, 'Military Green'],
  [/\bGREEN MILITAR\b/gi, 'Military Green'],
  [/\bGREEN MENTA\b/gi, 'Mint Green'],
  [/\bGREEN OLIVA\b/gi, 'Olive Green'],
  [/\bVERDE ÁGUA\b/gi, 'Aqua Green'],
  [/\bVERDE FOLHA\b/gi, 'Leaf Green'],
  [/\bVERDE CLARO\b/gi, 'Light Green'],
  [/\bMARROM CARAMELO\b/gi, 'Caramel Brown'],
  [/\bMARROM CHOCOLATE\b/gi, 'Chocolate Brown'],
  [/\bMARROM TAUPE\b/gi, 'Taupe Brown'],
  [/\bMARROM TERRACOTA\b/gi, 'Terracotta Brown'],
  [/\bCINZA CHUMBO\b/gi, 'Charcoal Gray'],
  [/\bCINZA GRAFITE\b/gi, 'Graphite Gray'],
  [/\bROSA BEBÊ\b/gi, 'Baby Pink'],
  [/\bPINK BEBÊ\b/gi, 'Baby Pink'],
  [/\bROSA CHICLETE\b/gi, 'Bubblegum Pink'],
  [/\bROSA CLARO\b/gi, 'Light Pink'],
  [/\bROSA AÇAÍ\b/gi, 'Açaí Pink'],
  [/\bPINK AÇAÍ\b/gi, 'Açaí Pink'],
  [/\bROSA PITAYA\b/gi, 'Pitaya Pink'],
  [/\bROSA GOIABA\b/gi, 'Guava Pink'],
  [/\bPINK GUAVA\b/gi, 'Guava Pink'],
  [/\bLILÁS MALVA\b/gi, 'Lilac Mauve'],
  [/\bROXO AMEIXA\b/gi, 'Plum Purple'],
  [/\bAZUL MARINHO\b/gi, 'Navy Blue'],
  [/\bAZUL ROYAL\b/gi, 'Royal Blue'],
  [/\bAZUL TURQUESA\b/gi, 'Turquoise Blue'],
  [/\bBLUE TURQUESA\b/gi, 'Turquoise Blue'],
  [/\bAZUL CLARO\b/gi, 'Light Blue'],
  [/\bAZUL BEBÊ\b/gi, 'Baby Blue'],
  [/\bAZUL CÉU\b/gi, 'Sky Blue'],
  [/\bAMARELO MANTEIGA\b/gi, 'Butter Yellow'],
  [/\bAMARELO CLARO\b/gi, 'Light Yellow'],
  [/\bPRETO ÔNIX\b/gi, 'Onyx Black'],
  [/\bVINHO MARSALA\b/gi, 'Marsala Wine'],
  [/\bBATIDAS VERDES\b/gi, 'Green Swirl Print'],
  [/\bBORDÔ\b/gi, 'Burgundy'],
  [/\bBORDO\b/gi, 'Burgundy'],
  [/\bVINHO\b/gi, 'Wine'],
  [/\bBEGE\b/gi, 'Beige'],
  [/\bTERRACOTA\b/gi, 'Terracotta'],
  [/\bAREIA\b/gi, 'Sand'],
  [/\bTELHA\b/gi, 'Tile Red'],
  [/\bCHUMBO\b/gi, 'Charcoal'],
  [/\bGOIABA\b/gi, 'Guava'],
  [/\bFÚCSIA\b/gi, 'Fuchsia'],
  [/\bFUCSIA\b/gi, 'Fuchsia'],
  [/\bLAVANDA\b/gi, 'Lavender'],
  [/\bLILÁS\b/gi, 'Lilac'],
  [/\bSALMÃO\b/gi, 'Salmon'],
  [/\bVERMELHO\b/gi, 'Red'],
  [/\bVERDE\b/gi, 'Green'],
  [/\bAZUL\b/gi, 'Blue'],
  [/\bAMARELO\b/gi, 'Yellow'],
  [/\bLARANJA\b/gi, 'Orange'],
  [/\bROXO\b/gi, 'Purple'],
  [/\bROSA\b/gi, 'Pink'],
  [/\bMARROM\b/gi, 'Brown'],
  [/\bCINZA\b/gi, 'Gray'],
  [/\bPRETO\b/gi, 'Black'],
  [/\bBRANCO\b/gi, 'White'],
  [/\s+COM\s+/gi, ' & '],
  [/\s+E\s+/gi, ' & '],
];

export function translateProductTitle(title: string, lang: StoreLang): string {
  if (!title || typeof title !== 'string') return '';
  const clean = title.trim();
  const upperKey = clean.toUpperCase();

  if (lang === 'pt') {
    if (TITLE_EXACT_OVERRIDES_PT[upperKey]) {
      return preserveTitleCase(clean, TITLE_EXACT_OVERRIDES_PT[upperKey]);
    }
    // Se começa com "SET " e não tem "CONJUNTO"
    let translated = applyRules(clean, TITLE_RULES_EN_TO_PT);
    // Ajusta ordem natural em PT se começar com "Básica" / "Compressão" / etc.? Mantemos fiel e super legível
    return preserveTitleCase(clean, translated);
  } else {
    if (TITLE_EXACT_OVERRIDES_EN[upperKey]) {
      return preserveTitleCase(clean, TITLE_EXACT_OVERRIDES_EN[upperKey]);
    }
    const translated = applyRules(clean, TITLE_RULES_PT_TO_EN);
    return preserveTitleCase(clean, translated);
  }
}

/* ============================================================================
   2. TRADUTOR DE CORES (COLOR NAMES)
   ============================================================================ */

export function translateColorName(color: string, lang: StoreLang): string {
  if (!color || typeof color !== 'string') return '';
  let clean = color.trim();

  // Remove texto duplicado bilingue ex: "Charcoal Gray & Beige — cinza-chumbo e bege."
  if (clean.includes('—')) {
    const parts = clean.split('—').map((s) => s.trim());
    if (parts.length >= 2) {
      clean = lang === 'en' ? parts[0] : parts[1].replace(/\.$/, '');
    }
  }

  // Se o lojista colocou o nome do modelo no campo cor (ex: "SET MANGA NULA BURGUNDY AND LILAC")
  clean = clean.replace(/^SET MANGA NULA\s+/i, '');

  if (lang === 'pt') {
    const rules: Array<[RegExp, string]> = [
      [/\bCOFFEE WITH MILK\b/gi, 'Café com Leite'],
      [/\bRED CHERRY\b/gi, 'Vermelho Cereja'],
      [/\bCHERRY RED\b/gi, 'Vermelho Cereja'],
      [/\bPINKISH RED\b/gi, 'Vermelho Rosado'],
      [/\bEMERALD GREEN\b/gi, 'Verde Esmeralda'],
      [/\bDUSTY PINK\b/gi, 'Rosa Antigo'],
      [/\bMOSS GREEN\b/gi, 'Verde Musgo'],
      [/\bGREEN MOSS\b/gi, 'Verde Musgo'],
      [/\bSAGE GREEN\b/gi, 'Verde Sálvia'],
      [/\bDEEP TEAL BLUE\b/gi, 'Azul Petróleo Escuro'],
      [/\bDEEP TEAL\b/gi, 'Verde Petróleo'],
      [/\bTEAL GREEN\b/gi, 'Verde Petróleo'],
      [/\bMINT GREEN\b/gi, 'Verde Menta'],
      [/\bGREEN MENTA\b/gi, 'Verde Menta'],
      [/\bOLIVE GREEN\b/gi, 'Verde Oliva'],
      [/\bGREEN OLIVA\b/gi, 'Verde Oliva'],
      [/\bMILITARY GREEN\b/gi, 'Verde Militar'],
      [/\bGREEN MILITAR\b/gi, 'Verde Militar'],
      [/\bAQUA GREEN\b/gi, 'Verde Água'],
      [/\bGREEN AQUA\b/gi, 'Verde Água'],
      [/\bGREEN LEAF\b/gi, 'Verde Folha'],
      [/\bLIGHT GREEN\b/gi, 'Verde Claro'],
      [/\bCARAMEL BROWN\b/gi, 'Marrom Caramelo'],
      [/\bCHOCOLATE BROWN\b/gi, 'Marrom Chocolate'],
      [/\bTAUPE BROWN\b/gi, 'Marrom Taupe'],
      [/\bTERRACOTTA BROWN\b/gi, 'Marrom Terracota'],
      [/\bDARK BROWN\b/gi, 'Marrom Escuro'],
      [/\bMOCHA BROWN\b/gi, 'Marrom Mocha'],
      [/\bCHARCOAL GRAY\b/gi, 'Cinza Chumbo'],
      [/\bGRAPHITE GRAY\b/gi, 'Cinza Grafite'],
      [/\bGRAY PURPLE\b/gi, 'Cinza Arroxeado'],
      [/\bBABY PINK\b/gi, 'Rosa Bebê'],
      [/\bPINK BEBÊ\b/gi, 'Rosa Bebê'],
      [/\bBUBBLEGUM PINK\b/gi, 'Rosa Chiclete'],
      [/\bLIGHT PINK\b/gi, 'Rosa Claro'],
      [/\bAÇAÍ PINK\b/gi, 'Rosa Açaí'],
      [/\bPINK AÇAÍ\b/gi, 'Rosa Açaí'],
      [/\bPITAYA PINK\b/gi, 'Rosa Pitaya'],
      [/\bPINK DRAGON FRUIT\b/gi, 'Rosa Pitaya'],
      [/\bPINK GUAVA\b/gi, 'Rosa Goiaba'],
      [/\bPINK PINK\b/gi, 'Rosa Pink'],
      [/\bLILAC MAUVE\b/gi, 'Lilás Malva'],
      [/\bMAUVE LILAC\b/gi, 'Lilás Malva'],
      [/\bPLUM PURPLE\b/gi, 'Roxo Ameixa'],
      [/\bNAVY BLUE\b/gi, 'Azul Marinho'],
      [/\bBLUE NAVY\b/gi, 'Azul Marinho'],
      [/\bROYAL BLUE\b/gi, 'Azul Royal'],
      [/\bBLUE ROYAL\b/gi, 'Azul Royal'],
      [/\bLIGHT BLUE\b/gi, 'Azul Claro'],
      [/\bBLUE LIGHT\b/gi, 'Azul Claro'],
      [/\bBABY BLUE\b/gi, 'Azul Bebê'],
      [/\bBLUE BABY\b/gi, 'Azul Bebê'],
      [/\bSKY BLUE\b/gi, 'Azul Céu'],
      [/\bBLUE SKY\b/gi, 'Azul Céu'],
      [/\bTURQUOISE BLUE\b/gi, 'Azul Turquesa'],
      [/\bBLUE TURQUESA\b/gi, 'Azul Turquesa'],
      [/\bBLUE MIST\b/gi, 'Azul Neblina'],
      [/\bLIGHT YELLOW\b/gi, 'Amarelo Claro'],
      [/\bBUTTER YELLOW\b/gi, 'Amarelo Manteiga'],
      [/\bYELLOW BUTTER\b/gi, 'Amarelo Manteiga'],
      [/\bBURNT ORANGE\b/gi, 'Laranja Queimado'],
      [/\bPURE WHITE\b/gi, 'Branco Puro'],
      [/\bOFF WHITE\b/gi, 'Off-White'],
      [/\bONYX BLACK\b/gi, 'Preto Ônix'],
      [/\bSTAR FRUIT\b/gi, 'Carambola'],
      [/\bBURGUNDY\b/gi, 'Bordô'],
      [/\bBORDO\b/gi, 'Bordô'],
      [/\bWINE\b/gi, 'Vinho'],
      [/\bBEIGE\b/gi, 'Bege'],
      [/\bBAGE\b/gi, 'Bege'],
      [/\bRED\b/gi, 'Vermelho'],
      [/\bGREEN\b/gi, 'Verde'],
      [/\bBLUE\b/gi, 'Azul'],
      [/\bPINK\b/gi, 'Rosa'],
      [/\bLILAC\b/gi, 'Lilás'],
      [/\bLAVENDER\b/gi, 'Lavanda'],
      [/\bPURPLE\b/gi, 'Roxo'],
      [/\bYELLOW\b/gi, 'Amarelo'],
      [/\bORANGE\b/gi, 'Laranja'],
      [/\bGRAY\b/gi, 'Cinza'],
      [/\bGRAPHITE\b/gi, 'Grafite'],
      [/\bBROWN\b/gi, 'Marrom'],
      [/\bCARAMEL\b/gi, 'Caramelo'],
      [/\bTERRACOTTA\b/gi, 'Terracota'],
      [/\bBLACK\b/gi, 'Preto'],
      [/\bWHITE\b/gi, 'Branco'],
      [/\bCOFFEE\b/gi, 'Café'],
      [/\bSAND\b/gi, 'Areia'],
      [/\bGUAVA\b/gi, 'Goiaba'],
      [/\bSALMON\b/gi, 'Salmão'],
      [/\bVANILLA\b/gi, 'Baunilha'],
      [/\bTILE\b/gi, 'Telha'],
      [/\bROSE GOLD\b/gi, 'Rose Gold'],
      [/\bROSE\b/gi, 'Rosé'],
      [/\s+AND\s+/gi, ' e '],
      [/\s*&\s*/g, ' e '],
    ];
    return applyRules(clean, rules);
  } else {
    const rules: Array<[RegExp, string]> = [
      [/\bCAFÉ COM LEITE\b/gi, 'Coffee with Milk'],
      [/\bVERMELHO CEREJA\b/gi, 'Cherry Red'],
      [/\bVERMELHO ROSADO\b/gi, 'Pinkish Red'],
      [/\bVERDE ESMERALDA\b/gi, 'Emerald Green'],
      [/\bROSA ANTIGO\b/gi, 'Dusty Pink'],
      [/\bVERDE MUSGO\b/gi, 'Moss Green'],
      [/\bVERDE SÁLVIA\b/gi, 'Sage Green'],
      [/\bVERDE PETRÓLEO\b/gi, 'Teal Green'],
      [/\bVERDE MENTA\b/gi, 'Mint Green'],
      [/\bGREEN MENTA\b/gi, 'Mint Green'],
      [/\bVERDE OLIVA\b/gi, 'Olive Green'],
      [/\bGREEN OLIVA\b/gi, 'Olive Green'],
      [/\bVERDE MILITAR\b/gi, 'Military Green'],
      [/\bGREEN MILITAR\b/gi, 'Military Green'],
      [/\bGREEN AQUA\b/gi, 'Aqua Green'],
      [/\bGREEN LEAF\b/gi, 'Leaf Green'],
      [/\bGREEN MOSS\b/gi, 'Moss Green'],
      [/\bMARROM CARAMELO\b/gi, 'Caramel Brown'],
      [/\bMARROM CHOCOLATE\b/gi, 'Chocolate Brown'],
      [/\bMARROM TAUPE\b/gi, 'Taupe Brown'],
      [/\bCINZA CHUMBO\b/gi, 'Charcoal Gray'],
      [/\bCINZA GRAFITE\b/gi, 'Graphite Gray'],
      [/\bROSA BEBÊ\b/gi, 'Baby Pink'],
      [/\bPINK BEBÊ\b/gi, 'Baby Pink'],
      [/\bROSA CHICLETE\b/gi, 'Bubblegum Pink'],
      [/\bROSA AÇAÍ\b/gi, 'Açaí Pink'],
      [/\bPINK AÇAÍ\b/gi, 'Açaí Pink'],
      [/\bROSA PITAYA\b/gi, 'Pitaya Pink'],
      [/\bROSA GOIABA\b/gi, 'Guava Pink'],
      [/\bAZUL MARINHO\b/gi, 'Navy Blue'],
      [/\bBLUE NAVY\b/gi, 'Navy Blue'],
      [/\bAZUL ROYAL\b/gi, 'Royal Blue'],
      [/\bBLUE ROYAL\b/gi, 'Royal Blue'],
      [/\bAZUL TURQUESA\b/gi, 'Turquoise Blue'],
      [/\bBLUE TURQUESA\b/gi, 'Turquoise Blue'],
      [/\bBLUE BABY\b/gi, 'Baby Blue'],
      [/\bBLUE SKY\b/gi, 'Sky Blue'],
      [/\bYELLOW BUTTER\b/gi, 'Butter Yellow'],
      [/\bPRETO ÔNIX\b/gi, 'Onyx Black'],
      [/\bVINHO MARSALA\b/gi, 'Marsala Wine'],
      [/\bBATIDAS VERDES\b/gi, 'Green Swirl Print'],
      [/\bBORDÔ\b/gi, 'Burgundy'],
      [/\bBORDO\b/gi, 'Burgundy'],
      [/\bVINHO\b/gi, 'Wine'],
      [/\bBEGE\b/gi, 'Beige'],
      [/\bTERRACOTA\b/gi, 'Terracotta'],
      [/\bAREIA\b/gi, 'Sand'],
      [/\bTELHA\b/gi, 'Tile Red'],
      [/\bCHUMBO\b/gi, 'Charcoal'],
      [/\bGOIABA\b/gi, 'Guava'],
      [/\bFUCSIA\b/gi, 'Fuchsia'],
      [/\bFÚCSIA\b/gi, 'Fuchsia'],
      [/\bLAVANDA\b/gi, 'Lavender'],
      [/\bLILÁS\b/gi, 'Lilac'],
      [/\bSALMÃO\b/gi, 'Salmon'],
      [/\bVERMELHO\b/gi, 'Red'],
      [/\bVERDE\b/gi, 'Green'],
      [/\bAZUL\b/gi, 'Blue'],
      [/\bAMARELO\b/gi, 'Yellow'],
      [/\bLARANJA\b/gi, 'Orange'],
      [/\bROXO\b/gi, 'Purple'],
      [/\bROSA\b/gi, 'Pink'],
      [/\bMARROM\b/gi, 'Brown'],
      [/\bCINZA\b/gi, 'Gray'],
      [/\bPRETO\b/gi, 'Black'],
      [/\bBRANCO\b/gi, 'White'],
      [/\s+COM\s+/gi, ' & '],
      [/\s+E\s+/gi, ' & '],
    ];
    return applyRules(clean, rules);
  }
}

/* ============================================================================
   3. TRADUTOR DE CATEGORIAS & SELOS (CATEGORIES & RIBBONS)
   ============================================================================ */

export function translateCategoryName(cat: string, lang: StoreLang): string {
  if (!cat || typeof cat !== 'string') return '';
  const upper = cat.trim().toUpperCase();

  if (lang === 'pt') {
    if (upper.includes('ROMPER') || upper.includes('MACAQUINHO')) return 'MACAQUINHOS';
    if (upper.includes('JUMPSUIT') || upper.includes('MACAC')) return 'MACACÕES';
    if (upper.includes('SET') || upper.includes('CONJUNTO')) return 'CONJUNTOS';
    if (upper.includes('JACKET') || upper.includes('CASACO') || upper.includes('JAQUETA')) return 'CASACOS & JAQUETAS';
    if (upper.includes('TOP') || upper.includes('SHIRT') || upper.includes('BLUSA')) return 'TOPS & BLUSAS';
    if (upper.includes('LEGGING')) return 'CALÇAS LEGGING';
    if (upper.includes('ACTIVEWEAR')) return 'MODA FITNESS';
    if (upper.includes('PRE-ORDER') || upper.includes('PRÉ-VENDA')) return 'PRÉ-VENDA';
    if (upper.includes('SPOILER')) return 'SPOILERS';
    return cat;
  } else {
    if (upper.includes('ROMPER') || upper.includes('MACAQUINHO')) return 'ROMPERS';
    if (upper.includes('JUMPSUIT') || upper.includes('MACAC')) return 'JUMPSUITS';
    if (upper.includes('SET') || upper.includes('CONJUNTO')) return 'MATCHING SETS';
    if (upper.includes('JACKET') || upper.includes('CASACO') || upper.includes('JAQUETA')) return 'COATS & JACKETS';
    if (upper.includes('TOP') || upper.includes('SHIRT') || upper.includes('BLUSA')) return 'TOPS & SHIRTS';
    if (upper.includes('LEGGING')) return 'LEGGINGS';
    if (upper.includes('MODA FITNESS') || upper.includes('ACTIVEWEAR')) return 'ACTIVEWEAR';
    if (upper.includes('PRÉ-VENDA') || upper.includes('PRE-ORDER')) return 'PRE-ORDER';
    if (upper.includes('SPOILER')) return 'SPOILERS';
    return cat;
  }
}

export function translateBadgeText(badge: string, lang: StoreLang): string {
  if (!badge || typeof badge !== 'string') return '';
  const b = badge.trim();
  if (lang === 'pt') {
    return b
      .replace(/NEW ARRIVAL/gi, 'LANÇAMENTO')
      .replace(/PRE-ORDER/gi, 'PRÉ-VENDA')
      .replace(/HIGH PERFORMANCE/gi, 'ALTA PERFORMANCE')
      .replace(/MAXIMUM SUPPORT/gi, 'ALTA SUSTENTAÇÃO')
      .replace(/HIGH SUPPORT/gi, 'ALTA SUSTENTAÇÃO')
      .replace(/COMBO 3 PIECES/gi, 'COMBO 3 PEÇAS')
      .replace(/SOLD OUT/gi, 'ESGOTADO');
  } else {
    return b
      .replace(/LANÇAMENTO/gi, 'NEW ARRIVAL')
      .replace(/LANCAMENTO/gi, 'NEW ARRIVAL')
      .replace(/PRÉ-VENDA/gi, 'PRE-ORDER')
      .replace(/PRE-VENDA/gi, 'PRE-ORDER')
      .replace(/ALTA PERFORMANCE/gi, 'HIGH PERFORMANCE')
      .replace(/ALTA SUSTENTAÇÃO/gi, 'HIGH SUPPORT')
      .replace(/COMBO 3 PEÇAS/gi, '3-PIECE COMBO')
      .replace(/ESGOTADO/gi, 'SOLD OUT');
  }
}

/* ============================================================================
   4. TRADUTOR COMPLETO DE DESCRIÇÕES E CONTEÚDO LIVRE (DESCRIPTIONS & BANNERS)
   ============================================================================ */

const EN_TO_PT_PHRASES: Array<[RegExp, string]> = [
  // Frases longas específicas dos produtos da Ana Fitness Wear
  [/The Beach Samanta (?:romper|Macaquinho) is the perfect choice for those who love to combine elegance, lightness and comfort in a single look\./gi,
   'O Macaquinho Praia Samanta é a escolha perfeita para quem ama unir elegância, leveza e conforto em um único look.'],
  [/Made of high quality polyamide, with zero transparency, it offers impeccable fit and total freedom of movement\s*[-–—]\s*ideal for enjoying sunny days with style and tranquility\./gi,
   'Confeccionado em poliamida de alta qualidade, com zero transparência, oferece caimento impecável e total liberdade de movimento — ideal para aproveitar os dias de sol com estilo e tranquilidade.'],
  [/The highlight is due to the beautiful neckline on the back, which adds a delicate and sophisticated touch to the look\./gi,
   'O destaque fica por conta do lindo decote nas costas, que traz um toque delicado e sofisticado ao visual.'],
  [/In addition, ensuring even more comfort and safety during use\./gi,
   'Além disso, garante ainda mais conforto e segurança durante o uso.'],
  [/Its fabric has an extremely soft touch, without compression and with that comfort that embraces, perfect to wear all day\./gi,
   'Seu tecido possui toque extremamente macio, sem apertar e com aquele conforto que abraça o corpo, perfeito para usar o dia todo.'],
  [/Whether at the beach, after the beach or even in casual moments, the Beach Dress is a versatile piece that suits you\s*[-–—]\s*light, sophisticated and always ready for any occasion\./gi,
   'Seja na praia, no pós-praia ou até em momentos casuais, é uma peça versátil que combina com você — leve, sofisticada e sempre pronta para qualquer ocasião.'],
  [/Feel free, beautiful and comfortable wherever you are!/gi,
   'Sinta-se livre, linda e confortável onde quer que você esteja!'],
  [/All our tops have entrances for bulge\. \(Bojos are not included\)/gi,
   'Todos os nossos modelos possuem abertura interna para bojo (bojos não inclusos).'],
  [/The Fit Fiorela Polyamide Jumpsuit is that piece for you to rock in training!\s*This piece is made of zero transparency and high quality polyamide, it fits perfectly on your body to ensure safety and comfort during your workouts\./gi,
   'O Macacão Poliamida Fit Fiorela é aquela peça para você arrasar nos treinos! Confeccionado em poliamida de alta qualidade com zero transparência, se ajusta perfeitamente ao corpo garantindo segurança e conforto durante todo o treino.'],
  [/Fabrics in neon and strong colors have low solidity and, therefore, have a greater tendency to release paint on contact with water or sweat\. That's why the product may release paint if NEUTRAL SOAP \(coconut\) and in abundant water is not used; Wash separately from other pieces; Do not soak;/gi,
   'Tecidos em cores neon ou vibrantes possuem menor solidez e podem soltar excesso de pigmento em contato com água ou suor. Por isso, lave com SABÃO NEUTRO (de coco) em água abundante; lave separadamente de outras peças e não deixe de molho;'],
  [/Wash your fitness set before using it, the excess paint comes out on the first wash, because some fabrics receive a high dye content\./gi,
   'Lave seu conjunto antes do primeiro uso; o excesso de pigmento sai na primeira lavagem por conta da alta concentração de corante.'],
  [/The color of the piece may change due to the lighting of the photo and the screen of your device\./gi,
   'A tonalidade da peça pode variar levemente de acordo com a iluminação da foto e a tela do seu aparelho.'],
  [/Product colors may vary slightly due to lighting and screen settings\. For best results, wear seamless, skin-tone undergarments\./gi,
   'As cores do produto podem variar levemente conforme a iluminação e a tela. Para melhor resultado, use lingerie sem costura próxima ao tom da pele.'],
  [/Colors may vary slightly due to lighting and screen settings\. Always follow the care label on the garment\./gi,
   'As cores podem variar levemente de acordo com a iluminação e a tela. Siga sempre a etiqueta de cuidados da peça.'],
  [/We are not responsible for problems caused during washing\./gi,
   'Não nos responsabilizamos por danos decorrentes de lavagem inadequada.'],
  [/Attention to the use of the color of the intimate piece\. Wear neutral color lingerie, closer to your skin tone and preferably, laser cut \(seamless\)\./gi,
   'Atenção à escolha da peça íntima: utilize lingerie neutra, próxima ao tom da sua pele e preferencialmente com corte a laser (sem costura).'],
  [/One-size-fits-all set\s*-\s*Wears from 38 to 42/gi, 'Tamanho Único — Veste do 38 ao 42'],
  [/One Size\s*[–—-]\s*Fits Brazilian sizes 38\s*[–—-]\s*42 \(approximately US S\s*[–—-]\s*M; fit may vary\)/gi,
   'Tamanho Único — Veste do 38 ao 42 (aprox. P ao M EUA)'],
  [/One Size\s*[–—-]\s*Fits Brazilian sizes 38\s*[–—-]\s*42/gi, 'Tamanho Único — Veste do 38 ao 42'],

  // Descrições dos modelos específicos (Comfy Vest, Sets, Rompers, Jackets, etc.)
  [/The Comfy (?:Polyamide|poliamida) Vest combines comfort, style, and versatility in a modern, lightweight design\. Perfect for layering over activewear or creating stylish everyday outfits\./gi,
   'O Colete Poliamida Confortável combina conforto, estilo e versatilidade em um design moderno e leve. Perfeito para usar sobre looks fitness ou criar produções estilosas no dia a dia.'],
  [/Featuring a sleeveless design, high neckline, and adjustable waist tie, this vest offers a relaxed yet flattering fit\. The front opening and soft, flowing silhouette provide a comfortable and effortlessly elegant look\./gi,
   'Com modelagem sem mangas, gola alta e amarração ajustável na cintura, este colete oferece um caimento soltinho e elegante. A abertura frontal e o tecido fluido proporcionam conforto e sofisticação sem esforço.'],
  [/The ([\w\s]+) Set combines comfort, style, and performance in a flattering, body-hugging design\./gi,
   'O Conjunto $1 combina conforto, estilo e performance em uma modelagem que abraça e valoriza o corpo.'],
  [/The ([\w\s]+) Jacket combines style, comfort, and functionality in a sleek, modern design\./gi,
   'A Jaqueta $1 une estilo, conforto e funcionalidade em um design moderno e elegante.'],
  [/The ([\w\s]+) Comfy Jacket combines a flattering, body-hugging fit with everyday comfort\./gi,
   'A Jaqueta Confortável $1 combina caimento ajustado que valoriza a silhueta com conforto para o dia a dia.'],
  [/The ([\w\s]+) Shorts Set combines comfort, style, and functionality, making it perfect for workouts and everyday wear\./gi,
   'O Conjunto Short $1 combina conforto, estilo e funcionalidade, sendo perfeito para treinos e para o dia a dia.'],
  [/The ([\w\s]+) Leggings Set combines comfort, style, and versatility for your everyday activewear wardrobe\./gi,
   'O Conjunto Calça Legging $1 combina conforto, estilo e versatilidade para seus treinos e looks do dia a dia.'],
  [/The ([\w\s]+) Romper combines comfort, style, and versatility in a sleek, modern design\./gi,
   'O Macaquinho $1 combina conforto, estilo e versatilidade em um design moderno e impecável.'],
  [/The ([\w\s]+) Flare Jumpsuit combines comfort, elegance, and style in a modern, flattering design\./gi,
   'O Macacão Flare $1 combina conforto, elegância e estilo em uma modelagem moderna que valoriza suas curvas.'],
  [/The Comfy Aline Jumpsuit combines style, comfort, and performance in a flattering, modern design\./gi,
   'O Macacão Confortável Aline combina estilo, conforto e performance em um design moderno que valoriza a silhueta.'],
  [/The Ultra Light Windbreaker combines lightweight comfort, style, and functionality in a modern, versatile design\./gi,
   'A Jaqueta Corta-Vento Ultraleve combina leveza, conforto, estilo e funcionalidade em um design versátil.'],
  [/The perfect combination of comfort, style, and performance\./gi, 'A combinação perfeita de conforto, estilo e performance.'],
  [/The perfect combination of style, comfort, and performance\./gi, 'A combinação perfeita de estilo, conforto e performance.'],
  [/The perfect combination of comfort, style, and functionality\./gi, 'A combinação perfeita de conforto, estilo e funcionalidade.'],
  [/The perfect combination of comfort, style, and versatility\./gi, 'A combinação perfeita de conforto, estilo e versatilidade.'],
  [/The perfect combination of style, comfort, and versatility\./gi, 'A combinação perfeita de estilo, conforto e versatilidade.'],
  [/A perfect blend of style, comfort, and performance\./gi, 'Uma combinação perfeita de estilo, conforto e performance.'],
  [/A perfect combination of style, comfort, and versatility\./gi, 'Uma combinação perfeita de estilo, conforto e versatilidade.'],
  [/A versatile addition to your active and casual wardrobe, designed for everyday style and easy outfit pairing\. Please check the size and color of this variation before purchasing\./gi,
   'Uma peça versátil para seu guarda-roupa fitness e casual, desenvolvida para trazer estilo e praticidade nas combinações. Confira o tamanho e a cor selecionados antes de finalizar a compra.'],
  [/in a sophisticated burgundy and beige colorway\. Features a thin-strap sports bra with a flattering ruched front and branded ANA contrast elastic band, paired with high-waisted sculpting leggings with a contrast waistband\. 100% squat-proof and zero-transparency fabric engineered for optimal support, breathability, and comfort from intense workouts to daily leisure\./gi,
   'em uma combinação sofisticada de bordô e bege. Possui top de alças finas com franzido frontal e elástico personalizado ANA, combinado com calça legging modeladora de cintura alta com cós contrastante. Tecido 100% zero transparência desenvolvido para sustentação ideal, respirabilidade e conforto dos treinos intensos ao lazer diário.'],
  [/in chocolate brown with beige accents\./gi, 'em marrom chocolate com detalhes em bege.'],
  [/Featuring delicate thin straps, a stylish cutout below the bust, and double-layered bust fabric for added coverage and support, this jumpsuit offers a feminine and sophisticated look\. Its non-see-through fabric provides confidence and comfort throughout the day\./gi,
   'Com alças finas delicadas, recorte estiloso abaixo do busto e tecido duplo na região do busto para maior cobertura e sustentação, este macacão oferece um visual feminino e sofisticado. Seu tecido zero transparência garante confiança e conforto o dia todo.'],
  [/Designed with a full-length front zipper and convenient thumbholes to keep the sleeves in place, this jacket is perfect for workouts, casual outings, and everyday wear\./gi,
   'Desenvolvido com zíper frontal completo e aberturas práticas para o polegar que mantêm as mangas no lugar, esta jaqueta é perfeita para treinos, passeios casuais e uso diário.'],
  [/Short fitness romper with a body-hugging fit, rounded neckline, and wide racerback-style straps\. Features functional side pockets, vertical seams that contour the silhouette, and fitted hems at the shorts\./gi,
   'Macaquinho fitness curto com caimento ajustado ao corpo, decote arredondado e alças largas estilo nadador. Possui bolsos laterais funcionais, recortes verticais que desenham a silhueta e acabamento firme nas barras.'],
  [/Designed with a subtly defined waist, a mid-thigh length, and a sleeveless silhouette, offering a modern and minimalist look\./gi,
   'Desenvolvido com cintura levemente marcada, comprimento meia-coxa e modelagem regata sem mangas, oferecendo um visual moderno e minimalista.'],
  [/Lightweight, breathable mesh top with a comfortable, stretchy fit\. Features a longline design for extra coverage and side slits for freedom of movement\./gi,
   'Blusa de tela leve e respirável com caimento confortável e elástico. Possui modelagem alongada (tapa-bumbum) para cobertura extra e fendas laterais que garantem total liberdade de movimento.'],
  [/Premium Suplex activewear set crafted for ultimate comfort, elegance, and a flattering body-sculpting fit\. Engineered with a high-waisted anatomical waistband that stays firmly in place and does not roll down during training\. 100% squat-proof and non-see-through guarantee\./gi,
   'Conjunto fitness em Suplex Premium desenvolvido para máximo conforto, elegância e modelagem que esculpe o corpo. Projetado com cós anatômico alto que permanece firme e não enrola durante o treino. Garantia de 100% zero transparência no agachamento.'],
  [/Fits US 2-4 with 4-way anatomical stretch\. Dispatched from Leominster, MA via USPS Priority Mail[^.]*\./gi,
   'Veste manequim 36-38 (US 2-4) com elasticidade anatômica 4-way. Enviado de Leominster, MA via USPS Priority Mail com frete fixo para todos os EUA.'],
  [/Short Sleeve Open-Back Romper/gi, 'Macaquinho Manga Curta Costas Abertas'],
  [/Elevate your activewear collection with this stylish and versatile short sleeve romper\. Designed with a flattering, body-hugging fit, it combines comfort, flexibility, and a modern feminine look\./gi,
   'Eleve seu guarda-roupa fitness com este macaquinho de manga curta estiloso e versátil. Com caimento justo que valoriza o corpo, une conforto, flexibilidade e um visual feminino moderno.'],
  [/The short sleeves and elegant open-back design add a sophisticated touch, while the soft, stretchy fabric provides comfort and freedom of movement\. The fitted silhouette enhances your natural curves, making this romper perfect for workouts, yoga, fitness activities, or casual everyday wear\./gi,
   'As mangas curtas e as costas abertas trazem sofisticação, enquanto o tecido macio e elástico garante conforto e liberdade de movimento. A silhueta ajustada realça suas curvas naturais, tornando-o perfeito para academia, yoga ou looks casuais.'],
  [/Textured Open-Back Jumpsuit/gi, 'Macacão Texturizado Costas Abertas'],
  [/Designed to combine style, comfort, and confidence, this full-length jumpsuit features a flattering, body-hugging silhouette that enhances your natural curves\./gi,
   'Projetado para unir estilo, conforto e confiança, este macacão longo possui modelagem justa que abraça e valoriza suas curvas naturais.'],
  [/Made with textured, stretchy fabric, it offers a comfortable fit and freedom of movement\. The sleeveless design, scoop neckline, and stylish back cutout add a modern, feminine touch\./gi,
   'Confeccionado em tecido texturizado e elástico, oferece caimento confortável e liberdade nos movimentos. Sem mangas, com decote arredondado e recorte elegante nas costas.'],
  [/A stylish two-piece activewear set featuring a cropped sports top and high-waisted leggings, designed with a flattering, body-hugging fit\./gi,
   'Conjunto fitness de duas peças estiloso composto por top cropped esportivo e calça legging de cintura alta com modelagem ajustada ao corpo.'],
  [/The top features a rounded neckline, thin shoulder straps, and a cropped length with a fitted finish\./gi,
   'O top possui decote arredondado, alças finas e comprimento cropped com acabamento firme.'],
  [/The leggings feature a wide, high-rise waistband, functional side pockets, and full-length legs, with strategically placed seams that enhance the silhouette\./gi,
   'A calça legging conta com cós alto e largo, bolsos laterais funcionais e recortes estratégicos que valorizam a silhueta.'],
  [/A sleek, minimalist design with clean finishing details, perfect for workouts, everyday activities, and casual athletic looks\./gi,
   'Design minimalista e sofisticado com acabamento impecável, perfeito para treinos, rotina diária e produções athleisure.'],
  [/Women’s Textured Activewear Top|Women's Textured Activewear Top/gi, 'Blusa Fitness Texturizada Feminina'],
  [/Women's One-Shoulder Activewear Set – Sports Bra & Leggings/gi, 'Conjunto Fitness Feminino Manga Nula – Top & Legging'],
  [/Women's Sculpting Fitness Jumpsuit/gi, 'Macacão Fitness Modelador Feminino'],
  [/Women's Two-Piece Activewear Set – Sports Bra & Leggings/gi, 'Conjunto Fitness Feminino Duas Peças – Top & Legging'],
  [/Women's Two-Piece Activewear Set – Sports Bra & Shorts/gi, 'Conjunto Fitness Feminino Duas Peças – Top & Short'],
  [/Combining style, comfort, and versatility, this premium polyamide set features/gi,
   'Unindo estilo, conforto e versatilidade, este conjunto em poliamida premium possui'],
  [/A perfect blend of style, comfort, and performance\. This premium polyamide set features/gi,
   'Uma combinação perfeita de estilo, conforto e performance. Este conjunto em poliamida premium possui'],
  [/Made from lightweight, breathable sheer mesh, this sleeveless top features a relaxed fit and a modern design, perfect for layering over your favorite sports bra\./gi,
   'Confeccionado em tela de tule leve e respirável, este regatão sem mangas possui caimento soltinho e design moderno, perfeito para usar sobre seu top favorito.'],
  [/Featuring a ([\w\s]+) neckline/gi, 'Com decote $1'],
  [/It is the perfect choice for workouts and everyday wear/gi, 'É a escolha perfeita para treinos e uso no dia a dia'],
  [/Color: Mint Green\.?/gi, 'Cor: Verde Menta.'],
  [/Wash separately using mild detergent and plenty of water\. Do not soak\. Wash before first use, as some fabrics may release excess dye during the initial wash\./gi,
   'Lave separadamente com sabão neutro e bastante água. Não deixe de molho. Lave antes do primeiro uso para retirar possível excesso de tinta.'],
  [/Wash separately in cold water with mild detergent\. Do not soak\. Wash before first wear\./gi,
   'Lave separadamente em água fria com sabão neutro. Não deixe de molho. Lave antes do primeiro uso.'],
  [/This stylish two-piece activewear set features a cropped tank-style sports bra with wide shoulder straps, a flattering scoop neckline, and a low scoop back\. The fitted design provides a sleek, feminine look while allowing freedom of movement\./gi,
   'Este conjunto fitness de duas peças estiloso traz top cropped estilo regata com alças largas, decote arredondado e costas decotadas elegantes. A modelagem ajustada garante visual moderno, feminino e total liberdade de movimentos.'],
  [/The matching high-waisted shorts feature a wide, supportive waistband that hugs the waist and enhances your natural curves\. With a smooth front and comfortable mid-thigh length, they offer a flattering and secure fit\./gi,
   'O short de cintura alta combinando conta com cós largo de alta sustentação que abraça a cintura e valoriza suas curvas naturais. Com frente lisa e comprimento meia-coxa confortável, oferece caimento firme e seguro.'],
  [/Made for both style and functionality, this set is perfect for gym workouts, yoga, fitness activities, or casual everyday wear\./gi,
   'Feito para unir estilo e funcionalidade, este conjunto é perfeito para treinos na academia, yoga, atividades esportivas ou looks casuais do dia a dia.'],
  [/Elevate your workout style with this elegant and modern two-piece activewear set\. Featuring a stylish asymmetrical one-shoulder sports bra with a chic front cutout and high-waisted leggings that beautifully enhance your natural curves\. Designed for comfort, flexibility, and a flattering fit, it's perfect for workouts, yoga, or everyday wear\./gi,
   'Eleve seu estilo nos treinos com este conjunto fitness elegante e moderno de duas peças. Traz top assimétrico de um ombro só (manga nula) com recorte frontal charmoso e calça legging de cintura alta que realça suas curvas naturais. Feito para garantir conforto, flexibilidade e caimento perfeito.'],
  [/Designed for comfort, confidence, and style\. This sleek, form-fitting jumpsuit features a flattering high-waisted design, adjustable-looking slim straps, and a smooth, stretchy fabric that moves with your body\. Perfect for workouts, everyday wear, or a sporty-chic look\./gi,
   'Desenvolvido para proporcionar conforto, confiança e estilo. Este macacão de modelagem justa e elegante conta com cintura marcada, alças finas delicadas e tecido liso e elástico que acompanha todos os seus movimentos.'],
  [/Elevate your activewear collection with this stylish and feminine two-piece set\. Featuring a flattering sports bra with delicate adjustable-style straps, a ruched front detail, and high-waisted leggings designed to enhance your natural curves\./gi,
   'Renove seu guarda-roupa fitness com este conjunto feminino e estiloso de duas peças. Traz top com alças delicadas e detalhe franzido no busto, além de calça legging de cintura alta modeladora que valoriza suas curvas.'],
  [/High-Waisted Suplex Leggings/gi, 'Calça Legging Suplex de Cintura Alta'],
  [/Longline Mesh Athletic Top/gi, 'Blusa Esportiva Alongada de Tela'],
  [/Comfortable, versatile, and easy to pair with leggings or shorts\./gi, 'Confortável, versátil e fácil de combinar com legging ou short.'],
  [/TULLE REGATÃO/gi, 'Regatão de Tule'],
  [/Lavanda|Lavender/gi, 'Lavanda'],
  [/Pitaya Pink/gi, 'Rosa Pitaya'],
  [/Olive Green/gi, 'Verde Oliva'],
  [/Caramel/gi, 'Caramelo'],
  [/Navy Blue/gi, 'Azul Marinho'],
  [/Salmon/gi, 'Salmão'],

  // Construções comuns nas descrições
  [/Two-piece activewear set crafted from soft, ultra-stretchy suplex/gi,
   'Conjunto fitness de duas peças confeccionado em suplex macio com alta elasticidade'],
  [/Two-piece activewear set made from soft, stretchy suplex fabric/gi,
   'Conjunto fitness de duas peças confeccionado em tecido suplex macio e elástico'],
  [/This two-piece activewear set features/gi, 'Este conjunto fitness de duas peças conta com'],
  [/This two-piece set features/gi, 'Este conjunto de duas peças possui'],
  [/This two-piece set includes/gi, 'Este conjunto de duas peças inclui'],
  [/This two-piece set is made from/gi, 'Este conjunto de duas peças é confeccionado em'],
  [/Two-piece set:/gi, 'Conjunto de duas peças:'],
  [/Crafted from polyamide fabric, this strapless one-piece features/gi, 'Confeccionado em poliamida de alta qualidade, este macaquinho tomara que caia possui'],
  [/Crafted from premium polyamide fabric, it provides/gi, 'Confeccionado em tecido de poliamida premium, oferece'],
  [/Made from soft, stretchy suplex fabric/gi, 'Confeccionado em suplex macio e elástico'],
  [/Made from textured jacquard fabric/gi, 'Confeccionado em tecido jacquard texturizado'],
  [/Made from polyamide fabric/gi, 'Confeccionado em tecido poliamida'],
  [/Made from premium polyamide fabric/gi, 'Confeccionado em poliamida premium'],
  [/Made from lightweight, breathable sheer mesh/gi, 'Confeccionado em tule/tela leve e respirável'],
  [/Made with textured, stretchy fabric/gi, 'Confeccionado em tecido texturizado e elástico'],
  [/Features a thin-strap top with a ruched bust and matching (?:cintura alta|high-waisted) leggings\./gi,
   'Possui top de alças finas com franzido no busto e calça legging de cintura alta combinando.'],
  [/Contrasting bands on the top and waistband add a modern touch\./gi,
   'As faixas contrastantes no top e no cós adicionam um toque moderno ao visual.'],
  [/Comfortable for workouts and everyday wear\./gi, 'Confortável para treinos e uso no dia a dia.'],
  [/Perfect for workouts, yoga, and everyday wear\.?/gi, 'Perfeito para treinos, yoga e uso no dia a dia.'],
  [/Perfect for workouts, gym sessions, and everyday wear\.?/gi, 'Perfeito para treinos, academia e uso no dia a dia.'],
  [/Perfect for workouts, outdoor activities, and casual everyday wear\.?/gi, 'Perfeito para treinos, atividades ao ar livre e looks casuais.'],
  [/Perfect for workouts, tennis, and everyday wear\.?/gi, 'Perfeito para treinos, beach tennis e uso no dia a dia.'],
  [/Perfect for workouts and everyday wear\.?/gi, 'Perfeito para treinos e para o dia a dia.'],
  [/Perfect for layering and everyday wear\.?/gi, 'Perfeito para sobreposições e uso diário.'],
  [/Perfect for layering over activewear or creating stylish everyday outfits\.?/gi, 'Perfeito para usar por cima do look fitness ou criar combinações casuais.'],
  [/Ideal for gym workouts, yoga, and everyday activities\.?/gi, 'Ideal para academia, yoga e atividades do dia a dia.'],
  [/Ideal for workouts, yoga, and casual everyday wear\.?/gi, 'Ideal para treinos, yoga e looks casuais.'],
  [/Ideal for active and casual wear\.?/gi, 'Ideal para looks fitness e casuais.'],
  [/Ideal for gym and casual wear\.?/gi, 'Ideal para academia e dia a dia.'],
  [/Elevate your activewear collection with/gi, 'Eleve sua coleção fitness com'],
  [/Elevate your workout style with/gi, 'Eleve seu estilo nos treinos com'],
  [/Elevate your style with/gi, 'Eleve seu visual com'],
  [/Add a stylish touch to your activewear with/gi, 'Adicione um toque de estilo ao seu look fitness com'],
  [/Stay comfortable and stylish with/gi, 'Mantenha-se confortável e estilosa com'],
  [/Designed for comfort, style, and versatility/gi, 'Desenvolvido para oferecer conforto, estilo e versatilidade'],
  [/Designed for comfort and style/gi, 'Desenvolvido para unir conforto e estilo'],
  [/Designed for comfort, confidence, and style/gi, 'Desenvolvido para garantir conforto, confiança e estilo'],
  [/Designed to combine style, comfort, and confidence/gi, 'Desenvolvido para unir estilo, conforto e confiança'],
  [/Available in multiple colors\.?/gi, 'Disponível em diversas cores.'],
  [/Available Colors:/gi, 'Cores Disponíveis:'],

  // Cabeçalhos técnicos e especificações
  [/Technical specifications/gi, 'Especificações Técnicas'],
  [/Garment measurements \(approx\.\):/gi, 'Medidas aproximadas da peça:'],
  [/Garment Measurements/gi, 'Medidas da Peça'],
  [/Measurements \(laid flat\):/gi, 'Medidas da peça (planas):'],
  [/Measurements \(Size S flat lay\):/gi, 'Medidas (Tamanho P plano):'],
  [/Jumpsuit Measurements/gi, 'Medidas do Macacão'],
  [/Measurements/gi, 'Medidas'],
  [/Product Details:?/gi, 'Detalhes do Produto:'],
  [/Product Features:?/gi, 'Características do Produto:'],
  [/Features:?/gi, 'Características:'],
  [/Washing instructions:?/gi, 'Instruções de Lavagem:'],
  [/Care Instructions:?/gi, 'Cuidados com a Peça:'],
  [/Care instructions:?/gi, 'Cuidados com a Peça:'],
  [/Model measurements:?/gi, 'Medidas da Modelo:'],
  [/Please Note:?/gi, 'Observação:'],
  [/Attention:?/gi, 'Atenção:'],
  [/Remember:?/gi, 'Lembre-se:'],
  [/Note:?/gi, 'Nota:'],
  [/Bust circumference/gi, 'Circunferência do busto'],
  [/Waist circumference/gi, 'Circunferência da cintura'],
  [/Hip circumference/gi, 'Circunferência do quadril'],
  [/Leg length/gi, 'Comprimento da perna'],
  [/Centimeters/gi, 'Centímetros'],
  [/Inches \(approx\.\)/gi, 'Polegadas (aprox.)'],
  [/Measurement/gi, 'Medida'],
  [/Height/gi, 'Altura'],
  [/Waistband/gi, 'Cós'],
  [/Waist/gi, 'Cintura'],
  [/Hips?/gi, 'Quadril'],
  [/Bust/gi, 'Busto'],
  [/Length/gi, 'Comprimento'],
  [/Composition:/gi, 'Composição:'],
  [/Fabric Weight:/gi, 'Gramatura do Tecido:'],
  [/Weight:/gi, 'Peso:'],
  [/Compression:/gi, 'Compressão:'],
  [/Opacity:/gi, 'Opacidade:'],
  [/Fabric:/gi, 'Tecido:'],
  [/Style:/gi, 'Estilo:'],
  [/Color:/gi, 'Cor:'],
  [/Size:/gi, 'Tamanho:'],
  [/Moderate/gi, 'Moderada'],
  [/Non-see-through/gi, 'Zero transparência'],
  [/Comfy Polyamide Fabric/gi, 'Tecido Poliamida Confortável'],
  [/Polyamide Fit Fabric/gi, 'Tecido Poliamida Fit'],

  // Atributos de lista / bullets
  [/verified zero see-through/gi, 'zero transparência comprovada'],
  [/zero see-through/gi, 'zero transparência'],
  [/100% squat-proof/gi, '100% à prova de agachamento (zero transparência)'],
  [/squat-proof/gi, 'zero transparência (à prova de agachamento)'],
  [/squat proof/gi, 'zero transparência'],
  [/4-way stretch elasticity/gi, 'elasticidade 4-way stretch multidirecional'],
  [/4-way stretch/gi, 'elasticidade 4-way stretch'],
  [/buttery-soft feel/gi, 'toque amanteigado e macio'],
  [/buttery-soft/gi, 'toque amanteigado'],
  [/anatomical compression/gi, 'compressão anatômica'],
  [/contour support/gi, 'suporte anatômico modelador'],
  [/seamless sculpt/gi, 'modelagem sem costura'],
  [/high support/gi, 'alta sustentação'],
  [/medium support/gi, 'média sustentação'],
  [/maximum support/gi, 'sustentação máxima'],
  [/high-performance/gi, 'alta performance'],
  [/high performance/gi, 'alta performance'],
  [/removable bra cups/gi, 'bojo removível'],
  [/removable cups/gi, 'bojo removível'],
  [/anti-roll double waistband/gi, 'cós duplo anatômico que não enrola'],
  [/wide, supportive waistband/gi, 'cós largo e firme de alta sustentação'],
  [/wide, high-rise waistband/gi, 'cós largo e cintura alta'],
  [/wide, comfortable waistband/gi, 'cós largo e confortável'],
  [/wide waistband/gi, 'cós largo anatômico'],
  [/double waistband/gi, 'cós duplo anatômico'],
  [/high-waisted compression leggings/gi, 'calça legging de compressão e cintura alta'],
  [/high-waisted leggings with pockets/gi, 'calça legging cintura alta com bolsos'],
  [/high-waisted leggings/gi, 'calça legging de cintura alta'],
  [/high-waisted shorts/gi, 'short de cintura alta'],
  [/high-waisted flare compression pants/gi, 'calça flare de compressão e cintura alta'],
  [/high-waisted flare pants/gi, 'calça flare de cintura alta'],
  [/high-waisted skirt with built-in shorts/gi, 'saia de cintura alta com short interno'],
  [/high-waisted/gi, 'cintura alta'],
  [/square neckline with wide shoulder straps/gi, 'decote quadrado com alças largas'],
  [/square neckline with double shoulder straps/gi, 'decote quadrado com alças duplas'],
  [/square neckline/gi, 'decote quadrado'],
  [/scoop neckline with wide straps/gi, 'decote arredondado com alças largas'],
  [/scoop neckline with thin shoulder straps/gi, 'decote arredondado com alças finas'],
  [/scoop neckline/gi, 'decote arredondado'],
  [/high round neckline/gi, 'gola redonda alta'],
  [/round neckline/gi, 'decote redondo'],
  [/high neckline/gi, 'gola alta'],
  [/halter neckline/gi, 'decote frente única (halter)'],
  [/strapless neckline/gi, 'decote tomara que caia'],
  [/open-back design/gi, 'design com costas abertas'],
  [/open-back detail/gi, 'detalhe com costas abertas'],
  [/scoop-back design/gi, 'recorte anatômico nas costas'],
  [/crisscross back straps/gi, 'alças cruzadas nas costas'],
  [/wide shoulder straps/gi, 'alças largas nos ombros'],
  [/wide straps/gi, 'alças largas'],
  [/thin shoulder straps/gi, 'alças finas nos ombros'],
  [/thin straps/gi, 'alças finas'],
  [/long sleeves with thumbholes/gi, 'mangas longas com abertura para o polegar'],
  [/long sleeves with elastic cuffs/gi, 'mangas longas com punhos elásticos'],
  [/long sleeves/gi, 'mangas longas'],
  [/short sleeves/gi, 'mangas curtas'],
  [/sleeveless design/gi, 'design sem mangas (regata)'],
  [/full-length front zipper/gi, 'zíper frontal completo'],
  [/adjustable waist tie/gi, 'amarração ajustável na cintura'],
  [/functional side pockets/gi, 'bolsos laterais funcionais'],
  [/functional pocket detail/gi, 'bolso funcional'],
  [/convenient pocket/gi, 'bolso prático'],
  [/front cutout detail on the top/gi, 'detalhe de recorte frontal no top'],
  [/textured 3D jacquard fabric/gi, 'tecido jacquard 3D texturizado'],
  [/textured jacquard puzzle fabric/gi, 'tecido jacquard texturizado Puzzle'],
  [/textured jacquard piquet fabric/gi, 'tecido jacquard Piquet texturizado'],
  [/feline-inspired textured pattern/gi, 'textura inspirada em animal print elegante'],
  [/flattering, body-contouring silhouette/gi, 'silhueta que valoriza e modela o corpo'],
  [/body-hugging fit/gi, 'caimento justo que modela o corpo'],
  [/body-contouring fit/gi, 'caimento que esculpe a silhueta'],
  [/form-fitting silhouette/gi, 'silhueta ajustada ao corpo'],
  [/cropped, fitted top/gi, 'top cropped ajustado'],
  [/fitted, waist-length/gi, 'ajustado na altura da cintura'],
  [/full-length, fitted leggings/gi, 'calça legging longa ajustada'],
  [/full-length flared legs/gi, 'pernas longas com modelagem flare'],
  [/full-length leggings/gi, 'calça legging longa'],
  [/mid-thigh length/gi, 'comprimento meia-coxa'],
  [/mid-thigh shorts/gi, 'short comprimento meia-coxa'],
  [/contrasting trim details/gi, 'detalhes em viés contrastante'],
  [/contrasting side stripe details/gi, 'detalhes em listra lateral contrastante'],
  [/moisture-wicking/gi, 'secagem rápida respirável'],
  [/breathable sheer mesh/gi, 'tela respirável'],
  [/dry-fit/gi, 'tecido Dry-Fit'],
  [/noble polyamide/gi, 'poliamida nobre'],
  [/polyamide fabric/gi, 'tecido poliamida'],
  [/polyamide/gi, 'poliamida'],
  [/poliamida fabric/gi, 'tecido poliamida'],
  [/elastane/gi, 'elastano'],
  [/spandex/gi, 'elastano'],
  [/inches/gi, 'polegadas'],
  [/one-piece/gi, 'peça única'],
  [/sports bra/gi, 'top esportivo'],
  [/tank top/gi, 'regata'],
  [/leggings/gi, 'calça legging'],
  [/romper/gi, 'macaquinho'],
  [/jumpsuit/gi, 'macacão'],
  [/vest/gi, 'colete'],
  [/jacket/gi, 'jaqueta'],
  [/thumbholes/gi, 'abertura para polegar'],
  [/wash separately with mild detergent/gi, 'Lave separadamente com sabão neutro'],
  [/wash separately in cold water with mild detergent/gi, 'Lave separadamente em água fria com sabão neutro'],
  [/do not soak or bleach/gi, 'Não deixe de molho e não use alvejante'],
  [/do not soak/gi, 'Não deixe de molho'],
  [/dry in the shade/gi, 'Seque à sombra'],
  [/washing before first wear is recommended/gi, 'Recomenda-se lavar antes do primeiro uso'],
  [/wash before first wear/gi, 'Lave antes do primeiro uso'],
  [/wash before first use/gi, 'Lave antes do primeiro uso'],
];

const PT_TO_EN_PHRASES: Array<[RegExp, string]> = [
  [/Conjunto Fitness ANA/gi, 'ANA Fitness Activewear Set'],
  [/Conjunto Fitness em Suplex/gi, 'Suplex Fitness Activewear Set'],
  [/Conjunto de duas peças confeccionado em suplex macio e elástico\./gi,
   'Two-piece set crafted from soft, stretchy suplex fabric.'],
  [/Conjunto fitness de duas peças, confeccionado em tecido suplex macio, confortável e com excelente elasticidade\./gi,
   'Two-piece fitness set made from soft, comfortable suplex fabric with excellent stretch.'],
  [/Possui top de alças finas com franzido no busto e legging de cintura alta\./gi,
   'Features a thin-strap sports bra with a ruched bust and matching high-waisted leggings.'],
  [/Possui top de alças finas com detalhe franzido no busto e legging de cintura alta\./gi,
   'Features a thin-strap sports bra with ruched bust detailing and high-waisted leggings.'],
  [/As faixas contrastantes no top e no cós dão um toque moderno\./gi,
   'Contrasting bands on the top and waistband add a modern touch.'],
  [/Os detalhes em faixas no top e no cós proporcionam um toque moderno e elegante\./gi,
   'Contrast band detailing on the top and waistband provides a modern, sleek finish.'],
  [/Confortável para os treinos e para o dia a dia\./gi,
   'Comfortable for workouts and everyday wear.'],
  [/Ideal para treinos e para o dia a dia, oferecendo conforto, estilo e liberdade de movimento\./gi,
   'Ideal for workouts and daily wear, offering comfort, style, and freedom of movement.'],
  [/Macacão fitness confeccionado em tecido suplex macio, flexível e confortável, que se ajusta ao corpo e valoriza a silhueta\./gi,
   'Fitness jumpsuit crafted from soft, flexible, and comfortable suplex fabric that contours to your body and flatters your silhouette.'],
  [/Possui alças finas cruzadas nas costas, decote nas costas e modelagem justa com pernas longas\./gi,
   'Features thin crisscross back straps, an open back design, and a form-fitting full-length leg silhouette.'],
  [/Ideal para treinos, academia e looks esportivos do dia a dia\./gi,
   'Ideal for workouts, gym sessions, and everyday sporty looks.'],
  [/Tecido de alta compressão com cós anatômico duplo\. Zero transparência, proteção UV50\+ e modelagem que realça a silhueta sem prender movimentos\./gi,
   'High-compression fabric with a double anatomical waistband. Zero see-through guarantee, UV 50+ defense, and a sculpting fit that moves effortlessly with your body.'],
  [/Desenvolvido para treinos de alto impacto como crossfit e corrida\. Bojo removível, elástico reforçado no tórax e forro antitranspirante\./gi,
   'Engineered for high-impact workouts such as cross-training and running. Features removable cups, a reinforced underbust band, and breathable sweat-wicking lining.'],
  [/Conjunto fitness bicolor exclusivo ANA FITNESS WEAR\./gi,
   'Exclusive two-tone activewear set by ANA FITNESS WEAR.'],
  [/Top amarelo manteiga com faixa vinho\/marsala e calça legging de cós anatômico modelador com tecnologia 100% squat-proof \(zero transparência comprovada\) e compressão suave\./gi,
   'Butter yellow sports bra with burgundy contrast trim paired with sculpting high-waisted leggings featuring verified 100% squat-proof opacity and comfortable compression.'],
  [/Conjunto Fitness Bicolor Premium da ANA FITNESS WEAR\. Top anatômico e calça legging de alta compressão com zero transparência \(100% squat-proof\)\./gi,
   'Premium Two-Tone Activewear Set by ANA FITNESS WEAR. Anatomical contour sports bra and high-compression leggings with verified 100% squat-proof opacity.'],
  [/Veste tamanho P \(Medidas planas: Busto 12 in, Cintura 11 in, Quadril 12 in\)\./gi,
   'Fits US Size S (Flat measurements: Bust 12 in, Waist 11 in, Hips 12 in).'],
  [/Medidas aproximadas da peça:/gi, 'Approximate garment measurements:'],
  [/Medidas do Macacão/gi, 'Jumpsuit Measurements'],
  [/Medidas da peça/gi, 'Garment Measurements'],
  [/Circunferência do busto/gi, 'Bust circumference'],
  [/Circunferência da cintura/gi, 'Waist circumference'],
  [/Circunferência do quadril/gi, 'Hip circumference'],
  [/Comprimento da perna/gi, 'Leg length'],
  [/Centímetros/gi, 'Centimeters'],
  [/Polegadas \(aprox\.\)/gi, 'Inches (approx.)'],
  [/Medida/gi, 'Measurement'],
  [/Tamanho M/gi, 'Size M'],
  [/Cintura:/gi, 'Waist:'],
  [/Quadril:/gi, 'Hips:'],
  [/Busto:/gi, 'Bust:'],
  [/Comprimento:/gi, 'Length:'],
  [/Regata Dry Fit Feminina/gi, 'Women’s Dry-Fit Tank Top'],
  [/zero transparência comprovada/gi, 'verified zero see-through'],
  [/zero transparência/gi, 'zero see-through'],
  [/à prova de agachamento/gi, 'squat-proof'],
  [/a prova de agachamento/gi, 'squat-proof'],
  [/elasticidade 4-way stretch multidirecional/gi, '4-way stretch elasticity'],
  [/toque amanteigado e macio/gi, 'buttery-soft feel'],
  [/toque amanteigado/gi, 'buttery-soft feel'],
  [/compressão anatômica/gi, 'anatomical compression'],
  [/alta sustentação/gi, 'high support'],
  [/média sustentação/gi, 'medium support'],
  [/sustentação máxima/gi, 'maximum support'],
  [/alta performance/gi, 'high performance'],
  [/bojo removível/gi, 'removable bra cups'],
  [/sem bojo/gi, 'unpadded'],
  [/bojo fixo/gi, 'built-in fixed cups'],
  [/cós duplo anatômico que não enrola/gi, 'anti-roll double waistband'],
  [/cós duplo/gi, 'double waistband'],
  [/cintura alta/gi, 'high-waisted'],
  [/secagem rápida respirável/gi, 'breathable moisture-wicking'],
  [/poliamida nobre/gi, 'premium polyamide'],
  [/poliamida/gi, 'polyamide'],
  [/elastano/gi, 'spandex'],
  [/macaquinhos?/gi, 'romper'],
  [/macacões/gi, 'jumpsuits'],
  [/macacão/gi, 'jumpsuit'],
  [/conjuntos?/gi, 'matching set'],
  [/pré-venda/gi, 'pre-order'],
];

/* ============================================================================
   5. TRADUTOR PARA BANNERS / TEXTOS DINÂMICOS DO PAINEL (TICKER, HERO, ETC.)
   ============================================================================ */

const DYNAMIC_CONTENT_RULES_PT: Array<[RegExp, string]> = [
  [/FLAT RATE SHIPPING \$?9\.9[09] ACROSS ALL 50 US STATES/gi, 'FRETE FIXO $9.90 PARA TODOS OS ESTADOS UNIDOS'],
  [/BASED IN LEOMINSTER, MA\s*•\s*FAST DOMESTIC 1-5 DAY USPS DELIVERY/gi, 'SEDE EM LEOMINSTER, MA • ENTREGA RÁPIDA VIA USPS EM 1 A 5 DIAS'],
  [/WEAR YOUR STRENGTH\.?/gi, 'VISTA SUA FORÇA.'],
  [/WEAR YOUR/gi, 'VISTA SUA'],
  [/STRENGTH\.?/gi, 'FORÇA.'],
  [/HIGH PERFORMANCE/gi, 'ALTA PERFORMANCE'],
  [/FIT LUXURY\.?/gi, 'MODA FITNESS LUXO.'],
  [/FLAT RATE US SHIPPING/gi, 'FRETE FIXO NOS EUA'],
  [/SQUAT-PROOF LAB CERTIFICATION/gi, 'CERTIFICAÇÃO ZERO TRANSPARÊNCIA'],
  [/ENGINEERED FOR SQUATS\.?/gi, 'FEITO PARA AGACHAMENTOS.'],
  [/SCULPTED FOR STRENGTH\.?/gi, 'ESCULPIDO PARA SUA FORÇA.'],
  [/ZERO SEE-THROUGH/gi, 'ZERO TRANSPARÊNCIA'],
  [/MUSCLE COMPRESSION/gi, 'COMPRESSÃO MUSCULAR'],
  [/MOLDED BRA CUPS/gi, 'BOJO ANATÔMICO'],
  [/ANTI-CHAFING SEAMS/gi, 'COSTURA ANTI-ATRITO'],
  [/OFFICIAL US STORE/gi, 'LOJA OFICIAL NOS EUA'],
  [/SHOP COLLECTION/gi, 'VER COLEÇÃO'],
  [/\$9\.99/g, '$9.90'],
];

const DYNAMIC_CONTENT_RULES_EN: Array<[RegExp, string]> = [
  [/⚠️\s*ALTA DEMANDA/gi, '⚠️ HIGH DEMAND'],
  [/ALTA DEMANDA/gi, 'HIGH DEMAND'],
  [/VISTA SUA FORÇA\.?/gi, 'WEAR YOUR STRENGTH.'],
  [/TAXA FIXA DE FRETE \$?9\.9[09] PARA TODOS OS ESTADOS UNIDOS/gi, 'FLAT RATE SHIPPING $9.90 ACROSS ALL 50 US STATES'],
  [/ESTOQUE EUA\s*•\s*FRETE FIXO \$?9\.9[09] P\/ TODOS OS ESTADOS/gi, 'IN-STOCK IN THE US • $9.90 FLAT SHIPPING ALL 50 STATES'],
  [/NOVA COLEÇÃO ATELIER 2026/gi, 'NEW ATELIER COLLECTION 2026'],
  [/Moda fitness de alta performance sediada em Massachusetts\. Zero transparência testada em agachamentos, compressão anatômica 4-way e frete fixo de \$?9\.9[09]\./gi,
   'High-performance activewear based in Massachusetts. Squat-tested zero see-through, 4-way anatomical compression, and flat $9.90 US shipping.'],
  [/Peças exclusivas desenvolvidas com poliamida brasileira de alta tenacidade\. Modelagem anatômica que valoriza suas curvas\./gi,
   'Exclusive designs crafted with high-tenacity Brazilian polyamide. Anatomical fit sculpted to flatter your curves.'],
  [/COMPRAR COLEÇÃO/gi, 'SHOP COLLECTION'],
  [/PRÉ-ORDER ATELIER/gi, 'ATELIER PRE-ORDER'],
  [/VER LANÇAMENTOS/gi, 'VIEW NEW ARRIVALS'],
  [/CONJUNTOS & SETS/gi, 'MATCHING SETS'],
  [/DESTAQUE EXCLUSIVO\s*•\s*ATELIER LEOMINSTER/gi, 'EXCLUSIVE ATELIER HIGHLIGHT • LEOMINSTER, MA'],
  [/ENCOMENDAS SOB MEDIDA & PEÇAS PRONTA ENTREGA/gi, 'CUSTOM TAILORING & READY-TO-SHIP STYLES'],
  [/Não encontrou o seu tamanho disponível\? Confeccionamos sob medida especialmente para você em nosso ateliê com entrega em todo território americano\./gi,
   'Didn’t find your size available? We custom-craft styles tailored just for you at our atelier with fast nationwide US shipping.'],
  [/ENCOMENDAR VIA WHATSAPP/gi, 'ORDER VIA WHATSAPP'],
  [/CONHECER MODELAGENS/gi, 'EXPLORE SILHOUETTES'],
  [/FRETE FIXO \$?9\.9[09] P\/ TODOS OS EUA/gi, 'FLAT $9.90 US SHIPPING'],
];

export function translateDynamicContent(text: string, lang: StoreLang): string {
  if (!text || typeof text !== 'string') return '';
  if (lang === 'pt') {
    return applyRules(text, DYNAMIC_CONTENT_RULES_PT);
  }
  return applyRules(text, DYNAMIC_CONTENT_RULES_EN);
}

export function translateEnToPt(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let clean = text.replace(/\nPortuguês\s*$/gi, '').trim();
  return applyRules(clean, EN_TO_PT_PHRASES);
}

export function translatePtToEn(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return applyRules(text.trim(), PT_TO_EN_PHRASES);
}

export function translateDescriptionText(text: string, lang: StoreLang): string {
  if (!text || typeof text !== 'string') return '';
  if (lang === 'pt') {
    return translateEnToPt(text);
  }
  return translatePtToEn(text);
}

/**
 * Detecta se o texto está predominantemente em português
 */
export function isPortugueseText(text: string): boolean {
  if (!text) return false;
  const sample = ` ${text.toLowerCase()} `;
  const ptSignals = [
    ' é ', ' que ', ' para ', ' com ', ' não ', ' nao ', ' peça', ' peca',
    ' tecido', ' sustentação', ' sustentacao', ' malha ', ' toque ',
    ' desenvolvido', ' confeccionado', ' confeccionada', ' modelo ',
    ' bojo', ' macaquinho', ' macacão', ' macacao', ' conjunto',
    ' cintura ', ' quadril ', ' busto ', ' possui ', ' oferece ', ' ideal para ',
    ' medidas ', ' lavagem', ' poliamida ', ' elástico', ' elastano ',
  ];
  const ptHits = ptSignals.filter((signal) => sample.includes(signal)).length;

  const enSignals = [
    ' the ', ' features ', ' made from ', ' made of ', ' crafted from ',
    ' designed ', ' perfect for ', ' comfortable ', ' product details',
    ' high-waisted', ' leggings', ' romper', ' jumpsuit', ' activewear',
    ' two-piece ', ' washing instructions', ' measurements', ' inches',
  ];
  const enHits = enSignals.filter((signal) => sample.includes(signal)).length;

  return ptHits > enHits;
}

export function isEnglishText(text: string): boolean {
  if (!text) return false;
  return !isPortugueseText(text);
}
