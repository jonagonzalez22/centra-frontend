import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import DonutChart from './DonutChart';

describe('DonutChart', () => {
    const mockData = [
        { plan_name: 'Beta (Piloto)', store_count: 1 },
        { plan_name: 'Esencial', store_count: 9 },
    ];

    test('renders title when provided', () => {
        render(<DonutChart data={mockData} title="Distribución por Plan" />);

        expect(screen.getByText('Distribución por Plan')).toBeDefined();
    });

    test('renders loading skeleton when loading', () => {
        render(<DonutChart data={[]} loading />);

        const skeleton = document.querySelector('.ant-skeleton');
        expect(skeleton).toBeDefined();
    });

    test('renders chart when data is provided', () => {
        render(<DonutChart data={mockData} />);

        const svg = document.querySelector('.recharts-pie');
        expect(svg).toBeDefined();
    });
});