import { Timeline } from 'antd';
import dayjs from 'dayjs';
import { cancellationReasonLabel } from '../../constants/cancellation-reasons';
import type { SaleHistoryEvent } from '../../interfaces/sale.interface';

interface SaleDetailHistoryProps {
    createdAt: string;
    createdBy?: { id: string; name: string | null };
    history: SaleHistoryEvent[];
}

const formatDateTime = (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm');

export const SaleDetailHistory = ({ createdAt, createdBy, history }: SaleDetailHistoryProps) => {
    const entries = [
        {
            id: 'sale-created',
            type: 'created' as const,
            occurredAt: createdAt,
            user: createdBy,
        },
        ...history
            .filter((event) => event.event_type === 'sale_cancelled')
            .map((event) => ({
                id: event.id,
                type: 'cancelled' as const,
                occurredAt: event.created_at,
                user: event.user,
                reasonCode: event.reason_code,
                reasonNote: event.reason_note,
            })),
    ].sort((first, second) => dayjs(first.occurredAt).valueOf() - dayjs(second.occurredAt).valueOf());

    return (
        <section>
            <h3 className="m-0 mb-3 text-sm font-semibold">HISTORIAL</h3>
            <Timeline
                items={entries.map((entry) => ({
                    color: entry.type === 'cancelled' ? 'red' : 'blue',
                    children: (
                        <div className="min-w-0 text-sm">
                            <div className="font-medium">
                                {entry.type === 'cancelled' ? 'Venta cancelada' : 'Venta realizada'}
                            </div>
                            {entry.type === 'created' ? (
                                <div className="mt-1 text-xs text-gray-500">
                                    {formatDateTime(entry.occurredAt)}
                                    {entry.user?.name && ` · ${entry.user.name}`}
                                </div>
                            ) : (
                                <>
                                    <div className="mt-1 text-xs text-gray-500">
                                        Fecha: {formatDateTime(entry.occurredAt)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Usuario: {entry.user?.name ?? '—'}
                                    </div>
                                </>
                            )}
                            {entry.type === 'cancelled' && (
                                <>
                                    <div className="mt-1 text-xs text-gray-600">
                                        Motivo: {cancellationReasonLabel(entry.reasonCode)}
                                    </div>
                                    {entry.reasonNote && (
                                        <div className="break-words text-xs text-gray-600">
                                            Detalle: {entry.reasonNote}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ),
                }))}
            />
        </section>
    );
};
