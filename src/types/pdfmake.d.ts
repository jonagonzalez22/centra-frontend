declare module 'pdfmake/build/pdfmake' {
    interface PdfDocument {
        getBlob(): Promise<Blob>;
    }

    interface PdfMake {
        addVirtualFileSystem(virtualFileSystem: Record<string, string>): void;
        createPdf(documentDefinition: unknown): PdfDocument;
    }

    const pdfMake: PdfMake;

    export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
    const virtualFileSystem: Record<string, string>;

    export default virtualFileSystem;
}
