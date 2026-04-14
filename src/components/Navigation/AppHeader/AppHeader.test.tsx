import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
	test('renders the provided title', () => {
		render(
			<AppHeader
				title="Mi Aplicación"
				user={{ name: 'Ana Ruiz', role: 'Admin' }}
				isMobile={false}
			/>
		);

		expect(screen.getByText(/Mi Aplicación/i)).toBeDefined();
	});

	test('shows user name and role when not mobile', () => {
		render(
			<AppHeader
				title="T"
				user={{ name: 'Ana Ruiz', role: 'Admin' }}
				isMobile={false}
			/>
		);

		expect(screen.getByText(/Ana Ruiz/i)).toBeDefined();
		expect(screen.getByText(/Admin/i)).toBeDefined();
	});

	test('does not show user name when mobile', () => {
		render(
			<AppHeader title="T" user={{ name: 'Ana', role: 'User' }} isMobile={true} />
		);

		// only avatar initials should be shown; user name text shouldn't be visible
		expect(screen.queryByText(/Ana/i)).toBeNull();
	});

	test('calls onToggleMenu when mobile menu button is clicked', async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();

		render(
			<AppHeader
				title="T"
				user={{ name: 'Ana', role: 'User' }}
				isMobile={true}
				onToggleMenu={onToggle}
			/>
		);

		// mobile renders a text-button with a Menu icon — there should be a single button
		await user.click(screen.getByRole('button'));

		expect(onToggle).toHaveBeenCalled();
	});
});
