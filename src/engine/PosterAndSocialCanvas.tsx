// src/engine/PosterAndSocialCanvas.tsx
import React from 'react';
import {
    OfferItemState,
    TenantBrandKit,
    VisualThemePreset,
    PrintGridFormat,
    SocialAspectRatio,
    BatchParsedRow,
    PosterLayoutArchetype,
    CarouselSlideItem,
    HrNoticeState,
    COAGRO_OFFICIAL_POSTER_ARCHETYPE,
} from '../core/types';
import {
    getContrastRatio,
    resolveAccessibleTextColor,
    generateHrForensicId,
} from '../core/businessRules';
import { resolveRenderSpec } from '../core/resolve';
import {
    LogoHorizontalAzul,
    LogoHorizontalBranca,
    LogoHorizontalMonoBranca,
    LogoHorizontalMonoPreta,
    CoagroPetLogo,
} from '../ui/coagroLogos';

// ============================================================================
// 1. RESOLUTOR DE PALETA DE CORES WHITE-LABEL (TEMA P&B, MARCA 1, MARCA 2)
// ============================================================================
interface ResolvedPalette {
    isBlackAndWhite: boolean;
    headerBg: string;
    headerText: string;
    canvasBg: string;
    canvasText: string;
    accentBg: string;
    accentText: string;
    priceText: string;
    borderClass: string;
}

export function resolveThemePalette(
    theme: VisualThemePreset,
    brandKit: TenantBrandKit
): ResolvedPalette {
    const activeDept =
        brandKit.departments.find((d) => d.id === brandKit.activeDepartmentId) ||
        brandKit.departments[0];
    const activeCampaign =
        brandKit.seasonalCampaigns.find((c) => c.id === brandKit.activeCampaignId) ||
        brandKit.seasonalCampaigns[0];

    if (theme === 'BW_ECO_TONER') {
        const headerBg = '#000000';
        const canvasBg = '#FFFFFF';
        const accentBg = '#000000';
        return {
            isBlackAndWhite: true,
            headerBg,
            headerText: resolveAccessibleTextColor(headerBg),
            canvasBg,
            canvasText: resolveAccessibleTextColor(canvasBg),
            accentBg,
            accentText: resolveAccessibleTextColor(accentBg),
            priceText: resolveAccessibleTextColor(canvasBg),
            borderClass: 'border-2',
        };
    }

    if (theme === 'BRAND_SECONDARY') {
        const headerBg = activeDept?.secondaryColorHex || '#1e3a8a';
        const canvasBg = '#FFFFFF';
        const accentBg = activeDept?.accentColorHex || '#f59e0b';
        const canvasText = resolveAccessibleTextColor(canvasBg);
        return {
            isBlackAndWhite: false,
            headerBg,
            headerText: resolveAccessibleTextColor(headerBg),
            canvasBg,
            canvasText,
            accentBg,
            accentText: resolveAccessibleTextColor(accentBg),
            priceText: getContrastRatio(headerBg, canvasBg) >= 3 ? headerBg : canvasText,
            borderClass: 'border-2',
        };
    }

    if (theme === 'HIGH_CONTRAST_ALERT') {
        const headerBg = brandKit.alertPrimaryColorHex || '#b91c1c';
        const canvasBg = '#FFFFFF';
        const accentBg = brandKit.alertAccentColorHex || '#facc15';
        const canvasText = resolveAccessibleTextColor(canvasBg);
        return {
            isBlackAndWhite: false,
            headerBg,
            headerText: resolveAccessibleTextColor(headerBg),
            canvasBg,
            canvasText,
            accentBg,
            accentText: resolveAccessibleTextColor(accentBg),
            priceText: getContrastRatio(headerBg, canvasBg) >= 3 ? headerBg : canvasText,
            borderClass: 'border-2',
        };
    }

    if (theme === 'CAMPAIGN_SEASONAL' && activeCampaign) {
        const headerBg = activeCampaign.primaryColorHex;
        const canvasBg = '#FFFFFF';
        const accentBg = activeCampaign.accentColorHex;
        const canvasText = resolveAccessibleTextColor(canvasBg);
        return {
            isBlackAndWhite: false,
            headerBg,
            headerText: resolveAccessibleTextColor(headerBg),
            canvasBg,
            canvasText,
            accentBg,
            accentText: resolveAccessibleTextColor(accentBg),
            priceText: getContrastRatio(headerBg, canvasBg) >= 3 ? headerBg : canvasText,
            borderClass: 'border-2',
        };
    }

    // Default: BRAND_PRIMARY (Usa a cor do departamento ativo configurado no BrandKit White-Label)
    const headerBg = activeDept?.primaryColorHex || '#064e3b';
    const canvasBg = '#FFFFFF';
    const accentBg = activeDept?.accentColorHex || '#f59e0b';
    const canvasText = resolveAccessibleTextColor(canvasBg);

    return {
        isBlackAndWhite: false,
        headerBg,
        headerText: resolveAccessibleTextColor(headerBg),
        canvasBg,
        canvasText,
        accentBg,
        accentText: resolveAccessibleTextColor(accentBg),
        priceText: getContrastRatio(headerBg, canvasBg) >= 3 ? headerBg : canvasText,
        borderClass: 'border-2',
    };
}

const OfficialBrandLogo: React.FC<{
    brandKit: TenantBrandKit;
    theme: VisualThemePreset;
    palette: ResolvedPalette;
    className?: string;
}> = ({ brandKit, theme, palette, className = 'h-[7cqw] w-auto' }) => {
    if (theme === 'BW_ECO_TONER') {
        return <LogoHorizontalMonoBranca className={`${className} shrink-0`} />;
    }

    if (brandKit.activeDepartmentId === 'dept-2') {
        return <CoagroPetLogo className={`${className} shrink-0`} />;
    }

    return palette.headerText === '#000000' ? (
        <LogoHorizontalAzul className={`${className} shrink-0`} />
    ) : (
        <LogoHorizontalBranca className={`${className} shrink-0`} />
    );
};

// ============================================================================
// 2. UNIDADE INDIVIDUAL DE CARTAZ DE LOJA (4 ARQUÉTIPOS DE LAYOUT WHITE-LABEL)
// ============================================================================
interface SingleStorePosterUnitProps {
    offer: OfferItemState;
    brandKit: TenantBrandKit;
    theme: VisualThemePreset;
    layoutArchetype?: PosterLayoutArchetype;
    showDiscountBadge: boolean;
    showPricePerMeasure: boolean;
    isA5Half?: boolean;
    isGondola?: boolean;
}

export const SingleStorePosterUnit: React.FC<SingleStorePosterUnitProps> = ({
    offer,
    brandKit,
    theme,
    layoutArchetype = 'PROMO_CLASSIC_V',
    showDiscountBadge,
    showPricePerMeasure,
    isA5Half = false,
    isGondola = false,
}) => {
    const { metrics, typography } = resolveRenderSpec(
        offer,
        brandKit,
        theme,
        undefined,
        isA5Half,
        isGondola
    );
    const palette = resolveThemePalette(theme, brandKit);
    const activeCampaign =
        brandKit.seasonalCampaigns.find((c) => c.id === brandKit.activeCampaignId) ||
        brandKit.seasonalCampaigns[0];
    const isCompact = isA5Half || isGondola;
    const isHighRisk = Boolean(metrics.legalFooter.isHighRiskRegulated);
    const stylePreset = brandKit.visualStylePreset || 'RETAIL_POP';
    const displayTitle =
        metrics.condensedTitle || offer.cleanedTitle || offer.rawTitle || 'PRODUTO EM OFERTA';

    const isMinimal = stylePreset === 'MINIMAL_BOUTIQUE';
    const isBrutalist = stylePreset === 'AGRO_BRUTALIST';
    const brutalistClipPath = isBrutalist
        ? 'polygon(0 0, calc(100% - 2.2cqw) 0, 100% 2.2cqw, 100% 100%, 2.2cqw 100%, 0 calc(100% - 2.2cqw))'
        : undefined;

    const containerShapeClass =
        isMinimal
            ? 'rounded-none border border-slate-200 p-[1.5cqw]'
            : isBrutalist
              ? 'rounded-none border-4 border-slate-950'
              : 'rounded-none';

    // Rodapé Core Obrigatório (Despoluído para não competir com o preço: MAPA/CONAR + SKU + Vigência + ID Forense + Logo/Marca)
    const renderCoreGovernanceFooter = () => (
        <div
            style={{ fontFamily: brandKit.fontBody }}
            data-sku-code={offer.skuCode || undefined}
            data-brand-name={brandKit.companyName}
            data-font-heading={brandKit.fontHeading}
            data-font-body={brandKit.fontBody}
            className="w-full mt-auto shrink-0"
        >
            {/* Faixa de Compliance MAPA / Veterinário / Sementes / Validade Próxima (Exibida apenas quando há aviso regulatório real) */}
            {(metrics.legalFooter.isHighRiskRegulated || Boolean(metrics.legalFooter.badgeWarning)) && (
                <div
                    style={{ borderColor: palette.headerBg }}
                    className={`text-center border-t ${
                        isCompact ? 'px-[2.5cqw] py-[0.6cqw]' : 'px-[3.5cqw] py-[0.95cqw]'
                    } ${
                        palette.isBlackAndWhite
                            ? 'bg-zinc-100 text-black'
                            : metrics.legalFooter.bannerColorClass
                    }`}
                >
                    <div
                        className={`font-black uppercase tracking-wider ${
                            isCompact ? 'text-[1.65cqw]' : 'text-[2cqw]'
                        }`}
                    >
                        ⚠ {metrics.legalFooter.badgeWarning}
                    </div>
                    <p
                        className={`font-bold leading-tight uppercase ${
                            isCompact ? 'text-[1.2cqw]' : 'text-[1.45cqw]'
                        }`}
                    >
                        {metrics.legalFooter.mandatoryLegalText}
                    </p>
                </div>
            )}

            {/* Rodapé Técnico Discreto com Elementos Core (SKU + Vigência PROCON + WhatsApp Filial + Identidade Vetorial Coagro) */}
            <div
                data-forensic-id={metrics.forensicId}
                style={{ borderColor: isMinimal ? '#e2e8f0' : palette.headerBg }}
                className={`${
                    isMinimal ? 'border-t' : 'border-t-[0.3cqw]'
                } flex items-center justify-between gap-[2cqw] ${
                    isCompact ? 'px-[3cqw] py-[1.1cqw]' : 'px-[4.2cqw] py-[1.8cqw]'
                }`}
            >
                <div className="flex flex-col text-left leading-tight min-w-0">
                    <span
                        style={{ fontFamily: brandKit.fontHeading }}
                        className={`font-extrabold uppercase tracking-wide truncate opacity-90 ${
                            isCompact ? 'text-[1.8cqw]' : 'text-[2.25cqw]'
                        }`}
                    >
                        {offer.ctaText?.replace(/\s*(ou peça pelo WhatsApp!?|no WhatsApp!?)/gi, '') || 'OFERTA EXCLUSIVA NA LOJA'}
                    </span>
                    <span
                        className={`font-mono tabular-nums font-semibold opacity-75 truncate ${
                            isCompact ? 'text-[1.45cqw] mt-[0.15cqw]' : 'text-[1.75cqw] mt-[0.25cqw]'
                        }`}
                    >
                        {offer.skuCode ? `CÓD: ${offer.skuCode} • ` : ''}
                        {metrics.validityFormatted}
                    </span>
                </div>

                {/* Canal de Atendimento com Ícone do WhatsApp + Telefone Formatado da Filial Ativa */}
                {brandKit.defaultPhoneWhatsapp && (
                    <div className="flex items-center gap-[0.7cqw] text-left opacity-90 shrink-0">
                        <svg
                            className={`${isCompact ? 'w-[2.2cqw] h-[2.2cqw]' : 'w-[2.8cqw] h-[2.8cqw]'} shrink-0 text-[#25D366] fill-current`}
                            viewBox="0 0 24 24"
                        >
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.158-.535-1.516-.628-2.502-2.138-2.579-2.241-.077-.102-.62-.824-.62-1.572 0-.749.393-1.118.533-1.27.14-.153.306-.192.408-.192.102 0 .204.001.294.006.094.004.22-.036.345.263.129.311.442 1.076.48 1.153.039.077.065.167.013.27-.052.102-.078.167-.154.256-.076.09-.16.2-.229.27-.077.078-.157.162-.068.315.089.153.396.654.85 1.059.584.521 1.077.682 1.23.759.154.077.244.065.334-.038.09-.103.385-.448.487-.601.103-.154.205-.128.346-.077.141.051.895.422 1.049.499.154.077.256.115.294.18.038.064.038.371-.106.776zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.306A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
                        </svg>
                        <div className="flex flex-col leading-tight">
                            <span className={`font-black tracking-tight ${isCompact ? 'text-[1.2cqw]' : 'text-[1.5cqw]'}`}>
                                {brandKit.defaultBranchName || 'Loja Coagro'}
                            </span>
                            <span className={`font-mono font-bold ${isCompact ? 'text-[1.2cqw]' : 'text-[1.5cqw]'}`}>
                                {brandKit.defaultPhoneWhatsapp}
                            </span>
                        </div>
                    </div>
                )}

                {/* Identidade Oficial Vetorizada da Coagro no Canto Inferior Direito */}
                <div className="shrink-0 flex flex-col items-end justify-center">
                    {brandKit.defaultLogoUrl ? (
                        <img
                            src={brandKit.defaultLogoUrl}
                            alt={brandKit.companyName}
                            className={`${isCompact ? 'h-[4.2cqw]' : 'h-[5.8cqw]'} object-contain`}
                        />
                    ) : theme === 'BW_ECO_TONER' ? (
                        <LogoHorizontalMonoPreta className={`${isCompact ? 'h-[3.6cqw]' : 'h-[4.8cqw]'} w-auto`} />
                    ) : brandKit.activeDepartmentId === 'dept-2' ? (
                        <CoagroPetLogo className={`${isCompact ? 'h-[3.6cqw]' : 'h-[4.8cqw]'} w-auto`} />
                    ) : (
                        <LogoHorizontalAzul className={`${isCompact ? 'h-[3.6cqw]' : 'h-[4.8cqw]'} w-auto`} />
                    )}
                </div>
            </div>
        </div>
    );

// ========================================================================
// 5 ARQUÉTIPOS OFICIAIS DE CARTAZES DE LOJA (GEOMETRIA ESTRUTURAL DISTINTA)
// ========================================================================

// ---------- PROMO_MODERN_V: Header pílula flutuante + card de preço alto contraste ----------
if (layoutArchetype === 'PROMO_MODERN_V') {
    const priceCardBg = palette.isBlackAndWhite ? '#000000' : '#0F172A';
    const priceCardText = palette.isBlackAndWhite ? '#FFFFFF' : '#FACC15';
    return (
        <div
            style={{
                containerType: 'inline-size',
                backgroundColor: palette.canvasBg,
                color: palette.canvasText,
                borderColor: palette.headerBg,
                fontFamily: brandKit.fontHeading,
            }}
            data-poster-template="PROMO_MODERN_V"
            data-guardrail-status={metrics.guardrailStatus}
            data-effective-price={metrics.effectiveUnitPrice.toFixed(2)}
            data-price-per-measure={metrics.pricePerKgOrLiterText ? metrics.pricePerKgOrLiterText : undefined}
            className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none ${palette.borderClass} ${containerShapeClass}`}
        >
            {/* Header em pílula flutuante arredondada (não colada no topo) */}
            <div className={`w-full flex justify-center shrink-0 ${isCompact ? 'px-[3cqw] py-[2cqw]' : 'px-[4cqw] py-[3cqw]'}`}>
                <div
                    style={{
                        backgroundColor: palette.headerBg,
                        color: palette.headerText,
                    }}
                    className={`inline-flex items-center gap-[1.5cqw] rounded-full px-[4cqw] py-[1.2cqw] shadow-md shrink-0 ${
                        isCompact
                            ? 'text-[3.2cqw]'
                            : 'text-[4.4cqw]'
                    } font-black uppercase tracking-tight leading-none`}
                >
                    {theme === 'CAMPAIGN_SEASONAL' && activeCampaign?.badgeLogoUrl && (
                        <img
                            src={activeCampaign.badgeLogoUrl}
                            alt={activeCampaign.name}
                            className={`${isCompact ? 'h-[3cqw]' : 'h-[4.2cqw]'} object-contain shrink-0`}
                        />
                    )}
                    <span>{offer.headerLabel || 'OFERTA'}</span>
                </div>
            </div>

            {/* Título com line-clamp-2, leading-tight, tracking-tight */}
            <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'px-[4cqw] my-auto' : 'px-[5cqw] my-auto'}`}>
                <h2 className={`font-black tracking-tight leading-tight ${typography.titleScaleClass} line-clamp-2`}>
                    {displayTitle}
                </h2>
                {offer.subtitle && (
                    <p style={{ fontFamily: brandKit.fontBody }} className={`font-semibold opacity-75 line-clamp-1 ${isCompact ? 'mt-[0.5cqw] text-[2.2cqw]' : 'mt-[1.2cqw] text-[3cqw]'}`}>
                        {offer.subtitle}
                    </p>
                )}
            </div>

            {/* Bloco de preço centralizado em card de alto contraste (rounded-2xl) */}
            <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'px-[3.5cqw] my-auto' : 'px-[5cqw] my-auto'}`}>
                <div
                    style={{
                        backgroundColor: priceCardBg,
                        color: priceCardText,
                        borderColor: palette.headerBg,
                    }}
                    className={`w-full rounded-[2.2cqw] border-[0.5cqw] flex flex-col items-center justify-center overflow-hidden ${isCompact ? 'py-[2.2cqw] px-[3cqw]' : 'py-[3.6cqw] px-[4.5cqw]'}`}
                >
                    {showDiscountBadge && metrics.discountPercentage > 0 && (
                        <div style={{ backgroundColor: palette.accentBg, color: palette.accentText }} className={`rounded-full font-black uppercase tracking-wider ${isCompact ? 'px-[2.5cqw] py-[0.4cqw] text-[2.6cqw] mb-[0.8cqw]' : 'px-[4.2cqw] py-[1cqw] text-[3.8cqw] mb-[2cqw]'}`}>
                            {metrics.discountPercentage}% OFF
                        </div>
                    )}
                    {offer.priceFrom && offer.priceFrom > metrics.effectiveUnitPrice && (
                        <>
                            <div className="relative inline-flex items-center justify-center px-[2cqw] mb-[0.6cqw]">
                                <span className={`font-extrabold opacity-70 tracking-tight ${isCompact ? 'text-[3.2cqw]' : 'text-[4.5cqw]'}`}>
                                    DE R$ {offer.priceFrom.toFixed(2).replace('.', ',')}
                                </span>
                                <span className={`absolute inset-x-0 top-1/2 h-[0.35cqw] -rotate-6 rounded-full ${palette.isBlackAndWhite ? 'bg-black/80' : 'bg-red-600/85'}`} />
                            </div>
                            <span className={`font-black uppercase tracking-wider ${isCompact ? 'text-[2.5cqw] mt-[0.3cqw]' : 'text-[3.8cqw] mt-[0.5cqw]'}`}>POR</span>
                        </>
                    )}
                    <div style={{ color: priceCardText }} className={`flex items-baseline justify-center leading-none tabular-nums ${isCompact ? 'mt-[0.5cqw]' : 'mt-[1cqw]'}`} data-price-integer={metrics.integerPart} data-price-cents={metrics.centsPart}>
                        <span className={`font-extrabold mr-[0.8cqw] tracking-tighter ${isCompact ? 'text-[3.8cqw]' : 'text-[5.5cqw]'}`}>R$</span>
                        <span style={{ fontSize: typography.integerPriceFontSizeCqw, lineHeight: 0.82 }} className="font-black tracking-tighter tabular-nums">{metrics.integerPart}</span>
                        <div className="flex flex-col items-start ml-[0.6cqw]">
                            <span className={`font-black leading-none tracking-tight tabular-nums ${isCompact ? 'text-[5.6cqw]' : 'text-[8.8cqw]'}`}>,{metrics.centsPart}</span>
                            {offer.unit && offer.unit !== 'UN' && (
                                <span className={`font-extrabold uppercase opacity-80 ${isCompact ? 'text-[1.9cqw] mt-[0.3cqw]' : 'text-[2.7cqw] mt-[0.5cqw]'}`}>/{offer.unit}</span>
                            )}
                        </div>
                    </div>
                    {showPricePerMeasure && metrics.pricePerKgOrLiterText && (
                        <div style={{ fontFamily: brandKit.fontBody }} className={`font-bold uppercase tracking-wide opacity-85 ${isCompact ? 'mt-[0.8cqw] text-[1.9cqw]' : 'mt-[1.6cqw] text-[2.5cqw]'}`}>{metrics.pricePerKgOrLiterText}</div>
                    )}
                </div>
            </div>

            {renderCoreGovernanceFooter()}
        </div>
    );
}

// ---------- CLEAN_DIRECT_PRICE: Espaço negativo, preço com ≥45% do peso visual vertical ----------
if (layoutArchetype === 'CLEAN_DIRECT_PRICE') {
    return (
        <div
            style={{
                containerType: 'inline-size',
                backgroundColor: palette.canvasBg,
                color: palette.canvasText,
                borderColor: palette.headerBg,
                fontFamily: brandKit.fontHeading,
            }}
            data-poster-template="CLEAN_DIRECT_PRICE"
            data-guardrail-status={metrics.guardrailStatus}
            data-effective-price={metrics.effectiveUnitPrice.toFixed(2)}
            data-price-per-measure={metrics.pricePerKgOrLiterText ? metrics.pricePerKgOrLiterText : undefined}
            className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none ${palette.borderClass} ${containerShapeClass}`}
        >
            {/* Topo limpo com moldura arquitetônica */}
            <div style={{ borderColor: palette.headerBg }} className={`w-full border-b-[0.55cqw] flex items-center justify-between gap-[2cqw] shrink-0 ${isCompact ? 'px-[3.2cqw] py-[1.6cqw]' : 'px-[4.5cqw] py-[2.6cqw]'}`}>
                <div className="flex items-center gap-[1.5cqw] min-w-0">
                    <span style={{ backgroundColor: palette.headerBg, color: palette.headerText }} className={`font-black uppercase tracking-wider rounded-[0.8cqw] shrink-0 ${isCompact ? 'px-[2cqw] py-[0.5cqw] text-[2.8cqw]' : 'px-[3cqw] py-[0.8cqw] text-[3.8cqw]'}`}>
                        {offer.headerLabel || 'PREÇO ESPECIAL'}
                    </span>
                </div>
                {offer.skuCode && (
                    <span style={{ borderColor: palette.headerBg, color: palette.canvasText, fontFamily: brandKit.fontBody }} className={`border-[0.25cqw] rounded-[0.8cqw] font-black uppercase tracking-wider shrink-0 ${isCompact ? 'px-[1.8cqw] py-[0.3cqw] text-[2cqw]' : 'px-[2.4cqw] py-[0.5cqw] text-[2.6cqw]'}`}>SKU #{offer.skuCode}</span>
                )}
            </div>

            {/* Título destacado limpo */}
            <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'px-[4cqw] my-auto' : 'px-[5.5cqw] my-auto'}`}>
                <h2 className={`font-black uppercase tracking-tight ${typography.titleScaleClass} ${isCompact ? 'line-clamp-2' : 'line-clamp-3'}`}>{displayTitle}</h2>
                {offer.subtitle && (
                    <p style={{ fontFamily: brandKit.fontBody }} className={`font-semibold opacity-75 line-clamp-1 ${isCompact ? 'mt-[0.5cqw] text-[2.2cqw]' : 'mt-[1.2cqw] text-[3cqw]'}`}>{offer.subtitle}</p>
                )}
            </div>

            {/* Bloco de preço direto: ocupa ≥45% do peso visual vertical */}
            <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'px-[3.5cqw] my-auto' : isMinimal ? 'px-[7cqw] my-auto' : 'px-[5cqw] my-auto'}`}>
                <div style={{ borderColor: isMinimal ? '#e2e8f0' : palette.headerBg, clipPath: brutalistClipPath }} className={`w-full ${isMinimal ? 'border' : 'border-[0.45cqw]'} rounded-[2cqw] flex flex-col items-center justify-center ${isCompact ? (isHighRisk ? 'py-[1cqw] px-[2.5cqw]' : 'py-[2.4cqw] px-[2.5cqw]') : 'py-[4cqw] px-[4cqw]'}`}>
                    <span className={`font-black uppercase tracking-widest opacity-70 ${isCompact ? 'text-[1.9cqw]' : 'text-[2.4cqw]'}`}>PREÇO DIRETO {offer.unit ? `POR ${offer.unit}` : 'À VISTA'}</span>
                    <div style={{ color: palette.priceText }} className={`flex items-baseline justify-center leading-none tabular-nums ${isCompact ? 'mt-[0.5cqw]' : 'mt-[1cqw]'}`} data-price-integer={metrics.integerPart} data-price-cents={metrics.centsPart}>
                        <span className={`font-extrabold mr-[0.8cqw] tracking-tighter ${isCompact ? 'text-[4cqw]' : 'text-[6cqw]'}`}>R$</span>
                        <span style={{ fontSize: typography.integerPriceFontSizeCqw, lineHeight: 0.82 }} className="font-black tracking-tighter tabular-nums">{metrics.integerPart}</span>
                        <div className="flex flex-col items-start ml-[0.6cqw]">
                            <span className={`font-black leading-none tracking-tight tabular-nums ${isCompact ? 'text-[5.8cqw]' : 'text-[9.5cqw]'}`}>,{metrics.centsPart}</span>
                            {offer.unit && (
                                <span className={`font-extrabold uppercase opacity-80 ${isCompact ? 'text-[2cqw] mt-[0.3cqw]' : 'text-[2.8cqw] mt-[0.5cqw]'}`}>/{offer.unit}</span>
                            )}
                        </div>
                    </div>
                    {showPricePerMeasure && metrics.pricePerKgOrLiterText && (
                        <div style={{ fontFamily: brandKit.fontBody }} className={`font-bold uppercase tracking-wide opacity-80 ${isCompact ? 'mt-[0.8cqw] text-[1.8cqw]' : 'mt-[1.4cqw] text-[2.2cqw]'}`}>{metrics.pricePerKgOrLiterText}</div>
                    )}
                </div>
            </div>

            {renderCoreGovernanceFooter()}
        </div>
    );
}

// ---------- MACHINERY_INSTALLMENT: Agro Brutalist, bordas fortes, parcelamento + à vista ----------
if (layoutArchetype === 'MACHINERY_INSTALLMENT') {
    return (
        <div
            style={{
                containerType: 'inline-size',
                backgroundColor: palette.canvasBg,
                color: palette.canvasText,
                borderColor: palette.headerBg,
                fontFamily: brandKit.fontHeading,
            }}
            data-poster-template="MACHINERY_INSTALLMENT"
            data-installment-count={metrics.installmentCount}
            data-installment-integer={metrics.installmentIntegerPart}
            data-installment-cents={metrics.installmentCentsPart}
            data-guardrail-status={metrics.guardrailStatus}
            data-effective-price={metrics.effectiveUnitPrice.toFixed(2)}
            data-price-per-measure={metrics.pricePerKgOrLiterText ? metrics.pricePerKgOrLiterText : undefined}
            className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none ${palette.borderClass} ${containerShapeClass}`}
        >
            {/* Topo técnico de equipamento / investimento (faixa reta colada no topo) */}
            <div style={{ backgroundColor: palette.headerBg, color: palette.headerText }} className={`w-full flex items-center justify-between gap-[2cqw] shrink-0 ${isCompact ? 'px-[3.5cqw] py-[1.8cqw]' : 'px-[4.5cqw] py-[2.8cqw]'}`}>
                <span className={`font-black uppercase tracking-tight leading-none ${isCompact ? 'text-[4.8cqw]' : 'text-[6.8cqw]'}`}>{offer.headerLabel || 'FACILIDADE NO CAMPO'}</span>
                <span style={{ backgroundColor: palette.accentBg, color: palette.accentText }} className={`font-black uppercase tracking-wider rounded-[0.8cqw] shrink-0 ${isCompact ? 'px-[2cqw] py-[0.4cqw] text-[2.2cqw]' : 'px-[2.8cqw] py-[0.6cqw] text-[2.8cqw]'}`}>{offer.skuCode ? `CÓD: ${offer.skuCode}` : 'INVESTIMENTO'}</span>
            </div>

            {/* Nome da máquina + especificação técnica */}
            <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'px-[4cqw] my-auto' : 'px-[5cqw] my-auto'}`}>
                <h2 className={`font-black uppercase tracking-tight ${typography.titleScaleClass} ${isCompact ? 'line-clamp-2' : 'line-clamp-3'}`}>{displayTitle}</h2>
                {offer.subtitle && (
                    <p style={{ fontFamily: brandKit.fontBody }} className={`font-bold opacity-80 line-clamp-1 ${isCompact ? 'mt-[0.4cqw] text-[2.1cqw]' : 'mt-[1cqw] text-[2.9cqw]'}`}>{offer.subtitle}</p>
                )}
            </div>

            {/* Bloco monumental: parcelamento em destaque + valor à vista (CDC) */}
            <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'px-[3.5cqw] my-auto' : 'px-[5cqw] my-auto'}`}>
                <div style={{ borderColor: palette.headerBg }} className={`w-full border-[0.5cqw] rounded-[2cqw] overflow-hidden flex flex-col items-center ${isCompact ? (isHighRisk ? 'pb-[1cqw]' : 'pb-[1.5cqw]') : 'pb-[2.5cqw]'}`}>
                    {/* Faixa superior da condição (EM ATÉ 10X SEM JUROS) */}
                    <div style={{ backgroundColor: palette.accentBg, color: palette.accentText }} className={`w-full font-black uppercase tracking-wider text-center ${isCompact ? 'py-[0.6cqw] text-[2.6cqw]' : 'py-[1.1cqw] text-[3.8cqw]'}`}>{metrics.installmentLabelText}</div>
                    {/* Valor gigante da parcela */}
                    <div style={{ color: palette.priceText }} className={`flex items-baseline justify-center leading-none ${isCompact ? 'mt-[1.2cqw]' : 'mt-[2.2cqw]'}`}>
                        <span className={`font-black mr-[1.2cqw] tracking-tighter ${isCompact ? 'text-[5.5cqw]' : 'text-[8.2cqw]'}`}>{metrics.installmentCount}x R$</span>
                        <span style={{ fontSize: typography.installmentIntegerFontSizeCqw, lineHeight: 0.84 }} className="font-black tracking-tighter">{metrics.installmentIntegerPart}</span>
                        <span className={`font-black leading-none tracking-tight ml-[0.4cqw] ${isCompact ? 'text-[5.2cqw]' : 'text-[8.2cqw]'}`}>,{metrics.installmentCentsPart}</span>
                    </div>
                    {/* Preço total à vista obrigatório (CDC + DOM data-price-*) */}
                    <div style={{ fontFamily: brandKit.fontBody }} data-price-integer={metrics.integerPart} data-price-cents={metrics.centsPart} className={`font-extrabold uppercase tracking-wide opacity-90 flex flex-wrap items-center justify-center gap-[1.2cqw] ${isCompact ? 'mt-[1cqw] text-[2.1cqw]' : 'mt-[1.8cqw] text-[2.9cqw]'}`}>
                        {offer.priceFrom && offer.priceFrom > metrics.effectiveUnitPrice && (<span className="line-through opacity-65">DE R$ {offer.priceFrom.toFixed(2).replace('.', ',')}</span>)}
                        <span>PREÇO À VISTA: <strong>{metrics.cashTotalFormatted}</strong>{offer.unit ? ` /${offer.unit}` : ''}</span>
                    </div>
                </div>
            </div>

            {renderCoreGovernanceFooter()}
        </div>
    );
}

// ---------- COMBO_ADVANTAGE / CONDITION_ADVANTAGE: Dois polos — badge condição (#10B981) + preço unitário do combo ----------
if (layoutArchetype === 'COMBO_ADVANTAGE' || layoutArchetype === 'CONDITION_ADVANTAGE') {
    const comboBadgeBg = palette.isBlackAndWhite ? '#000000' : '#10B981';
    const comboBadgeText = '#FFFFFF';
    return (
        <div
            style={{
                containerType: 'inline-size',
                backgroundColor: palette.canvasBg,
                color: palette.canvasText,
                borderColor: palette.headerBg,
                fontFamily: brandKit.fontHeading,
            }}
            data-poster-template={layoutArchetype}
            data-guardrail-status={metrics.guardrailStatus}
            data-effective-price={metrics.effectiveUnitPrice.toFixed(2)}
            data-price-per-measure={metrics.pricePerKgOrLiterText ? metrics.pricePerKgOrLiterText : undefined}
            className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none ${palette.borderClass} ${containerShapeClass}`}
        >
            {/* Topo de chamada de vantagem comercial */}
            <div style={{ backgroundColor: palette.headerBg, color: palette.headerText }} className={`w-full flex items-center justify-between gap-[2cqw] shrink-0 ${isCompact ? 'px-[3.5cqw] py-[1.6cqw]' : 'px-[4.5cqw] py-[2.5cqw]'}`}>
                <span className={`font-black uppercase tracking-tight leading-none ${isCompact ? 'text-[4.6cqw]' : 'text-[6.4cqw]'}`}>{offer.headerLabel || 'VANTAGEM EXCLUSIVA'}</span>
                {offer.skuCode && (<span style={{ backgroundColor: palette.accentBg, color: palette.accentText }} className={`font-black uppercase tracking-wider rounded-full shrink-0 ${isCompact ? 'px-[2cqw] py-[0.3cqw] text-[2cqw]' : 'px-[2.8cqw] py-[0.5cqw] text-[2.6cqw]'}`}>CÓD: {offer.skuCode}</span>)}
            </div>

            {/* Título do produto */}
            <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'px-[4cqw] my-auto' : 'px-[5cqw] my-auto'}`}>
                <h2 className={`font-black uppercase tracking-tight ${typography.titleScaleClass} ${isCompact ? 'line-clamp-2' : 'line-clamp-3'}`}>{displayTitle}</h2>
                {offer.subtitle && (<p style={{ fontFamily: brandKit.fontBody }} className={`font-semibold opacity-75 line-clamp-1 ${isCompact ? 'mt-[0.4cqw] text-[2.1cqw]' : 'mt-[0.8cqw] text-[2.8cqw]'}`}>{offer.subtitle}</p>)}
            </div>

            {/* Polo 1: Badge/selo de condição em #10B981 + Polo 2: Preço unitário */}
            <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'px-[3.5cqw] my-auto' : 'px-[5cqw] my-auto'}`}>
                <div style={{ backgroundColor: comboBadgeBg, color: comboBadgeText, clipPath: brutalistClipPath }} className={`w-full rounded-[2cqw] font-black uppercase tracking-tight text-center shadow-xs ${isCompact ? (isHighRisk ? 'px-[3cqw] py-[1cqw]' : 'px-[3cqw] py-[1.5cqw]') : 'px-[4cqw] py-[2.4cqw]'} ${typography.conditionBannerScaleClass}`}>★ {metrics.conditionHeadlineText} ★</div>

                <div style={{ color: palette.priceText }} className={`flex items-baseline justify-center leading-none tabular-nums ${isCompact ? 'mt-[1.2cqw]' : 'mt-[2cqw]'}`} data-price-integer={metrics.integerPart} data-price-cents={metrics.centsPart}>
                    <span className={`font-extrabold mr-[0.8cqw] tracking-tighter ${isCompact ? 'text-[3.8cqw]' : 'text-[5.5cqw]'}`}>R$</span>
                    <span style={{ fontSize: typography.installmentIntegerFontSizeCqw, lineHeight: 0.85 }} className="font-black tracking-tighter tabular-nums">{metrics.integerPart}</span>
                    <div className="flex flex-col items-start ml-[0.5cqw]">
                        <span className={`font-black leading-none tracking-tight tabular-nums ${isCompact ? 'text-[5cqw]' : 'text-[7.8cqw]'}`}>,{metrics.centsPart}</span>
                        {offer.unit && (<span className={`font-extrabold uppercase opacity-80 ${isCompact ? 'text-[1.8cqw] mt-[0.2cqw]' : 'text-[2.6cqw] mt-[0.4cqw]'}`}>/{offer.unit}</span>)}
                    </div>
                </div>

                {(metrics.mechanicSubText || (showPricePerMeasure && metrics.pricePerKgOrLiterText)) && (
                    <div style={{ fontFamily: brandKit.fontBody }} className={`font-bold uppercase tracking-wide opacity-80 ${isCompact ? 'mt-[0.6cqw] text-[1.75cqw]' : 'mt-[1.2cqw] text-[2.2cqw]'}`}>{metrics.mechanicSubText || metrics.pricePerKgOrLiterText}</div>
                )}
            </div>

            {renderCoreGovernanceFooter()}
        </div>
    );
}

// ---------- GRID_MULTIPRODUCT_4X: Escala reduzida proporcional para quadrantes ----------
if (layoutArchetype === 'GRID_MULTIPRODUCT_4X') {
    return (
        <div
            style={{
                containerType: 'inline-size',
                backgroundColor: palette.canvasBg,
                color: palette.canvasText,
                borderColor: palette.headerBg,
                fontFamily: brandKit.fontHeading,
            }}
            data-poster-template="GRID_MULTIPRODUCT_4X"
            data-guardrail-status={metrics.guardrailStatus}
            data-effective-price={metrics.effectiveUnitPrice.toFixed(2)}
            data-price-per-measure={metrics.pricePerKgOrLiterText ? metrics.pricePerKgOrLiterText : undefined}
            className={`relative w-full h-full flex flex-col overflow-hidden select-none ${palette.borderClass} ${containerShapeClass} border-[0.3cqw] p-[1.5cqw]`}
        >
            {/* Título compacto (1 linha, sem overflow) */}
            <div className="flex flex-col items-start justify-start w-full h-full">
                <span style={{ fontFamily: brandKit.fontHeading }} className={`font-black uppercase tracking-tighter ${isCompact ? 'text-[2.6cqw]' : 'text-[3.2cqw]'}`}>
                    {offer.headerLabel || 'OFERTA'}
                </span>
                <h2 className={`font-black uppercase tracking-tight ${isCompact ? 'text-[3.4cqw] leading-[1.02]' : 'text-[4.2cqw] leading-[1.04]'} line-clamp-1`}>{displayTitle}</h2>
                {offer.subtitle && (<p style={{ fontFamily: brandKit.fontBody }} className={`font-semibold opacity-75 ${isCompact ? 'mt-[0.3cqw] text-[1.9cqw] line-clamp-1' : 'mt-[0.8cqw] text-[2.4cqw] line-clamp-1'}`}>{offer.subtitle}</p>)}
                {/* Preço atômico compacto (centavos empilhados, unidade abaixo) */}
                <div style={{ color: palette.priceText }} className={`flex items-baseline justify-start leading-none mt-[1.2cqw] ${isCompact ? 'px-0' : 'px-0'}`} data-price-integer={metrics.integerPart} data-price-cents={metrics.centsPart}>
                    <span className={`font-black mr-[0.8cqw] tracking-tighter ${isCompact ? 'text-[4cqw]' : 'text-[5.2cqw]'}`}>R$</span>
                    <span style={{ fontSize: typography.integerPriceFontSizeCqw, lineHeight: 0.8 }} className="font-black tracking-tighter">{metrics.integerPart}</span>
                    <div className="flex flex-col items-start ml-[0.4cqw]">
                        <span className={`font-black leading-none tracking-tight ${isCompact ? 'text-[4.8cqw]' : 'text-[6.4cqw]'}`}>,{metrics.centsPart}</span>
                        {offer.unit && (<span className={`font-extrabold uppercase opacity-70 ${isCompact ? 'text-[1.6cqw] mt-[0.2cqw]' : 'text-[2.2cqw] mt-[0.4cqw]'}`}>/{offer.unit}</span>)}
                    </div>
                </div>
                {showPricePerMeasure && metrics.pricePerKgOrLiterText && (<div style={{ fontFamily: brandKit.fontBody }} className={`font-bold uppercase tracking-wide opacity-80 ${isCompact ? 'mt-[0.5cqw] text-[1.5cqw]' : 'mt-[1cqw] text-[2cqw]'}`}>{metrics.pricePerKgOrLiterText}</div>)}
            </div>
            {renderCoreGovernanceFooter()}
        </div>
    );
}

// ---------- PROMO_CLASSIC_V (DEFAULT): Promoção clássica em V (De/Por + selo % OFF) ----------
return (
    <div
        style={{
            containerType: 'inline-size',
            backgroundColor: palette.canvasBg,
            color: palette.canvasText,
            borderColor: palette.headerBg,
            fontFamily: brandKit.fontHeading,
        }}
        data-poster-template="PROMO_CLASSIC_V"
        data-guardrail-status={metrics.guardrailStatus}
        data-effective-price={metrics.effectiveUnitPrice.toFixed(2)}
        data-price-per-measure={metrics.pricePerKgOrLiterText ? metrics.pricePerKgOrLiterText : undefined}
        className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none ${palette.borderClass} ${containerShapeClass}`}
    >
        {/* 1. CABEÇALHO COM PRESETS GEOMÉTRICOS (RETAIL_POP, AGRO_BRUTALIST, MINIMAL_BOUTIQUE, SUPERMARKET_IMPACT) */}
        <div className="relative w-full shrink-0">
            <div style={{
                backgroundColor: palette.headerBg,
                color: palette.headerText,
                clipPath:
                    stylePreset === 'RETAIL_POP'
                        ? undefined
                        : stylePreset === 'AGRO_BRUTALIST'
                          ? 'polygon(0 0, 100% 0, 100% calc(100% - 2.5cqw), calc(100% - 2.5cqw) 100%, 2.5cqw 100%, 0 calc(100% - 2.5cqw))'
                          : stylePreset === 'MINIMAL_BOUTIQUE'
                            ? undefined
                            : 'polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%)',
            }}
            className={`w-full flex flex-col items-center justify-center text-center ${stylePreset === 'RETAIL_POP' ? isA5Half ? 'rounded-[2cqw] mx-auto mt-[1.5cqw] w-[92%] py-[2.2cqw] px-[3cqw] shadow-xs' : isGondola ? 'rounded-[2.2cqw] mx-auto mt-[2cqw] w-[92%] py-[3cqw] px-[3.5cqw] shadow-xs' : 'rounded-[2.8cqw] mx-auto mt-[2.5cqw] w-[92%] py-[4.2cqw] px-[4cqw] shadow-sm' : stylePreset === 'MINIMAL_BOUTIQUE' ? isA5Half ? 'border-b border-slate-300 py-[2cqw] px-[3cqw] bg-transparent' : 'border-b border-slate-300 py-[3.5cqw] px-[4cqw] bg-transparent' : isA5Half ? 'pt-[2cqw] pb-[3.6cqw] px-[3cqw]' : isGondola ? 'pt-[3cqw] pb-[5.2cqw] px-[3.5cqw]' : 'pt-[4.5cqw] pb-[7.5cqw] px-[4cqw]'}`}
            >
                <span className={`font-black uppercase tracking-tight leading-none ${isA5Half ? 'text-[7.2cqw]' : isGondola ? 'text-[9.5cqw]' : 'text-[11.5cqw]'}`}>{offer.headerLabel || 'OFERTA'}</span>
                {metrics.mechanicBadgeText && (<span style={{ backgroundColor: palette.accentBg, color: palette.accentText }} className={`font-black uppercase tracking-wider rounded-full ${isCompact ? 'mt-[0.6cqw] px-[2cqw] py-[0.2cqw] text-[2.2cqw]' : 'mt-[1.5cqw] px-[3cqw] py-[0.5cqw] text-[2.8cqw]'}`}>{metrics.mechanicBadgeText}</span>)}
            </div>
        </div>

        {/* 2. TÍTULO DO PRODUTO CENTRALIZADO */}
        <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'px-[4cqw] my-auto' : 'px-[5cqw] my-auto'}`}>
            <h2 className={`font-black uppercase tracking-tight ${typography.titleScaleClass} ${isCompact ? 'line-clamp-2' : 'line-clamp-3'}`}>{displayTitle}</h2>
            {offer.subtitle && (<p style={{ fontFamily: brandKit.fontBody }} className={`font-semibold opacity-75 line-clamp-1 ${isCompact ? 'mt-[0.5cqw] text-[2.2cqw]' : 'mt-[1.2cqw] text-[3cqw]'}`}>{offer.subtitle}</p>)}
        </div>

        {/* 3. BLOCO CENTRAL DE PREÇO (SELO % + DE R$ RISCADO LEGÍVEL + POR R$ MONUMENTAL) */}
        <div className={`flex flex-col items-center justify-center text-center ${isCompact ? isHighRisk ? 'px-[4cqw] py-[1cqw] my-auto' : 'px-[4cqw] py-[2cqw] my-auto' : 'px-[5cqw] my-auto'} ${stylePreset === 'RETAIL_POP' ? '-rotate-1' : ''}`}>
            {/* Pílula de desconto percentual */}
            {showDiscountBadge && metrics.discountPercentage > 0 && (<div style={{ backgroundColor: palette.accentBg, color: palette.accentText }} className={`rounded-full font-black uppercase tracking-wider ${isCompact ? 'px-[2.5cqw] py-[0.4cqw] text-[2.6cqw] mb-[0.8cqw]' : 'px-[4.2cqw] py-[1cqw] text-[3.8cqw] mb-[2cqw]'}`}>{metrics.discountPercentage}% OFF</div>)}
            {/* Preço antigo "DE R$" com traço diagonal */}
            {offer.priceFrom && offer.priceFrom > metrics.effectiveUnitPrice && (<div className="flex flex-col items-center leading-none"><div className="relative inline-flex items-center justify-center px-[2cqw]"><span className={`font-extrabold opacity-70 tracking-tight ${isCompact ? 'text-[3.2cqw]' : 'text-[4.5cqw]'}`}>DE R$ {offer.priceFrom.toFixed(2).replace('.', ',')}</span><span className={`absolute inset-x-0 top-1/2 h-[0.35cqw] -rotate-6 rounded-full ${palette.isBlackAndWhite ? 'bg-black/80' : 'bg-red-600/85'}`} /></div><span className={`font-black uppercase tracking-wider ${isCompact ? 'text-[2.5cqw] mt-[0.3cqw]' : 'text-[3.8cqw] mt-[0.5cqw]'}`}>POR</span></div>)}
            {/* Preço atômico monumental com data-* */}
            <div style={{ color: palette.priceText }} className={`flex items-baseline justify-center leading-none tabular-nums ${isCompact ? 'mt-[0.5cqw]' : 'mt-[1cqw]'}`} data-price-integer={metrics.integerPart} data-price-cents={metrics.centsPart}>
                <span className={`font-extrabold mr-[0.8cqw] tracking-tighter ${isCompact ? 'text-[3.8cqw]' : 'text-[5.5cqw]'}`}>R$</span>
                <span style={{ fontSize: typography.integerPriceFontSizeCqw, lineHeight: 0.82 }} className="font-black tracking-tighter tabular-nums">{metrics.integerPart}</span>
                <div className="flex flex-col items-start ml-[0.6cqw]">
                    <span className={`font-black leading-none tracking-tight tabular-nums ${isCompact ? 'text-[5.6cqw]' : 'text-[8.8cqw]'}`}>,{metrics.centsPart}</span>
                    {offer.unit && offer.unit !== 'UN' && (<span className={`font-extrabold uppercase opacity-80 ${isCompact ? 'text-[1.9cqw] mt-[0.3cqw]' : 'text-[2.7cqw] mt-[0.5cqw]'}`}>/{offer.unit}</span>)}
                </div>
            </div>
            {/* Subtexto de economia */}
            {(metrics.mechanicSubText || (showPricePerMeasure && metrics.pricePerKgOrLiterText)) && (<div style={{ fontFamily: brandKit.fontBody }} className={`font-bold uppercase tracking-wide opacity-85 ${isCompact ? 'mt-[1cqw] text-[2cqw]' : 'mt-[2cqw] text-[2.6cqw]'}`}>{metrics.mechanicSubText || metrics.pricePerKgOrLiterText}</div>)}
        </div>
        {renderCoreGovernanceFooter()}
    </div>
);
};

// ============================================================================
// 3. FOLHA A4 COMPLETA (RENDERIZA 1 POR FOLHA, 2 POR FOLHA A5 OU 4 GÔNDOLA 2x2)
// ============================================================================
interface StorePosterA4SheetProps {
    offer: OfferItemState;
    batchMode?: boolean;
    batchRows?: BatchParsedRow[];
    batchOffers?: OfferItemState[];
    brandKit: TenantBrandKit;
    printGrid: PrintGridFormat;
    theme: VisualThemePreset;
    layoutArchetype?: PosterLayoutArchetype;
    showDiscountBadge: boolean;
    showPricePerMeasure: boolean;
    sheetRef?: React.RefObject<HTMLDivElement>;
}

export const StorePosterA4Sheet: React.FC<StorePosterA4SheetProps> = ({
    offer,
    batchMode = false,
    batchRows = [],
    batchOffers = [],
    brandKit,
    printGrid,
    theme,
    layoutArchetype = COAGRO_OFFICIAL_POSTER_ARCHETYPE,
    showDiscountBadge,
    showPricePerMeasure,
    sheetRef,
}) => {
    const isMultiProductGrid = layoutArchetype === 'GRID_MULTIPRODUCT_4X';
    const slotsCount =
        printGrid === 'A4_FULL' ? 1 : printGrid === 'A5_HALF' ? 2 : isMultiProductGrid ? 6 : 4;

    const sheetTypeAttr =
        printGrid === 'A4_FULL'
            ? 'a4-full'
            : printGrid === 'A5_HALF'
              ? 'a5-half'
              : isMultiProductGrid
                ? 'a4-grid'
                : 'gondola';

    const gridClasses =
        printGrid === 'A4_FULL'
            ? 'grid-cols-1 grid-rows-1'
            : printGrid === 'A5_HALF'
              ? 'grid-cols-1 grid-rows-2 relative overflow-hidden bg-white'
              : isMultiProductGrid
                ? 'grid-cols-2 grid-rows-3 relative overflow-hidden bg-white'
                : 'grid-cols-2 grid-rows-2 relative overflow-hidden bg-white';

    const resolvedBatchEntries: { item: OfferItemState; recommendedArchetype: PosterLayoutArchetype }[] = batchMode
        ? (batchOffers.length > 0
              ? batchOffers
              : batchRows
                    .filter((row) => row.status !== 'BLOCKED')
                    .map(
                        (row): OfferItemState => ({
                            ...offer,
                            id: `batch-${row.rowNumber}-${row.skuCode}`,
                            skuCode: row.skuCode,
                            rawTitle: row.rawTitle,
                            cleanedTitle: row.cleanedTitle,
                            subtitle: '',
                            unit: row.unit,
                            netWeightOrVolume: row.netWeightOrVolume,
                            costPrice: row.costPrice,
                            priceFrom: row.priceFrom,
                            priceToRaw: row.priceTo,
                            regulatoryCategory: row.regulatoryCategory,
                            mechanicType: row.mechanicType || 'SIMPLE_DE_POR',
                            installmentCount: row.installmentCount ?? offer.installmentCount,
                            giftOrConditionText:
                                row.giftOrConditionText ?? offer.giftOrConditionText,
                        })
                    )
          ).reduce<{ item: OfferItemState; recommendedArchetype: PosterLayoutArchetype }[]>(
              (acc, item) => {
                  const spec = resolveRenderSpec(item, brandKit, theme);
                  if (spec.canExport) {
                      acc.push({
                          item,
                          recommendedArchetype: layoutArchetype,
                      });
                  }
                  return acc;
              },
              []
          )
        : [];

    const pages: { item: OfferItemState; recommendedArchetype: PosterLayoutArchetype }[][] = [];
    if (batchMode && resolvedBatchEntries.length > 0) {
        for (let i = 0; i < resolvedBatchEntries.length; i += slotsCount) {
            pages.push(resolvedBatchEntries.slice(i, i + slotsCount));
        }
    } else {
        pages.push(
            Array.from({ length: slotsCount }, () => ({
                item: offer,
                recommendedArchetype: layoutArchetype,
            }))
        );
    }

    const renderSheetCutGuides = () => (
        <>
            {printGrid === 'A5_HALF' && (
                <>
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-400 pointer-events-none z-10" />
                    <div className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500 font-mono text-[9px] bg-white/95 px-1 py-0.5 rounded border border-slate-200 select-none pointer-events-none z-20">
                        ✂ Linha de corte A5
                    </div>
                </>
            )}
            {printGrid === 'GONDOLA_2X2' && (
                <>
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-400 pointer-events-none z-10" />
                    <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-slate-400 pointer-events-none z-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 font-mono text-[10px] bg-white/95 px-1.5 py-0.5 rounded border border-slate-200 select-none pointer-events-none z-20">
                        ✂
                    </div>
                </>
            )}
            {isMultiProductGrid && (
                <>
                    {/* Linhas de divisão do grid 2x3 (ou 2x2) */}
                    <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-slate-300/60 pointer-events-none z-10" />
                    <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-slate-300/60 pointer-events-none z-10" />
                    <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-slate-300/60 pointer-events-none z-10" />
                    <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 font-mono text-[9px] bg-white/90 px-1 py-0.5 rounded border border-slate-200 select-none pointer-events-none z-20">
                        ✂
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 font-mono text-[9px] bg-white/90 px-1 py-0.5 rounded border border-slate-200 select-none pointer-events-none z-20">
                        ✂
                    </div>
                    <div className="absolute top-5/6 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 font-mono text-[9px] bg-white/90 px-1 py-0.5 rounded border border-slate-200 select-none pointer-events-none z-20">
                        ✂
                    </div>
                </>
            )}
        </>
    );

    if (pages.length === 1) {
        return (
            <div
                ref={sheetRef}
                data-sheet={sheetTypeAttr}
                data-slots={slotsCount}
                data-poster-archetype={layoutArchetype}
                data-batch-total={batchMode ? resolvedBatchEntries.length : undefined}
                data-batch-valid={batchMode ? resolvedBatchEntries.length : undefined}
                className={`w-full aspect-[1/1.414] bg-white shadow-xl grid ${gridClasses} relative overflow-hidden`}
            >
                {renderSheetCutGuides()}
                {pages[0].map((slotEntry, index) => {
                    const slotArchetype = batchMode
                        ? slotEntry.recommendedArchetype
                        : layoutArchetype;
                    return (
                        <div
                            key={`${slotEntry.item.id}-${index}`}
                            className={`relative w-full h-full overflow-hidden ${isMultiProductGrid ? 'p-[2.5cqw]' : ''}`}
                        >
                            <SingleStorePosterUnit
                                offer={slotEntry.item}
                                brandKit={brandKit}
                                theme={theme}
                                layoutArchetype={slotArchetype}
                                showDiscountBadge={showDiscountBadge}
                                showPricePerMeasure={showPricePerMeasure}
                                isA5Half={printGrid === 'A5_HALF'}
                                isGondola={printGrid === 'GONDOLA_2X2'}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div ref={sheetRef} className="w-full flex flex-col gap-6">
            {pages.map((pageEntries, pageIndex) => (
                <div
                    key={`page-${pageIndex}`}
                    data-sheet={sheetTypeAttr}
                    data-slots={slotsCount}
                    data-poster-archetype={layoutArchetype}
                    data-page-index={pageIndex + 1}
                    data-batch-total={batchMode ? resolvedBatchEntries.length : undefined}
                    data-batch-valid={batchMode ? resolvedBatchEntries.length : undefined}
                    style={{
                        pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
                        breakAfter: pageIndex < pages.length - 1 ? 'page' : 'auto',
                    }}
                    className={`w-full aspect-[1/1.414] bg-white shadow-xl grid ${gridClasses} relative overflow-hidden`}
                >
                    {renderSheetCutGuides()}
                    {pageEntries.map((slotEntry, index) => {
                        const slotArchetype = batchMode
                            ? slotEntry.recommendedArchetype
                            : layoutArchetype;
                        return (
                            <div
                                key={`${slotEntry.item.id}-${index}`}
                                className={`relative w-full h-full overflow-hidden ${isMultiProductGrid ? 'p-[2.5cqw]' : ''}`}
                            >
                                <SingleStorePosterUnit
                                    offer={slotEntry.item}
                                    brandKit={brandKit}
                                    theme={theme}
                                    layoutArchetype={slotArchetype}
                                    showDiscountBadge={showDiscountBadge}
                                    showPricePerMeasure={showPricePerMeasure}
                                    isA5Half={printGrid === 'A5_HALF'}
                                    isGondola={printGrid === 'GONDOLA_2X2'}
                                />
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

// ============================================================================
// 4. CARD DE REDES SOCIAIS (STORIES 9:16, FEED 4:5 E QUADRADO 1:1)
// ============================================================================
interface SocialMediaCardCanvasProps {
    offer: OfferItemState;
    brandKit: TenantBrandKit;
    aspectRatio: SocialAspectRatio;
    theme: VisualThemePreset;
    showBullets: boolean;
    showSafeZones: boolean;
    canvasRef?: React.RefObject<HTMLDivElement>;
}

export const SocialMediaCardCanvas: React.FC<SocialMediaCardCanvasProps> = ({
    offer,
    brandKit,
    aspectRatio,
    theme,
    showBullets,
    showSafeZones,
    canvasRef,
}) => {
    const { metrics, typography } = resolveRenderSpec(offer, brandKit, theme);
    const palette = resolveThemePalette(theme, brandKit);
    const activeDept =
        brandKit.departments.find((d) => d.id === brandKit.activeDepartmentId) ||
        brandKit.departments[0];
    const activeCampaign =
        brandKit.seasonalCampaigns.find((c) => c.id === brandKit.activeCampaignId) ||
        brandKit.seasonalCampaigns[0];
    const stylePreset = brandKit.visualStylePreset || 'RETAIL_POP';

    const aspectClass =
        aspectRatio === 'STORY_9_16'
            ? 'aspect-[9/16]'
            : aspectRatio === 'FEED_4_5'
                ? 'aspect-[4/5]'
                : 'aspect-square';

    const isStory = aspectRatio === 'STORY_9_16';

    const cardBorderRadiusClass =
        stylePreset === 'MINIMAL_BOUTIQUE'
            ? 'rounded-none border border-white/20'
            : stylePreset === 'AGRO_BRUTALIST'
              ? 'rounded-none border-4 border-black/80'
              : 'rounded-none';

    return (
        <div
            ref={canvasRef}
            style={{
                containerType: 'inline-size',
                backgroundColor: palette.headerBg,
                color: palette.headerText,
                fontFamily: brandKit.fontHeading,
            }}
            data-guardrail-status={metrics.guardrailStatus}
            data-effective-price={metrics.effectiveUnitPrice.toFixed(2)}
            data-price-per-measure={metrics.pricePerKgOrLiterText ? metrics.pricePerKgOrLiterText : undefined}
            data-sku-code={offer.skuCode || undefined}
            data-brand-name={brandKit.companyName}
            data-font-heading={brandKit.fontHeading}
            data-font-body={brandKit.fontBody}
            className={`relative w-full ${aspectClass} overflow-hidden shadow-2xl select-none flex flex-col justify-between ${cardBorderRadiusClass}`}
        >
            {/* Guias de Zona Segura do WhatsApp Status e Instagram Stories */}
            {isStory && showSafeZones && (
                <>
                    <div className="absolute top-0 inset-x-0 h-[9%] bg-rose-500/35 border-b border-dashed border-white/60 z-40 flex items-center justify-center text-[2.4cqw] font-bold uppercase tracking-wider">
                        Zona de Topo do Story / Status
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-[10%] bg-rose-500/35 border-t border-dashed border-white/60 z-40 flex items-center justify-center text-[2.4cqw] font-bold uppercase tracking-wider">
                        Zona do Botão "Responder"
                    </div>
                </>
            )}

            {/* Brilho Radial de Fundo (Iluminação de Estúdio para destacar o Produto) */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.20) 0%, rgba(0,0,0,0.48) 85%)',
                }}
            />

            {/* 1. TOPO: IDENTIDADE DA MARCA (LOGO OU NOME) + SELO DA OFERTA */}
            <div
                className={`relative z-10 px-[6cqw] flex items-center justify-between gap-[2cqw] ${
                    isStory ? 'pt-[10cqw]' : 'pt-[5cqw]'
                }`}
            >
                <div className="flex items-center gap-[2.2cqw] min-w-0">
                    <OfficialBrandLogo
                        brandKit={brandKit}
                        theme={theme}
                        palette={palette}
                        className="h-[7.5cqw] max-w-[24cqw]"
                    />
                    <div className="flex flex-col min-w-0">
                        {brandKit.defaultBranchName && (
                            <span className="text-[2.2cqw] font-semibold opacity-80 mt-[0.5cqw] truncate">
                                {brandKit.defaultBranchName}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-[1.5cqw] shrink-0">
                    {theme === 'CAMPAIGN_SEASONAL' && activeCampaign?.badgeLogoUrl && (
                        <img
                            src={activeCampaign.badgeLogoUrl}
                            alt={activeCampaign.name}
                            className="h-[7.5cqw] max-w-[20cqw] object-contain shrink-0"
                        />
                    )}
                    <span
                        style={{
                            backgroundColor: palette.accentBg,
                            color: palette.accentText,
                        }}
                        className="px-[3.2cqw] py-[1cqw] rounded-full font-black uppercase text-[2.4cqw] tracking-wider shadow-md shrink-0"
                    >
                        {metrics.mechanicBadgeText
                            ? metrics.mechanicBadgeText
                            : metrics.discountPercentage > 0
                              ? `${metrics.discountPercentage}% OFF`
                              : offer.headerLabel || 'OFERTA'}
                    </span>
                </div>
            </div>

            {/* 2. ÁREA CENTRAL: FOTO DO PRODUTO COM PEDESTAL OU DESTAQUE TIPOGRÁFICO MONUMENTAL */}
            <div className="relative z-10 px-[6cqw] my-auto flex flex-col items-center text-center">
                {offer.imageUrl ? (
                    <div className="relative flex flex-col items-center mb-[2.5cqw]">
                        <img
                            src={offer.imageUrl}
                            alt={offer.cleanedTitle}
                            className={`${
                                isStory ? 'h-[35cqw]' : 'h-[25cqw]'
                            } object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.58)] z-10`}
                        />
                        {/* Sombra Elíptica de Ancoragem Física */}
                        <div
                            className="w-[38cqw] h-[4cqw] -mt-[1.5cqw] rounded-full"
                            style={{
                                background:
                                    'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 75%)',
                            }}
                        />
                    </div>
                ) : (
                    /* Fallback tipográfico institucional: não simula foto nem erro de upload. */
                    <div className="relative mb-[2.5cqw] flex w-full flex-col items-center justify-center border-y-[0.5cqw] border-white/35 py-[5cqw]">
                        <span
                            style={{ fontFamily: brandKit.fontBody }}
                            className="text-[2.4cqw] font-extrabold uppercase tracking-[0.22em] opacity-75"
                        >
                            Oferta oficial Coagro
                        </span>
                        <span
                            style={{ fontFamily: brandKit.fontHeading }}
                            className="mt-[1.4cqw] max-w-[90%] truncate text-[7cqw] font-black uppercase leading-none tracking-tight"
                        >
                            {activeDept?.label || 'GRUPO COAGRO'}
                        </span>
                        <span className="mt-[1.6cqw] px-[2.5cqw] py-[0.6cqw] font-mono text-[2cqw] font-extrabold uppercase tracking-wider text-white/90">
                            {metrics.mechanicBadgeText || 'OFERTA EXCLUSIVA'}
                        </span>
                    </div>
                )}

                {/* Título e Subtítulo */}
                <h2 className={`font-black uppercase ${typography.titleScaleClass} tracking-tight drop-shadow-sm`}>
                    {metrics.condensedTitle || offer.cleanedTitle || offer.rawTitle}
                </h2>

                {offer.subtitle && (
                    <p className="mt-[1.2cqw] text-[2.8cqw] font-medium opacity-85 max-w-[90%] leading-snug">
                        {offer.subtitle}
                    </p>
                )}

                {/* Lista dos 3 Diferenciais (Opcional) */}
                {showBullets && offer.bullets.length > 0 && (
                    <div className="mt-[2.6cqw] w-full max-w-[88%] bg-black/25 backdrop-blur-sm border border-white/15 rounded-[2.5cqw] px-[3.5cqw] py-[2cqw] text-left space-y-[1cqw]">
                        {offer.bullets.slice(0, 3).map((b) => (
                            <div
                                key={b.id}
                                className="flex items-center gap-[1.8cqw] text-[2.5cqw] font-semibold opacity-95"
                            >
                                <span
                                    style={{ backgroundColor: palette.accentBg }}
                                    className="w-[1.6cqw] h-[1.6cqw] rounded-full shrink-0"
                                />
                                <span className="truncate">{b.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. BLOCO DE PREÇO MONUMENTAL + CTA */}
            <div className="relative z-10 px-[6cqw] flex flex-col items-center">
                <div className="w-full bg-white text-slate-950 rounded-[3.2cqw] px-[4.5cqw] py-[2.6cqw] shadow-[0_14px_30px_rgba(0,0,0,0.45)] border-2 border-white/90 flex items-center justify-between gap-[2cqw]">
                    <div
                        style={{ fontFamily: brandKit.fontBody }}
                        className="flex flex-col text-left min-w-0"
                    >
                        {offer.mechanicType === 'INSTALLMENT_FINANCING' ? (
                            <span
                                style={{
                                    backgroundColor: palette.accentBg,
                                    color: palette.accentText,
                                }}
                                className="px-[2.2cqw] py-[0.3cqw] rounded-[0.8cqw] text-[2.3cqw] font-black uppercase tracking-wide w-fit mb-[0.4cqw]"
                            >
                                {metrics.installmentCount}X DE R$ {metrics.installmentIntegerPart},
                                {metrics.installmentCentsPart} SEM JUROS
                            </span>
                        ) : offer.priceFrom && offer.priceFrom > metrics.effectiveUnitPrice ? (
                            <div className="relative inline-flex items-center w-fit">
                                <span className="text-[2.8cqw] font-bold text-slate-500">
                                    DE R$ {offer.priceFrom.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="absolute inset-x-0 top-1/2 h-[0.35cqw] bg-red-600 -rotate-6" />
                            </div>
                        ) : (
                            <span className="text-[2.4cqw] font-extrabold uppercase text-slate-500">
                                PREÇO ESPECIAL
                            </span>
                        )}
                        <span
                            style={{ fontFamily: brandKit.fontHeading }}
                            className="text-[2.8cqw] font-black uppercase tracking-wide text-slate-800 truncate"
                        >
                            {offer.ctaText || 'Garanta já o seu!'}
                        </span>
                        {(metrics.mechanicSubText || metrics.pricePerKgOrLiterText) && (
                            <span className="text-[2cqw] font-semibold text-slate-500 truncate">
                                {metrics.pricePerKgOrLiterText || metrics.mechanicSubText}
                            </span>
                        )}
                        {brandKit.defaultPhoneWhatsapp &&
                            brandKit.defaultPhoneWhatsapp !== '(00) 99999-0000' && (
                                <span
                                    style={{ color: palette.priceText }}
                                    className="text-[2cqw] font-extrabold mt-[0.3cqw]"
                                >
                                    📲 {brandKit.defaultPhoneWhatsapp}
                                </span>
                            )}
                    </div>

                    {/* Preço Atômico à Direita (Com escala dinâmica para valores de 4+ dígitos) */}
                    <div
                        style={{ color: palette.priceText }}
                        data-price-integer={metrics.integerPart}
                        data-price-cents={metrics.centsPart}
                        className="flex items-baseline leading-none shrink-0"
                    >
                        <span className="font-black text-[3.8cqw] mr-[0.6cqw]">R$</span>
                        <span
                            className={`font-black tracking-tighter leading-[0.85] ${
                                metrics.integerPart.length >= 4
                                    ? 'text-[10cqw]'
                                    : metrics.integerPart.length === 3
                                      ? 'text-[11.2cqw]'
                                      : 'text-[12.5cqw]'
                            }`}
                        >
                            {metrics.integerPart}
                        </span>
                        <div className="flex flex-col items-start ml-[0.4cqw]">
                            <span className="font-black text-[5.2cqw] leading-none">
                                ,{metrics.centsPart}
                            </span>
                            <span className="font-bold text-[2.1cqw] uppercase text-slate-600 mt-[0.3cqw]">
                                /{offer.unit}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. RODAPÉ LEGAL, SKU E VIGÊNCIA */}
            <div
                style={{ fontFamily: brandKit.fontBody }}
                className={`relative z-10 mt-[2cqw] px-[5cqw] ${
                    isStory ? 'pb-[10.5cqw] pt-[1.8cqw]' : 'py-[2cqw]'
                } bg-black/45 text-center`}
            >
                <p className="text-[1.8cqw] font-bold uppercase tracking-wide text-white/90 leading-tight">
                    {offer.skuCode ? `CÓD: ${offer.skuCode} • ` : ''}
                    {metrics.legalFooter.badgeWarning
                        ? `⚠ ${metrics.legalFooter.badgeWarning} • `
                        : ''}
                    {metrics.legalFooter.mandatoryLegalText} • #{metrics.forensicId}
                </p>
            </div>
        </div>
    );
};

// ============================================================================
// 5. CARROSSEL GUIADO DE OFERTAS E CONTEÚDO (MÓDULO 3 — FASE 2, 100% WHITE-LABEL)
// ============================================================================
interface GuidedCarouselCanvasProps {
    slide: CarouselSlideItem;
    slideIndex: number;
    totalSlides: number;
    offer: OfferItemState;
    brandKit: TenantBrandKit;
    theme: VisualThemePreset;
    canvasRef?: React.RefObject<HTMLDivElement>;
}

export const GuidedCarouselCanvas: React.FC<GuidedCarouselCanvasProps> = ({
    slide,
    slideIndex,
    totalSlides,
    offer,
    brandKit,
    theme,
    canvasRef,
}) => {
    const effectiveSku = slide.linkedSkuCode || offer.skuCode || '00000';
    const slideOffer: OfferItemState =
        slide.slideType === 'PRODUCT_OR_CONTENT' && slide.priceTo !== undefined && slide.priceTo > 0
            ? {
                  ...offer,
                  skuCode: effectiveSku,
                  rawTitle: slide.headline,
                  cleanedTitle: slide.headline,
                  unit: slide.unit || offer.unit,
                  priceFrom: slide.priceFrom,
                  priceToRaw: slide.priceTo,
                  mechanicType: slide.mechanicType || 'SIMPLE_DE_POR',
                  installmentCount: slide.installmentCount ?? offer.installmentCount,
                  giftOrConditionText: slide.giftOrConditionText ?? offer.giftOrConditionText,
                  regulatoryCategory: slide.regulatoryCategory || offer.regulatoryCategory,
              }
            : {
                  ...offer,
                  skuCode: effectiveSku,
              };

    const { metrics } = resolveRenderSpec(slideOffer, brandKit, theme);
    const palette = resolveThemePalette(theme, brandKit);
    const activeDept =
        brandKit.departments?.find((d) => d.id === brandKit.activeDepartmentId) ||
        brandKit.departments?.[0];

    return (
        <div
            ref={canvasRef}
            style={{
                containerType: 'inline-size',
                backgroundColor: palette.headerBg,
                color: palette.headerText,
                fontFamily: brandKit.fontHeading,
            }}
            data-carousel-slide-type={slide.slideType}
            data-slide-index={slideIndex + 1}
            data-sku-code={effectiveSku}
            data-effective-price={metrics.effectiveUnitPrice.toFixed(2)}
            data-brand-name={brandKit.companyName}
            data-font-heading={brandKit.fontHeading}
            data-font-body={brandKit.fontBody}
            className="relative w-full aspect-[4/5] overflow-hidden shadow-2xl select-none flex flex-col justify-between"
        >
            {/* Iluminação radial suave */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.45) 88%)',
                }}
            />

            {/* 1. TOPO: IDENTIDADE WHITE-LABEL + INDICADOR DE SLIDE E CÓD */}
            <div className="relative z-10 px-[6cqw] pt-[5cqw] flex items-center justify-between gap-[2cqw]">
                <div className="flex items-center gap-[2cqw] min-w-0">
                    <OfficialBrandLogo
                        brandKit={brandKit}
                        theme={theme}
                        palette={palette}
                        className="h-[7cqw] max-w-[22cqw]"
                    />
                    <div className="flex flex-col min-w-0">
                        {brandKit.defaultBranchName && (
                            <span
                                style={{ fontFamily: brandKit.fontBody }}
                                className="text-[2.1cqw] font-semibold opacity-80 mt-[0.4cqw] truncate"
                            >
                                {brandKit.defaultBranchName}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-[1.5cqw] shrink-0">
                    <span
                        style={{ fontFamily: brandKit.fontBody }}
                        className="px-[2.2cqw] py-[0.8cqw] rounded-[1.2cqw] bg-black/30 border border-white/20 text-[2cqw] font-mono font-bold uppercase"
                    >
                        CÓD: {effectiveSku}
                    </span>
                    <span
                        className="px-[2.8cqw] py-[0.8cqw] rounded-full font-black uppercase text-[2.2cqw] tracking-wider bg-slate-950 text-white border border-white/20 shadow-md"
                    >
                        {slideIndex + 1}/{totalSlides}
                    </span>
                </div>
            </div>

            {/* 2. CORPO CENTRAL DO SLIDE CONFORME ARQUÉTIPO DO CARROSSEL */}
            <div className="relative z-10 px-[7cqw] my-auto flex flex-col items-center text-center">
                <span
                    style={{
                        backgroundColor: palette.accentBg,
                        color: palette.accentText,
                    }}
                    className="px-[3.5cqw] py-[0.9cqw] rounded-full text-[2.3cqw] font-black uppercase tracking-widest mb-[3cqw] shadow-sm"
                >
                    {slide.slideType === 'HOOK_COVER'
                        ? 'CAPA • DESTAQUES DA SEMANA'
                        : slide.slideType === 'FINAL_CTA'
                          ? 'PEDIDO RÁPIDO • BALCÃO & WHATSAPP'
                          : `OFERTA SELECIONADA • CÓD ${effectiveSku}`}
                </span>

                {slide.slideType === 'HOOK_COVER' && (
                    <span
                        style={{
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                        }}
                        className="self-end mb-[1.5cqw] px-[3cqw] py-[0.8cqw] rounded-full text-[2cqw] font-black uppercase tracking-wider shadow-md"
                    >
                        {activeDept?.label.toUpperCase() || 'OFERTA'}
                    </span>
                )}

                <h2 className={`font-black uppercase tracking-tight drop-shadow-sm max-w-[96%] ${slide.slideType === 'HOOK_COVER' ? 'leading-[0.95] text-[8cqw]' : 'leading-[0.98] text-[7.5cqw]'}`}>
                    {slide.headline}
                </h2>

                <p
                    style={{ fontFamily: brandKit.fontBody }}
                    className="mt-[2.8cqw] text-[3.3cqw] font-semibold opacity-90 max-w-[92%] leading-snug"
                >
                    {slide.bodyText}
                </p>

                {slide.slideType === 'PRODUCT_OR_CONTENT' && (
                    <div className="mt-[4cqw] w-full bg-white text-slate-950 rounded-[3cqw] px-[4.5cqw] py-[2.8cqw] shadow-xl flex items-center justify-between gap-[2cqw]">
                        <div
                            style={{ fontFamily: brandKit.fontBody }}
                            className="flex flex-col text-left min-w-0"
                        >
                            <span className="text-[2.2cqw] font-extrabold uppercase text-slate-500">
                                CONDIÇÃO ESPECIAL {brandKit.companyName}
                            </span>
                            <span
                                style={{ fontFamily: brandKit.fontHeading, color: palette.priceText }}
                                className="text-[3.4cqw] font-black uppercase tracking-tight truncate"
                            >
                                {metrics.conditionHeadlineText}
                            </span>
                            <span className="text-[2.1cqw] font-bold text-slate-600">
                                Cód. Referência: {effectiveSku}
                            </span>
                        </div>
                        <div
                            style={{ color: palette.priceText }}
                            data-price-integer={metrics.integerPart}
                            data-price-cents={metrics.centsPart}
                            className="flex items-baseline leading-none shrink-0"
                        >
                            <span className="font-black text-[3.2cqw] mr-[0.5cqw]">R$</span>
                            <span className="font-black text-[10cqw] tracking-tighter leading-[0.85]">
                                {metrics.integerPart}
                            </span>
                            <div className="flex flex-col items-start ml-[0.3cqw]">
                                <span className="font-black text-[4.5cqw] leading-none">
                                    ,{metrics.centsPart}
                                </span>
                                <span className="font-bold text-[2cqw] uppercase text-slate-600">
                                    /{slideOffer.unit}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {slide.slideType === 'FINAL_CTA' && (
                    <div
                        style={{
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                        }}
                        className="mt-[4.5cqw] px-[6cqw] py-[3cqw] rounded-[2.8cqw] shadow-xl flex flex-col items-center text-center"
                    >
                        <span className="text-[2.4cqw] font-extrabold uppercase tracking-wider opacity-100">
                            BENEFÍCIO DE COMPRA RÁPIDA
                        </span>
                        <span className="text-[5.5cqw] font-black tracking-tight leading-none mt-[0.8cqw]">
                            📲 {brandKit.defaultPhoneWhatsapp || '(00) 99999-0000'}
                        </span>
                        <span className="text-[2cqw] font-semibold mt-[1.2cqw] opacity-95">
                            {brandKit.companyName} • {brandKit.defaultBranchName || 'Unidade Matriz'}
                        </span>
                    </div>
                )}
            </div>

            {/* 3. BARRA DE PROGRESSO DE SLIDES + RODAPÉ FORENSE */}
            <div
                style={{ fontFamily: brandKit.fontBody }}
                className="relative z-10 px-[6cqw] py-[2.8cqw] bg-black/40 flex flex-col gap-[1.5cqw]"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[1.2cqw]">
                        {Array.from({ length: totalSlides }).map((_, idx) => (
                            <span
                                key={idx}
                                style={{
                                    backgroundColor:
                                        idx === slideIndex ? palette.accentBg : 'rgba(255,255,255,0.3)',
                                }}
                                className={`h-[1.2cqw] rounded-full transition-all ${
                                    idx === slideIndex ? 'w-[6cqw]' : 'w-[2cqw]'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-[2.1cqw] font-extrabold uppercase tracking-wider text-white/90">
                        {slideIndex < totalSlides - 1 ? 'ARRASTE PARA O LADO ➔' : 'GARANTA HOJE MESMO ✓'}
                    </span>
                    {slide.slideType === 'HOOK_COVER' && (
                        <span
                            style={{ color: '#10B981' }}
                            className="absolute bottom-[4cqw] right-[6cqw] text-[2.4cqw] font-black tracking-tight drop-shadow-md z-20 whitespace-nowrap"
                        >
                            Arraste para ver as ofertas →
                        </span>
                    )}
                </div>
                <p className="text-[1.7cqw] font-bold uppercase tracking-wide text-white/80 text-center">
                    CÓD: {effectiveSku} • {metrics.legalFooter.mandatoryLegalText} • #{metrics.forensicId}
                </p>
            </div>
        </div>
    );
};

// ============================================================================
// 6. MÓDULO RH, VAGAS & COMUNICADOS INTERNOS (MÓDULO 4 — FASE 3, 100% WHITE-LABEL)
// ============================================================================
interface HrAndNoticeCanvasProps {
    hrNotice: HrNoticeState;
    brandKit: TenantBrandKit;
    theme: VisualThemePreset;
    canvasRef?: React.RefObject<HTMLDivElement>;
}

export const HrAndNoticeCanvas: React.FC<HrAndNoticeCanvasProps> = ({
    hrNotice,
    brandKit,
    theme,
    canvasRef,
}) => {
    const isA4 = hrNotice.outputFormat === 'A4_PRINT';
    const isMuralA4 = isA4 && (hrNotice.channel === 'MURAL_A4' || !hrNotice.channel);
    const effectiveTheme: VisualThemePreset = isMuralA4
        ? theme
        : theme === 'BW_ECO_TONER'
          ? 'BRAND_PRIMARY'
          : theme;
    const palette = resolveThemePalette(effectiveTheme, brandKit);
    const forensicId = generateHrForensicId(hrNotice, brandKit.companyName);
    const safeCompanyName = (brandKit.companyName || 'Grupo Coagro').replace(/\s*\($/, '').trim();

    const archetypeBadge =
        hrNotice.archetype === 'JOB_VACANCY'
            ? 'OPORTUNIDADE DE CARREIRA / RH'
            : hrNotice.archetype === 'SAFETY_COMPLIANCE'
              ? 'SEGURANÇA DO TRABALHO & COMPLIANCE'
              : hrNotice.archetype === 'HOLIDAY_CLOSURE'
                ? 'HORÁRIO DE FERIADO & FUNCIONAMENTO'
                : 'COMUNICADO OFICIAL DA REDE';

    return (
        <div
            ref={canvasRef}
            style={{
                containerType: 'inline-size',
                backgroundColor: palette.canvasBg,
                color: palette.canvasText,
                fontFamily: brandKit.fontHeading,
            }}
            data-sheet={isA4 ? 'a4-hr-notice' : 'social-hr-notice'}
            data-hr-archetype={hrNotice.archetype}
            data-hr-channel={hrNotice.channel || 'MURAL_A4'}
            data-sku-code={hrNotice.referenceCode}
            data-brand-name={brandKit.companyName}
            data-font-heading={brandKit.fontHeading}
            data-font-body={brandKit.fontBody}
            className={`relative w-full ${
                isA4 ? 'aspect-[1/1.414]' : 'aspect-[4/5]'
            } overflow-hidden shadow-2xl select-none flex flex-col justify-between bg-white`}
        >
            {/* 1. CABEÇALHO INSTITUCIONAL WHITE-LABEL */}
            <div
                style={{
                    backgroundColor: palette.headerBg,
                    color: palette.headerText,
                }}
                className="px-[5.5cqw] py-[4cqw] border-b-[0.5cqw] flex flex-col gap-[1.5cqw]"
            >
                <div className="flex items-center justify-between gap-[2cqw]">
                    <div className="flex items-center gap-[2cqw] min-w-0">
                        {brandKit.defaultLogoUrl ? (
                            <img
                                src={brandKit.defaultLogoUrl}
                                alt={brandKit.companyName}
                                className="h-[6.5cqw] max-w-[22cqw] object-contain bg-white px-[1.2cqw] py-[0.5cqw] rounded-[1cqw] shrink-0"
                            />
                        ) : theme === 'BW_ECO_TONER' ? (
                            <LogoHorizontalMonoBranca className="h-[6.5cqw] max-w-[22cqw] w-auto shrink-0" />
                        ) : brandKit.activeDepartmentId === 'dept-2' ? (
                            <CoagroPetLogo className="h-[6.5cqw] max-w-[22cqw] w-auto bg-white px-[1.2cqw] py-[0.5cqw] rounded-[1cqw] shrink-0" />
                        ) : (
                            <LogoHorizontalBranca className="h-[6.5cqw] max-w-[22cqw] w-auto shrink-0" />
                        )}
                        <span className="font-black text-[3.8cqw] tracking-tight uppercase truncate">
                            {safeCompanyName}
                        </span>
                    </div>

                    <div className="flex items-center gap-[1.5cqw] shrink-0">
                        <span
                            style={{ fontFamily: brandKit.fontBody }}
                            className="px-[2.2cqw] py-[0.6cqw] rounded-[0.8cqw] bg-black/25 border border-white/25 text-[2cqw] font-mono font-bold uppercase"
                        >
                            CÓD: {hrNotice.referenceCode || 'RH-01'}
                        </span>
                        <span
                            style={{
                                backgroundColor: palette.accentBg,
                                color: palette.accentText,
                            }}
                            className="px-[2.8cqw] py-[0.6cqw] rounded-full font-black uppercase text-[2cqw] tracking-wider"
                        >
                            {archetypeBadge}
                        </span>
                    </div>
                </div>

                <h1 className="font-black uppercase text-[8cqw] leading-[0.95] tracking-tight mt-[0.8cqw]">
                    {hrNotice.headline || 'ESTAMOS CONTRATANDO'}
                </h1>
            </div>

            {/* 2. CORPO CENTRAL: CARGO / ASSUNTO + REQUISITOS / ORIENTAÇÕES + BENEFÍCIOS */}
            <div className="px-[6cqw] py-[4cqw] flex-1 flex flex-col justify-between">
                <div>
                    <span
                        style={{ fontFamily: brandKit.fontBody }}
                        className="text-[2.3cqw] font-extrabold uppercase tracking-widest text-slate-500 block"
                    >
                        {hrNotice.archetype === 'JOB_VACANCY'
                            ? 'CARGO / FUNÇÃO EM ABERTO:'
                            : hrNotice.archetype === 'SAFETY_COMPLIANCE'
                              ? 'NORMA / PROCEDIMENTO OPERACIONAL:'
                              : hrNotice.archetype === 'HOLIDAY_CLOSURE'
                                ? 'EXPEDIENTE & ATENDIMENTO:'
                                : 'ASSUNTO DO COMUNICADO:'}
                    </span>
                    <h2
                        style={{ color: palette.priceText }}
                        className="font-black uppercase text-[6.4cqw] leading-[1.02] tracking-tight mt-[0.8cqw]"
                    >
                        {hrNotice.roleOrSubject}
                    </h2>

                    {hrNotice.scheduleOrLocation && (
                        <div
                            style={{ fontFamily: brandKit.fontBody }}
                            className="mt-[1.8cqw] inline-flex items-center gap-[1.2cqw] px-[3cqw] py-[1cqw] rounded-[1.2cqw] bg-slate-100 border border-slate-300 text-[2.5cqw] font-bold text-slate-800"
                        >
                            <span>📍 {hrNotice.scheduleOrLocation}</span>
                        </div>
                    )}

                    {/* Lista de Requisitos ou Pontos do Comunicado */}
                    <div
                        style={{ fontFamily: brandKit.fontBody }}
                        className="mt-[3.5cqw] space-y-[1.8cqw]"
                    >
                        <span className="text-[2.3cqw] font-extrabold uppercase tracking-wider text-slate-600 block">
                            {hrNotice.archetype === 'JOB_VACANCY'
                                ? 'REQUISITOS & PERFIL DESEJADO:'
                                : hrNotice.archetype === 'HOLIDAY_CLOSURE'
                                  ? 'INFORMAÇÕES DE ATENDIMENTO:'
                                  : 'ORIENTAÇÕES OBRIGATÓRIAS:'}
                        </span>
                        {hrNotice.requirementsOrPoints.map((req, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-[2cqw] bg-slate-50 border border-slate-200 rounded-[1.5cqw] px-[3.2cqw] py-[1.8cqw]"
                            >
                                <span
                                    style={{
                                        backgroundColor: palette.headerBg,
                                        color: palette.headerText,
                                    }}
                                    className="w-[3.8cqw] h-[3.8cqw] rounded-full flex items-center justify-center text-[2.1cqw] font-black shrink-0 mt-[0.2cqw]"
                                >
                                    {idx + 1}
                                </span>
                                <span className="text-[2.8cqw] font-bold text-slate-800 leading-snug">
                                    {req}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Destaque de Remuneração / Condição / Alerta */}
                <div className="mt-[3cqw] space-y-[2cqw]">
                    {hrNotice.compensationOrHighlight && (
                        <div
                            style={{
                                backgroundColor: palette.accentBg,
                                color: palette.accentText,
                            }}
                            className="w-full rounded-[2cqw] px-[4cqw] py-[2.4cqw] border-2 border-slate-900 shadow-sm text-center"
                        >
                            <span
                                style={{ fontFamily: brandKit.fontBody }}
                                className="text-[2cqw] font-extrabold uppercase tracking-widest block opacity-85"
                            >
                                {hrNotice.archetype === 'JOB_VACANCY'
                                    ? 'OFERECEMOS / REMUNERAÇÃO E BENEFÍCIOS'
                                    : hrNotice.archetype === 'HOLIDAY_CLOSURE'
                                      ? 'RETORNO DAS ATIVIDADES'
                                      : 'DESTAQUE OPERACIONAL'}
                            </span>
                            <span className="font-black uppercase text-[4.2cqw] leading-tight block mt-[0.4cqw]">
                                {hrNotice.compensationOrHighlight}
                            </span>
                        </div>
                    )}

                    {/* Canal de Envio / Contato */}
                    <div
                        style={{ fontFamily: brandKit.fontBody }}
                        className="w-full rounded-[2cqw] px-[4cqw] py-[2.2cqw] bg-slate-900 text-white flex items-center justify-between gap-[2cqw]"
                    >
                        <div className="flex flex-col min-w-0">
                            <span className="text-[1.9cqw] font-bold uppercase tracking-wider text-amber-300">
                                COMO PARTICIPAR / CANAL OFICIAL:
                            </span>
                            <span className="text-[2.8cqw] font-extrabold leading-tight truncate mt-[0.3cqw]">
                                {hrNotice.contactChannel}
                            </span>
                        </div>
                        <span className="px-[2.5cqw] py-[1cqw] rounded-[1cqw] bg-white/15 font-mono text-[2.1cqw] font-bold shrink-0">
                            CÓD: {hrNotice.referenceCode}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. RODAPÉ FORENSE E VIGÊNCIA */}
            <div
                style={{
                    backgroundColor: palette.headerBg,
                    color: palette.headerText,
                    fontFamily: brandKit.fontBody,
                    borderColor: palette.headerBg,
                }}
                className="px-[5.5cqw] py-[2cqw] border-t-[0.4cqw] flex items-center justify-between text-[2cqw] font-bold uppercase"
            >
                <span>
                    CÓD: {hrNotice.referenceCode} • {hrNotice.validityOrDeadlineText}
                </span>
                <span className="font-mono font-semibold">
                    {brandKit.companyName} • #{forensicId}
                </span>
            </div>
        </div>
    );
};
