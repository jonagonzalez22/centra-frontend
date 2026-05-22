export interface PlanFeature {
    id: string;
    code: string;
    name: string;
    limit_value: number | null;
}

export interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    billing_cycle: 'monthly' | 'yearly';
    is_trial: boolean;
    is_active: boolean;
    features: PlanFeature[];
    created_at: string;
    updated_at: string;
}

export interface CreatePlanDto {
    name: string;
    description: string;
    price: number;
    billing_cycle: 'monthly' | 'yearly';
    is_trial: boolean;
    is_active: boolean;
}

export type UpdatePlanDto = Partial<CreatePlanDto>;

export interface PlansListResponse {
    items: Plan[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface SyncFeaturesDto {
    features: {
        feature_id: string;
        limit_value: number | null;
    }[];
}
