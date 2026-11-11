// src/core/businessRules.ts

import {
  OfferItemState,
  RegulatoryCategory,
  RoundingStrategy,
  ValidityPreset,
  VisionEnrichmentInput,
  VisionEnrichmentResult,
  ProductEnricherPort,
  TenantBrandKit,
  GuardrailFinding,
  GuardrailSeverity,
  BatchParsedRow,
  CommercialMechanicType,
  PosterLayoutArchetype,
  ErpCatalogRecord,
  TypographyPresetId,
  HrNoticeState,
  StudioGlobalState,
  CoagroUserRole,
  GovernanceEvaluation,
  ModuleMode,
  RadioSpotDraft,
} from './types';
import {
  inspectAgroOrthography,
  AgroDictionaryEntry,
} from './coagroDictionary';

export { inspectAgroOrthography };
export type { AgroDictionaryEntry };

// ============================================================================
// 1. PARSER MONETÁRIO ROBUSTO (SUPORTA MILHAR BR 1.299,90 E US 1,299.90)
// ============================================================================
export function parsePriceNumber(input: string | number | undefined | null): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;

  const cleaned = String(input)
    .replace(/[^\d.,-]/g, '')
    .trim();
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  let normalized = cleaned;
  if (lastComma > lastDot) {
    // Ex: "1.299,90" ou "58,00"
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    // Ex: "1,299.90"
    normalized = cleaned.replace(/,/g, '');
  } else if (lastDot !== -1 && lastComma === -1) {
    // Se tiver ponto mas não vírgula: verifica se é milhar ("1.200") ou centavo ("549.90")
    const parts = cleaned.split('.');
    const lastPart = parts[parts.length - 1];
    if (parts.length > 2 || lastPart.length === 3) {
      normalized = cleaned.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Formata valor numérico para moeda brasileira (Ex: 1899 -> "1.899,00", 44.9 -> "44,90")
 */
export function formatBRL(value: number): string {
  const safe = isNaN(value) || value < 0 ? 0 : value;
  const [intPart, decPart] = safe.toFixed(2).split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withThousands},${decPart}`;
}

/**
 * Resolve de forma determinística e única o arquétipo visual recomendado para o cartaz
 * a partir da mecânica comercial e da presença ou ausência de ancoragem De/Por.
 */
export function resolveRecommendedArchetype(
  mechanicType: CommercialMechanicType | undefined,
  priceFrom: number | undefined,
  priceTo: number
): PosterLayoutArchetype {
  if (mechanicType === 'INSTALLMENT_FINANCING') {
    return 'MACHINERY_INSTALLMENT';
  }
  if (
    mechanicType === 'BUY_WIN_GIFT' ||
    mechanicType === 'TAKE_X_PAY_Y' ||
    mechanicType === 'SECOND_UNIT_50' ||
    mechanicType === 'WHOLESALE_VOLUME' ||
    mechanicType === 'LOYALTY_CLUB' ||
    mechanicType === 'COMBO_ADVANTAGE'
  ) {
    return 'COMBO_ADVANTAGE';
  }
  if (!priceFrom || priceFrom <= priceTo) {
    return 'CLEAN_DIRECT_PRICE';
  }
  return 'PROMO_CLASSIC_V';
}

// ============================================================================
// 2. MATEMÁTICA DE CONTRASTE WCAG 2.1
// ============================================================================
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  const fullHex =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);

  const num = parseInt(fullHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const transform = (v: number) => {
    const sRGB = v / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export function resolveAccessibleTextColor(backgroundHex: string): string {
  const ratioWhite = getContrastRatio(backgroundHex, '#FFFFFF');
  const ratioDark = getContrastRatio(backgroundHex, '#0F172A');
  return ratioWhite >= ratioDark ? '#FFFFFF' : '#0F172A';
}

// ============================================================================
// 3. LIMPEZA DE SIGLAS DE ERP + EXTRAÇÃO DE UNIDADE/PESO
// ============================================================================
const ERP_ABBREVIATION_MAP: Record<string, string> = {
  'RAC': 'Ração',
  'RAÇ': 'Ração',
  'AD': 'Adulto',
  'FILH': 'Filhote',
  'CAST': 'Castrado',
  'PEQ': 'Pequeno Porte',
  'MED': 'Médio Porte',
  'GDE': 'Grande Porte',
  'SAB': 'Sabor',
  'FRG': 'Frango',
  'CARN': 'Carne',
  'VEG': 'Vegetais',
  'HERB': 'Herbicida',
  'INSET': 'Inseticida',
  'FUNG': 'Fungicida',
  'ACAR': 'Acaricida',
  'FERT': 'Fertilizante',
  'ADUB': 'Adubo',
  'CALC': 'Calcário',
  'SEMENT': 'Semente',
  'PULV': 'Pulverizador',
  'ROC': 'Roçadeira',
  'TRIT': 'Triturador',
  'FORRAG': 'Forrageiro',
  'MOTOS': 'Motosserra',
  'GERAD': 'Gerador',
  'ORDENH': 'Ordenhadeira',
  'BETON': 'Betoneira',
  'COST': 'Costal',
  'MAN': 'Manual',
  'ELET': 'Elétrico',
  'GASOL': 'Gasolina',
  'BATER': 'Bateria',
  'VAC': 'Vacina',
  'VERM': 'Vermífugo',
  'ANTIPULG': 'Antipulgas',
  'CARRAP': 'Carrapaticida',
  'ANTIB': 'Antibiótico',
  'SUPLEM': 'Suplemento',
  'MIN': 'Mineral',
  'BOV': 'Bovinos',
  'EQ': 'Equinos',
  'SUIN': 'Suínos',
  'AV': 'Aves',
  'COMP': 'Comprimido',
  'SOL': 'Solução',
  'SUSP': 'Suspensão',
  'INJ': 'Injetável',
  'PCT': 'Pacote',
  'CX': 'Caixa',
  'FD': 'Fardo',
  'SC': 'Saca',
  'GL': 'Galão',
  'BDJ': 'Bandeja',
  'FR': 'Frasco',
  'TB': 'Tubo',
  'LT': 'Lata',
  'GARR': 'Garrafa',
  'C/': 'com',
  'S/': 'sem',
  'P/': 'para',
  'TRAD': 'Tradicional',
  'ESP': 'Especial',
  'SEL': 'Select',
  'PREM': 'Premium',
  'ORIG': 'Original',
  'CONC': 'Concentrado',
  'GRAN': 'Granulado',
};

// Dicionário determinístico de correção ortográfica de erros comuns de digitação no balcão
const RETAIL_TYPO_DICTIONARY: Record<string, string> = {
  'racao': 'Ração',
  'raçao': 'Ração',
  'racão': 'Ração',
  'rassao': 'Ração',
  'glifozato': 'Glifosato',
  'glifosatto': 'Glifosato',
  'erbicida': 'Herbicida',
  'inceticida': 'Inseticida',
  'insetecida': 'Inseticida',
  'funjicida': 'Fungicida',
  'vermifogo': 'Vermífugo',
  'vermifugo': 'Vermífugo',
  'antipulga': 'Antipulgas',
  'carrapaticda': 'Carrapaticida',
  'ivermectna': 'Ivermectina',
  'oxitetracilina': 'Oxitetraciclina',
  'aftoza': 'Aftosa',
  'puverizador': 'Pulverizador',
  'pulverisador': 'Pulverizador',
  'rossadeira': 'Roçadeira',
  'rocadeira': 'Roçadeira',
  'motoserra': 'Motosserra',
  'forragero': 'Forrageiro',
  'betonera': 'Betoneira',
  'fertilisante': 'Fertilizante',
  'calcareo': 'Calcário',
  'calcario': 'Calcário',
  'ureia': 'Ureia',
  'uréia': 'Ureia',
  'inoculane': 'Inoculante',
  'vitaminico': 'Vitamínico',
  'antibiotico': 'Antibiótico',
  'solucao': 'Solução',
  'soluçao': 'Solução',
  'injetavel': 'Injetável',
  'comprimdo': 'Comprimido',
  'castrdo': 'Castrado',
  'filhte': 'Filhote',
  'mombaca': 'Mombaça',
  'piata': 'Piatã',
  'paiaguas': 'Paiaguás',
  'braquiaria': 'Braquiária',
  'trautina': 'Tramontina',
  'travero': 'Tramontina',
  'ourofino': 'Ourofino',
  'bovigold': 'Bovigold',
  'fosbovi': 'Fosbovi',
  'dectomax': 'Dectomax',
  'verimark': 'Verimark',
  'hexazinona': 'Hexazinona',
  'exazinona': 'Hexazinona',
  'tebutiurom': 'Tebutiurom',
  'imidacloprido': 'Imidacloprido',
};

const STOPWORDS_PT = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'com',
  'para',
  'por',
  'em',
  'pacote',
  'caixa',
  'fardo',
  'embalagem',
  'unidade',
  'granel',
]);

export function cleanErpProductTitle(rawText: string): {
  cleanedTitle: string;
  extractedUnit: string;
  extractedMeasure?: number;
} {
  if (!rawText || !rawText.trim()) {
    return { cleanedTitle: '', extractedUnit: 'UN' };
  }

  // Sanitização determinística Anti-XSS: remove blocos <script>/<iframe>, tags HTML, event handlers e javascript:
  const xssSanitized = rawText
    .replace(/<\s*(script|iframe|object|embed|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ' ')
    .replace(/javascript\s*:/gi, ' ')
    .replace(/[<>]/g, ' ');

  const withoutPrefix = xssSanitized
    .trim()
    .replace(/^(\[\d+\]|#\d+|c[oó]d\.?\s*\d+\s*[-:•]?|\d{4,10}\s*-\s*)\s*/i, '')
    .replace(/\bOuro\s+Fino\b/gi, 'Ourofino')
    .replace(/\s+/g, ' ');

  if (!withoutPrefix) {
    return { cleanedTitle: '', extractedUnit: 'UN' };
  }

  const tokens = withoutPrefix.split(' ');
  let detectedUnit = 'UN';
  let detectedMeasure: number | undefined = undefined;

  const measureRegex = /^(\d+(?:[.,]\d+)?)\s*(KG|QUILOS?|G|GR|GRAMAS?|MG|L|LT|LITROS?|ML|SC|SACAS?|SACOS?|TON|UN|CX|PCT|DOSES?)$/i;

  const processedTokens = tokens.map((token, index) => {
    const upper = token.toUpperCase().replace(/[.,;]$/, '');
    const lowerClean = token
      .toLowerCase()
      .replace(/[.,;]$/, '');

    const measureMatch = token.match(measureRegex);
    if (measureMatch) {
      const numericVal = parseFloat(measureMatch[1].replace(',', '.'));
      const rawUnit = measureMatch[2].toUpperCase();

      if ((rawUnit === 'G' || rawUnit === 'GR' || rawUnit.startsWith('GRAMA')) && numericVal >= 100) {
        detectedUnit = 'KG';
        detectedMeasure = numericVal / 1000;
      } else if (rawUnit === 'ML' && numericVal >= 100) {
        detectedUnit = 'LT';
        detectedMeasure = numericVal / 1000;
      } else if (rawUnit === 'L' || rawUnit === 'LT' || rawUnit.startsWith('LITRO')) {
        detectedUnit = 'LT';
        detectedMeasure = numericVal;
      } else if (rawUnit === 'KG' || rawUnit.startsWith('QUILO')) {
        detectedUnit = 'KG';
        detectedMeasure = numericVal;
      } else if (rawUnit === 'SC' || rawUnit.startsWith('SAC')) {
        detectedUnit = 'SC';
        detectedMeasure = numericVal;
      } else if (rawUnit === 'TON') {
        detectedUnit = 'TON';
        detectedMeasure = numericVal;
      } else if (rawUnit.startsWith('DOSE')) {
        detectedUnit = 'FR';
      }

      const normDisplayUnit = rawUnit.startsWith('DOSE')
        ? 'Doses'
        : rawUnit.startsWith('QUILO')
          ? 'KG'
          : rawUnit.startsWith('LITRO') || rawUnit === 'L'
            ? 'LT'
            : rawUnit.startsWith('GRAMA') || rawUnit === 'GR'
              ? 'G'
              : rawUnit.startsWith('SAC')
                ? 'SC'
                : rawUnit;

      return `${measureMatch[1].replace('.', ',')}${normDisplayUnit === 'Doses' ? ' Doses' : normDisplayUnit}`;
    }

    if (index > 0 && /^(KG|QUILOS?|L|LT|LITROS?|ML|G|GR|SC|SACAS?|DOSES?)$/i.test(upper)) {
      const prevNumeric = parseFloat(tokens[index - 1].replace(',', '.'));
      if (!isNaN(prevNumeric)) {
        if (upper.startsWith('DOSE')) {
          detectedUnit = 'FR';
          return 'Doses';
        }
        if (upper === 'G' || upper === 'GR') {
          if (prevNumeric >= 100) {
            detectedUnit = 'KG';
            detectedMeasure = prevNumeric / 1000;
          }
          return 'G';
        }
        if (upper === 'ML') {
          if (prevNumeric >= 100) {
            detectedUnit = 'LT';
            detectedMeasure = prevNumeric / 1000;
          }
          return 'ML';
        }
        detectedUnit =
          upper === 'L' || upper.startsWith('LITRO')
            ? 'LT'
            : upper.startsWith('QUILO')
              ? 'KG'
              : upper.startsWith('SAC')
                ? 'SC'
                : upper;
        detectedMeasure = prevNumeric;
      }
      return detectedUnit;
    }

    if (ERP_ABBREVIATION_MAP[upper]) {
      return ERP_ABBREVIATION_MAP[upper];
    }

    if (RETAIL_TYPO_DICTIONARY[lowerClean]) {
      return RETAIL_TYPO_DICTIONARY[lowerClean];
    }

    // Preserva siglas técnicas e formulações NPK (Ex: 10-10-10, 20-05-20, WG, NPK, TRF, 2CV)
    if (/^(NPK|WG|EC|SL|SC|GL|UV|LED|PVC|RPM|HP|CV|\d+CV|\d+HP|TRF|TRF\d+|220V|110V|BIVOLT|\d{1,2}-\d{1,2}-\d{1,2})$/i.test(upper)) {
      return upper;
    }

    if (upper.length > 2) {
      return upper.charAt(0) + upper.slice(1).toLowerCase();
    }

    return upper.toLowerCase();
  });

  const cleanedTitle = processedTokens
    .join(' ')
    .replace(/\b([a-z])/g, (char, idx) => (idx === 0 ? char.toUpperCase() : char));

  return {
    cleanedTitle,
    extractedUnit: detectedUnit,
    extractedMeasure: detectedMeasure,
  };
}

export function condenseProductTitle(
  title: string,
  maxCharBudget = 48
): { condensedTitle: string; removedStopwords: string[] } {
  const clean = title.trim();
  if (clean.length <= maxCharBudget) {
    return { condensedTitle: clean, removedStopwords: [] };
  }

  const removedStopwords: string[] = [];
  const words = clean.split(/\s+/);
  const keptWords = words.filter((word, idx) => {
    const lower = word.toLowerCase();
    if (idx > 0 && STOPWORDS_PT.has(lower)) {
      removedStopwords.push(word);
      return false;
    }
    return true;
  });

  const result = keptWords.join(' ');
  return {
    condensedTitle: result.length > maxCharBudget ? result.slice(0, maxCharBudget).trim() : result,
    removedStopwords,
  };
}

// ============================================================================
// 4. ARREDONDAMENTO PSICOLÓGICO (RESPEITA TETO E PISO)
// ============================================================================
export function applyCommercialRounding(
  rawValue: number,
  strategy: RoundingStrategy,
  ceilingPriceFrom?: number,
  floorCostPrice?: number
): number {
  if (!rawValue || rawValue <= 0 || isNaN(rawValue)) return 0;

  let candidate = rawValue;

  switch (strategy) {
    case 'NONE':
      candidate = Math.round(rawValue * 100) / 100;
      break;

    case 'PSYCH_90':
    case 'PSYCH_99':
    case 'PSYCH_49': {
      const ending =
        strategy === 'PSYCH_90' ? 0.90 : strategy === 'PSYCH_99' ? 0.99 : 0.49;
      const intPart = Math.floor(rawValue);
      const upCandidate = Number((intPart + ending).toFixed(2));
      const downCandidate = Number((Math.max(0, intPart - 1) + ending).toFixed(2));

      if (ceilingPriceFrom && upCandidate >= ceilingPriceFrom && downCandidate > 0) {
        candidate = downCandidate;
      } else if (upCandidate - rawValue > 0.35 && downCandidate > 0) {
        candidate = downCandidate;
      } else {
        candidate = upCandidate;
      }
      break;
    }

    case 'INTEGER_UP':
      candidate = Math.ceil(rawValue);
      break;

    case 'INTEGER_DOWN':
      candidate = Math.floor(rawValue);
      break;
  }

  if (
    strategy !== 'NONE' &&
    floorCostPrice &&
    floorCostPrice > 0 &&
    rawValue > floorCostPrice &&
    candidate <= floorCostPrice
  ) {
    return Number((Math.ceil(floorCostPrice) + 0.90).toFixed(2));
  }

  return candidate;
}

// ============================================================================
// 5. VALIDADE TURBO (DESCONTO POR BUCKET DE DIAS)
// ============================================================================
export function computeTurboExpiryDiscountPct(daysLeft?: number): {
  discountPct: number;
  urgencyBadge: string;
} {
  if (daysLeft === undefined || daysLeft === null || isNaN(daysLeft)) {
    return { discountPct: 20, urgencyBadge: 'CONSUMO RÁPIDO • -20%' };
  }
  if (daysLeft <= 1) {
    return { discountPct: 50, urgencyBadge: 'SÓ HOJE • VENCE AMANHÃ (-50%)' };
  }
  if (daysLeft <= 3) {
    return { discountPct: 40, urgencyBadge: `VENCE EM ${daysLeft} DIAS • QUEIMA (-40%)` };
  }
  if (daysLeft <= 7) {
    return { discountPct: 30, urgencyBadge: `VALIDADE PRÓXIMA • ${daysLeft} DIAS (-30%)` };
  }
  if (daysLeft <= 15) {
    return { discountPct: 20, urgencyBadge: `OPORTUNIDADE DE LOTE (-20%)` };
  }
  return { discountPct: 10, urgencyBadge: `LOTE PROMOCIONAL (-10%)` };
}

// ============================================================================
// 6. DETECTOR REGULATÓRIO + VIGÊNCIA PROCON
// ============================================================================
export function detectRegulatoryCategoryByText(
  text: string,
  ncmCode?: string
): RegulatoryCategory {
  const cleanNcm = (ncmCode || '').replace(/\D/g, '');
  if (cleanNcm.length >= 4) {
    if (cleanNcm.startsWith('3808')) {
      return 'AGRO_PESTICIDE';
    }
    if (
      cleanNcm.startsWith('3101') ||
      cleanNcm.startsWith('3102') ||
      cleanNcm.startsWith('3103') ||
      cleanNcm.startsWith('3104') ||
      cleanNcm.startsWith('3105')
    ) {
      return 'AGRO_FERTILIZER_SEED';
    }
    if (cleanNcm.startsWith('300230')) {
      return 'VET_PRESCRIPTION';
    }
    if (
      cleanNcm.startsWith('2203') ||
      cleanNcm.startsWith('2204') ||
      cleanNcm.startsWith('2205') ||
      cleanNcm.startsWith('2206') ||
      cleanNcm.startsWith('2207') ||
      cleanNcm.startsWith('2208')
    ) {
      return 'ALCOHOL_18';
    }
  }

  const normalized = (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (/\bncm\s*[:.]?\s*3808\d*/.test(normalized)) {
    return 'AGRO_PESTICIDE';
  }
  if (/\bncm\s*[:.]?\s*310[1-5]\d*/.test(normalized)) {
    return 'AGRO_FERTILIZER_SEED';
  }

  if (
    /\b(herbicida|erbicida|glifosato|glifozato|glifosatto|inseticida|inceticida|insetecida|fungicida|funjicida|acaricida|nematicida|defensivo|2,4-d|atrazina|paraquat|fipronil|imazetapir|cipermetrina|imidacloprido|mancozebe|clorpirifos|deltametrina|lambda-cialotrina|tebuconazol|abamectina)\b/.test(
      normalized
    )
  ) {
    return 'AGRO_PESTICIDE';
  }

  if (
    /\b(npk|fertilizante|fertilisante|adubo|ureia|cloreto de potassio|superfosfato|calcario|calcareo|semente|sementes|inoculante|inoculane|foliar|20-05-20|10-10-10|04-14-08)\b/.test(
      normalized
    )
  ) {
    return 'AGRO_FERTILIZER_SEED';
  }

  if (
    /\b(vacina|aftosa|aftoza|vermifugo|vermifogo|ivermectina|ivermectna|doramectina|enrofloxacino|fluralaner|sarolaner|afoxolaner|amitraz|antibiotico|oxitetraciclina|oxitetracilina|antipulgas|antipulga|carrapaticida|carrapaticda|endectocida|uso veterinario|injetavel|pour-on)\b/.test(
      normalized
    )
  ) {
    return 'VET_PRESCRIPTION';
  }

  if (/\b(cerveja|vinho|whisky|vodka|cachaca|espumante|gin|chopp|tequila)\b/.test(normalized)) {
    return 'ALCOHOL_18';
  }

  return 'STANDARD';
}

export interface LegalFooterMetadata {
  badgeWarning?: string;
  mandatoryLegalText: string;
  isHighRiskRegulated: boolean;
  bannerColorClass: string;
}

export function getLegalFooterMetadata(
  category: RegulatoryCategory,
  validityText: string,
  mapaCode?: string,
  isNearExpiry = false
): LegalFooterMetadata {
  const regSuffix = mapaCode ? ` • ${mapaCode}` : '';
  const nearExpiryNotice = isNearExpiry
    ? ' LOTE PROMOCIONAL COM DATA DE VALIDADE PRÓXIMA EM PERFEITAS CONDIÇÕES DE USO/CONSUMO (DIRETRIZES PROCON).'
    : '';
  const nearExpiryBadgeSuffix = isNearExpiry ? ' • VALIDADE PRÓXIMA' : '';

  switch (category) {
    case 'AGRO_PESTICIDE':
      return {
        badgeWarning: `VENDA SOB RECEITUÁRIO AGRONÔMICO${nearExpiryBadgeSuffix}`,
        mandatoryLegalText: `ATENÇÃO: PRODUTO PERIGOSO À SAÚDE HUMANA, ANIMAL E AO MEIO AMBIENTE. CONSULTE SEMPRE UM ENGENHEIRO AGRÔNOMO. USO OBRIGATÓRIO DE EPI. LEIA O RÓTULO E DEVOLVA AS EMBALAGENS VAZIAS (LEI FEDERAL Nº 14.785/2023)${regSuffix}.${nearExpiryNotice} ${validityText.toUpperCase()}.`,
        isHighRiskRegulated: true,
        bannerColorClass: 'bg-amber-400 text-black',
      };

    case 'AGRO_FERTILIZER_SEED':
      return {
        badgeWarning: `INSUMO REGISTRADO NO MAPA${nearExpiryBadgeSuffix}`,
        mandatoryLegalText: `PRODUTO CERTIFICADO PELO MINISTÉRIO DA AGRICULTURA E PECUÁRIA (MAPA)${regSuffix}. CONSULTE RECOMENDAÇÃO TÉCNICA DE ADUBAÇÃO/PLANTIO.${nearExpiryNotice} ${validityText.toUpperCase()}.`,
        isHighRiskRegulated: false,
        bannerColorClass: 'bg-emerald-950 text-emerald-100',
      };

    case 'VET_PRESCRIPTION':
      return {
        badgeWarning: `USO EXCLUSIVO VETERINÁRIO${nearExpiryBadgeSuffix}`,
        mandatoryLegalText: `VENDA E APLICAÇÃO SOB ORIENTAÇÃO DO MÉDICO VETERINÁRIO. RESPEITE O PERÍODO DE CARÊNCIA PARA ABATE E LEITE.${nearExpiryNotice} ${validityText.toUpperCase()}.`,
        isHighRiskRegulated: true,
        bannerColorClass: 'bg-sky-950 text-sky-100',
      };

    case 'ALCOHOL_18':
      return {
        badgeWarning: `PROIBIDO PARA MENORES DE 18 ANOS${nearExpiryBadgeSuffix}`,
        mandatoryLegalText: `BEBA COM MODERAÇÃO. SE BEBER, NÃO DIRIJA (LEI Nº 9.294/96).${nearExpiryNotice} ${validityText.toUpperCase()}.`,
        isHighRiskRegulated: true,
        bannerColorClass: 'bg-zinc-900 text-white',
      };

    case 'NEAR_EXPIRY':
      return {
        badgeWarning: 'CONSUMO IMEDIATO • DESPERDÍCIO ZERO',
        mandatoryLegalText: `LOTE PROMOCIONAL COM DATA DE VALIDADE PRÓXIMA EM PERFEITAS CONDIÇÕES DE CONSUMO (CONFORME DIRETRIZES PROCON). ${validityText.toUpperCase()}.`,
        isHighRiskRegulated: false,
        bannerColorClass: 'bg-orange-950 text-orange-100',
      };

    case 'STANDARD':
    default:
      return {
        mandatoryLegalText: `${validityText.toUpperCase()} OU ENQUANTO DURAREM OS ESTOQUES. IMAGENS ILUSTRATIVAS.`,
        isHighRiskRegulated: false,
        bannerColorClass: 'bg-zinc-800 text-zinc-200',
      };
  }
}

export function formatOfferValidityText(
  preset: ValidityPreset,
  customDateISO?: string,
  referenceDate: Date = new Date()
): { text: string; promoDurationDays: number } {
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  switch (preset) {
    case 'TODAY_ONLY':
      return {
        text: `Oferta válida somente hoje (${fmt(referenceDate)})`,
        promoDurationDays: 1,
      };

    case 'WEEKEND': {
      const sunday = new Date(referenceDate);
      const dayOfWeek = sunday.getDay();
      const diffToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      sunday.setDate(sunday.getDate() + diffToSunday);
      return {
        text: `Oferta válida até domingo (${fmt(sunday)})`,
        promoDurationDays: Math.max(1, diffToSunday + 1),
      };
    }

    case 'END_OF_WEEK': {
      const saturday = new Date(referenceDate);
      const dayOfWeek = saturday.getDay();
      const diffToSaturday = 6 - dayOfWeek;
      saturday.setDate(saturday.getDate() + diffToSaturday);
      return {
        text: `Oferta válida até sábado (${fmt(saturday)})`,
        promoDurationDays: Math.max(1, diffToSaturday + 1),
      };
    }

    case 'END_OF_MONTH': {
      const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      const diffDays = Math.max(
        1,
        Math.round((lastDay.getTime() - referenceDate.getTime()) / 86400000)
      );
      return {
        text: `Oferta válida até ${fmt(lastDay)}`,
        promoDurationDays: diffDays,
      };
    }

    case 'CUSTOM_DATE': {
      if (customDateISO) {
        const [y, m, d] = customDateISO.split('-').map(Number);
        if (y && m && d) {
          const target = new Date(y, m - 1, d, 23, 59, 59);
          const diffDays = Math.ceil(
            (target.getTime() - referenceDate.getTime()) / 86400000
          );
          return {
            text: `Oferta válida até ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
            promoDurationDays: diffDays,
          };
        }
      }
      return { text: `Oferta válida até ${fmt(referenceDate)}`, promoDurationDays: 1 };
    }
  }
}

// ============================================================================
// 7. FINGERPRINT FORENSE DETERMINÍSTICO (USA PREÇO FINAL EFETIVO + UNIDADE + MECÂNICA)
// ============================================================================
export function generateForensicFingerprint(
  offer: OfferItemState,
  effectiveUnitPrice: number,
  companyName = 'REDE'
): string {
  const canonical = [
    companyName.trim().toUpperCase(),
    (offer.skuCode || 'NOSKU').trim().toUpperCase(),
    (offer.cleanedTitle || offer.rawTitle || '').trim().toUpperCase(),
    (offer.priceFrom || 0).toFixed(2),
    effectiveUnitPrice.toFixed(2),
    offer.unit,
    offer.mechanicType,
    offer.roundingStrategy,
    offer.regulatoryCategory,
    offer.validityPreset,
  ].join('::');

  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const base36 = (hash >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
  return `AP-${base36.slice(0, 4)}-${base36.slice(4, 7)}`;
}

// ============================================================================
// 8. MOTOR DE GUARDRAILS (SEM FALSO POSITIVO EM PREÇO ZERO)
// ============================================================================
export function evaluateOfferGuardrails(
  offer: OfferItemState,
  effectiveUnitPrice: number,
  discountPercentage: number,
  promoDurationDays: number,
  removedStopwords: string[],
  brandKit?: TenantBrandKit
): {
  status: GuardrailSeverity;
  canExport: boolean;
  governanceScore: number;
  findings: GuardrailFinding[];
} {
  const findings: GuardrailFinding[] = [];
  const title = (offer.cleanedTitle || offer.rawTitle || '').trim();

  if (!title || effectiveUnitPrice <= 0) {
    findings.push({
      id: 'R01',
      code: 'EMPTY_REQUIRED_FIELD',
      severity: 'block',
      message: 'Título do produto e preço final maior que R$ 0,00 são obrigatórios.',
    });
  }

  if (effectiveUnitPrice > 0 && offer.priceFrom && offer.priceFrom <= effectiveUnitPrice) {
    findings.push({
      id: 'R02',
      code: 'PRICE_INVERTED',
      severity: 'block',
      message: `Preço POR (R$ ${effectiveUnitPrice.toFixed(2)}) não pode ser maior ou igual ao preço DE (R$ ${offer.priceFrom.toFixed(2)}).`,
      legalRef: 'CDC Art. 37 / Decreto 11.187/22',
    });
  }

  const minMarginPct = brandKit?.minMarginPct ?? 12;
  if (effectiveUnitPrice > 0 && offer.costPrice && offer.costPrice > 0) {
    const marginPct = ((effectiveUnitPrice - offer.costPrice) / effectiveUnitPrice) * 100;
    const minRecommendedPrice = offer.costPrice / (1 - minMarginPct / 100);

    if (effectiveUnitPrice <= offer.costPrice) {
      findings.push({
        id: 'R03',
        code: 'BELOW_COST_MARGIN',
        severity: 'block',
        message: `BLOQUEIO DE PREJUÍZO: Preço final (R$ ${effectiveUnitPrice.toFixed(2)}) está abaixo ou igual ao custo (R$ ${offer.costPrice.toFixed(2)}). Mínimo sugerido: R$ ${minRecommendedPrice.toFixed(2)}.`,
      });
    } else if (marginPct < minMarginPct) {
      findings.push({
        id: 'R03-W',
        code: 'LOW_MARGIN_WARN',
        severity: 'warn',
        message: `Margem apertada (${marginPct.toFixed(1)}%). Abaixo da meta da rede (${minMarginPct}%).`,
      });
    }
  }

  // Só avalia degraus de desconto quando effectiveUnitPrice > 0 (evita ruído de 100% OFF em preço 0)
  const maxApproval = brandKit?.maxDiscountApprovalPct ?? 40;
  const hardMaxBlock = brandKit?.hardMaxDiscountBlockPct ?? 65;

  if (effectiveUnitPrice > 0 && offer.mechanicType !== 'TURBO_EXPIRY') {
    if (discountPercentage >= hardMaxBlock) {
      findings.push({
        id: 'R04',
        code: 'HARD_MAX_DISCOUNT',
        severity: 'block',
        message: `Desconto de ${discountPercentage}% atinge ou excede o limite de segurança (${hardMaxBlock}%). Confira se há erro de digitação.`,
      });
    } else if (discountPercentage > maxApproval) {
      findings.push({
        id: 'R04-A',
        code: 'APPROVAL_DISCOUNT',
        severity: 'approval',
        message: `Desconto agressivo (${discountPercentage}% OFF). Acima de ${maxApproval}% requer atenção.`,
      });
    }
  }

  if (offer.validityPreset === 'CUSTOM_DATE' && promoDurationDays <= 0) {
    findings.push({
      id: 'R05-EXPIRED',
      code: 'EXPIRES_BEFORE_PROMO',
      severity: 'block',
      message: `BLOQUEIO DE VIGÊNCIA: A data personalizada da oferta (${offer.customValidityDateISO}) já está vencida no calendário.`,
      legalRef: 'PROCON / CDC Art. 37',
    });
  } else if (
    offer.nearExpiryDaysLeft !== undefined &&
    offer.nearExpiryDaysLeft > 0 &&
    offer.nearExpiryDaysLeft < promoDurationDays
  ) {
    findings.push({
      id: 'R05',
      code: 'EXPIRES_BEFORE_PROMO',
      severity: 'warn',
      message: `O lote vence em ${offer.nearExpiryDaysLeft} dia(s), mas a vigência da oferta é de ${promoDurationDays} dia(s).`,
      legalRef: 'PROCON / CDC Art. 18',
    });
  }

  const bannedWords = brandKit?.bannedWords ?? [
    'cura',
    '100% seguro',
    'não tóxico',
    'nao toxico',
    'milagroso',
    'menor preço da cidade',
  ];
  const fullCopy = `${title} ${offer.subtitle || ''} ${offer.ctaText || ''}`.toLowerCase();
  for (const banned of bannedWords) {
    if (fullCopy.includes(banned.toLowerCase())) {
      findings.push({
        id: 'R06',
        code: 'BANNED_WORD',
        severity: 'block',
        message: `Termo proibido pelo compliance detectado: "${banned.toUpperCase()}".`,
        legalRef: 'CONAR / MAPA',
      });
    }
  }

  if (removedStopwords.length > 0) {
    findings.push({
      id: 'R07',
      code: 'COPY_CONDENSED',
      severity: 'ok',
      message: `Título otimizado (${removedStopwords.length} conectivo(s) removido(s)).`,
    });
  }

  const hasBlock = findings.some((f) => f.severity === 'block');
  const hasApproval = findings.some((f) => f.severity === 'approval');
  const hasWarn = findings.some((f) => f.severity === 'warn');

  const status: GuardrailSeverity = hasBlock
    ? 'block'
    : hasApproval
      ? 'approval'
      : hasWarn
        ? 'warn'
        : 'ok';

  const blockCount = findings.filter((f) => f.severity === 'block').length;
  const warnCount = findings.filter((f) => f.severity === 'warn' || f.severity === 'approval').length;
  const governanceScore = Math.max(0, 100 - blockCount * 34 - warnCount * 11);

  return {
    status,
    canExport: !hasBlock,
    governanceScore,
    findings,
  };
}

// ============================================================================
// 9. CALCULADORA COMERCIAL COMPLETA
// ============================================================================
export interface ComputedOfferMetrics {
  finalPriceTo: number;
  effectiveUnitPrice: number;
  discountPercentage: number;
  integerPart: string;
  centsPart: string;
  installmentCount: number;
  installmentValue: number;
  installmentIntegerPart: string;
  installmentCentsPart: string;
  installmentLabelText: string;
  cashTotalFormatted: string;
  conditionHeadlineText: string;
  recommendedArchetype: PosterLayoutArchetype;
  condensedTitle: string;
  removedStopwords: string[];
  pricePerKgOrLiterText?: string;
  mechanicBadgeText?: string;
  mechanicSubText?: string;
  validityFormatted: string;
  promoDurationDays: number;
  legalFooter: LegalFooterMetadata;
  forensicId: string;
  canExport: boolean;
  guardrailStatus: GuardrailSeverity;
  governanceScore: number;
  guardrailFindings: GuardrailFinding[];
}

export function computeOfferMetrics(
  offer: OfferItemState,
  mapaCode?: string,
  brandKit?: TenantBrandKit
): ComputedOfferMetrics {
  const finalPriceTo = applyCommercialRounding(
    offer.priceToRaw,
    offer.roundingStrategy,
    offer.priceFrom,
    offer.costPrice
  );

  let effectiveUnitPrice = finalPriceTo;
  let mechanicBadgeText: string | undefined = undefined;
  let mechanicSubText: string | undefined = undefined;

  const installmentCount = Math.max(2, Math.min(24, Math.round(offer.installmentCount || 6)));
  const installmentInterestFree = offer.installmentInterestFree ?? true;
  const installmentValue =
    finalPriceTo > 0 ? Number((finalPriceTo / installmentCount).toFixed(2)) : 0;
  const [installmentIntegerPart, installmentCentsPart] = installmentValue.toFixed(2).split('.');
  const installmentLabelText = installmentInterestFree
    ? `EM ATÉ ${installmentCount}X SEM JUROS`
    : `PARCELADO EM ATÉ ${installmentCount}X`;
  const cashTotalFormatted = `R$ ${formatBRL(finalPriceTo)}`;

  if (
    offer.mechanicType === 'TAKE_X_PAY_Y' &&
    offer.takeQty > offer.payQty &&
    offer.payQty > 0
  ) {
    effectiveUnitPrice = Number(((finalPriceTo * offer.payQty) / offer.takeQty).toFixed(2));
    const totalSaved = Number(
      (finalPriceTo * offer.takeQty - finalPriceTo * offer.payQty).toFixed(2)
    );
    mechanicBadgeText =
      offer.takeQty === 2 && offer.payQty === 1
        ? 'LEVE 2 PAGUE 1 (COMPRE 2 PELO PREÇO DE 1)'
        : `LEVE ${offer.takeQty} PAGUE ${offer.payQty}`;

    let measureInfo = '';
    if (offer.netWeightOrVolume && offer.netWeightOrVolume > 0) {
      const pricePerMeasure =
        (finalPriceTo * offer.payQty) / (offer.netWeightOrVolume * offer.takeQty);
      const measureLabel = offer.unit === 'LT' ? 'Litro' : 'KG';
      measureInfo = ` • R$ ${formatBRL(pricePerMeasure)}/${measureLabel}`;
    }

    mechanicSubText = `Nesta oferta cada ${offer.unit} sai por R$ ${formatBRL(
      effectiveUnitPrice
    )}${measureInfo} (Economize R$ ${formatBRL(totalSaved)})`;
  } else if (offer.mechanicType === 'SECOND_UNIT_50') {
    const discountPct = offer.secondUnitDiscountPercent ?? 50;
    effectiveUnitPrice = Number((finalPriceTo * (1 - discountPct / 200)).toFixed(2));
    mechanicBadgeText = `2ª UNIDADE COM ${discountPct}% OFF`;
    mechanicSubText = `Levando 2, cada ${offer.unit} sai por R$ ${formatBRL(effectiveUnitPrice)}`;
  } else if (offer.mechanicType === 'TURBO_EXPIRY') {
    const turbo = computeTurboExpiryDiscountPct(offer.nearExpiryDaysLeft);
    const baseRef = offer.priceFrom && offer.priceFrom > 0 ? offer.priceFrom : finalPriceTo;
    effectiveUnitPrice = applyCommercialRounding(
      baseRef * (1 - turbo.discountPct / 100),
      offer.roundingStrategy === 'NONE' ? 'PSYCH_90' : offer.roundingStrategy,
      baseRef,
      offer.costPrice
    );
    mechanicBadgeText = turbo.urgencyBadge;
    mechanicSubText = `Lote revisado para consumo imediato • Desperdício Zero`;
  } else if (offer.mechanicType === 'WHOLESALE_VOLUME' && offer.minWholesaleQty > 1) {
    mechanicBadgeText = `PREÇO ESPECIAL A PARTIR DE ${offer.minWholesaleQty} ${offer.unit}`;
    if (offer.priceFrom && offer.priceFrom > finalPriceTo) {
      mechanicSubText = `Valor unitário avulso: R$ ${formatBRL(offer.priceFrom)}`;
    }
  } else if (offer.mechanicType === 'LOYALTY_CLUB') {
    mechanicBadgeText = `PREÇO EXCLUSIVO CLUBE / CLIENTE CADASTRADO`;
  } else if (offer.mechanicType === 'INSTALLMENT_FINANCING') {
    mechanicBadgeText = installmentLabelText;
    mechanicSubText = `Preço à vista: ${cashTotalFormatted} (${installmentCount}x de R$ ${formatBRL(
      installmentValue
    )}${installmentInterestFree ? ' sem juros' : ''})`;
  } else if (offer.mechanicType === 'BUY_WIN_GIFT') {
    const giftText = (offer.giftOrConditionText || 'COMPRE 1 E GANHE BRINDE EXCLUSIVO')
      .trim()
      .toUpperCase();
    mechanicBadgeText = giftText;
    mechanicSubText = `Promoção especial válida enquanto durarem os estoques`;
  }

  const referenceOriginal =
    offer.priceFrom && offer.priceFrom > effectiveUnitPrice
      ? offer.priceFrom
      : offer.mechanicType === 'TAKE_X_PAY_Y' || offer.mechanicType === 'SECOND_UNIT_50'
        ? finalPriceTo
        : 0;

  const discountPercentage =
    effectiveUnitPrice > 0 && referenceOriginal > effectiveUnitPrice
      ? Math.round(((referenceOriginal - effectiveUnitPrice) / referenceOriginal) * 100)
      : 0;

  const [integerPart, centsPart] = effectiveUnitPrice.toFixed(2).split('.');

  let pricePerKgOrLiterText: string | undefined = undefined;
  if (offer.netWeightOrVolume && offer.netWeightOrVolume > 0 && effectiveUnitPrice > 0) {
    let perMeasure: number;
    if (offer.mechanicType === 'TAKE_X_PAY_Y' && offer.takeQty > 0 && offer.payQty > 0) {
      // Decreto 5.903/2006: Preço por kg = (Preço Unitário x Qtd Paga) / (Peso Unitário x Qtd Levada)
      perMeasure = (finalPriceTo * offer.payQty) / (offer.netWeightOrVolume * offer.takeQty);
    } else {
      perMeasure = effectiveUnitPrice / offer.netWeightOrVolume;
    }
    const baseMeasureLabel = offer.unit === 'LT' ? 'Litro' : 'KG';
    pricePerKgOrLiterText = `Equivale a R$ ${formatBRL(perMeasure)}/${baseMeasureLabel}`;
  }

  const conditionHeadlineText =
    offer.mechanicType === 'BUY_WIN_GIFT'
      ? (offer.giftOrConditionText || 'COMPRE 1 E GANHE BRINDE EXCLUSIVO').trim().toUpperCase()
      : offer.mechanicType === 'TAKE_X_PAY_Y'
        ? offer.takeQty === 2 && offer.payQty === 1
          ? 'COMPRE 2 PELO PREÇO DE 1'
          : `LEVE ${offer.takeQty} PAGUE ${offer.payQty}`
        : offer.mechanicType === 'SECOND_UNIT_50'
          ? `2ª UNIDADE COM ${offer.secondUnitDiscountPercent ?? 50}% OFF`
          : offer.mechanicType === 'WHOLESALE_VOLUME'
            ? `ATACADO A PARTIR DE ${offer.minWholesaleQty} ${offer.unit}`
            : offer.mechanicType === 'LOYALTY_CLUB'
              ? 'EXCLUSIVO CLUBE / CLIENTE CADASTRADO'
              : offer.mechanicType === 'INSTALLMENT_FINANCING'
                ? `${installmentLabelText} DE R$ ${formatBRL(installmentValue)}`
                : offer.giftOrConditionText
                  ? offer.giftOrConditionText.trim().toUpperCase()
                  : discountPercentage > 0
                    ? `ECONOMIA IMEDIATA DE ${discountPercentage}% OFF`
                    : 'CONDIÇÃO ESPECIAL DE BALCÃO';

  const recommendedArchetype = resolveRecommendedArchetype(
    offer.mechanicType,
    offer.priceFrom,
    effectiveUnitPrice
  );

  const { text: validityFormatted, promoDurationDays } = formatOfferValidityText(
    offer.validityPreset,
    offer.customValidityDateISO
  );

  const isTurboExpiry =
    offer.mechanicType === 'TURBO_EXPIRY' || offer.regulatoryCategory === 'NEAR_EXPIRY';
  // Crítico (P0): Se o produto for regulado (Defensivo MAPA, Receita Vet, Bebida +18, Fertilizante),
  // a mecânica TURBO_EXPIRY NUNCA pode apagar o alerta regulatório obrigatório!
  const effectiveCategory: RegulatoryCategory =
    offer.regulatoryCategory !== 'STANDARD'
      ? offer.regulatoryCategory
      : isTurboExpiry
        ? 'NEAR_EXPIRY'
        : 'STANDARD';

  const legalFooter = getLegalFooterMetadata(
    effectiveCategory,
    validityFormatted,
    mapaCode,
    isTurboExpiry && effectiveCategory !== 'NEAR_EXPIRY'
  );

  const { condensedTitle, removedStopwords } = condenseProductTitle(
    offer.cleanedTitle || offer.rawTitle || 'PRODUTO EM OFERTA'
  );

  const forensicId = generateForensicFingerprint(
    offer,
    effectiveUnitPrice,
    brandKit?.companyName
  );

  const guardrails = evaluateOfferGuardrails(
    offer,
    effectiveUnitPrice,
    discountPercentage,
    promoDurationDays,
    removedStopwords,
    brandKit
  );

  return {
    finalPriceTo,
    effectiveUnitPrice,
    discountPercentage,
    integerPart,
    centsPart,
    installmentCount,
    installmentValue,
    installmentIntegerPart,
    installmentCentsPart,
    installmentLabelText,
    cashTotalFormatted,
    conditionHeadlineText,
    recommendedArchetype,
    condensedTitle,
    removedStopwords,
    pricePerKgOrLiterText,
    mechanicBadgeText,
    mechanicSubText,
    validityFormatted,
    promoDurationDays,
    legalFooter,
    forensicId,
    canExport: guardrails.canExport,
    guardrailStatus: guardrails.status,
    governanceScore: guardrails.governanceScore,
    guardrailFindings: guardrails.findings,
  };
}

// ============================================================================
// 10. SMART PASTE DO WHATSAPP (CORRIGIDO PARA TODOS OS 7 CASOS DO TESTE CLAUDE + PARCELAMENTO & BRINDES)
// ============================================================================
export interface SmartPasteResult {
  cleanedTitle: string;
  unit: string;
  netWeightOrVolume?: number;
  priceFrom?: number;
  priceTo: number;
  validityPreset: ValidityPreset;
  mechanicType: CommercialMechanicType;
  takeQty: number;
  payQty: number;
  installmentCount?: number;
  giftOrConditionText?: string;
  recommendedArchetype: PosterLayoutArchetype;
  nearExpiryDaysLeft?: number;
  regulatoryCategory: RegulatoryCategory;
  confidenceScore: number;
}

// Expressão que casa números com unidades físicas/embalagens (Ex: "10.1kg", "50 doses", "350ml", "16L")
const PHYSICAL_MEASURE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:kg|quilos?|g|gr|gramas?|mg|l|lt|litros?|ml|sc|sacos?|sacas?|ton|un|unid|unidades?|doses?|ds|frascos?|cx|caixas?|pct|pacotes?|fd|fardos?|comp|comprimidos?|caps|m|cm|mm|v|volts?|w|watts?|hp|cv|dias?|%|anos?|meses)\b/gi;

// Expressão que casa fórmulas NPK, químicos e códigos de modelo de maquinário (Ex: "10-10-10", "2,4-D", "TRF 400")
const FORMULA_CODE_PATTERN =
  /\b(?:\d{1,2}\s*-\s*\d{1,2}\s*-\s*\d{1,2}|2[.,]4-d|(?:trf|mod|modelo)\s*\d{2,4})\b/gi;

// Expressão para valor monetário brasileiro (Suporta milhar "1.299,90", decimal "58,00" ou inteiro)
const BRL_NUMBER_RAW =
  '(?:\\d{1,3}(?:\\.\\d{3})+,\\d{2}|\\d{1,5}[.,]\\d{2}|\\d{1,3}(?:\\.\\d{3})+|\\d{1,4})';

export function parseWhatsAppSmartPaste(rawMessage: string): SmartPasteResult | null {
  if (!rawMessage || rawMessage.trim().length < 3) return null;

  const text = rawMessage.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  // 1. Detecta "vence em X dias"
  let nearExpiryDaysLeft: number | undefined = undefined;
  const expiryMatch = lower.match(/vence\s*(?:em\s*)?(\d{1,2})\s*d(?:ias?)?/i);
  if (expiryMatch) {
    nearExpiryDaysLeft = parseInt(expiryMatch[1], 10);
  } else if (lower.includes('vence amanhã') || lower.includes('vence amanha')) {
    nearExpiryDaysLeft = 1;
  }

  // 2. Detecta Mecânicas Comerciais ("Leve X Pague Y", "Compre 2 pelo preço de 1", "Parcelado em Xx", "Compre e Ganhe")
  let mechanicType: CommercialMechanicType =
    nearExpiryDaysLeft !== undefined ? 'TURBO_EXPIRY' : 'SIMPLE_DE_POR';
  let takeQty = 3;
  let payQty = 2;
  let installmentCount: number | undefined = undefined;
  let explicitInstallmentUnitValue: number | undefined = undefined;
  let giftOrConditionText: string | undefined = undefined;

  const takePayMatch = lower.match(/leve\s*(\d{1,2})\s*pague\s*(\d{1,2})/i);
  const buyXForYMatch = lower.match(/compre\s*(\d{1,2})\s*pelo\s*pre[cç]o\s*de\s*(\d{1,2})/i);
  const payYTakeXMatch = lower.match(/pague\s*(\d{1,2})\s*leve\s*(\d{1,2})/i);

  const installmentWithValRegex = new RegExp(
    `(?:em\\s*(?:at[eé]\\s*)?)?(\\d{1,2})\\s*x\\s*(?:sem\\s*juros\\s*)?(?:de\\s*)?(?:R\\$\\s*)?(${BRL_NUMBER_RAW})\\b`,
    'i'
  );
  const installmentWithValMatch = installmentWithValRegex.exec(text);
  const installmentCountOnlyMatch = lower.match(
    /(?:em\s*(?:at[eé]\s*)?)?(\d{1,2})\s*x(?:\s*sem\s*juros|\s*no\s*cart[aã]o|\b)/i
  );

  const giftMatch = text.match(
    /\b(?:e\s+)?ganhe\s+(?:gr[aá]tis\s+)?([a-zA-Z0-9À-ÿ\s]{2,35})/i
  );

  if (takePayMatch) {
    mechanicType = 'TAKE_X_PAY_Y';
    takeQty = parseInt(takePayMatch[1], 10);
    payQty = parseInt(takePayMatch[2], 10);
  } else if (buyXForYMatch) {
    mechanicType = 'TAKE_X_PAY_Y';
    takeQty = parseInt(buyXForYMatch[1], 10);
    payQty = parseInt(buyXForYMatch[2], 10);
  } else if (payYTakeXMatch) {
    mechanicType = 'TAKE_X_PAY_Y';
    payQty = parseInt(payYTakeXMatch[1], 10);
    takeQty = parseInt(payYTakeXMatch[2], 10);
  } else if (lower.includes('2ª unidade') || lower.includes('segunda unidade')) {
    mechanicType = 'SECOND_UNIT_50';
  } else if (installmentWithValMatch) {
    mechanicType = 'INSTALLMENT_FINANCING';
    installmentCount = parseInt(installmentWithValMatch[1], 10);
    explicitInstallmentUnitValue = parsePriceNumber(installmentWithValMatch[2]);
  } else if (installmentCountOnlyMatch) {
    mechanicType = 'INSTALLMENT_FINANCING';
    installmentCount = parseInt(installmentCountOnlyMatch[1], 10);
  } else if (giftMatch) {
    mechanicType = 'BUY_WIN_GIFT';
    const rawGift = giftMatch[1]
      .replace(/\b(?:por|pra|de|r\$|\d+[.,]\d{2}).*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    giftOrConditionText = `GANHE ${rawGift.toUpperCase()}`;
  }

  // 3. Cria uma string espelho mascarando medidas físicas (10.1kg, 50 doses), NPK (10-10-10),
  // códigos de máquina (TRF 400), datas, "10x" e "leve X pague Y" para que NUNCA sejam lidos como preços!
  const maskedForPriceSearch = text
    .replace(FORMULA_CODE_PATTERN, (m) => ' '.repeat(m.length))
    .replace(/vence\s*(?:em\s*)?\d{1,2}\s*d(?:ias?)?/gi, (m) => ' '.repeat(m.length))
    .replace(/leve\s*\d{1,2}\s*pague\s*\d{1,2}/gi, (m) => ' '.repeat(m.length))
    .replace(/compre\s*\d{1,2}\s*pelo\s*pre[cç]o\s*de\s*\d{1,2}/gi, (m) => ' '.repeat(m.length))
    .replace(/pague\s*\d{1,2}\s*leve\s*\d{1,2}/gi, (m) => ' '.repeat(m.length))
    .replace(/\b(?:em\s*(?:at[eé]\s*)?)?\d{1,2}\s*x\b/gi, (m) => ' '.repeat(m.length))
    .replace(/\bcompre\s*\d{1,2}\s*(?:e\s*)?ganhe\b/gi, (m) => ' '.repeat(m.length))
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, (m) => ' '.repeat(m.length))
    .replace(PHYSICAL_MEASURE_PATTERN, (m) => ' '.repeat(m.length));

  let priceFrom: number | undefined = undefined;
  let priceTo = 0;
  const matchedPriceSpans: { start: number; end: number }[] = [];

  // 3A. Tenta primeiro o padrão explícito de par promocional: "[de] [R$] X por/pra [R$] Y"
  const pairRegex = new RegExp(
    `(?:\\bde\\s+)?(?:R\\$\\s*)?(${BRL_NUMBER_RAW})\\s*(?:por|pra|para)\\s*(?:R\\$\\s*)?(${BRL_NUMBER_RAW})\\b`,
    'i'
  );
  const pairMatch = pairRegex.exec(maskedForPriceSearch);

  if (pairMatch && pairMatch.index !== undefined) {
    const val1 = parsePriceNumber(pairMatch[1]);
    const val2 = parsePriceNumber(pairMatch[2]);
    if (val1 > 0 && val2 > 0) {
      priceFrom = Math.max(val1, val2);
      priceTo = Math.min(val1, val2);
      matchedPriceSpans.push({
        start: pairMatch.index,
        end: pairMatch.index + pairMatch[0].length,
      });
    }
  }

  // 3B. Se não achou par "X por Y", busca preços individuais na string mascarada
  if (priceTo <= 0) {
    const singleRegex = new RegExp(
      `(?:(?:por|pra|a|de)\\s*(?:apenas\\s*)?)?(?:R\\$\\s*)(${BRL_NUMBER_RAW})\\b|(?:\\b(?:por|pra|apenas)\\s+)(${BRL_NUMBER_RAW})\\b|(\\d{1,3}(?:\\.\\d{3})+,\\d{2}|\\d{1,5}[.,]\\d{2})\\b`,
      'gi'
    );

    const foundPrices: { val: number; start: number; end: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = singleRegex.exec(maskedForPriceSearch)) !== null) {
      const numStr = m[1] || m[2] || m[3];
      const val = parsePriceNumber(numStr);
      if (val > 0) {
        foundPrices.push({
          val,
          start: m.index,
          end: m.index + m[0].length,
        });
      }
    }

    if (foundPrices.length === 0) return null;

    if (foundPrices.length >= 2) {
      const lastTwo = foundPrices.slice(-2);
      const hi = Math.max(lastTwo[0].val, lastTwo[1].val);
      const lo = Math.min(lastTwo[0].val, lastTwo[1].val);
      // Se for parcelado e o maior preço for exatamente o total das parcelas (ex: "1.899,00 em 10x de 189,90"),
      // o maior é o preço à vista (priceTo) e o menor é a parcela!
      if (
        mechanicType === 'INSTALLMENT_FINANCING' &&
        installmentCount &&
        Math.abs(hi - lo * installmentCount) <= 1.5
      ) {
        priceTo = hi;
      } else {
        priceFrom = hi;
        priceTo = lo;
      }
      matchedPriceSpans.push(...lastTwo.map((p) => ({ start: p.start, end: p.end })));
    } else {
      const singleVal = foundPrices[0].val;
      if (
        mechanicType === 'INSTALLMENT_FINANCING' &&
        installmentCount &&
        explicitInstallmentUnitValue &&
        Math.abs(singleVal - explicitInstallmentUnitValue) < 0.05
      ) {
        priceTo = Number((explicitInstallmentUnitValue * installmentCount).toFixed(2));
      } else {
        priceTo = singleVal;
      }
      matchedPriceSpans.push({ start: foundPrices[0].start, end: foundPrices[0].end });
    }
  }

  // 4. Detecta Vigência
  let validityPreset: ValidityPreset = 'END_OF_WEEK';
  if (lower.includes('hoje') || lower.includes('relâmpago') || lower.includes('relampago')) {
    validityPreset = 'TODAY_ONLY';
  } else if (lower.includes('fim de semana') || lower.includes('domingo')) {
    validityPreset = 'WEEKEND';
  } else if (lower.includes('mês') || lower.includes('mes')) {
    validityPreset = 'END_OF_MONTH';
  }

  // 5. Reconstrói o Título removendo os spans exatos de preço (incluindo R$ e milhar)
  let titleChars = text.split('');
  for (const span of matchedPriceSpans) {
    for (let i = span.start; i < span.end; i++) {
      titleChars[i] = ' ';
    }
  }

  let titleCandidate = titleChars
    .join('')
    // Remove frases de parcelamento e brindes já extraídas
    .replace(
      /\b(?:em\s*(?:at[eé]\s*)?)?\d{1,2}\s*x(?:\s*sem\s*juros)?(?:\s*no\s*cart[aã]o)?\b/gi,
      ' '
    )
    .replace(/\bsem\s+juros\b|\bno\s+cart[aã]o\b/gi, ' ')
    .replace(/compre\s*\d{1,2}\s*pelo\s*pre[cç]o\s*de\s*\d{1,2}/gi, ' ')
    .replace(/pague\s*\d{1,2}\s*leve\s*\d{1,2}/gi, ' ')
    .replace(
      /\b(?:compre\s+)?(?:e\s+)?ganhe\s+(?:gr[aá]tis\s+)?[a-zA-Z0-9À-ÿ\s]{2,35}/gi,
      ' '
    )
    // Remove frases inteiras de vigência e comandos de WhatsApp
    .replace(
      /\b(?:at[eé]\s+o\s+fi(?:m|nal)\s+do\s+m[eê]s|neste\s+fim\s+de\s+semana|no\s+fim\s+de\s+semana|at[eé]\s+(?:s[aá]bado|domingo|sexta)|s[oó]\s+hoje|somente\s+hoje|vence\s*(?:em\s*)?\d{1,2}\s*d(?:ias?)?|leve\s*\d{1,2}\s*pague\s*\d{1,2})\b/gi,
      ' '
    )
    .replace(
      /\b(?:galera|pessoal|aten[cç][aã]o|baixa|baixou|coloca|faz|cartaz|oferta|promo[cç][aã]o|apenas|por|pra|de|em|r\$)\b/gi,
      ' '
    )
    .replace(/[…]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '')
    // Remove artigos soltos que ficaram no início da frase (ex: "a Ração" -> "Ração")
    .replace(/^(?:a|o|as|os|um|uma|do|da|no|na)\s+/i, '')
    .trim();

  const { cleanedTitle, extractedUnit, extractedMeasure } = cleanErpProductTitle(titleCandidate);
  const regulatoryCategory = detectRegulatoryCategoryByText(cleanedTitle || rawMessage);
  const recommendedArchetype = resolveRecommendedArchetype(mechanicType, priceFrom, priceTo);

  return {
    cleanedTitle: cleanedTitle || 'Produto em Oferta',
    unit: extractedUnit,
    netWeightOrVolume: extractedMeasure,
    priceFrom,
    priceTo,
    validityPreset,
    mechanicType,
    takeQty,
    payQty,
    installmentCount,
    giftOrConditionText,
    recommendedArchetype,
    nearExpiryDaysLeft,
    regulatoryCategory,
    confidenceScore: priceFrom ? 0.96 : 0.92,
  };
}

// ============================================================================
// 11. PRESETS WHITE-LABEL HOMOLOGADOS (TIPOGRAFIA & SEGMENTOS SEM HARDCODE)
// ============================================================================
export interface WhiteLabelTypographyPreset {
  id: TypographyPresetId;
  label: string;
  segmentHint: string;
  fontHeading: string;
  fontBody: string;
  enabled?: boolean;
}

export const WHITE_LABEL_TYPOGRAPHY_PRESETS: WhiteLabelTypographyPreset[] = [
  {
    id: 'INDUSTRIAL_IMPACT',
    label: 'Impacto Varejo (Montserrat + Inter)',
    segmentHint: 'Padrão multi-segmento de leitura ultra-rápida a 2m',
    fontHeading: "'Montserrat', 'Arial Black', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    enabled: false,
  },
  {
    id: 'AGRO_ROBUST',
    label: 'Agro & Maquinário (Oswald + Roboto)',
    segmentHint: 'Condensada forte ideal para máquinas, peças e cooperativas',
    fontHeading: "'Oswald', 'Impact', 'Arial Narrow', sans-serif",
    fontBody: "'Roboto', system-ui, sans-serif",
    enabled: false,
  },
  {
    id: 'RETAIL_CLASSIC',
    label: 'Supermercado & Açougue (Poppins + Open Sans)',
    segmentHint: 'Geométrica amigável para giro diário, padaria e hortifrúti',
    fontHeading: "'Poppins', 'Arial Black', sans-serif",
    fontBody: "'Open Sans', system-ui, sans-serif",
    enabled: false,
  },
  {
    id: 'TECH_PRECISION',
    label: 'Técnico & Farmácia Vet (Archivo + Public Sans)',
    segmentHint: 'Alta precisão para defensivos, medicamentos e atacado',
    fontHeading: "'Archivo Black', 'Impact', sans-serif",
    fontBody: "'Public Sans', system-ui, sans-serif",
    enabled: false,
  },
];

export interface WhiteLabelSegmentPreset {
  id: string;
  label: string;
  emoji: string;
  typographyPresetId: TypographyPresetId;
  dept1: {
    label: string;
    iconKey: string;
    primaryColorHex: string;
    secondaryColorHex: string;
    accentColorHex: string;
  };
  dept2: {
    label: string;
    iconKey: string;
    primaryColorHex: string;
    secondaryColorHex: string;
    accentColorHex: string;
  };
}

export const WHITE_LABEL_SEGMENT_PRESETS: WhiteLabelSegmentPreset[] = [
  {
    id: 'AGRO_VET',
    label: 'Agropecuária & Cooperativa',
    emoji: '🚜',
    typographyPresetId: 'AGRO_ROBUST',
    dept1: {
      label: 'Agro & Maquinários',
      iconKey: 'leaf',
      primaryColorHex: '#064e3b',
      secondaryColorHex: '#14532d',
      accentColorHex: '#f59e0b',
    },
    dept2: {
      label: 'Pet & Veterinária',
      iconKey: 'heart',
      primaryColorHex: '#1e3a8a',
      secondaryColorHex: '#0f172a',
      accentColorHex: '#10b981',
    },
  },
  {
    id: 'SUPERMARKET_MEAT',
    label: 'Supermercado & Açougue',
    emoji: '🛒',
    typographyPresetId: 'RETAIL_CLASSIC',
    dept1: {
      label: 'Supermercado & Giro',
      iconKey: 'cart',
      primaryColorHex: '#991b1b',
      secondaryColorHex: '#7f1d1d',
      accentColorHex: '#facc15',
    },
    dept2: {
      label: 'Açougue & Hortifrúti',
      iconKey: 'meat',
      primaryColorHex: '#166534',
      secondaryColorHex: '#14532d',
      accentColorHex: '#fb923c',
    },
  },
  {
    id: 'HARDWARE_MACHINERY',
    label: 'Ferragens, Máquinas & Construção',
    emoji: '🛠️',
    typographyPresetId: 'INDUSTRIAL_IMPACT',
    dept1: {
      label: 'Máquinas & Ferramentas',
      iconKey: 'tool',
      primaryColorHex: '#0f172a',
      secondaryColorHex: '#1e293b',
      accentColorHex: '#f97316',
    },
    dept2: {
      label: 'Hidráulica & Campo',
      iconKey: 'leaf',
      primaryColorHex: '#1d4ed8',
      secondaryColorHex: '#1e3a8a',
      accentColorHex: '#eab308',
    },
  },
  {
    id: 'PET_PHARMA',
    label: 'Pet Shop & Farmácia Vet',
    emoji: '🐾',
    typographyPresetId: 'TECH_PRECISION',
    dept1: {
      label: 'Pet Shop & Rações',
      iconKey: 'heart',
      primaryColorHex: '#4c1d95',
      secondaryColorHex: '#3b0764',
      accentColorHex: '#f59e0b',
    },
    dept2: {
      label: 'Farmácia Veterinária',
      iconKey: 'pill',
      primaryColorHex: '#0369a1',
      secondaryColorHex: '#0c4a6e',
      accentColorHex: '#22c55e',
    },
  },
];

// ============================================================================
// 12. NORMALIZADOR DE LOTE DO ERP & CATÁLOGO UNIVERSAL (INTEGRAÇÃO RÁPIDA)
// ============================================================================
export const DEFAULT_ERP_CATALOG_DB: ErpCatalogRecord[] = [
  {
    skuCode: '101',
    eanBarcode: '7891000101001',
    rawTitle: 'RAC TUTTICANIS SEL AD 10.1KG',
    cleanedTitle: 'Ração Tutticanis Select Adulto 10,1KG',
    subtitle: 'Alta digestibilidade • Saco econômico',
    unit: 'KG',
    netWeightOrVolume: 10.1,
    costPrice: 34.5,
    priceFrom: 58.0,
    priceTo: 44.0,
    regulatoryCategory: 'STANDARD',
    mechanicType: 'SIMPLE_DE_POR',
  },
  {
    skuCode: '102',
    eanBarcode: '7891000102008',
    rawTitle: 'HERBICIDA GLIFOSATO WG 20KG',
    cleanedTitle: 'Herbicida Glifosato WG 20KG',
    subtitle: 'Controle eficiente • Granulado dispersível',
    unit: 'KG',
    netWeightOrVolume: 20,
    costPrice: 430.0,
    priceFrom: 680.0,
    priceTo: 549.9,
    regulatoryCategory: 'AGRO_PESTICIDE',
    mechanicType: 'SIMPLE_DE_POR',
  },
  {
    skuCode: '103',
    eanBarcode: '7891000103005',
    rawTitle: 'VACINA AFTOSA BOV 50 DOSES',
    cleanedTitle: 'Vacina Aftosa Bovinos 50 Doses',
    subtitle: 'Campanha oficial • Conservação 2°C a 8°C',
    unit: 'FR',
    costPrice: 68.0,
    priceFrom: 110.0,
    priceTo: 89.9,
    regulatoryCategory: 'VET_PRESCRIPTION',
    mechanicType: 'SIMPLE_DE_POR',
  },
  {
    skuCode: '201',
    eanBarcode: '7891000201002',
    rawTitle: 'TRIT FORRAG TRF 400 2CV BIVOLT',
    cleanedTitle: 'Triturador Forrageiro TRF 400 2CV BIVOLT',
    subtitle: 'Motor 2CV • Facas em aço temperado • Alta produção',
    unit: 'UN',
    costPrice: 1380.0,
    priceFrom: 2190.0,
    priceTo: 1899.0,
    regulatoryCategory: 'STANDARD',
    mechanicType: 'INSTALLMENT_FINANCING',
    installmentCount: 10,
  },
  {
    skuCode: '202',
    eanBarcode: '7891000202009',
    rawTitle: 'ROC COST GASOL 43CC 1.7HP',
    cleanedTitle: 'Roçadeira Costal Gasolina 43cc 1.7HP',
    subtitle: 'Acompanha lâmina 3 pontas e carretel de nylon',
    unit: 'UN',
    costPrice: 790.0,
    priceFrom: 1390.0,
    priceTo: 1099.0,
    regulatoryCategory: 'STANDARD',
    mechanicType: 'INSTALLMENT_FINANCING',
    installmentCount: 6,
  },
  {
    skuCode: '301',
    eanBarcode: '7891000301001',
    rawTitle: 'SUPLEM MIN BOV 30KG',
    cleanedTitle: 'Suplemento Mineral Bovinos 30KG',
    subtitle: 'Fósforo 80g • Engorda e reprodução a pasto',
    unit: 'KG',
    netWeightOrVolume: 30,
    costPrice: 82.0,
    priceFrom: 135.0,
    priceTo: 114.9,
    regulatoryCategory: 'STANDARD',
    mechanicType: 'BUY_WIN_GIFT',
    giftOrConditionText: 'COMPRE 5 SACOS E GANHE COCHO COLETOR',
  },
  {
    skuCode: '401',
    eanBarcode: '7891000401008',
    rawTitle: 'SAL MINERAL BOV CORTE 25KG',
    cleanedTitle: 'Sal Mineral Bovinos Corte 25KG',
    subtitle: 'Preço direto de balcão • Pronta entrega',
    unit: 'SC',
    netWeightOrVolume: 25,
    costPrice: 64.0,
    priceFrom: undefined,
    priceTo: 84.9,
    regulatoryCategory: 'STANDARD',
    mechanicType: 'SIMPLE_DE_POR',
  },
];

/**
 * Busca instantaneamente um produto pelo código SKU, código de barras EAN-13 ou trecho de descrição,
 * consultando primeiro a base customizada da loja (`customCatalog`), depois o lote atual (`batchRows`)
 * e por fim o catálogo base integrado (`DEFAULT_ERP_CATALOG_DB`).
 */
export function lookupErpCatalogBySku(
  skuOrQuery: string,
  batchRows: BatchParsedRow[] = [],
  customCatalog: ErpCatalogRecord[] = []
): ErpCatalogRecord | null {
  const query = (skuOrQuery || '').trim().replace(/^#/, '').toLowerCase();
  if (!query) return null;

  // 1. Prioridade máxima: correspondência exata de SKU ou EAN na base própria do lojista
  const exactCustom = customCatalog.find(
    (item) =>
      item.skuCode.trim().toLowerCase() === query ||
      (item.eanBarcode && item.eanBarcode.trim().toLowerCase() === query)
  );
  if (exactCustom) return exactCustom;

  // 2. Correspondência exata de SKU no lote atual importado
  const exactBatch = batchRows.find((r) => r.skuCode.trim().toLowerCase() === query);
  if (exactBatch) {
    return {
      skuCode: exactBatch.skuCode,
      ncmCode: exactBatch.ncmCode,
      rawTitle: exactBatch.rawTitle,
      cleanedTitle: exactBatch.cleanedTitle,
      unit: exactBatch.unit,
      netWeightOrVolume: exactBatch.netWeightOrVolume,
      costPrice: exactBatch.costPrice,
      priceFrom: exactBatch.priceFrom,
      priceTo: exactBatch.priceTo,
      regulatoryCategory: exactBatch.regulatoryCategory,
      mechanicType: exactBatch.mechanicType,
      installmentCount: exactBatch.installmentCount,
      giftOrConditionText: exactBatch.giftOrConditionText,
    };
  }

  // 3. Correspondência exata de SKU ou EAN no catálogo padrão
  const exactDefault = DEFAULT_ERP_CATALOG_DB.find(
    (item) =>
      item.skuCode.toLowerCase() === query ||
      (item.eanBarcode && item.eanBarcode.toLowerCase() === query)
  );
  if (exactDefault) return exactDefault;

  // 4. Busca textual parcial apenas para termos descritivos (>= 3 caracteres e não puramente numérico curto)
  if (query.length < 3 || /^\d{1,5}$/.test(query)) {
    return null;
  }

  const partialCustom = customCatalog.find(
    (item) =>
      item.cleanedTitle.toLowerCase().includes(query) ||
      item.rawTitle.toLowerCase().includes(query)
  );
  if (partialCustom) return partialCustom;

  const partialBatch = batchRows.find(
    (r) =>
      r.cleanedTitle.toLowerCase().includes(query) ||
      r.rawTitle.toLowerCase().includes(query)
  );
  if (partialBatch) {
    return {
      skuCode: partialBatch.skuCode,
      ncmCode: partialBatch.ncmCode,
      rawTitle: partialBatch.rawTitle,
      cleanedTitle: partialBatch.cleanedTitle,
      unit: partialBatch.unit,
      netWeightOrVolume: partialBatch.netWeightOrVolume,
      costPrice: partialBatch.costPrice,
      priceFrom: partialBatch.priceFrom,
      priceTo: partialBatch.priceTo,
      regulatoryCategory: partialBatch.regulatoryCategory,
      mechanicType: partialBatch.mechanicType,
      installmentCount: partialBatch.installmentCount,
      giftOrConditionText: partialBatch.giftOrConditionText,
    };
  }

  return (
    DEFAULT_ERP_CATALOG_DB.find(
      (item) =>
        item.cleanedTitle.toLowerCase().includes(query) ||
        item.rawTitle.toLowerCase().includes(query)
    ) || null
  );
}

/**
 * Retorna uma lista ranqueada de produtos do catálogo ERP (para autocomplete ou busca na modal).
 */
export function searchErpCatalog(
  query: string,
  customCatalog: ErpCatalogRecord[] = [],
  batchRows: BatchParsedRow[] = [],
  limit = 12
): ErpCatalogRecord[] {
  const mergedMap = new Map<string, ErpCatalogRecord>();

  for (const item of DEFAULT_ERP_CATALOG_DB) {
    mergedMap.set(item.skuCode.toLowerCase(), item);
  }
  for (const row of batchRows) {
    mergedMap.set(row.skuCode.toLowerCase(), {
      skuCode: row.skuCode,
      ncmCode: row.ncmCode,
      rawTitle: row.rawTitle,
      cleanedTitle: row.cleanedTitle,
      unit: row.unit,
      netWeightOrVolume: row.netWeightOrVolume,
      costPrice: row.costPrice,
      priceFrom: row.priceFrom,
      priceTo: row.priceTo,
      regulatoryCategory: row.regulatoryCategory,
      mechanicType: row.mechanicType,
      installmentCount: row.installmentCount,
      giftOrConditionText: row.giftOrConditionText,
    });
  }
  for (const custom of customCatalog) {
    mergedMap.set(custom.skuCode.toLowerCase(), custom);
  }

  const allRecords = Array.from(mergedMap.values());
  const cleanQuery = (query || '').trim().replace(/^#/, '').toLowerCase();
  if (!cleanQuery) return allRecords.slice(0, limit);

  return allRecords
    .filter(
      (item) =>
        item.skuCode.toLowerCase().includes(cleanQuery) ||
        (item.eanBarcode && item.eanBarcode.toLowerCase().includes(cleanQuery)) ||
        item.cleanedTitle.toLowerCase().includes(cleanQuery) ||
        item.rawTitle.toLowerCase().includes(cleanQuery)
    )
    .sort((a, b) => {
      const aExact =
        a.skuCode.toLowerCase() === cleanQuery || a.eanBarcode?.toLowerCase() === cleanQuery
          ? 0
          : 1;
      const bExact =
        b.skuCode.toLowerCase() === cleanQuery || b.eanBarcode?.toLowerCase() === cleanQuery
          ? 0
          : 1;
      return aExact - bExact;
    })
    .slice(0, limit);
}

/**
 * Conector Universal de Base de Dados ERP:
 * Aceita payloads JSON (Bling, Tiny, TOTVS Protheus, Sankhya, Siagri, Linx, Omie, APIs REST)
 * ou planilhas CSV / TSV / Ponto-e-Vírgula / Excel (com ou sem cabeçalho) e converte
 * deterministicamente em registros `ErpCatalogRecord[]` prontos para consulta instantânea.
 */
export function normalizeUniversalErpDataset(rawInput: string): {
  records: ErpCatalogRecord[];
  detectedFormat: string;
  totalImported: number;
} {
  if (!rawInput || !rawInput.trim()) {
    return { records: [], detectedFormat: 'Vazio', totalImported: 0 };
  }

  const trimmed = rawInput.trim();
  const nowIso = new Date().toISOString();

  // 1. Tenta interpretar como JSON (Array direto ou objeto de API com chave data/produtos/items/registros)
  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      let rawList: Record<string, unknown>[] = [];
      let formatLabel = 'JSON Universal API';

      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (Array.isArray(obj.produtos)) {
          rawList = obj.produtos as Record<string, unknown>[];
          formatLabel = 'JSON ERP (Bling / Tiny / Siagri)';
        } else if (Array.isArray(obj.data)) {
          rawList = obj.data as Record<string, unknown>[];
          formatLabel = 'JSON REST API (data)';
        } else if (Array.isArray(obj.items) || Array.isArray(obj.itens)) {
          rawList = (obj.items || obj.itens) as Record<string, unknown>[];
          formatLabel = 'JSON ERP (TOTVS / Sankhya / Omie)';
        } else if (Array.isArray(obj.records) || Array.isArray(obj.registros)) {
          rawList = (obj.records || obj.registros) as Record<string, unknown>[];
          formatLabel = 'JSON Exportação Sistema';
        }
      }

      if (rawList.length > 0) {
        const records: ErpCatalogRecord[] = [];
        rawList.forEach((entry, idx) => {
          // Suporta estrutura aninhada do Bling: { produto: { codigo, descricao, preco... } }
          const item =
            entry && typeof entry.produto === 'object' && entry.produto !== null
              ? (entry.produto as Record<string, unknown>)
              : entry;

          const sku = String(
            item.skuCode ??
              item.sku ??
              item.codigo ??
              item.cod_interno ??
              item.codProduto ??
              item.id ??
              idx + 101
          ).trim();

          const ean = String(
            item.eanBarcode ?? item.ean ?? item.gtin ?? item.codigo_barras ?? item.codBarras ?? ''
          ).trim();

          const ncm = String(
            item.ncmCode ?? item.ncm ?? item.cod_ncm ?? item.class_fiscal ?? ''
          ).trim();

          const rawName = String(
            item.rawTitle ??
              item.cleanedTitle ??
              item.nome ??
              item.descricao ??
              item.title ??
              item.desc_produto ??
              item.produto ??
              ''
          ).trim();

          if (!rawName) return;

          const pFromRaw = parsePriceNumber(
            (item.priceFrom ??
              item.precoDe ??
              item.preco_de ??
              item.vlr_tabela ??
              item.precoLista ??
              item.de ??
              0) as string | number
          );

          const pToRaw = parsePriceNumber(
            (item.priceTo ??
              item.precoPor ??
              item.preco_por ??
              item.preco ??
              item.vlr_venda ??
              item.vlr_promocao ??
              item.precoPromocional ??
              item.por ??
              0) as string | number
          );

          const costRaw = parsePriceNumber(
            (item.costPrice ??
              item.custo ??
              item.preco_custo ??
              item.prc_custo ??
              item.vlr_custo ??
              0) as string | number
          );

          const priceTo = pToRaw > 0 ? pToRaw : pFromRaw;
          if (priceTo <= 0) return;

          const priceFrom = pFromRaw > priceTo ? pFromRaw : undefined;
          const costPrice = costRaw > 0 ? costRaw : undefined;

          const { cleanedTitle, extractedUnit, extractedMeasure } = cleanErpProductTitle(rawName);
          const explicitUnit = String(item.unit ?? item.unidade ?? item.un ?? item.und ?? '').trim().toUpperCase();
          const unit = explicitUnit || extractedUnit || 'UN';
          const regulatoryCategory = detectRegulatoryCategoryByText(cleanedTitle, ncm);

          const installmentCount = Number(item.installmentCount ?? item.parcelas ?? 0);
          const giftText = String(item.giftOrConditionText ?? item.brinde ?? item.condicao ?? '').trim();

          let mechanicType: CommercialMechanicType =
            (item.mechanicType as CommercialMechanicType) || 'SIMPLE_DE_POR';
          if (installmentCount >= 2) {
            mechanicType = 'INSTALLMENT_FINANCING';
          } else if (giftText.length > 2) {
            mechanicType = 'BUY_WIN_GIFT';
          }

          records.push({
            skuCode: sku,
            eanBarcode: ean || undefined,
            ncmCode: ncm || undefined,
            rawTitle: rawName,
            cleanedTitle,
            subtitle: item.subtitle ? String(item.subtitle) : undefined,
            unit,
            netWeightOrVolume: extractedMeasure,
            costPrice,
            priceFrom,
            priceTo,
            regulatoryCategory,
            mechanicType,
            installmentCount: installmentCount >= 2 ? installmentCount : undefined,
            giftOrConditionText: giftText ? giftText.toUpperCase() : undefined,
            updatedAtISO: nowIso,
          });
        });

        return {
          records,
          detectedFormat: formatLabel,
          totalImported: records.length,
        };
      }
    } catch {
      // Segue para parser tabular CSV/TSV
    }
  }

  // 2. Parser Tabular Inteligente (CSV, TSV do Excel, Ponto-e-Vírgula ou Pipe)
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { records: [], detectedFormat: 'Vazio', totalImported: 0 };
  }

  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t')
    ? '\t'
    : firstLine.includes(';')
      ? ';'
      : firstLine.includes('|')
        ? '|'
        : ',';

  const splitLine = (line: string): string[] => {
    if (delimiter !== ',') {
      return line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    }
    // Se for vírgula, respeita aspas para não quebrar decimais brasileiros entre aspas
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  };

  const headerCols = splitLine(firstLine).map((c) => c.toLowerCase());
  const hasHeader = headerCols.some((c) =>
    /^(c[oó]d|sku|id|ean|gtin|barras|ncm|produto|descri[cç][aã]o|nome|pre[cç]o|valor|vlr|de|por|custo)/.test(c)
  );

  // Mapeia índices de coluna caso exista cabeçalho
  const findColIdx = (regex: RegExp): number => headerCols.findIndex((c) => regex.test(c));
  const idxSku = hasHeader ? findColIdx(/^(c[oó]d(igo)?(_interno)?|sku|id|ref)$/) : -1;
  const idxEan = hasHeader ? findColIdx(/(ean|gtin|barras)/) : -1;
  const idxNcm = hasHeader ? findColIdx(/(ncm|class_?fiscal)/) : -1;
  const idxName = hasHeader ? findColIdx(/(produto|descri[cç][aã]o|nome|titulo|item)/) : -1;
  const idxFrom = hasHeader ? findColIdx(/(pre[cç]o_?de|^de$|tabela|anterior)/) : -1;
  const idxTo = hasHeader ? findColIdx(/(pre[cç]o_?por|^por$|venda|promo|atual|^pre[cç]o$|valor)/) : -1;
  const idxCost = hasHeader ? findColIdx(/(custo|compra)/) : -1;
  const idxInstallment = hasHeader ? findColIdx(/(parcela|vezes)/) : -1;
  const idxCondition = hasHeader ? findColIdx(/(brinde|condi[cç][aã]o|obs)/) : -1;

  const records: ErpCatalogRecord[] = [];
  const startRow = hasHeader ? 1 : 0;

  for (let i = startRow; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.length < 2) continue;

    let skuCode = '';
    let eanBarcode: string | undefined = undefined;
    let ncmCode: string | undefined = undefined;
    let rawName = '';
    let p1 = 0;
    let p2 = 0;
    let costPrice: number | undefined = undefined;
    let installmentCount: number | undefined = undefined;
    let giftOrConditionText: string | undefined = undefined;

    if (hasHeader && idxName !== -1) {
      skuCode = idxSku !== -1 && cols[idxSku] ? cols[idxSku] : String(i + 100);
      eanBarcode = idxEan !== -1 && cols[idxEan] ? cols[idxEan] : undefined;
      ncmCode = idxNcm !== -1 && cols[idxNcm] ? cols[idxNcm] : undefined;
      rawName = cols[idxName] || '';
      p1 = idxFrom !== -1 && cols[idxFrom] ? parsePriceNumber(cols[idxFrom]) : 0;
      p2 = idxTo !== -1 && cols[idxTo] ? parsePriceNumber(cols[idxTo]) : 0;
      if (idxCost !== -1 && cols[idxCost]) {
        const cVal = parsePriceNumber(cols[idxCost]);
        if (cVal > 0) costPrice = cVal;
      }
      if (idxInstallment !== -1 && cols[idxInstallment]) {
        const inst = parseInt(cols[idxInstallment].replace(/\D/g, ''), 10);
        if (inst >= 2 && inst <= 24) installmentCount = inst;
      }
      if (idxCondition !== -1 && cols[idxCondition]) {
        giftOrConditionText = cols[idxCondition].toUpperCase();
      }
    } else if (cols.length >= 4) {
      skuCode = cols[0];
      rawName = cols[1];
      p1 = parsePriceNumber(cols[2]);
      p2 = parsePriceNumber(cols[3]);
      if (cols[4]) {
        const cVal = parsePriceNumber(cols[4]);
        if (cVal > 0) costPrice = cVal;
      }
    } else if (cols.length === 3) {
      skuCode = cols[0];
      rawName = cols[1];
      p2 = parsePriceNumber(cols[2]);
    } else {
      skuCode = String(i + 101);
      rawName = cols[0];
      p2 = parsePriceNumber(cols[1]);
    }

    if (!rawName) continue;

    let priceFrom: number | undefined = undefined;
    let priceTo = p2;
    if (p1 > 0 && p2 > 0) {
      priceFrom = Math.max(p1, p2);
      priceTo = Math.min(p1, p2);
    } else if (p1 > 0 && p2 === 0) {
      priceTo = p1;
    }

    if (priceTo <= 0) continue;

    const { cleanedTitle, extractedUnit, extractedMeasure } = cleanErpProductTitle(rawName);
    const regulatoryCategory = detectRegulatoryCategoryByText(cleanedTitle, ncmCode);

    let mechanicType: CommercialMechanicType = 'SIMPLE_DE_POR';
    if (installmentCount && installmentCount >= 2) {
      mechanicType = 'INSTALLMENT_FINANCING';
    } else if (giftOrConditionText && giftOrConditionText.length > 2) {
      mechanicType = 'BUY_WIN_GIFT';
    }

    records.push({
      skuCode,
      eanBarcode,
      ncmCode,
      rawTitle: rawName,
      cleanedTitle,
      unit: extractedUnit,
      netWeightOrVolume: extractedMeasure,
      costPrice,
      priceFrom,
      priceTo,
      regulatoryCategory,
      mechanicType,
      installmentCount,
      giftOrConditionText,
      updatedAtISO: nowIso,
    });
  }

  const formatName =
    delimiter === '\t'
      ? 'Planilha Excel / TSV'
      : delimiter === ';'
        ? 'CSV Brasileiro (;)'
        : delimiter === '|'
          ? 'Texto Delimitado (|)'
          : 'CSV Padrão (,)';

  return {
    records,
    detectedFormat: formatName,
    totalImported: records.length,
  };
}

export function exportCatalogToCsv(records: ErpCatalogRecord[]): string {
  const header = 'SKU;EAN;PRODUTO_ORIGINAL;TITULO_LIMPO;UNIDADE;PRECO_DE;PRECO_POR;CUSTO;MECANICA;PARCELAS;CONDICAO';
  const rows = records.map((r) =>
    [
      r.skuCode,
      r.eanBarcode || '',
      r.rawTitle,
      r.cleanedTitle,
      r.unit,
      r.priceFrom ? r.priceFrom.toFixed(2).replace('.', ',') : '',
      r.priceTo.toFixed(2).replace('.', ','),
      r.costPrice ? r.costPrice.toFixed(2).replace('.', ',') : '',
      r.mechanicType || 'SIMPLE_DE_POR',
      r.installmentCount || '',
      r.giftOrConditionText || '',
    ].join(';')
  );
  return [header, ...rows].join('\n');
}

export function parseErpBatchTable(
  rawText: string,
  rounding: RoundingStrategy = 'NONE'
): BatchParsedRow[] {
  if (!rawText || !rawText.trim()) return [];

  const trimmed = rawText.trim();
  // Suporte nativo a JSON de API/ERP (objeto ou array) caso o cliente cole um JSON de qualquer sistema
  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    const normalized = normalizeUniversalErpDataset(trimmed);
    if (normalized.records.length > 0) {
      const synthesizedLines = normalized.records.map(
        (r) =>
          `${r.skuCode};${r.rawTitle};${r.priceFrom || 0};${r.priceTo};${r.costPrice || ''}`
      );
      return parseErpBatchTable(synthesizedLines.join('\n'), rounding);
    }
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows: BatchParsedRow[] = [];

  lines.forEach((line, idx) => {
    const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : '|';
    const cols = line.split(delimiter).map((c) => c.trim());

    if (
      idx === 0 &&
      cols.some((c) => /^(c[oó]d|sku|produto|descri[cç][aã]o|pre[cç]o)$/i.test(c))
    ) {
      return;
    }

    if (cols.length < 2) return;

    let skuCode = '';
    let rawName = '';
    let p1 = 0;
    let p2 = 0;
    let costPrice: number | undefined = undefined;

    if (cols.length >= 4) {
      skuCode = cols[0];
      rawName = cols[1];
      p1 = parsePriceNumber(cols[2]);
      p2 = parsePriceNumber(cols[3]);
      if (cols[4]) costPrice = parsePriceNumber(cols[4]);
    } else if (cols.length === 3) {
      skuCode = cols[0];
      rawName = cols[1];
      p2 = parsePriceNumber(cols[2]);
    } else {
      skuCode = String(idx + 101);
      rawName = cols[0];
      p2 = parsePriceNumber(cols[1]);
    }

    let priceFrom: number | undefined = undefined;
    let rawPriceTo = p2;
    if (p1 > 0 && p2 > 0) {
      priceFrom = Math.max(p1, p2);
      rawPriceTo = Math.min(p1, p2);
    } else if (p1 > 0 && p2 === 0) {
      rawPriceTo = p1;
    }

    const { cleanedTitle, extractedUnit, extractedMeasure } = cleanErpProductTitle(rawName);
    const priceTo = applyCommercialRounding(rawPriceTo, rounding, priceFrom, costPrice);
    const discountPct =
      priceFrom && priceFrom > priceTo
        ? Math.round(((priceFrom - priceTo) / priceFrom) * 100)
        : 0;

    const regulatoryCategory = detectRegulatoryCategoryByText(cleanedTitle);

    let status: 'VALID' | 'WARNING' | 'BLOCKED' = 'VALID';
    let statusMessage = 'Pronto para impressão';

    if (!cleanedTitle || priceTo <= 0) {
      status = 'BLOCKED';
      statusMessage = 'Preço zerado ou descrição ausente';
    } else if (costPrice && priceTo <= costPrice) {
      status = 'BLOCKED';
      statusMessage = `Abaixo do custo (R$ ${costPrice.toFixed(2)})`;
    } else if (discountPct >= 65) {
      status = 'WARNING';
      statusMessage = `Desconto alto (${discountPct}% OFF) — conferir digitação`;
    }

    rows.push({
      rowNumber: idx + 1,
      skuCode,
      rawTitle: rawName,
      cleanedTitle,
      unit: extractedUnit,
      netWeightOrVolume: extractedMeasure,
      costPrice,
      priceFrom,
      priceTo,
      discountPct,
      regulatoryCategory,
      status,
      statusMessage,
    });
  });

  return rows;
}

// ============================================================================
// 12. ENRIQUECEDOR LOCAL + PORTA GEMINI FLASH VISION
// ============================================================================
export class SmartProductEnricherService implements ProductEnricherPort {
  private geminiApiKey?: string;

  constructor(geminiApiKey?: string) {
    this.geminiApiKey = geminiApiKey;
  }

  setGeminiApiKey(geminiApiKey?: string) {
    this.geminiApiKey = geminiApiKey?.trim() || undefined;
  }

  async enrichProduct(input: VisionEnrichmentInput): Promise<VisionEnrichmentResult> {
    const rawTitle = input.rawTitle || '';
    const { cleanedTitle, extractedUnit, extractedMeasure } = cleanErpProductTitle(rawTitle);
    const detectedCategory = detectRegulatoryCategoryByText(cleanedTitle || rawTitle);

    if (!input.imageBase64OrUrl || !this.geminiApiKey) {
      return this.buildDeterministicEnrichment(
        cleanedTitle || 'Produto em Oferta',
        extractedUnit,
        extractedMeasure,
        detectedCategory
      );
    }

    try {
      return await this.callGeminiVisionFlash(
        input.imageBase64OrUrl,
        cleanedTitle,
        extractedUnit,
        extractedMeasure,
        detectedCategory
      );
    } catch {
      return this.buildDeterministicEnrichment(
        cleanedTitle || 'Produto em Oferta',
        extractedUnit,
        extractedMeasure,
        detectedCategory
      );
    }
  }

  private buildDeterministicEnrichment(
    cleanedTitle: string,
    extractedUnit: string,
    extractedMeasure: number | undefined,
    category: RegulatoryCategory
  ): VisionEnrichmentResult {
    const lower = cleanedTitle.toLowerCase();

    if (lower.includes('ração') || lower.includes('racao')) {
      return {
        source: 'LOCAL_HEURISTIC',
        cleanedTitle,
        suggestedSubtitle: 'Nutrição balanceada de alta absorção e pelagem saudável',
        extractedUnit,
        extractedWeightVolume: extractedMeasure,
        suggestedBullets: [
          'Alta palatabilidade e digestibilidade',
          'Rico em vitaminas e minerais essenciais',
          extractedMeasure
            ? `Embalagem econômica de ${extractedMeasure}kg`
            : 'Excelente rendimento diário',
        ],
        detectedCategory: category,
        suggestedCta: 'Oferta exclusiva na loja • Fale com nosso balcão',
        confidenceScore: 0.92,
      };
    }

    if (lower.includes('pulverizador') || lower.includes('bomba') || lower.includes('roçadeira')) {
      return {
        source: 'LOCAL_HEURISTIC',
        cleanedTitle,
        suggestedSubtitle: 'Eficiência e durabilidade máxima na operação diária',
        extractedUnit,
        extractedWeightVolume: extractedMeasure,
        suggestedBullets: [
          extractedMeasure
            ? `Capacidade otimizada de ${extractedMeasure}${extractedUnit}`
            : 'Design ergonômico e resistente',
          'Alta pressão e vedação reforçada',
          'Fácil manutenção e reposição de peças',
        ],
        detectedCategory: category,
        suggestedCta: 'Garanta já o seu!',
        confidenceScore: 0.94,
      };
    }

    if (category === 'AGRO_PESTICIDE' || category === 'AGRO_FERTILIZER_SEED') {
      return {
        source: 'LOCAL_HEURISTIC',
        cleanedTitle,
        suggestedSubtitle: 'Alta performance agronômica para máxima produtividade da lavoura',
        extractedUnit,
        extractedWeightVolume: extractedMeasure,
        suggestedBullets: [
          'Insumo de procedência garantida',
          'Excelente custo-benefício por hectare',
          'Pronta entrega para retirada na filial',
        ],
        detectedCategory: category,
        suggestedCta: 'Consulte nosso time técnico presencialmente!',
        confidenceScore: 0.91,
      };
    }

    return {
      source: 'LOCAL_HEURISTIC',
      cleanedTitle,
      suggestedSubtitle: 'Qualidade garantida com preço especial de oportunidade',
      extractedUnit,
      extractedWeightVolume: extractedMeasure,
      suggestedBullets: [
        'Produto selecionado de alta qualidade',
        'Condição exclusiva por tempo limitado',
        'Disponível para retirada imediata',
      ],
      detectedCategory: category,
      suggestedCta: 'Oferta exclusiva para retirada na loja!',
      confidenceScore: 0.85,
    };
  }

  private async callGeminiVisionFlash(
    imageBase64OrUrl: string,
    cleanedTitle: string,
    fallbackUnit: string,
    fallbackMeasure: number | undefined,
    fallbackCategory: RegulatoryCategory
  ): Promise<VisionEnrichmentResult> {
    const base64Data = imageBase64OrUrl.includes('base64,')
      ? imageBase64OrUrl.split('base64,')[1]
      : imageBase64OrUrl;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analise este rótulo/produto de varejo (Título informado: "${cleanedTitle}"). Retorne APENAS um JSON válido com as chaves: "cleanedTitle", "suggestedSubtitle", "suggestedBullets" (3 itens), "extractedUnit", "extractedWeightVolume".`,
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Falha na chamada Vision API');
    }

    const data = await response.json();
    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawJson);

    return {
      source: 'VISION_LLM',
      cleanedTitle: parsed.cleanedTitle || cleanedTitle,
      suggestedSubtitle: parsed.suggestedSubtitle || 'Qualidade e economia garantidas',
      extractedUnit: parsed.extractedUnit || fallbackUnit,
      extractedWeightVolume: parsed.extractedWeightVolume ?? fallbackMeasure,
      suggestedBullets:
        Array.isArray(parsed.suggestedBullets) && parsed.suggestedBullets.length > 0
          ? parsed.suggestedBullets.slice(0, 3)
          : ['Alta qualidade comprovada', 'Excelente custo-benefício', 'Pronta entrega na loja'],
      detectedCategory:
        detectRegulatoryCategoryByText(parsed.cleanedTitle || cleanedTitle) || fallbackCategory,
      suggestedCta: 'Garanta já o seu!',
      confidenceScore: 0.98,
    };
  }
}

// ============================================================================
// 13. FINGERPRINT FORENSE PARA RH & COMUNICADOS + HEADLESS API PAYLOAD (FASE 3 & 4)
// ============================================================================
export function generateHrForensicId(
  hrNotice: HrNoticeState,
  companyName = 'REDE'
): string {
  const canonical = [
    companyName.trim().toUpperCase(),
    (hrNotice.referenceCode || 'HR-001').trim().toUpperCase(),
    hrNotice.archetype,
    (hrNotice.roleOrSubject || '').trim().toUpperCase(),
    (hrNotice.compensationOrHighlight || '').trim().toUpperCase(),
    (hrNotice.validityOrDeadlineText || '').trim().toUpperCase(),
  ].join('::');

  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const base36 = (hash >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
  return `AP-${base36.slice(0, 4)}-${base36.slice(4, 7)}`;
}

export interface HeadlessRenderApiPayload {
  apiVersion: 'v2.0';
  endpoint: 'POST /api/v1/render';
  tenant: {
    tenantId: string;
    companyName: string;
    activeDepartmentId: string;
    typographyPresetId?: TypographyPresetId;
    fontHeading: string;
    fontBody: string;
    mapaRegistrationCode?: string;
  };
  template: {
    module: 'STORE_POSTER' | 'SOCIAL_MEDIA' | 'CAROUSEL' | 'HR_NOTICE';
    printGrid: string;
    layoutArchetype: PosterLayoutArchetype;
    visualTheme: string;
  };
  coreElements: {
    skuCode: string;
    cleanedTitle: string;
    condensedTitle: string;
    unit: string;
    priceFrom?: number;
    effectiveUnitPrice: number;
    discountPercentage: number;
    mechanicType: CommercialMechanicType;
    conditionHeadlineText: string;
    installmentLabelText: string;
    validityFormatted: string;
    legalWarningText?: string;
    forensicId: string;
    governanceScore: number;
    canExport: boolean;
  };
}

export function buildHeadlessRenderPayload(
  offer: OfferItemState,
  brandKit: TenantBrandKit,
  posterConfig: StudioGlobalState['posterConfig']
): HeadlessRenderApiPayload {
  const metrics = computeOfferMetrics(offer, brandKit.mapaRegistrationCode, brandKit);
  return {
    apiVersion: 'v2.0',
    endpoint: 'POST /api/v1/render',
    tenant: {
      tenantId: brandKit.tenantId,
      companyName: brandKit.companyName,
      activeDepartmentId: brandKit.activeDepartmentId,
      typographyPresetId: brandKit.typographyPresetId,
      fontHeading: brandKit.fontHeading,
      fontBody: brandKit.fontBody,
      mapaRegistrationCode: brandKit.mapaRegistrationCode,
    },
    template: {
      module: 'STORE_POSTER',
      printGrid: posterConfig.printGrid,
      layoutArchetype: posterConfig.layoutArchetype,
      visualTheme: posterConfig.visualTheme,
    },
    coreElements: {
      skuCode: offer.skuCode || '00000',
      cleanedTitle: offer.cleanedTitle || offer.rawTitle,
      condensedTitle: metrics.condensedTitle,
      unit: offer.unit,
      priceFrom: offer.priceFrom,
      effectiveUnitPrice: metrics.effectiveUnitPrice,
      discountPercentage: metrics.discountPercentage,
      mechanicType: offer.mechanicType,
      conditionHeadlineText: metrics.conditionHeadlineText,
      installmentLabelText: metrics.installmentLabelText,
      validityFormatted: metrics.validityFormatted,
      legalWarningText: metrics.legalFooter.mandatoryLegalText,
      forensicId: metrics.forensicId,
      governanceScore: metrics.governanceScore,
      canExport: metrics.canExport,
    },
  };
}

/**
 * Extrai cores dominantes (primária e destaque) de um Data URL de imagem client-side via Canvas 2D.
 * Custo R$ 0, totalmente offline no navegador.
 */
export async function extractDominantColorsFromImage(
  dataUrl: string
): Promise<{ primaryColorHex: string; accentColorHex: string }> {
  if (typeof window === 'undefined' || !dataUrl) {
    return { primaryColorHex: '#0F172A', accentColorHex: '#FACC15' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ primaryColorHex: '#0F172A', accentColorHex: '#FACC15' });
          return;
        }

        const size = 48;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorCounts = new Map<string, { r: number; g: number; b: number; count: number; sat: number }>();

        for (let i = 0; i < imgData.length; i += 4) {
          const a = imgData[i + 3];
          if (a < 128) continue; // ignora pixels transparentes

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          // ignora brancos puros e pretos extremos
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const sat = max === 0 ? 0 : delta / max;
          const lum = (max + min) / 2;

          if (lum > 240 || lum < 20) continue;

          // quantiza em baldes de 32
          const qr = Math.floor(r / 32) * 32;
          const qg = Math.floor(g / 32) * 32;
          const qb = Math.floor(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;

          const existing = colorCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            colorCounts.set(key, { r: qr, g: qg, b: qb, count: 1, sat });
          }
        }

        const sorted = Array.from(colorCounts.values()).sort(
          (c1, c2) => c2.count * (1 + c2.sat) - c1.count * (1 + c1.sat)
        );

        const toHex = (c: { r: number; g: number; b: number }) =>
          `#${[c.r, c.g, c.b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;

        if (sorted.length === 0) {
          resolve({ primaryColorHex: '#0F172A', accentColorHex: '#FACC15' });
          return;
        }

        const primary = sorted[0];
        // Procura uma cor de destaque com saturação ou contraste com a primária
        const accent = sorted.find((c, idx) => idx > 0 && Math.abs(c.sat - primary.sat) > 0.15) ||
          sorted[1] || { r: 250, g: 204, b: 21 }; // #FACC15

        resolve({
          primaryColorHex: toHex(primary),
          accentColorHex: toHex(accent),
        });
      } catch {
        resolve({ primaryColorHex: '#0F172A', accentColorHex: '#FACC15' });
      }
    };
    img.onerror = () => {
      resolve({ primaryColorHex: '#0F172A', accentColorHex: '#FACC15' });
    };
    img.src = dataUrl;
  });
}

// ============================================================================
// 11. MOTOR DE GOVERNANÇA DE 2 VIAS (HUB COAGRO: VIA VERDE vs VIA AMARELA)
// ============================================================================

/**
 * Avalia de forma determinística se a peça atual segue pela:
 * - VIA VERDE (GREEN_DIRECT): Impressão/exportação imediata liberada com log de auditoria
 *   (ex: Cartazes PDV, Comunicados A4 ou Ativos Digitais sem violação de margem nem termos desconhecidos).
 * - VIA AMARELA (YELLOW_CURATOR): Exige aprovação/cotação do Curador de Marketing (Kaio)
 *   (ex: Faixas/Lonas gráficas, Spots de Rádio, Redes Sociais submetidas pela loja, ou peças com alerta de margem/ortografia).
 */
export function evaluateGovernanceTrack(params: {
  module: ModuleMode;
  userRole: CoagroUserRole;
  offer: OfferItemState;
  brandKit: TenantBrandKit;
  customDictionary?: AgroDictionaryEntry[];
  textToInspect?: string;
}): GovernanceEvaluation {
  const {
    module,
    userRole,
    offer,
    brandKit,
    customDictionary = [],
    textToInspect,
  } = params;

  const metrics = computeOfferMetrics(offer, brandKit.mapaRegistrationCode, brandKit);
  const sampleText =
    textToInspect ??
    `${offer.cleanedTitle || offer.rawTitle} ${offer.subtitle || ''} ${offer.bullets.map((b) => b.text).join(' ')}`;

  const ortho = inspectAgroOrthography(sampleText, customDictionary);
  const blockingFindings = metrics.guardrailFindings.filter((f) => f.severity === 'block');
  const approvalFindings = metrics.guardrailFindings.filter((f) => f.severity === 'approval');

  const reasons: string[] = [];
  let track: 'GREEN_DIRECT' | 'YELLOW_CURATOR' = 'GREEN_DIRECT';

  // Regra 1: Módulos de cotação gráfica ou gravação de áudio são sempre Via Amarela
  if (module === 'BANNER_FAIXA') {
    track = 'YELLOW_CURATOR';
    reasons.push('Material físico de grande formato exige Cotação Gráfica e fechamento CMYK pelo Marketing.');
  } else if (module === 'RADIO_SPOT') {
    track = 'YELLOW_CURATOR';
    reasons.push('Spot de áudio exige gravação e publicação pelo Curador no Spotifast Server (:8790).');
  } else if (module === 'SOCIAL_MEDIA' || module === 'CAROUSEL') {
    track = 'YELLOW_CURATOR';
    reasons.push('Peças de Redes Sociais e Listas de Transmissão passam pela homologação visual do Curador.');
  }

  // Regra 2: Descontos acima do teto de alçada exigem aprovação do Curador
  if (approvalFindings.length > 0) {
    track = 'YELLOW_CURATOR';
    for (const f of approvalFindings) {
      reasons.push(f.message);
    }
  }

  // Regra 3: Termos fora do Dicionário Corporativo Coagro acionam revisão na Camada 2
  if (ortho.unknownTerms.length > 0) {
    track = 'YELLOW_CURATOR';
    reasons.push(
      `Termos fora do Dicionário Corporativo Agro detectados (${ortho.unknownTerms.slice(0, 3).join(', ')}).`
    );
  }

  const hasBlockingError = blockingFindings.length > 0;
  if (hasBlockingError) {
    for (const f of blockingFindings) {
      reasons.push(f.message);
    }
  }

  // O Curador Admin (Kaio) sempre pode exportar diretamente (salvo erro matemático bloqueante como preço invertido)
  const canDirectExport =
    !hasBlockingError &&
    (userRole === 'CURATOR_ADMIN' || track === 'GREEN_DIRECT');

  const requiresCuratorApproval = !canDirectExport && !hasBlockingError;

  const primaryActionLabel = hasBlockingError
    ? 'Corrija os bloqueios acima'
    : userRole === 'CURATOR_ADMIN'
      ? 'Aprovar & Exportar Alta Resolução'
      : track === 'GREEN_DIRECT'
        ? 'Imprimir / Baixar Imediatamente'
        : module === 'BANNER_FAIXA'
          ? 'Solicitar Criação & Cotação Gráfica'
          : 'Solicitar Aprovação ao Marketing';

  return {
    track,
    canDirectExport,
    requiresCuratorApproval,
    hasBlockingError,
    reasons,
    unknownTerms: ortho.unknownTerms,
    autoCorrections: ortho.autoCorrections.map((c) => ({ from: c.from, to: c.to })),
    primaryActionLabel,
  };
}

/**
 * Estima contagem de palavras e tempo de locução em segundos para a Rádio Interna Coagro
 * (Taxa média de locução comercial varejo: ~2,6 palavras por segundo).
 */
export function estimateRadioSpotTiming(
  scriptText: string,
  targetDurationSeconds: 15 | 30 = 30
): {
  wordCount: number;
  estimatedSeconds: number;
  maxRecommendedWords: number;
  isWithinLimit: boolean;
} {
  const words = (scriptText || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const wordCount = words.length;
  const estimatedSeconds = Math.max(1, Math.round(wordCount / 2.5));
  const maxRecommendedWords = targetDurationSeconds === 15 ? 40 : 78;
  return {
    wordCount,
    estimatedSeconds,
    maxRecommendedWords,
    isWithinLimit: wordCount <= maxRecommendedWords,
  };
}

/**
 * Pré-estrutura um roteiro comercial padronizado (Seção 8.2 do PDF) para a Rádio Coagro (Spotifast).
 */
export function buildRadioSpotScript(
  draft: Pick<
    RadioSpotDraft,
    'spotType' | 'durationSeconds' | 'productOrSubject' | 'priceText' | 'mentionStoreName'
  >,
  storeName: string
): string {
  const shouldMention = draft.mentionStoreName !== false;
  const storeReference = shouldMention ? (storeName || 'Coagro') : 'todas as lojas do Grupo Coagro';
  const prod = draft.productOrSubject || 'Oferta Especial';
  const price = draft.priceText ? ` por apenas ${draft.priceText}` : ' com condição especial de balcão';

  if (draft.spotType === 'STORE_HOURS') {
    return shouldMention
      ? `Atenção, cliente amigo da ${storeReference}! Confira o nosso comunicado especial: ${prod}. Conte sempre com a assessoria técnica e o atendimento de confiança do Grupo Coagro!`
      : `Atenção, cliente amigo! Confira o comunicado especial em ${storeReference}: ${prod}. Conte sempre com a assessoria técnica e o atendimento de confiança do Grupo Coagro!`;
  }

  if (draft.durationSeconds === 15) {
    return shouldMention
      ? `Alô, produtor! Aproveite agora na ${storeReference}: ${prod}${price}! Passe no balcão ou chame no WhatsApp da loja. Coagro, a força do campo com você!`
      : `Alô, produtor! Aproveite agora em ${storeReference}: ${prod}${price}! Passe no balcão ou chame no WhatsApp da sua unidade. Coagro, a força do campo com você!`;
  }

  return shouldMention
    ? `Atenção, amigo produtor e cliente da ${storeReference}! Chegou a hora de garantir economia de verdade para a sua propriedade. Aproveite ${prod}${price}! Estoque pronto para retirada imediata no balcão ou entrega rápida. Fale agora com um de nossos consultores técnicos na ${storeReference}. Grupo Coagro, quem planta confiança colhe resultado!`
    : `Atenção, amigo produtor e cliente do Grupo Coagro! Chegou a hora de garantir economia de verdade para a sua propriedade. Aproveite ${prod}${price}! Estoque pronto para retirada imediata no balcão ou entrega rápida em ${storeReference}. Fale agora com nossos consultores técnicos. Grupo Coagro, quem planta confiança colhe resultado!`;
}
