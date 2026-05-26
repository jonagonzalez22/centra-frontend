import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import AreaChart from './AreaChart';

describe('AreaChart', () => {
    const mockData = [
        { month: '2026-04', store_count: 1 },
        { month: '2026-05', store_count: 10 },
    ];

    test('renders title when provided', () => {
        render(<AreaChart data={mockData} title="Crecimiento de Tiendas" />);

        expect(screen.getByText('Crecimiento de Tiendas')).toBeDefined();
    });

    test('renders loading skeleton when loading', () => {
        render(<AreaChart data={[]} loading />);

        const skeleton = document.querySelector('.ant-skeleton');
        expect(skeleton).toBeDefined();
    });

    test('renders chart when data is provided', () => {
        render(<AreaChart data={mockData} />);

        const svg = document.querySelector('.recharts-area-area');
        expect(svg).toBeDefined();
    });
});