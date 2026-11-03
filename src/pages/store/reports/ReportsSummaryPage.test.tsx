import { fireEvent, render, screen, within } from '@testing-library/react';
import dayjs from 'dayjs';
import userEvent from '@testing-library/user-event';
import { ReportsSummaryPage } from './ReportsSummaryPage';
import { useReportsSummary } from '@/features/store/reports/hooks/useReportsSummary';
import { useReportsAnalytics } from '@/features/store/reports/hooks/useReportsAnalytics';
import { useAuthStore } from '@/store/useAuthStore.store';

vi.mock('@/features/store/reports/hooks/useReportsSummary');
vi.mock('@/features/store/reports/hooks/useReportsAnalytics');
vi.mock('@/store/useAuthStore.store');

const mockUseReportsSummary = vi.mocked(useReportsSummary);
const mockUseReportsAnalytics = vi.mocked(useReportsAnalytics);
const mockUseAuthStore = vi.mocked(useAuthStore);
const refetch = vi.fn();
const analyticsRefetch = vi.fn();

const summary = {
    period: {
        date_from: '2026-11-01',
        date_to: '2026-11-30',
        timezone: 'America/Argentina/Buenos_Aires',
    },
    metrics: {
        pos_sales: { amount: 10000, count: 4, average_ticket: 2500 },
        orders_taken: { amount: 18000, count: 3 },
        deliveries_completed: { count: 7 },
        collected: { amount: 12000, channels: { pos_amount: 10000, orders_amount: 2000 } },
    },
    current: {
        pending_balance: { amount: 5000 },
        inventory_alerts: { low_stock_count: 2, out_of_stock_count: 1 },
        attention: {
            partially_delivered_orders: 3,
            delivered_with_balance: 5,
            routes_pending_reconciliation: 2,
        },
    },
};

const queryResult = (overrides = {}) => ({
    data: summary,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch,
    ...overrides,
});

const analyticsResult = (overrides = {}) => ({
    data: {
        period: summary.period,
        payments_series: [{ date: '2026-11-01', collected_amount: 12000 }],
        orders_series: [{ date: '2026-11-01', orders_taken_count: 3, deliveries_count: 2 }],
        payment_methods: [{ payment_method_id: 'cash', name: 'Efectivo', amount: 12000, count: 3 }],
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: analyticsRefetch,
    ...overrides,
});

describe('ReportsSummaryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseReportsSummary.mockReturnValue(
            queryResult() as unknown as ReturnType<typeof useReportsSummary>
        );
        mockUseReportsAnalytics.mockReturnValue(
            analyticsResult() as unknown as ReturnType<typeof useReportsAnalytics>
        );
        mockUseAuthStore.mockReturnValue({ features: [{ code: 'pos' }, { code: 'deliveries' }] } as never);
    });

    it('muestra los valores del período y la situación actual en secciones distintas', () => {
        render(<ReportsSummaryPage />);

        expect(
            screen.getByText('Informes', { selector: '.ant-breadcrumb-link' })
        ).toBeInTheDocument();
        expect(
            screen.getByText('Resumen', { selector: '.ant-breadcrumb-link' })
        ).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Actividad del período' })).toBeInTheDocument();
        expect(screen.getByText('Ventas de mostrador')).toBeInTheDocument();
        expect(screen.getByText(/10\.000/)).toBeInTheDocument();
        expect(screen.getByText('4 operaciones')).toBeInTheDocument();
        expect(screen.getByText('Pedidos tomados')).toBeInTheDocument();
        const ordersCard = screen.getByText('Pedidos tomados').closest('.reportsSummaryCard');
        expect(ordersCard).not.toBeNull();
        expect(within(ordersCard as HTMLElement).getByText('3')).toBeInTheDocument();
        expect(
            within(ordersCard as HTMLElement).getByText(/18\.000.*en pedidos/)
        ).toBeInTheDocument();
        expect(screen.getByText('Entregas realizadas')).toBeInTheDocument();
        expect(screen.getByText('En el período')).toBeInTheDocument();
        expect(screen.getByText('Pagos recibidos')).toBeInTheDocument();
        expect(screen.getByText('Total cobrado en el período')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Estado actual' })).toBeInTheDocument();
        expect(screen.getByText('Saldo pendiente')).toBeInTheDocument();
        expect(screen.getByText('Bajo stock')).toBeInTheDocument();
        expect(screen.getByText('Sin stock')).toBeInTheDocument();
    });

    it('consulta Este mes por defecto sin mostrar campos personalizados', () => {
        render(<ReportsSummaryPage />);

        expect(mockUseReportsSummary).toHaveBeenLastCalledWith({
            date_from: dayjs().startOf('month').format('YYYY-MM-DD'),
            date_to: dayjs().endOf('month').format('YYYY-MM-DD'),
        });
        expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Aplicar' })).not.toBeInTheDocument();
    });

    it('muestra los ceros como datos válidos', () => {
        mockUseReportsSummary.mockReturnValue(
            queryResult({
                data: {
                    ...summary,
                    metrics: {
                        pos_sales: { amount: 0, count: 0, average_ticket: 0 },
                        orders_taken: { amount: 0, count: 0 },
                        deliveries_completed: { count: 0 },
                        collected: { amount: 0 },
                    },
                    current: {
                        pending_balance: { amount: 0 },
                        inventory_alerts: { low_stock_count: 0, out_of_stock_count: 0 },
                        attention: {
                            partially_delivered_orders: 0,
                            delivered_with_balance: 0,
                            routes_pending_reconciliation: 0,
                        },
                    },
                },
            }) as unknown as ReturnType<typeof useReportsSummary>
        );

        render(<ReportsSummaryPage />);

        expect(screen.getAllByText(/\$.*0/)).toHaveLength(5);
        expect(screen.getByText('0 operaciones')).toBeInTheDocument();
        expect(screen.getByText(/\$.*0.*en pedidos/)).toBeInTheDocument();
        expect(screen.getAllByText('0')).not.toHaveLength(0);
        expect(screen.getByText('Sin alertas de stock')).toBeInTheDocument();
    });

    it('aplica un preset automáticamente sin mostrar Aplicar', async () => {
        const user = userEvent.setup();
        render(<ReportsSummaryPage />);

        await user.click(screen.getByRole('combobox'));
        await user.click(await screen.findByText('Mes anterior'));

        const previousMonth = dayjs().subtract(1, 'month');
        expect(mockUseReportsSummary).toHaveBeenLastCalledWith({
            date_from: previousMonth.startOf('month').format('YYYY-MM-DD'),
            date_to: previousMonth.endOf('month').format('YYYY-MM-DD'),
        });
        expect(screen.queryByRole('button', { name: 'Aplicar' })).not.toBeInTheDocument();
    });

    it('mantiene fechas personalizadas en draft hasta Aplicar', async () => {
        const user = userEvent.setup();
        render(<ReportsSummaryPage />);

        await user.click(screen.getByRole('combobox'));
        await user.click(await screen.findByText('Personalizado'));
        expect(screen.getByLabelText('Desde')).toBeInTheDocument();
        expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument();

        const initialParams =
            mockUseReportsSummary.mock.calls[mockUseReportsSummary.mock.calls.length - 1]?.[0];
        fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '01/10/2026' } });
        fireEvent.blur(screen.getByLabelText('Desde'));
        expect(
            mockUseReportsSummary.mock.calls[mockUseReportsSummary.mock.calls.length - 1]?.[0]
        ).toEqual(initialParams);

        await user.click(screen.getByRole('button', { name: 'Aplicar' }));
        expect(mockUseReportsSummary).toHaveBeenLastCalledWith(
            expect.objectContaining({ date_from: '2026-10-01' })
        );
    });

    it('sale de Personalizado al elegir Hoy y consulta automáticamente', async () => {
        const user = userEvent.setup();
        render(<ReportsSummaryPage />);

        await user.click(screen.getByRole('combobox'));
        await user.click(await screen.findByText('Personalizado'));
        await user.click(screen.getByRole('combobox'));
        await user.click(await screen.findByText('Hoy'));

        const today = dayjs().format('YYYY-MM-DD');
        expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Aplicar' })).not.toBeInTheDocument();
        expect(mockUseReportsSummary).toHaveBeenLastCalledWith({
            date_from: today,
            date_to: today,
        });
    });

    it('muestra ayuda contextual y el bloque de atención', async () => {
        const user = userEvent.setup();
        render(<ReportsSummaryPage />);

        expect(screen.getByText('Promedio por venta')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Estado actual' })).toBeInTheDocument();
        expect(
            screen.getByText(/Estos indicadores muestran la situación actual/)
        ).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Requiere atención' })).toBeInTheDocument();
        expect(screen.getByText('Pedidos con entrega parcial')).toBeInTheDocument();
        expect(screen.getByText('Rutas pendientes de conciliación')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Ayuda sobre pos_sales' }));
        expect(
            screen.getByText(/Total vendido en mostrador durante el período/)
        ).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Ayuda sobre orders_taken' }));
        expect(
            screen.getByText(/Cantidad de pedidos registrados durante el período/)
        ).toBeInTheDocument();
    });

    it('muestra los bloques simplificados de análisis y pagos', () => {
        render(<ReportsSummaryPage />);

        expect(screen.getByRole('heading', { name: 'Análisis del período' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Pagos recibidos' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Actividad de pedidos' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Medios de pago' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Canales del negocio' })).not.toBeInTheDocument();
        expect(screen.getByText('Efectivo')).toBeInTheDocument();
    });

    it('muestra un estado vacío para medios de pago sin ocultar las series', () => {
        mockUseReportsAnalytics.mockReturnValue(
            analyticsResult({
                data: {
                    ...analyticsResult().data,
                    payment_methods: [],
                },
            }) as unknown as ReturnType<typeof useReportsAnalytics>
        );
        render(<ReportsSummaryPage />);

        expect(screen.getByText('No hubo pagos registrados en este período.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Pagos recibidos' })).toBeInTheDocument();
    });

    it('oculta pedidos cuando el circuito no está disponible', () => {
        mockUseAuthStore.mockReturnValue({ features: [] } as never);
        render(<ReportsSummaryPage />);

        expect(screen.getByRole('heading', { name: 'Pagos recibidos' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Actividad de pedidos' })).not.toBeInTheDocument();
    });

    it('muestra análisis y conserva el resumen cuando analytics falla', async () => {
        mockUseReportsAnalytics.mockReturnValue(
            analyticsResult({ data: undefined, isError: true }) as unknown as ReturnType<
                typeof useReportsAnalytics
            >
        );
        const user = userEvent.setup();
        render(<ReportsSummaryPage />);

        expect(screen.getByText('Ventas de mostrador')).toBeInTheDocument();
        expect(screen.getByText('No pudimos cargar el análisis del período.')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Reintentar' }));
        expect(analyticsRefetch).toHaveBeenCalledOnce();
    });

    it('muestra skeletons durante la carga', () => {
        mockUseReportsSummary.mockReturnValue(
            queryResult({ data: undefined, isLoading: true }) as unknown as ReturnType<
                typeof useReportsSummary
            >
        );
        const { container } = render(<ReportsSummaryPage />);
        expect(container.querySelectorAll('.ant-skeleton')).not.toHaveLength(0);
    });

    it('muestra un error claro y permite reintentar', async () => {
        const user = userEvent.setup();
        mockUseReportsSummary.mockReturnValue(
            queryResult({ data: undefined, isError: true }) as unknown as ReturnType<
                typeof useReportsSummary
            >
        );
        render(<ReportsSummaryPage />);

        expect(screen.getByText('No pudimos cargar el resumen del negocio.')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Reintentar' }));
        expect(refetch).toHaveBeenCalledOnce();
    });
});
