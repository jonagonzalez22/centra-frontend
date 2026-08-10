import dayjs from 'dayjs';

// ── Message Templates ────────────────────────────────────────────────

const TEMPLATE_NO_ETA = `*MENSAJE AUTOMÁTICO*

Estimado/a *{name}*:

Le informamos que su entrega está programada. Por favor esté atento al teléfono.

¡Muchas gracias!`;

const TEMPLATE_WITH_RANGE = `*MENSAJE AUTOMÁTICO*

Estimado/a *{name}*:

Le enviamos este mensaje para confirmarle que el *{dateLabel}* estaremos entregando su pedido entre las *{rangeStart} y {rangeEnd}* (el horario informado puede variar 1 hora antes del horario inicial o 1 hora después del horario límite informado).

Por favor, estar atentos al teléfono ya que, antes de salir, solicitamos confirmación de que se podrá recibir el pedido. De no obtener respuesta, la entrega podría cancelarse.

¡Muchas gracias!`;

// ── Helpers ───────────────────────────────────────────────────────────

/** Round down to nearest 5-minute mark. 09:03 → 09:00 */
const roundDown5 = (t: dayjs.Dayjs): dayjs.Dayjs =>
    t.minute(Math.floor(t.minute() / 5) * 5).second(0);

/** Round up to nearest 5-minute mark. 09:03 → 09:05 */
const roundUp5 = (t: dayjs.Dayjs): dayjs.Dayjs => {
    const m = Math.ceil(t.minute() / 5) * 5;
    return m >= 60 ? t.add(1, 'hour').minute(0).second(0) : t.minute(m).second(0);
};

/** Build date label: hoy / mañana / el DD/MM */
const dateLabel = (eta: dayjs.Dayjs): string => {
    const today = dayjs().startOf('day');
    const etaDay = eta.startOf('day');
    if (etaDay.isSame(today)) return 'hoy';
    if (etaDay.isSame(today.add(1, 'day'))) return 'mañana';
    return `el ${eta.format('DD/MM')}`;
};

/** Simple string interpolation: replaces {key} placeholders with values */
const interpolate = (template: string, vars: Record<string, string>): string =>
    template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);

// ── Public API ────────────────────────────────────────────────────────

interface WhatsAppMessageParams {
    customerName: string;
    estimatedArrivalAt: string | null;
    sequence: number;
}

/**
 * Build the WhatsApp pre-aviso message with time range calculation.
 *
 * Rules:
 * - Default: ETA ± 30 min
 * - First stop (sequence=1) with ETA 07:00–09:00: ETA → ETA + 60 min (no early window)
 * - Start rounds down to nearest 5 min, end rounds up.
 */
export const buildWhatsAppMessage = ({
    customerName,
    estimatedArrivalAt,
    sequence,
}: WhatsAppMessageParams): string => {
    const name = customerName || 'Cliente';

    if (!estimatedArrivalAt) {
        return interpolate(TEMPLATE_NO_ETA, { name });
    }

    const eta = dayjs(estimatedArrivalAt);
    const isFirstStop = sequence === 1;

    let rangeStart: dayjs.Dayjs;
    let rangeEnd: dayjs.Dayjs;

    if (isFirstStop && eta.hour() >= 7 && eta.hour() <= 9) {
        rangeStart = eta;
        rangeEnd = eta.add(60, 'minute');
    } else {
        rangeStart = eta.subtract(30, 'minute');
        rangeEnd = eta.add(30, 'minute');
    }

    return interpolate(TEMPLATE_WITH_RANGE, {
        name,
        dateLabel: dateLabel(eta),
        rangeStart: roundDown5(rangeStart).format('HH:mm'),
        rangeEnd: roundUp5(rangeEnd).format('HH:mm'),
    });
};
