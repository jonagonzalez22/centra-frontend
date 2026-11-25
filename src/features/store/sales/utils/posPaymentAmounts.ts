const toCents = (value: number | null): number =>
  Math.max(0, Math.round(((value ?? 0) + Number.EPSILON) * 100));

const fromCents = (value: number): number => value / 100;

export interface POSPaymentAmountInput {
  id: string;
  amount: number | null;
  isCash: boolean;
}

export interface POSPaymentAmount {
  id: string;
  receivedAmount: number;
  appliedAmount: number;
  isCash: boolean;
}

/**
 * Cash input represents what the customer hands over. Only the outstanding
 * balance is applied to the operation; the remainder is change and must not
 * become an OperationPayment.
 */
export const calculatePOSPaymentAmounts = (
  rows: POSPaymentAmountInput[],
  total: number
): {
  payments: POSPaymentAmount[];
  appliedTotal: number;
  cashReceived: number;
  change: number;
  remaining: number;
} => {
  const totalCents = toCents(total);
  const normalizedRows = rows.map((row) => ({ ...row, receivedCents: toCents(row.amount) }));
  const nonCashCents = normalizedRows
    .filter((row) => !row.isCash)
    .reduce((sum, row) => sum + row.receivedCents, 0);
  let cashBalanceCents = Math.max(0, totalCents - nonCashCents);

  const payments = normalizedRows.map((row) => {
    const appliedCents = row.isCash
      ? Math.min(row.receivedCents, cashBalanceCents)
      : row.receivedCents;

    if (row.isCash) cashBalanceCents -= appliedCents;

    return {
      id: row.id,
      receivedAmount: fromCents(row.receivedCents),
      appliedAmount: fromCents(appliedCents),
      isCash: row.isCash,
    };
  });

  const appliedTotalCents = payments.reduce(
    (sum, payment) => sum + toCents(payment.appliedAmount),
    0
  );
  const cashReceivedCents = payments
    .filter((payment) => payment.isCash)
    .reduce((sum, payment) => sum + toCents(payment.receivedAmount), 0);
  const cashAppliedCents = payments
    .filter((payment) => payment.isCash)
    .reduce((sum, payment) => sum + toCents(payment.appliedAmount), 0);

  return {
    payments,
    appliedTotal: fromCents(appliedTotalCents),
    cashReceived: fromCents(cashReceivedCents),
    change: fromCents(Math.max(0, cashReceivedCents - cashAppliedCents)),
    remaining: fromCents(Math.max(0, totalCents - appliedTotalCents)),
  };
};

export const moneyToCents = toCents;
