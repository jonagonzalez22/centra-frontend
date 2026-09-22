import { formatReceiptOccurredAt } from './receipt-formatters';
import { formatCuit } from './receipt-formatters';

test('preserves the receipt local time instead of converting it to the browser timezone', () => {
  expect(formatReceiptOccurredAt('2026-09-19T11:03:41-03:00')).toBe('19/09/2026 11:03');
});

test('returns a safe placeholder when the receipt has no timestamp', () => {
  expect(formatReceiptOccurredAt(null)).toBe('—');
});

test('formats an 11-digit CUIT for the ticket', () => {
  expect(formatCuit('20325713705')).toBe('20-32571370-5');
});

test('keeps an unexpected CUIT value unchanged', () => {
  expect(formatCuit('CUIT pendiente')).toBe('CUIT pendiente');
});
