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

describe('usePOSStore POS line price lists', () => {
    const product = {
        id: 'paper-1', name: 'Papel higiénico', sku: 'PAP-1', barcode: null, price: 25000,
        commercial_available_quantity: '10.0000', sale_quantity_step: '1.0000',
        stock_measurement_unit_symbol: 'u',
    };
    const wholesale = {
        id: 'wholesale-id', name: 'Mayorista', discount_percentage: '10.00', is_active: true,
        created_at: '', updated_at: '',
    };
    const distributor = {
        id: 'distributor-id', name: 'Distribuidor', discount_percentage: '15.00', is_active: true,
        created_at: '', updated_at: '',
    };
    const zeroRate = {
        id: 'zero-id', name: 'Convenio Empresa X', discount_percentage: '0.00', is_active: true,
        created_at: '', updated_at: '',
    };

    beforeEach(() => {
        usePOSStore.getState().resetPOS();
        usePOSStore.getState().setAvailablePriceLists([wholesale, distributor, zeroRate]);
    });

    test('adding the same Product + PriceList increments that existing line and updates its preview', () => {
        const store = usePOSStore.getState();
        store.setSelectedPriceListId(wholesale.id, wholesale.name, 10);
        store.addItem(product);
        store.addItem(product);

        expect(usePOSStore.getState().items).toHaveLength(1);
        expect(usePOSStore.getState().items[0]).toMatchObject({
            line_key: `${product.id}:${wholesale.id}`,
            quantity: '2.0000',
            subtotal: 50000,
            discount_amount: 5000,
        });
    });

    test('changes one line list and recalculates preview and line identity', () => {
        const store = usePOSStore.getState();
        store.addItem(product);
        store.updateQuantity(`${product.id}:common`, '2.0000');
        store.changeItemPriceList(`${product.id}:common`, wholesale.id, wholesale.name, 10);

        expect(usePOSStore.getState().items).toHaveLength(1);
        expect(usePOSStore.getState().items[0]).toMatchObject({
            line_key: `${product.id}:${wholesale.id}`,
            price_list_id: wholesale.id,
            quantity: '2.0000',
            price: 25000,
            subtotal: 50000,
            discount_amount: 5000,
        });
    });

    test('merges into an existing Product + PriceList line and recalculates quantity and discount', () => {
        const store = usePOSStore.getState();
        store.setSelectedPriceListId(wholesale.id, wholesale.name, 10);
        store.addItem(product);
        store.updateQuantity(`${product.id}:${wholesale.id}`, '2.0000');

        store.setSelectedPriceListId(null);
        store.addItem(product);
        store.changeItemPriceList(`${product.id}:common`, wholesale.id, wholesale.name, 10);

        const items = usePOSStore.getState().items;
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            line_key: `${product.id}:${wholesale.id}`,
            price_list_id: wholesale.id,
            price_list_name: wholesale.name,
            discount_percentage: 10,
            quantity: '3.0000',
            price: 25000,
            subtotal: 75000,
            discount_amount: 7500,
        });
        expect(Math.max(0, items[0].subtotal - items[0].discount_amount)).toBe(67500);
    });

    test('can switch lists in either direction and keeps a real zero percent list separate from Common', () => {
        const store = usePOSStore.getState();
        store.addItem(product);
        store.changeItemPriceList(`${product.id}:common`, wholesale.id, wholesale.name, 10);
        expect(usePOSStore.getState().items[0]).toMatchObject({
            line_key: `${product.id}:${wholesale.id}`,
            discount_amount: 2500,
        });

        store.changeItemPriceList(`${product.id}:${wholesale.id}`, distributor.id, distributor.name, 15);
        expect(usePOSStore.getState().items[0]).toMatchObject({
            line_key: `${product.id}:${distributor.id}`,
            discount_amount: 3750,
        });

        store.changeItemPriceList(`${product.id}:${distributor.id}`, null, null, 0);
        expect(usePOSStore.getState().items[0]).toMatchObject({
            line_key: `${product.id}:common`, price_list_id: null, discount_amount: 0,
        });

        store.setSelectedPriceListId(zeroRate.id, zeroRate.name, 0);
        store.addItem(product);
        expect(usePOSStore.getState().items).toHaveLength(2);
        expect(usePOSStore.getState().items.map((item) => item.price_list_id)).toEqual([null, zeroRate.id]);
    });

    test('changing the top selector leaves existing lines unchanged and applies only to later additions', () => {
        const store = usePOSStore.getState();
        store.addItem(product);
        store.setSelectedPriceListId(wholesale.id, wholesale.name, 10);
        expect(usePOSStore.getState().items[0]).toMatchObject({
            line_key: `${product.id}:common`, price_list_id: null, discount_percentage: 0,
        });
        store.addItem(product);
        expect(usePOSStore.getState().items).toHaveLength(2);
        expect(usePOSStore.getState().items[1]).toMatchObject({
            line_key: `${product.id}:${wholesale.id}`, price_list_id: wholesale.id,
        });
    });
});
