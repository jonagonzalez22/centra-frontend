import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChangePlanModal } from './ChangePlanModal';

const meta: Meta<typeof ChangePlanModal> = {
    title: 'Features/Admin/Stores/ChangePlanModal',
    component: ChangePlanModal,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        open: true,
        onClose: () => {},
        onSuccess: () => {},
        storeId: 'store-123',
        currentPlanId: 'plan-1',
    },
};