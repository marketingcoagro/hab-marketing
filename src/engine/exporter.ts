// src/engine/exporter.ts
import { TenantBrandKit } from '../core/types';

/**
 * Imprime ou gera PDF A4 em qualidade vetorial máxima (300 DPI)
 * clonando apenas a folha A4 e todos os estilos Tailwind/Container Queries
 * dentro de um iframe oculto com @page { size: A4 portrait; margin: 0 }.
 * Usa evento onafterprint com fallback para evitar condição de corrida.
 */
export function printOrSaveA4Sheet(
    element: HTMLElement | null,
    documentTitle = 'cartaz-oferta-a4'
): void {
    if (!element || typeof window === 'undefined') return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
        document.body.removeChild(iframe);
        return;
    }

    // Copia todas as tags <style> e <link rel="stylesheet"> do app principal (Tailwind + Fontes)
    const styleNodes = Array.from(
        document.querySelectorAll('style, link[rel="stylesheet"]')
    )
        .map((node) => node.outerHTML)
        .join('\n');

    const safeDocumentTitle = String(documentTitle || 'cartaz-oferta-a4')
        .replace(/[<>"'&]/g, '')
        .slice(0, 120);

    doc.open();
    doc.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>${safeDocumentTitle}</title>
        ${styleNodes}
        <style>
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-sheet-wrapper {
            width: 210mm !important;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: stretch;
          }
          .print-sheet-wrapper [data-sheet] {
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: none !important;
          }
          .print-sheet-wrapper [data-sheet]:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        </style>
      </head>
      <body>
        <div class="print-sheet-wrapper">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);
    doc.close();

    // Aguarda carregamento de fontes/estilos e dispara o diálogo nativo
    setTimeout(() => {
        let cleanedUp = false;
        const cleanup = () => {
            if (cleanedUp) return;
            cleanedUp = true;
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        };

        if (iframe.contentWindow) {
            iframe.contentWindow.onafterprint = cleanup;
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }

        // Fallback seguro de 60s caso o usuário cancele ou o navegador não dispare onafterprint
        setTimeout(cleanup, 60000);
    }, 400);
}

/**
 * Recorta as bordas transparentes e remove automaticamente fundos claros uniformes de catálogo
 * (#FFFFFF, cinza gelo, off-white conectado às bordas) de fotos JPG/PNG de produtos.
 * Custo R$ 0, roda 100% no cliente via Canvas 2D preservando brancos internos do rótulo.
 */
export async function tightCropAlphaDataUrl(
    dataUrl: string,
    removeWhiteBackground = true
): Promise<string> {
    if (typeof window === 'undefined' || !dataUrl) return dataUrl;

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;

                // Otimização de Performance (P2): Limita fotos de alta resolução (ex: 12MP de celular)
                // a 1600px para economizar até 80% de memória e CPU no flood-fill sem perder qualidade 1080p.
                const MAX_DIM = 1600;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width >= height) {
                        height = Math.round((height * MAX_DIM) / width);
                        width = MAX_DIM;
                    } else {
                        width = Math.round((width * MAX_DIM) / height);
                        height = MAX_DIM;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(dataUrl);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                const imgData = ctx.getImageData(0, 0, width, height);
                const data = imgData.data;

                // Passo 1: Remoção inteligente de fundo claro/estúdio conectado às bordas (Flood-Fill)
                // Amostra os 4 cantos para detectar fundos brancos, off-white ou cinza-claro de catálogo
                if (removeWhiteBackground && width > 4 && height > 4) {
                    const totalPixels = width * height;
                    const visited = new Uint8Array(totalPixels);
                    const queue = new Int32Array(totalPixels);
                    let head = 0;
                    let tail = 0;

                    // Amostra os 4 cantos da imagem para calibrar o fundo real do estúdio
                    const cornerCoords = [
                        0,
                        width - 1,
                        (height - 1) * width,
                        (height - 1) * width + (width - 1),
                    ];
                    let bgR = 255;
                    let bgG = 255;
                    let bgB = 255;
                    let validCornerCount = 0;
                    let sumR = 0;
                    let sumG = 0;
                    let sumB = 0;

                    for (const pIdx of cornerCoords) {
                        const idx = pIdx * 4;
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];
                        const a = data[idx + 3];
                        const maxC = Math.max(r, g, b);
                        const minC = Math.min(r, g, b);
                        if (a > 200 && r >= 220 && g >= 220 && b >= 220 && maxC - minC <= 22) {
                            sumR += r;
                            sumG += g;
                            sumB += b;
                            validCornerCount++;
                        }
                    }

                    if (validCornerCount > 0) {
                        bgR = Math.round(sumR / validCornerCount);
                        bgG = Math.round(sumG / validCornerCount);
                        bgB = Math.round(sumB / validCornerCount);
                    }

                    const isStudioBackground = (pixelIndex: number): boolean => {
                        const idx = pixelIndex * 4;
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];
                        const a = data[idx + 3];
                        if (a < 15) return true;
                        const maxC = Math.max(r, g, b);
                        const minC = Math.min(r, g, b);
                        // Aceita branco de estúdio clássico OU cor próxima ao fundo neutro amostrado nos cantos
                        const isPureWhite = r >= 240 && g >= 240 && b >= 240 && maxC - minC <= 16;
                        const distToCornerBg =
                            Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
                        const isSampledNeutralBg =
                            validCornerCount > 0 &&
                            r >= 224 &&
                            g >= 224 &&
                            b >= 224 &&
                            maxC - minC <= 20 &&
                            distToCornerBg <= 36;
                        return isPureWhite || isSampledNeutralBg;
                    };

                    const enqueueIfBackground = (px: number, py: number) => {
                        const pIdx = py * width + px;
                        if (visited[pIdx] === 0 && isStudioBackground(pIdx)) {
                            visited[pIdx] = 1;
                            queue[tail++] = pIdx;
                        }
                    };

                    // Sementes nas 4 bordas da imagem
                    for (let x = 0; x < width; x++) {
                        enqueueIfBackground(x, 0);
                        enqueueIfBackground(x, height - 1);
                    }
                    for (let y = 1; y < height - 1; y++) {
                        enqueueIfBackground(0, y);
                        enqueueIfBackground(width - 1, y);
                    }

                    // Flood-fill 4-conectado para tornar transparente o fundo externo
                    while (head < tail) {
                        const curr = queue[head++];
                        data[curr * 4 + 3] = 0; // Torna transparente

                        const cx = curr % width;
                        const cy = (curr - cx) / width;

                        if (cx > 0) enqueueIfBackground(cx - 1, cy);
                        if (cx < width - 1) enqueueIfBackground(cx + 1, cy);
                        if (cy > 0) enqueueIfBackground(cx, cy - 1);
                        if (cy < height - 1) enqueueIfBackground(cx, cy + 1);
                    }

                    // Suavização de borda (anti-halo progressivo) nos pixels imediatamente vizinhos ao fundo removido
                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            const pIdx = y * width + x;
                            if (visited[pIdx] === 1) continue;
                            const removedNeighbors =
                                (visited[pIdx - 1] === 1 ? 1 : 0) +
                                (visited[pIdx + 1] === 1 ? 1 : 0) +
                                (visited[pIdx - width] === 1 ? 1 : 0) +
                                (visited[pIdx + width] === 1 ? 1 : 0);
                            if (removedNeighbors > 0) {
                                const idx = pIdx * 4;
                                const r = data[idx];
                                const g = data[idx + 1];
                                const b = data[idx + 2];
                                const lum = (r + g + b) / 3;
                                if (lum > 218) {
                                    const fadeFactor = Math.max(0.2, (255 - lum) / 37);
                                    data[idx + 3] = Math.round(data[idx + 3] * fadeFactor);
                                }
                            }
                        }
                    }

                    ctx.putImageData(imgData, 0, 0);
                }

                // Passo 2: Varre os pixels identificando o bounding box do produto recortado
                let minX = width;
                let minY = height;
                let maxX = 0;
                let maxY = 0;
                let foundContent = false;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const idx = (y * width + x) * 4;
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];
                        const a = data[idx + 3];

                        const isTransparent = a < 20;
                        const isWhiteBackground =
                            !removeWhiteBackground && r > 248 && g > 248 && b > 248 && a > 240;

                        if (!isTransparent && !isWhiteBackground) {
                            foundContent = true;
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }

                if (!foundContent) {
                    resolve(dataUrl);
                    return;
                }

                // Margem de segurança de 2%
                const padding = Math.max(4, Math.round(Math.min(width, height) * 0.02));
                const cropX = Math.max(0, minX - padding);
                const cropY = Math.max(0, minY - padding);
                const cropW = Math.min(width - cropX, maxX - minX + padding * 2);
                const cropH = Math.min(height - cropY, maxY - minY + padding * 2);

                const croppedCanvas = document.createElement('canvas');
                croppedCanvas.width = cropW;
                croppedCanvas.height = cropH;

                const croppedCtx = croppedCanvas.getContext('2d');
                if (!croppedCtx) {
                    resolve(dataUrl);
                    return;
                }

                croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
                resolve(croppedCanvas.toDataURL('image/png'));
            } catch {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

export interface ProductImageDiagnostics {
    width: number;
    height: number;
    aspectRatio: number;
    transparencyRatio: number;
    hadWhiteBackgroundRemoved: boolean;
    dominantHex: string;
    qualityLabel: 'EXCELLENT_STUDIO' | 'GOOD_CATALOG' | 'LOW_RES_WARN';
    summaryText: string;
}

/**
 * Analisa instantaneamente a imagem do produto (pós-recorte) no navegador a custo R$ 0:
 * verifica resolução para exportação 1080p, taxa de transparência/recorte do fundo
 * e cor dominante da embalagem para dar feedback imediato ao operador.
 */
export async function analyzeProductImageLocal(
    croppedDataUrl: string
): Promise<ProductImageDiagnostics | null> {
    if (typeof window === 'undefined' || !croppedDataUrl) return null;

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;
                const sampleSize = 64;
                const canvas = document.createElement('canvas');
                canvas.width = sampleSize;
                canvas.height = sampleSize;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(null);
                    return;
                }

                ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
                const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

                let transparentCount = 0;
                let opaqueCount = 0;
                let rSum = 0;
                let gSum = 0;
                let bSum = 0;

                const total = sampleSize * sampleSize;
                for (let i = 0; i < total; i++) {
                    const idx = i * 4;
                    const a = data[idx + 3];
                    if (a < 30) {
                        transparentCount++;
                    } else {
                        opaqueCount++;
                        rSum += data[idx];
                        gSum += data[idx + 1];
                        bSum += data[idx + 2];
                    }
                }

                const transparencyRatio = Number((transparentCount / total).toFixed(2));
                const hadWhiteBackgroundRemoved = transparencyRatio >= 0.08;

                const avgR = opaqueCount > 0 ? Math.round(rSum / opaqueCount) : 16;
                const avgG = opaqueCount > 0 ? Math.round(gSum / opaqueCount) : 185;
                const avgB = opaqueCount > 0 ? Math.round(bSum / opaqueCount) : 129;
                const toHex = (n: number) => n.toString(16).padStart(2, '0');
                const dominantHex = `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`.toUpperCase();

                const minDim = Math.min(width, height);
                const qualityLabel: ProductImageDiagnostics['qualityLabel'] =
                    minDim >= 500 && hadWhiteBackgroundRemoved
                        ? 'EXCELLENT_STUDIO'
                        : minDim >= 260
                          ? 'GOOD_CATALOG'
                          : 'LOW_RES_WARN';

                const summaryText =
                    qualityLabel === 'EXCELLENT_STUDIO'
                        ? `Recorte studio HD (${width}×${height}px) • Fundo transparente (${Math.round(
                              transparencyRatio * 100
                          )}% livre)`
                        : qualityLabel === 'GOOD_CATALOG'
                          ? `Imagem pronta (${width}×${height}px)${
                                hadWhiteBackgroundRemoved ? ' • Fundo removido' : ''
                            }`
                          : `Resolução baixa (${width}×${height}px) — recomendada foto acima de 400px para 1080p`;

                resolve({
                    width,
                    height,
                    aspectRatio: Number((width / Math.max(1, height)).toFixed(2)),
                    transparencyRatio,
                    hadWhiteBackgroundRemoved,
                    dominantHex,
                    qualityLabel,
                    summaryText,
                });
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = croppedDataUrl;
    });
}

/**
 * O CSS do Tailwind 4 contém at-rules como `syntax: "<color>"`. O caractere `<`
 * não pode entrar cru no `<style>` de um SVG XML, ou o parser invalida todo o
 * documento e o `Image` falha antes do Canvas. Escapar preserva o CSS final.
 */
function escapeCssForSvgStyle(cssText: string): string {
    return cssText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Exporta qualquer elemento DOM para PNG em alta resolução.
 * Suporta compartilhamento direto no WhatsApp (Mobile Web Share API) com fallback para download + link WhatsApp.
 * Injeta definições de fontes Google Fonts ativas para evitar fallback para Arial em sandbox de SVG/Image.
 */
export async function exportElementToPng(
    element: HTMLElement | null,
    fileName = 'arte-oferta.png',
    targetWidth = 1080,
    shareToWhatsApp = false,
    brandKit?: TenantBrandKit
): Promise<void> {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const scale = targetWidth / rect.width;
    const targetHeight = Math.round(rect.height * scale);

    let cssText = '';
    for (const sheet of Array.from(document.styleSheets)) {
        try {
            for (const rule of Array.from(sheet.cssRules)) {
                cssText += rule.cssText + '\n';
            }
        } catch {
            // Ignora folhas de estilo restritas
        }
    }

    const cloned = element.cloneNode(true) as HTMLElement;
    cloned.style.width = `${rect.width}px`;
    cloned.style.height = `${rect.height}px`;
    cloned.style.margin = '0';

    const xmlSerializer = new XMLSerializer();
    const serializedHtml = xmlSerializer.serializeToString(cloned);

    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${targetHeight}" viewBox="0 0 ${rect.width} ${rect.height}">
      <style>
        ${escapeCssForSvgStyle(cssText)}
      </style>
      <foreignObject width="100%" height="100%">
        ${serializedHtml}
      </foreignObject>
    </svg>
  `;

    // SVG com <foreignObject> carregado por blob: é tratado como conteúdo
    // cross-origin pelo Chromium e taints o canvas. Data URI mantém o canvas
    // exportável, permitindo o toBlob/download do PNG.
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Contexto 2D indisponível'));
                return;
            }

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    reject(new Error('Falha ao gerar PNG'));
                    return;
                }

                const safeFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;

                if (shareToWhatsApp) {
                    const file = new File([blob], safeFileName, { type: 'image/png' });

                    if (
                        typeof navigator !== 'undefined' &&
                        navigator.canShare &&
                        navigator.canShare({ files: [file] })
                    ) {
                        try {
                            await navigator.share({
                                files: [file],
                                title: safeFileName,
                                text: 'Arte gerada no Studio Varejo Pro',
                            });
                            resolve();
                            return;
                        } catch {
                            // Se usuário cancelou o share nativo, faz fallback para download + wa.me
                        }
                    }

                    // Fallback: faz download e abre WhatsApp Web
                    const downloadUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = safeFileName;
                    link.href = downloadUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(downloadUrl);

                    window.open('https://api.whatsapp.com/send', '_blank');
                    resolve();
                    return;
                }

                const downloadUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = safeFileName;
                link.href = downloadUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(downloadUrl);
                resolve();
            }, 'image/png');
        };
        img.onerror = (err) => {
            reject(err);
        };
        img.src = svgDataUrl;
    });
}