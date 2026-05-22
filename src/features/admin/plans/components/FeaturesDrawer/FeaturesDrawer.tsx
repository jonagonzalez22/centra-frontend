import { useEffect, useState, useCallback } from 'react';
import { InputNumber, message, Spin, Divider } from 'antd';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import Checkbox from '@/components/Checkbox/Checkbox';
import { PlansService } from '../../services/plans.service';
import { FeaturesService } from '@/features/admin/features/services/features.service';
import type { Plan } from '../../types/plan.types';
import type { Feature } from '@/features/admin/features/types/feature.types';

interface FeaturesDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    plan: Plan | null;
}

export const FeaturesDrawer: React.FC<FeaturesDrawerProps> = ({
    open,
    onClose,
    onSuccess,
    plan,
}) => {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [limitValues, setLimitValues] = useState<Record<string, number | null>>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const getErrorMessage = (err: unknown, fallback: string): string => {
        if (err && typeof err === 'object') {
            if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
                return (err as { message: string }).message;
            }
            if ('data' in err && (err as { data?: { message?: string } }).data?.message) {
                return (err as { data: { message: string } }).data.message;
            }
        }
        return fallback;
    };

    const fetchCatalog = useCallback(async () => {
        setFetching(true);
        try {
            const response = await FeaturesService.getAll({ per_page: 200 });
            setFeatures(response.items);
        } catch (err) {
            message.error(getErrorMessage(err, 'Error al cargar funcionalidades.'));
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        if (open && plan) {
            fetchCatalog();

            const ids = new Set(plan.features.map((f) => f.id));
            const limits: Record<string, number | null> = {};
            plan.features.forEach((f) => {
                limits[f.id] = f.limit_value;
            });

            setCheckedIds(ids);
            setLimitValues(limits);
        } else if (!open) {
            setFeatures([]);
            setCheckedIds(new Set());
            setLimitValues({});
        }
    }, [open, plan, fetchCatalog]);

    const handleToggle = (featureId: string, checked: boolean) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(featureId);
            } else {
                next.delete(featureId);
                setLimitValues((prevLimits) => {
                    const updated = { ...prevLimits };
                    delete updated[featureId];
                    return updated;
                });
            }
            return next;
        });
    };

    const handleLimitChange = (featureId: string, value: number | null) => {
        setLimitValues((prev) => ({ ...prev, [featureId]: value }));
    };

    const handleSave = async () => {
        if (!plan) return;

        setLoading(true);
        try {
            const payload = {
                features: Array.from(checkedIds).map((featureId) => ({
                    feature_id: featureId,
                    limit_value: limitValues[featureId] ?? null,
                })),
            };

            await PlansService.syncFeatures(plan.id, payload);
            message.success('Funcionalidades actualizadas correctamente.');
            onSuccess();
        } catch (err) {
            message.error(getErrorMessage(err, 'Error al actualizar funcionalidades.'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            title={`Funcionalidades — ${plan?.name ?? ''}`}
            width={640}
            loading={loading}
            destroyOnClose
        >
            {fetching ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin />
                </div>
            ) : (
                <>
                    {features.map((feature, index) => {
                        const isChecked = checkedIds.has(feature.id);

                        return (
                            <div key={feature.id}>
                                {index > 0 && <Divider style={{ margin: '12px 0' }} />}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 12,
                                    }}
                                >
                                    <Checkbox
                                        checked={isChecked}
                                        onChange={(e) =>
                                            handleToggle(feature.id, e.target.checked)
                                        }
                                        style={{ marginTop: 4 }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 500 }}>{feature.name}</div>
                                        {feature.description && (
                                            <div
                                                style={{
                                                    color: '#666',
                                                    fontSize: 13,
                                                    marginTop: 2,
                                                }}
                                            >
                                                {feature.description}
                                            </div>
                                        )}
                                    </div>
                                    <InputNumber
                                        style={{ width: 100, flexShrink: 0 }}
                                        placeholder="Límite"
                                        min={0}
                                        disabled={!isChecked}
                                        value={
                                            isChecked
                                                ? (limitValues[feature.id] ?? null)
                                                : null
                                        }
                                        onChange={(value) =>
                                            handleLimitChange(feature.id, value)
                                        }
                                    />
                                </div>
                            </div>
                        );
                    })}

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 12,
                            marginTop: 24,
                            paddingTop: 16,
                            borderTop: '1px solid #f0f0f0',
                        }}
                    >
                        <Button
                            variant="default"
                            label="Cancelar"
                            action={handleClose}
                            disabled={loading}
                        />
                        <Button
                            variant="primary"
                            label="Guardar cambios"
                            loading={loading}
                            action={handleSave}
                        />
                    </div>
                </>
            )}
        </Drawer>
    );
};
