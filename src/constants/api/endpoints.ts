export const API_ENDPOINTS = {
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
    },
} as const;