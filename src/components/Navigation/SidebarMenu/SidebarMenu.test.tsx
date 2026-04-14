import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { SidebarMenu } from './SidebarMenu';
import type { MenuProps } from 'antd';

describe('SidebarMenu', () => {
	const items: MenuProps['items'] = [
		{ key: '1', label: 'One' },
		{ key: '2', label: 'Two' },
	];

	test('renders desktop sider when not mobile', () => {
		render(<SidebarMenu items={items} isMobile={false} selectedKey={'1'} />);

		expect(screen.getByText(/CENTRA/i)).toBeDefined();
		expect(screen.getByText(/One/i)).toBeDefined();
	});

	test('renders drawer when mobile and open', () => {
		render(<SidebarMenu items={items} isMobile={true} isOpen={true} selectedKey={'2'} />);

		expect(screen.getByText(/CENTRA/i)).toBeDefined();
		expect(screen.getByText(/Two/i)).toBeDefined();
	});
});
