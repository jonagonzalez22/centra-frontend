import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { UserAvatar } from './UserAvatar';

describe('UserAvatar', () => {
	test('renders initials from single name', () => {
		render(<UserAvatar name="Ana" />);

		expect(screen.getByText('A')).toBeDefined();
	});

	test('renders initials from first and last name', () => {
		render(<UserAvatar name="Ana Ruiz" />);

		expect(screen.getByText('AR')).toBeDefined();
	});

	test('limits initials to two characters', () => {
		render(<UserAvatar name="Ana Maria Lopez" />);

		expect(screen.getByText('AM')).toBeDefined();
	});
});

