import { useState } from 'react';
import { message } from 'antd';
import { PlanModal } from '@/features/admin/plans/components/PlanModal';
import { FeaturesDrawer } from '@/features/admin/plans/components/FeaturesDrawer';
import { PlansProvider } from '@/features/admin/plans/contexts/PlansProvider';
import { PlansPageView } from './PlansPageView';
import { usePlans } from '@/features/admin/plans/hooks/usePlans';
import { PlansService } from '@/features/admin/plans/services/plans.service';
import type { Plan } from '@/features/admin/plans/types/plan.types';

const routeMetadata = {
    title: 'Planes',
    description: 'Administrá los planes y sus funcionalidades',
    breadcrumbs: [
        { label: 'Admin', path: '/admin/dashboard' },
        { label: 'Planes' },
    ],
};

export const PlansPage = () => {
    const plansState = usePlans();

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>(undefined);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedPlanForDrawer, setSelectedPlanForDrawer] = useState<Plan | null>(null);

    const handleEdit = (plan: Plan) => {
        setSelectedPlan(plan);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedPlan(undefined);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedPlan(undefined);
    };

    const handleModalSuccess = () => {
        setModalOpen(false);
        setSelectedPlan(undefined);
        plansState.refetch();
    };

    const handleManageFeatures = (plan: Plan) => {
        setSelectedPlanForDrawer(plan);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setSelectedPlanForDrawer(null);
    };

    const handleDrawerSuccess = () => {
        setDrawerOpen(false);
        setSelectedPlanForDrawer(null);
        plansState.refetch();
    };

    const handleDelete = async (plan: Plan) => {
        try {
            await PlansService.delete(plan.id);
            message.success(`Plan "${plan.name}" eliminado correctamente.`);
            plansState.refetch();
        } catch (err) {
            const errorMessage =
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message: string }).message
                    : 'Error al eliminar el plan.';
            message.error(errorMessage);
        }
    };

    return (
        <PlansProvider value={plansState}>
            <PlansPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                error={plansState.error}
                onEdit={handleEdit}
                onCreate={handleCreate}
                onManageFeatures={handleManageFeatures}
                onDelete={handleDelete}
            />
            <PlanModal
                open={modalOpen}
                onClose={handleCloseModal}
                onSuccess={handleModalSuccess}
                plan={selectedPlan}
            />
            <FeaturesDrawer
                open={drawerOpen}
                onClose={handleCloseDrawer}
                onSuccess={handleDrawerSuccess}
                plan={selectedPlanForDrawer}
            />
        </PlansProvider>
    );
};
