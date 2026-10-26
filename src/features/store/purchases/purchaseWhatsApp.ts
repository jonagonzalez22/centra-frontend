import { formatCurrencyWithCents } from '@/utils/formatters';
import { formatQuantityForDisplay } from '@/utils/quantity';
import type { PurchaseDetail, PurchaseItem } from './purchases.service';

const commercialUnit = (item: PurchaseItem): string =>
    item.measurement_unit_code.toLowerCase() === 'unit' ? 'unid.' : item.measurement_unit_symbol;

const itemName = (item: PurchaseItem): string =>
    item.supplier_product_name?.trim() || item.product_name;

export const formatPurchaseItemForWhatsApp = (item: PurchaseItem): string => {
    const code = item.supplier_code?.trim();
    const unit = commercialUnit(item);
    const quantity = `${formatQuantityForDisplay(item.quantity_ordered)} ${unit}`;
    const unitPrice = `${formatCurrencyWithCents(Number(item.unit_price))}/${unit}`;
    const subtotal = formatCurrencyWithCents(Number(item.subtotal));

    return `• ${[quantity, code ? `[${code}]` : null, itemName(item), unitPrice].filter(Boolean).join(' · ')} = ${subtotal}`;
};

export const buildPurchaseWhatsAppMessage = (purchase: PurchaseDetail): string => {
    const isDraft = purchase.status === 'draft';
    const intro = isDraft
        ? `Hola, te comparto el borrador de la ${purchase.purchase_number} para confirmar disponibilidad y precios.`
        : `Hola, te comparto la Orden de Compra ${purchase.purchase_number}.`;
    const totalLabel = isDraft ? 'Total estimado' : 'Total';
    const closing = isDraft
        ? 'Por favor, avisame si hay productos sin disponibilidad o algún cambio de precio.'
        : 'Por favor, confirmame que recibiste la orden. Gracias.';

    return [
        intro,
        '',
        ...purchase.items.map(formatPurchaseItemForWhatsApp),
        '',
        `${totalLabel}: ${formatCurrencyWithCents(Number(purchase.total))}`,
        '',
        closing,
    ].join('\n');
};

export const normalizeWhatsAppPhone = (phone: string | null | undefined): string | null => {
    const digits = phone?.replace(/\D/g, '') ?? '';

    return digits.length >= 8 ? digits : null;
};

export const buildPurchaseWhatsAppUrl = (
    phone: string | null | undefined,
    message: string
): string | null => {
    const normalizedPhone = normalizeWhatsAppPhone(phone);

    return normalizedPhone
        ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
        : null;
};
