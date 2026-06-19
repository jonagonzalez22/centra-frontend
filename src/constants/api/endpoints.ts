export const API_ENDPOINTS = {
    STORE: {
        CATEGORIES: {
            URL: '/v1/store/categories',
        },
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