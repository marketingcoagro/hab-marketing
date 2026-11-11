import React from 'react';
import { useStudioStore, studioActions } from '../core/store';
import { COAGRO_HUB_BRAND, type ModuleMode } from '../core/types';
import { COAGRO_STORES, getCoagroStoreById } from '../core/coagroStores';
import { LogoHorizontalBranca, CoagroSimboloCasinha } from './coagroLogos';
import {
  IconCarousel,
  IconMegaphone,
  IconPoster,
  IconSettings,
  IconShield,
  IconSparkles,
  IconUsers,
} from './icons';
import type { SettingsTab } from './settingsTabs';

interface SidebarProps {
  activeModule: ModuleMode;
  isSettings: boolean;
  onSelectModule: (module: ModuleMode) => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenHelp: () => void;
  onOpenPaywall: () => void;
  onOpenLandingPage?: () => void;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
}

const MODULES: {
  id: ModuleMode;
  label: string;
  badge?: string;
  icon: React.FC<{ size?: number }>;
}[] = [
  { id: 'BRAND_HUB', label: 'Kit Colaborador', icon: IconUsers },
  { id: 'STORE_POSTER', label: 'Cartazes de PDV', badge: 'Via verde', icon: IconPoster },
  { id: 'SOCIAL_MEDIA', label: 'Anúncios da loja', icon: IconMegaphone },
  { id: 'CAROUSEL', label: 'Carrossel', icon: IconCarousel },
  { id: 'HR_NOTICE', label: 'Comunicados', icon: IconUsers },
  { id: 'CURATOR_QUEUE', label: 'Fila do Curador', icon: IconShield },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  isSettings,
  onSelectModule,
  onOpenSettings,
  onOpenHelp,
  drawerOpen,
  onCloseDrawer,
}) => {
  const state = useStudioStore();
  const { brandKit, activeStoreId, userRole, marketingRequests } = state;
  const activeStore = getCoagroStoreById(activeStoreId);
  const activeDept =
    brandKit.departments.find((d) => d.id === brandKit.activeDepartmentId) ||
    brandKit.departments[0];

  const pendingRequestsCount = marketingRequests.filter(
    (r) => r.status === 'PENDING' || r.status === 'QUOTING'
  ).length;

  const select = (module: ModuleMode) => {
    onSelectModule(module);
    onCloseDrawer();
  };

  return (
    <aside className="sidebar" aria-label="Navegação principal" data-drawer-open={drawerOpen}>
      <button
        type="button"
        className="brand-lockup flex items-center gap-2.5"
        onClick={() => select('STORE_POSTER')}
        aria-label={`Ir para o ${COAGRO_HUB_BRAND.name}`}
      >
        <LogoHorizontalBranca className="h-10 w-auto max-w-[196px]" />
      </button>

      <p className="sidebar-label">Unidade ativa</p>

      <div className="workspace-card space-y-2.5">
        <div className="workspace-top">
          <span className="workspace-avatar" aria-hidden="true">
            <CoagroSimboloCasinha className="w-5 h-5" />
          </span>
          <span className="workspace-copy">
            <strong title={activeStore.nome}>{activeStore.nome}</strong>
            <span title={`${activeStore.cidade}/${activeStore.estado} • ${activeStore.telefoneFormatado}`}>
              {activeStore.cidade}/{activeStore.estado} • {activeStore.telefoneFormatado}
            </span>
          </span>
        </div>

        <div>
          <label htmlFor="sidebar-store-select" className="sr-only">
            Selecionar unidade Coagro
          </label>
          <select
            id="sidebar-store-select"
            value={activeStoreId}
            onChange={(e) => studioActions.setActiveStore(e.target.value)}
            className="workspace-select"
          >
            {COAGRO_STORES.filter(
              (st) => st.ativo !== false && st.identityEnabled !== false && st.bandeira !== 'RB_AGRICOLA'
            ).map((st) => (
              <option key={st.id} value={st.id}>
                {st.nome} ({st.cidade}/{st.estado})
              </option>
            ))}
          </select>
        </div>

        {brandKit.enableSubDepartments !== false && (
          <div className="workspace-departments" role="group" aria-label="Bandeira ativa">
            {brandKit.departments
              .filter(
                (dept) =>
                  dept.enabled !== false &&
                  (dept.id === 'dept-1' || (dept.id === 'dept-2' && activeStore.hasPetDepartment))
              )
              .map((dept) => {
              const active = dept.id === activeDept?.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => studioActions.setActiveDepartment(dept.id)}
                  className={`workspace-dept${active ? ' workspace-dept--active' : ''}`}
                  aria-pressed={active}
                  title={`Ativar paleta ${dept.label}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block mr-1.5 shrink-0"
                    style={{ backgroundColor: dept.primaryColorHex }}
                    aria-hidden="true"
                  />
                  {dept.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="sidebar-label">Materiais e operação</p>
      <nav className="side-nav" aria-label="Menu principal">
        <button
          type="button"
          className={`side-link side-link--campaigns${
            activeModule === 'CAMPAIGNS' ||
            activeModule === 'BANNER_FAIXA' ||
            activeModule === 'RADIO_SPOT'
              ? ' side-link--active'
              : ''
          }`}
          aria-current={activeModule === 'CAMPAIGNS' ? 'page' : undefined}
          onClick={() => select('CAMPAIGNS')}
        >
          <span className="flex items-center gap-2.5 truncate">
            <IconSparkles size={16} />
            <span className="truncate">Campanhas</span>
          </span>
          <span className="side-badge side-badge--gold">Oficial</span>
        </button>

        <div className="side-subnav" role="group" aria-label="Campanhas">
          <button
            type="button"
            className={`side-link side-link--sub${
              !isSettings && activeModule === 'BANNER_FAIXA' ? ' side-link--active' : ''
            }`}
            aria-current={activeModule === 'BANNER_FAIXA' ? 'page' : undefined}
            onClick={() => select('BANNER_FAIXA')}
          >
            <span className="side-subtree-mark" aria-hidden="true" />
            <span>Faixas e lonas</span>
          </button>
          <button
            type="button"
            className={`side-link side-link--sub${
              !isSettings && activeModule === 'RADIO_SPOT' ? ' side-link--active' : ''
            }`}
            aria-current={activeModule === 'RADIO_SPOT' ? 'page' : undefined}
            onClick={() => select('RADIO_SPOT')}
          >
            <span className="side-subtree-mark" aria-hidden="true" />
            <span>Rádio Coagro</span>
          </button>
        </div>

        {MODULES.map(({ id, label, badge, icon: Icon }) => {
          const active = !isSettings && activeModule === id;
          const isQueue = id === 'CURATOR_QUEUE';
          return (
            <button
              key={id}
              type="button"
              className={`side-link justify-between${active ? ' side-link--active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => select(id)}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Icon size={16} />
                <span className="truncate">{label}</span>
              </span>
              {isQueue && pendingRequestsCount > 0 ? (
                <span className="side-count">{pendingRequestsCount}</span>
              ) : badge ? (
                <span className="side-badge">{badge}</span>
              ) : null}
            </button>
          );
        })}

        <button
          type="button"
          className={`side-link${isSettings ? ' side-link--active' : ''}`}
          aria-current={isSettings ? 'page' : undefined}
          onClick={() => {
            onOpenSettings();
            onCloseDrawer();
          }}
        >
          <IconSettings size={16} />
          <span>Configurações</span>
          {isSettings && <i aria-hidden="true" />}
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div
          className="freemium-card"
          data-freemium-tier="ENTERPRISE"
          data-governance-role={userRole}
        >
          <div className="freemium-top">
            <span className="free-dot" aria-hidden="true" />
            Governança ativa
          </div>
          <div className="freemium-count">
            <strong>{pendingRequestsCount}</strong>
            <span>
              demandas na
              <br />
              fila do Curador
            </span>
          </div>
          <p>
            Identidade oficial Coagro e Coagro Pet. Peças fora do padrão entram na fila de curadoria.
          </p>
          <button
            type="button"
            className="upgrade-link"
            onClick={() => select('CURATOR_QUEUE')}
          >
            <IconShield size={11} /> Abrir Painel do Curador
          </button>
        </div>
      </div>
    </aside>
  );
};
