import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { Store } from 'lucide-react';
import MetricCard from './MetricCard';

describe('MetricCard', () => {
    test('renders title and value', () => {
        render(<MetricCard title="Total Tiendas" value={11} icon={Store} />);

        expect(screen.getByText('Total Tiendas')).toBeDefined();
        expect(screen.getByText('11')).toBeDefined();
    });

    test('renders icon', () => {
        render(<MetricCard title="Total Tiendas" value={11} icon={Store} />);

        const icon = document.querySelector('.lucide-store');
        expect(icon).toBeDefined();
    });

    test('renders loading state', () => {
        render(<MetricCard title="Total Tiendas" value={0} icon={Store} loading />);

        const skeleton = document.querySelector('.ant-skeleton-input');
        expect(skeleton).toBeDefined();
    });
});