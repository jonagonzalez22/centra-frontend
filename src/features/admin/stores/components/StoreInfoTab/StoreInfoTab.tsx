import { MapPin, CreditCard, AlertTriangle, User } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import type { Store } from '../../types/store.types';

interface StoreInfoTabProps {
    store: Store;
}

interface FieldProps {
    label: string;
    value: string | null | undefined;
}

const Field = ({ label, value }: FieldProps) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-xs text-gray-500 leading-none">{label}</span>
        <span className="text-sm leading-none">{value ?? '—'}</span>
    </div>
);

interface SectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    variant?: 'default' | 'danger';
}

const Section = ({ icon, title, children, variant = 'default' }: SectionProps) => (
    <div
        className={`flex flex-col gap-3 rounded-lg border p-4 ${variant === 'danger' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}
    >
        <h3
            className={`flex items-center gap-2 text-sm font-semibold leading-none ${variant === 'danger' ? 'text-red-600' : 'text-gray-700'}`}
        >
            {icon}
            {title}
        </h3>
        <div className="flex flex-col gap-4">{children}</div>
    </div>
);

export const StoreInfoTab: React.FC<StoreInfoTabProps> = ({ store }) => {
    return (
        <div className="flex flex-col gap-2">
            <Section icon={<User size={16} />} title="Información">
                <Field label="Nombre" value={store.name} />
                <Field label="CUIT" value={store.cuit} />
                <Field label="Email" value={store.email} />
                <Field label="Teléfono" value={store.phone} />
            </Section>

            <Section icon={<MapPin size={16} />} title="Ubicación">
                <Field label="Dirección" value={store.address} />
                <Field label="Ciudad" value={store.city} />
                <Field label="Estado" value={store.state} />
                <Field label="País" value={store.country} />
            </Section>

            <Section icon={<CreditCard size={16} />} title="Suscripción y Estado">
                <Field label="Plan" value={store.plan?.name} />
                <Field label="Tipo de Negocio" value={store.business_type?.name} />
                <Field label="Fecha de Creación" value={formatDate(store.created_at)} />
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500 leading-none">Estado</span>
                    <span
                        className={`text-sm font-semibold leading-none ${store.is_active ? 'text-green-600' : 'text-red-500'}`}
                    >
                        {store.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            </Section>

            {!store.is_active && (
                <Section
                    icon={<AlertTriangle size={16} />}
                    title="Inactividad"
                    variant="danger"
                >
                    <Field label="Motivo" value={store.inactive_reason} />
                    <Field label="Fecha" value={formatDate(store.inactive_at)} />
                </Section>
            )}
        </div>
    );
};