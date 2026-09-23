import { formatCurrencyWithCents } from '@/utils/formatters';
import type { ReceiptData } from '../interfaces/sale.interface';
import { formatCuit, formatReceiptOccurredAt } from '../utils/receipt-formatters';
import type { A4DocumentDefinition, PdfDocumentNode } from './a4-document.types';

const COLORS = {
    border: '#d8d8d8',
    borderStrong: '#9a9a9a',
    header: '#f2f2f2',
    highlight: '#eeeeee',
    primary: '#111111',
    secondary: '#555555',
} as const;

const tableLayout = {
    fillColor: (rowIndex: number) => (rowIndex === 0 ? COLORS.header : null),
    hLineColor: () => COLORS.border,
    hLineWidth: () => 0.6,
    paddingBottom: () => 3,
    paddingLeft: () => 9,
    paddingRight: () => 9,
    paddingTop: () => 3,
    vLineColor: () => COLORS.border,
    vLineWidth: () => 0.6,
};

const partyBlock = (label: string, value: string): PdfDocumentNode => ({
    table: {
        body: [
            [{ text: label.toUpperCase(), bold: true, fontSize: 9, color: COLORS.primary }],
            [{ text: value, bold: true, fontSize: 10.5, color: COLORS.primary }],
        ],
        widths: ['*'],
    },
    layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? COLORS.header : '#ffffff'),
        hLineColor: () => COLORS.border,
        hLineWidth: () => 0.6,
        paddingBottom: (rowIndex: number) => (rowIndex === 0 ? 6 : 9),
        paddingLeft: () => 10,
        paddingRight: () => 10,
        paddingTop: (rowIndex: number) => (rowIndex === 0 ? 6 : 9),
        vLineColor: () => COLORS.border,
        vLineWidth: () => 0.6,
    },
});

const totalRow = (label: string, value: string, emphasized = false): PdfDocumentNode[] => [
    {
        text: label,
        bold: emphasized,
        fontSize: emphasized ? 14 : 10.5,
        color: COLORS.primary,
    },
    {
        text: value,
        alignment: 'right',
        bold: emphasized,
        fontSize: emphasized ? 15 : 10.5,
        color: COLORS.primary,
    },
];

export const buildA4Document = (receipt: ReceiptData): A4DocumentDefinition => {
    const { store, operation, customer, items, totals, payments } = receipt;
    const [date, time] = formatReceiptOccurredAt(operation.occurred_at).split(' ');
    const partyDetails = [
        customer ? partyBlock('Cliente', customer.display_name) : null,
        operation.cashier ? partyBlock('Cajero', operation.cashier.name) : null,
    ].filter((detail): detail is PdfDocumentNode => detail !== null);

    const itemRows: PdfDocumentNode[][] = [
        [
            { text: 'Producto', bold: true, fontSize: 9.5 },
            { text: 'Cant.', bold: true, fontSize: 9.5, alignment: 'center' },
            { text: 'Precio unit.', bold: true, fontSize: 9.5, alignment: 'right' },
            { text: 'Subtotal', bold: true, fontSize: 9.5, alignment: 'right' },
        ],
        ...items.map((item) => [
            { text: item.product_name, fontSize: 10 },
            { text: String(item.quantity), alignment: 'center', fontSize: 10 },
            { text: formatCurrencyWithCents(item.unit_price), alignment: 'right', fontSize: 10 },
            {
                text: formatCurrencyWithCents(item.subtotal),
                alignment: 'right',
                fontSize: 10,
                bold: true,
            },
        ]),
    ];

    const totalsRows: PdfDocumentNode[][] = [
        totalRow('Subtotal', formatCurrencyWithCents(totals.subtotal)),
    ];

    if (totals.discount > 0) {
        totalsRows.push(totalRow('Descuento', `-${formatCurrencyWithCents(totals.discount)}`));
    }

    if (totals.tax > 0) {
        totalsRows.push(totalRow('Impuestos', formatCurrencyWithCents(totals.tax)));
    }

    totalsRows.push(totalRow('TOTAL', formatCurrencyWithCents(totals.total), true));

    const paymentRows: PdfDocumentNode[][] = [
        [
            { text: 'Método', bold: true, fontSize: 9.5 },
            { text: 'Importe', bold: true, fontSize: 9.5, alignment: 'right' },
        ],
        ...payments.map((payment) => [
            { text: payment.method_name ?? 'Medio de pago', fontSize: 10 },
            { text: formatCurrencyWithCents(payment.amount), alignment: 'right', fontSize: 10 },
        ]),
    ];

    const closing: PdfDocumentNode[] = [
        {
            table: {
                body: totalsRows,
                widths: ['*', 'auto'],
            },
            layout: {
                fillColor: (rowIndex: number) =>
                    rowIndex === totalsRows.length - 1 ? COLORS.highlight : '#ffffff',
                hLineColor: (index: number) =>
                    index === totalsRows.length - 1 ? COLORS.borderStrong : COLORS.border,
                hLineWidth: () => 0.6,
                paddingBottom: (rowIndex: number) => (rowIndex === totalsRows.length - 1 ? 11 : 8),
                paddingLeft: () => 11,
                paddingRight: () => 11,
                paddingTop: (rowIndex: number) => (rowIndex === totalsRows.length - 1 ? 11 : 8),
                vLineColor: () => COLORS.border,
                vLineWidth: () => 0.6,
            },
            margin: [260, 16, 0, 0],
        },
    ];

    if (payments.length > 0) {
        closing.push(
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: 505,
                        y2: 0,
                        lineWidth: 0.8,
                        lineColor: COLORS.borderStrong,
                    },
                ],
                margin: [0, 28, 0, 10],
            },
            { text: 'FORMAS DE PAGO', bold: true, fontSize: 10.5, margin: [0, 0, 0, 8] },
            {
                table: {
                    body: paymentRows,
                    headerRows: 1,
                    widths: ['*', 112],
                },
                layout: tableLayout,
            }
        );
    }

    return {
        pageSize: 'A4',
        pageMargins: [45, 52, 45, 54],
        defaultStyle: {
            color: COLORS.primary,
            font: 'Roboto',
            fontSize: 10,
            lineHeight: 1.3,
        },
        header: (currentPage) => {
            if (currentPage === 1) return null;

            return {
                columns: [
                    { text: store.name ?? '', fontSize: 8.5, bold: true, color: COLORS.secondary },
                    {
                        text: `Venta ${operation.operation_number}`,
                        fontSize: 8.5,
                        bold: true,
                        color: COLORS.secondary,
                        alignment: 'right',
                    },
                ],
                margin: [45, 20, 45, 0],
            };
        },
        footer: (currentPage, pageCount) => ({
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: 'right',
            color: COLORS.secondary,
            fontSize: 8.5,
            margin: [0, 0, 45, 18],
        }),
        content: [
            {
                columns: [
                    {
                        width: '*',
                        stack: [
                            {
                                text: store.name ?? '',
                                bold: true,
                                fontSize: 18,
                                margin: [0, 0, 0, 9],
                            },
                            ...(store.cuit
                                ? [
                                      {
                                          text: `CUIT ${formatCuit(store.cuit)}`,
                                          fontSize: 9.5,
                                          color: COLORS.secondary,
                                      },
                                  ]
                                : []),
                            ...(store.address
                                ? [{ text: store.address, fontSize: 9.5, color: COLORS.secondary }]
                                : []),
                        ],
                    },
                    {
                        width: 193,
                        table: {
                            body: [
                                [
                                    {
                                        text: 'COMPROBANTE DE VENTA',
                                        alignment: 'center',
                                        bold: true,
                                        fontSize: 14,
                                    },
                                ],
                                [
                                    {
                                        text: `Nro. de venta: ${operation.operation_number}`,
                                        alignment: 'center',
                                        bold: true,
                                        fontSize: 11,
                                        margin: [0, 7, 0, 5],
                                    },
                                ],
                                [
                                    {
                                        text: `Fecha: ${date}`,
                                        alignment: 'center',
                                        color: COLORS.secondary,
                                        fontSize: 9.5,
                                    },
                                ],
                                ...(time
                                    ? [
                                          [
                                              {
                                                  text: `Hora: ${time}`,
                                                  alignment: 'center',
                                                  color: COLORS.secondary,
                                                  fontSize: 9.5,
                                              },
                                          ],
                                      ]
                                    : []),
                            ],
                            widths: ['*'],
                        },
                        layout: {
                            hLineColor: () => COLORS.borderStrong,
                            hLineWidth: () => 0.8,
                            paddingBottom: () => 4,
                            paddingLeft: () => 14,
                            paddingRight: () => 14,
                            paddingTop: () => 4,
                            vLineColor: () => COLORS.borderStrong,
                            vLineWidth: () => 0.8,
                        },
                    },
                ],
                columnGap: 34,
            },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: 505,
                        y2: 0,
                        lineWidth: 1,
                        lineColor: '#777777',
                    },
                ],
                margin: [0, 20, 0, 17],
            },
            ...(operation.status === 'cancelled'
                ? [
                      {
                          text: 'VENTA CANCELADA',
                          alignment: 'center',
                          bold: true,
                          fontSize: 12,
                          margin: [0, 0, 0, 14],
                      },
                  ]
                : []),
            ...(partyDetails.length > 0
                ? [
                      {
                          columns: partyDetails.map((detail) => ({ width: '*', stack: [detail] })),
                          columnGap: partyDetails.length > 1 ? 20 : 0,
                          margin: [0, 0, 0, 20],
                      },
                  ]
                : []),
            {
                table: {
                    body: itemRows,
                    dontBreakRows: true,
                    headerRows: 1,
                    keepWithHeaderRows: 1,
                    widths: ['*', 50, 94, 94],
                },
                layout: tableLayout,
            },
            {
                stack: closing,
                unbreakable: true,
            },
            {
                stack: [
                    {
                        canvas: [
                            {
                                type: 'line',
                                x1: 0,
                                y1: 0,
                                x2: 505,
                                y2: 0,
                                lineWidth: 0.8,
                                lineColor: '#777777',
                            },
                        ],
                    },
                    {
                        canvas: [
                            {
                                type: 'line',
                                x1: 0,
                                y1: 0,
                                x2: 51,
                                y2: 0,
                                lineWidth: 0.6,
                                lineColor: COLORS.borderStrong,
                            },
                        ],
                        margin: [227, 34, 0, 10],
                    },
                    {
                        text: 'GRACIAS POR SU COMPRA',
                        alignment: 'center',
                        bold: true,
                        fontSize: 9,
                        color: COLORS.primary,
                    },
                    {
                        canvas: [
                            {
                                type: 'line',
                                x1: 0,
                                y1: 0,
                                x2: 34,
                                y2: 0,
                                lineWidth: 0.6,
                                lineColor: COLORS.borderStrong,
                            },
                        ],
                        margin: [235, 10, 0, 0],
                    },
                ],
                margin: [0, 38, 0, 0],
            },
        ],
    };
};
