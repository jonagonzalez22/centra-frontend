export interface Permission {
    id: string;
    name: string;
    code: string;
    resource: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: string | number;
    name: string;
    description: string | null;
    permissions: string[];
    users_count: number;
    permissions_count?: number;
    created_at: string;
    updated_at: string;
}

export interface RolesListResponse {
    items: Role[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface PermissionsByResource {
    [resource: string]: string[];
}

export interface PermissionsListResponse {
    stores?: string[];
    backoffice_users?: string[];
    plans?: string[];
    users?: string[];
    settings?: string[];
    [key: string]: string[] | undefined;
}

export interface UpdateRoleDto {
    name?: string;
    description?: string;
}

export interface SyncPermissionsDto {
    permissions: string[];
}

export interface PermissionsFilters {
    page?: number;
    per_page?: number;
    resource?: string;
}