/**
 * pdfmake 0.3 does not ship TypeScript declarations. These local structural
 * types keep the document builder explicit without coupling CENTRA to an
 * unofficial declarations package.
 */
export type PdfDocumentNode = Record<string, unknown>;

export interface A4DocumentDefinition {
    content: PdfDocumentNode[];
    defaultStyle: {
        color: string;
        font: 'Roboto';
        fontSize: number;
        lineHeight: number;
    };
    footer: (currentPage: number, pageCount: number) => PdfDocumentNode;
    header: (currentPage: number) => PdfDocumentNode | null;
    pageMargins: [number, number, number, number];
    pageSize: 'A4';
}
