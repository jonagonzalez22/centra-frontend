import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { SidebarMenu } from './SidebarMenu';
import type { MenuProps } from 'antd';
import { MemoryRouter } from 'react-router-dom';

describe('SidebarMenu', () => {
    const items: MenuProps['items'] = [
        { key: '1', label: 'One' },
        { key: '2', label: 'Two' },
    ];

    const renderWithRouter = (ui: React.ReactElement) => {
        return render(<MemoryRouter>{ui}</MemoryRouter>);
    };

    test('renders desktop sider when not mobile', () => {
        renderWithRouter(<SidebarMenu items={items} isMobile={false} selectedKey={'1'} />);

        expect(screen.getByText(/CENTRA/i)).toBeDefined();
        expect(screen.getByText(/One/i)).toBeDefined();
    });

    test('renders drawer when mobile and open', () => {
        renderWithRouter(
            <SidebarMenu items={items} isMobile={true} isOpen={true} selectedKey={'2'} />
        );

        expect(screen.getByText(/CENTRA/i)).toBeDefined();
        expect(screen.getByText(/Two/i)).toBeDefined();
    });
});
