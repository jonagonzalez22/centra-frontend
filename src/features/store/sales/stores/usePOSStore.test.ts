import { usePOSStore } from './usePOSStore';
import type { Customer } from '@features/store/customers/types/customer.types';

const customer = {
    id: 'customer-1',
    display_name: 'Juan Pérez',
} as Customer;

describe('usePOSStore customer identification', () => {
    beforeEach(() => {
        usePOSStore.getState().resetPOS();
    });

    test('keeps a registered customer and clears the manual display name', () => {
        usePOSStore.getState().setCustomerDisplayName('Federico');
        usePOSStore.getState().setCustomer(customer);

        expect(usePOSStore.getState()).toMatchObject({
            customer,
            customer_display_name: null,
        });
    });

    test('keeps a manual display name and clears the registered customer', () => {
        usePOSStore.getState().setCustomer(customer);
        usePOSStore.getState().setCustomerDisplayName('Federico');

        expect(usePOSStore.getState()).toMatchObject({
            customer: null,
            customer_display_name: 'Federico',
        });
    });

    test('reset clears both customer identification values', () => {
        usePOSStore.getState().setCustomerDisplayName('Federico');
        usePOSStore.getState().resetPOS();

        expect(usePOSStore.getState()).toMatchObject({
            customer: null,
            customer_display_name: null,
        });
    });
});

describe('usePOSStore commercial quantities', () => {
    const bulkProduct = {
        id: 'bulk-1', name: 'Harina', sku: 'HAR-1', barcode: null, price: 4400,
        commercial_available_quantity: '1.2500', sale_quantity_step: '0.2500', stock_measurement_unit_symbol: 'kg',
    };

    beforeEach(() => usePOSStore.getState().resetPOS());

    test('starts at the commercial step and increments exactly without exceeding availability', () => {
        usePOSStore.getState().addItem(bulkProduct);
        expect(usePOSStore.getState().items[0].quantity).toBe('0.2500');

        usePOSStore.getState().addItem(bulkProduct);
        usePOSStore.getState().addItem(bulkProduct);
        expect(usePOSStore.getState().items[0].quantity).toBe('0.7500');

        usePOSStore.getState().addItem(bulkProduct);
        usePOSStore.getState().addItem(bulkProduct);
        expect(usePOSStore.getState().items[0].quantity).toBe('1.2500');
    });

    test('rejects manual quantities that are not a step multiple or exceed availability', () => {
        usePOSStore.getState().addItem(bulkProduct);
        usePOSStore.getState().updateQuantity('bulk-1', '1.3000');
        expect(usePOSStore.getState().items[0].quantity).toBe('0.2500');

        usePOSStore.getState().updateQuantity('bulk-1', '1.5000');
        expect(usePOSStore.getState().items[0].quantity).toBe('0.2500');
    });

    test('does not add a product without commercial stock', () => {
        usePOSStore.getState().addItem({ ...bulkProduct, commercial_available_quantity: '0.0000' });
        expect(usePOSStore.getState().items).toHaveLength(0);
    });
});
