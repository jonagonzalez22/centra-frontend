export const API_ENDPOINTS = {
    STORE: {
        CATEGORIES: {
            URL: '/v1/store/categories',
        },
        PRODUCTS: {
            URL: '/v1/store/products',
        },
        USERS: {
            URL: '/v1/store/users',
            FILTER_OPTIONS: '/v1/store/users/filter-options',
            PERMISSION_CATALOG: '/v1/store/permissions/catalog',
        },
        STOCK_ADJUST: {
            URL: '/v1/store/inventory/adjust',
        },
        STOCK_MOVEMENTS: {
            URL: '/v1/store/inventory/movements',
        },
        PRODUCTS_SEARCH: {
            URL: '/v1/store/products/search',
        },
        COMMERCIAL_GROUPS: {
            URL: '/v1/store/commercial-groups',
        },
        CUSTOMERS: {
            URL: '/v1/store/customers',
        },
        CUSTOMER_CONTACTS: {
            URL: '/v1/store/customers/:customerId/contacts',
        },
        CUSTOMER_ADDRESSES: {
            URL: '/v1/store/customers/:customerId/addresses',
        },
        DOCUMENT_TYPES: {
            URL: '/v1/catalogs/document-types',
        },
        GEOGRAPHY: {
            PROVINCES: '/v1/catalogs/provinces',
            PROVINCE_LOCALITIES: (provinceId: string) =>
                `/v1/catalogs/provinces/${provinceId}/localities`,
        },
        CASH: {
            CURRENT: { URL: '/v1/store/cash/current' },
            OPEN: { URL: '/v1/store/cash/open' },
            CLOSE: (cashSessionId: string) => `/v1/store/cash/${cashSessionId}/close`,
        },
    },
    GEOCODING: {
        SEARCH: '/v1/geocoding/search',
    },
    ADMIN: {
        STORES: {
            URL: '/v1/admin/stores',
            FILTER_OPTIONS: '/v1/admin/stores/filter-options',
        },
        USERS: {
            URL: '/v1/admin/users',
            FILTER_OPTIONS: '/v1/admin/users/filter-options',
        },
        BUSINESS_TYPES: {
            URL: '/v1/admin/business-types',
        },
        FEATURES: {
            URL: '/v1/admin/features',
        },
        PLANS: {
            URL: '/v1/admin/plans',
        },
        ROLES: {
            URL: '/v1/admin/roles',
        },
        PERMISSIONS: {
            URL: '/v1/admin/permissions',
        },
        DASHBOARD: {
            URL: '/v1/admin/dashboard',
        },
    },
} as const;
