import type { ReactElement, InputHTMLAttributes } from 'react';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { describe, test, expect, vi } from 'vitest';
import InputField from './InputField';

vi.mock('../Input/Input', () => ({
  default: ({
    prefix,
    suffix,
    ...rest
  }: {
    prefix?: ReactElement;
    suffix?: ReactElement;
    [key: string]: unknown;
  }) => (
    <span>
      {prefix}
      <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      {suffix}
    </span>
  ),
}));

const renderInForm = (ui: ReactElement) => render(<Form>{ui}</Form>);

describe('InputField', () => {
  test('renders label and input', () => {
    renderInForm(<InputField name="email" label="Email" />);

    expect(screen.getByText('Email')).toBeDefined();
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  test('renders placeholder correctly', () => {
    renderInForm(<InputField name="email" label="Email" placeholder="Enter email" />);

    expect(screen.getByPlaceholderText('Enter email')).toBeDefined();
  });

  test('applies required rule', () => {
    renderInForm(<InputField name="username" label="Username" required />);

    expect(screen.getByText('Username')).toBeDefined();
  });

  test('shows error state when error.status is true', () => {
    renderInForm(
      <InputField
        name="email"
        label="Email"
        error={{
          status: true,
          message: 'Invalid email',
        }}
      />
    );

    expect(screen.getByText('Invalid email')).toBeDefined();
  });

  test('does not show error when status is false', () => {
    renderInForm(
      <InputField
        name="email"
        label="Email"
        error={{
          status: false,
          message: 'Should not show',
        }}
      />
    );

    expect(screen.queryByText('Should not show')).toBeNull();
  });

  test('renders prefix and suffix correctly', () => {
    renderInForm(
      <InputField
        name="name"
        prefix={<span data-testid="prefix">P</span>}
        suffix={<span data-testid="suffix">S</span>}
      />
    );

    expect(screen.getByTestId('prefix')).toBeDefined();
    expect(screen.getByTestId('suffix')).toBeDefined();
  });

  test('forwards input props correctly', () => {
    renderInForm(<InputField name="email" placeholder="test placeholder" disabled />);

    const input = screen.getByRole('textbox');

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', 'test placeholder');
  });
});
