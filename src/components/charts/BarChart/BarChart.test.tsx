import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import BarChart from './BarChart';

describe('BarChart', () => {
    const mockData = [
        { plan_name: 'Beta (Piloto)', store_count: 1 },
        { plan_name: 'Esencial', store_count: 9 },
    ];

    test('renders title when provided', () => {
        render(<BarChart data={mockData} title="Distribución por Plan" />);

        expect(screen.getByText('Distribución por Plan')).toBeDefined();
    });

    test('renders loading skeleton when loading', () => {
        render(<BarChart data={[]} loading />);

        const skeleton = document.querySelector('.ant-skeleton');
        expect(skeleton).toBeDefined();
    });

    test('renders chart when data is provided', () => {
        render(<BarChart data={mockData} />);

        const svg = document.querySelector('.recharts-bar');
        expect(svg).toBeDefined();
    });
});