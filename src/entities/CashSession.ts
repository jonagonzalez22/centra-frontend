export type CashSessionStatus = 'open' | 'pending_reconciliation' | 'closed';

export interface CashSessionBlind {
    id: string;
    status: CashSessionStatus;
    business_date: string | null;
    opening_amount: number;
    declared_amount: number | null;
    opened_at: string | null;
    submitted_at: string | null;
    notes: string | null;
    declaration_notes: string | null;
}

export type CashSession = CashSessionBlind;

export type CashSessionOpen = CashSessionBlind & { status: 'open' };
export type CashSessionOwnPending = CashSessionBlind & { status: 'pending_reconciliation' };

export interface CurrentCashSession {
    id: string;
    status: 'open';
    business_date?: string | null;
    opening_amount?: number;
    opened_at?: string | null;
}

export interface CashierSummary {
    id: string;
    name: string;
}

export interface CashSessionPending {
    id: string;
    status: 'pending_reconciliation';
    business_date: string | null;
    opened_at: string | null;
    submitted_at: string | null;
    declared_amount: number;
    declaration_notes: string | null;
    cashier: CashierSummary;
}

export interface CashPaymentMethodTotal {
    store_payment_method_id: string;
    name: string;
    code: string;
    payment_count: number;
    total: number;
}

export interface CashSessionReconciliation {
    id: string;
    status: 'pending_reconciliation';
    business_date: string | null;
    opening_amount: number;
    expected_amount: number;
    declared_amount: number;
    opened_at: string | null;
    submitted_at: string | null;
    declaration_notes: string | null;
    cashier: CashierSummary;
    cash_income: number;
    total_collected: number;
    payment_count: number;
    operation_count: number;
    totals_by_payment_method: CashPaymentMethodTotal[];
}

export interface CashOverview {
    current: CashSessionOpen | null;
    stale_open: CashSessionOpen[];
    pending_reconciliation: CashSessionOwnPending[];
}

export interface CashPendingPage {
    items: CashSessionPending[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface CashReconciliationPayment {
    id: string;
    amount: number;
    reference: string | null;
    created_at: string | null;
    origin: string | null;
    payment_details: Record<string, unknown> | null;
    operation: {
        id: string;
        operation_number: string;
        type: string;
    } | null;
    registered_by: CashierSummary | null;
}

export interface CashReconciliationPaymentPage {
    payment_method: {
        id: string;
        name: string;
        code: string;
    };
    items: CashReconciliationPayment[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}
