import { useCallback, useEffect, useState } from 'react';
import { Tag, message } from 'antd';
import { Building2, FileText, MapPin, UserRound } from 'lucide-react';
import Drawer from '@/components/Drawer/Drawer';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { SuppliersService, type Supplier } from '../../suppliers.service';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './SupplierDrawer.css';

interface SupplierDrawerProps {
    open: boolean;
    supplierId?: string;
    onClose: () => void;
    onEdit: (supplier: Supplier) => void;
}

const emptyValue = (value: string | null | undefined) => value?.trim() || '—';

const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="supplierDrawerField">
        <span className="supplierDrawerFieldLabel">{label}</span>
        <span className="supplierDrawerFieldValue">{emptyValue(value)}</span>
    </div>
);

const Section = ({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) => (
    <div className="supplierDrawerSection">
        <h3 className="supplierDrawerSectionTitle">
            {icon}
            {title}
        </h3>
        <div className="supplierDrawerSectionContent">{children}</div>
    </div>
);

export const SupplierDrawer = ({ open, supplierId, onClose, onEdit }: SupplierDrawerProps) => {
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(false);

    const loadSupplier = useCallback(async () => {
        if (!supplierId) return;
        setLoading(true);
        try {
            setSupplier(await SuppliersService.getById(supplierId));
        } catch (error) {
            const apiError = error as ApiError;
            message.error(apiError.message || 'No se pudo cargar el proveedor.');
            onClose();
        } finally {
            setLoading(false);
        }
    }, [onClose, supplierId]);

    useEffect(() => {
        if (!open || !supplierId) return;
        void loadSupplier();
        return () => setSupplier(null);
    }, [loadSupplier, open, supplierId]);

    const handleEdit = () => {
        if (!supplier) return;
        onClose();
        onEdit(supplier);
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title={
                <span className="supplierDrawerTitle">
                    <Building2 size={18} />
                    Detalle de Proveedor
                </span>
            }
            extra={
                supplier ? (
                    <CanDo permission="suppliers.edit">
                        <Button variant="primary" label="Editar" action={handleEdit} />
                    </CanDo>
                ) : null
            }
            loading={loading}
            destroyOnClose={false}
            width={520}
        >
            {supplier && !loading ? (
                <div className="supplierDrawerContent">
                    <Section icon={<Building2 size={16} />} title="Información general">
                        <Field label="Razón social / Nombre" value={supplier.business_name} />
                        <Field label="CUIT / Identificación fiscal" value={supplier.tax_id} />
                        <div className="supplierDrawerField">
                            <span className="supplierDrawerFieldLabel">Estado</span>
                            <Tag color={supplier.is_active ? 'green' : 'red'}>
                                {supplier.is_active ? 'Activo' : 'Inactivo'}
                            </Tag>
                        </div>
                    </Section>
                    <Section icon={<UserRound size={16} />} title="Contacto">
                        <Field label="Persona de contacto" value={supplier.contact_name} />
                        <Field label="Teléfono" value={supplier.phone} />
                        <Field label="Email" value={supplier.email} />
                    </Section>
                    <Section icon={<MapPin size={16} />} title="Ubicación">
                        <Field label="Dirección" value={supplier.address} />
                    </Section>
                    <Section icon={<FileText size={16} />} title="Notas">
                        <Field label="Notas" value={supplier.notes} />
                    </Section>
                </div>
            ) : null}
        </Drawer>
    );
};
