import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { ChangePlanModal } from './ChangePlanModal';

vi.mock('@/features/admin/plans/services/plans.service', () => ({
    PlansService: {
        getAll: vi.fn(),
    },
}));

vi.mock('@/features/admin/stores/services/stores.service', () => ({
    StoresService: {
        update: vi.fn(),
    },
}));

describe('ChangePlanModal', () => {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        storeId: 'store-123',
        currentPlanId: 'plan-1',
    };

    test('renders modal title when open', () => {
        render(<ChangePlanModal {...defaultProps} />);
        expect(screen.getByText('Cambiar Plan', { selector: '.ant-modal-title' })).toBeInTheDocument();
    });

    test('renders footer buttons', () => {
        render(<ChangePlanModal {...defaultProps} />);
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
});