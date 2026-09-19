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
