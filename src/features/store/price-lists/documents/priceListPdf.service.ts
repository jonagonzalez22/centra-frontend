import type { PriceListExportData } from '../types/priceList.types';
import { buildPriceListDocument, type PriceListDocumentOptions } from './buildPriceListDocument';

export const createPriceListPdf = async (
    data: PriceListExportData,
    options: PriceListDocumentOptions
): Promise<Blob> => {
    const [{ default: pdfMake }, { default: virtualFileSystem }] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts'),
    ]);
    pdfMake.addVirtualFileSystem(virtualFileSystem);
    return pdfMake.createPdf(buildPriceListDocument(data, options)).getBlob();
};
