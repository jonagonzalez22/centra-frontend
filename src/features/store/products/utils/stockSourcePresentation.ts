import { formatQuantityWithUnit } from '@/utils/quantity';
import type { DecimalString } from '@/types/decimal';
import type { ProductSourceCandidate } from '../interfaces/product.interface';

export const sourceOptionMatches = (input: string, option: unknown): boolean => String(
    (option as { label?: string })?.label ?? '',
).toLocaleLowerCase().includes(input.toLocaleLowerCase());

export const buildStockConsumptionDescription = (
    source: ProductSourceCandidate | undefined,
    consumptionQuantity: DecimalString | null | undefined,
    childUnitSymbol?: string,
): string => {
    if (!source || !consumptionQuantity) {
        return 'Seleccioná un producto fuente e indicá cuánto stock físico consume este producto.';
    }

    return `Consumo: ${formatQuantityWithUnit(consumptionQuantity, source.stock_measurement_unit?.symbol)} de ${source.name} por cada 1 ${childUnitSymbol ?? 'u'} de este producto.`;
};
