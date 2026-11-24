import type { PriceListExportData } from '../types/priceList.types';
import { buildPriceListDocument, type PriceListDocumentOptions } from './buildPriceListDocument';

const logoAsDataUrl = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
};

export const createPriceListPdf = async (
    data: PriceListExportData,
    options: Omit<PriceListDocumentOptions, 'logoDataUrl'>
): Promise<Blob> => {
    const [{ default: pdfMake }, { default: virtualFileSystem }, logoDataUrl] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts'),
        logoAsDataUrl(data.store.logo_url),
    ]);
    pdfMake.addVirtualFileSystem(virtualFileSystem);
    return pdfMake.createPdf(buildPriceListDocument(data, { ...options, logoDataUrl })).getBlob();
};
