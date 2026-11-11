import React from 'react';
import { useStudioStore, studioActions } from '../core/store';
import type {
  ModuleMode,
  PosterLayoutArchetype,
  PrintGridFormat,
  RegulatoryCategory,
  RoundingStrategy,
  SocialAspectRatio,
  ValidityPreset,
  VisualThemePreset,
} from '../core/types';
import { COAGRO_OFFICIAL_POSTER_ARCHETYPE } from '../core/types';
import { BrandKitModal } from './BrandKitModal';
import { ErpIntegrationModal } from './ErpIntegrationModal';
import { SETTINGS_TABS, type SettingsTab } from './settingsTabs';
import {
  toggleUiPref,
  useUiPrefs,
  setWorkModePref,
  resetUiPrefs,
  isControlVisible,
  type UiControl,
} from './useUiPrefs';
import {
  IconBuilding,
  IconCheck,
  IconInfo,
  IconLink,
  IconLock,
  IconPalette,
  IconShield,
  IconSparkles,
} from './icons';

interface SettingsCenterProps {
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onOpenPaywall: () => void;
}

interface VisibilityItem {
  control: UiControl;
  label: string;
  hint: string;
}

const VisibilityList: React.FC<{
  module: ModuleMode;
  items: VisibilityItem[];
}> = ({ module, items }) => {
  const prefs = useUiPrefs();
  return (
    <div className="settings-list">
      {items.map((item) => {
        const visible = isControlVisible(prefs, module, item.control);
        return (
          <div className="settings-row" key={item.control}>
            <span className="settings-row-copy">
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={visible}
              aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${item.label}`}
              className="switch"
              onClick={() => toggleUiPref(module, item.control)}
            >
              <span />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div className="settings-field">
    <label>
      {label} {hint && <span>· {hint}</span>}
    </label>
    {children}
  </div>
);

export const SettingsCenter: React.FC<SettingsCenterProps> = ({
  tab,
  onTabChange,
  onOpenPaywall,
}) => {
  const state = useStudioStore();
  const prefs = useUiPrefs();
  const { brandKit, posterConfig, socialConfig, currentOffer, planTier, erpSyncConfig } = state;
  const activeDept =
    brandKit.departments.find((d) => d.id === brandKit.activeDepartmentId) ||
    brandKit.departments[0];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> Painel de configurações
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Central de Configurações
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Identidade, regras comerciais, formatos e integrações da {brandKit.companyName}.
          </p>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Seções de configuração">
          {SETTINGS_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={tab === item.id ? 'true' : undefined}
              onClick={() => onTabChange(item.id)}
            >
              {item.id === 'identidade' && <IconPalette size={14} />}
              {item.id === 'regras' && <IconShield size={14} />}
              {item.id === 'cartazes' && <IconBuilding size={14} />}
              {item.id === 'social' && <IconSparkles size={14} />}
              {item.id === 'erp' && <IconLink size={14} />}
              {item.id === 'acesso' && <IconLock size={14} />}
              {item.label}
            </button>
          ))}
        </nav>

        <section className="settings-panel">
          {tab === 'identidade' && (
            <>
              <header>
                <h2>Identidade da Marca</h2>
              </header>
              <BrandKitModal
                isOpen
                variant="embedded"
                onClose={() => undefined}
                brandKit={brandKit}
              />
            </>
          )}

          {tab === 'regras' && (
            <>
              <header>
                <h2>Regras comerciais</h2>
                <p>
                  Padrões aplicados à oferta em edição. As travas de preço, margem e validade
                  continuam sendo calculadas pelo núcleo do sistema.
                </p>
              </header>

              <div className="settings-section">
                <h3>
                  Chamada e arredondamento <i />
                </h3>
                <div className="settings-grid">
                  <Field label="Título da etiqueta" hint="cartazes">
                    <select
                      value={currentOffer.headerLabel}
                      onChange={(e) =>
                        studioActions.updateOfferField('headerLabel', e.target.value)
                      }
                    >
                      {['OFERTA', 'PROMOÇÃO', 'SUPER PREÇO', 'QUEIMA DE ESTOQUE', 'OPORTUNIDADE'].map(
                        (label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                  <Field label="Arredondamento de preço">
                    <select
                      value={currentOffer.roundingStrategy}
                      onChange={(e) =>
                        studioActions.setRoundingStrategy(
                          e.target.value as RoundingStrategy
                        )
                      }
                    >
                      <option value="NONE">Exato (sem arredondar)</option>
                      <option value="PSYCH_90">Final ,90</option>
                      <option value="PSYCH_99">Final ,99</option>
                      <option value="INTEGER_DOWN">Inteiro para baixo</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="settings-section">
                <h3>
                  Vigência e conformidade <i />
                </h3>
                <div className="settings-grid">
                  <Field label="Vigência padrão" hint="obrigatório PROCON">
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
                  </Field>
                  <Field label="Categoria regulatória" hint="MAPA / CRMV / CONAR">
                    <select
                      value={currentOffer.regulatoryCategory}
                      onChange={(e) =>
                        studioActions.setRegulatoryCategory(
                          e.target.value as RegulatoryCategory
                        )
                      }
                    >
                      <option value="STANDARD">Varejo livre (padrão)</option>
                      <option value="AGRO_PESTICIDE">Defensivo agrícola (MAPA)</option>
                      <option value="AGRO_FERTILIZER_SEED">Semente / fertilizante (MAPA)</option>
                      <option value="VET_PRESCRIPTION">Medicamento veterinário (CRMV)</option>
                      <option value="ALCOHOL_18">Bebida alcoólica (CONAR +18)</option>
                    </select>
                  </Field>
                  <Field label="Preço de custo" hint="trava anti-prejuízo">
                    <input
                      type="number"
                      step="0.10"
                      placeholder="Ex: 38,00"
                      value={currentOffer.costPrice || ''}
                      onChange={(e) =>
                        studioActions.updateOfferField(
                          'costPrice',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </Field>
                  {currentOffer.validityPreset === 'CUSTOM_DATE' && (
                    <Field label="Data limite">
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
                    </Field>
                  )}
                </div>
              </div>

              <div className="settings-note">
                <IconShield size={14} />
                <span>
                  Preço DE menor que POR, venda abaixo do custo e validade vencida bloqueiam a
                  exportação automaticamente — regra aplicada em{' '}
                  <code>src/core/businessRules.ts</code>.
                </span>
              </div>
            </>
          )}

          {tab === 'cartazes' && (
            <>
              <header>
                <h2>Cartazes de loja</h2>
                <p>Formato de impressão, tema e arquétipo usados como padrão no módulo.</p>
              </header>

              <div className="settings-section">
                <h3>
                  Impressão e layout <i />
                </h3>
                <div className="settings-grid">
                  <Field label="Formato da folha">
                    <select
                      value={posterConfig.printGrid}
                      onChange={(e) =>
                        studioActions.setPosterPrintGrid(e.target.value as PrintGridFormat)
                      }
                    >
                      <option value="A4_FULL">A4 cheio · 1 por folha</option>
                      <option value="A5_HALF">A5 meia-folha · 2 por folha</option>
                      <option value="GONDOLA_2X2">Gôndola · 4 por folha</option>
                    </select>
                  </Field>
                  <Field label="Tema visual">
                    <select
                      value={posterConfig.visualTheme}
                      onChange={(e) =>
                        studioActions.setPosterVisualTheme(
                          e.target.value as VisualThemePreset
                        )
                      }
                    >
                      <option value="BRAND_PRIMARY">Cor principal da marca</option>
                      <option value="BRAND_SECONDARY">Cor secundária</option>
                      <option value="BW_ECO_TONER">Preto & branco (toner)</option>
                      <option value="HIGH_CONTRAST_ALERT">Alerta de oferta</option>
                      <option value="CAMPAIGN_SEASONAL">Campanha sazonal</option>
                    </select>
                  </Field>
                  <Field label="Modelo oficial do cartaz">
                    <div
                      className="settings-note"
                      data-poster-template-active={COAGRO_OFFICIAL_POSTER_ARCHETYPE}
                    >
                      <IconLock size={14} />
                      <span>
                        Padrão Oficial: <strong>Promo V Clássico</strong> — modelo único do Hub
                        Coagro.
                      </span>
                    </div>
                  </Field>
                  <Field label="Modo de edição">
                    <select
                      value={posterConfig.batchMode ? 'BATCH' : 'SINGLE'}
                      onChange={(e) =>
                        studioActions.setPosterBatchMode(e.target.value === 'BATCH')
                      }
                    >
                      <option value="SINGLE">Individual (manual)</option>
                      <option value="BATCH">Lote auditável (ERP / CSV)</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="settings-section">
                <h3>
                  Elementos do cartaz <i />
                </h3>
                <div className="settings-list">
                  <div className="settings-row">
                    <span className="settings-row-copy">
                      <strong>Selo de desconto (%)</strong>
                      <span>Exibe o percentual calculado sobre o preço DE.</span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={posterConfig.showDiscountPercentageBadge}
                      aria-label="Selo de desconto"
                      className="switch"
                      onClick={() =>
                        studioActions.togglePosterDiscountBadge(
                          !posterConfig.showDiscountPercentageBadge
                        )
                      }
                    >
                      <span />
                    </button>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-copy">
                      <strong>Preço por kg / litro</strong>
                      <span>Mostra a equivalência por medida quando houver peso ou volume.</span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={posterConfig.showPricePerKgOrLiter}
                      aria-label="Preço por quilo ou litro"
                      className="switch"
                      onClick={() =>
                        studioActions.togglePosterPricePerMeasure(
                          !posterConfig.showPricePerKgOrLiter
                        )
                      }
                    >
                      <span />
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>
                  Visibilidade na tela <i />
                </h3>
                <VisibilityList
                  module="STORE_POSTER"
                  items={[
                    {
                      control: 'posterSubtitle',
                      label: 'Subtítulo / linha de apoio',
                      hint: 'Campo de frase complementar do produto.',
                    },
                    {
                      control: 'posterPriceFrom',
                      label: 'Preço DE',
                      hint: 'Preço antigo de referência (opcional).',
                    },
                    {
                      control: 'posterBadge',
                      label: 'Selo % OFF na barra de visualização',
                      hint: 'Atalho rápido exibido acima do preview.',
                    },
                    {
                      control: 'posterPricePerMeasure',
                      label: 'Equivalência por medida na tela',
                      hint: 'Espelha o valor calculado no editor.',
                    },
                  ]}
                />
              </div>
            </>
          )}

          {tab === 'social' && (
            <>
              <header>
                <h2>Redes sociais</h2>
                <p>Proporção, tema e guias usados nos cards de Story, Feed e WhatsApp.</p>
              </header>

              <div className="settings-section">
                <h3>
                  Formato e composição <i />
                </h3>
                <div className="settings-grid">
                  <Field label="Proporção padrão">
                    <select
                      value={socialConfig.aspectRatio}
                      onChange={(e) =>
                        studioActions.setSocialAspectRatio(
                          e.target.value as SocialAspectRatio
                        )
                      }
                    >
                      <option value="STORY_9_16">Story / Status · 9:16</option>
                      <option value="FEED_4_5">Feed · 4:5</option>
                    </select>
                  </Field>
                  <Field label="Tema visual">
                    <select
                      value={socialConfig.visualTheme}
                      onChange={(e) =>
                        studioActions.setSocialVisualTheme(
                          e.target.value as VisualThemePreset
                        )
                      }
                    >
                      <option value="BRAND_PRIMARY">Cor principal da marca</option>
                      <option value="BRAND_SECONDARY">Cor secundária</option>
                      <option value="HIGH_CONTRAST_ALERT">Alerta de oferta</option>
                      <option value="CAMPAIGN_SEASONAL">Campanha sazonal</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="settings-section">
                <h3>
                  Guias e blocos <i />
                </h3>
                <div className="settings-list">
                  <div className="settings-row">
                    <span className="settings-row-copy">
                      <strong>Zonas seguras do Story</strong>
                      <span>Mostra as áreas cobertas pela interface do Instagram e WhatsApp.</span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={socialConfig.showSafeZonesGuide}
                      aria-label="Zonas seguras do Story"
                      className="switch"
                      onClick={() =>
                        studioActions.toggleSocialSafeZones(!socialConfig.showSafeZonesGuide)
                      }
                    >
                      <span />
                    </button>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-copy">
                      <strong>Bloco de diferenciais</strong>
                      <span>Lista de benefícios exibida na arte social.</span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={socialConfig.showBullets}
                      aria-label="Bloco de diferenciais"
                      className="switch"
                      onClick={() =>
                        studioActions.toggleSocialBullets(!socialConfig.showBullets)
                      }
                    >
                      <span />
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>
                  Visibilidade na tela <i />
                </h3>
                <VisibilityList
                  module="SOCIAL_MEDIA"
                  items={[
                    {
                      control: 'socialImage',
                      label: 'Foto do produto',
                      hint: 'Upload com recorte e remoção de fundo.',
                    },
                    {
                      control: 'socialBullets',
                      label: 'Editor de diferenciais',
                      hint: 'Lista de até três benefícios.',
                    },
                    {
                      control: 'socialCta',
                      label: 'Chamada para ação (CTA)',
                      hint: 'Texto final do card e atalhos prontos.',
                    },
                  ]}
                />
              </div>
            </>
          )}

          {tab === 'erp' && (
            <>
              <header>
                <h2>Base ERP</h2>
                <p>
                  Catálogo local com {state.customCatalogDb.length} itens
                  {erpSyncConfig.lastSyncISO ? ` · última sincronização ${erpSyncConfig.lastSyncISO.slice(0, 10)}` : ''}.
                  Funciona offline neste navegador.
                </p>
              </header>
              <ErpIntegrationModal
                isOpen
                variant="embedded"
                onClose={() => undefined}
                customCatalogDb={state.customCatalogDb}
                parsedBatchRows={state.parsedBatchRows}
                erpSyncConfig={erpSyncConfig}
              />
            </>
          )}

          {tab === 'acesso' && (
            <>
              <header>
                <h2>Acesso e interface</h2>
                <p>
                  Escolha o nível de detalhe exibido para a equipe. As permissões completas de
                  usuário entram na próxima etapa do produto.
                </p>
              </header>

              <div className="settings-section">
                <h3>
                  Modo de trabalho <i />
                </h3>
                <div className="segmented segmented--wide" role="group" aria-label="Modo de trabalho">
                  <button
                    type="button"
                    aria-pressed={prefs.workMode === 'OPERATOR'}
                    onClick={() => setWorkModePref('OPERATOR')}
                  >
                    Balcão · rápido
                  </button>
                  <button
                    type="button"
                    aria-pressed={prefs.workMode === 'MANAGER'}
                    onClick={() => setWorkModePref('MANAGER')}
                  >
                    Governança · completo
                  </button>
                </div>
                <p className="settings-note" style={{ marginTop: 10 }}>
                  <IconInfo size={13} />
                  <span>
                    O modo balcão esconde custo, margem, categorias regulatórias e ajustes de
                    design. O modo governança libera todos os campos de compliance.
                  </span>
                </p>
              </div>

              <div className="settings-section">
                <h3>
                  Campos opcionais em RH & comunicados <i />
                </h3>
                <VisibilityList
                  module="HR_NOTICE"
                  items={[
                    {
                      control: 'hrReference',
                      label: 'Código de referência (CÓD)',
                      hint: 'Identificador interno exibido no cabeçalho.',
                    },
                    {
                      control: 'hrCompensation',
                      label: 'Remuneração / benefícios / destaque',
                      hint: 'Faixa salarial ou benefícios da vaga.',
                    },
                    {
                      control: 'hrRequirements',
                      label: 'Requisitos ou orientações',
                      hint: 'Lista de pontos (1 por linha) no corpo do aviso.',
                    },
                    {
                      control: 'hrContact',
                      label: 'Canal de contato / envio de currículo',
                      hint: 'WhatsApp, e-mail ou setor responsável.',
                    },
                  ]}
                />
              </div>

              <div className="settings-section">
                <h3>
                  Conta e plano <i />
                </h3>
                <div className="settings-row">
                  <span className="settings-row-copy">
                    <strong>{planTier === 'FREE' ? 'Plano gratuito' : 'Plano PRO ativo'}</strong>
                    <span>
                      {state.freemiumQuota.usedThisMonth} de{' '}
                      {planTier === 'FREE' ? state.freemiumQuota.monthlyLimit : '∞'} artes usadas
                      neste mês · {activeDept?.label || 'Varejo'}
                    </span>
                  </span>
                  <button type="button" className="btn btn-primary" onClick={onOpenPaywall}>
                    <IconSparkles size={13} />
                    {planTier === 'FREE' ? 'Liberar ilimitado' : 'Gerenciar assinatura'}
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h3>
                  Preferências locais <i />
                </h3>
                <p className="settings-note">
                  <IconInfo size={13} />
                  <span>
                    As preferências de interface ficam na chave{' '}
                    <code>alfa_pulso_ui_prefs_v1</code>, separadas do backup da loja, para não
                    vazar entre dispositivos.
                  </span>
                </p>
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      resetUiPrefs();
                    }}
                  >
                    <IconCheck size={13} /> Restaurar padrões da interface
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
