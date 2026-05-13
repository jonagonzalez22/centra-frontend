import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { describe, test, expect, vi } from 'vitest';
import SelectField from './SelectField';

vi.mock('antd', async () => {
    const actual = await vi.importActual('antd');
    return {
        ...actual,
        Select: vi.fn(
            ({
                options,
                placeholder,
                disabled,
            }: {
                options?: { label: string; value: string | number | boolean }[];
                placeholder?: string;
                disabled?: boolean;
            }) => (
                <select data-testid="mock-select" disabled={disabled}>
                    {options && options.length > 0 ? (
                        options.map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)}>
                                {opt.label}
                            </option>
                        ))
                    ) : placeholder ? (
                        <option value="">{placeholder}</option>
                    ) : null}
                </select>
            )
        ),
    };
});

const renderInForm = (ui: ReactElement) => render(<Form>{ui}</Form>);

describe('SelectField', () => {
    test('renders label and select', () => {
        renderInForm(<SelectField name="status" label="Estado" options={[]} />);

        expect(screen.getByText('Estado')).toBeDefined();
        expect(screen.getByTestId('mock-select')).toBeDefined();
    });

    test('renders placeholder correctly when no options', () => {
        renderInForm(
            <SelectField
                name="status"
                label="Estado"
                options={[]}
                placeholder="Seleccionar..."
            />
        );

        expect(screen.getByText('Seleccionar...')).toBeDefined();
    });

test('renders options correctly', () => {
        renderInForm(
            <SelectField
                name="status"
                label="Estado"
                options={[
                    { label: 'Activo', value: true },
                    { label: 'Inactivo', value: false },
                ]}
            />
        );

        expect(screen.getByText('Activo')).toBeInTheDocument();
        expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });

    test('renders label correctly', () => {
        renderInForm(
            <SelectField
                name="status"
                label="Estado"
                options={[{ label: 'Activo', value: true }]}
            />
        );

        expect(screen.getByText('Estado')).toBeDefined();
    });

    test('applies required rule', () => {
        renderInForm(
            <SelectField
                name="status"
                label="Estado"
                options={[{ label: 'Activo', value: true }]}
                rules={[{ required: true, message: 'El estado es requerido' }]}
            />
        );

        expect(screen.getByText('Estado')).toBeDefined();
    });

    test('forwards select props correctly', () => {
        renderInForm(
            <SelectField
                name="status"
                label="Estado"
                options={[{ label: 'Activo', value: true }]}
                disabled
            />
        );

        const select = screen.getByTestId('mock-select');
        expect(select).toBeDisabled();
    });
});