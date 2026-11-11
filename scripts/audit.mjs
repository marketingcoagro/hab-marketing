import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);

/** @type {import('../src/core/businessRules')} */
const rules = await jiti.import('../src/core/businessRules.ts');

/** @type {import('../src/core/resolve')} */
const resolve = await jiti.import('../src/core/resolve.ts');

/** @type {import('../src/core/store')} */
const store = await jiti.import('../src/core/store.ts');

/** @type {import('../src/core/types')} */
const types = await jiti.import('../src/core/types.ts');

/** @type {import('../src/utils/leadWebhook')} */
const leadWebhook = await jiti.import('../src/utils/leadWebhook.ts');

/** @type {import('../src/core/cloudSync')} */
const cloudSync = await jiti.import('../src/core/cloudSync.ts');

/** @type {import('../src/utils/spotifastBridge')} */
const spotifastBridge = await jiti.import('../src/utils/spotifastBridge.ts');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('🧪 STUDIO VAREJO PRO v2.1.0 - AUDIT TEST SUITE (P0-P4)');
console.log('======================================================\n');

// ---------------------------------------------------------------------------
// 1. ERP Abbreviation Collision Test (P0-03)
// ---------------------------------------------------------------------------
console.log('--- 1. ERP Sanitization & Abbreviation Map (P0-03) ---');

test('cleanErpProductTitle does NOT convert "SEM" to "Semente"', () => {
  const input = 'RAÇÃO SEM CORANTE 10.1KG';
  const { cleanedTitle } = rules.cleanErpProductTitle(input);

  assert.ok(
    !cleanedTitle.toLowerCase().includes('semente'),
    `Expected "${cleanedTitle}" not to contain "semente"`
  );
  assert.ok(
    cleanedTitle.toLowerCase().includes('sem corante'),
    `Expected "${cleanedTitle}" to preserve "sem corante"`
  );

  const reg = rules.detectRegulatoryCategoryByText(cleanedTitle);
  assert.notEqual(
    reg,
    'AGRO_FERTILIZER_SEED',
    `Expected category not to be AGRO_FERTILIZER_SEED, got ${reg}`
  );
});

test('cleanErpProductTitle correctly expands "SEMENT" to "Semente"', () => {
  const input = 'SEMENT MILHO HIBRIDO 20KG';
  const { cleanedTitle } = rules.cleanErpProductTitle(input);
  assert.ok(
    cleanedTitle.toLowerCase().includes('semente'),
    `Expected "${cleanedTitle}" to contain "semente"`
  );
});

// ---------------------------------------------------------------------------
// 2. Deterministic NCM Regulatory Detection (P0-02)
// ---------------------------------------------------------------------------
console.log('\n--- 2. Deterministic NCM & Chemical Regulatory Detection (P0-02) ---');

test('detectRegulatoryCategoryByText recognizes NCM for pesticides (3808*)', () => {
  const category = rules.detectRegulatoryCategoryByText('Produto Genérico X', '3808.93.24');
  assert.equal(category, 'AGRO_PESTICIDE');
});

test('detectRegulatoryCategoryByText recognizes NCM for fertilizers and seeds (3105*)', () => {
  const category = rules.detectRegulatoryCategoryByText('Adubo Formula 10-10-10', '3105.20.00');
  assert.equal(category, 'AGRO_FERTILIZER_SEED');
});

test('detectRegulatoryCategoryByText recognizes NCM for veterinary vaccines (3002.30*)', () => {
  const category = rules.detectRegulatoryCategoryByText('Vacina Bovinos', '3002.30.90');
  assert.equal(category, 'VET_PRESCRIPTION');
});

test('detectRegulatoryCategoryByText recognizes NCM for alcoholic beverages (2203*)', () => {
  const category = rules.detectRegulatoryCategoryByText('Cerveja Puro Malte', '2203.00.00');
  assert.equal(category, 'ALCOHOL_18');
});

test('detectRegulatoryCategoryByText recognizes agrochemical active principles', () => {
  assert.equal(rules.detectRegulatoryCategoryByText('Inseticida Cipermetrina 250ml'), 'AGRO_PESTICIDE');
  assert.equal(rules.detectRegulatoryCategoryByText('Fungicida Imidacloprido SC'), 'AGRO_PESTICIDE');
  assert.equal(rules.detectRegulatoryCategoryByText('Antiparasitário Doramectina 1%'), 'VET_PRESCRIPTION');
});

// ---------------------------------------------------------------------------
// 3. Turbo Expiry Legal Preservation (P0-02)
// ---------------------------------------------------------------------------
console.log('\n--- 3. Turbo Expiry Legal Compliance (P0-02) ---');

test('getLegalFooterMetadata preserves MAPA statutory warning and appends PROCON notice when isNearExpiry is true', () => {
  const meta = rules.getLegalFooterMetadata(
    'AGRO_PESTICIDE',
    'Válido até 30/11/2026',
    'MAPA 123456',
    true // isNearExpiry = true
  );

  assert.ok(
    meta.mandatoryLegalText.includes('LEI FEDERAL Nº 14.785/2023') ||
      meta.mandatoryLegalText.includes('RECEITUÁRIO AGRONÔMICO') ||
      meta.mandatoryLegalText.includes('AGRONÔMICO'),
    `Expected statutory MAPA warning in mandatoryLegalText: "${meta.mandatoryLegalText}"`
  );
  assert.ok(
    meta.mandatoryLegalText.includes('PROCON') || meta.mandatoryLegalText.includes('VALIDADE PRÓXIMA'),
    `Expected near-expiry warning in mandatoryLegalText: "${meta.mandatoryLegalText}"`
  );
  assert.equal(meta.isHighRiskRegulated, true);
});

// ---------------------------------------------------------------------------
// 4. Expired Date Guardrail Check (P0-04)
// ---------------------------------------------------------------------------
console.log('\n--- 4. Expired Date Guardrail Validation (P0-04) ---');

test('computeOfferMetrics blocks export when validity date is in the past', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(
    yesterday.getMonth() + 1
  ).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const expiredOffer = {
    ...store.DEFAULT_INITIAL_STATE.currentOffer,
    cleanedTitle: 'Ração Canina Especial 15kg',
    priceToRaw: 149.9,
    validityPreset: 'CUSTOM_DATE',
    customValidityDateISO: yesterdayStr,
  };

  const metrics = rules.computeOfferMetrics(
    expiredOffer,
    undefined,
    store.DEFAULT_INITIAL_STATE.brandKit
  );

  assert.equal(
    metrics.canExport,
    false,
    'Expected canExport to be false for expired date'
  );
  const blockRule = metrics.guardrailFindings.find(
    (f) => f.code === 'EXPIRES_BEFORE_PROMO' && f.severity === 'block'
  );
  assert.ok(blockRule, 'Expected EXPIRES_BEFORE_PROMO blocking finding to be present');
});

// ---------------------------------------------------------------------------
// 5. Deterministic Currency Formatter (P1-02)
// ---------------------------------------------------------------------------
console.log('\n--- 5. Deterministic Currency Formatter (P1-02) ---');

test('formatBRL correctly formats integer and decimal numbers', () => {
  assert.equal(rules.formatBRL(1899), '1.899,00');
  assert.equal(rules.formatBRL(9.9), '9,90');
  assert.equal(rules.formatBRL(0), '0,00');
  assert.equal(rules.formatBRL(3500.5), '3.500,50');
});

// ---------------------------------------------------------------------------
// 6. Backup Security & Quota Escalation Guard (P1-04)
// ---------------------------------------------------------------------------
console.log('\n--- 6. Backup Security & Tier Escalation Guard (P1-04) ---');

test('exportFullTenantBackup strips geminiApiKey', () => {
  store.studioActions.updateBrandKit({ geminiApiKey: 'SECRET_API_KEY_12345' });

  const backupJson = store.studioActions.exportFullTenantBackup();
  const parsed = JSON.parse(backupJson);

  assert.equal(
    parsed.brandKit?.geminiApiKey,
    undefined,
    'Exported backup must not contain geminiApiKey'
  );

  // Restore
  store.studioActions.updateBrandKit({ geminiApiKey: '' });
});

test('importFullTenantBackup preserves existing local planTier & freemiumQuota', () => {
  const currentStateBefore = store.getStudioState();
  const originalTier = currentStateBefore.planTier;
  const originalQuota = { ...currentStateBefore.freemiumQuota };

  // Export a valid backup first
  const validBackupJson = store.studioActions.exportFullTenantBackup();
  const maliciousBackupObj = JSON.parse(validBackupJson);

  // Attempt privilege escalation via backup tampering
  maliciousBackupObj.planTier = 'ENTERPRISE';
  maliciousBackupObj.freemiumQuota = { usedThisMonth: 0, monthlyLimit: 99999 };

  const success = store.studioActions.importFullTenantBackup(JSON.stringify(maliciousBackupObj));
  assert.ok(success, 'importFullTenantBackup should return true for valid schema');

  const currentStateAfter = store.getStudioState();
  assert.equal(
    currentStateAfter.planTier,
    originalTier,
    'planTier must remain unchanged after importing backup'
  );
  assert.equal(
    currentStateAfter.freemiumQuota.usedThisMonth,
    originalQuota.usedThisMonth,
    'freemiumQuota must not be overwritten by imported backup'
  );
});

// ---------------------------------------------------------------------------
// 7. WhatsApp Smart Paste Parsing (P1-01)
// ---------------------------------------------------------------------------
console.log('\n--- 7. WhatsApp Smart Paste Parsing (P1-01) ---');

test('parseWhatsAppSmartPaste handles De/Por syntax correctly', () => {
  const text = 'Ração Premier Formula Adulto 15kg de R$ 269,90 por R$ 219,90';
  const parsed = rules.parseWhatsAppSmartPaste(text);

  assert.equal(parsed.priceFrom, 269.9);
  assert.equal(parsed.priceTo, 219.9);
  assert.equal(parsed.mechanicType, 'SIMPLE_DE_POR');
  assert.equal(parsed.recommendedArchetype, 'PROMO_CLASSIC_V');
});

test('parseWhatsAppSmartPaste handles installment patterns correctly', () => {
  const text = 'Motosserra Gasolina Stihl 10x de 189,90 sem juros';
  const parsed = rules.parseWhatsAppSmartPaste(text);

  assert.equal(parsed.installmentCount, 10);
  assert.equal(parsed.mechanicType, 'INSTALLMENT_FINANCING');
  assert.equal(parsed.recommendedArchetype, 'MACHINERY_INSTALLMENT');
});

test('parseWhatsAppSmartPaste handles Buy & Win syntax correctly', () => {
  const text = 'Compre 3 Sacos de Ração e ganhe 1 Balde dosador por R$ 349,00';
  const parsed = rules.parseWhatsAppSmartPaste(text);

  assert.equal(parsed.priceTo, 349.0);
  assert.equal(parsed.mechanicType, 'BUY_WIN_GIFT');
  assert.equal(parsed.recommendedArchetype, 'COMBO_ADVANTAGE');
  assert.ok(parsed.giftOrConditionText?.toLowerCase().includes('balde'));
});

// ---------------------------------------------------------------------------
// 8. Deterministic Archetype Resolver (P0-01)
// ---------------------------------------------------------------------------
console.log('\n--- 8. Deterministic Archetype Resolver (P0-01) ---');

test('resolveRecommendedArchetype maps mechanics to the correct layout archetype', () => {
  assert.equal(rules.resolveRecommendedArchetype('INSTALLMENT_FINANCING', undefined, 100), 'MACHINERY_INSTALLMENT');
  assert.equal(rules.resolveRecommendedArchetype('BUY_WIN_GIFT', undefined, 100), 'COMBO_ADVANTAGE');
  assert.equal(rules.resolveRecommendedArchetype('SIMPLE_DE_POR', 100, 80), 'PROMO_CLASSIC_V');
  assert.equal(rules.resolveRecommendedArchetype('SIMPLE_DE_POR', undefined, 80), 'CLEAN_DIRECT_PRICE');
});

// ---------------------------------------------------------------------------
// 9. Multi-Product Carousel Slide Synthesis (P0-01)
// ---------------------------------------------------------------------------
console.log('\n--- 9. Multi-Product Carousel Slide Synthesis (P0-01) ---');

test('addCarouselSlide allows independent product prices per slide', () => {
  const originalSlidesCount = store.getStudioState().carouselSlides.length;
  store.studioActions.addCarouselSlide();
  const slides = store.getStudioState().carouselSlides;
  assert.equal(slides.length, originalSlidesCount + 1);

  const newSlide = slides[slides.length - 1];
  assert.ok('priceTo' in newSlide, 'New slide should have priceTo field');
  assert.ok('mechanicType' in newSlide, 'New slide should have mechanicType field');
});

// ---------------------------------------------------------------------------
// 10. resolveRenderSpec Verification & DOM Contracts
// ---------------------------------------------------------------------------
console.log('\n--- 10. resolveRenderSpec & DOM Contract Validation ---');

test('resolveRenderSpec produces valid spec with tokens and valid scale for posters', () => {
  const state = store.getStudioState();
  const spec = resolve.resolveRenderSpec(
    state.currentOffer,
    state.brandKit,
    state.posterConfig.visualTheme
  );

  assert.ok(spec.fingerprint, 'Spec fingerprint must exist');
  assert.ok(spec.typography.titleScaleClass, 'Spec typography titleScaleClass must exist');
  assert.ok(spec.metrics.effectiveUnitPrice > 0, 'Spec metrics effectiveUnitPrice must be positive');
  assert.ok(spec.metrics.integerPart !== undefined, 'Spec metrics integerPart must exist');
  assert.ok(spec.metrics.centsPart !== undefined, 'Spec metrics centsPart must exist');
});

// ---------------------------------------------------------------------------
// 11. Sprint v2.3.0 QA & Architecture Validations (TEST-19 a TEST-22)
// ---------------------------------------------------------------------------
console.log('\n--- 11. Sprint v2.3.0 Visual & Architecture Validations ---');

test('TEST-19: SAAS_BRAND exports "Gabarito Pro" and plan pricing (R$ 97 and R$ 197)', () => {
  assert.equal(types.SAAS_BRAND.name, 'Gabarito Pro');
  assert.equal(types.SAAS_BRAND.plans.balcaoProPrice, 97);
  assert.equal(types.SAAS_BRAND.plans.governancaPrice, 197);
});

test('TEST-20: resolveRenderSpec calibrates 5-digit price scale (R$ 18.990) for isGondola (15cqw) and isA5Half (17cqw)', () => {
  const state = store.getStudioState();
  const highValueOffer = {
    ...state.currentOffer,
    priceToRaw: 18990.00,
  };

  const gondolaSpec = resolve.resolveRenderSpec(
    highValueOffer,
    state.brandKit,
    state.posterConfig.visualTheme,
    undefined,
    false,
    true
  );
  assert.equal(
    gondolaSpec.tokens.integerPriceFontSizeCqw,
    '15cqw',
    `Expected gondola integer price font size to be 15cqw, got ${gondolaSpec.tokens.integerPriceFontSizeCqw}`
  );

  const a5Spec = resolve.resolveRenderSpec(
    highValueOffer,
    state.brandKit,
    state.posterConfig.visualTheme,
    undefined,
    true,
    false
  );
  assert.equal(
    a5Spec.tokens.integerPriceFontSizeCqw,
    '17cqw',
    `Expected A5 half-sheet integer price font size to be 17cqw, got ${a5Spec.tokens.integerPriceFontSizeCqw}`
  );
});

test('TEST-21: exportElementToPng does not invoke printOrSaveA4Sheet inside onerror handler', () => {
  const exporterSrc = fs.readFileSync(
    new URL('../src/engine/exporter.ts', import.meta.url),
    'utf-8'
  );
  const hasPrintInOnerror = /img\.onerror[\s\S]*?printOrSaveA4Sheet/.test(exporterSrc);
  assert.equal(
    hasPrintInOnerror,
    false,
    'exportElementToPng must never trigger printOrSaveA4Sheet on img.onerror'
  );
});

test('TEST-22: visualStylePreset supports "RETAIL_POP", "AGRO_BRUTALIST" and "MINIMAL_BOUTIQUE" in brandKit', () => {
  const state = store.getStudioState();
  const presets = ['RETAIL_POP', 'AGRO_BRUTALIST', 'MINIMAL_BOUTIQUE'];

  for (const preset of presets) {
    const testBrandKit = {
      ...state.brandKit,
      visualStylePreset: preset,
    };
    const spec = resolve.resolveRenderSpec(
      state.currentOffer,
      testBrandKit,
      state.posterConfig.visualTheme
    );
    assert.ok(spec.fingerprint, `Spec fingerprint must exist for preset ${preset}`);
    assert.equal(testBrandKit.visualStylePreset, preset);
  }
});

// ---------------------------------------------------------------------------
// 12. Sprint v2.7.0 Security, Templates & Webhook Hardening (TEST-23 a TEST-25)
// ---------------------------------------------------------------------------
console.log('\n--- 12. Sprint v2.7.0 Security, Templates & Webhook Hardening ---');

test('TEST-23: cleanErpProductTitle strips XSS tags (<script>, <iframe>, onerror, javascript:)', () => {
  const malicious = '<script>alert(1)</script>RAC AD 15KG <img src=x onerror="hack()"> javascript:void(0)';
  const { cleanedTitle } = rules.cleanErpProductTitle(malicious);

  assert.ok(!cleanedTitle.includes('<'), `Expected no "<" in "${cleanedTitle}"`);
  assert.ok(!cleanedTitle.includes('>'), `Expected no ">" in "${cleanedTitle}"`);
  assert.ok(!cleanedTitle.toLowerCase().includes('script'), `Expected no "script" in "${cleanedTitle}"`);
  assert.ok(!cleanedTitle.toLowerCase().includes('onerror'), `Expected no "onerror" in "${cleanedTitle}"`);
  assert.ok(!cleanedTitle.toLowerCase().includes('javascript:'), `Expected no "javascript:" in "${cleanedTitle}"`);
  assert.ok(cleanedTitle.includes('Ração Adulto 15KG'), `Expected cleaned title to preserve product text, got "${cleanedTitle}"`);
});

test('TEST-24: PosterAndSocialCanvas supports all official poster archetypes and records generationAuditHistory on quota consumption', () => {
  const canvasSrc = fs.readFileSync(
    new URL('../src/engine/PosterAndSocialCanvas.tsx', import.meta.url),
    'utf-8'
  );
  const archetypes = [
    'PROMO_MODERN_V',
    'CLEAN_DIRECT_PRICE',
    'MACHINERY_INSTALLMENT',
    'COMBO_ADVANTAGE',
    'GRID_MULTIPRODUCT_4X',
    'PROMO_CLASSIC_V',
  ];
  for (const arch of archetypes) {
    assert.ok(
      canvasSrc.includes(arch),
      `Expected PosterAndSocialCanvas.tsx to implement archetype ${arch}`
    );
  }

  store.studioActions.consumeExportQuota();
  const stateAfter = store.getStudioState();
  assert.ok(
    Array.isArray(stateAfter.generationAuditHistory) &&
      stateAfter.generationAuditHistory.length > 0,
    'Expected generationAuditHistory to record exported items'
  );
});

test('TEST-25: resolveN8nWebhookUrl normalizes bare tunnel domain and buildCommercialCheckoutUrl uses SAAS_BRAND', () => {
  const normalized = leadWebhook.resolveN8nWebhookUrl('https://my-tunnel.trycloudflare.com/');
  assert.equal(
    normalized,
    'https://my-tunnel.trycloudflare.com/webhook/gabarito-lead-captured'
  );

  const explicit = leadWebhook.resolveN8nWebhookUrl(
    'https://my-tunnel.trycloudflare.com/webhook/custom-hook'
  );
  assert.equal(explicit, 'https://my-tunnel.trycloudflare.com/webhook/custom-hook');

  const checkoutUrl = types.buildCommercialCheckoutUrl('BALCAO', 'Quero assinar');
  assert.ok(checkoutUrl.startsWith('https://wa.me/'), `Expected wa.me URL, got ${checkoutUrl}`);
});

// ---------------------------------------------------------------------------
// 13. Hub Coagro Architecture, Governance & Agro Dictionary (TEST-26 a TEST-30)
// ---------------------------------------------------------------------------
console.log('\n--- 13. Hub Coagro Architecture, Governance & Agro Dictionary ---');

/** @type {import('../src/core/coagroStores')} */
const coagroStores = await jiti.import('../src/core/coagroStores.ts');

/** @type {import('../src/core/coagroDictionary')} */
const coagroDict = await jiti.import('../src/core/coagroDictionary.ts');

test('TEST-26: Coagro Store Directory switches branch data and Agro/Pet palette automatically', () => {
  assert.ok(coagroStores.COAGRO_STORES.length >= 15, 'Expected at least 15 Coagro units');

  store.studioActions.setActiveStore('jatiuca');
  const stPet = store.getStudioState();
  assert.equal(stPet.activeStoreId, 'jatiuca');
  assert.equal(stPet.brandKit.activeDepartmentId, 'dept-2');
  assert.equal(stPet.brandKit.companyName, 'Coagro Pet');

  store.studioActions.setActiveStore('lagarto');
  const stAgro = store.getStudioState();
  assert.equal(stAgro.activeStoreId, 'lagarto');
  assert.equal(stAgro.brandKit.activeDepartmentId, 'dept-1');
  assert.equal(stAgro.brandKit.defaultBranchName, 'Coagro Lagarto');
});

test('TEST-27: inspectAgroOrthography strips ERP numeric prefix, fixes partner brands, and flags unknown terms', () => {
  const res = coagroDict.inspectAgroOrthography(
    '0000805- Herbicida Hexazinona Ouro Fino e Travero p/ Mombaca com ProdutoInexistenteX'
  );
  assert.equal(res.strippedErpPrefix, '0000805-');
  assert.ok(res.normalizedText.includes('Ourofino'), `Expected Ourofino in "${res.normalizedText}"`);
  assert.ok(res.normalizedText.includes('Tramontina'), `Expected Tramontina in "${res.normalizedText}"`);
  assert.ok(res.normalizedText.includes('Mombaça'), `Expected Mombaça in "${res.normalizedText}"`);
  assert.ok(
    res.unknownTerms.includes('ProdutoInexistenteX'),
    `Expected ProdutoInexistenteX in unknownTerms: ${res.unknownTerms.join(', ')}`
  );
});

test('TEST-28: evaluateGovernanceTrack separates Via Verde (GREEN_DIRECT) from Via Amarela (YELLOW_CURATOR)', () => {
  const s = store.getStudioState();

  const posterGov = rules.evaluateGovernanceTrack({
    module: 'STORE_POSTER',
    userRole: 'STORE_MANAGER',
    offer: s.currentOffer,
    brandKit: s.brandKit,
    textToInspect: 'Ração Tutticanis Select 10kg',
  });
  assert.equal(posterGov.track, 'GREEN_DIRECT');
  assert.equal(posterGov.canDirectExport, true);

  const socialGovManager = rules.evaluateGovernanceTrack({
    module: 'SOCIAL_MEDIA',
    userRole: 'STORE_MANAGER',
    offer: s.currentOffer,
    brandKit: s.brandKit,
  });
  assert.equal(socialGovManager.track, 'YELLOW_CURATOR');
  assert.equal(socialGovManager.canDirectExport, false);
  assert.equal(socialGovManager.requiresCuratorApproval, true);

  const socialGovCurator = rules.evaluateGovernanceTrack({
    module: 'SOCIAL_MEDIA',
    userRole: 'CURATOR_ADMIN',
    offer: s.currentOffer,
    brandKit: s.brandKit,
  });
  assert.equal(socialGovCurator.canDirectExport, true);
});

test('TEST-29: Curator Queue lifecycle (submit, approve, load into studio, homologate dictionary term)', () => {
  const beforeCount = store.getStudioState().marketingRequests.length;
  store.studioActions.setActiveModule('BANNER_FAIXA');
  const created = store.studioActions.submitMarketingRequest('Teste automatizado de lona');

  const afterSubmit = store.getStudioState();
  assert.equal(afterSubmit.marketingRequests.length, beforeCount + 1);
  assert.equal(created.status, 'QUOTING');

  store.studioActions.updateMarketingRequestStatus(created.id, 'APPROVED', 'Aprovado no teste');
  const updated = store
    .getStudioState()
    .marketingRequests.find((r) => r.id === created.id);
  assert.equal(updated?.status, 'APPROVED');

  store.studioActions.addAgroDictionaryTerm('SuperForrageiraCoagro', 'CULTIVAR_REGIONAL');
  const check = coagroDict.inspectAgroOrthography(
    'Semente SuperForrageiraCoagro 20kg',
    store.getStudioState().customAgroDictionary
  );
  assert.equal(check.unknownTerms.length, 0);
});

test('TEST-30: Radio Coagro Spotifast timing and script generator', () => {
  const script = rules.buildRadioSpotScript(
    {
      spotType: 'PRODUCT_OFFER',
      durationSeconds: 15,
      productOrSubject: 'Dectomax 500mL',
      priceText: 'R$ 389,90',
    },
    'Coagro Aracaju'
  );
  assert.ok(script.includes('Coagro Aracaju'));
  assert.ok(script.includes('Dectomax 500mL'));

  const timing = rules.estimateRadioSpotTiming(script, 15);
  assert.ok(timing.wordCount > 5);
  assert.equal(timing.isWithinLimit, true);
});

test('TEST-31: Sprint 1 CloudSync PostgREST data mappers & offline fallback resilience', async () => {
  assert.equal(typeof cloudSync.isCloudSyncConfigured, 'function');
  assert.equal(typeof cloudSync.mapMarketingRequestToDb, 'function');
  assert.equal(typeof cloudSync.mapDbToMarketingRequest, 'function');
  assert.equal(typeof cloudSync.mapAgroDictionaryToDb, 'function');
  assert.equal(typeof cloudSync.mapDbToAgroDictionary, 'function');

  // Verifica mapeamento bidirecional de MarketingRequestItem
  const sampleRequest = {
    id: 'req-test-sync-1',
    protocolCode: 'REQ-9999',
    createdAtISO: '2026-11-10T15:00:00.000Z',
    updatedAtISO: '2026-11-10T15:05:00.000Z',
    storeId: 'lagarto',
    storeName: 'Coagro Lagarto',
    requesterEmail: 'gerente.lagarto@grupocoagro.com.br',
    moduleType: 'BANNER_FAIXA',
    title: 'Faixa 300x70cm — Promoção Adubo',
    subtitleOrSummary: 'Cotação Gráfica • 2 un.',
    governanceTrack: 'YELLOW_CURATOR',
    status: 'QUOTING',
    guardrailWarnings: ['Faixa gráfica exige aprovação de layout e cotação'],
    unknownDictionaryTerms: ['AduboForteX'],
    curatorNotes: 'Aprovado pelo Kaio',
    payloadJson: {
      bannerFaixa: {
        id: 'draft-1',
        pieceType: 'FAIXA_RUA',
        widthCm: 300,
        heightCm: 70,
        campaignTitle: 'Adubo',
        featuredProductOrPartner: 'Yara',
        priceText: 'R$ 149',
        quantity: 2,
        notes: '',
      },
    },
  };

  const dbRow = cloudSync.mapMarketingRequestToDb(sampleRequest);
  assert.equal(dbRow.id, sampleRequest.id);
  assert.equal(dbRow.protocol_code, 'REQ-9999');
  assert.equal(dbRow.governance_track, 'YELLOW_CURATOR');
  assert.equal(dbRow.status, 'QUOTING');
  assert.deepEqual(dbRow.guardrail_warnings, ['Faixa gráfica exige aprovação de layout e cotação']);
  assert.deepEqual(dbRow.unknown_dictionary_terms, ['AduboForteX']);

  const reconstructed = cloudSync.mapDbToMarketingRequest(dbRow);
  assert.equal(reconstructed.id, sampleRequest.id);
  assert.equal(reconstructed.protocolCode, sampleRequest.protocolCode);
  assert.equal(reconstructed.governanceTrack, 'YELLOW_CURATOR');
  assert.equal(reconstructed.status, 'QUOTING');
  assert.equal(reconstructed.curatorNotes, 'Aprovado pelo Kaio');

  // Verifica mapeamento bidirecional de AgroDictionaryEntry
  const sampleDictEntry = {
    id: 'dict-test-1',
    canonicalTerm: 'Mombaça',
    category: 'CULTIVAR_REGIONAL',
    aliases: ['mombaca', 'capim mombaça'],
    addedBy: 'Curador (Kaio)',
    addedAtISO: '2026-11-10T14:00:00.000Z',
  };
  const dbDictRow = cloudSync.mapAgroDictionaryToDb(sampleDictEntry);
  assert.equal(dbDictRow.canonical_term, 'Mombaça');
  assert.equal(dbDictRow.category, 'CULTIVAR_REGIONAL');
  const reconstructedDict = cloudSync.mapDbToAgroDictionary(dbDictRow);
  assert.equal(reconstructedDict.canonicalTerm, 'Mombaça');
  assert.equal(reconstructedDict.category, 'CULTIVAR_REGIONAL');

  // Sincronização sem variáveis não pode quebrar a aplicação (graceful fallback)
  const syncResult = await store.studioActions.syncCloudData();
  assert.equal(typeof syncResult.synced, 'boolean');
  if (!cloudSync.isCloudSyncConfigured()) {
    assert.equal(syncResult.synced, false);
    assert.equal(syncResult.reason, 'unconfigured');
  }
});

test('TEST-32: Sprint 2 Spotifast Server (:8790) Bridge & Radio Coagro dispatch', async () => {
  assert.equal(typeof spotifastBridge.getSpotifastServerUrl, 'function');
  assert.equal(typeof spotifastBridge.publishAudioToSpotifast, 'function');

  const serverUrl = spotifastBridge.getSpotifastServerUrl();
  assert.ok(serverUrl.includes(':8790') || serverUrl.startsWith('http'));

  // Teste de publicação com mock/blob de áudio mp3
  const fakeBlob = new Blob(['FAKE_AUDIO_DATA_MP3'], { type: 'audio/mpeg' });
  const publishResult = await spotifastBridge.publishAudioToSpotifast({
    audioFile: fakeBlob,
    fileName: 'spot-dectomax-aracaju-30s.mp3',
    title: 'Spot 30s Oferta Dectomax',
    productOrSubject: 'Dectomax 500mL',
    targetStoreIds: ['aracaju', 'lagarto', 'umbauba'],
    priority: 2,
    durationSeconds: 30,
    protocolCode: 'REQ-2043',
  });

  assert.equal(publishResult.success, true);
  assert.ok(publishResult.message.includes('Spotifast'));
  assert.ok(typeof publishResult.audioUrl === 'string');
});

test('TEST-33: Sprint 3 Global Campaigns & Homologated Media Library Studio Injection', () => {
  assert.equal(typeof store.studioActions.applyCampaignToStudio, 'function');
  assert.equal(typeof store.studioActions.applyCatalogRecord, 'function');

  // Testa injeção de Campanha Sazonal no Estúdio
  const appliedPoster = store.studioActions.applyCampaignToStudio('camp-saldao', 'STORE_POSTER');
  assert.equal(appliedPoster, true);
  const stateAfterPoster = store.getStudioState();
  assert.equal(stateAfterPoster.activeModule, 'STORE_POSTER');
  assert.equal(stateAfterPoster.brandKit.activeCampaignId, 'camp-saldao');
  assert.equal(stateAfterPoster.posterConfig.visualTheme, 'CAMPAIGN_SEASONAL');
  assert.equal(stateAfterPoster.brandKit.alertPrimaryColorHex, '#002B49');
  assert.equal(stateAfterPoster.brandKit.alertAccentColorHex, '#ffab00');

  // Testa injeção no Módulo de Redes Sociais
  const appliedSocial = store.studioActions.applyCampaignToStudio('camp-sabadao', 'SOCIAL_MEDIA');
  assert.equal(appliedSocial, true);
  const stateAfterSocial = store.getStudioState();
  assert.equal(stateAfterSocial.activeModule, 'SOCIAL_MEDIA');
  assert.equal(stateAfterSocial.brandKit.activeCampaignId, 'camp-sabadao');
  assert.equal(stateAfterSocial.socialConfig.visualTheme, 'CAMPAIGN_SEASONAL');

  // Testa carregamento de SKU do catálogo na oferta
  const sampleSku = rules.DEFAULT_ERP_CATALOG_DB.find((item) => item.skuCode === '101');
  assert.ok(sampleSku, 'SKU 101 deve existir no catálogo base');
  store.studioActions.applyCatalogRecord(sampleSku);
  const stateAfterCatalog = store.getStudioState();
  assert.equal(stateAfterCatalog.currentOffer.skuCode, '101');
  assert.equal(stateAfterCatalog.currentOffer.cleanedTitle, 'Ração Tutticanis Select Adulto 10,1KG');
  assert.equal(stateAfterCatalog.currentOffer.priceToRaw, 44.0);
  assert.equal(stateAfterCatalog.currentOffer.unit, 'KG');
});

test('TEST-34: Sprint 4 Operator Mode RBAC Debloat & Official Protocol Generator', () => {
  // Testa transição para modo Balcão (OPERATOR)
  store.studioActions.setUserRole('OPERATOR');
  assert.equal(store.getStudioState().userRole, 'OPERATOR');

  // No modo balcão, a mecânica comercial padrão é Preço Direto
  assert.equal(store.getStudioState().currentOffer.mechanicType, 'SIMPLE_DE_POR');

  // Submissão gera protocolo auditável REQ-XXXX com metadados da loja ativa
  store.studioActions.setActiveStore('delmiro');
  const req = store.studioActions.submitMarketingRequest('Submissão via balcão');
  assert.ok(req.protocolCode.startsWith('REQ-'));
  assert.equal(req.storeId, 'delmiro');
  assert.equal(req.storeName, 'Coagro Delmiro Gouveia');
  assert.ok(req.requesterEmail.includes('delmiro'));

  // Transição de volta para STORE_MANAGER e CURATOR_ADMIN
  store.studioActions.setUserRole('STORE_MANAGER');
  assert.equal(store.getStudioState().userRole, 'STORE_MANAGER');

  store.studioActions.setUserRole('CURATOR_ADMIN');
  assert.equal(store.getStudioState().userRole, 'CURATOR_ADMIN');
});

test('TEST-35: Sprint 5 SQL status constraint alignment (NEEDS_REVISION) & CloudSync boot readiness', async () => {
  const sqlContent = fs.readFileSync('supabase_migration_hub_coagro.sql', 'utf8');
  assert.ok(
    sqlContent.includes("'NEEDS_REVISION'"),
    "supabase_migration_hub_coagro.sql deve conter 'NEEDS_REVISION' no CHECK constraint"
  );
  assert.equal(typeof store.studioActions.syncCloudData, 'function');
});

test('TEST-36: Sprint 6 Radio audio approvedFileUrl persistence in updateMarketingRequestStatus', () => {
  const created = store.studioActions.submitMarketingRequest('Teste spot rádio com áudio gravado');
  const sampleAudioUrl = 'http://localhost:8790/media/spot-delmiro-30s.mp3';

  store.studioActions.updateMarketingRequestStatus(
    created.id,
    'APPROVED',
    'Spot aprovado e publicado no Spotifast Server (:8790)',
    sampleAudioUrl
  );

  const found = store.getStudioState().marketingRequests.find((r) => r.id === created.id);
  assert.ok(found);
  assert.equal(found?.status, 'APPROVED');
  assert.equal(found?.approvedFileUrl, sampleAudioUrl);
});

test('TEST-37: Sprint 7 Global lastSubmittedRequest protocol modal lifecycle', () => {
  assert.equal(typeof store.studioActions.clearLastSubmittedRequest, 'function');

  // Ao submeter solicitação, lastSubmittedRequest é gravado no estado global
  const created = store.studioActions.submitMarketingRequest('Pedido com modal global');
  const currentState = store.getStudioState();
  assert.ok(currentState.lastSubmittedRequest);
  assert.equal(currentState.lastSubmittedRequest?.id, created.id);
  assert.equal(currentState.lastSubmittedRequest?.protocolCode, created.protocolCode);

  // Ao fechar modal, clearLastSubmittedRequest limpa para null
  store.studioActions.clearLastSubmittedRequest();
  assert.equal(store.getStudioState().lastSubmittedRequest, null);
});

test('TEST-38: Sprint 8 Homologação de produto customizado com foto e injeção no estúdio', () => {
  assert.equal(typeof store.studioActions.addCustomCatalogProduct, 'function');

  const customProduct = {
    skuCode: 'AGRO-999',
    rawTitle: 'Herbicida Glifosato Concentrado 20L',
    cleanedTitle: 'Glifosato Concentrado 20L',
    subtitle: 'Glifosato 480 g/L',
    unit: 'L',
    priceFrom: 320.0,
    priceTo: 279.9,
    regulatoryCategory: 'AGRO_PESTICIDE',
    productImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    updatedAtISO: new Date().toISOString(),
  };

  store.studioActions.addCustomCatalogProduct(customProduct);

  const state = store.getStudioState();
  const saved = state.customCatalogDb.find((p) => p.skuCode === 'AGRO-999');
  assert.ok(saved, 'Produto customizado deve existir no customCatalogDb');
  assert.equal(saved?.cleanedTitle, 'Glifosato Concentrado 20L');
  assert.equal(saved?.priceTo, 279.9);
  assert.equal(saved?.regulatoryCategory, 'AGRO_PESTICIDE');
  assert.ok(saved?.productImageUrl?.startsWith('data:image/png;base64'));

  // Ao aplicar o catálogo no estúdio, o productImageUrl é transferido para currentOffer
  store.studioActions.applyCatalogRecord(saved);
  const updatedOffer = store.getStudioState().currentOffer;
  assert.equal(updatedOffer.skuCode, 'AGRO-999');
  assert.equal(updatedOffer.priceToRaw, 279.9);
  assert.equal(updatedOffer.productImageUrl, saved.productImageUrl);
  assert.equal(updatedOffer.imageUrl, saved.productImageUrl);
});

test('TEST-39: Sprint v3.4 Master Plan (Agro palette inversion, Expedicionário default, Pet flag, 5 Campaigns, Radio toggle)', () => {
  // 1. Expedicionário é a loja padrão e lojas desativadas foram removidas da lista ativa
  const stores = coagroStores.COAGRO_STORES;
  assert.ok(stores.length >= 15);
  assert.equal(stores.some((s) => s.id === 'catedral'), false, 'Catedral deve ter sido removida da listagem ativa');
  assert.equal(stores.some((s) => s.id === '15-de-novembro'), false, '15 de Novembro deve ter sido removida');

  // getCoagroStoreById mapeia com segurança IDs desativados para Expedicionário
  const fallbackStore = coagroStores.getCoagroStoreById('catedral');
  assert.equal(fallbackStore.id, 'expedicionario');

  // 2. Flags ativo e hasPetDepartment presentes
  const expedicionario = coagroStores.getCoagroStoreById('expedicionario');
  assert.equal(expedicionario.ativo, true);
  assert.equal(expedicionario.hasPetDepartment, true);

  const delmiro = coagroStores.getCoagroStoreById('delmiro');
  assert.equal(delmiro.hasPetDepartment, false);

  const propria = stores.find((s) => s.id === 'rb-propria');
  assert.ok(propria);
  assert.equal(propria.ativo, false, 'Unidade RB Agrícola em transição deve ter ativo: false');

  // 3. Hierarquia de cores invertida no Agro (Azul Primária, Verde Secundária, Ouro Acento)
  const deptAgro = store.getStudioState().brandKit.departments.find((d) => d.id === 'dept-1');
  assert.ok(deptAgro);
  assert.equal(deptAgro?.primaryColorHex, '#002B49');
  assert.equal(deptAgro?.secondaryColorHex, '#004d40');
  assert.equal(deptAgro?.accentColorHex, '#ffab00');

  // Coagro Pet continua isolado
  const deptPet = store.getStudioState().brandKit.departments.find((d) => d.id === 'dept-2');
  assert.equal(deptPet?.primaryColorHex, '#001C71');
  assert.equal(deptPet?.secondaryColorHex, '#4897D0');

  // 4. Todas as 5 campanhas oficiais pré-aprovadas presentes
  const campaigns = store.getStudioState().brandKit.seasonalCampaigns;
  assert.equal(campaigns.length >= 5, true);
  const campIds = campaigns.map((c) => c.id);
  assert.ok(campIds.includes('camp-saldao'));
  assert.ok(campIds.includes('camp-black-friday'));
  assert.ok(campIds.includes('camp-sabadao'));
  assert.ok(campIds.includes('camp-fechames'));
  assert.ok(campIds.includes('camp-natal'));

  // 5. Rádio Coagro toggle mentionStoreName
  const scriptWithStore = rules.buildRadioSpotScript(
    {
      spotType: 'PRODUCT_OFFER',
      durationSeconds: 15,
      productOrSubject: 'Bovigold 25kg',
      priceText: 'R$ 89,90',
      mentionStoreName: true,
    },
    'Coagro Expedicionário'
  );
  assert.ok(scriptWithStore.includes('Coagro Expedicionário'));

  const scriptWithoutStore = rules.buildRadioSpotScript(
    {
      spotType: 'PRODUCT_OFFER',
      durationSeconds: 15,
      productOrSubject: 'Bovigold 25kg',
      priceText: 'R$ 89,90',
      mentionStoreName: false,
    },
    'Coagro Expedicionário'
  );
  assert.ok(scriptWithoutStore.includes('todas as lojas do Grupo Coagro'));
  assert.ok(!scriptWithoutStore.includes('Coagro Expedicionário'));
});

console.log('\n======================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} tests passed.`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
