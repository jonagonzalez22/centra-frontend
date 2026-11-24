import { formatCurrencyWithCents } from '@/utils/formatters';
import type {
    A4DocumentDefinition,
    PdfDocumentNode,
} from '@/features/store/sales/documents/a4-document.types';
import type { PriceListExportData, PriceListExportProduct } from '../types/priceList.types';

const colors = {
    border: '#d8d8d8',
    header: '#f2f2f2',
    categoryHeader: '#e4e4e4',
    primary: '#111111',
    secondary: '#555555',
} as const;

export interface PriceListDocumentOptions {
    groupByCategory: boolean;
}

const money = (value: string) => formatCurrencyWithCents(Number(value));
const percent = (value: string) => `${value.replace('.', ',').replace(/,00$/, '')}%`;
const unitLabel = (product: PriceListExportProduct) =>
    `1 ${product.measurement_unit.name.toLocaleLowerCase('es-AR')}`;
const compareByName = (left: string, right: string) =>
    left.localeCompare(right, 'es-AR', { sensitivity: 'base' });

const tableHeader = (isGeneral: boolean): PdfDocumentNode[] =>
    isGeneral
        ? [
              { text: 'Producto', bold: true, fontSize: 8.5 },
              { text: 'Precio', bold: true, fontSize: 8.5, alignment: 'right' },
          ]
        : [
              { text: 'Producto', bold: true, fontSize: 8.5 },
              { text: 'Precio de lista', bold: true, fontSize: 8.5, alignment: 'right' },
              { text: 'Desc.', bold: true, fontSize: 8.5, alignment: 'right' },
              { text: 'Precio final', bold: true, fontSize: 8.5, alignment: 'right' },
          ];

const productRow = (product: PriceListExportProduct, isGeneral: boolean): PdfDocumentNode[] => {
    const productCell: PdfDocumentNode = {
        stack: [
            { text: product.name, fontSize: 9.5 },
            {
                text: `Código: ${product.sku} · ${unitLabel(product)}`,
                fontSize: 7.5,
                color: colors.secondary,
                margin: [0, 1, 0, 0],
            },
        ],
    };

    return isGeneral
        ? [
              productCell,
              { text: money(product.final_price), alignment: 'right', bold: true, fontSize: 9.5 },
          ]
        : [
              productCell,
              { text: money(product.list_price), alignment: 'right', fontSize: 9 },
              { text: percent(product.discount_percentage), alignment: 'right', fontSize: 9 },
              { text: money(product.final_price), alignment: 'right', bold: true, fontSize: 9.5 },
          ];
};

const productTable = (products: PriceListExportProduct[], isGeneral: boolean): PdfDocumentNode => {
    const sortedProducts = [...products].sort((left, right) =>
        compareByName(left.name, right.name)
    );

    return {
        table: {
            body: [
                tableHeader(isGeneral),
                ...sortedProducts.map((product) => productRow(product, isGeneral)),
            ],
            headerRows: 1,
            dontBreakRows: true,
            keepWithHeaderRows: 1,
            widths: isGeneral ? ['*', 104] : ['*', 88, 48, 88],
        },
        layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? colors.header : null),
            hLineColor: () => colors.border,
            hLineWidth: () => 0.5,
            paddingBottom: () => 3,
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 3,
            vLineColor: () => colors.border,
            vLineWidth: () => 0.5,
        },
    };
};

const categoryTable = (
    category: string,
    products: PriceListExportProduct[],
    isGeneral: boolean
): PdfDocumentNode => {
    const columns = isGeneral ? 2 : 4;
    const sortedProducts = [...products].sort((left, right) =>
        compareByName(left.name, right.name)
    );

    return {
        table: {
            body: [
                [
                    {
                        text: category,
                        colSpan: columns,
                        alignment: 'center',
                        bold: true,
                        fontSize: 10.5,
                        margin: [0, 1, 0, 1],
                    },
                    ...Array(columns - 1).fill({}),
                ],
                tableHeader(isGeneral),
                ...sortedProducts.map((product) => productRow(product, isGeneral)),
            ],
            headerRows: 2,
            dontBreakRows: true,
            keepWithHeaderRows: 2,
            widths: isGeneral ? ['*', 104] : ['*', 88, 48, 88],
        },
        layout: {
            fillColor: (rowIndex: number) =>
                rowIndex === 0 ? colors.categoryHeader : rowIndex === 1 ? colors.header : null,
            hLineColor: () => colors.border,
            hLineWidth: () => 0.5,
            paddingBottom: () => 3,
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 3,
            vLineColor: () => colors.border,
            vLineWidth: () => 0.5,
        },
        margin: [0, 8, 0, 0],
    };
};

const groupedTables = (products: PriceListExportProduct[], isGeneral: boolean): PdfDocumentNode[] =>
    Object.entries(
        products.reduce<Record<string, PriceListExportProduct[]>>((groups, product) => {
            const category = product.category?.name ?? 'Sin categoría';
            (groups[category] ??= []).push(product);
            return groups;
        }, {})
    )
        .sort(([left], [right]) => compareByName(left, right))
        .map(([category, categoryProducts]) =>
            categoryTable(category, categoryProducts, isGeneral)
        );

export const buildPriceListDocument = (
    data: PriceListExportData,
    options: PriceListDocumentOptions
): A4DocumentDefinition => {
    const isGeneral = data.pricing_mode === 'general';
    const documentName = isGeneral
        ? 'Precios generales'
        : (data.price_list?.name ?? 'Lista comercial');
    const issuedAt = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(
        new Date(data.generated_at)
    );
    const contact = [data.store.phone, data.store.address].filter(Boolean).join(' · ');

    return {
        pageSize: 'A4',
        pageMargins: [32, 30, 32, 58],
        defaultStyle: { color: colors.primary, font: 'Roboto', fontSize: 9, lineHeight: 1.1 },
        header: (currentPage) =>
            currentPage === 1
                ? null
                : {
                      columns: [
                          {
                              text: data.store.name ?? '',
                              fontSize: 7.5,
                              bold: true,
                              color: colors.secondary,
                          },
                          {
                              text: `Lista de precios — ${documentName}`,
                              fontSize: 7.5,
                              alignment: 'right',
                              color: colors.secondary,
                          },
                      ],
                      margin: [32, 10, 32, 0],
                  },
        footer: (currentPage, pageCount) => ({
            stack: [
                ...(currentPage === pageCount
                    ? [
                          {
                              text: 'Precios informados a la fecha de emisión.\nConsultá su vigencia y la disponibilidad de los productos al momento de realizar tu pedido.',
                              alignment: 'center',
                              fontSize: 7.5,
                              color: colors.secondary,
                              margin: [32, 0, 32, 3],
                          },
                      ]
                    : []),
                {
                    text: `Página ${currentPage} de ${pageCount}`,
                    alignment: 'center',
                    fontSize: 7.5,
                    color: colors.secondary,
                    margin: [32, 0, 32, 8],
                },
            ],
        }),
        content: [
            {
                stack: [
                    { text: data.store.name ?? 'Comercio', bold: true, fontSize: 15 },
                    ...(contact
                        ? [
                              {
                                  text: contact,
                                  fontSize: 8.5,
                                  color: colors.secondary,
                                  margin: [0, 3, 0, 0],
                              },
                          ]
                        : []),
                ],
            },
            {
                text: `Lista de precios — ${documentName}`,
                bold: true,
                fontSize: 13,
                margin: [0, 16, 0, 2],
            },
            {
                text: `Emitida el ${issuedAt} · Precios por unidad de medida`,
                fontSize: 8.5,
                color: colors.secondary,
                margin: [0, 0, 0, 10],
            },
            ...(options.groupByCategory
                ? groupedTables(data.products, isGeneral)
                : [productTable(data.products, isGeneral)]),
        ],
    };
};
