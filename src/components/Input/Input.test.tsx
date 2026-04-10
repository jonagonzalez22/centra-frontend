import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import Input from './Input';

vi.mock('runes2', () => ({
  runes: (str: string) => str.split(''),
}));

describe('Input', () => {
  test('renders input', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeDefined();
  });

  test('calls onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Input onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'hello');

    expect(onChange).toHaveBeenCalled();
  });

  test('calls onKeyDown', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();

    render(<Input onKeyDown={onKeyDown} />);
    await user.type(screen.getByRole('textbox'), 'a');

    expect(onKeyDown).toHaveBeenCalled();
  });

  test('renders prefix and suffix', () => {
    render(
      <Input
        prefix={<span data-testid="prefix">P</span>}
        suffix={<span data-testid="suffix">S</span>}
      />
    );

    expect(screen.getByTestId('prefix')).toBeDefined();
    expect(screen.getByTestId('suffix')).toBeDefined();
  });

  test('handles disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  test('applies width', () => {
    render(<Input width={200} />);
    expect(screen.getByRole('textbox')).toHaveStyle({ width: '200px' });
  });

  test('supports different sizes', () => {
    const { rerender } = render(<Input size="large" />);
    expect(screen.getByRole('textbox')).toBeDefined();

    rerender(<Input size="small" />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  test('handles allowClear', () => {
    render(<Input allowClear value="test" />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  test('renders without count', () => {
    render(<Input count={false} />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  test('renders with count and executes strategy', () => {
    render(<Input count max={5} value="hello" />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDefined();
    expect(input).toHaveValue('hello');
  });

  test('executes exceedFormatter when max is exceeded', async () => {
    const user = userEvent.setup();

    render(<Input count max={3} />);

    const input = screen.getByRole('textbox');

    await user.type(input, 'abcdef');

    expect(input).toHaveValue('abc');
  });
});
