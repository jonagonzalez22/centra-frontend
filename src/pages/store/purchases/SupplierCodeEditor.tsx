import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button as AntButton, Input, Popover } from 'antd';
import { useState } from 'react';
import { Button } from '@/components/Button';

type SupplierCodeEditorProps = {
    supplierName: string;
    productName: string;
    value: string | null;
    onSave: (value: string | null) => Promise<void>;
};

export const SupplierCodeEditor = ({ supplierName, productName, value, onSave }: SupplierCodeEditorProps) => {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState(value ?? '');
    const [saving, setSaving] = useState(false);

    const close = () => {
        setCode(value ?? '');
        setOpen(false);
    };

    const save = async () => {
        setSaving(true);
        try {
            await onSave(code.trim() || null);
            setOpen(false);
        } catch {
            // The caller displays the API message; keep this contextual editor open.
        } finally {
            setSaving(false);
        }
    };

    const trigger = value
        ? <Button
            variant="link"
            size="small"
            icon={<EditOutlined />}
            aria-label={`Editar código proveedor de ${productName}`}
            title={`Editar código proveedor de ${productName}`}
        />
        : <AntButton color="primary" variant="outlined" size="small" styles={{ root: { boxShadow: 'none' } }} icon={<PlusOutlined />} aria-label={`Agregar código proveedor de ${productName}`}>Agregar código</AntButton>;

    return <div className="flex items-center gap-1 whitespace-nowrap">
        {value && <span>{value}</span>}
        <Popover
            open={open}
            destroyOnHidden
            onOpenChange={(nextOpen) => {
                if (nextOpen) setCode(value ?? '');
                setOpen(nextOpen);
            }}
            trigger="click"
            content={<div className="w-72">
                <div className="font-medium">Código del producto para {supplierName}</div>
                <Input
                    className="mt-3"
                    aria-label={`Código proveedor de ${productName}`}
                    autoFocus
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    onPressEnter={() => void save()}
                />
                <p className="mb-3 mt-2 text-xs text-gray-500">Este código pertenece a la relación con este proveedor y se usará en futuras compras.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="default" size="small" label="Cancelar" action={close} disabled={saving} />
                    <Button size="small" label="Guardar" action={() => void save()} loading={saving} />
                </div>
            </div>}
        >
            {trigger}
        </Popover>
    </div>;
};
