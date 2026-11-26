export type FinancialIncidentSourceType = 'cash_difference' | 'route_collection_rejected';
export type FinancialIncidentStatus = 'detected' | 'in_review' | 'resolved' | 'dismissed';

export interface IncidentUser {
    id: string;
    name: string;
}
export interface FinancialIncident {
    source_type: FinancialIncidentSourceType;
    source_id: string;
    status: FinancialIncidentStatus;
    amount: string;
    source_difference: string | null;
    occurred_at: string;
    assigned_to: IncidentUser | null;
    reference: Record<string, string>;
    source_summary: Record<string, unknown>;
    tracking: {
        id: string;
        assigned_at: string | null;
        resolution_type: string | null;
        resolution_note: string | null;
        resolved_at: string | null;
        resolved_by: IncidentUser | null;
    } | null;
}

export interface FinancialIncidentHistory {
    id: string;
    action: string;
    actor: IncidentUser | null;
    previous_status: FinancialIncidentStatus | null;
    new_status: FinancialIncidentStatus | null;
    previous_assigned_to: IncidentUser | null;
    new_assigned_to: IncidentUser | null;
    comment: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

export interface FinancialIncidentFilters {
    source_type?: FinancialIncidentSourceType;
    status?: FinancialIncidentStatus;
    date_from?: string;
    date_to?: string;
    assigned_to?: string;
    page?: number;
    per_page?: number;
}

export interface FinancialIncidentPage {
    items: FinancialIncident[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    date_filter_semantics: string;
}

export interface FinancialIncidentCounters {
    detected: number;
    in_review: number;
    resolved: number;
    dismissed: number;
}
