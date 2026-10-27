import { useCustomers } from '@/features/store/customers/hooks/useCustomers';
import { CustomersPageView } from './CustomersPageView';

const routeMetadata = {
    title: 'Clientes',
    description: 'Administrá los clientes de tu tienda',
    breadcrumbs: [
        { label: 'Tienda', path: '/tienda/dashboard' },
        { label: 'Clientes' },
    ],
};

export const CustomersPage = () => {
    const customersState = useCustomers();

    return (
        <CustomersPageView
            title={routeMetadata.title}
            description={routeMetadata.description}
            breadcrumbs={routeMetadata.breadcrumbs}
            error={customersState.error}
            customers={customersState.customers}
            loading={customersState.loading}
            pagination={customersState.pagination}
            onRefetch={customersState.refetch}
            onDelete={customersState.deleteCustomer}
        />
    );
};
