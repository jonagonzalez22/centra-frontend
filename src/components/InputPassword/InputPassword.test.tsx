import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { Form } from 'antd';
import InputPassword from './InputPassword';

const renderInForm = (ui: React.ReactElement) => render(<Form>{ui}</Form>);

describe('InputPassword', () => {
  test('renders label and password input', () => {
    renderInForm(
      <InputPassword
        name="password"
        label="Password"
        placeholder="Enter password"
      />
    );

    expect(screen.getByText('Password')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter password')).toBeDefined();
  });

  test('applies required rule', () => {
    renderInForm(
      <InputPassword
        name="password"
        label="Password"
        rules={[{ required: true, message: 'Password is required' }]}
      />
    );

    expect(screen.getByText('Password')).toBeDefined();
  });

  test('renders disabled state', () => {
    renderInForm(
      <InputPassword name="password" label="Password" disabled />
    );

    const input = screen.getByLabelText('Password');
    expect(input).toBeDisabled();
  });

  test('renders placeholder correctly', () => {
    renderInForm(
      <InputPassword
        name="password"
        label="Password"
        placeholder="Enter password"
      />
    );

    expect(screen.getByPlaceholderText('Enter password')).toBeDefined();
  });
});