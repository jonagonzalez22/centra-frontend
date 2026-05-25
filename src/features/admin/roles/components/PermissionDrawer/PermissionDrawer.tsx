import { useEffect, useState, useCallback, useMemo } from 'react';
import { message, Spin } from 'antd';
import { Store, User, CreditCard, Settings2, Tag, Settings, Shield, Key } from 'lucide-react';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import Checkbox from '@/components/Checkbox/Checkbox';
import { RolesService } from '../../services/role.service';
import type { Role, PermissionsByResource } from '../../types/role.types';
import './PermissionDrawer.css';

interface PermissionDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    role: Role | null;
}

interface PermissionGroup {
    resource: string;
    key: string;
    permissions: { code: string; name: string }[];
}

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

const formatPermissionName = (code: string): string => {
    const parts = code.split('.');
    if (parts.length === 2) {
        const [, action] = parts;
        const actionNames: Record<string, string> = {
            view: 'Ver',
            create: 'Crear',
            edit: 'Editar',
            delete: 'Eliminar',
        };
        return actionNames[action] ?? action;
    }
    return code;
};

const getResourceName = (resource: string): string => {
    const names: Record<string, string> = {
        stores: 'Tiendas',
        backoffice_users: 'Usuarios Backoffice',
        plans: 'Planes',
        users: 'Usuarios',
        features: 'Funcionalidades',
        business_types: 'Tipos de Negocio',
        settings: 'Configuraciones',
        roles: 'Roles',
    };
    return names[resource] ?? resource.charAt(0).toUpperCase() + resource.slice(1);
};

const getResourceIcon = (resource: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
        stores: <Store size={16} />,
        users: <User size={16} />,
        backoffice_users: <User size={16} />,
        plans: <CreditCard size={16} />,
        features: <Settings2 size={16} />,
        business_types: <Tag size={16} />,
        settings: <Settings size={16} />,
        roles: <Shield size={16} />,
    };
    return icons[resource] ?? <Key size={16} />;
};

export const PermissionDrawer = ({
    open,
    onClose,
    onSuccess,
    role,
}: PermissionDrawerProps) => {
    const [permissionsByResource, setPermissionsByResource] = useState<PermissionsByResource>({});
    const [checkedCodes, setCheckedCodes] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const fetchCatalog = useCallback(async () => {
        setFetching(true);
        try {
            const response = await RolesService.getPermissions({ per_page: 200 });
            setPermissionsByResource(response as PermissionsByResource);
        } catch (err) {
            message.error(getErrorMessage(err, 'Error al cargar permisos.'));
            setPermissionsByResource({});
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        if (open && role) {
            fetchCatalog();

            const codes = new Set(role.permissions ?? []);
            setCheckedCodes(codes);
        } else if (!open) {
            setPermissionsByResource({});
            setCheckedCodes(new Set());
        }
    }, [open, role, fetchCatalog]);

    const groupedPermissions = useMemo<PermissionGroup[]>(() => {
        if (!permissionsByResource || typeof permissionsByResource !== 'object') {
            return [];
        }

        const result: PermissionGroup[] = Object.entries(permissionsByResource)
            .filter(([, perms]) => Array.isArray(perms) && perms.length > 0)
            .map(([key, codes]) => ({
                resource: getResourceName(key),
                key,
                permissions: codes.map((code) => ({
                    code,
                    name: formatPermissionName(code),
                })),
            }))
            .sort((a, b) => a.resource.localeCompare(b.resource));

        return result;
    }, [permissionsByResource]);

    const handleToggle = (permissionCode: string, checked: boolean) => {
        setCheckedCodes((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(permissionCode);
            } else {
                next.delete(permissionCode);
            }
            return next;
        });
    };

    const handleSave = async () => {
        if (!role) return;

        setLoading(true);
        try {
            const payload = {
                permissions: Array.from(checkedCodes),
            };

            await RolesService.syncPermissions(String(role.id), payload);
            message.success('Permisos actualizados correctamente.');
            onSuccess();
        } catch (err) {
            message.error(getErrorMessage(err, 'Error al actualizar permisos.'));
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
            title={`Permisos — ${role?.name ?? ''}`}
            width={560}
            loading={loading}
            destroyOnClose
        >
            {fetching ? (
                <div className="permissionDrawerLoading">
                    <Spin />
                </div>
            ) : (
                <>
                    <div className="permissionDrawerContent">
                        {groupedPermissions.length === 0 ? (
                            <div className="permissionDrawerEmpty">
                                No hay permisos disponibles
                            </div>
                        ) : (
                            <div className="permissionDrawerGroups">
                                {groupedPermissions.map((group) => (
                                    <div key={group.key} className="permissionDrawerCard">
                                        <h4 className="permissionDrawerCardTitle">
                                            {getResourceIcon(group.key)}
                                            {group.resource}
                                        </h4>
                                        <div className="permissionDrawerDivider" />
                                        <div className="permissionDrawerGrid">
                                            {group.permissions.map((permission) => {
                                                const isChecked = checkedCodes.has(permission.code);

                                                return (
                                                    <div
                                                        key={permission.code}
                                                        className="permissionDrawerItem"
                                                    >
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onChange={(e) =>
                                                                handleToggle(
                                                                    permission.code,
                                                                    e.target.checked
                                                                )
                                                            }
                                                        />
                                                        <div className="permissionDrawerItemInfo">
                                                            <span className="permissionDrawerItemName">
                                                                {permission.name}
                                                            </span>
                                                            <span className="permissionDrawerItemCode">
                                                                {permission.code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="permissionDrawerFooter">
                        {checkedCodes.size === 0 && (
                            <span className="permissionDrawerEmptyText">
                                Seleccioná al menos un permiso
                            </span>
                        )}
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
                            disabled={loading || checkedCodes.size === 0}
                        />
                    </div>
                </>
            )}
        </Drawer>
    );
};