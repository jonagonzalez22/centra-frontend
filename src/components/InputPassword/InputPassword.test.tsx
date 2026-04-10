import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import InputPassword from './InputPassword';

describe('InputPassword', () => {
  test('renders label and password input', () => {
    render(<InputPassword name="password" label="Password" placeholder="Enter password" />);

    expect(screen.getByText('Password')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter password')).toBeDefined();
  });

  test('renders required rule', () => {
    render(<InputPassword name="password" label="Password" required />);

    expect(screen.getByText('Password')).toBeDefined();
  });

  test('shows error message when error.status is true', () => {
    render(
      <InputPassword
        name="password"
        label="Password"
        error={{
          status: true,
          message: 'Password is too weak',
        }}
      />
    );

    expect(screen.getByText('Password is too weak')).toBeDefined();
  });

  test('does not show error when status is false', () => {
    render(
      <InputPassword
        name="password"
        label="Password"
        error={{
          status: false,
          message: 'Hidden error',
        }}
      />
    );

    expect(screen.queryByText('Hidden error')).toBeNull();
  });

  test('renders disabled state', () => {
    render(<InputPassword name="password" label="Password" disabled />);

    const input = screen.getByLabelText('Password');
    expect(input).toBeDisabled();
  });

  test('renders placeholder correctly', () => {
    render(<InputPassword name="password" label="Password" placeholder="Enter password" />);

    expect(screen.getByPlaceholderText('Enter password')).toBeDefined();
  });
});
