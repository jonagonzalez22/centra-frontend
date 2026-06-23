import { useCallback, useMemo, useState, useEffect } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import SelectField from '@/components/SelectField/SelectField';
import { DatePickerField } from '@/components/DatePickerField';
import { Button } from '@/components/Button';
import { useInventoryMovementsContext } from '../../context/InventoryMovementsContext';
import { StoreUsersService } from '../../../users/services/storeUsers.service';
import type { InventoryMovementsFilters, MovementType } from '../../interfaces/inventory-movement.interface';
import type { StoreUser } from '../../../users/services/storeUsers.service';
import './MovementsSearchBar.css';

type StatusValue = 'all' | MovementType;

interface MovementsSearchFormValues {
    type: StatusValue;
    user_id: string;
    date_from?: Date | null;
    date_to?: Date | null;
}

const TYPE_OPTIONS = [
    { label: 'Todos', value: 'all' },
    { label: 'Entrada', value: 'input' },
    { label: 'Salida', value: 'output' },
    { label: 'Ajuste', value: 'adjustment' },
];

const formatDateToString = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const MovementsSearchBar = () => {
    const { setFilters } = useInventoryMovementsContext();
    const [form] = Form.useForm<MovementsSearchFormValues>();
    const [users, setUsers] = useState<StoreUser[]>([]);

    const typeValue = Form.useWatch('type', form);
    const userValue = Form.useWatch('user_id', form);
    const dateFromValue = Form.useWatch('date_from', form);
    const dateToValue = Form.useWatch('date_to', form);

    const hasActiveFilters = !!(typeValue && typeValue !== 'all') || !!userValue || !!dateFromValue || !!dateToValue;

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await StoreUsersService.getAll();
                setUsers(data);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };
        fetchUsers();
    }, []);

    const buildFilters = useCallback((values: MovementsSearchFormValues): InventoryMovementsFilters => {
        const filters: InventoryMovementsFilters = {};

        if (values.type && values.type !== 'all') {
            filters.type = values.type as MovementType;
        }
        if (values.user_id) {
            filters.user_id = values.user_id;
        }
        if (values.date_from) {
            filters.date_from = formatDateToString(values.date_from);
        }
        if (values.date_to) {
            filters.date_to = formatDateToString(values.date_to);
        }

        return filters;
    }, []);

    const debouncedSetFilters = useMemo(
        () =>
            debounce((values: MovementsSearchFormValues) => {
                setFilters(buildFilters(values));
            }, 500),
        [setFilters, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: MovementsSearchFormValues) => {
            debouncedSetFilters(allValues);
        },
        [debouncedSetFilters]
    );

    const handleReset = useCallback(() => {
        form.resetFields();
        setFilters({});
    }, [form, setFilters]);

    const userOptions = [
        { label: 'Todos los usuarios', value: '' },
        ...users.map((user) => ({
            label: user.name,
            value: user.id,
        })),
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            className="movementsSearchBar"
            onValuesChange={handleValuesChange}
        >
            <div className="movementsSearchBarRow">
                <SelectField
                    name="type"
                    label="Tipo"
                    placeholder="Todos"
                    options={TYPE_OPTIONS}
                    allowClear
                />

                <SelectField
                    name="user_id"
                    label="Usuario"
                    placeholder="Todos los usuarios"
                    options={userOptions}
                    allowClear
                />

                <DatePickerField
                    name="date_from"
                    label="Desde"
                    placeholder="Fecha inicio"
                    allowClear
                />

                <DatePickerField
                    name="date_to"
                    label="Hasta"
                    placeholder="Fecha fin"
                    allowClear
                />

                <div className="movementsSearchBarActions">
                    <Button
                        variant="default"
                        label="Limpiar"
                        action={handleReset}
                        disabled={!hasActiveFilters}
                    />
                </div>
            </div>
        </Form>
    );
};
