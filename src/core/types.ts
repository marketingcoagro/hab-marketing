// src/core/types.ts

const safeEnv =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env) ||
  {};

export const SAAS_BRAND = {
  name: 'Gabarito Pro',
  shortName: 'Gabarito',
  tagline: 'Precificação em 10s & Governança Visual',
  domain: 'gabarito.pro',
  commercialWhatsapp: (safeEnv.VITE_COMMERCIAL_WHATSAPP || '5511999990000').replace(/\D/g, ''),
  checkoutBalcaoUrl: safeEnv.VITE_CHECKOUT_BALCAO_URL || '',
  checkoutRedeUrl: safeEnv.VITE_CHECKOUT_REDE_URL || '',
  plans: {
    balcaoProPrice: 97,
    governancaPrice: 197,
  },
} as const;

export const COAGRO_HUB_BRAND = {
  name: 'Hub Coagro',
  shortName: 'Coagro Hub',
  version: '3.4.0',
  tagline: 'Central de Criação, Governança de Marca & Demandas de Marketing',
  curatorName: 'Kaio Virgínio (Marketing Coagro)',
  curatorEmail: 'marketing@grupocoagro.com.br',
  primaryColorHex: '#002B49',   // Azul Oficial da Logotipo Coagro
  secondaryColorHex: '#004d40', // Verde-Safra Institucional
  accentColorHex: '#ffab00',    // Dourado / Amarelo Ouro
} as const;

// Par único oficial do Hub Coagro. Os presets white-label antigos permanecem
// tipados para leitura de backups, mas o produto não permite mais substituí-lo.
export const COAGRO_OFFICIAL_FONT_HEADING = "'Exo 2', sans-serif";
export const COAGRO_OFFICIAL_FONT_BODY = "'Inter', sans-serif";

export type CoagroUserRole = 'OPERATOR' | 'STORE_MANAGER' | 'CURATOR_ADMIN';

export type GovernanceTrack = 'GREEN_DIRECT' | 'YELLOW_CURATOR';

export type MarketingRequestStatus =
  | 'PENDING'
  | 'QUOTING'
  | 'APPROVED'
  | 'NEEDS_REVISION'
  | 'REJECTED';

export function buildCommercialCheckoutUrl(
  plan: 'BALCAO' | 'REDE',
  whatsappMessage: string
): string {
  if (plan === 'BALCAO' && SAAS_BRAND.checkoutBalcaoUrl) {
    return SAAS_BRAND.checkoutBalcaoUrl;
  }
  if (plan === 'REDE' && SAAS_BRAND.checkoutRedeUrl) {
    return SAAS_BRAND.checkoutRedeUrl;
  }
  const phone = SAAS_BRAND.commercialWhatsapp || '5511999990000';
  return `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`;
}

export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export type ModuleMode =
  | 'STORE_POSTER'
  | 'SOCIAL_MEDIA'
  | 'CAROUSEL'
  | 'HR_NOTICE'
  | 'BRAND_HUB'
  | 'CAMPAIGNS'
  | 'CURATOR_QUEUE'
  | 'BANNER_FAIXA'
  | 'RADIO_SPOT';

export type PrintGridFormat = 
  | 'A4_FULL'
  | 'A5_HALF'
  | 'GONDOLA_2X2';

export type SocialAspectRatio = 
  | 'STORY_9_16'
  | 'FEED_4_5'
  | 'SQUARE_1_1';

export type RoundingStrategy = 
  | 'NONE'
  | 'PSYCH_90'
  | 'PSYCH_99'
  | 'PSYCH_49'
  | 'INTEGER_UP'
  | 'INTEGER_DOWN';

export type ValidityPreset = 
  | 'TODAY_ONLY'
  | 'WEEKEND'
  | 'END_OF_WEEK'
  | 'END_OF_MONTH'
  | 'CUSTOM_DATE';

export type RegulatoryCategory = 
  | 'STANDARD'
  | 'AGRO_PESTICIDE'
  | 'AGRO_FERTILIZER_SEED'
  | 'VET_PRESCRIPTION'
  | 'ALCOHOL_18'
  | 'NEAR_EXPIRY';

export type CommercialMechanicType = 
  | 'SIMPLE_DE_POR'
  | 'TAKE_X_PAY_Y'
  | 'SECOND_UNIT_50'
  | 'WHOLESALE_VOLUME'
  | 'TURBO_EXPIRY'
  | 'LOYALTY_CLUB'
  | 'INSTALLMENT_FINANCING'
  | 'BUY_WIN_GIFT'
  | 'COMBO_ADVANTAGE';

export type PosterLayoutArchetype =
  | 'PROMO_CLASSIC_V'
  | 'PROMO_MODERN_V'
  | 'CLEAN_DIRECT_PRICE'
  | 'MACHINERY_INSTALLMENT'
  | 'CONDITION_ADVANTAGE'
  | 'COMBO_ADVANTAGE'
  | 'GRID_MULTIPRODUCT_4X';

export interface CoagroTemplateAvailability {
  id: PosterLayoutArchetype;
  label: string;
  enabled: boolean;
  hidden?: boolean;
}

export const COAGRO_OFFICIAL_POSTER_ARCHETYPE: PosterLayoutArchetype = 'PROMO_CLASSIC_V';

// Curadoria oficial do Hub: os renderizadores antigos permanecem no código para
// abrir peças salvas, mas somente o Promo V fica disponível para novas peças.
export const COAGRO_POSTER_TEMPLATE_CATALOG: CoagroTemplateAvailability[] = [
  { id: 'PROMO_CLASSIC_V', label: 'Promo V Clássico', enabled: true },
  { id: 'PROMO_MODERN_V', label: 'Varejo Pop', enabled: false, hidden: true },
  { id: 'CLEAN_DIRECT_PRICE', label: 'Preço Direto', enabled: false, hidden: true },
  { id: 'MACHINERY_INSTALLMENT', label: 'Parcelado CDC', enabled: false, hidden: true },
  { id: 'CONDITION_ADVANTAGE', label: 'Brinde / Condição', enabled: false, hidden: true },
  { id: 'COMBO_ADVANTAGE', label: 'Combo', enabled: false, hidden: true },
  { id: 'GRID_MULTIPRODUCT_4X', label: 'Encarte Grid', enabled: false, hidden: true },
];

export type VisualThemePreset = 
  | 'BW_ECO_TONER'
  | 'BRAND_PRIMARY'
  | 'BRAND_SECONDARY'
  | 'HIGH_CONTRAST_ALERT'
  | 'CAMPAIGN_SEASONAL';

export type GuardrailSeverity = 'ok' | 'warn' | 'approval' | 'block';

export interface GuardrailFinding {
  id: string;
  code:
    | 'PRICE_INVERTED'
    | 'BELOW_COST_MARGIN'
    | 'LOW_MARGIN_WARN'
    | 'HARD_MAX_DISCOUNT'
    | 'APPROVAL_DISCOUNT'
    | 'BANNED_WORD'
    | 'EXPIRES_BEFORE_PROMO'
    | 'COPY_CONDENSED'
    | 'EMPTY_REQUIRED_FIELD';
  severity: GuardrailSeverity;
  message: string;
  legalRef?: string;
}

export type TypographyPresetId =
  | 'INDUSTRIAL_IMPACT'
  | 'AGRO_ROBUST'
  | 'RETAIL_CLASSIC'
  | 'TECH_PRECISION';

export type VisualStylePreset =
  | 'RETAIL_POP'
  | 'AGRO_BRUTALIST'
  | 'MINIMAL_BOUTIQUE'
  | 'SUPERMARKET_IMPACT'
  | 'ECO_TONER';

export interface SubBrandDepartment {
  id: string;
  label: string;
  iconKey: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  accentColorHex: string;
  logoUrl?: string;
  enabled?: boolean;
}

export interface SeasonalCampaignMediaStory {
  id: string;
  title: string;
  previewUrl?: string;
  downloadFilename?: string;
}

export interface SeasonalCampaignVideo {
  id: string;
  department: 'Nutrição Animal' | 'Defensivos' | 'Máquinas' | 'Pet';
  title: string;
  duration: string;
  videoUrl?: string;
}

export interface SeasonalCampaignRadioSpot {
  id: string;
  title: string;
  durationSeconds: number;
  audioUrl?: string;
}

export interface SeasonalCampaign {
  id: string;
  name: string;
  badgeText: string;
  primaryColorHex: string;
  accentColorHex: string;
  bannerHeaderUrl?: string;
  badgeLogoUrl?: string;
  description?: string;
  stories?: SeasonalCampaignMediaStory[];
  departmentVideos?: SeasonalCampaignVideo[];
  radioSpots?: SeasonalCampaignRadioSpot[];
}

export interface TenantBrandKit {
  tenantId: string;
  companyName: string;
  defaultLogoUrl?: string;
  typographyPresetId?: TypographyPresetId;
  visualStylePreset?: VisualStylePreset;
  fontHeading: string;
  fontBody: string;
  mapaRegistrationCode?: string;
  defaultPhoneWhatsapp?: string;
  defaultBranchName?: string;
  alertPrimaryColorHex?: string;
  alertAccentColorHex?: string;
  enableSubDepartments?: boolean;
  departments: SubBrandDepartment[];
  activeDepartmentId: string;
  seasonalCampaigns: SeasonalCampaign[];
  activeCampaignId?: string;
  minMarginPct?: number;
  maxDiscountApprovalPct?: number;
  hardMaxDiscountBlockPct?: number;
  bannedWords?: string[];
  geminiApiKey?: string;
}

export interface ProductBulletItem {
  id: string;
  text: string;
}

export interface VisionEnrichmentInput {
  rawTitle?: string;
  imageBase64OrUrl?: string;
  departmentContext?: string;
}

export interface VisionEnrichmentResult {
  source: 'LOCAL_HEURISTIC' | 'CACHE_SKU' | 'VISION_LLM';
  cleanedTitle: string;
  suggestedSubtitle: string;
  extractedUnit: string;
  extractedWeightVolume?: number;
  suggestedBullets: string[];
  detectedCategory: RegulatoryCategory;
  suggestedCta: string;
  confidenceScore: number;
}

export interface ProductEnricherPort {
  enrichProduct(input: VisionEnrichmentInput): Promise<VisionEnrichmentResult>;
}

export interface ErpCatalogRecord {
  skuCode: string;
  eanBarcode?: string;
  ncmCode?: string;
  rawTitle: string;
  cleanedTitle: string;
  subtitle?: string;
  unit: string;
  netWeightOrVolume?: number;
  costPrice?: number;
  priceFrom?: number;
  priceTo: number;
  regulatoryCategory: RegulatoryCategory;
  mechanicType?: CommercialMechanicType;
  installmentCount?: number;
  giftOrConditionText?: string;
  departmentId?: string;
  updatedAtISO?: string;
  productImageUrl?: string;
}

export interface ErpSyncConfig {
  providerLabel: string;
  endpointOrSheetUrl?: string;
  lastSyncISO?: string;
  lastDetectedFormat?: string;
  autoApplyArchetypeOnLookup: boolean;
}

export interface ErpCatalogLookupPort {
  lookupBySkuOrQuery(query: string): ErpCatalogRecord | null;
}

export interface OfferItemState {
  id: string;
  skuCode: string;
  rawTitle: string;
  cleanedTitle: string;
  subtitle: string;
  bullets: ProductBulletItem[];
  ctaText: string;
  imageUrl?: string;
  productImageUrl?: string;
  unit: string;
  netWeightOrVolume?: number;
  costPrice?: number;
  priceFrom?: number;
  priceToRaw: number;
  roundingStrategy: RoundingStrategy;
  mechanicType: CommercialMechanicType;
  takeQty: number;
  payQty: number;
  secondUnitDiscountPercent?: number;
  minWholesaleQty: number;
  installmentCount?: number;
  installmentInterestFree?: boolean;
  giftOrConditionText?: string;
  headerLabel: string;
  regulatoryCategory: RegulatoryCategory;
  validityPreset: ValidityPreset;
  customValidityDateISO?: string;
  nearExpiryDaysLeft?: number;
}

export interface BatchParsedRow {
  rowNumber: number;
  skuCode: string;
  ncmCode?: string;
  rawTitle: string;
  cleanedTitle: string;
  unit: string;
  netWeightOrVolume?: number;
  costPrice?: number;
  priceFrom?: number;
  priceTo: number;
  discountPct: number;
  regulatoryCategory: RegulatoryCategory;
  mechanicType?: CommercialMechanicType;
  installmentCount?: number;
  giftOrConditionText?: string;
  status: 'VALID' | 'WARNING' | 'BLOCKED';
  statusMessage?: string;
}

export interface CarouselSlideItem {
  id: string;
  slideType: 'HOOK_COVER' | 'PRODUCT_OR_CONTENT' | 'FINAL_CTA';
  headline: string;
  bodyText: string;
  backgroundImageUrl?: string;
  linkedOfferId?: string;
  linkedSkuCode?: string;
  priceFrom?: number;
  priceTo?: number;
  unit?: string;
  mechanicType?: CommercialMechanicType;
  installmentCount?: number;
  giftOrConditionText?: string;
  regulatoryCategory?: RegulatoryCategory;
}

export type HrNoticeArchetype =
  | 'JOB_VACANCY'
  | 'INTERNAL_NOTICE'
  | 'HOLIDAY_CLOSURE'
  | 'SAFETY_COMPLIANCE';

export type HrNoticeChannel =
  | 'MURAL_A4'
  | 'SOCIAL_INTERNAL'
  | 'BOARD_FORMAL';

export interface HrNoticeState {
  id: string;
  referenceCode: string;
  archetype: HrNoticeArchetype;
  channel?: HrNoticeChannel;
  headline: string;
  roleOrSubject: string;
  requirementsOrPoints: string[];
  scheduleOrLocation: string;
  compensationOrHighlight: string;
  contactChannel: string;
  validityOrDeadlineText: string;
  outputFormat: 'A4_PRINT' | 'SOCIAL_FEED';
}

export interface LeadProfile {
  name?: string;
  storeName?: string;
  whatsappOrEmail?: string;
  branchCount?: string;
  authProvider?: 'google' | 'direct';
  capturedAt?: string;
}

export interface GenerationAuditRecord {
  id: string;
  timestampISO: string;
  forensicId?: string;
  tenantId?: string;
  userId?: string;
  module: ModuleMode;
  skuCode?: string;
  title: string;
  priceTo?: number;
  priceFrom?: number;
  outputFormat?: string;
  theme?: VisualThemePreset;
  inputsMetadata?: Record<string, unknown>;
  mechanicType?: string;
  thumbnailDataUrl?: string;
}

import type { AgroDictionaryEntry } from './coagroDictionary';

export interface BannerFaixaDraft {
  id: string;
  pieceType: 'FAIXA_RUA' | 'BANNER_ILHOS' | 'LONA_FACHADA';
  widthCm: number;
  heightCm: number;
  campaignTitle: string;
  featuredProductOrPartner: string;
  priceText?: string;
  quantity: number;
  notes?: string;
}

export interface RadioSpotDraft {
  id: string;
  spotType: 'PRODUCT_OFFER' | 'STORE_HOURS' | 'SUPPLIER_CAMPAIGN';
  durationSeconds: 15 | 30;
  productOrSubject: string;
  priceText?: string;
  startDateISO: string;
  endDateISO: string;
  scriptText: string;
  targetStoreIds: string[];
  priority: 1 | 2;
  mentionStoreName?: boolean;
}

export interface MarketingRequestItem {
  id: string;
  protocolCode: string;
  createdAtISO: string;
  updatedAtISO: string;
  storeId: string;
  storeName: string;
  requesterEmail: string;
  moduleType: ModuleMode;
  title: string;
  subtitleOrSummary: string;
  governanceTrack: GovernanceTrack;
  status: MarketingRequestStatus;
  guardrailWarnings: string[];
  unknownDictionaryTerms: string[];
  curatorNotes?: string;
  approvedFileUrl?: string;
  payloadJson: {
    offer?: OfferItemState;
    hrNotice?: HrNoticeState;
    bannerFaixa?: BannerFaixaDraft;
    radioSpot?: RadioSpotDraft;
  };
}

export interface GovernanceEvaluation {
  track: GovernanceTrack;
  canDirectExport: boolean;
  requiresCuratorApproval: boolean;
  hasBlockingError: boolean;
  reasons: string[];
  unknownTerms: string[];
  autoCorrections: { from: string; to: string }[];
  primaryActionLabel: string;
}

export interface StudioGlobalState {
  schemaVersion: number;
  tenantId?: string;
  userId?: string;
  activeStoreId: string;
  userRole: CoagroUserRole;
  planTier: PlanTier;
  activeModule: ModuleMode;
  brandKit: TenantBrandKit;
  freemiumQuota: {
    usedThisMonth: number;
    monthlyLimit: number;
  };
  leadProfile?: LeadProfile;
  posterConfig: {
    printGrid: PrintGridFormat;
    visualTheme: VisualThemePreset;
    layoutArchetype: PosterLayoutArchetype;
    showDiscountPercentageBadge: boolean;
    showPricePerKgOrLiter: boolean;
    batchMode: boolean;
  };
  socialConfig: {
    aspectRatio: SocialAspectRatio;
    visualTheme: VisualThemePreset;
    showSafeZonesGuide: boolean;
    showBullets: boolean;
  };
  currentOffer: OfferItemState;
  batchOffers: OfferItemState[];
  parsedBatchRows: BatchParsedRow[];
  customCatalogDb: ErpCatalogRecord[];
  erpSyncConfig: ErpSyncConfig;
  carouselSlides: CarouselSlideItem[];
  activeCarouselSlideIndex: number;
  hrNotice: HrNoticeState;
  bannerFaixaDraft: BannerFaixaDraft;
  radioSpotDraft: RadioSpotDraft;
  marketingRequests: MarketingRequestItem[];
  customAgroDictionary: AgroDictionaryEntry[];
  lastSubmittedRequest?: MarketingRequestItem | null;
  generationAuditHistory?: GenerationAuditRecord[];
}
