import {
    buildPurchaseWhatsAppMessage,
    buildPurchaseWhatsAppUrl,
    formatPurchaseItemForWhatsApp,
    normalizeWhatsAppPhone,
} from './purchaseWhatsApp';
import type { PurchaseDetail } from './purchases.service';

const purchase = (status: PurchaseDetail['status'] = 'draft'): PurchaseDetail => ({
    id: 'purchase-1',
    purchase_number: 'OC-000010',
    purchase_type: 'order',
    status,
    supplier: { id: 'supplier-1', business_name: 'Proveedor histórico', tax_id: null },
    total: '12500.00',
    ordered_at: '2026-10-24 10:00:00',
    cancelled_at: null,
    created_at: '2026-10-23 10:00:00',
    notes: null,
    items: [
        {
            id: 'item-1',
            product_id: 'product-1',
            product_name: 'Nombre interno',
            product_sku: 'SKU-INTERNO',
            supplier_code: 'BESPC-1103',
            supplier_product_name: 'Esponja cocina',
            measurement_unit_code: 'unit',
            measurement_unit_symbol: 'u',
            quantity_ordered: '5.0000',
            quantity_received: '0.0000',
            quantity_pending: '5.0000',
            unit_price: '2500.00',
            subtotal: '12500.00',
        },
    ],
});

describe('purchase WhatsApp message', () => {
    it('builds draft wording from historical snapshots', () => {
        const message = buildPurchaseWhatsAppMessage(purchase());

        expect(message).toContain(
            'Hola, te comparto el borrador de la OC-000010 para confirmar disponibilidad y precios.'
        );
        expect(message).toMatch(
            /• 5 unid\. · \[BESPC-1103\] · Esponja cocina · \$\s2\.500,00\/unid\. = \$\s12\.500,00/
        );
        expect(message).toMatch(/Total estimado: \$\s12\.500,00/);
        expect(message).toContain('productos sin disponibilidad o algún cambio de precio');
        expect(message).not.toContain('SKU-INTERNO');
    });

    it.each(['ordered', 'partially_received', 'received', 'closed'] as const)(
        'uses commercial issued wording for %s without exposing internal status',
        (status) => {
            const message = buildPurchaseWhatsAppMessage(purchase(status));

            expect(message).toContain('Hola, te comparto la Orden de Compra OC-000010.');
            expect(message).toMatch(/Total: \$\s12\.500,00/);
            expect(message).toContain('confirmame que recibiste la orden');
            expect(message).not.toContain(status);
        }
    );

    it('does not leave an empty separator when supplier code is absent', () => {
        const item = { ...purchase().items[0], supplier_code: null, supplier_product_name: null };

        expect(formatPurchaseItemForWhatsApp(item)).toMatch(
            /• 5 unid\. · Nombre interno · \$\s2\.500,00\/unid\. = \$\s12\.500,00/
        );
    });

    it('uses decimal quantities and the snapshot commercial unit', () => {
        const item = {
            ...purchase().items[0],
            measurement_unit_code: 'kg',
            measurement_unit_symbol: 'kg',
            quantity_ordered: '2.5000',
        };

        expect(formatPurchaseItemForWhatsApp(item)).toMatch(
            /• 2,5 kg · \[BESPC-1103\] · Esponja cocina · \$\s2\.500,00\/kg = \$\s12\.500,00/
        );
    });

    it('normalizes common stored phone formats only for the wa.me URL', () => {
        const message = buildPurchaseWhatsAppMessage(purchase());

        expect(normalizeWhatsAppPhone('+54 261 555-0100')).toBe('542615550100');
        expect(buildPurchaseWhatsAppUrl('+54 261 555-0100', message)).toBe(
            `https://wa.me/542615550100?text=${encodeURIComponent(message)}`
        );
        expect(buildPurchaseWhatsAppUrl(null, message)).toBeNull();
        expect(buildPurchaseWhatsAppUrl('123', message)).toBeNull();
    });
});
