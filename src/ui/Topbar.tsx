import React from 'react';
import { IconHelp, IconMenu } from './icons';
import { useStudioStore, studioActions } from '../core/store';
import { getCoagroStoreById } from '../core/coagroStores';
import type { CoagroUserRole } from '../core/types';
import type { SettingsTab } from './settingsTabs';

interface TopbarProps {
  pageLabel: string;
  isSettings: boolean;
  onToggleDrawer: () => void;
  onOpenHelp: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  initials: string;
  workMode?: 'OPERATOR' | 'MANAGER';
  onSelectWorkMode?: (mode: 'OPERATOR' | 'MANAGER') => void;
  isLandingPage?: boolean;
  onToggleLandingPage?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  pageLabel,
  isSettings,
  onToggleDrawer,
  onOpenHelp,
  onOpenSettings,
  onSelectWorkMode,
  isLandingPage = false,
  onToggleLandingPage,
}) => {
  const state = useStudioStore();
  const activeStore = getCoagroStoreById(state.activeStoreId);
  const { userRole } = state;

  const handleRoleChange = (nextRole: CoagroUserRole) => {
    studioActions.setUserRole(nextRole);
    if (onSelectWorkMode) {
      onSelectWorkMode(nextRole === 'OPERATOR' ? 'OPERATOR' : 'MANAGER');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-button"
          onClick={onToggleDrawer}
          aria-label="Abrir menu de navegação"
        >
          <IconMenu size={17} />
        </button>
        <div className="breadcrumb" aria-label="Você está em">
          <span>Hub Coagro ({activeStore.nome.replace('Coagro ', '')})</span>
          <b>/</b>
          <strong>
            {isLandingPage
              ? 'Apresentação Executiva'
              : isSettings
                ? `Configurações · ${pageLabel}`
                : pageLabel}
          </strong>
        </div>
      </div>

      <div className="topbar-actions flex items-center gap-2">
        {/* Seletor RBAC de 3 Níveis (Seção 3.1 da Especificação) */}
        {!isLandingPage && (
          <div className="role-switcher hidden sm:inline-flex" role="group" aria-label="Perfil de acesso">
            <button
              type="button"
              onClick={() => handleRoleChange('OPERATOR')}
              className={`role-switch${userRole === 'OPERATOR' ? ' role-switch--active' : ''}`}
              title="Perfil Balcão: emissão rápida de cartazes pela via verde"
            >
              Balcão
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('STORE_MANAGER')}
              className={`role-switch${userRole === 'STORE_MANAGER' ? ' role-switch--active' : ''}`}
              title="Perfil Gerente de loja: formulários e solicitações ao marketing"
            >
              Gerente
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('CURATOR_ADMIN')}
              className={`role-switch${userRole === 'CURATOR_ADMIN' ? ' role-switch--active' : ''}`}
              title="Perfil Curador: visão global, homologação e exportação"
            >
              Curador
            </button>
          </div>
        )}

        {onToggleLandingPage && isLandingPage && (
          <button
            type="button"
            onClick={onToggleLandingPage}
            className="px-2.5 py-1 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer bg-amber-400 text-slate-950 border-amber-500 shadow-2xs"
            title="Voltar ao Hub Coagro"
          >
            <span>⚡ Voltar ao Hub</span>
          </button>
        )}

        <button
          type="button"
          className="top-icon-button"
          onClick={onOpenHelp}
          title="Ajuda e atalhos (Alt+H)"
          aria-label="Abrir ajuda e atalhos"
        >
          <IconHelp size={15} />
        </button>
        <button
          type="button"
          className="top-profile"
          onClick={() => onOpenSettings('acesso')}
          title={`Perfil Ativo: ${
            userRole === 'CURATOR_ADMIN'
              ? 'Kaio Virgínio (Curador de Marketing)'
              : userRole === 'STORE_MANAGER'
                ? `Gerente de Filial (${activeStore.nome})`
                : 'Operador de Balcão'
          } • ${activeStore.gerenteEmail} (Clique para Preferências de Acesso)`}
        >
          <span
            className="profile-avatar"
            style={{ width: 24, height: 24, flexBasis: 24 }}
          >
            {userRole === 'CURATOR_ADMIN' ? 'KV' : userRole === 'STORE_MANAGER' ? 'GE' : 'OP'}
          </span>
          <span className="hidden sm:inline font-bold">
            {userRole === 'CURATOR_ADMIN'
              ? 'Kaio (Curador)'
              : `${userRole === 'STORE_MANAGER' ? 'Gerente' : 'Balcão'} · ${activeStore.cidade}`}
          </span>
        </button>
      </div>
    </header>
  );
};
