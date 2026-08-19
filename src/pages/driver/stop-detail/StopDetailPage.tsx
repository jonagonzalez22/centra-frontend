import { useParams } from 'react-router-dom';
import { useStopDetail } from '@/features/driver/hooks/useStopDetail';
import { StopDetailPageView } from './StopDetailPageView';

export const StopDetailPage = () => {
    const { stopId } = useParams<{ routeId: string; stopId: string }>();
    const stopDetailState = useStopDetail(stopId ?? '');

    return (
        <StopDetailPageView
            stop={stopDetailState.stop}
            loading={stopDetailState.loading}
            error={stopDetailState.error}
            onRefresh={stopDetailState.refresh}
        />
    );
};
