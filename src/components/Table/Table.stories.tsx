import { StoryObj, Meta } from '@storybook/react-vite';
import Table from './Table';

type Story = StoryObj<typeof Table>;

const meta: Meta<typeof Table> = {
    title: 'Components/Table',
    component: Table,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

const genericMockData = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'Active',
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        status: 'Inactive',
    },
    {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        status: 'Active',
    },
];

const storesMockData = [
    {
        id: '1',
        storeName: 'Store 001',
        city: 'Madrid',
        country: 'Spain',
        status: 'Active',
        revenue: '$50,000',
    },
    {
        id: '2',
        storeName: 'Store 002',
        city: 'Barcelona',
        country: 'Spain',
        status: 'Active',
        revenue: '$75,000',
    },
    {
        id: '3',
        storeName: 'Store 003',
        city: 'Valencia',
        country: 'Spain',
        status: 'Inactive',
        revenue: '$30,000',
    },
];

export const Default: Story = {
    args: {
        dataSource: genericMockData,
        columns: [
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
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
            },
        ],
        pagination: {
            pageSize: 10,
            current: 1,
            total: 3,
        },
    },
};

export const WithStoresData: Story = {
    args: {
        dataSource: storesMockData,
        columns: [
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
            {
                title: 'Country',
                dataIndex: 'country',
                key: 'country',
            },
            {
                title: 'Revenue',
                dataIndex: 'revenue',
                key: 'revenue',
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (text?: unknown) => (
                    <span style={{ color: String(text) === 'Active' ? '#52c41a' : '#ff4d4f' }}>
                        {String(text)}
                    </span>
                ),
            },
        ],
        pagination: {
            pageSize: 10,
            current: 1,
            total: 3,
        },
    },
};

export const Loading: Story = {
    args: {
        dataSource: [],
        columns: [
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
        ],
        loading: true,
    },
};

export const Empty: Story = {
    args: {
        dataSource: [],
        columns: [
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
        ],
        emptyText: 'No hay registros disponibles',
        pagination: {
            pageSize: 10,
            current: 1,
            total: 0,
        },
    },
};

export const NoPagination: Story = {
    args: {
        dataSource: genericMockData,
        columns: [
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
        ],
    },
};

export const CustomRender: Story = {
    args: {
        dataSource: genericMockData,
        columns: [
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: (text?: unknown) => <strong>{String(text)?.toUpperCase()}</strong>,
            },
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
            },
            {
                title: 'Status Badge',
                dataIndex: 'status',
                key: 'status',
                render: (text?: unknown) => (
                    <div
                        style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: String(text) === 'Active' ? '#f6ffed' : '#fff1f0',
                            color: String(text) === 'Active' ? '#52c41a' : '#ff4d4f',
                            textAlign: 'center',
                        }}
                    >
                        {String(text)}
                    </div>
                ),
            },
        ],
        pagination: {
            pageSize: 10,
            current: 1,
            total: 3,
        },
    },
};

export const WithLargePagination: Story = {
    args: {
        dataSource: genericMockData,
        columns: [
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
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
            },
        ],
        pagination: {
            pageSize: 10,
            current: 1,
            total: 250,
            showSizeChanger: true,
            showQuickJumper: true,
        },
    },
};
