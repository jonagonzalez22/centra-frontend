export interface DashboardMetrics {
    total_stores: number;
    total_users: number;
    estimated_mrr: number;
    active_plans_count: number;
}

export interface GrowthData {
    month: string;
    store_count: number;
}

export interface PlanDistribution {
    plan_name: string;
    store_count: number;
}

export interface BusinessTypeDistribution {
    business_type_name: string;
    store_count: number;
}

export interface LatestStore {
    id: string;
    name: string;
    created_at: string;
}

export interface DashboardCharts {
    stores_by_plan: PlanDistribution[];
    stores_by_business_type: BusinessTypeDistribution[];
    growth_last_6_months: GrowthData[];
}

export interface RecentActivity {
    latest_stores: LatestStore[];
}

export interface DashboardStats {
    metrics: DashboardMetrics;
    charts: DashboardCharts;
    recent_activity: RecentActivity;
}