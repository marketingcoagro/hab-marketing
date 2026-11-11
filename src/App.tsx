// src/App.tsx
import React, { useRef, useState, useEffect } from 'react';
import { useStudioStore, studioActions } from './core/store';
import { resolveRenderSpec } from './core/resolve';
import {
  StorePosterA4Sheet,
  SocialMediaCardCanvas,
  GuidedCarouselCanvas,
  HrAndNoticeCanvas,
} from './engine/PosterAndSocialCanvas';
import {
  printOrSaveA4Sheet,
  exportElementToPng,
  tightCropAlphaDataUrl,
  analyzeProductImageLocal,
  ProductImageDiagnostics,
} from './engine/exporter';
import { PaywallModal } from './ui/PaywallModal';
import { Sidebar } from './ui/Sidebar';
import { Topbar } from './ui/Topbar';
import { SettingsCenter } from './ui/SettingsCenter';
import { LandingPage } from './ui/LandingPage';
import { CuratorQueueView } from './ui/CuratorQueueView';
import { BrandHubView } from './ui/BrandHubView';
import { SpecialRequestsView } from './ui/SpecialRequestsView';
import { PreviewStage, PreviewSaveState, type PreviewFrame } from './ui/PreviewStage';
import { SETTINGS_TABS, isSettingsTab, type SettingsTab } from './ui/settingsTabs';
import { isControlVisible, useUiPrefs, setWorkModePref } from './ui/useUiPrefs';
import {
  IconCheck,
  IconChevronRight,
  IconClose,
  IconDownload,
  IconEye,
  IconPrint,
  IconShare,
  IconShield,
} from './ui/icons';
import {
  resolveAccessibleTextColor,
  searchErpCatalog,
  evaluateGovernanceTrack,
} from './core/businessRules';
import {
  SAAS_BRAND,
  ModuleMode,
  PrintGridFormat,
  RoundingStrategy,
  SocialAspectRatio,
  ValidityPreset,
  RegulatoryCategory,
  CommercialMechanicType,
  HrNoticeArchetype,
  PosterLayoutArchetype,
  MarketingRequestItem,
  COAGRO_OFFICIAL_POSTER_ARCHETYPE,
} from './core/types';

const MODULE_META: Record<
  ModuleMode,
  { label: string; eyebrow: string; title: string; description: string; caption: string }
> = {
  SOCIAL_MEDIA: {
    label: 'Anúncios da loja',
    eyebrow: 'Comunicação digital',
    title: 'Anúncios para WhatsApp e redes',
    description: 'Stories e feed com identidade Coagro, preço conferido e aprovação de marketing.',
    caption: 'Anúncio da loja',
  },
  STORE_POSTER: {
    label: 'Cartazes de PDV',
    eyebrow: 'Ponto de venda',
    title: 'Cartazes e etiquetas de gôndola',
    description: 'Impressão em A4, meia-folha A5 e etiquetas 2×2 com preço e vigência conferidos.',
    caption: 'Folha de impressão',
  },
  CAROUSEL: {
    label: 'Carrossel',
    eyebrow: 'Sequência de ofertas',
    title: 'Carrossel de ofertas',
    description: 'Capa, ofertas e chamada final em uma sequência pronta para publicar.',
    caption: 'Slide ativo',
  },
  HR_NOTICE: {
    label: 'Comunicados',
    eyebrow: 'Comunicação interna',
    title: 'Comunicados e mural',
    description: 'Vagas, avisos e segurança em material de mural ou card interno.',
    caption: 'Comunicado',
  },
  BANNER_FAIXA: {
    label: 'Faixas e lonas',
    eyebrow: 'Grande formato',
    title: 'Faixas, banners e lonas',
    description: 'Medidas, mockup proporcional e envio para cotação gráfica.',
    caption: 'Mockup do material',
  },
  CAMPAIGNS: {
    label: 'Campanhas',
    eyebrow: 'Campanhas da rede',
    title: 'Campanhas e mídia oficial',
    description: 'Pacotes sazonais, criativos, vídeos e spots homologados para as unidades.',
    caption: 'Campanhas oficiais',
  },
  RADIO_SPOT: {
    label: 'Rádio Coagro',
    eyebrow: 'Mídia interna',
    title: 'Rádio Coagro',
    description: 'Roteiros de 15 e 30 segundos para o som ambiente das lojas.',
    caption: 'Roteiro de locução',
  },
  BRAND_HUB: {
    label: 'Kit Colaborador',
    eyebrow: 'Identidade e materiais',
    title: 'Kit Colaborador e Marca',
    description: 'Perfil, assinatura, cartão, papelaria e ativos oficiais do Grupo Coagro.',
    caption: 'Materiais de identidade',
  },
  CURATOR_QUEUE: {
    label: 'Fila do Curador',
    eyebrow: 'Curadoria central',
    title: 'Fila de homologação',
    description: 'Validação de peças, ortografia e materiais gráficos das unidades.',
    caption: 'Fila de homologação',
  },
};

/**
 * Componente leve de ajuda contextual ao passar o mouse OU focar via teclado (Tab)
 * Mantém a interface limpa para o operador e educa o gerente mesmo sem mouse.
 */
const HelpHint: React.FC<{ text: string }> = ({ text }) => (
  <span
    tabIndex={0}
    role="note"
    aria-label={text}
    title={text}
    className="group relative shrink-0 inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-slate-200/90 hover:bg-emerald-800 focus:bg-emerald-800 focus:outline-none text-slate-600 hover:text-white focus:text-white text-[10px] font-bold cursor-help transition-colors select-none align-middle"
  >
    ?
    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block group-focus:block w-60 p-2.5 rounded-xl bg-slate-900 text-white text-xs font-normal leading-relaxed shadow-xl z-50 text-left normal-case tracking-normal">
      {text}
    </span>
  </span>
);

const readSettingsHash = (): SettingsTab | null => {
  if (typeof window === 'undefined') return null;
  const match = window.location.hash.match(/^#\/configuracoes\/([a-z-]+)/);
  return match && isSettingsTab(match[1]) ? match[1] : null;
};

export default function App() {
  const state = useStudioStore();
  const {
    currentOffer,
    posterConfig,
    socialConfig,
    brandKit,
    activeModule,
    planTier,
    freemiumQuota,
    carouselSlides,
    activeCarouselSlideIndex,
    hrNotice,
  } = state;

  const posterSheetRef = useRef<HTMLDivElement>(null);
  const socialCanvasRef = useRef<HTMLDivElement>(null);
  const smartPasteInputRef = useRef<HTMLInputElement>(null);

  const prefs = useUiPrefs();
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showSkuSuggestions, setShowSkuSuggestions] = useState(false);
  const [view, setView] = useState<'STUDIO' | 'SETTINGS' | 'LANDING'>(() => {
    if (typeof window !== 'undefined' && (window.location.hash === '#/apresentacao' || window.location.hash === '#/site')) {
      return 'LANDING';
    }
    return readSettingsHash() ? 'SETTINGS' : 'STUDIO';
  });
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(
    () => readSettingsHash() ?? 'identidade'
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState('');
  const [smartPasteFeedback, setSmartPasteFeedback] = useState<string | null>(null);
  const [rawUploadedImageUrl, setRawUploadedImageUrl] = useState<string | null>(null);
  const [removeImageBgEnabled, setRemoveImageBgEnabled] = useState(true);
  const [imageDiagnostics, setImageDiagnostics] =
    useState<ProductImageDiagnostics | null>(null);
  const [batchRawInput, setBatchRawInput] = useState(
    '101;RAC TUTTICANIS SEL AD 10.1KG;58.00;44.00\n102;HERBICIDA GLIFOSATO WG 20KG;680.00;549.90\n103;VACINA AFTOSA 50 DOSES;110.00;89.90'
  );

  const workMode = prefs.workMode;
  const [paywallInitialMode, setPaywallInitialMode] =
    useState<'LEAD_CAPTURE' | 'UPGRADE_PAYWALL'>('LEAD_CAPTURE');
  const pendingExportRef = useRef<(() => void) | null>(null);

  const activeTheme =
    activeModule === 'STORE_POSTER' || activeModule === 'HR_NOTICE'
      ? posterConfig.visualTheme
      : socialConfig.visualTheme;
  const spec = resolveRenderSpec(currentOffer, brandKit, activeTheme);
  const { metrics } = spec;

  const governance = evaluateGovernanceTrack({
    module: activeModule,
    userRole: state.userRole,
    offer: currentOffer,
    brandKit,
    customDictionary: state.customAgroDictionary,
  });
  const [curatorFlash, setCuratorFlash] = useState<string | null>(null);

  const activeDept =
    brandKit.departments.find((d) => d.id === brandKit.activeDepartmentId) ||
    brandKit.departments[0];
  const activeCampaign = brandKit.activeCampaignId
    ? brandKit.seasonalCampaigns.find((campaign) => campaign.id === brandKit.activeCampaignId)
    : undefined;

  const profileInitials =
    (brandKit.companyName || SAAS_BRAND.name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'GP';
  const settingsTabLabel =
    SETTINGS_TABS.find((tab) => tab.id === settingsTab)?.label ?? 'Configurações';
  const openUpgrade = () => {
    setPaywallInitialMode('UPGRADE_PAYWALL');
    setShowPaywallModal(true);
  };

  const previewFrame: PreviewFrame =
    activeModule === 'STORE_POSTER'
      ? 'a4'
      : activeModule === 'HR_NOTICE'
        ? hrNotice.outputFormat === 'A4_PRINT'
          ? 'hr-a4'
          : 'hr-social'
        : activeModule === 'CAROUSEL'
          ? 'carousel'
          : socialConfig.aspectRatio === 'STORY_9_16'
            ? 'story'
            : socialConfig.aspectRatio === 'FEED_4_5'
              ? 'feed'
              : 'square';
  const previewStack =
    activeModule === 'STORE_POSTER' && posterConfig.batchMode && state.userRole !== 'OPERATOR';
  const previewLabel =
    activeModule === 'STORE_POSTER'
      ? posterConfig.printGrid === 'A4_FULL'
        ? 'Folha A4'
        : posterConfig.printGrid === 'A5_HALF'
          ? '2 por Folha (A5)'
          : '4 por Folha (Gôndola)'
      : activeModule === 'CAROUSEL'
        ? `Slide ${activeCarouselSlideIndex + 1} de ${carouselSlides.length}`
        : activeModule === 'HR_NOTICE'
          ? hrNotice.outputFormat === 'A4_PRINT'
            ? 'Folha A4'
            : 'Feed Social'
          : socialConfig.aspectRatio === 'STORY_9_16'
            ? 'Story (9:16)'
            : socialConfig.aspectRatio === 'FEED_4_5'
              ? 'Feed (4:5)'
              : 'Quadrado (1:1)';

  // Portão Comercial (Freemium Lock + Cota de Teste + Captura de Lead aos 95%)
  const handleProtectedExport = (exportAction: () => void) => {
    const hasLead =
      Boolean(state.leadProfile?.whatsappOrEmail) ||
      (typeof window !== 'undefined' &&
        Boolean(
          localStorage.getItem('gabarito_lead_profile_v1') ||
          localStorage.getItem('alfa_pulso_lead_contact') ||
          localStorage.getItem('alfa_pulso_lead_email') ||
          localStorage.getItem('alfa_pulso_lead_whatsapp')
        ));

    if (!hasLead && planTier === 'FREE') {
      pendingExportRef.current = exportAction;
      setPaywallInitialMode('LEAD_CAPTURE');
      setShowPaywallModal(true);
      return;
    }

    const allowed = studioActions.consumeExportQuota();
    if (!allowed) {
      pendingExportRef.current = exportAction;
      setPaywallInitialMode('UPGRADE_PAYWALL');
      setShowPaywallModal(true);
      return;
    }

    try {
      studioActions.recordGenerationAudit({
        module: activeModule,
        skuCode: activeModule === 'HR_NOTICE' ? hrNotice.referenceCode : currentOffer.skuCode,
        title:
          activeModule === 'HR_NOTICE'
            ? hrNotice.roleOrSubject
            : currentOffer.cleanedTitle || currentOffer.rawTitle,
        priceTo: activeModule === 'HR_NOTICE' ? undefined : currentOffer.priceToRaw,
        priceFrom: activeModule === 'HR_NOTICE' ? undefined : currentOffer.priceFrom,
        outputFormat:
          activeModule === 'STORE_POSTER' || activeModule === 'HR_NOTICE'
            ? 'A4'
            : socialConfig.aspectRatio,
        theme: posterConfig.visualTheme,
        inputsMetadata: {
          brand: brandKit.companyName,
          branch: brandKit.defaultBranchName,
          activeDepartmentId: brandKit.activeDepartmentId,
        },
      });
    } catch {
      // auditoria offline silenciosa
    }

    exportAction();
  };

  const openSettings = (tab?: SettingsTab) => {
    const nextTab = tab ?? settingsTab;
    setSettingsTab(nextTab);
    setView('SETTINGS');
    setDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#/configuracoes/${nextTab}`);
    }
  };

  const openStudio = (module?: ModuleMode) => {
    if (module) studioActions.setActiveModule(module);
    setView('STUDIO');
    setDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    }
  };

  const changeSettingsTab = (tab: SettingsTab) => {
    setSettingsTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#/configuracoes/${tab}`);
    }
  };

  // Sincronização inicial em nuvem (Supabase / PostgreSQL) com fallback offline
  useEffect(() => {
    void studioActions.syncCloudData();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/apresentacao' || hash === '#/site') {
        setView('LANDING');
        return;
      }
      if (hash === '#/estudio') {
        setView('STUDIO');
        return;
      }
      const tabFromHash = readSettingsHash();
      if (tabFromHash) {
        setSettingsTab(tabFromHash);
        setView('SETTINGS');
      } else if (window.location.hash === '' || window.location.hash === '#') {
        setView('STUDIO');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Atalhos de Teclado Globais (Operação 100% Sem Mouse para Balcão/Caixa)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPaywallModal(false);
        setShowSkuSuggestions(false);
        setDrawerOpen(false);
        setShowHelp(false);
        return;
      }

      if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const modules: ModuleMode[] = [
          'SOCIAL_MEDIA',
          'STORE_POSTER',
          'CAROUSEL',
          'HR_NOTICE',
        ];
        openStudio(modules[Number(e.key) - 1]);
      } else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        openSettings('identidade');
      } else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        openSettings('erp');
      } else if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      } else if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        studioActions.cleanAndEnrichCurrentOffer();
      } else if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        smartPasteInputRef.current?.focus();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        if (
          (activeModule === 'STORE_POSTER' || activeModule === 'HR_NOTICE') &&
          metrics.canExport
        ) {
          e.preventDefault();
          handleProtectedExport(() =>
            printOrSaveA4Sheet(
              posterSheetRef.current,
              `cartaz-a4-${currentOffer.skuCode || 'oferta'}`
            )
          );
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeModule, metrics.canExport, currentOffer.skuCode, planTier, settingsTab]);

  // Upload de Foto com Tight Crop Alfa + Remoção de Fundo Automática + Diagnóstico Instantâneo (#71)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const rawData = reader.result;
        setRawUploadedImageUrl(rawData);
        const cropped = await tightCropAlphaDataUrl(rawData, removeImageBgEnabled);
        studioActions.updateOfferField('imageUrl', cropped);
        const diag = await analyzeProductImageLocal(cropped);
        setImageDiagnostics(diag);
      }
    };
    reader.readAsDataURL(file);
  };

  // Alterna remoção de fundo branco ou mantém fundo original sob demanda sem reenviar arquivo
  const handleToggleImageBgRemoval = async (enableRemoval: boolean) => {
    setRemoveImageBgEnabled(enableRemoval);
    const sourceUrl = rawUploadedImageUrl || currentOffer.imageUrl;
    if (!sourceUrl) return;
    const processed = await tightCropAlphaDataUrl(sourceUrl, enableRemoval);
    studioActions.updateOfferField('imageUrl', processed);
    const diag = await analyzeProductImageLocal(processed);
    setImageDiagnostics(diag);
  };

  // Executa o Smart Paste do WhatsApp (#22)
  const handleRunSmartPaste = async (textToParse?: string) => {
    const raw = textToParse ?? (smartPasteText || smartPasteInputRef.current?.value);
    const target = (raw ?? '').trim();
    if (!target) return;
    const ok = await studioActions.applySmartPaste(target);
    if (ok) {
      setSmartPasteFeedback('✅ Oferta extraída automaticamente!');
      setTimeout(() => setSmartPasteFeedback(null), 3000);
    } else {
      setSmartPasteFeedback('⚠️ Informe ao menos o nome do produto e um preço.');
    }
  };

  return (
    <div
      className={`app-shell${drawerOpen ? ' app-shell--drawer-open' : ''}`}
    >
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo
      </a>

      <Sidebar
        activeModule={activeModule}
        isSettings={view === 'SETTINGS'}
        onSelectModule={(module) => openStudio(module)}
        onOpenSettings={openSettings}
        onOpenHelp={() => setShowHelp(true)}
        onOpenPaywall={openUpgrade}
        onOpenLandingPage={() => setView('LANDING')}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
      />

      {drawerOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fechar menu de navegação"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div className="main-content" id="conteudo-principal">
        <Topbar
          pageLabel={
            view === 'LANDING'
              ? 'Apresentação Comercial'
              : view === 'SETTINGS'
                ? settingsTabLabel
                : MODULE_META[activeModule].label
          }
          isSettings={view === 'SETTINGS'}
          onToggleDrawer={() => setDrawerOpen((prev) => !prev)}
          onOpenHelp={() => setShowHelp(true)}
          onOpenSettings={openSettings}
          initials={profileInitials}
          workMode={workMode}
          onSelectWorkMode={setWorkModePref}
          isLandingPage={view === 'LANDING'}
          onToggleLandingPage={() =>
            setView((v) => (v === 'LANDING' ? 'STUDIO' : 'LANDING'))
          }
        />

        {view === 'LANDING' ? (
          <LandingPage
            onGoToStudio={(exampleText) => {
              if (exampleText) {
                void studioActions.applySmartPaste(exampleText);
              }
              setView('STUDIO');
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onOpenPaywall={openUpgrade}
          />
        ) : view === 'SETTINGS' ? (
          <SettingsCenter
            tab={settingsTab}
            onTabChange={changeSettingsTab}
            onOpenPaywall={openUpgrade}
          />
        ) : activeModule === 'CURATOR_QUEUE' ? (
          <CuratorQueueView />
        ) : activeModule === 'BRAND_HUB' || activeModule === 'CAMPAIGNS' ? (
          <BrandHubView
            key={activeModule}
            initialTab={activeModule === 'CAMPAIGNS' ? 'campaigns' : 'team'}
            campaignsMode={activeModule === 'CAMPAIGNS'}
          />
        ) : activeModule === 'BANNER_FAIXA' || activeModule === 'RADIO_SPOT' ? (
          <SpecialRequestsView mode={activeModule} />
        ) : (
          <div className="page-wrap">
            <section className="studio-section">
              <div className="studio-section-heading">
                <div className="workboard-heading">
                  <div className="eyebrow eyebrow--compact">
                    <span className="eyebrow-line" />
                    {MODULE_META[activeModule].eyebrow}
                  </div>
                  <h1>{MODULE_META[activeModule].label}</h1>
                  <p className="workboard-description">
                    {MODULE_META[activeModule].description}
                  </p>
                </div>
              </div>

              {curatorFlash && (
                <div className="mb-4 p-3.5 rounded-2xl bg-[#004d40] text-white text-xs font-bold flex items-center justify-between shadow-md">
                  <span>{curatorFlash}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCuratorFlash(null);
                        studioActions.setActiveModule('CURATOR_QUEUE');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#ffab00] text-slate-950 font-black cursor-pointer"
                    >
                      Ver na Fila do Curador →
                    </button>
                    <button
                      type="button"
                      onClick={() => setCuratorFlash(null)}
                      className="text-white/80 font-black ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {activeCampaign && (activeModule === 'STORE_POSTER' || activeModule === 'SOCIAL_MEDIA') && (
                <div
                  className="mb-4 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs font-bold"
                  style={{
                    borderColor: `${activeCampaign.accentColorHex}66`,
                    backgroundColor: `${activeCampaign.primaryColorHex}12`,
                    color: activeCampaign.primaryColorHex,
                  }}
                  data-campaign-active={activeCampaign.id}
                >
                  <span>
                    Campanha Ativa: <strong>{activeCampaign.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => studioActions.setActiveCampaign(null)}
                    className="shrink-0 rounded-lg border border-current px-2 py-1 text-[10px] font-black uppercase"
                  >
                    × Desativar
                  </button>
                </div>
              )}

              <div className="studio-grid">
                <div className="editor-stack">
                  {/* CAMADA 1: VISTORIA ORTOGRÁFICA AUTOMÁTICA (DICIONÁRIO CORPORATIVO AGRO) */}
                  {governance.unknownTerms.length > 0 && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-2">
                      <div className="text-xs font-black text-amber-950 flex items-center justify-between">
                        <span>📖 Vistoria Ortográfica Coagro (Camada 1 — Termos fora da Whitelist Agro)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                          Via Amarela Ativada
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900">
                        Verifique a grafia ou homologue o termo caso seja um novo produto/cultivar oficial:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {governance.unknownTerms.map((term) => (
                          <span
                            key={term}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-bold text-amber-950"
                          >
                            “{term}”
                            {state.userRole === 'CURATOR_ADMIN' && (
                              <button
                                type="button"
                                onClick={() =>
                                  studioActions.addAgroDictionaryTerm(term, 'COMMERCIAL_LINE')
                                }
                                className="px-1.5 py-0.5 rounded bg-[#004d40] text-[#ffab00] text-[10px] font-black cursor-pointer"
                              >
                                + Homologar
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

          {/* BARRA SMART PASTE DO WHATSAPP — apenas módulos comerciais */}
          {['STORE_POSTER', 'SOCIAL_MEDIA', 'CAROUSEL'].includes(activeModule) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="smart-paste-input"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                <span>Cole o texto da oferta recebido via WhatsApp</span>
                <HelpHint text="Exemplo: 'Ração 10.1kg de 58 por 44 só hoje'. O sistema identifica automaticamente produto, peso, preço e condição comercial." />
              </label>
              {smartPasteFeedback && (
                <span className="text-xs font-semibold text-emerald-700">
                  {smartPasteFeedback}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                id="smart-paste-input"
                ref={smartPasteInputRef}
                type="text"
                placeholder="Ex: Ração Tutticanis 10.1kg de 58,00 por 44,00 só hoje"
                value={smartPasteText}
                onChange={(e) => setSmartPasteText(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData?.getData('text');
                  if (pasted && pasted.trim().length > 5) {
                    setTimeout(() => handleRunSmartPaste(pasted), 50);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunSmartPaste();
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-900"
              />
              <button
                type="button"
                onClick={() => handleRunSmartPaste()}
                title="Extrair dados automaticamente da frase colada"
                className="btn btn-primary shrink-0"
              >
                Preencher
              </button>
            </div>

            {/* Exemplo Rápido Clicável */}
            {!smartPasteText && (
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'Ração Premier Formula Adulto 15kg de R$ 269,90 por R$ 219,90';
                    setSmartPasteText(sample);
                    handleRunSmartPaste(sample);
                  }}
                  className="text-xs font-semibold text-slate-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Testar com texto de exemplo
                </button>
              </div>
            )}
          </div>
          )}

          {state.userRole !== 'OPERATOR' && activeModule === 'STORE_POSTER' && (
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/80 grid grid-cols-2 gap-1 mb-1">
              <button
                type="button"
                onClick={() => studioActions.setPosterBatchMode(false)}
                title="Criar ou ajustar 1 produto por vez com controle completo de mecânica promocional"
                className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  !posterConfig.batchMode
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Individual (Manual)
              </button>
              <button
                type="button"
                onClick={() => {
                  studioActions.setPosterBatchMode(true);
                  studioActions.parseBatchInput(batchRawInput);
                }}
                title="Cole várias linhas copiadas do Excel ou ERP para gerar dezenas de cartazes paginados de uma vez"
                className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  posterConfig.batchMode
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Lote Auditável (ERP / CSV)
              </button>
            </div>
          )}

          {/* MODO LOTE DEDICADO: O FORMULÁRIO MANUAL SOME COMPLETAMENTE */}
          {activeModule === 'STORE_POSTER' && posterConfig.batchMode && state.userRole !== 'OPERATOR' ? (
            <div
              data-batch-total={state.parsedBatchRows.length}
              data-batch-valid={state.parsedBatchRows.filter((r) => r.status === 'VALID').length}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight flex items-center">
                    Lote Auditável (ERP / CSV)
                    <HelpHint text="Cole colunas separadas por ponto-e-vírgula (;), tabulação (Excel) ou barra (|). Itens com erro de preço são bloqueados automaticamente." />
                  </h2>
                  <p className="text-xs text-slate-500">
                    Importação em massa com conformidade e paginação automática
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black">
                    {state.parsedBatchRows.filter((r) => r.status === 'VALID').length} Válidos
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono">
                    Total: {state.parsedBatchRows.length}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Planilha do ERP (Código;Produto;DE;POR)
                  </label>
                  <button
                    type="button"
                    onClick={() => studioActions.parseBatchInput(batchRawInput)}
                    className="text-xs font-extrabold text-slate-700 hover:underline"
                  >
                    🔄 Processar Lote
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={batchRawInput}
                  onChange={(e) => {
                    setBatchRawInput(e.target.value);
                    studioActions.parseBatchInput(e.target.value);
                  }}
                  placeholder="101;Ração Cães 15kg;120.00;99.90&#10;102;Adubo NPK 25kg;85.00;69.90"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {state.parsedBatchRows.map((row) => (
                  <div
                    key={row.rowNumber}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900">
                        [{row.skuCode}] {row.cleanedTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {row.priceFrom ? `De R$ ${row.priceFrom.toFixed(2)} ` : ''}
                        Por R$ {row.priceTo.toFixed(2)} ({row.discountPct}% OFF)
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        row.status === 'VALID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  handleProtectedExport(() =>
                    printOrSaveA4Sheet(
                      posterSheetRef.current,
                      `lote-impressao-${Date.now()}`
                    )
                  )
                }
                className="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
              >
                <span>🖨️</span> IMPRIMIR TODAS AS FOLHAS DO LOTE
              </button>
            </div>
          ) : activeModule === 'CAROUSEL' ? (
            /* MÓDULO 3: EDITOR DE CARROSSEL GUIADO DE OFERTAS E CONTEÚDO (FASE 2) */
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                    🎠 Construtor de Carrossel Guiado (4:5)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sequência pronta de alta conversão: Capa + Produtos ERP + CTA WhatsApp
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => studioActions.generateCarouselFromCatalog(3)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wide shadow-2xs"
                >
                  ⚡ Gerar da Base ERP
                </button>
              </div>

              {/* Abas de seleção dos slides */}
              <div className="flex flex-wrap items-center gap-1.5">
                {carouselSlides.map((sl, idx) => {
                  const isActive = idx === activeCarouselSlideIndex;
                  return (
                    <button
                      key={sl.id}
                      type="button"
                      onClick={() => studioActions.setActiveCarouselSlide(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Slide {idx + 1} (
                      {sl.slideType === 'HOOK_COVER'
                        ? 'Capa'
                        : sl.slideType === 'FINAL_CTA'
                          ? 'CTA'
                          : 'Oferta'}
                      )
                    </button>
                  );
                })}
                {carouselSlides.length < 8 && (
                  <button
                    type="button"
                    onClick={() => studioActions.addCarouselSlide('PRODUCT_OR_CONTENT')}
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold border border-dashed border-slate-400 text-slate-700 bg-slate-50 hover:bg-slate-100"
                  >
                    + Slide
                  </button>
                )}
              </div>

              {/* Editor do Slide Ativo */}
              {(() => {
                const currentSlide =
                  carouselSlides[activeCarouselSlideIndex] || carouselSlides[0];
                if (!currentSlide) return null;
                return (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Função do Slide
                        </label>
                        <select
                          value={currentSlide.slideType}
                          onChange={(e) =>
                            studioActions.updateCarouselSlide(currentSlide.id, {
                              slideType: e.target.value as
                                | 'HOOK_COVER'
                                | 'PRODUCT_OR_CONTENT'
                                | 'FINAL_CTA',
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-900"
                        >
                          <option value="HOOK_COVER">1. Capa / Gancho de Atenção</option>
                          <option value="PRODUCT_OR_CONTENT">
                            2. Produto / Oferta / Conteúdo
                          </option>
                          <option value="FINAL_CTA">
                            3. Chamada Final (WhatsApp / Endereço)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Código / SKU no Slide (Core)
                        </label>
                        <input
                          type="text"
                          value={currentSlide.linkedSkuCode || currentOffer.skuCode || ''}
                          onChange={(e) =>
                            studioActions.updateCarouselSlide(currentSlide.id, {
                              linkedSkuCode: e.target.value,
                            })
                          }
                          placeholder="Ex: 101, CAPA-01..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                        Título Principal do Slide
                      </label>
                      <input
                        type="text"
                        maxLength={56}
                        value={currentSlide.headline}
                        onChange={(e) =>
                          studioActions.updateCarouselSlide(currentSlide.id, {
                            headline: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-extrabold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                        Texto Complementar / Condição
                      </label>
                      <textarea
                        rows={2}
                        value={currentSlide.bodyText}
                        onChange={(e) =>
                          studioActions.updateCarouselSlide(currentSlide.id, {
                            bodyText: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800"
                      />
                    </div>

                    {carouselSlides.length > 2 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => studioActions.removeCarouselSlide(currentSlide.id)}
                          className="text-xs font-extrabold text-red-600 hover:underline"
                        >
                          🗑️ Remover este slide
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : activeModule === 'HR_NOTICE' ? (
            /* MÓDULO 4: EDITOR DE RH, VAGAS & COMUNICADOS INTERNOS (FASE 3) */
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                    📢 RH, Vagas & Comunicados Internos
                  </h2>
                  <p className="text-xs text-slate-500">
                    Padrão Oficial de Comunicação Interna — Nossas Unidades
                  </p>
                </div>
              </div>

              {/* Seletor de Finalidade / Canal (Sprint D) */}
              <div>
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Finalidade / Canal:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {[
                    {
                      id: 'MURAL_A4' as const,
                      label: '🏢 Mural Físico de Loja',
                      sub: 'Formato A4 (opção P&B ou Colorido)',
                      format: 'A4_PRINT' as const,
                    },
                    {
                      id: 'SOCIAL_INTERNAL' as const,
                      label: '📱 Card Rede Social / Zap',
                      sub: 'Formato Feed 4:5 (Colorido Oficial)',
                      format: 'SOCIAL_FEED' as const,
                    },
                    {
                      id: 'BOARD_FORMAL' as const,
                      label: '🏛️ Comunicado da Diretoria',
                      sub: 'Formato A4 Formal (Colorido Oficial)',
                      format: 'A4_PRINT' as const,
                    },
                  ].map((ch) => {
                    const isSelected = (hrNotice.channel || 'MURAL_A4') === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          studioActions.updateHrNotice({
                            channel: ch.id,
                            outputFormat: ch.format,
                          });
                          if (ch.id !== 'MURAL_A4') {
                            studioActions.setPosterVisualTheme('BRAND_PRIMARY');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">{ch.label}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {ch.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presets Rápidos de RH e Avisos */}
              <div>
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Modelo de Comunicado:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      {
                        id: 'JOB_VACANCY',
                        label: '💼 Vagas & Recrutamento',
                        sub: 'Estamos Contratando',
                      },
                      {
                        id: 'INTERNAL_NOTICE',
                        label: '⏰ Aviso de Horário',
                        sub: 'Horário & Expediente',
                      },
                      {
                        id: 'HOLIDAY_CLOSURE',
                        label: '🛑 Loja Fechada / Feriado',
                        sub: 'Aviso aos Clientes',
                      },
                      {
                        id: 'SAFETY_COMPLIANCE',
                        label: '🦺 Segurança e EPI',
                        sub: 'Depósito & Prevenção',
                      },
                    ] as { id: HrNoticeArchetype; label: string; sub: string }[]
                  ).map((item) => {
                    const isSelected = hrNotice.archetype === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => studioActions.applyHrPreset(item.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">{item.label}</div>
                        <div
                          className={`text-[11px] ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {item.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className={`grid grid-cols-1 ${
                  isControlVisible(prefs, 'HR_NOTICE', 'hrReference')
                    ? 'sm:grid-cols-3'
                    : 'sm:grid-cols-2'
                } gap-3`}
              >
                {isControlVisible(prefs, 'HR_NOTICE', 'hrReference') && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Cód. Referência
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: RH-01"
                      value={hrNotice.referenceCode}
                      maxLength={14}
                      onChange={(e) =>
                        studioActions.updateHrNotice({ referenceCode: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Chamada de Topo
                  </label>
                  <input
                    type="text"
                    placeholder={
                      hrNotice.archetype === 'JOB_VACANCY'
                        ? 'Ex: ESTAMOS CONTRATANDO'
                        : hrNotice.archetype === 'HOLIDAY_CLOSURE'
                          ? 'Ex: COMUNICADO DE FERIADO'
                          : hrNotice.archetype === 'SAFETY_COMPLIANCE'
                            ? 'Ex: USO OBRIGATÓRIO DE EPI'
                            : 'Ex: COMUNICADO OFICIAL'
                     }
                     value={hrNotice.headline}
                     maxLength={64}
                     onChange={(e) =>
                      studioActions.updateHrNotice({ headline: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold uppercase text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  {hrNotice.archetype === 'JOB_VACANCY'
                    ? 'Cargo / Função em Aberto'
                    : 'Assunto Principal'}
                </label>
                <input
                  type="text"
                  placeholder={
                    hrNotice.archetype === 'JOB_VACANCY'
                      ? 'Ex: Consultor(a) / Venda de Balcão'
                      : hrNotice.archetype === 'HOLIDAY_CLOSURE'
                        ? 'Ex: Recesso de Carnaval'
                        : 'Ex: Manutenção Preventiva'
                   }
                   value={hrNotice.roleOrSubject}
                   maxLength={58}
                   onChange={(e) =>
                    studioActions.updateHrNotice({ roleOrSubject: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-extrabold text-slate-900"
                />
              </div>

              <div
                className={`grid grid-cols-1 ${
                  isControlVisible(prefs, 'HR_NOTICE', 'hrCompensation')
                    ? 'sm:grid-cols-2'
                    : ''
                } gap-3`}
              >
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    {hrNotice.archetype === 'JOB_VACANCY'
                      ? 'Modalidade / Local'
                      : 'Local / Horário / Setor'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      hrNotice.archetype === 'JOB_VACANCY'
                        ? 'Ex: Presencial'
                        : hrNotice.archetype === 'HOLIDAY_CLOSURE'
                          ? 'Ex: Retorno na segunda-feira às 07:30'
                          : 'Ex: Segunda a Sexta das 08h às 18h'
                     }
                     value={hrNotice.scheduleOrLocation}
                     maxLength={72}
                     onChange={(e) =>
                      studioActions.updateHrNotice({
                        scheduleOrLocation: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>
                {isControlVisible(prefs, 'HR_NOTICE', 'hrCompensation') && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      {hrNotice.archetype === 'JOB_VACANCY'
                        ? 'Remuneração / Benefícios'
                        : 'Destaque / Observação'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        hrNotice.archetype === 'JOB_VACANCY'
                          ? 'Ex: Salário fixo + Vale Alimentação'
                          : 'Ex: Plantão telefônico no ramal 101'
                      }
                      value={hrNotice.compensationOrHighlight}
                      maxLength={72}
                      onChange={(e) =>
                        studioActions.updateHrNotice({
                          compensationOrHighlight: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                )}
              </div>

              {isControlVisible(prefs, 'HR_NOTICE', 'hrRequirements') && (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    {hrNotice.archetype === 'JOB_VACANCY'
                      ? 'Requisitos da Vaga (1 por linha)'
                      : 'Orientações ou Informações (1 por linha)'}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    placeholder={
                      hrNotice.archetype === 'JOB_VACANCY'
                        ? 'Ex: Ensino Médio Completo\nExperiência com vendas de balcão\nBoa comunicação e pontualidade'
                        : 'Ex: Atendimento via WhatsApp suspenso no feriado\nRetorno com promoções especiais'
                    }
                    value={hrNotice.requirementsOrPoints.join('\n')}
                    onChange={(e) =>
                      studioActions.updateHrNotice({
                        requirementsOrPoints: e.target.value
                          .split('\n')
                          .filter((l) => l.trim().length > 0),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800"
                  />
                </div>
              )}

              <div
                className={`grid grid-cols-1 ${
                  isControlVisible(prefs, 'HR_NOTICE', 'hrContact')
                    ? 'sm:grid-cols-2'
                    : ''
                } gap-3`}
              >
                {isControlVisible(prefs, 'HR_NOTICE', 'hrContact') && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Canal de Contato / Envio de Currículo
                    </label>
                    <input
                      type="text"
                      placeholder={
                        hrNotice.archetype === 'JOB_VACANCY'
                          ? 'Ex: Envie currículo para rh@empresa.com.br'
                          : 'Ex: WhatsApp comercial: (00) 00000-0000'
                      }
                      value={hrNotice.contactChannel}
                      maxLength={96}
                      onChange={(e) =>
                        studioActions.updateHrNotice({ contactChannel: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Formato de Saída
                  </label>
                  <select
                    value={hrNotice.outputFormat}
                    onChange={(e) =>
                      studioActions.updateHrNotice({
                        outputFormat: e.target.value as 'A4_PRINT' | 'SOCIAL_FEED',
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-900"
                  >
                    <option value="A4_PRINT">🖨️ Cartaz Mural A4 (Impressão)</option>
                    <option value="SOCIAL_FEED">📱 Card Redes Sociais (Feed 4:5)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* FORMULÁRIO INDIVIDUAL COM FLUXO ERGONÔMICO DE 10 SEGUNDOS */
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
              <div className="editor-header">
                <div className="editor-header-copy">
                  <span>
                    Dados da oferta · ID {metrics.forensicId}
                    <HelpHint text="Código único gerado a partir do produto, preço e validade para auditoria contra divergência de gôndola." />
                  </span>
                  <h2>
                    {activeModule === 'STORE_POSTER'
                      ? 'Informações do cartaz'
                      : 'Criar anúncio'}
                  </h2>
                </div>

                <span
                  title="Índice de conformidade comercial e regulatória (100/100 indica zero riscos detectados)"
                  className={`score-pill${metrics.canExport ? '' : ' score-pill--blocked'}`}
                >
                  Score {metrics.governanceScore}/100
                </span>
              </div>

              {/* 1. MECÂNICA COMERCIAL (NO TOPO CONFORME HIERARQUIA SOLICITADA) */}
              {state.userRole === 'OPERATOR' ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">🛒 Modo Balcão:</span>
                    <span className="font-medium text-slate-600">Preço Direto / Cartaz Rápido em 10s</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                    Via Verde (Sem Fila)
                  </span>
                </div>
              ) : (
                <div>
                  <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    <span>Mecânica Comercial</span>
                    <HelpHint text="Escolha o formato da promoção ou condição. Ao selecionar Parcelado ou Compre & Ganhe, o cartaz ajusta automaticamente o layout ideal." />
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    (workMode === 'OPERATOR'
                      ? [
                          {
                            id: 'SIMPLE_DE_POR',
                            label: 'Preço Direto',
                            tip: 'Promoção tradicional DE/POR ou Preço Especial Único.',
                          },
                          {
                            id: 'INSTALLMENT_FINANCING',
                            label: `Parcelado ${currentOffer.installmentCount ?? 6}x`,
                            tip: 'Ideal para maquinários, ferramentas e equipamentos (ex: 10x sem juros com preço à vista obrigatório pelo CDC).',
                          },
                          {
                            id: 'BUY_WIN_GIFT',
                            label: 'Compre & Ganhe',
                            tip: 'Destaca uma condição especial ou brinde (ex: Compre 1 Ganhe Balde, Compre 2 pelo Preço de 1).',
                          },
                          {
                            id: 'TAKE_X_PAY_Y',
                            label: `Leve ${currentOffer.takeQty} Pague ${currentOffer.payQty}`,
                            tip: 'Calcula automaticamente quanto sai cada unidade e o preço diluído por KG/Litro (Decreto 5.903).',
                          },
                        ]
                      : [
                          {
                            id: 'SIMPLE_DE_POR',
                            label: 'Preço Direto',
                            tip: 'Promoção tradicional DE/POR ou Preço Especial Único.',
                          },
                          {
                            id: 'INSTALLMENT_FINANCING',
                            label: `Parcelado ${currentOffer.installmentCount ?? 6}x`,
                            tip: 'Ideal para maquinários, ferramentas e equipamentos (ex: 10x sem juros com preço à vista obrigatório pelo CDC).',
                          },
                          {
                            id: 'BUY_WIN_GIFT',
                            label: 'Compre & Ganhe',
                            tip: 'Destaca uma condição especial ou brinde (ex: Compre 1 Ganhe Balde, Compre 2 pelo Preço de 1).',
                          },
                          {
                            id: 'TAKE_X_PAY_Y',
                            label: `Leve ${currentOffer.takeQty} Pague ${currentOffer.payQty}`,
                            tip: 'Calcula automaticamente quanto sai cada unidade e o preço diluído por KG/Litro (Decreto 5.903).',
                          },
                          {
                            id: 'SECOND_UNIT_50',
                            label: `2ª Un. -${currentOffer.secondUnitDiscountPercent ?? 50}%`,
                            tip: 'Aplica desconto percentual na segunda unidade e exibe o valor médio levando 2.',
                          },
                          {
                            id: 'WHOLESALE_VOLUME',
                            label: 'Atacado / Safra',
                            tip: 'Preço reduzido a partir de uma quantidade mínima de sacas, caixas ou unidades.',
                          },
                          {
                            id: 'TURBO_EXPIRY',
                            label: 'Validade Turbo',
                            tip: 'Queima de estoque próximo ao vencimento com desconto escalonado automático e selo PROCON.',
                          },
                          {
                            id: 'LOYALTY_CLUB',
                            label: 'Clube / CPF',
                            tip: 'Destaca preço exclusivo para clientes cadastrados no clube da loja.',
                          },
                        ]
                    ) as { id: CommercialMechanicType; label: string; tip: string }[]
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      title={m.tip}
                      onClick={() => studioActions.setMechanicType(m.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        currentOffer.mechanicType === m.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Sub-inputs de Mecânicas */}
                {currentOffer.mechanicType === 'INSTALLMENT_FINANCING' && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        Parcelamento sem juros (Maquinário / Investimento):
                      </span>
                      <span className="text-[11px] font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {metrics.installmentCount}x de R$ {metrics.installmentIntegerPart},
                        {metrics.installmentCentsPart}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[2, 3, 4, 6, 10, 12].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => studioActions.setInstallmentCount(n)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all ${
                            (currentOffer.installmentCount ?? 6) === n
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {n}x
                        </button>
                      ))}
                      <input
                        type="number"
                        min={2}
                        max={24}
                        value={currentOffer.installmentCount ?? 6}
                        onChange={(e) =>
                          studioActions.setInstallmentCount(Number(e.target.value) || 6)
                        }
                        title="Número de parcelas (2x a 24x)"
                        className="w-16 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 text-right ml-auto"
                      />
                    </div>
                  </div>
                )}

                {currentOffer.mechanicType === 'BUY_WIN_GIFT' && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-[11px] font-extrabold uppercase text-slate-900">
                      Chamada da Condição / Brinde em Destaque:
                    </label>
                    <input
                      type="text"
                      maxLength={44}
                      value={currentOffer.giftOrConditionText || ''}
                      onChange={(e) => studioActions.setGiftOrConditionText(e.target.value)}
                      placeholder="Ex: COMPRE 1 E GANHE BALDE DOSADOR"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold uppercase text-slate-900"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[
                        'COMPRE 1 E GANHE BALDE DOSADOR',
                        'COMPRE 2 PELO PREÇO DE 1',
                        'NA COMPRA DE 5 SACOS GANHE BRINDE',
                        'FRETE GRÁTIS PARA TODA A REGIÃO',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => studioActions.setGiftOrConditionText(preset)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentOffer.mechanicType === 'TAKE_X_PAY_Y' && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-slate-900 mb-1">
                        Leve (Qtd)
                      </label>
                      <input
                        type="number"
                        min={2}
                        value={currentOffer.takeQty}
                        onChange={(e) =>
                          studioActions.updateOfferField(
                            'takeQty',
                            Math.max(2, Number(e.target.value) || 2)
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-slate-900 mb-1">
                        Pague (Qtd)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={currentOffer.payQty}
                        onChange={(e) =>
                          studioActions.updateOfferField(
                            'payQty',
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {currentOffer.mechanicType === 'SECOND_UNIT_50' && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <span className="text-xs font-extrabold text-slate-900">
                      Desconto na 2ª unidade (%):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={5}
                        max={95}
                        step={5}
                        value={currentOffer.secondUnitDiscountPercent ?? 50}
                        onChange={(e) =>
                          studioActions.setSecondUnitDiscountPercent(
                            Math.min(95, Math.max(5, Number(e.target.value) || 50))
                          )
                        }
                        className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 text-right"
                      />
                      <span className="text-xs font-bold text-slate-600">% OFF</span>
                    </div>
                  </div>
                )}

                {currentOffer.mechanicType === 'WHOLESALE_VOLUME' && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <span className="text-xs font-extrabold text-slate-900">
                      Quantidade mínima ({currentOffer.unit}):
                    </span>
                    <input
                      type="number"
                      min={2}
                      value={currentOffer.minWholesaleQty}
                      onChange={(e) =>
                        studioActions.updateOfferField(
                          'minWholesaleQty',
                          Math.max(2, Number(e.target.value) || 2)
                        )
                      }
                      className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 text-right"
                    />
                  </div>
                )}

                {currentOffer.mechanicType === 'TURBO_EXPIRY' && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-amber-900">
                      Vence em quantos dias?
                    </span>
                    <div className="flex gap-1">
                      {[1, 3, 7, 15].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => studioActions.setTurboExpiryDays(d)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                            currentOffer.nearExpiryDaysLeft === d
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-amber-900 border-amber-300'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* 2. IDENTIFICAÇÃO DO PRODUTO & BUSCA SILENCIOSA ERP */}
              <div className="space-y-3.5 pt-2 border-t border-slate-100">
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <span>CÓDIGO DO PRODUTO (SKU / EAN)</span>
                      <HelpHint text="Informe o código do produto. Se houver catálogo ERP importado em Configurações, os dados são preenchidos automaticamente em segundo plano; caso contrário, o código digitado é gravado diretamente na arte." />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: 101, 201, 789..."
                    value={currentOffer.skuCode}
                    onFocus={() => setShowSkuSuggestions(true)}
                    onBlur={() => {
                      const trimmed = currentOffer.skuCode.trim();
                      if (trimmed) {
                        studioActions.lookupAndApplyErpSku(trimmed);
                      }
                      setTimeout(() => setShowSkuSuggestions(false), 180);
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      studioActions.updateOfferField('skuCode', val);
                      const normalized = val.trim().toLowerCase();
                      if (
                        normalized.length >= 2 &&
                        (state.customCatalogDb.some(
                          (r) =>
                            r.skuCode.toLowerCase() === normalized ||
                            (r.eanBarcode && r.eanBarcode.toLowerCase() === normalized)
                        ) ||
                          state.parsedBatchRows.some(
                            (r) => r.skuCode.toLowerCase() === normalized
                          ))
                      ) {
                        studioActions.lookupAndApplyErpSku(val.trim());
                      }
                      setShowSkuSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        studioActions.lookupAndApplyErpSku(currentOffer.skuCode);
                        setShowSkuSuggestions(false);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900"
                  />

                  {/* Dropdown de Autocomplete da Base ERP */}
                  {showSkuSuggestions && currentOffer.skuCode.trim().length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchErpCatalog(
                        currentOffer.skuCode,
                        state.customCatalogDb,
                        state.parsedBatchRows,
                        6
                      ).map((rec) => (
                        <button
                          key={rec.skuCode}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            studioActions.applyCatalogRecord(rec);
                            setShowSkuSuggestions(false);
                          }}
                          className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/70 flex items-center justify-between gap-2 text-xs transition-colors"
                        >
                          <div className="min-w-0 truncate">
                            <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-800 text-white mr-2">
                              #{rec.skuCode}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {rec.cleanedTitle}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-900 shrink-0">
                            R$ {rec.priceTo.toFixed(2).replace('.', ',')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <span>
                        {activeModule === 'STORE_POSTER'
                          ? 'NOME DO PRODUTO'
                          : 'TÍTULO DA ARTE'}
                      </span>
                      <HelpHint text="Digite o nome do produto. Ao sair do campo, siglas de ERP (ex: RAC -> Ração) são padronizadas automaticamente." />
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        title="Limite ideal de 48 caracteres para leitura imediata a 2 metros de distância"
                        className={`text-xs font-mono font-semibold ${
                          (currentOffer.rawTitle?.length || 0) >= 42
                            ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {currentOffer.rawTitle?.length || 0}/48
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    maxLength={48}
                    placeholder="Ex: Ração Premier Formula 15kg"
                    value={currentOffer.rawTitle}
                    onChange={(e) => studioActions.setProductTitleInput(e.target.value)}
                    onBlur={() => {
                      if (currentOffer.rawTitle?.trim()) {
                        studioActions.cleanAndEnrichCurrentOffer();
                      }
                    }}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm font-bold text-slate-900 transition-all ${
                      (currentOffer.rawTitle?.length || 0) >= 42
                        ? 'border-amber-400 bg-amber-50/20 focus:border-amber-500'
                        : 'border-slate-200 bg-white focus:border-emerald-600'
                    }`}
                  />
                  {currentOffer.cleanedTitle &&
                    currentOffer.cleanedTitle !== currentOffer.rawTitle && (
                      <p className="mt-1 text-xs font-medium text-emerald-700 flex items-center justify-between">
                        <span>
                          Exibindo na arte: <strong>{currentOffer.cleanedTitle}</strong>
                        </span>
                      </p>
                    )}
                  {(currentOffer.rawTitle?.length || 0) >= 42 && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      ⚠ Título próximo ao limite recomendado para leitura à distância.
                    </p>
                  )}
                </div>

                {/* SUBTÍTULO VISÍVEL TANTO EM CARTAZES QUANTO REDES SOCIAIS (BUG-VIS-02 RESOLVIDO) */}
                {(activeModule !== 'STORE_POSTER' ||
                  isControlVisible(prefs, 'STORE_POSTER', 'posterSubtitle')) && (
                  <div>
                    <label className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      <span>SUBTÍTULO / LINHA DE APOIO</span>
                      <HelpHint text="Frase curta complementar exibida abaixo do título principal tanto no cartaz quanto nas redes sociais." />
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Nutrição balanceada de alta absorção"
                      value={currentOffer.subtitle}
                      onChange={(e) =>
                        studioActions.updateOfferField('subtitle', e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800"
                    />
                  </div>
                )}

                {activeModule === 'SOCIAL_MEDIA' && (
                  <>
                    {isControlVisible(prefs, 'SOCIAL_MEDIA', 'socialImage') && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                          <span>FOTO DO PRODUTO</span>
                          <HelpHint text="Envie foto JPG ou PNG. O recorte e a remoção de fundo branco são aplicados automaticamente no navegador." />
                        </label>
                        {currentOffer.imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              studioActions.updateOfferField('imageUrl', undefined);
                              setRawUploadedImageUrl(null);
                              setImageDiagnostics(null);
                            }}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Remover foto
                          </button>
                        )}
                      </div>
                      <label className="w-full border border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/60 transition-colors">
                        {currentOffer.imageUrl ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={currentOffer.imageUrl}
                              alt="Preview"
                              className="h-20 object-contain mb-2 drop-shadow-md"
                            />
                            <span className="text-xs font-semibold text-emerald-800">
                              Trocar imagem do produto
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-slate-600">
                            Clique para enviar a foto (PNG ou JPG)
                          </span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Painel de Diagnóstico Instantâneo da Imagem + Controle de Recorte de Fundo */}
                      {currentOffer.imageUrl && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            {imageDiagnostics && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: imageDiagnostics.dominantHex }}
                                title={`Cor dominante detectada na embalagem: ${imageDiagnostics.dominantHex}`}
                              />
                            )}
                            <span
                              className={`font-semibold truncate ${
                                imageDiagnostics?.qualityLabel === 'LOW_RES_WARN'
                                  ? 'text-amber-700'
                                  : 'text-emerald-800'
                              }`}
                            >
                              {imageDiagnostics
                                ? `✓ ${imageDiagnostics.summaryText}`
                                : '✓ Recorte inteligente aplicado'}
                            </span>
                          </div>

                          {rawUploadedImageUrl && (
                            <label
                              title="Se a embalagem do produto for 100% branca sem borda e você preferir manter o quadro original, desmarque esta opção"
                              className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-200"
                            >
                              <input
                                type="checkbox"
                                checked={removeImageBgEnabled}
                                onChange={(e) =>
                                  handleToggleImageBgRemoval(e.target.checked)
                                }
                                className="w-3.5 h-3.5 accent-emerald-800 rounded"
                              />
                              <span>Remover fundo claro</span>
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                    )}

                    {isControlVisible(prefs, 'SOCIAL_MEDIA', 'socialBullets') && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={socialConfig.showBullets}
                            onChange={(e) =>
                              studioActions.toggleSocialBullets(e.target.checked)
                            }
                            className="w-4 h-4 accent-emerald-800 rounded"
                          />
                          <span>DIFERENCIAIS (OPCIONAL)</span>
                          <HelpHint text="Lista até 3 benefícios rápidos do produto no card de rede social." />
                        </label>
                        <button
                          type="button"
                          onClick={() => studioActions.addBullet()}
                          className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          + Adicionar
                        </button>
                      </div>
                      <div className="space-y-2">
                        {currentOffer.bullets.map((b) => (
                          <div key={b.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={b.text}
                              onChange={(e) =>
                                studioActions.updateBullet(b.id, e.target.value)
                              }
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => studioActions.removeBullet(b.id)}
                              className="p-2 text-slate-400 hover:text-red-600"
                              title="Remover"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {isControlVisible(prefs, 'SOCIAL_MEDIA', 'socialCta') && (
                    <div>
                      <label className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        <span>CHAMADA PARA AÇÃO (CTA)</span>
                      </label>
                      <input
                        type="text"
                        value={currentOffer.ctaText}
                        onChange={(e) =>
                          studioActions.updateOfferField('ctaText', e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800"
                      />
                      <details className="cta-accordion">
                        <summary>Mais opções de CTA</summary>
                        <div className="cta-accordion-body">
                          {[
                            'GARANTA JÁ O SEU!',
                            'PEÇA NO WHATSAPP',
                            'RETIRADA IMEDIATA NA LOJA',
                            'CONSULTE NOSSO TIME TÉCNICO',
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() =>
                                studioActions.updateOfferField('ctaText', chip)
                              }
                              className="cta-option-btn"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </details>
                    </div>
                    )}
                  </>
                )}
              </div>

            {/* PREÇOS DE / POR */}
            <div
              className={`grid ${
                isControlVisible(prefs, 'STORE_POSTER', 'posterPriceFrom')
                  ? 'grid-cols-2'
                  : 'grid-cols-1'
              } gap-3 pt-1`}
            >
              {isControlVisible(prefs, 'STORE_POSTER', 'posterPriceFrom') && (
                <div>
                  <label className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    <span>DE (R$)</span>
                    <HelpHint text="Preço antigo de referência (opcional). Se preenchido, precisa ser maior que o preço POR para evitar autuação do PROCON." />
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={currentOffer.priceFrom || ''}
                    placeholder="Opcional"
                    onChange={(e) =>
                      studioActions.updateOfferField(
                        'priceFrom',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-500 line-through"
                  />
                </div>
              )}

              <div>
                <label className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1">
                  <span>POR (R$)</span>
                  <HelpHint text="Preço promocional de venda. O sistema separa automaticamente reais e centavos e calcula o valor por Quilo/Litro." />
                </label>
                <input
                  type="number"
                  step="0.10"
                  placeholder="0,00"
                  value={currentOffer.priceToRaw || ''}
                  onChange={(e) =>
                    studioActions.updateOfferField(
                      'priceToRaw',
                      e.target.value === '' ? 0 : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-4 py-3 text-lg font-extrabold text-amber-900"
                />
              </div>
            </div>

            {state.userRole !== 'OPERATOR' && (
              <div className="settings-grid pt-2 border-t border-slate-100">
                <div className="settings-field">
                  <label>
                    Vigência da oferta <span>· PROCON</span>
                  </label>
                  <select
                    value={currentOffer.validityPreset}
                    onChange={(e) =>
                      studioActions.setValidityPreset(e.target.value as ValidityPreset)
                    }
                  >
                    <option value="TODAY_ONLY">Só hoje</option>
                    <option value="END_OF_WEEK">Até sábado</option>
                    <option value="WEEKEND">Fim de semana</option>
                    <option value="END_OF_MONTH">Fim do mês</option>
                    <option value="CUSTOM_DATE">Data fixa</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label>
                    Arredondamento <span>· teto DE</span>
                  </label>
                  <select
                    value={currentOffer.roundingStrategy}
                    onChange={(e) =>
                      studioActions.setRoundingStrategy(e.target.value as RoundingStrategy)
                    }
                  >
                    <option value="NONE">Exato</option>
                    <option value="PSYCH_90">Final ,90</option>
                    <option value="PSYCH_99">Final ,99</option>
                    <option value="INTEGER_DOWN">Inteiro ↓</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label>
                    Preço de custo (R$) <span>· anti-prejuízo</span>
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    placeholder="Opcional (ex: 38,00)"
                    value={currentOffer.costPrice || ''}
                    onChange={(e) =>
                      studioActions.updateOfferField(
                        'costPrice',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>

                <div className="settings-field">
                  <label>
                    Categoria regulatória <span>· MAPA / CONAR</span>
                  </label>
                  <select
                    value={currentOffer.regulatoryCategory}
                    onChange={(e) =>
                      studioActions.setRegulatoryCategory(
                        e.target.value as RegulatoryCategory
                      )
                    }
                  >
                    <option value="STANDARD">Varejo livre (padrão)</option>
                    <option value="AGRO_PESTICIDE">MAPA · Defensivo agrícola</option>
                    <option value="AGRO_FERTILIZER_SEED">MAPA · Semente / NPK</option>
                    <option value="VET_PRESCRIPTION">CRMV · Medicamento vet.</option>
                    <option value="ALCOHOL_18">CONAR · Bebida (+18)</option>
                  </select>
                </div>

                {currentOffer.validityPreset === 'CUSTOM_DATE' && (
                  <div className="settings-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Data limite da oferta</label>
                    <input
                      type="date"
                      value={currentOffer.customValidityDateISO || ''}
                      onChange={(e) =>
                        studioActions.updateOfferField(
                          'customValidityDateISO',
                          e.target.value || undefined
                        )
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {/* ALERTAS DE GUARDRAILS ATIVOS (#35 a #40) COM AUTO-REPARO DE 1 CLIQUE */}
            {metrics.guardrailFindings.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {metrics.guardrailFindings.map((f) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-between gap-2 ${
                      f.severity === 'block'
                        ? 'bg-red-50 text-red-900 border-red-300'
                        : f.severity === 'warn' || f.severity === 'approval'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}
                  >
                    <span>
                      {f.severity === 'block' ? '⛔ ' : f.severity === 'ok' ? '✨ ' : '⚠️ '}
                      {f.message}
                    </span>
                    {(f.code === 'PRICE_INVERTED' || f.code === 'BELOW_COST_MARGIN') && (
                      <button
                        type="button"
                        onClick={() => studioActions.autoFixPriceGuardrail(f.code)}
                        className="px-2.5 py-1 rounded-lg bg-red-800 hover:bg-red-900 text-white text-[10px] font-black uppercase shrink-0 shadow-2xs cursor-pointer"
                      >
                        {f.code === 'PRICE_INVERTED' ? '⇄ Inverter DE/POR' : '⚡ Ajustar p/ Margem'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div
              className={`compliance-inline${
                !metrics.canExport ? ' compliance-inline--review' : ''
              }`}
            >
              <span className="compliance-icon" aria-hidden="true">
                {metrics.canExport ? <IconCheck size={14} /> : <IconShield size={14} />}
              </span>
              <div className="compliance-inline-copy">
                <strong>
                  {metrics.canExport
                    ? 'Rodapé legal e travas da matriz aplicados'
                    : 'Guardrails ativos · revise os alertas acima'}
                </strong>
                <span>
                  {metrics.validityFormatted} · {brandKit.companyName}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 30, padding: '0 9px', fontSize: 9.5 }}
                onClick={() => openSettings('regras')}
              >
                Regras <IconChevronRight size={11} />
              </button>
            </div>
          </div>
        )}
                </div>

                <div className="preview-stack">
          <div className="preview-tools">
            <div className="segmented" role="group" aria-label="Formato da arte">
              {state.userRole !== 'OPERATOR' && activeModule === 'STORE_POSTER' &&
                (
                  [
                    { id: 'A4_FULL', label: 'A4' },
                    { id: 'A5_HALF', label: 'A5' },
                    { id: 'GONDOLA_2X2', label: 'Gôndola' },
                  ] as { id: PrintGridFormat; label: string }[]
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    aria-pressed={posterConfig.printGrid === fmt.id}
                    onClick={() => studioActions.setPosterPrintGrid(fmt.id)}
                  >
                    {fmt.label}
                  </button>
                ))}
              {activeModule === 'SOCIAL_MEDIA' &&
                (
                  [
                    { id: 'STORY_9_16', label: 'Story' },
                    { id: 'FEED_4_5', label: 'Feed' },
                  ] as { id: SocialAspectRatio; label: string }[]
                ).map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    aria-pressed={socialConfig.aspectRatio === ar.id}
                    onClick={() => studioActions.setSocialAspectRatio(ar.id)}
                  >
                    {ar.label}
                  </button>
                ))}
              {activeModule === 'CAROUSEL' && (
                <span className="preview-badge">
                  Slide {activeCarouselSlideIndex + 1}/{carouselSlides.length}
                </span>
              )}
              {activeModule === 'HR_NOTICE' && (
                <span className="preview-badge">
                  {hrNotice.outputFormat === 'A4_PRINT' ? 'A4 impressão' : 'Feed 4:5'}
                </span>
              )}
            </div>

            <div className="segmented" role="group" aria-label="Tema visual">
              {activeModule === 'HR_NOTICE' ? (
                (hrNotice.channel || 'MURAL_A4') === 'MURAL_A4' && hrNotice.outputFormat === 'A4_PRINT' ? (
                  <>
                    <button
                      type="button"
                      aria-pressed={posterConfig.visualTheme === 'BW_ECO_TONER'}
                      onClick={() => studioActions.setPosterVisualTheme('BW_ECO_TONER')}
                    >
                      P&B (Toner)
                    </button>
                    <button
                      type="button"
                      aria-pressed={posterConfig.visualTheme !== 'BW_ECO_TONER'}
                      onClick={() => studioActions.setPosterVisualTheme('BRAND_PRIMARY')}
                    >
                      Colorido
                    </button>
                  </>
                ) : (
                  <span className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 rounded-lg">
                    🎨 Paleta Oficial Colorida
                  </span>
                )
              ) : activeModule === 'SOCIAL_MEDIA' || activeModule === 'CAROUSEL' ? (
                <>
                  <button
                    type="button"
                    aria-pressed={socialConfig.visualTheme === 'BRAND_PRIMARY'}
                    onClick={() => studioActions.setSocialVisualTheme('BRAND_PRIMARY')}
                  >
                    Colorido
                  </button>
                  <button
                    type="button"
                    aria-pressed={socialConfig.visualTheme === 'HIGH_CONTRAST_ALERT'}
                    onClick={() =>
                      studioActions.setSocialVisualTheme('HIGH_CONTRAST_ALERT')
                    }
                  >
                    Alerta
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    aria-pressed={posterConfig.visualTheme !== 'BW_ECO_TONER'}
                    onClick={() => studioActions.setPosterVisualTheme('BRAND_PRIMARY')}
                  >
                    Colorido
                  </button>
                  <button
                    type="button"
                    aria-pressed={posterConfig.visualTheme === 'BW_ECO_TONER'}
                    onClick={() => studioActions.setPosterVisualTheme('BW_ECO_TONER')}
                  >
                    Toner
                  </button>
                </>
              )}
            </div>

            {activeModule === 'STORE_POSTER' && (
              <span
                className="preview-badge preview-badge--accent"
                data-poster-template-active={COAGRO_OFFICIAL_POSTER_ARCHETYPE}
              >
                Modelo Oficial: Promo V Clássico
              </span>
            )}
          </div>

          <div className="preview-card">
            <div className="preview-topline">
              <div className="preview-topline-left">
                <span className="preview-title-mark">
                  <IconEye size={12} />
                </span>
                <strong>Prévia</strong>
                <span className="preview-live">
                  <i aria-hidden="true" /> atualiza ao vivo
                </span>
              </div>
              <div className="preview-meta">
                <span className="preview-badge">{previewLabel}</span>
              </div>
            </div>

            <PreviewStage
              frame={previewFrame}
              stack={previewStack}
            >

            {activeModule === 'STORE_POSTER' ? (
              <StorePosterA4Sheet
                sheetRef={posterSheetRef}
                offer={currentOffer}
                batchMode={posterConfig.batchMode && state.userRole !== 'OPERATOR'}
                batchRows={state.parsedBatchRows}
                batchOffers={state.batchOffers}
                brandKit={brandKit}
                printGrid={posterConfig.printGrid}
                theme={posterConfig.visualTheme}
                layoutArchetype={COAGRO_OFFICIAL_POSTER_ARCHETYPE}
                showDiscountBadge={posterConfig.showDiscountPercentageBadge}
                showPricePerMeasure={posterConfig.showPricePerKgOrLiter}
              />
            ) : activeModule === 'CAROUSEL' ? (
              <GuidedCarouselCanvas
                canvasRef={socialCanvasRef}
                slide={carouselSlides[activeCarouselSlideIndex] || carouselSlides[0]}
                slideIndex={activeCarouselSlideIndex}
                totalSlides={carouselSlides.length}
                offer={currentOffer}
                brandKit={brandKit}
                theme={socialConfig.visualTheme}
              />
            ) : activeModule === 'HR_NOTICE' ? (
              <HrAndNoticeCanvas
                canvasRef={posterSheetRef}
                hrNotice={hrNotice}
                brandKit={brandKit}
                theme={posterConfig.visualTheme}
              />
            ) : (
              <SocialMediaCardCanvas
                canvasRef={socialCanvasRef}
                offer={currentOffer}
                brandKit={brandKit}
                aspectRatio={socialConfig.aspectRatio}
                theme={socialConfig.visualTheme}
                showBullets={socialConfig.showBullets}
                showSafeZones={socialConfig.showSafeZonesGuide}
              />
            )}
            </PreviewStage>

            {activeModule === 'CAROUSEL' && (
              <div className="preview-actions" style={{ width: '100%' }}>
                <button
                  type="button"
                  disabled={activeCarouselSlideIndex <= 0}
                  onClick={() =>
                    studioActions.setActiveCarouselSlide(activeCarouselSlideIndex - 1)
                  }
                  className="btn btn-ghost"
                >
                  ← Anterior
                </button>
                <span className="preview-badge">
                  Slide {activeCarouselSlideIndex + 1} de {carouselSlides.length}
                </span>
                <button
                  type="button"
                  disabled={activeCarouselSlideIndex >= carouselSlides.length - 1}
                  onClick={() =>
                    studioActions.setActiveCarouselSlide(activeCarouselSlideIndex + 1)
                  }
                  className="btn btn-ghost"
                >
                  Próximo →
                </button>
              </div>
            )}

            <div className="preview-footer">
              {activeModule === 'STORE_POSTER' && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => studioActions.bridgePosterToSocialMedia()}
                  title="Levar este produto para o módulo de redes sociais"
                >
                  Usar em redes sociais
                </button>
              )}
            </div>

            {!metrics.canExport &&
            (activeModule === 'STORE_POSTER' || activeModule === 'SOCIAL_MEDIA') ? (
              <div className="blocked-banner">
                <div>⛔ Exportação bloqueada pela governança</div>
                {metrics.guardrailFindings
                  .filter((f) => f.severity === 'block')
                  .map((f) => (
                    <div key={f.id} style={{ fontWeight: 500, marginTop: 4 }}>
                      • {f.message}
                    </div>
                  ))}
              </div>
            ) : governance.requiresCuratorApproval ? (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 space-y-2.5 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-950">
                    🛡️ Via Amarela • Homologação do Marketing
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 text-[10px] font-black">
                    Download Direto Travado
                  </span>
                </div>
                <ul className="text-[11px] text-amber-900 space-y-0.5">
                  {governance.reasons.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    const req = studioActions.submitMarketingRequest();
                    setCuratorFlash(
                      `✅ Solicitação ${req.protocolCode} (${req.storeName}) enviada para a Fila do Curador (Kaio)!`
                    );
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] font-black text-xs uppercase tracking-wider shadow-sm cursor-pointer transition"
                >
                  📨 {governance.primaryActionLabel}
                </button>
              </div>
            ) : activeModule === 'STORE_POSTER' || activeModule === 'HR_NOTICE' ? (
              <div className="export-bar">
                <button
                  type="button"
                  className="btn btn-amber"
                  onClick={() =>
                    handleProtectedExport(() =>
                      exportElementToPng(
                        posterSheetRef.current,
                        activeModule === 'HR_NOTICE'
                          ? `comunicado-${hrNotice.referenceCode || 'rh'}.png`
                          : `cartaz-${currentOffer.skuCode || 'oferta'}.png`,
                        1240
                      )
                    )
                  }
                >
                  <IconDownload size={13} /> PNG
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    handleProtectedExport(() =>
                      printOrSaveA4Sheet(
                        posterSheetRef.current,
                        activeModule === 'HR_NOTICE'
                          ? `comunicado-a4-${hrNotice.referenceCode || 'rh'}`
                          : `cartaz-a4-${currentOffer.skuCode || 'oferta'}`
                      )
                    )
                  }
                >
                  <IconPrint size={13} /> PDF A4
                </button>
                <button
                  type="button"
                  className="btn btn-sky"
                  onClick={() =>
                    handleProtectedExport(() =>
                      printOrSaveA4Sheet(
                        posterSheetRef.current,
                        activeModule === 'HR_NOTICE'
                          ? `impressao-${hrNotice.referenceCode || 'rh'}`
                          : `impressao-${currentOffer.skuCode || 'oferta'}`
                      )
                    )
                  }
                >
                  <IconPrint size={13} /> Imprimir
                </button>
              </div>
            ) : (
              <div className="export-bar export-bar--two">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    handleProtectedExport(() =>
                      exportElementToPng(
                        socialCanvasRef.current,
                        activeModule === 'CAROUSEL'
                          ? `carrossel-slide-${activeCarouselSlideIndex + 1}.png`
                          : `story-${currentOffer.skuCode || 'oferta'}.png`,
                        1080,
                        false
                      )
                    )
                  }
                >
                  <IconDownload size={13} /> Baixar PNG 1080p
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    handleProtectedExport(() =>
                      exportElementToPng(
                        socialCanvasRef.current,
                        activeModule === 'CAROUSEL'
                          ? `carrossel-slide-${activeCarouselSlideIndex + 1}.png`
                          : `story-${currentOffer.skuCode || 'oferta'}.png`,
                        1080,
                        true
                      )
                    )
                  }
                >
                  <IconShare size={13} /> WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  </div>
        )}
      </div>

      {showHelp && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="help-title" className="text-base font-bold text-slate-900">
                  Ajuda e atalhos do sistema
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Atalhos de teclado para operação rápida no balcão.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="top-icon-button"
                aria-label="Fechar ajuda"
              >
                <IconClose size={15} />
              </button>
            </div>
            <div className="grid gap-2 px-5 py-4 text-xs text-slate-700">
              {[
                ['Alt + V', 'Focar o campo de colagem do WhatsApp'],
                ['Ctrl / Cmd + V', 'Colar o texto da oferta e extrair dados'],
                ['Enter', 'Confirmar preenchimento da oferta ou busca de SKU'],
                ['Ctrl / Cmd + P', 'Imprimir o cartaz ou comunicado A4'],
                ['Alt + 1…4', 'Alternar entre Redes, Cartazes, Carrosséis e RH'],
                ['Alt + M', 'Abrir configurações de Identidade da Marca'],
                ['Alt + E', 'Abrir configurações de Base ERP'],
                ['Alt + L', 'Padronizar siglas do nome do produto'],
                ['Alt + H', 'Abrir ou fechar este painel de ajuda'],
                ['Esc', 'Fechar modais e o menu lateral'],
              ].map(([shortcut, description]) => (
                <div
                  key={shortcut}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-2"
                >
                  <span>{description}</span>
                  <kbd className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs font-semibold text-slate-800">
                    {shortcut}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="text-[10px] text-slate-500">
                Dados salvos localmente · nenhum envio automático
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowHelp(false)}
              >
                <IconCheck size={13} /> Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        planTier={planTier}
        usedThisMonth={freemiumQuota.usedThisMonth}
        monthlyLimit={freemiumQuota.monthlyLimit}
        initialMode={paywallInitialMode}
        onSuccess={() => {
          if (pendingExportRef.current) {
            const action = pendingExportRef.current;
            pendingExportRef.current = null;
            action();
          }
        }}
      />

      {/* Modal Global de Confirmação com Protocolo Oficial Coagro (Sprint 7) */}
      {state.lastSubmittedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                🛡️ Via Amarela • Homologação de Marca
              </span>
              <button
                type="button"
                onClick={() => studioActions.clearLastSubmittedRequest()}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="text-3xl">📨</div>
              <h3 className="text-lg font-black text-slate-900">
                Demanda Protocolada com Sucesso!
              </h3>
              <p className="text-xs text-slate-500">
                Sua solicitação foi registrada na Fila do Curador do Marketing Coagro.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Número de Protocolo Oficial
              </span>
              <div className="text-2xl font-black font-mono text-[#004d40] tracking-wider">
                {state.lastSubmittedRequest.protocolCode}
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                {state.lastSubmittedRequest.storeName} • {state.lastSubmittedRequest.title}
              </p>
            </div>

            <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1">
              <div className="font-bold text-amber-950">Por que foi para a curadoria?</div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Peças de redes sociais, faixas e itens com alerta de margem ou ortografia passam pela validação do Kaio Virgínio antes da impressão ou disparo para manter a governança da rede.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => studioActions.clearLastSubmittedRequest()}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black cursor-pointer transition"
              >
                Fechar / OK
              </button>
              <button
                type="button"
                onClick={() => {
                  studioActions.clearLastSubmittedRequest();
                  studioActions.setActiveModule('CURATOR_QUEUE');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#004d40] hover:bg-[#00382e] text-[#ffab00] text-xs font-black cursor-pointer transition"
              >
                Ver na Fila do Curador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
