import { formatCurrencyWithCents } from '@/utils/formatters';
import { formatQuantityWithUnit } from '@/utils/quantity';
import type { ReceiptData } from '../interfaces/sale.interface';
import {
    formatCuit,
    formatReceiptDiscountLabel,
    formatReceiptOccurredAt,
    receiptItemFinalAmount,
} from '../utils/receipt-formatters';
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
    paddingBottom: () => 2.5,
    paddingLeft: () => 5,
    paddingRight: () => 5,
    paddingTop: () => 2.5,
    vLineColor: () => COLORS.border,
    vLineWidth: () => 0.6,
};

const totalRow = (label: string, value: string, emphasized = false): PdfDocumentNode[] => [
    {
        text: label,
        bold: emphasized,
        fontSize: emphasized ? 12 : 9,
        color: COLORS.primary,
    },
    {
        text: value,
        alignment: 'right',
        bold: emphasized,
        fontSize: emphasized ? 12 : 9,
        color: COLORS.primary,
    },
];

export const buildA4Document = (receipt: ReceiptData): A4DocumentDefinition => {
    const { store, operation, customer, items, totals, payments } = receipt;
    const [date, time] = formatReceiptOccurredAt(operation.occurred_at).split(' ');
    const itemRows: PdfDocumentNode[][] = [
        [
            { text: 'Producto', bold: true, fontSize: 9 },
            { text: 'Cant.', bold: true, fontSize: 9, alignment: 'center' },
            { text: 'Precio unit.', bold: true, fontSize: 9, alignment: 'right' },
            { text: 'Descuento', bold: true, fontSize: 9, alignment: 'right' },
            { text: 'Total', bold: true, fontSize: 9, alignment: 'right' },
        ],
        ...items.map((item) => [
            {
                stack: [
                    { text: item.product_name, fontSize: 10 },
                    ...(item.discount_amount > 0
                        ? [
                              {
                                  text: formatReceiptDiscountLabel(
                                      item.price_list_name,
                                      item.discount_percentage
                                  ),
                                  fontSize: 8,
                                  color: COLORS.secondary,
                                  margin: [0, 1, 0, 0],
                              },
                          ]
                        : []),
                ],
            },
            {
                text: formatQuantityWithUnit(item.quantity, item.measurement_unit?.symbol),
                alignment: 'center',
                fontSize: 10,
            },
            { text: formatCurrencyWithCents(item.unit_price), alignment: 'right', fontSize: 10 },
            {
                text: item.discount_amount > 0 ? `-${formatCurrencyWithCents(item.discount_amount)}` : '—',
                alignment: 'right',
                fontSize: 10,
            },
            {
                text: formatCurrencyWithCents(
                    receiptItemFinalAmount(item.subtotal, item.discount_amount, item.tax_amount)
                ),
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

    const paymentRows: PdfDocumentNode[][] = payments.map((payment) => [
        { text: payment.method_name ?? 'Medio de pago', fontSize: 9.5 },
        { text: formatCurrencyWithCents(payment.amount), alignment: 'right', fontSize: 9.5 },
    ]);

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
                hLineWidth: (index: number) => (index === totalsRows.length - 1 ? 0.8 : 0.6),
                paddingBottom: (rowIndex: number) => (rowIndex === totalsRows.length - 1 ? 5 : 3),
                paddingLeft: () => 7,
                paddingRight: () => 7,
                paddingTop: (rowIndex: number) => (rowIndex === totalsRows.length - 1 ? 5 : 3),
                vLineColor: () => COLORS.border,
                vLineWidth: () => 0.6,
            },
            margin: [330, 8, 0, 0],
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
                        x2: 531,
                        y2: 0,
                        lineWidth: 0.5,
                        lineColor: COLORS.borderStrong,
                    },
                ],
                margin: [0, 9, 0, 4],
            },
            { text: 'FORMAS DE PAGO', bold: true, fontSize: 9, margin: [0, 0, 0, 4] },
            {
                table: {
                    body: paymentRows,
                    widths: ['*', 90],
                },
                layout: {
                    hLineWidth: () => 0,
                    paddingBottom: () => 1.5,
                    paddingLeft: () => 0,
                    paddingRight: () => 0,
                    paddingTop: () => 1.5,
                    vLineWidth: () => 0,
                },
            }
        );
    }

    return {
        pageSize: 'A4',
        pageMargins: [32, 30, 32, 26],
        defaultStyle: {
            color: COLORS.primary,
            font: 'Roboto',
            fontSize: 9,
            lineHeight: 1.1,
        },
        header: (currentPage) => {
            if (currentPage === 1) return null;

            return {
                columns: [
                    { text: store.name ?? '', fontSize: 7.5, bold: true, color: COLORS.secondary },
                    {
                        text: `Venta ${operation.operation_number}`,
                        fontSize: 7.5,
                        bold: true,
                        color: COLORS.secondary,
                        alignment: 'right',
                    },
                ],
                margin: [32, 10, 32, 0],
            };
        },
        footer: (currentPage, pageCount) => ({
            text: `Gracias por su compra · Página ${currentPage} de ${pageCount}`,
            alignment: 'center',
            color: COLORS.secondary,
            fontSize: 7.5,
            margin: [32, 0, 32, 8],
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
                                fontSize: 14,
                                margin: [0, 0, 0, 3],
                            },
                            ...(store.cuit
                                ? [
                                      {
                                          text: `CUIT ${formatCuit(store.cuit)}`,
                                          fontSize: 9,
                                          color: COLORS.secondary,
                                      },
                                  ]
                                : []),
                            ...(store.address
                                ? [{ text: store.address, fontSize: 9, color: COLORS.secondary }]
                                : []),
                        ],
                    },
                    {
                        width: 205,
                        stack: [
                            { text: 'COMPROBANTE DE VENTA', alignment: 'right', bold: true, fontSize: 11 },
                            {
                                text: `N° ${operation.operation_number}`,
                                alignment: 'right',
                                bold: true,
                                fontSize: 10,
                                margin: [0, 1, 0, 0],
                            },
                            {
                                text: `${date}${time ? ` · ${time}` : ''}`,
                                alignment: 'right',
                                color: COLORS.secondary,
                                fontSize: 9,
                                margin: [0, 1, 0, 0],
                            },
                            ...(operation.cashier
                                ? [
                                      {
                                          text: `Cajero: ${operation.cashier.name}`,
                                          alignment: 'right',
                                          color: COLORS.secondary,
                                          fontSize: 9,
                                          margin: [0, 1, 0, 0],
                                      },
                                  ]
                                : []),
                        ],
                    },
                ],
                columnGap: 18,
            },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: 531,
                        y2: 0,
                        lineWidth: 0.7,
                        lineColor: '#777777',
                    },
                ],
                margin: [0, 8, 0, 6],
            },
            ...(operation.status === 'cancelled'
                ? [
                      {
                          text: 'VENTA CANCELADA',
                          alignment: 'center',
                          bold: true,
                          fontSize: 10,
                          margin: [0, 0, 0, 6],
                      },
                  ]
                : []),
            ...(customer
                ? [
                      {
                          text: [
                              { text: 'Cliente: ', color: COLORS.secondary },
                              {
                                  text: customer.display_name,
                                  bold: true,
                                  color: COLORS.primary,
                                  fontSize: 9.5,
                              },
                          ],
                          fontSize: 9,
                          margin: [0, 0, 0, 5],
                      },
                  ]
                : []),
            {
                table: {
                    body: itemRows,
                    dontBreakRows: true,
                    headerRows: 1,
                    keepWithHeaderRows: 1,
                    widths: ['*', 42, 76, 76, 76],
                },
                layout: tableLayout,
            },
            {
                stack: closing,
                unbreakable: true,
            },
        ],
    };
};
