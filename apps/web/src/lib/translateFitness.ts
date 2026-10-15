/**
 * Tradutor especializado em Moda Fitness Premium (Inglês ⇄ Português)
 * Desenvolvido especificamente para os tecidos, modelagens e termos técnicos da ANA FITNESS WEAR.
 */

const EN_TO_PT_PHRASES: Array<[RegExp, string]> = [
  // Frases completas e compostas
  [/verified zero see-through/gi, 'zero transparência comprovada'],
  [/zero see-through/gi, 'zero transparência'],
  [/100% squat-proof/gi, '100% à prova de agachamento (zero transparência)'],
  [/squat-proof/gi, 'à prova de agachamento'],
  [/squat proof/gi, 'à prova de agachamento'],
  [/4-way stretch elasticity/gi, 'elasticidade 4-way stretch multidirecional'],
  [/4-way stretch/gi, 'elasticidade 4-way stretch'],
  [/buttery-soft feel/gi, 'toque amanteigado e macio'],
  [/buttery-soft/gi, 'toque amanteigado'],
  [/buttery soft/gi, 'toque amanteigado'],
  [/anatomical compression/gi, 'compressão anatômica'],
  [/contour support/gi, 'suporte anatômico modelador'],
  [/contour sculpt/gi, 'efeito esculpido anatômico'],
  [/seamless sculpt/gi, 'tecnologia sem costura que modela'],
  [/high support/gi, 'alta sustentação'],
  [/medium support/gi, 'média sustentação'],
  [/maximum support/gi, 'sustentação máxima'],
  [/high-performance/gi, 'alta performance'],
  [/high performance/gi, 'alta performance'],
  [/removable bra cups/gi, 'bojo removível'],
  [/removable cups/gi, 'bojo removível'],
  [/with removable cups/gi, 'com bojo removível'],
  [/without cups/gi, 'sem bojo'],
  [/unpadded/gi, 'sem bojo'],
  [/fixed cups/gi, 'bojo fixo'],
  [/built-in cups/gi, 'bojo embutido'],
  [/anti-roll double waistband/gi, 'cós duplo anatômico que não enrola'],
  [/double waistband/gi, 'cós duplo anatômico'],
  [/high-waisted/gi, 'cintura alta'],
  [/high waist/gi, 'cintura alta'],
  [/moisture-wicking/gi, 'secagem rápida respirável'],
  [/dry-fit technology/gi, 'tecnologia Dry-Fit'],
  [/dry-fit/gi, 'tecido Dry-Fit de secagem rápida'],
  [/premium polyamide/gi, 'poliamida nobre de alta densidade'],
  [/noble polyamide/gi, 'poliamida nobre'],
  [/polyamide/gi, 'poliamida'],
  [/spandex/gi, 'elastano'],
  [/elastane/gi, 'elastano'],
  [/running, gym, and pilates/gi, 'corrida, musculação e pilates'],
  [/workouts and daily wear/gi, 'treinos e uso casual de luxo'],
  [/made in massachusetts/gi, 'sediada em Massachusetts'],
  [/based in massachusetts/gi, 'sediada em Massachusetts'],
  [/flat rate shipping/gi, 'frete fixo'],
  [/across all 50 us states/gi, 'para todos os 50 estados dos EUA'],
  [/crafted for maximum confidence/gi, 'desenvolvido para máxima confiança e segurança'],
  [/delicate back cutout/gi, 'recorte delicado nas costas'],
  [/cross-back straps/gi, 'alças cruzadas nas costas'],
  [/open back/gi, 'costas abertas'],
  [/racerback/gi, 'costas nadador'],
  [/flattering silhouette/gi, 'silhueta que valoriza o corpo'],
  [/sculpting fit/gi, 'modelagem que desenha o corpo'],
  [/compression leggings/gi, 'legging de alta compressão'],
  [/matching set/gi, 'conjunto'],
  [/romper/gi, 'macaquinho'],
  [/jumpsuit/gi, 'macacão'],
  [/bra top/gi, 'top esportivo'],
  [/sports bra/gi, 'top esportivo'],
  [/athletic jacket/gi, 'casaco esportivo'],
  [/flare pants/gi, 'calça flare'],
  [/biker shorts/gi, 'bermuda ciclista'],
  [/pre-order/gi, 'pré-venda sob medida'],
  [/made-to-order/gi, 'confeccionado sob encomenda'],
];

const PT_TO_EN_PHRASES: Array<[RegExp, string]> = [
  [/zero transparência comprovada/gi, 'verified zero see-through'],
  [/zero transparência/gi, 'zero see-through'],
  [/à prova de agachamento/gi, 'squat-proof'],
  [/a prova de agachamento/gi, 'squat-proof'],
  [/elasticidade 4-way stretch multidirecional/gi, '4-way stretch elasticity'],
  [/elasticidade 4-way stretch/gi, '4-way stretch elasticity'],
  [/toque amanteigado e macio/gi, 'buttery-soft feel'],
  [/toque amanteigado/gi, 'buttery-soft feel'],
  [/compressão anatômica/gi, 'anatomical compression'],
  [/compressao anatomica/gi, 'anatomical compression'],
  [/alta sustentação/gi, 'high support'],
  [/alta sustentacao/gi, 'high support'],
  [/média sustentação/gi, 'medium support'],
  [/media sustentacao/gi, 'medium support'],
  [/sustentação máxima/gi, 'maximum support'],
  [/alta performance/gi, 'high performance'],
  [/bojo removível/gi, 'removable bra cups'],
  [/bojo removivel/gi, 'removable bra cups'],
  [/com bojo removível/gi, 'with removable cups'],
  [/com bojo/gi, 'with cups'],
  [/sem bojo/gi, 'unpadded'],
  [/bojo fixo/gi, 'built-in fixed cups'],
  [/cós duplo anatômico que não enrola/gi, 'anti-roll double waistband'],
  [/cós duplo/gi, 'double waistband'],
  [/cos duplo/gi, 'double waistband'],
  [/cintura alta/gi, 'high-waisted'],
  [/secagem rápida respirável/gi, 'breathable moisture-wicking'],
  [/secagem rápida/gi, 'quick-drying'],
  [/poliamida nobre/gi, 'noble polyamide'],
  [/poliamida/gi, 'polyamide'],
  [/elastano/gi, 'spandex'],
  [/corrida, musculação e pilates/gi, 'running, lifting, and pilates'],
  [/macaquinho/gi, 'romper'],
  [/macaquinhos/gi, 'rompers'],
  [/macacão/gi, 'jumpsuit'],
  [/macacao/gi, 'jumpsuit'],
  [/macacões/gi, 'jumpsuits'],
  [/conjunto/gi, 'matching set'],
  [/conjuntos/gi, 'matching sets'],
  [/top esportivo/gi, 'sports bra'],
  [/casaco esportivo/gi, 'athletic jacket'],
  [/calça flare/gi, 'flare pants'],
  [/pré-venda sob medida/gi, 'made-to-order pre-order'],
  [/pré-venda/gi, 'pre-order'],
  [/pre-venda/gi, 'pre-order'],
];

/**
 * Traduz texto em Inglês para Português
 */
export function translateEnToPt(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let result = text;
  for (const [regex, replacement] of EN_TO_PT_PHRASES) {
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Traduz texto em Português para Inglês
 */
export function translatePtToEn(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let result = text;
  for (const [regex, replacement] of PT_TO_EN_PHRASES) {
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Detecta se o texto está predominantemente em português
 */
export function isPortugueseText(text: string): boolean {
  if (!text) return false;
  const sample = text.toLowerCase();
  const ptSignals = [
    ' é ', ' que ', ' para ', ' com ', ' não ', ' peca ', ' peça ',
    ' tecido ', ' sustentação ', ' sustentacao ', ' malha ', ' toque ',
    ' desenvolvido ', ' desenvolvida ', ' confeccionado ', ' modelo ',
    ' bojo ', ' macaquinho ', ' macacão ', ' conjunto '
  ];
  return ptSignals.some((signal) => sample.includes(signal));
}
