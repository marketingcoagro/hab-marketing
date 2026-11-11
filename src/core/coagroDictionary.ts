// src/core/coagroDictionary.ts
// Seção 9 da Especificação: Vistoria Ortográfica Obrigatória, Regra "Script-First" e Dicionário Corporativo Agro

export type AgroDictionaryCategory =
  | 'BRAND_PARTNER'
  | 'COMMERCIAL_LINE'
  | 'ACTIVE_INGREDIENT'
  | 'CULTIVAR_REGIONAL';

export interface AgroDictionaryEntry {
  id: string;
  canonicalTerm: string;
  category: AgroDictionaryCategory;
  aliases: string[];
  addedBy?: string;
  addedAtISO?: string;
}

export interface OrthographyInspectionResult {
  originalText: string;
  normalizedText: string;
  strippedErpPrefix?: string;
  autoCorrections: { from: string; to: string; category: AgroDictionaryCategory }[];
  unknownTerms: string[];
}

export const DEFAULT_AGRO_DICTIONARY: AgroDictionaryEntry[] = [
  // 1. Marcas e Fornecedores Parceiros
  { id: 'dict-coagro', canonicalTerm: 'Coagro', category: 'BRAND_PARTNER', aliases: ['coagro', 'grupo coagro'] },
  { id: 'dict-rb', canonicalTerm: 'RB Agrícola', category: 'BRAND_PARTNER', aliases: ['rb agricola', 'r b agricola'] },
  { id: 'dict-ourofino', canonicalTerm: 'Ourofino', category: 'BRAND_PARTNER', aliases: ['ouro fino', 'ouro-fino', 'ourofino'] },
  { id: 'dict-zoetis', canonicalTerm: 'Zoetis', category: 'BRAND_PARTNER', aliases: ['zoets', 'zoetis'] },
  { id: 'dict-biogenesis', canonicalTerm: 'Biogénesis Bagó', category: 'BRAND_PARTNER', aliases: ['biogenesis bago', 'biogenesis', 'bago'] },
  { id: 'dict-corteva', canonicalTerm: 'Corteva', category: 'BRAND_PARTNER', aliases: ['corteva', 'cortevva'] },
  { id: 'dict-netafim', canonicalTerm: 'Netafim', category: 'BRAND_PARTNER', aliases: ['netafin', 'netafim'] },
  { id: 'dict-belgo', canonicalTerm: 'Belgo', category: 'BRAND_PARTNER', aliases: ['belgo', 'belgo bekaert'] },
  { id: 'dict-tortuga', canonicalTerm: 'Tortuga', category: 'BRAND_PARTNER', aliases: ['tortuga', 'dsm tortuga'] },
  { id: 'dict-vallee', canonicalTerm: 'Vallée', category: 'BRAND_PARTNER', aliases: ['vallee', 'valee', 'vallée'] },
  { id: 'dict-sumitomo', canonicalTerm: 'Sumitomo', category: 'BRAND_PARTNER', aliases: ['sumitomo', 'sumitono'] },
  { id: 'dict-albaugh', canonicalTerm: 'Albaugh', category: 'BRAND_PARTNER', aliases: ['albaugh', 'albaug'] },
  { id: 'dict-fmc', canonicalTerm: 'FMC', category: 'BRAND_PARTNER', aliases: ['fmc'] },
  { id: 'dict-agrosalles', canonicalTerm: 'Agrosalles', category: 'BRAND_PARTNER', aliases: ['agro salles', 'agrosales', 'agrosalles'] },
  { id: 'dict-papalotla', canonicalTerm: 'Papalotla', category: 'BRAND_PARTNER', aliases: ['papalota', 'papalotla'] },
  { id: 'dict-forseed', canonicalTerm: 'Forseed', category: 'BRAND_PARTNER', aliases: ['forseed', 'for seed'] },
  { id: 'dict-tramontina', canonicalTerm: 'Tramontina', category: 'BRAND_PARTNER', aliases: ['travero', 'trautina', 'tramontina'] },
  { id: 'dict-jacto', canonicalTerm: 'Jacto', category: 'BRAND_PARTNER', aliases: ['jato', 'jacto'] },
  { id: 'dict-stihl', canonicalTerm: 'Stihl', category: 'BRAND_PARTNER', aliases: ['sthil', 'still', 'stihl'] },
  { id: 'dict-garthen', canonicalTerm: 'Garthen', category: 'BRAND_PARTNER', aliases: ['garten', 'garthen'] },
  { id: 'dict-bravecto', canonicalTerm: 'Bravecto', category: 'BRAND_PARTNER', aliases: ['braveto', 'bravecto'] },
  { id: 'dict-tutticanis', canonicalTerm: 'Tutticanis', category: 'BRAND_PARTNER', aliases: ['tuti canis', 'tuticanis', 'tutticanis'] },
  { id: 'dict-golden', canonicalTerm: 'Golden', category: 'BRAND_PARTNER', aliases: ['golden'] },
  { id: 'dict-premier', canonicalTerm: 'PremieR', category: 'BRAND_PARTNER', aliases: ['premier'] },

  // 2. Produtos Comerciais e Linhas
  { id: 'dict-bovigold', canonicalTerm: 'Bovigold', category: 'COMMERCIAL_LINE', aliases: ['bovi gold', 'bovigold'] },
  { id: 'dict-fosbovi', canonicalTerm: 'Fosbovi', category: 'COMMERCIAL_LINE', aliases: ['fos bovi', 'fosbovi'] },
  { id: 'dict-dectomax', canonicalTerm: 'Dectomax', category: 'COMMERCIAL_LINE', aliases: ['dectomax', 'detomax'] },
  { id: 'dict-verimark', canonicalTerm: 'Verimark', category: 'COMMERCIAL_LINE', aliases: ['verimark', 'verimarque'] },
  { id: 'dict-benevia', canonicalTerm: 'Benevia', category: 'COMMERCIAL_LINE', aliases: ['benevia'] },
  { id: 'dict-masterlp', canonicalTerm: 'Master LP', category: 'COMMERCIAL_LINE', aliases: ['master lp', 'masterlp'] },
  { id: 'dict-pencivet', canonicalTerm: 'Pencivet', category: 'COMMERCIAL_LINE', aliases: ['pencivet', 'pensivet'] },
  { id: 'dict-calfoz', canonicalTerm: 'Calfoz', category: 'COMMERCIAL_LINE', aliases: ['calfoz', 'calfos'] },
  { id: 'dict-bioxan', canonicalTerm: 'Bioxan', category: 'COMMERCIAL_LINE', aliases: ['bioxan', 'bio xam'] },
  { id: 'dict-boostin', canonicalTerm: 'Boostin', category: 'COMMERCIAL_LINE', aliases: ['bostin', 'boostin'] },
  { id: 'dict-sorovita', canonicalTerm: 'Sorovita', category: 'COMMERCIAL_LINE', aliases: ['soro vita', 'sorovita'] },
  { id: 'dict-granary', canonicalTerm: 'Granary', category: 'COMMERCIAL_LINE', aliases: ['granari', 'granary'] },
  { id: 'dict-nongrass', canonicalTerm: 'Nongrass', category: 'COMMERCIAL_LINE', aliases: ['non grass', 'nongras', 'nongrass'] },
  { id: 'dict-recop', canonicalTerm: 'Recop', category: 'COMMERCIAL_LINE', aliases: ['recop'] },
  { id: 'dict-moscaute', canonicalTerm: 'Moscaute', category: 'COMMERCIAL_LINE', aliases: ['moscaute'] },
  { id: 'dict-baratol', canonicalTerm: 'Baratol', category: 'COMMERCIAL_LINE', aliases: ['baratol'] },
  { id: 'dict-agicron', canonicalTerm: 'Agicron', category: 'COMMERCIAL_LINE', aliases: ['agicron'] },
  { id: 'dict-recover', canonicalTerm: 'Recover Black', category: 'COMMERCIAL_LINE', aliases: ['recover black'] },

  // 3. Princípios Ativos e Termos Técnicos
  { id: 'dict-ivermectina', canonicalTerm: 'Ivermectina', category: 'ACTIVE_INGREDIENT', aliases: ['ivermectna', 'ivermectina'] },
  { id: 'dict-doramectina', canonicalTerm: 'Doramectina', category: 'ACTIVE_INGREDIENT', aliases: ['doramectna', 'doramectina'] },
  { id: 'dict-ciantraniliprole', canonicalTerm: 'Ciantraniliprole', category: 'ACTIVE_INGREDIENT', aliases: ['ciantraniliprole', 'ciantraniliproli'] },
  { id: 'dict-hexazinona', canonicalTerm: 'Hexazinona', category: 'ACTIVE_INGREDIENT', aliases: ['exazinona', 'hexazinona'] },
  { id: 'dict-tebutiurom', canonicalTerm: 'Tebutiurom', category: 'ACTIVE_INGREDIENT', aliases: ['tebutiuron', 'tebutiurom'] },
  { id: 'dict-imidacloprido', canonicalTerm: 'Imidacloprido', category: 'ACTIVE_INGREDIENT', aliases: ['imidacloprid', 'imidacloprido'] },
  { id: 'dict-atrazina', canonicalTerm: 'Atrazina', category: 'ACTIVE_INGREDIENT', aliases: ['atrasina', 'atrazina'] },
  { id: 'dict-glifosato', canonicalTerm: 'Glifosato', category: 'ACTIVE_INGREDIENT', aliases: ['glifozato', 'glifosatto', 'glifosato'] },
  { id: 'dict-somatotropina', canonicalTerm: 'Somatotropina', category: 'ACTIVE_INGREDIENT', aliases: ['somatotropina'] },
  { id: 'dict-butafosfano', canonicalTerm: 'Butafosfano', category: 'ACTIVE_INGREDIENT', aliases: ['butafosfan', 'butafosfano'] },
  { id: 'dict-fenbendazol', canonicalTerm: 'Fenbendazol', category: 'ACTIVE_INGREDIENT', aliases: ['fembendazol', 'fenbendazol'] },
  { id: 'dict-tamponante', canonicalTerm: 'Tamponante Ruminal', category: 'ACTIVE_INGREDIENT', aliases: ['tamponante ruminal'] },
  { id: 'dict-proteinado', canonicalTerm: 'Proteinado', category: 'ACTIVE_INGREDIENT', aliases: ['proteinado'] },
  { id: 'dict-cipermetrina', canonicalTerm: 'Cipermetrina', category: 'ACTIVE_INGREDIENT', aliases: ['cipermetrina'] },
  { id: 'dict-oxitetraciclina', canonicalTerm: 'Oxitetraciclina', category: 'ACTIVE_INGREDIENT', aliases: ['oxitetracilina', 'oxitetraciclina'] },

  // 4. Cultivares, Sementes e Regionalismos
  { id: 'dict-brachiaria', canonicalTerm: 'Brachiaria brizantha', category: 'CULTIVAR_REGIONAL', aliases: ['braquiaria brizanta', 'brachiaria brizanta', 'brachiaria brizantha'] },
  { id: 'dict-panicum', canonicalTerm: 'Panicum maximum', category: 'CULTIVAR_REGIONAL', aliases: ['panicum maximum', 'panicun maximum'] },
  { id: 'dict-mombaca', canonicalTerm: 'Mombaça', category: 'CULTIVAR_REGIONAL', aliases: ['mombaca', 'mombaça'] },
  { id: 'dict-massai', canonicalTerm: 'Massai', category: 'CULTIVAR_REGIONAL', aliases: ['masai', 'massai'] },
  { id: 'dict-marandu', canonicalTerm: 'Marandu', category: 'CULTIVAR_REGIONAL', aliases: ['marandu', 'marandú'] },
  { id: 'dict-zuri', canonicalTerm: 'Zuri', category: 'CULTIVAR_REGIONAL', aliases: ['zuri'] },
  { id: 'dict-miyagi', canonicalTerm: 'Miyagi', category: 'CULTIVAR_REGIONAL', aliases: ['miagui', 'miyagui', 'miyagi'] },
  { id: 'dict-paiaguas', canonicalTerm: 'Paiaguás', category: 'CULTIVAR_REGIONAL', aliases: ['paiaguas', 'paiaguás'] },
  { id: 'dict-piata', canonicalTerm: 'Piatã', category: 'CULTIVAR_REGIONAL', aliases: ['piata', 'piatã'] },
  { id: 'dict-tamani', canonicalTerm: 'Tamani', category: 'CULTIVAR_REGIONAL', aliases: ['tamani'] },
  { id: 'dict-cayman', canonicalTerm: 'Cayman', category: 'CULTIVAR_REGIONAL', aliases: ['caiman', 'cayman'] },
  { id: 'dict-mestizo', canonicalTerm: 'Mestizo', category: 'CULTIVAR_REGIONAL', aliases: ['mestizo'] },
  { id: 'dict-silagem', canonicalTerm: 'Silagem', category: 'CULTIVAR_REGIONAL', aliases: ['silagem'] },
  { id: 'dict-feno', canonicalTerm: 'Feno', category: 'CULTIVAR_REGIONAL', aliases: ['feno'] },
  { id: 'dict-saldao', canonicalTerm: 'Saldão', category: 'CULTIVAR_REGIONAL', aliases: ['saldao', 'saldão'] },
  { id: 'dict-sabadao', canonicalTerm: 'Sabadão', category: 'CULTIVAR_REGIONAL', aliases: ['sabadao', 'sabadão'] },
  { id: 'dict-expoagro', canonicalTerm: 'Expoagro', category: 'CULTIVAR_REGIONAL', aliases: ['expo agro', 'expoagro'] },
  { id: 'dict-sealba', canonicalTerm: 'SEALBA', category: 'CULTIVAR_REGIONAL', aliases: ['sealba'] },
];

// Vocabulário comum do varejo agropecuário e pet (Português padrão + unidades) para não gerar falso positivo na Camada 1
const COMMON_PORTUGUESE_RETAIL_VOCAB = new Set([
  'a', 'ao', 'aos', 'as', 'ate', 'até', 'com', 'contra', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'entre',
  'na', 'nas', 'no', 'nos', 'o', 'os', 'ou', 'para', 'pela', 'pelo', 'por', 'sem', 'sob', 'sobre', 'um', 'uma',
  'racao', 'ração', 'adulto', 'filhote', 'filhotes', 'castrado', 'pequeno', 'medio', 'médio', 'grande', 'porte',
  'sabor', 'frango', 'carne', 'vegetais', 'select', 'special', 'especial', 'premium', 'original', 'tradicional',
  'herbicida', 'inseticida', 'fungicida', 'acaricida', 'fertilizante', 'adubo', 'calcario', 'calcário',
  'semente', 'sementes', 'milho', 'hibrido', 'híbrido', 'capim', 'braquiaria', 'braquiária', 'pastagem',
  'pulverizador', 'rocadeira', 'roçadeira', 'triturador', 'forrageiro', 'motosserra', 'gerador', 'ordenhadeira',
  'betoneira', 'costal', 'manual', 'eletrico', 'elétrico', 'gasolina', 'bateria', 'motobomba', 'motocultivador',
  'vacina', 'vermifugo', 'vermífugo', 'antipulgas', 'carrapaticida', 'antibiotico', 'antibiótico', 'suplemento',
  'mineral', 'bovinos', 'equinos', 'suinos', 'suínos', 'aves', 'caes', 'cães', 'gatos', 'ovinos', 'caprinos',
  'comprimido', 'comprimidos', 'solucao', 'solução', 'suspensao', 'suspensão', 'injetavel', 'injetável',
  'pacote', 'caixa', 'fardo', 'saca', 'saco', 'galao', 'galão', 'bandeja', 'frasco', 'tubo', 'lata', 'garrafa',
  'balde', 'dosador', 'oferta', 'promocao', 'promoção', 'desconto', 'avista', 'vista', 'prazo', 'parcelas',
  'juros', 'gratis', 'grátis', 'brinde', 'exclusivo', 'compre', 'ganhe', 'leve', 'pague', 'unidade', 'unidades',
  'kg', 'g', 'mg', 'l', 'lt', 'ml', 'un', 'sc', 'cx', 'pct', 'fd', 'gl', 'fr', 'doses', 'metros', 'm', 'cm', 'mm',
  'alta', 'absorcao', 'absorção', 'pelagem', 'saudavel', 'saudável', 'nutricao', 'nutrição', 'balanceada',
  'completa', 'completo', 'completas', 'completos', 'principal', 'principais', 'selecionado', 'selecionados',
  'especializada', 'especializado', 'qualidade', 'linha', 'linhas', 'produto', 'produtos', 'modelo', 'modelos',
  'palatabilidade', 'digestibilidade', 'rico', 'vitaminas', 'minerais', 'essenciais', 'embalagem', 'economica',
  'econômica', 'garanta', 'ja', 'já', 'seu', 'sua', 'loja', 'filial', 'whatsapp', 'entrega', 'imediata', 'retirada',
  'consulte', 'nosso', 'time', 'tecnico', 'técnico', 'arame', 'farpado', 'ovalado', 'galvanizado', 'bota',
  'impermeavel', 'impermeável', 'bebedouro', 'comedouro', 'tratamento', 'antiparasitario', 'antiparasitário',
  'liquido', 'líquido', 'foliar', 'organico', 'orgânico', 'condicionador', 'solo', 'controle', 'pragas',
  'plantio', 'safra', 'irrigacao', 'irrigação', 'mangueira', 'gotejamento', 'aspersor', 'bomba', 'submersa',
  'churrasqueira', 'ferramentas', 'lazer', 'jardim', 'aparador', 'grama', 'poda', 'tesoura', ' enxada', 'facao',
  'facão', 'pá', 'carrinho', 'mao', 'mão', 'rasteiro', 'concentrado', 'granulado', 'po', 'pó', 'wg', 'sc', 'ec',
  'sl', 'wp', 'npk', 'ureia', 'cloreto', 'potassio', 'potássio', 'superfosfato', 'simples', 'triplo', 'map', 'dap',
  'sal', 'branco', 'linha', 'leite', 'corte', 'engorda', 'recria', 'cria', 'lactacao', 'lactação', 'pre', 'pré',
  'parto', 'pos', 'pós', 'bezerro', 'bezerros', 'novilha', 'novilhas', 'vaca', 'vacas', 'touro', 'cavalo', 'egua',
  'égua', 'potro', 'raca', 'raça', 'todas', 'todos', 'racas', 'raças', ' portes', 'idades', 'senior', 'sênior',
  'light', 'zero', 'corante', 'transgenico', 'transgênico', 'natural', 'proteina', 'proteína', 'energia', 'fibra',
  'boro', 'zinco', 'cobre', 'manganes', 'manganês', 'ferro', 'calcio', 'cálcio', 'fosforo', 'fósforo', 'enxofre',
  'magnesio', 'magnésio', 'cobalto', 'iodo', 'selenio', 'selênio', 'vitamina', 'ade', 'complexo', 'b12', 'k',
  'aftosa', 'raiva', 'clostridiose', 'brucelose', 'mastite', 'diarreia', ' tristeza', 'parasitaria', 'parasitária',
  'mosca', 'chifre', 'berne', 'carrapato', 'carrapatos', 'pulga', 'pulgas', 'verme', 'vermes', 'sarna',
]);

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Executa a regra "Script-First" (Seção 9.1 e 9.2 da Especificação):
 * 1. Remove prefixos numéricos de ERP (ex: "0000805- " ou "00123 - ").
 * 2. Corrige variações de marcas, princípios ativos e cultivares pela tabela agro_dictionary.
 * 3. Identifica palavras fora do dicionário padrão e da whitelist técnica para alerta na Camada 1 e Camada 2.
 */
export function inspectAgroOrthography(
  rawInput: string,
  customDictionary: AgroDictionaryEntry[] = []
): OrthographyInspectionResult {
  if (!rawInput || !rawInput.trim()) {
    return {
      originalText: rawInput || '',
      normalizedText: '',
      autoCorrections: [],
      unknownTerms: [],
    };
  }

  let working = rawInput;
  let strippedErpPrefix: string | undefined;

  // 1. Remoção de código numérico interno de ERP no início (ex: "0000805- " ou "000805 - ")
  const erpPrefixMatch = working.match(/^(\d{4,10}\s*-\s*)/);
  if (erpPrefixMatch) {
    strippedErpPrefix = erpPrefixMatch[1].trim();
    working = working.slice(erpPrefixMatch[0].length);
  }

  const allEntries = [...DEFAULT_AGRO_DICTIONARY, ...customDictionary];
  const autoCorrections: { from: string; to: string; category: AgroDictionaryCategory }[] = [];

  // 2. Substituição determinística de aliases multi-palavra e palavra única (ex: "Ouro Fino" -> "Ourofino")
  for (const entry of allEntries) {
    for (const alias of entry.aliases) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedAlias}\\b`, 'gi');
      working = working.replace(regex, (matched) => {
        if (matched !== entry.canonicalTerm) {
          autoCorrections.push({
            from: matched,
            to: entry.canonicalTerm,
            category: entry.category,
          });
        }
        return entry.canonicalTerm;
      });
    }
  }

  // Normaliza espaços duplos
  const normalizedText = working.replace(/\s{2,}/g, ' ').trim();

  // 3. Constrói índice de termos conhecidos (canônicos + aliases + vocabulário comum)
  const knownNormalizedTokens = new Set<string>();
  for (const w of COMMON_PORTUGUESE_RETAIL_VOCAB) {
    knownNormalizedTokens.add(normalizeKey(w));
  }
  for (const entry of allEntries) {
    for (const part of entry.canonicalTerm.split(/\s+/)) {
      knownNormalizedTokens.add(normalizeKey(part));
    }
    for (const alias of entry.aliases) {
      for (const part of alias.split(/\s+/)) {
        knownNormalizedTokens.add(normalizeKey(part));
      }
    }
  }

  // 4. Verifica tokens alfabéticos >= 4 letras que não estão na whitelist nem no vocabulário
  const rawTokens = normalizedText.match(/[A-Za-zÀ-ÖØ-öø-ÿ]{4,}/g) || [];
  const unknownSet = new Set<string>();

  for (const token of rawTokens) {
    // Ignora tokens alfanuméricos de medida/código ou siglas curtas
    const norm = normalizeKey(token);
    if (!norm || norm.length < 4) continue;
    // Aceita plurais simples de palavras conhecidas
    const singularNorm = norm.endsWith('s') ? norm.slice(0, -1) : norm;
    if (!knownNormalizedTokens.has(norm) && !knownNormalizedTokens.has(singularNorm)) {
      unknownSet.add(token);
    }
  }

  return {
    originalText: rawInput,
    normalizedText,
    strippedErpPrefix,
    autoCorrections,
    unknownTerms: Array.from(unknownSet),
  };
}
