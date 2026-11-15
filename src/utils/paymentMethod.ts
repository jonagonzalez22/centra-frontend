type PaymentMethodNameSource = {
    name?: string | null;
    payment_method_name?: string | null;
    custom_name?: string | null;
    visible_name?: string | null;
    payment_method_custom_name?: string | null;
    payment_method_visible_name?: string | null;
};

const nonEmpty = (value: string | null | undefined) => value?.trim() || null;

/** Uses the store-facing payment method name while preserving the technical name as fallback. */
export const getPaymentMethodDisplayName = (method: PaymentMethodNameSource): string =>
    nonEmpty(method.visible_name) ??
    nonEmpty(method.custom_name) ??
    nonEmpty(method.payment_method_visible_name) ??
    nonEmpty(method.payment_method_custom_name) ??
    nonEmpty(method.name) ??
    nonEmpty(method.payment_method_name) ??
    'Medio de pago';
