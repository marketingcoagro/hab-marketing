// src/core/store.ts
import { useSyncExternalStore } from 'react';
import {
    StudioGlobalState,
    OfferItemState,
    ModuleMode,
    PrintGridFormat,
    SocialAspectRatio,
    VisualThemePreset,
    RoundingStrategy,
    ValidityPreset,
    CommercialMechanicType,
    PosterLayoutArchetype,
    RegulatoryCategory,
    BatchParsedRow,
    TenantBrandKit,
    SubBrandDepartment,
    PlanTier,
    TypographyPresetId,
    ErpCatalogRecord,
    ErpSyncConfig,
    CarouselSlideItem,
    HrNoticeState,
    HrNoticeArchetype,
    SeasonalCampaign,
    VisualStylePreset,
    LeadProfile,
    GenerationAuditRecord,
    CoagroUserRole,
    MarketingRequestItem,
    MarketingRequestStatus,
    BannerFaixaDraft,
    RadioSpotDraft,
    COAGRO_OFFICIAL_FONT_HEADING,
    COAGRO_OFFICIAL_FONT_BODY,
    COAGRO_OFFICIAL_POSTER_ARCHETYPE,
    COAGRO_POSTER_TEMPLATE_CATALOG,
} from './types';
import { sendLeadCapturedToN8n } from '../utils/leadWebhook';
import { getCoagroStoreById } from './coagroStores';
import type { AgroDictionaryCategory } from './coagroDictionary';
import {
    SmartProductEnricherService,
    cleanErpProductTitle,
    detectRegulatoryCategoryByText,
    parseWhatsAppSmartPaste,
    parseErpBatchTable,
    lookupErpCatalogBySku,
    normalizeUniversalErpDataset,
    resolveRecommendedArchetype,
    computeOfferMetrics,
    formatBRL,
    WHITE_LABEL_TYPOGRAPHY_PRESETS,
    WHITE_LABEL_SEGMENT_PRESETS,
    DEFAULT_ERP_CATALOG_DB,
    evaluateGovernanceTrack,
    buildRadioSpotScript,
} from './businessRules';
import {
    upsertRemoteMarketingRequest,
    updateRemoteMarketingRequestStatus,
    insertRemoteAgroDictionaryTerm,
    fetchRemoteMarketingRequests,
    fetchRemoteAgroDictionary,
    isCloudSyncConfigured,
} from './cloudSync';

const STORAGE_KEY = 'coagro_marketing_hub_state_v1';

// Instância padrão do motor de enriquecimento (Custo R$ 0 no modo local)
const enricherService = new SmartProductEnricherService();

export const DEFAULT_INITIAL_STATE: StudioGlobalState = {
    schemaVersion: 6,
    activeStoreId: 'expedicionario',
    userRole: 'STORE_MANAGER',
    planTier: 'ENTERPRISE',
    activeModule: 'STORE_POSTER',
    leadProfile: {
        name: 'Gerência de Filial',
        storeName: 'Coagro Expedicionário',
        whatsappOrEmail: 'gerente.expedicionario@grupocoagro.com.br',
        branchCount: '15 unidades',
        authProvider: 'direct',
    },
    brandKit: {
        tenantId: 'grupo-coagro',
        companyName: 'Grupo Coagro',
        typographyPresetId: 'AGRO_ROBUST',
        visualStylePreset: 'AGRO_BRUTALIST',
        fontHeading: COAGRO_OFFICIAL_FONT_HEADING,
        fontBody: COAGRO_OFFICIAL_FONT_BODY,
        mapaRegistrationCode: 'MAPA: AL/SE/BA-02895',
        defaultPhoneWhatsapp: '(82) 98836-0275',
        defaultBranchName: 'Coagro Expedicionário',
        alertPrimaryColorHex: '#002B49',
        alertAccentColorHex: '#ffab00',
        enableSubDepartments: true,
        activeDepartmentId: 'dept-1',
        departments: [
            {
                id: 'dept-1',
                label: 'Grupo Coagro (Agro)',
                iconKey: 'leaf',
                primaryColorHex: '#002B49',   // Azul Oficial da Logotipo Coagro
                secondaryColorHex: '#004d40', // Verde-Safra Institucional
                accentColorHex: '#ffab00',    // Ouro Safra Oficial Coagro
                enabled: true,
            },
            {
                id: 'dept-2',
                label: 'Coagro Pet',
                iconKey: 'heart',
                primaryColorHex: '#001C71',   // Azul Royal Pet Oficial
                secondaryColorHex: '#4897D0', // Azul Celeste Pet Oficial
                accentColorHex: '#ffab00',    // Ouro Destaque Pet
                enabled: true,
            },
            {
                id: 'dept-3',
                label: 'RB Agrícola',
                iconKey: 'shield',
                primaryColorHex: '#002B49',
                secondaryColorHex: '#386A27',
                accentColorHex: '#F0A01B',
                enabled: false,
            },
        ],
        seasonalCampaigns: [
            {
                id: 'camp-saldao',
                name: 'Saldão Coagro',
                badgeText: 'SALDÃO COAGRO',
                primaryColorHex: '#002B49',
                accentColorHex: '#ffab00',
                description: 'Ação comercial de grande impacto e queima de estoque em todas as filiais.',
            },
            {
                id: 'camp-black-friday',
                name: 'Black Friday Coagro',
                badgeText: 'BLACK FRIDAY COAGRO',
                primaryColorHex: '#0f172a',
                accentColorHex: '#ffab00',
                description: 'Visual dark/gold premium com descontos agressivos para safra e ferramentas.',
            },
            {
                id: 'camp-sabadao',
                name: 'Sabadão do Produtor',
                badgeText: 'SABADÃO DO PRODUTOR',
                primaryColorHex: '#004d40',
                accentColorHex: '#ffab00',
                description: 'Ação semanal de balcão aos sábados com foco no produtor rural e pastagem.',
            },
            {
                id: 'camp-fechames',
                name: 'Fecha Mês Coagro',
                badgeText: 'FECHA MÊS COAGRO',
                primaryColorHex: '#002B49',
                accentColorHex: '#f59e0b',
                description: 'Últimos dias do mês para bater metas de faturamento e zerar lotes.',
            },
            {
                id: 'camp-natal',
                name: 'Natal Coagro',
                badgeText: 'NATAL COAGRO',
                primaryColorHex: '#991b1b',
                accentColorHex: '#ffab00',
                description: 'Campanha de fim de ano institucional e de presentes na Coagro Pet e Agro.',
            },
        ],
    },
    freemiumQuota: {
        usedThisMonth: 0,
        monthlyLimit: 99999,
    },
    posterConfig: {
        printGrid: 'A4_FULL',
        visualTheme: 'BW_ECO_TONER',
        layoutArchetype: COAGRO_OFFICIAL_POSTER_ARCHETYPE,
        showDiscountPercentageBadge: true,
        showPricePerKgOrLiter: true,
        batchMode: false,
    },
    socialConfig: {
        aspectRatio: 'STORY_9_16',
        visualTheme: 'BRAND_PRIMARY',
        showSafeZonesGuide: false,
        showBullets: true,
    },
    currentOffer: {
        id: 'offer-initial',
        skuCode: '12345',
        rawTitle: 'RAÇÃO TUTTICANIS SELECT 10.1 KG',
        cleanedTitle: 'Ração Tutticanis Select 10,1KG',
        subtitle: 'Nutrição balanceada de alta absorção e pelagem saudável',
        bullets: [
            { id: 'b1', text: 'Alta palatabilidade e digestibilidade' },
            { id: 'b2', text: 'Rico em vitaminas e minerais essenciais' },
            { id: 'b3', text: 'Embalagem econômica de 10,1kg' },
        ],
        ctaText: 'Garanta já o seu!',
        imageUrl: undefined,
        unit: 'UN',
        netWeightOrVolume: 10.1,
        costPrice: undefined,
        priceFrom: 58.0,
        priceToRaw: 44.0,
        roundingStrategy: 'NONE',
        mechanicType: 'SIMPLE_DE_POR',
        takeQty: 3,
        payQty: 2,
        minWholesaleQty: 10,
        installmentCount: 6,
        installmentInterestFree: true,
        giftOrConditionText: 'COMPRE 1 E GANHE BRINDE EXCLUSIVO',
        headerLabel: 'OFERTA',
        regulatoryCategory: 'STANDARD',
        validityPreset: 'END_OF_WEEK',
    },
    batchOffers: [],
    parsedBatchRows: [],
    customCatalogDb: [],
    erpSyncConfig: {
        providerLabel: 'Catálogo Universal (Bling / Tiny / TOTVS / Sankhya / CSV / JSON)',
        endpointOrSheetUrl: '',
        autoApplyArchetypeOnLookup: true,
    },
    carouselSlides: [
        {
            id: 'slide-1',
            slideType: 'HOOK_COVER',
            headline: 'OFERTAS DA SEMANA PARA SUA PROPRIEDADE',
            bodyText: 'Arraste para o lado e confira os itens selecionados com preço de lote.',
            linkedSkuCode: 'CAT-SEMANA',
        },
        {
            id: 'slide-2',
            slideType: 'PRODUCT_OR_CONTENT',
            headline: 'Ração Tutticanis Select 10,1KG',
            bodyText: 'Por R$ 44,00/UN (De R$ 58,00) • Nutrição balanceada de alta absorção.',
            linkedOfferId: 'offer-initial',
            linkedSkuCode: '12345',
            priceFrom: 58.0,
            priceTo: 44.0,
            unit: 'UN',
            mechanicType: 'SIMPLE_DE_POR',
            regulatoryCategory: 'STANDARD',
        },
        {
            id: 'slide-3',
            slideType: 'FINAL_CTA',
            headline: 'FALE COM NOSSO TIME NO WHATSAPP',
            bodyText: 'Clique no link ou mande mensagem agora para reservar seu pedido na filial.',
            linkedSkuCode: 'CTA-ZAP',
        },
    ],
    activeCarouselSlideIndex: 0,
    hrNotice: {
        id: 'hr-initial',
        referenceCode: 'VAGA-01',
        archetype: 'JOB_VACANCY',
        headline: 'ESTAMOS CONTRATANDO',
        roleOrSubject: 'Consultor(a) de Vendas Balcão / Agro',
        requirementsOrPoints: [
            'Experiência em atendimento comercial ou balcão agropecuário',
            'Boa comunicação, organização e foco em metas',
            'Disponibilidade para horário comercial (Segunda a Sábado)',
        ],
        scheduleOrLocation: 'Presencial • Horário Comercial (Seg a Sáb)',
        compensationOrHighlight: 'Salário Fixo + Comissão + Vale Alimentação',
        contactChannel: 'Envie seu currículo pelo WhatsApp ou entregue na recepção da loja',
        validityOrDeadlineText: 'Inscrições abertas até preenchimento da vaga',
        outputFormat: 'A4_PRINT',
    },
    bannerFaixaDraft: {
        id: 'banner-initial',
        pieceType: 'LONA_FACHADA',
        widthCm: 400,
        heightCm: 100,
        campaignTitle: 'SALDÃO DE SAFRA & IRRIGAÇÃO COAGRO',
        featuredProductOrPartner: 'Linha Completa Netafim, Corteva & Ourofino',
        priceText: 'Condições Especiais de Safra',
        quantity: 2,
        notes: 'Lona 440g com acabamento em ilhós a cada 30cm para fachada externa.',
    },
    radioSpotDraft: {
        id: 'radio-initial',
        spotType: 'PRODUCT_OFFER',
        durationSeconds: 30,
        productOrSubject: 'Herbicida Hexazinona e Linha Ourofino com preço de lote',
        priceText: 'R$ 549,90 à vista',
        startDateISO: '2026-11-10',
        endDateISO: '2026-11-30',
        scriptText:
            'Atenção, amigo produtor e cliente da Coagro Expedicionário! Chegou a hora de garantir economia de verdade para a sua propriedade. Aproveite Herbicida Hexazinona e Linha Ourofino com preço de lote por apenas R$ 549,90 à vista! Estoque pronto para retirada imediata no balcão ou entrega rápida. Fale agora com um de nossos consultores técnicos na Coagro Expedicionário. Grupo Coagro, quem planta confiança colhe resultado!',
        targetStoreIds: ['expedicionario', 'aracaju', 'lagarto'],
        priority: 1,
        mentionStoreName: true,
    },
    marketingRequests: [
        {
            id: 'req-seed-1',
            protocolCode: 'REQ-2041',
            createdAtISO: '2026-11-10T11:20:00.000Z',
            updatedAtISO: '2026-11-10T11:20:00.000Z',
            storeId: 'lagarto',
            storeName: 'Coagro Lagarto',
            requesterEmail: 'gerente.lagarto@grupocoagro.com.br',
            moduleType: 'SOCIAL_MEDIA',
            title: 'Pulverizador Costal Jacto XP16 16LT',
            subtitleOrSummary: 'Story 9:16 • De R$ 429,00 por R$ 349,90',
            governanceTrack: 'YELLOW_CURATOR',
            status: 'PENDING',
            guardrailWarnings: [
                'Peças de Redes Sociais e Listas de Transmissão passam pela homologação visual do Curador.',
            ],
            unknownDictionaryTerms: [],
            payloadJson: {
                offer: {
                    id: 'offer-lagarto-1',
                    skuCode: '2041',
                    rawTitle: 'PULVERIZADOR COSTAL JACTO XP16 16L',
                    cleanedTitle: 'Pulverizador Costal Jacto XP16 16LT',
                    subtitle: 'Pressão constante, leveza e alta durabilidade no campo',
                    bullets: [
                        { id: 'b1', text: 'Tanque anatômico de 16 litros em polietileno' },
                        { id: 'b2', text: 'Bico regulável e alça acolchoada' },
                        { id: 'b3', text: 'Peças de reposição originais na loja' },
                    ],
                    ctaText: 'PEÇA NO WHATSAPP',
                    unit: 'UN',
                    netWeightOrVolume: 16,
                    priceFrom: 429.0,
                    priceToRaw: 349.9,
                    roundingStrategy: 'NONE',
                    mechanicType: 'SIMPLE_DE_POR',
                    takeQty: 3,
                    payQty: 2,
                    minWholesaleQty: 5,
                    installmentCount: 6,
                    installmentInterestFree: true,
                    giftOrConditionText: '',
                    headerLabel: 'OFERTA',
                    regulatoryCategory: 'STANDARD',
                    validityPreset: 'END_OF_WEEK',
                },
            },
        },
        {
            id: 'req-seed-2',
            protocolCode: 'REQ-2042',
            createdAtISO: '2026-11-10T12:05:00.000Z',
            updatedAtISO: '2026-11-10T12:05:00.000Z',
            storeId: 'delmiro',
            storeName: 'Coagro Delmiro Gouveia',
            requesterEmail: 'gerente.delmiro@grupocoagro.com.br',
            moduleType: 'BANNER_FAIXA',
            title: 'Lona de Fachada 400×100cm — Saldão Pastagem Mombaça',
            subtitleOrSummary: 'Cotação Gráfica • 2 unidades • Lona 440g c/ ilhós',
            governanceTrack: 'YELLOW_CURATOR',
            status: 'QUOTING',
            guardrailWarnings: [
                'Material físico de grande formato exige Cotação Gráfica e fechamento CMYK pelo Marketing.',
            ],
            unknownDictionaryTerms: ['ForrageiraX'],
            curatorNotes: 'Solicitado orçamento na Gráfica Real Arapiraca.',
            payloadJson: {
                bannerFaixa: {
                    id: 'banner-delmiro-1',
                    pieceType: 'LONA_FACHADA',
                    widthCm: 400,
                    heightCm: 100,
                    campaignTitle: 'SALDÃO DE SEMENTES & PASTAGEM MOMBAÇA',
                    featuredProductOrPartner: 'Sementes Papalotla & ForrageiraX',
                    priceText: 'A partir de R$ 189,90/SC',
                    quantity: 2,
                    notes: 'Instalação na grade frontal da filial Delmiro Gouveia (Trevo Maria do Bode).',
                },
            },
        },
        {
            id: 'req-seed-3',
            protocolCode: 'REQ-2043',
            createdAtISO: '2026-11-10T13:15:00.000Z',
            updatedAtISO: '2026-11-10T13:15:00.000Z',
            storeId: 'aracaju',
            storeName: 'Coagro Aracaju (Matriz SE)',
            requesterEmail: 'gerente.aracaju@grupocoagro.com.br',
            moduleType: 'RADIO_SPOT',
            title: 'Spot 30s — Oferta Dectomax & Bovigold (Rádio Coagro)',
            subtitleOrSummary: 'Roteiro 30s • Prioridade 2x • Lojas SE (Aracaju, Lagarto, Umbaúba)',
            governanceTrack: 'YELLOW_CURATOR',
            status: 'PENDING',
            guardrailWarnings: [
                'Spot de áudio exige gravação e publicação pelo Curador no Spotifast Server (:8790).',
            ],
            unknownDictionaryTerms: [],
            payloadJson: {
                radioSpot: {
                    id: 'radio-aracaju-1',
                    spotType: 'PRODUCT_OFFER',
                    durationSeconds: 30,
                    productOrSubject: 'Dectomax 500mL e Linha Mineral Bovigold Tortuga',
                    priceText: 'condição especial de safra Sergipe',
                    startDateISO: '2026-11-10',
                    endDateISO: '2026-11-25',
                    scriptText:
                        'Atenção, pecuarista de Sergipe! Na Coagro Aracaju, Lagarto e Umbaúba você garante Dectomax 500mL e toda a linha mineral Bovigold Tortuga com condição especial de safra! Proteja o seu rebanho com quem entende do campo. Passe no balcão ou chame no WhatsApp. Grupo Coagro!',
                    targetStoreIds: ['aracaju', 'lagarto', 'umbauba'],
                    priority: 2,
                },
            },
        },
    ],
    customAgroDictionary: [],
    lastSubmittedRequest: null,
};

// Carrega estado salvo no navegador (com migração profunda preservando dados do cliente)
function loadInitialState(): StudioGlobalState {
    if (typeof window === 'undefined') return DEFAULT_INITIAL_STATE;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_INITIAL_STATE;
        const parsed = JSON.parse(raw);
        const savedStore = getCoagroStoreById(parsed.activeStoreId);
        const migratedStoreId =
            parsed.activeStoreId === 'catedral' ||
            parsed.activeStoreId === '15-de-novembro' ||
            !parsed.activeStoreId ||
            savedStore.bandeira === 'RB_AGRICOLA'
                ? 'expedicionario'
                : parsed.activeStoreId;

        const savedDepartments = Array.isArray(parsed.brandKit?.departments)
            ? (parsed.brandKit.departments as SubBrandDepartment[])
            : DEFAULT_INITIAL_STATE.brandKit.departments;
        const mergedDepartments: SubBrandDepartment[] = savedDepartments.map((d: SubBrandDepartment) => {
            if (d.id === 'dept-1') {
                return {
                    ...d,
                    label: 'Grupo Coagro (Agro)',
                    primaryColorHex: '#002B49',
                    secondaryColorHex: '#004d40',
                    accentColorHex: '#ffab00',
                    enabled: true,
                };
            }
            if (d.id === 'dept-2') {
                return {
                    ...d,
                    label: 'Coagro Pet',
                    primaryColorHex: '#001C71',
                    secondaryColorHex: '#4897D0',
                    accentColorHex: '#ffab00',
                    enabled: true,
                };
            }
            return { ...d, enabled: false };
        });

        for (const officialDept of DEFAULT_INITIAL_STATE.brandKit.departments.slice(0, 2)) {
            if (!mergedDepartments.some((d) => d.id === officialDept.id)) {
                mergedDepartments.push({ ...officialDept });
            }
        }

        const migratedStore = getCoagroStoreById(migratedStoreId);
        const migratedCompanyName = migratedStore.bandeira === 'COAGRO_PET'
            ? 'Coagro Pet'
            : 'Grupo Coagro';
        const migratedDepartmentId = migratedStore.bandeira === 'COAGRO_PET'
            ? 'dept-2'
            : parsed.brandKit?.activeDepartmentId === 'dept-2'
              ? 'dept-2'
              : 'dept-1';
        const migratedRadioDraft: RadioSpotDraft = {
            ...DEFAULT_INITIAL_STATE.radioSpotDraft,
            ...(parsed.radioSpotDraft || {}),
        };
        const migratedRadioTargets = migratedRadioDraft.mentionStoreName !== false
            ? [migratedStoreId]
            : migratedRadioDraft.targetStoreIds;

        return {
            ...DEFAULT_INITIAL_STATE,
            ...parsed,
            schemaVersion: 6,
            activeStoreId: migratedStoreId,
            userRole: parsed.userRole || DEFAULT_INITIAL_STATE.userRole,
            brandKit: {
                ...DEFAULT_INITIAL_STATE.brandKit,
                ...(parsed.brandKit || {}),
                companyName: migratedCompanyName,
                typographyPresetId: 'AGRO_ROBUST',
                fontHeading: COAGRO_OFFICIAL_FONT_HEADING,
                fontBody: COAGRO_OFFICIAL_FONT_BODY,
                activeDepartmentId: migratedDepartmentId,
                defaultBranchName:
                    migratedStore.nome,
                defaultPhoneWhatsapp: migratedStore.telefoneFormatado,
                departments: mergedDepartments,
                seasonalCampaigns: DEFAULT_INITIAL_STATE.brandKit.seasonalCampaigns,
            },
            freemiumQuota: {
                ...DEFAULT_INITIAL_STATE.freemiumQuota,
                ...(parsed.freemiumQuota || {}),
            },
            leadProfile: parsed.leadProfile || DEFAULT_INITIAL_STATE.leadProfile,
            posterConfig: {
                ...DEFAULT_INITIAL_STATE.posterConfig,
                ...(parsed.posterConfig || {}),
                layoutArchetype: COAGRO_OFFICIAL_POSTER_ARCHETYPE,
            },
            socialConfig: {
                ...DEFAULT_INITIAL_STATE.socialConfig,
                ...(parsed.socialConfig || {}),
                aspectRatio: parsed.socialConfig?.aspectRatio === 'STORY_9_16' ? 'STORY_9_16' : 'FEED_4_5',
            },
            currentOffer: {
                ...DEFAULT_INITIAL_STATE.currentOffer,
                ...(parsed.currentOffer || {}),
                bullets: parsed.currentOffer?.bullets?.length
                    ? parsed.currentOffer.bullets
                    : DEFAULT_INITIAL_STATE.currentOffer.bullets,
            },
            parsedBatchRows: Array.isArray(parsed.parsedBatchRows)
                ? parsed.parsedBatchRows
                : DEFAULT_INITIAL_STATE.parsedBatchRows,
            batchOffers: Array.isArray(parsed.batchOffers)
                ? parsed.batchOffers
                : DEFAULT_INITIAL_STATE.batchOffers,
            customCatalogDb: Array.isArray(parsed.customCatalogDb)
                ? parsed.customCatalogDb
                : DEFAULT_INITIAL_STATE.customCatalogDb,
            erpSyncConfig: {
                ...DEFAULT_INITIAL_STATE.erpSyncConfig,
                ...(parsed.erpSyncConfig || {}),
            },
            carouselSlides: Array.isArray(parsed.carouselSlides) && parsed.carouselSlides.length
                ? parsed.carouselSlides
                : DEFAULT_INITIAL_STATE.carouselSlides,
            activeCarouselSlideIndex:
                typeof parsed.activeCarouselSlideIndex === 'number'
                    ? parsed.activeCarouselSlideIndex
                    : 0,
            hrNotice: {
                ...DEFAULT_INITIAL_STATE.hrNotice,
                ...(parsed.hrNotice || {}),
                requirementsOrPoints:
                    Array.isArray(parsed.hrNotice?.requirementsOrPoints) &&
                    parsed.hrNotice.requirementsOrPoints.length > 0
                        ? parsed.hrNotice.requirementsOrPoints
                        : DEFAULT_INITIAL_STATE.hrNotice.requirementsOrPoints,
            },
            bannerFaixaDraft: {
                ...DEFAULT_INITIAL_STATE.bannerFaixaDraft,
                ...(parsed.bannerFaixaDraft || {}),
            },
            radioSpotDraft: {
                ...migratedRadioDraft,
                targetStoreIds: migratedRadioTargets,
                scriptText: buildRadioSpotScript(migratedRadioDraft, migratedStore.nome),
            },
            marketingRequests:
                Array.isArray(parsed.marketingRequests) && parsed.marketingRequests.length > 0
                    ? parsed.marketingRequests
                    : DEFAULT_INITIAL_STATE.marketingRequests,
            customAgroDictionary: Array.isArray(parsed.customAgroDictionary)
                ? parsed.customAgroDictionary
                : DEFAULT_INITIAL_STATE.customAgroDictionary,
        };
    } catch {
        return DEFAULT_INITIAL_STATE;
    }
}

let state: StudioGlobalState = loadInitialState();
enricherService.setGeminiApiKey(state.brandKit.geminiApiKey);
const listeners = new Set<() => void>();
let persistTimeoutId: ReturnType<typeof setTimeout> | null = null;

function flushPersistState() {
    if (typeof window === 'undefined') return;
    if (persistTimeoutId !== null) {
        clearTimeout(persistTimeoutId);
        persistTimeoutId = null;
    }
    try {
        const serialized = JSON.stringify(state);
        window.localStorage.setItem(STORAGE_KEY, serialized);
        const scopedKey = state.tenantId || state.brandKit.tenantId;
        if (scopedKey && scopedKey !== 'default-tenant') {
            window.localStorage.setItem(`${STORAGE_KEY}_${scopedKey}`, serialized);
        }
    } catch {
        // Ignora erro de quota se imagem base64 ou catálogo for muito grande
    }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('beforeunload', flushPersistState);
}

function setState(updater: (prev: StudioGlobalState) => StudioGlobalState) {
    state = updater(state);
    if (typeof window !== 'undefined') {
        if (persistTimeoutId !== null) {
            clearTimeout(persistTimeoutId);
        }
        persistTimeoutId = setTimeout(flushPersistState, 120);
    }
    listeners.forEach((listener) => listener());
}

export const studioActions = {
    setActiveModule(module: ModuleMode) {
        setState((s) => ({ ...s, activeModule: module }));
    },

    setActiveDepartment(deptId: string) {
        setState((s) => {
            const target = s.brandKit.departments.find((dept) => dept.id === deptId);
            const nextDepartmentId = target?.enabled === false || !target ? 'dept-1' : deptId;
            return {
                ...s,
                brandKit: { ...s.brandKit, activeDepartmentId: nextDepartmentId },
            };
        });
    },

    setCompanyName(companyName: string) {
        const officialName = companyName.toLowerCase().includes('pet') ? 'Coagro Pet' : 'Grupo Coagro';
        setState((s) => ({
            ...s,
            brandKit: { ...s.brandKit, companyName: officialName },
        }));
    },

    updateBrandKit(partial: Partial<TenantBrandKit>) {
        if (partial.geminiApiKey !== undefined) {
            enricherService.setGeminiApiKey(partial.geminiApiKey);
        }
        setState((s) => ({
            ...s,
            brandKit: {
                ...s.brandKit,
                ...partial,
                companyName: partial.companyName?.toLowerCase().includes('pet')
                    ? 'Coagro Pet'
                    : partial.companyName !== undefined
                      ? 'Grupo Coagro'
                      : s.brandKit.companyName,
                typographyPresetId: 'AGRO_ROBUST',
                fontHeading: COAGRO_OFFICIAL_FONT_HEADING,
                fontBody: COAGRO_OFFICIAL_FONT_BODY,
            },
        }));
    },

    setVisualStylePreset(visualStylePreset: VisualStylePreset) {
        setState((s) => ({
            ...s,
            brandKit: { ...s.brandKit, visualStylePreset },
        }));
    },

    applyTypographyPreset(presetId: TypographyPresetId) {
        const preset = WHITE_LABEL_TYPOGRAPHY_PRESETS.find((p) => p.id === presetId);
        if (!preset || preset.enabled === false) return;
        setState((s) => ({
            ...s,
            brandKit: {
                ...s.brandKit,
                typographyPresetId: 'AGRO_ROBUST',
                fontHeading: COAGRO_OFFICIAL_FONT_HEADING,
                fontBody: COAGRO_OFFICIAL_FONT_BODY,
            },
        }));
    },

    applySegmentPreset(segmentId: string) {
        const seg = WHITE_LABEL_SEGMENT_PRESETS.find((p) => p.id === segmentId);
        const legacySegmentPresetsEnabled = false;
        if (!seg || !legacySegmentPresetsEnabled) return;
        setState((s) => {
            const currentDepts = s.brandKit.departments;
            const dept1Id = currentDepts[0]?.id || 'dept-1';
            const dept2Id = currentDepts[1]?.id || 'dept-2';
            return {
                ...s,
                brandKit: {
                    ...s.brandKit,
                    typographyPresetId: 'AGRO_ROBUST',
                    fontHeading: COAGRO_OFFICIAL_FONT_HEADING,
                    fontBody: COAGRO_OFFICIAL_FONT_BODY,
                    departments: [
                        {
                            id: dept1Id,
                            ...seg.dept1,
                        },
                        {
                            id: dept2Id,
                            ...seg.dept2,
                        },
                    ],
                },
            };
        });
    },

    updateDepartment(deptId: string, partial: Partial<SubBrandDepartment>) {
        if (deptId !== 'dept-1' && deptId !== 'dept-2') return;
        setState((s) => ({
            ...s,
            brandKit: {
                ...s.brandKit,
                departments: s.brandKit.departments.map((d) =>
                    d.id === deptId ? { ...d, ...partial } : d
                ),
            },
        }));
    },

    consumeExportQuota(): boolean {
        if (
            state.planTier === 'FREE' &&
            state.freemiumQuota.usedThisMonth >= state.freemiumQuota.monthlyLimit
        ) {
            return false;
        }
        setState((s) => {
            const metrics = computeOfferMetrics(
                s.currentOffer,
                s.brandKit.mapaRegistrationCode,
                s.brandKit
            );
            const record: GenerationAuditRecord = {
                id: `audit-${Date.now()}`,
                timestampISO: new Date().toISOString(),
                forensicId: metrics.forensicId,
                tenantId: s.tenantId || s.brandKit.tenantId || 'default-tenant',
                userId: s.userId,
                module: s.activeModule,
                skuCode: s.currentOffer.skuCode,
                title: s.currentOffer.cleanedTitle || s.currentOffer.rawTitle,
                priceTo: metrics.effectiveUnitPrice,
                priceFrom: s.currentOffer.priceFrom,
                mechanicType: s.currentOffer.mechanicType,
            };
            const prevHistory = Array.isArray(s.generationAuditHistory)
                ? s.generationAuditHistory
                : [];
            return {
                ...s,
                freemiumQuota: {
                    ...s.freemiumQuota,
                    usedThisMonth: s.freemiumQuota.usedThisMonth + 1,
                },
                generationAuditHistory: [record, ...prevHistory].slice(0, 50),
            };
        });
        return true;
    },

    activateLicenseKey(rawKey: string): boolean {
        const cleaned = rawKey.trim().toUpperCase();
        const isValid =
            cleaned.startsWith('ALFA-') ||
            cleaned.startsWith('PRO-') ||
            cleaned.startsWith('PULSO-') ||
            cleaned.startsWith('GABARITO-') ||
            cleaned.length >= 8;
        if (!isValid) return false;
        setState((s) => ({
            ...s,
            planTier: 'PRO',
        }));
        return true;
    },

    setPlanTier(planTier: PlanTier) {
        setState((s) => ({
            ...s,
            planTier,
        }));
    },

    setLeadProfile(leadProfile: LeadProfile) {
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem('gabarito_lead_profile_v1', JSON.stringify(leadProfile));
                window.dispatchEvent(new CustomEvent('gabarito:lead_captured', { detail: leadProfile }));
                void sendLeadCapturedToN8n({
                    storeName: leadProfile.storeName,
                    whatsappOrEmail: leadProfile.whatsappOrEmail,
                    branchCount: leadProfile.branchCount,
                    authProvider: leadProfile.authProvider,
                });
            } catch {
                // Ignore localStorage errors
            }
        }
        setState((s) => ({
            ...s,
            leadProfile,
        }));
    },

    setEnableSubDepartments(enabled: boolean) {
        setState((s) => ({
            ...s,
            brandKit: {
                ...s.brandKit,
                enableSubDepartments: enabled,
            },
        }));
    },

    recordGenerationAudit(record: Omit<GenerationAuditRecord, 'id' | 'timestampISO'>) {
        const fullRecord: GenerationAuditRecord = {
            ...record,
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestampISO: new Date().toISOString(),
        };
        setState((s) => {
            const history = [fullRecord, ...(s.generationAuditHistory || [])].slice(0, 50);
            return {
                ...s,
                generationAuditHistory: history,
            };
        });
        if (typeof window !== 'undefined') {
            try {
                window.dispatchEvent(new CustomEvent('gabarito:audit_logged', { detail: fullRecord }));
            } catch {
                // Ignore errors
            }
        }
    },

    setPosterBatchMode(batchMode: boolean) {
        setState((s) => ({
            ...s,
            posterConfig: { ...s.posterConfig, batchMode },
        }));
    },

    parseBatchInput(rawText: string) {
        const rows = parseErpBatchTable(rawText, state.currentOffer.roundingStrategy);
        setState((s) => ({
            ...s,
            parsedBatchRows: rows,
            batchOffers: rows
                .filter((row) => row.status !== 'BLOCKED')
                .map((row) => ({
                    ...s.currentOffer,
                    id: `batch-${row.rowNumber}-${row.skuCode}`,
                    skuCode: row.skuCode,
                    rawTitle: row.rawTitle,
                    cleanedTitle: row.cleanedTitle,
                    subtitle: '',
                    bullets: [],
                    unit: row.unit,
                    netWeightOrVolume: row.netWeightOrVolume,
                    costPrice: row.costPrice,
                    priceFrom: row.priceFrom,
                    priceToRaw: row.priceTo,
                    regulatoryCategory: row.regulatoryCategory,
                    mechanicType: row.mechanicType || 'SIMPLE_DE_POR',
                    installmentCount: row.installmentCount ?? s.currentOffer.installmentCount,
                    giftOrConditionText:
                        row.giftOrConditionText ?? s.currentOffer.giftOrConditionText,
                })),
        }));
    },

    importCatalogDataset(
        rawText: string,
        replaceExisting = false
    ): { imported: number; format: string } {
        const result = normalizeUniversalErpDataset(rawText);
        if (result.records.length === 0) {
            return { imported: 0, format: result.detectedFormat };
        }

        setState((s) => {
            const map = new Map<string, ErpCatalogRecord>();
            if (!replaceExisting) {
                for (const item of s.customCatalogDb) {
                    map.set(item.skuCode.toLowerCase(), item);
                }
            }
            for (const rec of result.records) {
                map.set(rec.skuCode.toLowerCase(), rec);
            }
            return {
                ...s,
                customCatalogDb: Array.from(map.values()),
                erpSyncConfig: {
                    ...s.erpSyncConfig,
                    lastSyncISO: new Date().toISOString(),
                    lastDetectedFormat: result.detectedFormat,
                },
            };
        });

        return { imported: result.records.length, format: result.detectedFormat };
    },

    clearCustomCatalog() {
        setState((s) => ({
            ...s,
            customCatalogDb: [],
            erpSyncConfig: {
                ...s.erpSyncConfig,
                lastSyncISO: undefined,
                lastDetectedFormat: undefined,
            },
        }));
    },

    addCustomCatalogProduct(record: ErpCatalogRecord) {
        setState((s) => {
            const nextList = [
                record,
                ...s.customCatalogDb.filter(
                    (p) => p.skuCode.trim().toLowerCase() !== record.skuCode.trim().toLowerCase()
                ),
            ];
            return {
                ...s,
                customCatalogDb: nextList,
            };
        });
    },

    updateErpSyncConfig(patch: Partial<ErpSyncConfig>) {
        setState((s) => ({
            ...s,
            erpSyncConfig: {
                ...s.erpSyncConfig,
                ...patch,
            },
        }));
    },

    setTurboExpiryDays(days: number) {
        setState((s) => ({
            ...s,
            currentOffer: {
                ...s.currentOffer,
                nearExpiryDaysLeft: days,
                mechanicType: 'TURBO_EXPIRY',
            },
        }));
    },

    setSecondUnitDiscountPercent(percent: number) {
        setState((s) => ({
            ...s,
            currentOffer: {
                ...s.currentOffer,
                secondUnitDiscountPercent: percent,
                mechanicType: 'SECOND_UNIT_50',
            },
        }));
    },

    setInstallmentCount(count: number) {
        const clamped = Math.max(2, Math.min(24, Math.round(count || 6)));
        setState((s) => ({
            ...s,
            posterConfig: {
                ...s.posterConfig,
                layoutArchetype: COAGRO_OFFICIAL_POSTER_ARCHETYPE,
            },
            currentOffer: {
                ...s.currentOffer,
                installmentCount: clamped,
                mechanicType: 'INSTALLMENT_FINANCING',
            },
        }));
    },

    setGiftOrConditionText(text: string) {
        setState((s) => ({
            ...s,
            posterConfig: {
                ...s.posterConfig,
                layoutArchetype: COAGRO_OFFICIAL_POSTER_ARCHETYPE,
            },
            currentOffer: {
                ...s.currentOffer,
                giftOrConditionText: text,
                mechanicType: 'BUY_WIN_GIFT',
            },
        }));
    },

    applyCatalogRecord(found: ErpCatalogRecord): boolean {
        if (!found) return false;
        setState((s) => ({
            ...s,
            posterConfig: {
                ...s.posterConfig,
                layoutArchetype: COAGRO_OFFICIAL_POSTER_ARCHETYPE,
            },
            currentOffer: {
                ...s.currentOffer,
                skuCode: found.skuCode,
                rawTitle: found.rawTitle,
                cleanedTitle: found.cleanedTitle,
                subtitle: found.subtitle ?? s.currentOffer.subtitle,
                unit: found.unit,
                netWeightOrVolume: found.netWeightOrVolume,
                costPrice: found.costPrice,
                priceFrom: found.priceFrom,
                priceToRaw: found.priceTo,
                regulatoryCategory: found.regulatoryCategory,
                mechanicType: found.mechanicType || 'SIMPLE_DE_POR',
                installmentCount: found.installmentCount ?? s.currentOffer.installmentCount,
                giftOrConditionText:
                    found.giftOrConditionText ?? s.currentOffer.giftOrConditionText,
                imageUrl: found.productImageUrl ?? s.currentOffer.imageUrl,
                productImageUrl: found.productImageUrl ?? s.currentOffer.productImageUrl,
            },
        }));
        return true;
    },

    lookupAndApplyErpSku(skuOrQuery: string): boolean {
        const found = lookupErpCatalogBySku(
            skuOrQuery,
            state.parsedBatchRows,
            state.customCatalogDb
        );
        if (!found) return false;
        return this.applyCatalogRecord(found);
    },

    async applySmartPaste(rawMessage: string): Promise<boolean> {
        const parsed = parseWhatsAppSmartPaste(rawMessage);
        if (!parsed) return false;

        let subtitle = state.currentOffer.subtitle;
        let bullets = state.currentOffer.bullets;
        try {
            const enriched = await enricherService.enrichProduct({
                rawTitle: parsed.cleanedTitle,
                imageBase64OrUrl: state.currentOffer.imageUrl,
            });
            if (enriched.suggestedSubtitle) subtitle = enriched.suggestedSubtitle;
            if (enriched.suggestedBullets && enriched.suggestedBullets.length > 0) {
                bullets = enriched.suggestedBullets.map((text, idx) => ({
                    id: `bullet-${Date.now()}-${idx}`,
                    text,
                }));
            }
        } catch {
            // Mantém subtítulo e bullets atuais em caso de falha
        }

        setState((s) => ({
            ...s,
            posterConfig: {
                ...s.posterConfig,
                layoutArchetype: COAGRO_OFFICIAL_POSTER_ARCHETYPE,
            },
            currentOffer: {
                ...s.currentOffer,
                rawTitle: parsed.cleanedTitle,
                cleanedTitle: parsed.cleanedTitle,
                subtitle,
                bullets,
                unit: parsed.unit,
                netWeightOrVolume: parsed.netWeightOrVolume ?? s.currentOffer.netWeightOrVolume,
                priceFrom: parsed.priceFrom,
                priceToRaw: parsed.priceTo,
                validityPreset: parsed.validityPreset,
                mechanicType: parsed.mechanicType,
                takeQty: parsed.takeQty,
                payQty: parsed.payQty,
                installmentCount: parsed.installmentCount ?? s.currentOffer.installmentCount,
                giftOrConditionText:
                    parsed.giftOrConditionText ?? s.currentOffer.giftOrConditionText,
                nearExpiryDaysLeft: parsed.nearExpiryDaysLeft,
                regulatoryCategory: parsed.regulatoryCategory,
            },
        }));

        return true;
    },

    updateOfferField<K extends keyof OfferItemState>(field: K, value: OfferItemState[K]) {
        setState((s) => ({
            ...s,
            currentOffer: {
                ...s.currentOffer,
                [field]: value,
            },
        }));
    },

    /**
     * Acionado pelo botão "✨ Limpar Siglas":
     * Limpa o nome do ERP, extrai peso (ex: 10.1KG), detecta regra do MAPA
     * e já preenche subtítulo + 3 diferenciais gratuitamente.
     */
    async cleanAndEnrichCurrentOffer() {
        const currentRaw = state.currentOffer.rawTitle || state.currentOffer.cleanedTitle;
        const result = await enricherService.enrichProduct({
            rawTitle: currentRaw,
            imageBase64OrUrl: state.currentOffer.imageUrl,
        });

        setState((s) => ({
            ...s,
            currentOffer: {
                ...s.currentOffer,
                rawTitle: result.cleanedTitle,
                cleanedTitle: result.cleanedTitle,
                subtitle: result.suggestedSubtitle,
                unit: result.extractedUnit || s.currentOffer.unit,
                netWeightOrVolume: result.extractedWeightVolume,
                regulatoryCategory: result.detectedCategory,
                ctaText: result.suggestedCta || s.currentOffer.ctaText,
                bullets: result.suggestedBullets.map((text, idx) => ({
                    id: `bullet-${Date.now()}-${idx}`,
                    text,
                })),
            },
        }));
    },

    /**
     * Atualiza o título digitado, aplica correção ortográfica de balcão e detecta categoria regulatória (MAPA/Bebidas)
     */
    setProductTitleInput(rawInput: string) {
        const { cleanedTitle, extractedMeasure, extractedUnit } = cleanErpProductTitle(rawInput);
        const autoCategory = detectRegulatoryCategoryByText(cleanedTitle || rawInput);

        setState((s) => ({
            ...s,
            currentOffer: {
                ...s.currentOffer,
                rawTitle: rawInput,
                cleanedTitle: cleanedTitle || rawInput,
                netWeightOrVolume: extractedMeasure ?? s.currentOffer.netWeightOrVolume,
                unit: extractedUnit !== 'UN' ? extractedUnit : s.currentOffer.unit,
                regulatoryCategory:
                    autoCategory !== 'STANDARD' ? autoCategory : s.currentOffer.regulatoryCategory,
            },
        }));
    },

    /**
     * Corrige com 1 clique erros de digitação de preço (ex: DE/POR invertidos ou preço abaixo do custo)
     */
    autoFixPriceGuardrail(code: string) {
        setState((s) => {
            const offer = s.currentOffer;
            if (code === 'PRICE_INVERTED' && offer.priceFrom && offer.priceToRaw >= offer.priceFrom) {
                return {
                    ...s,
                    currentOffer: {
                        ...offer,
                        priceFrom: offer.priceToRaw,
                        priceToRaw: offer.priceFrom,
                    },
                };
            }
            if (code === 'BELOW_COST_MARGIN' && offer.costPrice && offer.costPrice > 0) {
                const minMarginPct = s.brandKit.minMarginPct ?? 12;
                const safePrice = Number(
                    (Math.ceil(offer.costPrice / (1 - minMarginPct / 100)) - 0.1).toFixed(2)
                );
                return {
                    ...s,
                    currentOffer: {
                        ...offer,
                        priceToRaw: Math.max(offer.costPrice + 0.9, safePrice),
                    },
                };
            }
            return s;
        });
    },

    addBullet(text = 'Novo diferencial do produto') {
        setState((s) => {
            if (s.currentOffer.bullets.length >= 4) return s;
            return {
                ...s,
                currentOffer: {
                    ...s.currentOffer,
                    bullets: [
                        ...s.currentOffer.bullets,
                        { id: `b-${Date.now()}`, text },
                    ],
                },
            };
        });
    },

    updateBullet(id: string, text: string) {
        setState((s) => ({
            ...s,
            currentOffer: {
                ...s.currentOffer,
                bullets: s.currentOffer.bullets.map((b) => (b.id === id ? { ...b, text } : b)),
            },
        }));
    },

    removeBullet(id: string) {
        setState((s) => ({
            ...s,
            currentOffer: {
                ...s.currentOffer,
                bullets: s.currentOffer.bullets.filter((b) => b.id !== id),
            },
        }));
    },

    /**
     * PONTE NATIVA: Leva o produto do Cartaz A4 direto para a aba de Redes Sociais
     * já ativando o tema colorido da marca.
     */
    bridgePosterToSocialMedia() {
        setState((s) => ({
            ...s,
            activeModule: 'SOCIAL_MEDIA',
            socialConfig: {
                ...s.socialConfig,
                visualTheme:
                    s.posterConfig.visualTheme === 'BW_ECO_TONER'
                        ? 'BRAND_PRIMARY'
                        : s.posterConfig.visualTheme,
            },
        }));
    },

    setPosterPrintGrid(printGrid: PrintGridFormat) {
        setState((s) => ({
            ...s,
            posterConfig: { ...s.posterConfig, printGrid },
        }));
    },

    setPosterVisualTheme(visualTheme: VisualThemePreset) {
        setState((s) => ({
            ...s,
            posterConfig: { ...s.posterConfig, visualTheme },
        }));
    },

    setPosterLayoutArchetype(layoutArchetype: PosterLayoutArchetype) {
        const template = COAGRO_POSTER_TEMPLATE_CATALOG.find((item) => item.id === layoutArchetype);
        if (!template?.enabled) return;
        setState((s) => ({
            ...s,
            posterConfig: { ...s.posterConfig, layoutArchetype: template.id },
        }));
    },

    togglePosterDiscountBadge(show: boolean) {
        setState((s) => ({
            ...s,
            posterConfig: { ...s.posterConfig, showDiscountPercentageBadge: show },
        }));
    },

    togglePosterPricePerMeasure(show: boolean) {
        setState((s) => ({
            ...s,
            posterConfig: { ...s.posterConfig, showPricePerKgOrLiter: show },
        }));
    },

    setSocialAspectRatio(aspectRatio: SocialAspectRatio) {
        const officialAspect = aspectRatio === 'SQUARE_1_1' ? 'FEED_4_5' : aspectRatio;
        setState((s) => ({
            ...s,
            socialConfig: { ...s.socialConfig, aspectRatio: officialAspect },
        }));
    },

    setSocialVisualTheme(visualTheme: VisualThemePreset) {
        setState((s) => ({
            ...s,
            socialConfig: { ...s.socialConfig, visualTheme },
        }));
    },

    toggleSocialSafeZones(show: boolean) {
        setState((s) => ({
            ...s,
            socialConfig: { ...s.socialConfig, showSafeZonesGuide: show },
        }));
    },

    toggleSocialBullets(show: boolean) {
        setState((s) => ({
            ...s,
            socialConfig: { ...s.socialConfig, showBullets: show },
        }));
    },

    setRoundingStrategy(roundingStrategy: RoundingStrategy) {
        setState((s) => ({
            ...s,
            currentOffer: { ...s.currentOffer, roundingStrategy },
        }));
    },

    setValidityPreset(validityPreset: ValidityPreset) {
        setState((s) => ({
            ...s,
            currentOffer: { ...s.currentOffer, validityPreset },
        }));
    },

    setMechanicType(mechanicType: CommercialMechanicType) {
        setState((s) => ({
            ...s,
            posterConfig: {
                ...s.posterConfig,
                layoutArchetype: COAGRO_OFFICIAL_POSTER_ARCHETYPE,
            },
            currentOffer: { ...s.currentOffer, mechanicType },
        }));
    },

    setRegulatoryCategory(regulatoryCategory: RegulatoryCategory) {
        setState((s) => ({
            ...s,
            currentOffer: { ...s.currentOffer, regulatoryCategory },
        }));
    },

    // ========================================================================
    // MÓDULO 3: CARROSSEL GUIADO (FASE 2)
    // ========================================================================
    setActiveCarouselSlide(index: number) {
        setState((s) => ({
            ...s,
            activeCarouselSlideIndex: Math.max(
                0,
                Math.min(Math.max(0, s.carouselSlides.length - 1), index)
            ),
        }));
    },

    updateCarouselSlide(id: string, patch: Partial<CarouselSlideItem>) {
        setState((s) => ({
            ...s,
            carouselSlides: s.carouselSlides.map((slide) =>
                slide.id === id ? { ...slide, ...patch } : slide
            ),
        }));
    },

    addCarouselSlide(slideType: CarouselSlideItem['slideType'] = 'PRODUCT_OR_CONTENT') {
        setState((s) => {
            if (s.carouselSlides.length >= 8) return s;
            const isProduct = slideType === 'PRODUCT_OR_CONTENT';
            const newSlide: CarouselSlideItem = {
                id: `slide-${Date.now()}`,
                slideType,
                headline:
                    slideType === 'HOOK_COVER'
                        ? 'OFERTAS DA SEMANA'
                        : slideType === 'FINAL_CTA'
                          ? 'CHAME NO WHATSAPP AGORA'
                          : s.currentOffer.cleanedTitle || 'DESTAQUE DA SEMANA',
                bodyText:
                    slideType === 'HOOK_COVER'
                        ? 'Arraste para o lado e confira nossas condições especiais.'
                        : slideType === 'FINAL_CTA'
                          ? `Fale com ${s.brandKit.companyName} no WhatsApp ${s.brandKit.defaultPhoneWhatsapp || ''}`.trim()
                          : `Por R$ ${formatBRL(s.currentOffer.priceToRaw)}/${s.currentOffer.unit} • ${s.currentOffer.subtitle || 'Garanta já na loja!'}`,
                linkedOfferId: isProduct ? s.currentOffer.id : undefined,
                linkedSkuCode: isProduct
                    ? s.currentOffer.skuCode || '12345'
                    : slideType === 'HOOK_COVER'
                      ? 'CAPA-01'
                      : 'CTA-ZAP',
                priceFrom: isProduct ? s.currentOffer.priceFrom : undefined,
                priceTo: isProduct ? s.currentOffer.priceToRaw : undefined,
                unit: isProduct ? s.currentOffer.unit : undefined,
                mechanicType: isProduct ? s.currentOffer.mechanicType : undefined,
                installmentCount: isProduct ? s.currentOffer.installmentCount : undefined,
                giftOrConditionText: isProduct ? s.currentOffer.giftOrConditionText : undefined,
                regulatoryCategory: isProduct ? s.currentOffer.regulatoryCategory : undefined,
            };
            const nextSlides = [...s.carouselSlides, newSlide];
            return {
                ...s,
                carouselSlides: nextSlides,
                activeCarouselSlideIndex: nextSlides.length - 1,
            };
        });
    },

    removeCarouselSlide(id: string) {
        setState((s) => {
            if (s.carouselSlides.length <= 2) return s;
            const filtered = s.carouselSlides.filter((sl) => sl.id !== id);
            return {
                ...s,
                carouselSlides: filtered,
                activeCarouselSlideIndex: Math.min(
                    s.activeCarouselSlideIndex,
                    Math.max(0, filtered.length - 1)
                ),
            };
        });
    },

    generateCarouselFromCatalog(maxProducts = 3) {
        setState((s) => {
            const sourceRecords: ErpCatalogRecord[] =
                s.customCatalogDb.length > 0
                    ? s.customCatalogDb.slice(0, maxProducts)
                    : DEFAULT_ERP_CATALOG_DB.slice(0, maxProducts);

            const dept =
                s.brandKit.departments.find((d) => d.id === s.brandKit.activeDepartmentId) ||
                s.brandKit.departments[0];

            const coverSlide: CarouselSlideItem = {
                id: `slide-cover-${Date.now()}`,
                slideType: 'HOOK_COVER',
                headline: `SELEÇÃO ESPECIAL ${(dept?.label || s.brandKit.companyName).toUpperCase()}`,
                bodyText: `Arraste para o lado e confira ${sourceRecords.length} oportunidades selecionadas em ${s.brandKit.companyName}.`,
                linkedSkuCode: 'CAPA-CAT',
            };

            const productSlides: CarouselSlideItem[] = sourceRecords.map((rec, idx) => {
                const priceFormatted = `R$ ${formatBRL(rec.priceTo)}/${rec.unit}`;
                const fromFormatted =
                    rec.priceFrom && rec.priceFrom > rec.priceTo
                        ? ` (De R$ ${formatBRL(rec.priceFrom)})`
                        : '';
                const condInfo =
                    rec.mechanicType === 'INSTALLMENT_FINANCING' && rec.installmentCount
                        ? `${rec.installmentCount}x sem juros de R$ ${formatBRL(rec.priceTo / rec.installmentCount)} • À vista ${priceFormatted}`
                        : rec.giftOrConditionText
                          ? `${rec.giftOrConditionText} • Por ${priceFormatted}${fromFormatted}`
                          : `Por ${priceFormatted}${fromFormatted} • ${rec.subtitle || 'Pronta entrega na filial'}`;

                return {
                    id: `slide-prod-${Date.now()}-${idx}`,
                    slideType: 'PRODUCT_OR_CONTENT',
                    headline: rec.cleanedTitle,
                    bodyText: condInfo,
                    linkedSkuCode: rec.skuCode,
                    priceFrom: rec.priceFrom,
                    priceTo: rec.priceTo,
                    unit: rec.unit,
                    mechanicType: rec.mechanicType || 'SIMPLE_DE_POR',
                    installmentCount: rec.installmentCount,
                    giftOrConditionText: rec.giftOrConditionText,
                    regulatoryCategory: rec.regulatoryCategory,
                };
            });

            const ctaSlide: CarouselSlideItem = {
                id: `slide-cta-${Date.now()}`,
                slideType: 'FINAL_CTA',
                headline: 'RESERVE PELO WHATSAPP OU RETIRE NA LOJA',
                bodyText: `Atendimento rápido ${s.brandKit.companyName}: ${s.brandKit.defaultPhoneWhatsapp || '(00) 99999-0000'} • ${s.brandKit.defaultBranchName || 'Unidade Matriz'}.`,
                linkedSkuCode: 'CTA-FINAL',
            };

            return {
                ...s,
                carouselSlides: [coverSlide, ...productSlides, ctaSlide],
                activeCarouselSlideIndex: 0,
            };
        });
    },

    // ========================================================================
    // MÓDULO 4: RH, VAGAS & COMUNICADOS INTERNOS (FASE 3)
    // ========================================================================
    updateHrNotice(patch: Partial<HrNoticeState>) {
        setState((s) => ({
            ...s,
            hrNotice: {
                ...s.hrNotice,
                ...patch,
            },
        }));
    },

    applyHrPreset(archetype: HrNoticeArchetype) {
        setState((s) => {
            if (archetype === 'JOB_VACANCY') {
                return {
                    ...s,
                    hrNotice: {
                        ...s.hrNotice,
                        archetype: 'JOB_VACANCY',
                        referenceCode: 'VAGA-01',
                        headline: 'ESTAMOS CONTRATANDO',
                        roleOrSubject: 'Consultor(a) de Vendas Balcão / Agro',
                        requirementsOrPoints: [
                            'Experiência em atendimento comercial ou balcão agropecuário',
                            'Boa comunicação, organização e foco em metas',
                            'Disponibilidade para horário comercial (Segunda a Sábado)',
                        ],
                        scheduleOrLocation: `Presencial • ${s.brandKit.defaultBranchName || 'Unidade Matriz'}`,
                        compensationOrHighlight: 'Salário Fixo + Comissão + Benefícios',
                        contactChannel: `Envie seu currículo no WhatsApp ${s.brandKit.defaultPhoneWhatsapp || '(00) 99999-0000'}`,
                        validityOrDeadlineText: 'Processo seletivo aberto esta semana',
                    },
                };
            }
            if (archetype === 'INTERNAL_NOTICE') {
                return {
                    ...s,
                    hrNotice: {
                        ...s.hrNotice,
                        archetype: 'INTERNAL_NOTICE',
                        referenceCode: 'COM-102',
                        headline: 'COMUNICADO IMPORTANTE',
                        roleOrSubject: 'Horário Especial de Atendimento e Inventário',
                        requirementsOrPoints: [
                            'Sábado atendimento normal das 07h30 às 13h00',
                            'Conferência de estoque e gôndolas após fechamento',
                            'Retorno às atividades normais na segunda-feira às 07h30',
                        ],
                        scheduleOrLocation: `Todas as Unidades • ${s.brandKit.companyName}`,
                        compensationOrHighlight: 'Atendimento Normal pelo WhatsApp da Loja',
                        contactChannel: `Dúvidas: ${s.brandKit.defaultPhoneWhatsapp || '(00) 99999-0000'}`,
                        validityOrDeadlineText: 'Comunicado Oficial da Gerência',
                    },
                };
            }
            if (archetype === 'HOLIDAY_CLOSURE') {
                return {
                    ...s,
                    hrNotice: {
                        ...s.hrNotice,
                        archetype: 'HOLIDAY_CLOSURE',
                        referenceCode: 'AVISO-FERIADO',
                        headline: 'COMUNICADO DE FERIADO',
                        roleOrSubject: 'Estaremos Fechados neste Feriado',
                        requirementsOrPoints: [
                            'Não haverá expediente no balcão físico durante o feriado',
                            'Pedidos, cotações e dúvidas podem ser enviados no WhatsApp',
                            'Retorno normal das atividades no próximo dia útil às 07h30',
                        ],
                        scheduleOrLocation: `${s.brandKit.companyName} • Todas as Filiais`,
                        compensationOrHighlight: 'ATENDIMENTO EM REGIME DE PLANTÃO VIA WHATSAPP',
                        contactChannel: `Plantão WhatsApp: ${s.brandKit.defaultPhoneWhatsapp || '(00) 99999-0000'}`,
                        validityOrDeadlineText: 'Comunicado aos Clientes e Amigos',
                    },
                };
            }
            return {
                ...s,
                hrNotice: {
                    ...s.hrNotice,
                    archetype: 'SAFETY_COMPLIANCE',
                    referenceCode: 'EPI-NR06',
                    headline: 'AVISO OBRIGATÓRIO DE SEGURANÇA',
                    roleOrSubject: 'Uso Obrigatório de EPI no Depósito e Pátio de Carga',
                    requirementsOrPoints: [
                        'Obrigatório uso de botina de segurança, luvas e óculos de proteção',
                        'Proibido trânsito de clientes na área de movimentação de empilhadeiras',
                        'Mantenha os corredores de defensivos e sementes desobstruídos',
                    ],
                    scheduleOrLocation: 'Depósito Logístico • Pátio de Carga e Descarga',
                    compensationOrHighlight: 'CUMPRA AS NORMAS NR-06 E NR-31 • SEGURANÇA EM 1º LUGAR',
                    contactChannel: `SESMT / Gerência Operacional • ${s.brandKit.companyName}`,
                    validityOrDeadlineText: 'Norma Permanente de Segurança do Trabalho',
                },
            };
        });
    },

    // ========================================================================
    // GOVERNANÇA MATRIZ: CAMPANHAS SAZONAIS & BACKUP WHITE-LABEL (FASE 3 & 4)
    // ========================================================================
    updateSeasonalCampaign(id: string, patch: Partial<SeasonalCampaign>) {
        setState((s) => ({
            ...s,
            brandKit: {
                ...s.brandKit,
                seasonalCampaigns: s.brandKit.seasonalCampaigns.map((c) =>
                    c.id === id ? { ...c, ...patch } : c
                ),
            },
        }));
    },

    setActiveCampaign(campaignId: string | null) {
        setState((s) => ({
            ...s,
            brandKit: {
                ...s.brandKit,
                activeCampaignId: campaignId || undefined,
            },
            posterConfig: {
                ...s.posterConfig,
                visualTheme: campaignId ? 'CAMPAIGN_SEASONAL' : s.posterConfig.visualTheme,
            },
            socialConfig: {
                ...s.socialConfig,
                visualTheme: campaignId ? 'CAMPAIGN_SEASONAL' : s.socialConfig.visualTheme,
            },
        }));
    },

    applyCampaignToStudio(
        campaignId: string,
        targetModule: 'STORE_POSTER' | 'SOCIAL_MEDIA' = 'STORE_POSTER'
    ): boolean {
        const camp = state.brandKit.seasonalCampaigns.find((c) => c.id === campaignId);
        if (!camp) return false;

        setState((s) => ({
            ...s,
            activeModule: targetModule,
            brandKit: {
                ...s.brandKit,
                activeCampaignId: camp.id,
                alertPrimaryColorHex: camp.primaryColorHex,
                alertAccentColorHex: camp.accentColorHex,
            },
            currentOffer: {
                ...s.currentOffer,
                headerLabel: camp.badgeText,
            },
            posterConfig: {
                ...s.posterConfig,
                visualTheme: 'CAMPAIGN_SEASONAL',
            },
            socialConfig: {
                ...s.socialConfig,
                visualTheme: 'CAMPAIGN_SEASONAL',
            },
        }));
        return true;
    },

    exportFullTenantBackup(): string {
        // Segurança White-Label (P1): Remove geminiApiKey em texto aberto antes de exportar o backup JSON
        const sanitizedState: StudioGlobalState = {
            ...state,
            brandKit: {
                ...state.brandKit,
                geminiApiKey: undefined,
            },
        };
        return JSON.stringify(sanitizedState, null, 2);
    },

    importFullTenantBackup(rawJson: string): boolean {
        try {
            const parsed = JSON.parse(rawJson);
            if (!parsed || typeof parsed !== 'object' || !parsed.brandKit) {
                return false;
            }
            if (typeof parsed.brandKit.companyName !== 'string') {
                return false;
            }
            if (parsed.brandKit.geminiApiKey !== undefined) {
                enricherService.setGeminiApiKey(parsed.brandKit.geminiApiKey);
            }
            setState((s) => ({
                ...s,
                // Segurança Comercial (P1): Preserva planTier e freemiumQuota locais contra escalada via JSON externo
                planTier: s.planTier,
                freemiumQuota: s.freemiumQuota,
                schemaVersion: 4,
                brandKit: {
                    ...s.brandKit,
                    ...(parsed.brandKit || {}),
                    geminiApiKey: parsed.brandKit.geminiApiKey ?? s.brandKit.geminiApiKey,
                    departments:
                        Array.isArray(parsed.brandKit?.departments) &&
                        parsed.brandKit.departments.length > 0
                            ? parsed.brandKit.departments
                            : s.brandKit.departments,
                    seasonalCampaigns:
                        Array.isArray(parsed.brandKit?.seasonalCampaigns) &&
                        parsed.brandKit.seasonalCampaigns.length > 0
                            ? parsed.brandKit.seasonalCampaigns
                            : s.brandKit.seasonalCampaigns,
                },
                posterConfig: {
                    ...s.posterConfig,
                    ...(parsed.posterConfig || {}),
                },
                socialConfig: {
                    ...s.socialConfig,
                    ...(parsed.socialConfig || {}),
                },
                currentOffer: {
                    ...s.currentOffer,
                    ...(parsed.currentOffer || {}),
                    bullets:
                        Array.isArray(parsed.currentOffer?.bullets) &&
                        parsed.currentOffer.bullets.length > 0
                            ? parsed.currentOffer.bullets
                            : s.currentOffer.bullets,
                },
                customCatalogDb: Array.isArray(parsed.customCatalogDb)
                    ? parsed.customCatalogDb
                    : s.customCatalogDb,
                carouselSlides:
                    Array.isArray(parsed.carouselSlides) && parsed.carouselSlides.length > 0
                        ? parsed.carouselSlides
                        : s.carouselSlides,
                hrNotice: {
                    ...s.hrNotice,
                    ...(parsed.hrNotice || {}),
                },
            }));
            return true;
        } catch {
            return false;
        }
    },

    // ========================================================================
    // HUB COAGRO: SELEÇÃO DE FILIAL, RBAC, FILA DO CURADOR & DICIONÁRIO AGRO
    // ========================================================================
    setActiveStore(storeId: string) {
        const requestedStore = getCoagroStoreById(storeId);
        const store = requestedStore.bandeira === 'RB_AGRICOLA'
            ? getCoagroStoreById('expedicionario')
            : requestedStore;
        const deptId =
            store.bandeira === 'COAGRO_PET'
                ? 'dept-2'
                : 'dept-1';
        const companyName =
            store.bandeira === 'COAGRO_PET'
                ? 'Coagro Pet'
                : 'Grupo Coagro';

        setState((s) => ({
            ...s,
            activeStoreId: store.id,
            brandKit: {
                ...s.brandKit,
                companyName,
                activeDepartmentId: deptId,
                defaultBranchName: store.nome,
                defaultPhoneWhatsapp: store.telefoneFormatado,
                fontHeading: COAGRO_OFFICIAL_FONT_HEADING,
                fontBody: COAGRO_OFFICIAL_FONT_BODY,
            },
            radioSpotDraft: {
                ...s.radioSpotDraft,
                targetStoreIds: [store.id],
                scriptText: buildRadioSpotScript(s.radioSpotDraft, store.nome),
            },
        }));
    },

    setUserRole(userRole: CoagroUserRole) {
        setState((s) => ({
            ...s,
            userRole,
        }));
    },

    updateBannerFaixaDraft(patch: Partial<BannerFaixaDraft>) {
        setState((s) => ({
            ...s,
            bannerFaixaDraft: {
                ...s.bannerFaixaDraft,
                ...patch,
            },
        }));
    },

    updateRadioSpotDraft(patch: Partial<RadioSpotDraft>) {
        setState((s) => {
            const nextDraft = { ...s.radioSpotDraft, ...patch };
            const shouldRegenerate = [
                'spotType',
                'durationSeconds',
                'productOrSubject',
                'priceText',
                'mentionStoreName',
                'targetStoreIds',
            ].some((key) => key in patch);
            return {
                ...s,
                radioSpotDraft: {
                    ...nextDraft,
                    scriptText: shouldRegenerate
                        ? buildRadioSpotScript(nextDraft, getCoagroStoreById(s.activeStoreId).nome)
                        : nextDraft.scriptText,
                },
            };
        });
    },

    autoGenerateRadioSpotScript() {
        setState((s) => {
            const store = getCoagroStoreById(s.activeStoreId);
            const scriptText = buildRadioSpotScript(s.radioSpotDraft, store.nome);
            return {
                ...s,
                radioSpotDraft: {
                    ...s.radioSpotDraft,
                    scriptText,
                },
            };
        });
    },

    submitMarketingRequest(notesOptional?: string): MarketingRequestItem {
        const s = state;
        const store = getCoagroStoreById(s.activeStoreId);
        const gov = evaluateGovernanceTrack({
            module: s.activeModule,
            userRole: s.userRole,
            offer: s.currentOffer,
            brandKit: s.brandKit,
            customDictionary: s.customAgroDictionary,
        });

        const nowISO = new Date().toISOString();
        const protocolNum = 2044 + s.marketingRequests.length;
        const protocolCode = `REQ-${protocolNum}`;

        let title = s.currentOffer.cleanedTitle || s.currentOffer.rawTitle;
        let subtitleOrSummary = `Por R$ ${formatBRL(s.currentOffer.priceToRaw)}/${s.currentOffer.unit}`;

        if (s.activeModule === 'BANNER_FAIXA') {
            title = `${s.bannerFaixaDraft.pieceType.replace('_', ' ')} ${s.bannerFaixaDraft.widthCm}×${s.bannerFaixaDraft.heightCm}cm — ${s.bannerFaixaDraft.campaignTitle}`;
            subtitleOrSummary = `Cotação Gráfica • ${s.bannerFaixaDraft.quantity} un. • ${s.bannerFaixaDraft.featuredProductOrPartner}`;
        } else if (s.activeModule === 'RADIO_SPOT') {
            title = `Spot ${s.radioSpotDraft.durationSeconds}s — ${s.radioSpotDraft.productOrSubject}`;
            subtitleOrSummary = `Rádio Coagro • Prioridade ${s.radioSpotDraft.priority}x • ${s.radioSpotDraft.targetStoreIds.length} loja(s)`;
        } else if (s.activeModule === 'HR_NOTICE') {
            title = `${s.hrNotice.headline} — ${s.hrNotice.roleOrSubject}`;
            subtitleOrSummary = `Comunicado/RH (${s.hrNotice.referenceCode}) • ${s.hrNotice.outputFormat}`;
        }

        const newItem: MarketingRequestItem = {
            id: `req-${Date.now()}`,
            protocolCode,
            createdAtISO: nowISO,
            updatedAtISO: nowISO,
            storeId: store.id,
            storeName: store.nome,
            requesterEmail: store.gerenteEmail,
            moduleType: s.activeModule,
            title,
            subtitleOrSummary,
            governanceTrack: gov.track,
            status: s.activeModule === 'BANNER_FAIXA' ? 'QUOTING' : 'PENDING',
            guardrailWarnings: gov.reasons,
            unknownDictionaryTerms: gov.unknownTerms,
            curatorNotes: notesOptional,
            payloadJson: {
                offer: {
                    ...s.currentOffer,
                    bullets: s.currentOffer.bullets.map((b) => ({ ...b })),
                },
                hrNotice: {
                    ...s.hrNotice,
                    requirementsOrPoints: [...s.hrNotice.requirementsOrPoints],
                },
                bannerFaixa: { ...s.bannerFaixaDraft },
                radioSpot: {
                    ...s.radioSpotDraft,
                    targetStoreIds: [...s.radioSpotDraft.targetStoreIds],
                },
            },
        };

        setState((prev) => ({
            ...prev,
            marketingRequests: [newItem, ...prev.marketingRequests],
            lastSubmittedRequest: newItem,
        }));

        // Sincronização em nuvem assíncrona (com fallback transparente local)
        void upsertRemoteMarketingRequest(newItem);

        return newItem;
    },

    clearLastSubmittedRequest() {
        setState((s) => ({
            ...s,
            lastSubmittedRequest: null,
        }));
    },

    updateMarketingRequestStatus(
        requestId: string,
        status: MarketingRequestStatus,
        curatorNotes?: string,
        approvedFileUrl?: string
    ) {
        const nowISO = new Date().toISOString();
        setState((s) => ({
            ...s,
            marketingRequests: s.marketingRequests.map((req) =>
                req.id === requestId
                    ? {
                          ...req,
                          status,
                          updatedAtISO: nowISO,
                          curatorNotes: curatorNotes !== undefined ? curatorNotes : req.curatorNotes,
                          approvedFileUrl: approvedFileUrl !== undefined ? approvedFileUrl : req.approvedFileUrl,
                      }
                    : req
            ),
        }));

        // Sincronização em nuvem assíncrona
        void updateRemoteMarketingRequestStatus(requestId, status, curatorNotes, approvedFileUrl);
    },

    loadMarketingRequestIntoStudio(requestId: string) {
        const target = state.marketingRequests.find((r) => r.id === requestId);
        if (!target) return;

        const store = getCoagroStoreById(target.storeId);
        const deptId =
            store.bandeira === 'COAGRO_PET'
                ? 'dept-2'
                : store.bandeira === 'RB_AGRICOLA'
                  ? 'dept-3'
                  : 'dept-1';

        setState((s) => ({
            ...s,
            activeStoreId: store.id,
            activeModule:
                target.moduleType === 'CURATOR_QUEUE' ? 'STORE_POSTER' : target.moduleType,
            brandKit: {
                ...s.brandKit,
                activeDepartmentId: deptId,
                defaultBranchName: store.nome,
                defaultPhoneWhatsapp: store.telefoneFormatado,
            },
            currentOffer: target.payloadJson.offer
                ? {
                      ...target.payloadJson.offer,
                      bullets: target.payloadJson.offer.bullets.map((b) => ({ ...b })),
                  }
                : s.currentOffer,
            hrNotice: target.payloadJson.hrNotice
                ? { ...target.payloadJson.hrNotice }
                : s.hrNotice,
            bannerFaixaDraft: target.payloadJson.bannerFaixa
                ? { ...target.payloadJson.bannerFaixa }
                : s.bannerFaixaDraft,
            radioSpotDraft: target.payloadJson.radioSpot
                ? { ...target.payloadJson.radioSpot }
                : s.radioSpotDraft,
        }));
    },

    addAgroDictionaryTerm(
        canonicalTerm: string,
        category: AgroDictionaryCategory = 'COMMERCIAL_LINE',
        aliases: string[] = []
    ) {
        const cleanTerm = canonicalTerm.trim();
        if (!cleanTerm) return;

        const exists = state.customAgroDictionary.some(
            (d) => d.canonicalTerm.toLowerCase() === cleanTerm.toLowerCase()
        );
        if (exists) return;

        const nextEntry: import('./coagroDictionary').AgroDictionaryEntry = {
            id: `custom-dict-${Date.now()}`,
            canonicalTerm: cleanTerm,
            category,
            aliases: Array.from(new Set([cleanTerm.toLowerCase(), ...aliases.map((a) => a.toLowerCase())])),
            addedBy: 'Curador (Kaio)',
            addedAtISO: new Date().toISOString(),
        };

        setState((s) => ({
            ...s,
            customAgroDictionary: [...s.customAgroDictionary, nextEntry],
            marketingRequests: s.marketingRequests.map((req) => ({
                ...req,
                unknownDictionaryTerms: req.unknownDictionaryTerms.filter(
                    (t) => t.toLowerCase() !== cleanTerm.toLowerCase()
                ),
            })),
        }));

        // Sincronização em nuvem assíncrona
        void insertRemoteAgroDictionaryTerm(nextEntry);
    },

    async syncCloudData(): Promise<{
        synced: boolean;
        reason?: string;
        requestsCount?: number;
        dictCount?: number;
    }> {
        if (!isCloudSyncConfigured()) {
            return { synced: false, reason: 'unconfigured' };
        }
        try {
            const [remoteRequests, remoteDict] = await Promise.all([
                fetchRemoteMarketingRequests(),
                fetchRemoteAgroDictionary(),
            ]);

            if (remoteRequests !== null || remoteDict !== null) {
                setState((s) => {
                    const mergedRequests = remoteRequests
                        ? [
                              ...remoteRequests,
                              ...s.marketingRequests.filter(
                                  (local) => !remoteRequests.some((remote) => remote.id === local.id)
                              ),
                          ]
                        : s.marketingRequests;

                    const mergedDict = remoteDict
                        ? [
                              ...remoteDict,
                              ...s.customAgroDictionary.filter(
                                  (local) =>
                                      !remoteDict.some(
                                          (remote) =>
                                              remote.canonicalTerm.toLowerCase() ===
                                              local.canonicalTerm.toLowerCase()
                                      )
                              ),
                          ]
                        : s.customAgroDictionary;

                    return {
                        ...s,
                        marketingRequests: mergedRequests,
                        customAgroDictionary: mergedDict,
                    };
                });
                return {
                    synced: true,
                    requestsCount: remoteRequests?.length || 0,
                    dictCount: remoteDict?.length || 0,
                };
            }
            return { synced: false, reason: 'fetch_returned_null' };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return { synced: false, reason: msg };
        }
    },
};

export function getStudioState(): StudioGlobalState {
    return state;
}

export function useStudioStore(): StudioGlobalState {
    return useSyncExternalStore(
        (callback) => {
            listeners.add(callback);
            return () => listeners.delete(callback);
        },
        () => state,
        () => DEFAULT_INITIAL_STATE
    );
}
