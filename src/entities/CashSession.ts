export interface CashSession {
    id: string;
    status: 'open' | 'closed';
    opening_amount: number;
    expected_amount: number;
    opened_at: string;
    closed_at?: string;
    notes?: string;
}
