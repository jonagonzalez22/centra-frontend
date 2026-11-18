import { getRoleLabel } from './roleLabels';

describe('getRoleLabel', () => {
    test.each([
        ['STORE_ADMIN', 'Administrador'],
        ['STORE_USER', 'Empleado'],
        ['STORE_DRIVER', 'Repartidor'],
    ])('translates %s to %s', (role, label) => {
        expect(getRoleLabel(role)).toBe(label);
    });

    test('preserves unknown non-store roles', () => {
        expect(getRoleLabel('SUPER_ADMIN')).toBe('SUPER_ADMIN');
    });

    test.each([undefined, null, ''])('returns a safe fallback for an empty role', (role) => {
        expect(getRoleLabel(role)).toBe('—');
    });
});
