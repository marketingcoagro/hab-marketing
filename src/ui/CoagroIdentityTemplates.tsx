import React from 'react';
import {
  CoagroPetLogo,
  CoagroSimboloCasinha,
  LogoHorizontalAzul,
  LogoHorizontalBranca,
  LogoVerticalBranca,
} from './coagroLogos';
import { COAGRO_CORPORATE_INFO, type CoagroStore } from '../core/coagroStores';

export interface CoagroIdentityTemplateProps {
  activeStore: CoagroStore;
  name: string;
  role: string;
  department: string;
  registration: string;
  phone: string;
  email: string;
  photo?: string | null;
  isPet?: boolean;
}

const COAGRO_BLUE = '#001C71';
const COAGRO_NAVY = '#002B49';
const COAGRO_GREEN = '#2F6A3A';
const COAGRO_ORANGE = '#F28A16';
const COAGRO_GOLD = '#FFB52E';

const initialsFromName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CO';

const safeValue = (value: string, fallback: string) => value.trim() || fallback;

/**
 * Modelo oficial de crachá: nome, foto, cargo, V institucional e logo.
 * A base segue a referência oficial do Marketing, sem ícones de segmento.
 */
export const CoagroBadgeTemplate = React.forwardRef<
  HTMLDivElement,
  CoagroIdentityTemplateProps
>(({ activeStore, name, role, photo, isPet }, ref) => {
  const displayName = safeValue(name, 'NOME DO COLABORADOR');
  const displayRole = safeValue(role, 'CARGO / FUNÇÃO');
  const badgeIsPet = isPet ?? activeStore.bandeira === 'COAGRO_PET';

  return (
    <div
      ref={ref}
      data-identity-template="COAGRO_BADGE"
      data-identity-status="official"
      style={{
        containerType: 'inline-size',
        backgroundColor: COAGRO_BLUE,
        color: '#ffffff',
        fontFamily: '"Exo 2", Arial, sans-serif',
        aspectRatio: '0.63 / 1',
      }}
      className="relative w-full max-w-[360px] overflow-hidden select-none shadow-xl"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { left: '-3%', top: '1%', size: '11.5cqw', rotate: '-6deg' },
          { left: '-2%', top: '12%', size: '11cqw', rotate: '3deg' },
          { left: '1%', top: '24%', size: '12cqw', rotate: '-4deg' },
          { left: '-4%', top: '37%', size: '11.5cqw', rotate: '2deg' },
          { left: '-2%', top: '50%', size: '11cqw', rotate: '-3deg' },
          { right: '-2%', top: '2%', size: '11.5cqw', rotate: '5deg' },
          { right: '-4%', top: '14%', size: '11cqw', rotate: '-3deg' },
          { right: '0%', top: '27%', size: '12cqw', rotate: '4deg' },
          { right: '-4%', top: '40%', size: '11.5cqw', rotate: '-2deg' },
          { right: '-1%', top: '53%', size: '11cqw', rotate: '3deg' },
        ].map((mark, index) => (
          <span
            key={index}
            className="absolute whitespace-nowrap font-extrabold tracking-tight text-[#1A3C86] opacity-[0.42]"
            style={{
              left: mark.left,
              right: mark.right,
              top: mark.top,
              fontSize: mark.size,
              transform: `rotate(${mark.rotate})`,
            }}
          >
            Coagro
          </span>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-0 h-[34%] bg-white" />

      <div
        aria-hidden="true"
        className="absolute left-0 right-0 top-[51%] z-[2] h-[26%]"
        style={{
          background: `linear-gradient(140deg, ${COAGRO_ORANGE} 0%, ${COAGRO_GOLD} 72%)`,
          clipPath: 'polygon(0 0, 50% 100%, 100% 0, 100% 33%, 50% 100%, 0 33%)',
        }}
      />

      <div className="absolute left-[7%] right-[7%] top-[3%] z-10 text-center">
        <p className="line-clamp-2 text-[6.4cqw] font-bold uppercase leading-[0.93] tracking-tight text-white">
          {displayName}
        </p>
      </div>

      <div className="absolute left-[24%] top-[12%] z-10 h-[35%] w-[52%] rounded-[2cqw] bg-white p-[1.4cqw] shadow-[0_1cqw_3cqw_rgba(4,12,44,0.28)]">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[1.2cqw] bg-slate-100 text-[7cqw] font-black text-slate-500">
          {photo ? (
            <img src={photo} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            initialsFromName(displayName)
          )}
        </div>
      </div>

      <div className="absolute left-[7%] right-[7%] top-[48%] z-10 text-center">
        <p
          className="line-clamp-2 text-[4.4cqw] font-medium uppercase leading-[1.05] tracking-wide text-white"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {displayRole}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 flex h-[27%] flex-col items-center justify-center px-[8%]">
        {badgeIsPet ? (
          <CoagroPetLogo className="h-auto w-[48%] max-w-[60%]" />
        ) : (
          <LogoHorizontalAzul className="h-[12cqw] w-auto max-w-[62%]" />
        )}
        <span
          className="mt-[1.6cqw] text-[2.8cqw] font-semibold uppercase tracking-[0.08em] text-[#002B49]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          A força do campo!
        </span>
      </div>
    </div>
  );
});

CoagroBadgeTemplate.displayName = 'CoagroBadgeTemplate';

/**
 * Modelo oficial de cartão de visita 9 × 5 cm. A frente concentra identidade e contato;
 * a composição é proporcional e os dados entram apenas em áreas homologadas.
 */
export const CoagroBusinessCardTemplate = React.forwardRef<
  HTMLDivElement,
  CoagroIdentityTemplateProps
>(({ activeStore, name, role, department, phone, email }, ref) => {
  const displayName = safeValue(name, 'NOME DO COLABORADOR');
  const displayRole = safeValue(role, 'CARGO / FUNÇÃO');
  const displayDepartment = safeValue(department, 'OPERAÇÕES COAGRO');

  return (
    <div
      ref={ref}
      data-identity-template="COAGRO_BUSINESS_CARD"
      data-identity-status="official"
      style={{
        containerType: 'inline-size',
        aspectRatio: '1.8 / 1',
        backgroundColor: COAGRO_NAVY,
        fontFamily: '"Exo 2", Arial, sans-serif',
      }}
      className="relative w-full overflow-hidden text-white shadow-xl"
    >
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 h-full w-[34%]"
        style={{
          backgroundColor: COAGRO_ORANGE,
          clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 0 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 h-full w-[29%]"
        style={{
          backgroundColor: COAGRO_GOLD,
          clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 18% 100%)',
          opacity: 0.92,
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-[6cqw]">
        <div className="flex items-start justify-between gap-3">
          <LogoHorizontalBranca className="h-[13cqw] w-auto max-w-[48%]" />
          <span className="rounded-[1cqw] bg-white px-[2.5cqw] py-[1.3cqw] font-mono text-[2.6cqw] font-black text-[#001C71]">
            {activeStore.cidade}/{activeStore.estado}
          </span>
        </div>

        <div className="max-w-[69%]">
          <p className="text-[5.2cqw] font-black leading-[0.95] tracking-tight">{displayName}</p>
          <p className="mt-[1.4cqw] text-[3.1cqw] font-bold uppercase tracking-wide text-[#FFB52E]">
            {displayRole}
          </p>
          <p className="mt-[2.7cqw] truncate text-[2.7cqw] font-semibold text-white/90">
            {displayDepartment} · {activeStore.nome}
          </p>
        </div>

        <div className="max-w-[75%] space-y-[0.8cqw] font-mono text-[2.55cqw] font-semibold text-white/90">
          <p className="truncate">☎ {safeValue(phone, activeStore.telefoneFormatado)}</p>
          <p className="truncate">✉ {safeValue(email, activeStore.gerenteEmail)}</p>
          <p className="truncate">⌂ {activeStore.cidade}/{activeStore.estado}</p>
        </div>

        <div className="absolute bottom-[5%] right-[5%] z-10 flex h-[24cqw] w-[24cqw] items-center justify-center rounded-[3cqw] bg-white/95 p-[3cqw] shadow-lg">
          <CoagroSimboloCasinha className="h-full w-full" />
        </div>
      </div>
    </div>
  );
});

CoagroBusinessCardTemplate.displayName = 'CoagroBusinessCardTemplate';

export interface CoagroProfileTemplateProps extends CoagroIdentityTemplateProps {
  zoom: number;
  offsetX: number;
  offsetY: number;
  showBadge: boolean;
  isPet?: boolean;
}

export interface CoagroEmailSignatureTemplateProps extends CoagroIdentityTemplateProps {
  zoom: number;
  offsetX: number;
  offsetY: number;
  isPet?: boolean;
}

const ProfilePhotoLayer: React.FC<{
  photo?: string | null;
  name: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
}> = ({ photo, name, zoom, offsetX, offsetY }) => (
  <div className="absolute inset-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_45%,#0E62C7_0%,#08479D_58%,#002266_100%)]">
    {photo ? (
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <img src={photo} alt={name} className="h-full w-full object-cover" />
      </div>
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="flex h-[21cqw] w-[21cqw] items-center justify-center rounded-full bg-white/10 text-[6cqw] font-black">
          {initialsFromName(name)}
        </div>
        <span className="mt-[4cqw] text-[2.1cqw] font-semibold uppercase tracking-[0.18em] text-[#FFAB00]">
          Foto do colaborador
        </span>
      </div>
    )}
  </div>
);

const ContactIcon: React.FC<{ type: 'phone' | 'mail' | 'facebook' | 'instagram' | 'globe' }> = ({
  type,
}) => {
  const paths: Record<typeof type, React.ReactNode> = {
    phone: (
      <path d="M7.2 3.4 9 7.2l-2 1.7c1 2.1 2.7 3.8 4.8 4.8l1.7-2 3.8 1.8-.7 3.2c-.2.9-1 1.5-1.9 1.4C8.1 17.3 2.7 11.9 1.9 4.3c-.1-.9.5-1.7 1.4-1.9l3.2-.7Z" />
    ),
    mail: (
      <path d="M3 5.5h18v13H3v-13Zm2 1.4v.4l7 5 7-5v-.4H5Zm14 2.1-7 5-7-5v8.1h14v-8.1Z" />
    ),
    facebook: (
      <path d="M13.4 21v-7.4h2.5l.4-2.9h-2.9v-1.8c0-.8.2-1.4 1.5-1.4h1.6V4.9c-.3 0-1.2-.1-2.2-.1-2.3 0-3.8 1.4-3.8 4v2h-2.6v2.9h2.6V21h2.9Z" />
    ),
    instagram: (
      <path d="M12 4.5c2.4 0 2.7 0 3.6.1.9 0 1.4.2 1.8.3.4.2.7.4 1 .7.3.3.5.6.7 1 .1.4.3.9.3 1.8.1.9.1 1.2.1 3.6s0 2.7-.1 3.6c0 .9-.2 1.4-.3 1.8-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.4.1-.9.3-1.8.3-.9.1-1.2.1-3.6.1s-2.7 0-3.6-.1c-.9 0-1.4-.2-1.8-.3-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.1-.4-.3-.9-.3-1.8-.1-.9-.1-1.2-.1-3.6s0-2.7.1-3.6c0-.9.2-1.4.3-1.8.2-.4.4-.7.7-1 .3-.3.6-.5 1-.7.4-.1.9-.3 1.8-.3.9-.1 1.2-.1 3.6-.1ZM12 3c-2.4 0-2.8 0-3.7.1-.9 0-1.6.2-2.2.5-.6.2-1.1.5-1.6 1-.5.5-.8 1-1 1.6-.3.6-.4 1.3-.5 2.2C3 9.2 3 9.6 3 12s0 2.8.1 3.7c0 .9.2 1.6.5 2.2.2.6.5 1.1 1 1.6.5.5 1 .8 1.6 1 .6.3 1.3.4 2.2.5.9.1 1.3.1 3.7.1s2.8 0 3.7-.1c.9 0 1.6-.2 2.2-.5.6-.2 1.1-.5 1.6-1 .5-.5.8-1 1-1.6.3-.6.4-1.3.5-2.2.1-.9.1-1.3.1-3.7s0-2.8-.1-3.7c0-.9-.2-1.6-.5-2.2-.2-.6-.5-1.1-1-1.6-.5-.5-1-.8-1.6-1-.6-.3-1.3-.4-2.2-.5C14.8 3 14.4 3 12 3Zm0 4.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.9-7.8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z" />
    ),
    globe: (
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3.1a15 15 0 0 0-1.3-5 8 8 0 0 1 4.4 5ZM12 4c.9 1.1 2.2 3.5 2.7 7H9.3C9.8 7.5 11.1 5.1 12 4ZM9.5 6a15 15 0 0 0-1.3 5H5.1a8 8 0 0 1 4.4-5ZM5.1 13h3.1a15 15 0 0 0 1.3 5 8 8 0 0 1-4.4-5Zm4.2 0C9.8 16.5 11.1 18.9 12 20c.9-1.1 2.2-3.5 2.7-7H9.3Zm8.5 0a8 8 0 0 1-4.4 5 15 15 0 0 0 1.3-5h3.1Z" />
    ),
  };

  return (
    <span className="flex h-[2.5cqw] w-[2.5cqw] shrink-0 items-center justify-center rounded-full bg-[#FFAB00] text-[#001C71]">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[1.45cqw] w-[1.45cqw]">
        {paths[type]}
      </svg>
    </span>
  );
};

/**
 * Perfil institucional 1:1. O bloco é um template de marca, não um editor:
 * todos os elementos são posicionados em percentuais seguros do container.
 */
export const CoagroProfileTemplate = React.forwardRef<
  HTMLDivElement,
  CoagroProfileTemplateProps
>(({ activeStore, name, role, photo, zoom, offsetX, offsetY, showBadge, isPet }, ref) => {
  const displayName = safeValue(name, 'Kaio Araújo');
  const displayRole = safeValue(role, 'Analista de Marketing');

  return (
    <div
      ref={ref}
      data-identity-template="COAGRO_PROFILE"
      data-identity-status="official"
      style={{
        containerType: 'inline-size',
        background: 'radial-gradient(circle at 50% 44%, #083B82 0%, #001C71 58%, #001247 100%)',
        fontFamily: '"Exo 2", sans-serif',
      }}
      className="relative w-full aspect-square overflow-hidden text-white select-none"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        {[
          { left: '1%', top: '5%', size: '7.2cqw', rotate: '-4deg' },
          { left: '0%', top: '18%', size: '7.6cqw', rotate: '2deg' },
          { left: '1%', top: '31%', size: '7cqw', rotate: '-3deg' },
          { left: '2%', top: '44%', size: '7.8cqw', rotate: '1deg' },
          { left: '1%', top: '57%', size: '7.2cqw', rotate: '-4deg' },
          { left: '0%', top: '70%', size: '7.8cqw', rotate: '2deg' },
          { left: '1%', top: '83%', size: '7cqw', rotate: '-2deg' },
          { left: '2%', top: '95%', size: '7.4cqw', rotate: '1deg' },
          { right: '1%', top: '6%', size: '7.2cqw', rotate: '4deg' },
          { right: '0%', top: '19%', size: '7.6cqw', rotate: '-2deg' },
          { right: '1%', top: '32%', size: '7cqw', rotate: '3deg' },
          { right: '2%', top: '45%', size: '7.8cqw', rotate: '-1deg' },
          { right: '1%', top: '58%', size: '7.2cqw', rotate: '4deg' },
          { right: '0%', top: '71%', size: '7.8cqw', rotate: '-2deg' },
          { right: '1%', top: '84%', size: '7cqw', rotate: '2deg' },
          { right: '2%', top: '96%', size: '7.4cqw', rotate: '-1deg' },
        ].map((mark, index) => (
          <span
            key={index}
            className="absolute whitespace-nowrap font-extrabold tracking-tight text-[#2B5EB3] opacity-20"
            style={{
              left: mark.left,
              right: mark.right,
              top: mark.top,
              fontSize: mark.size,
              transform: `rotate(${mark.rotate})`,
            }}
          >
            Coagro
          </span>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="absolute -left-[5.5%] top-[2%] h-[5.1%] w-[26%] rounded-full bg-[#FFAB00]"
        style={{ transform: 'rotate(-32deg)' }}
      />
      <div
        aria-hidden="true"
        className="absolute -left-[4.6%] top-[8%] h-[5.9%] w-[27%] rounded-full bg-[#389838]"
        style={{ transform: 'rotate(-32deg)' }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[2%] -right-[7%] h-[17%] w-[30%] rounded-[3cqw] bg-[#389838]"
        style={{ transform: 'rotate(-32deg)' }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[1%] -right-[9%] h-[5%] w-[25%] rounded-full bg-[#FFAB00]"
        style={{ transform: 'rotate(-32deg)' }}
      />

      <div className="absolute right-[3.5%] top-[5%] z-30 w-[23%]">
        {isPet ? (
          <div className="rounded-[1.5cqw] bg-white/95 p-[1.2cqw]">
            <CoagroPetLogo className="h-auto w-full" />
          </div>
        ) : (
          <LogoHorizontalBranca className="h-auto w-full" />
        )}
      </div>

      <div className="absolute left-1/2 top-[44%] z-20 aspect-square w-[73.33%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
        <ProfilePhotoLayer photo={photo} name={displayName} zoom={zoom} offsetX={offsetX} offsetY={offsetY} />
      </div>

      <svg
        aria-hidden="true"
        viewBox="0 0 1080 1080"
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      >
        <circle cx="540" cy="475" r="420" fill="none" stroke="#FFAB00" strokeWidth="22" strokeDasharray="1319.47 1319.47" transform="rotate(180 540 475)" />
        <circle cx="540" cy="475" r="420" fill="none" stroke="#389838" strokeWidth="22" strokeDasharray="1319.47 1319.47" />
        <circle cx="540" cy="475" r="396" fill="none" stroke="#FFFFFF" strokeWidth="6" />
      </svg>

      {showBadge && (
        <div className="absolute left-1/2 top-[74.26%] z-30 flex h-[14.63%] w-[63.33%] -translate-x-1/2 flex-col items-center justify-center overflow-hidden rounded-full border-[0.74cqw] border-[#FFAB00] bg-[#001858] px-[4%] text-center shadow-[0_1.1cqw_3cqw_rgba(0,10,38,0.28)]">
          <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[5.7cqw] font-bold leading-none text-white">
            {displayName}
          </span>
          <span
            className="mt-[1.6cqw] max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[3.25cqw] font-medium leading-none text-[#FFAB00]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {displayRole}
          </span>
        </div>
      )}
    </div>
  );
});

CoagroProfileTemplate.displayName = 'CoagroProfileTemplate';

/**
 * Assinatura horizontal de e-mail. Mantém margem segura de 5% nas laterais e
 * usa apenas elementos do sistema Coagro para permanecer determinística.
 */
export const CoagroEmailSignatureTemplate = React.forwardRef<
  HTMLDivElement,
  CoagroEmailSignatureTemplateProps
>(({ activeStore, name, role, phone, email, photo, zoom, offsetX, offsetY, isPet }, ref) => {
  const displayName = safeValue(name, 'Kaio Araújo');
  const displayRole = safeValue(role, 'Analista de Marketing');
  const displayPhone = safeValue(phone, activeStore.telefoneFormatado);
  const displayEmail = safeValue(email, activeStore.gerenteEmail);

  return (
    <div
      ref={ref}
      data-identity-template="COAGRO_EMAIL_SIGNATURE"
      data-identity-status="official"
      style={{
        containerType: 'inline-size',
        aspectRatio: '4.03 / 1',
        background: 'radial-gradient(circle at 42% 38%, #083B82 0%, #001C71 54%, #001247 100%)',
        fontFamily: '"Exo 2", sans-serif',
      }}
      className="relative w-full overflow-hidden text-white select-none"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { left: '0%', top: '8%', size: '7.4cqw' },
          { left: '0%', top: '37%', size: '7.8cqw' },
          { left: '0%', top: '67%', size: '7.2cqw' },
          { right: '1%', top: '13%', size: '7.4cqw' },
          { right: '0%', top: '42%', size: '7.8cqw' },
          { right: '1%', top: '72%', size: '7.2cqw' },
        ].map((mark, index) => (
          <span
            key={index}
            className="absolute whitespace-nowrap font-extrabold tracking-tight text-[#2B5EB3] opacity-[0.16]"
            style={{
              left: mark.left,
              right: mark.right,
              top: mark.top,
              fontSize: mark.size,
            }}
          >
            Coagro
          </span>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="absolute -left-[1%] -top-[16%] h-[20%] w-[6.5%] rounded-full bg-[#FFAB00]"
        style={{ transform: 'rotate(-32deg)' }}
      />
      <div
        aria-hidden="true"
        className="absolute -left-[1.5%] -top-[4%] h-[22%] w-[7%] rounded-full bg-[#389838]"
        style={{ transform: 'rotate(-32deg)' }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[57%] right-[8%] h-[53%] w-[25%] rounded-full bg-[#FFAB00]"
        style={{ transform: 'rotate(-32deg)' }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[71%] right-[2%] h-[66%] w-[26%] rounded-full bg-[#389838]"
        style={{ transform: 'rotate(-32deg)' }}
      />

      <div className="absolute left-[7.5%] top-[12%] z-20 w-[58%]">
        <h2 className="line-clamp-2 text-[4.35cqw] font-bold leading-[0.92] tracking-tight text-white">
          {displayName}
        </h2>
        <p
          className="mt-[1.3cqw] truncate text-[2.5cqw] font-semibold leading-none text-[#FFAB00]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {displayRole}
        </p>

        <div
          className="mt-[2.2cqw] space-y-[1.05cqw] text-[1.95cqw] font-medium text-white"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <div className="flex items-center gap-[1.1cqw]">
            <ContactIcon type="phone" />
            <span className="truncate">{displayPhone}</span>
          </div>
          <div className="flex items-center gap-[1.1cqw]">
            <ContactIcon type="mail" />
            <span className="truncate">{displayEmail}</span>
          </div>
          <div className="flex items-center gap-[2.1cqw]">
            <div className="flex items-center gap-[1cqw]">
              <ContactIcon type="facebook" />
              <span className="font-semibold">@grupocoagro</span>
            </div>
            <div className="flex items-center gap-[1cqw]">
              <ContactIcon type="globe" />
              <span className="font-semibold">{COAGRO_CORPORATE_INFO.website}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-[5%] top-[4%] z-20 aspect-square w-[21%]">
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <ProfilePhotoLayer photo={photo} name={displayName} zoom={zoom} offsetX={offsetX} offsetY={offsetY} />
        </div>
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <circle cx="50" cy="50" r="47" fill="none" stroke="#FFAB00" strokeWidth="5" strokeDasharray="147.65 147.65" transform="rotate(180 50 50)" />
          <circle cx="50" cy="50" r="47" fill="none" stroke="#389838" strokeWidth="5" strokeDasharray="147.65 147.65" />
          <circle cx="50" cy="50" r="43" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
        </svg>
      </div>

      <div className="absolute bottom-0 right-0 z-30 h-[30%] w-[34%] bg-white" style={{ clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0 100%)' }}>
        <div className="absolute bottom-[8%] right-[5%] w-[52%]">
          {isPet ? (
            <CoagroPetLogo className="h-auto w-full" />
          ) : (
            <LogoHorizontalAzul className="h-auto w-full" />
          )}
          <p
            className="mt-[1.1cqw] text-right text-[0.95cqw] font-semibold leading-none text-[#002B49]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Presente no campo e na sua vida
          </p>
        </div>
      </div>
    </div>
  );
});

CoagroEmailSignatureTemplate.displayName = 'CoagroEmailSignatureTemplate';

export const CoagroIdentityPreviewMark: React.FC = () => (
  <div className="flex items-center gap-2 text-[#002B49]">
    <LogoVerticalBranca className="h-8 w-auto rounded bg-[#002B49] p-1" />
    <span className="text-[10px] font-black uppercase tracking-[0.18em]">
      Identidade oficial
    </span>
  </div>
);
