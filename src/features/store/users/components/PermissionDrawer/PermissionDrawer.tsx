import { useEffect, useState, useCallback, useMemo } from 'react';
import { message, Spin } from 'antd';
import { Shield, Store, User as UserIcon, Package, Tag, ShoppingCart, Truck, Wallet, ClipboardList, CreditCard, Globe, Settings, UsersRound } from 'lucide-react';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { Checkbox } from '@/components/Checkbox';
import { StoreUsersService } from '../../services/storeUsers.service';
import type { User } from '@/entities/User';
import type { PermissionCatalogGroupItem, PermissionCatalog } from '../../types/storeUser.types';
import './PermissionDrawer.css';

interface PermissionDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

interface PermissionEntry {
    code: string;
    name: string;
}

interface PermissionGroup {
    key: string;
    displayName: string;
    icon: React.ReactNode;
    permissions: PermissionEntry[];
}

const GROUP_ICONS: Record<string, React.ReactNode> = {
    Inventario: <Package size={16} />,
    Categorías: <Tag size={16} />,
    Usuarios: <UserIcon size={16} />,
    Tiendas: <Store size={16} />,
    'Punto de Venta': <ShoppingCart size={16} />,
    Ventas: <ShoppingCart size={16} />,
    Pedidos: <ClipboardList size={16} />,
    Clientes: <UserIcon size={16} />,
    Deliveries: <Truck size={16} />,
    Caja: <Wallet size={16} />,
    'Medios de pago': <CreditCard size={16} />,
    'Grupos Comerciales': <UsersRound size={16} />,
    Geografía: <Globe size={16} />,
    Configuraciones: <Settings size={16} />,
};

const getGroupIcon = (groupName: string): React.ReactNode => {
    return GROUP_ICONS[groupName] ?? <Shield size={16} />;
};

export const PermissionDrawer = ({ open, onClose, onSuccess, user }: PermissionDrawerProps) => {
    const [catalog, setCatalog] = useState<PermissionCatalog>({});
    const [checkedCodes, setCheckedCodes] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setFetching(true);

        await Promise.all([
            StoreUsersService.getPermissionCatalog()
                .then(setCatalog)
                .catch(() => {
                    setCatalog({});
                }),
            StoreUsersService.getUserPermissions(user.id)
                .then((perms) => setCheckedCodes(new Set(perms)))
                .catch(() => {
                    setCheckedCodes(new Set());
                }),
        ]);

        setFetching(false);
    }, [user]);

    useEffect(() => {
        if (open && user) {
            fetchData();
        } else if (!open) {
            setCatalog({});
            setCheckedCodes(new Set());
        }
    }, [open, user, fetchData]);

    const groupedPermissions = useMemo<PermissionGroup[]>(() => {
        const groups: Record<string, PermissionGroup> = {};

        Object.entries(catalog).forEach(([groupName, items]) => {
            if (Array.isArray(items)) {
                const entries: PermissionEntry[] = items.map((item: PermissionCatalogGroupItem) => ({
                    code: item.name,
                    name: item.label,
                }));

                groups[groupName] = {
                    key: groupName,
                    displayName: groupName,
                    icon: getGroupIcon(groupName),
                    permissions: entries,
                };
            }
        });

        return Object.values(groups);
    }, [catalog]);

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

    const handleSelectAllGroup = (group: PermissionGroup, checked: boolean) => {
        setCheckedCodes((prev) => {
            const next = new Set(prev);
            group.permissions.forEach((p) => {
                if (checked) {
                    next.add(p.code);
                } else {
                    next.delete(p.code);
                }
            });
            return next;
        });
    };

    const isGroupFullyChecked = (group: PermissionGroup): boolean => {
        return group.permissions.every((p) => checkedCodes.has(p.code));
    };

    const isGroupIndeterminate = (group: PermissionGroup): boolean => {
        const checkedCount = group.permissions.filter((p) => checkedCodes.has(p.code)).length;
        return checkedCount > 0 && checkedCount < group.permissions.length;
    };

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await StoreUsersService.syncUserPermissions(user.id, {
                permissions: Array.from(checkedCodes),
            });
            message.success('Permisos actualizados correctamente.');
            onSuccess();
        } catch (err) {
            const messageText =
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message: string }).message
                    : 'Error al actualizar permisos.';
            message.error(messageText);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    const renderPermissionItem = (permission: PermissionEntry) => {
        const isChecked = checkedCodes.has(permission.code);

        return (
            <div key={permission.code} className="permissionDrawerItem">
                <Checkbox
                    checked={isChecked}
                    onChange={(e) => handleToggle(permission.code, e.target.checked)}
                />
                <div className="permissionDrawerItemInfo">
                    <span className="permissionDrawerItemName">{permission.name}</span>
                    <span className="permissionDrawerItemCode">{permission.code}</span>
                </div>
            </div>
        );
    };

    const renderGroup = (group: PermissionGroup) => {
        const fullyChecked = isGroupFullyChecked(group);
        const indeterminate = isGroupIndeterminate(group);

        return (
            <div key={group.key} className="permissionDrawerCard">
                <div className="permissionDrawerCardHeader">
                    <div className="permissionDrawerCardTitle">
                        {group.icon}
                        <span>{group.displayName}</span>
                    </div>
                    <Checkbox
                        checked={fullyChecked}
                        indeterminate={indeterminate}
                        onChange={(e) => handleSelectAllGroup(group, e.target.checked)}
                    >
                        <span className="permissionDrawerSelectAll">Seleccionar todo</span>
                    </Checkbox>
                </div>
                <div className="permissionDrawerDivider" />
                <div className="permissionDrawerGrid">
                    {group.permissions.map(renderPermissionItem)}
                </div>
            </div>
        );
    };

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            title={`Permisos — ${user?.name ?? ''}`}
            width={600}
            loading={loading}
        >
            {fetching ? (
                <div className="permissionDrawerLoading">
                    <Spin />
                </div>
            ) : (
                <>
                    <div className="permissionDrawerContent">
                        {groupedPermissions.length === 0 ? (
                            <div className="permissionDrawerEmpty">No hay permisos disponibles</div>
                        ) : (
                            <div className="permissionDrawerGroups">
                                {groupedPermissions.map(renderGroup)}
                            </div>
                        )}
                    </div>

                    <div className="permissionDrawerFooter">
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
                            disabled={loading}
                        />
                    </div>
                </>
            )}
        </Drawer>
    );
};
