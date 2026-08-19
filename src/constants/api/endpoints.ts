export const API_ENDPOINTS = {
    DRIVER: {
        ACTIVE_ROUTE: { URL: '/v1/driver/active-route' },
        ROUTE_STOPS: (routeId: string) => `/v1/driver/routes/${routeId}/stops`,
        STOP_DETAIL: (stopId: string) => `/v1/driver/stops/${stopId}`,
        STOP_ARRIVE: (stopId: string) => `/v1/driver/stops/${stopId}/arrive`,
        STOP_COMPLETE: (stopId: string) => `/v1/driver/stops/${stopId}/complete`,
        STOP_NOTIFY: (stopId: string) => `/v1/driver/route-stops/${stopId}/notified`,
        STOP_PAYMENT_METHODS: { URL: `/v1/driver/payment-methods` },
    },
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
        PAYMENT_METHODS: {
            LIST: { URL: '/v1/store/payment-methods' },
            UPDATE: (paymentMethodId: string) => `/v1/store/payment-methods/${paymentMethodId}`,
        },
        OPERATIONS: {
            URL: '/v1/store/operations',
        },
        ORDERS: {
            URL: '/v1/store/orders',
            RESCHEDULE: (id: string) => `/v1/store/operations/${id}/reschedule`,
            CANCEL: (id: string) => `/v1/store/operations/${id}/cancel`,
        },
        LOGISTICS: {
            ROUTES: {
                URL: '/v1/store/routes',
                DETAIL: (id: string) => `/v1/store/routes/${id}`,
                STOPS: (routeId: string) => `/v1/store/routes/${routeId}/stops`,
                ELIGIBLE_ORDERS: { URL: '/v1/store/routes/eligible-orders' },
                PLAN: (routeId: string) => `/v1/store/routes/${routeId}/plan`,
                REORDER: (routeId: string) => `/v1/store/routes/${routeId}/stops/reorder`,
                RECALCULATE: (routeId: string) => `/v1/store/routes/${routeId}/recalculate`,
                OPTIMIZE: (routeId: string) => `/v1/store/routes/${routeId}/optimize`,
                LOAD_SHEET: (routeId: string) => `/v1/store/routes/${routeId}/load-sheet`,
                CONFIRM_LOAD: (routeId: string) => `/v1/store/routes/${routeId}/confirm-load`,
                BULK_LOAD: (routeId: string) => `/v1/store/routes/${routeId}/bulk-load`,
                ADJUST_ITEMS: (routeId: string) => `/v1/store/routes/${routeId}/adjust-items`,
                REVERT: (routeId: string) => `/v1/store/routes/${routeId}/revert`,
                DISPATCH: (routeId: string) => `/v1/store/routes/${routeId}/dispatch`,
            },
            STOPS: {
                DELETE: (routeId: string, stopId: string) =>
                    `/v1/store/routes/${routeId}/stops/${stopId}`,
                NOTIFY: (stopId: string) => `/v1/store/route-stops/${stopId}/notified`,
            },
            VEHICLES: {
                URL: '/v1/store/vehicles',
            },
            DRIVERS: {
                URL: '/v1/store/drivers',
            },
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
        PAYMENT_METHODS: {
            URL: '/v1/admin/payment-methods',
        },
    },
} as const;
