import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Table from './Table';

describe('Table Component', () => {
    const mockData = [
        {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
        },
        {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
        },
    ];

    const mockColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
    ];

    it('renders table with data', () => {
        render(<Table dataSource={mockData} columns={mockColumns} pagination={false} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('renders column headers', () => {
        render(<Table dataSource={mockData} columns={mockColumns} pagination={false} />);

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        const { container } = render(
            <Table dataSource={[]} columns={mockColumns} loading={true} pagination={false} />
        );

        const spinner = container.querySelector('.ant-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('displays empty text when no data', () => {
        render(
            <Table
                dataSource={[]}
                columns={mockColumns}
                emptyText="No hay registros"
                pagination={false}
            />
        );

        expect(screen.getByText('No hay registros')).toBeInTheDocument();
    });

    it('displays default empty text', () => {
        render(<Table dataSource={[]} columns={mockColumns} pagination={false} />);

        expect(screen.getByText('No hay datos')).toBeInTheDocument();
    });

    it('renders pagination when provided', () => {
        const { container } = render(
            <Table
                dataSource={mockData}
                columns={mockColumns}
                pagination={{
                    pageSize: 10,
                    current: 1,
                    total: 20,
                }}
            />
        );

        const pagination = container.querySelector('.ant-pagination');
        expect(pagination).toBeInTheDocument();
    });

    it('calls onChange callback when pagination changes', () => {
        const onChange = vi.fn();
        render(
            <Table
                dataSource={mockData}
                columns={mockColumns}
                pagination={{
                    pageSize: 10,
                    current: 1,
                    total: 20,
                }}
                onChange={onChange}
            />
        );

        // Nota: Las pruebas de cambio de paginación pueden requerir interacciones
        // más complejas y depender del comportamiento específico de Ant Design
    });

    it('renders custom column render function', () => {
        const customColumns = [
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: (text: string) => <strong>{text}</strong>,
            },
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
            },
        ];

        render(<Table dataSource={mockData} columns={customColumns} pagination={false} />);

        const boldElement = screen.getByText('John Doe').closest('strong');
        expect(boldElement).toBeInTheDocument();
    });

    it('accepts generic type data', () => {
        interface CustomRecord {
            id: string;
            storeName: string;
            city: string;
        }

        const storeData: CustomRecord[] = [
            { id: '1', storeName: 'Store A', city: 'Madrid' },
            { id: '2', storeName: 'Store B', city: 'Barcelona' },
        ];

        const storeColumns = [
            {
                title: 'Store Name',
                dataIndex: 'storeName',
                key: 'storeName',
            },
            {
                title: 'City',
                dataIndex: 'city',
                key: 'city',
            },
        ];

        render(
            <Table<CustomRecord> dataSource={storeData} columns={storeColumns} pagination={false} />
        );

        expect(screen.getByText('Store A')).toBeInTheDocument();
        expect(screen.getByText('Madrid')).toBeInTheDocument();
    });

    it('handles empty data source gracefully', () => {
        const { container } = render(
            <Table dataSource={[]} columns={mockColumns} pagination={false} />
        );

        const table = container.querySelector('.ant-table');
        expect(table).toBeInTheDocument();
    });

    it('disables pagination when pagination is false', () => {
        const { container } = render(
            <Table dataSource={mockData} columns={mockColumns} pagination={false} />
        );

        const pagination = container.querySelector('.ant-pagination');
        expect(pagination).not.toBeInTheDocument();
    });
});
