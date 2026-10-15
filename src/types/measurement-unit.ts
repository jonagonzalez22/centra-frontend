/**
 * Minimal measurement metadata persisted with a commercial operation line.
 * It is historical data, not a reference to the current UOM catalog.
 */
export interface HistoricalMeasurementUnit {
    code: string;
    symbol: string;
}
