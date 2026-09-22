/**
 * Keeps the local date and time represented by the receipt ISO value. The
 * backend already converted it to the Store timezone, so converting it again
 * through the browser timezone would alter the printed commercial record.
 */
export const formatReceiptOccurredAt = (occurredAt: string | null): string => {
  if (!occurredAt) return '—';

  const match = occurredAt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return occurredAt;

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

export const formatCuit = (cuit: string): string => {
  if (!/^\d{11}$/.test(cuit)) return cuit;

  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`;
};
