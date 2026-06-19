import { useEffect, useState, useCallback, useMemo } from 'react';
import { message, Spin } from 'antd';
import { Store, User, CreditCard, Settings2, Tag, Settings, Shield, Key } from 'lucide-react';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import Checkbox from '@/components/Checkbox/Checkbox';
import Tabs from '@/components/Tabs/Tabs';
import TagWrapper from '@/components/Tag/Tag';
import { RolesService } from '../../services/role.service';
import type { Role, PermissionsByResource } from '../../types/role.types';
import {
  getPermissionContext,
  getPermissionContextLabel,
  inferDefaultTab,
  MODULE_DISPLAY_NAMES,
  type PermissionContext,
} from '@/config/permissions.config';
import './PermissionDrawer.css';

interface PermissionDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
}

interface PermissionItem {
  code: string;
  name: string;
  context: PermissionContext;
}

interface PermissionGroup {
  key: string;
  displayName: string;
  icon: React.ReactNode;
  permissions: PermissionItem[];
}

type TabKey = 'admin' | 'store' | 'all';

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
    categories: <Tag size={16} />,
    products: <Key size={16} />,
    stock: <Key size={16} />,
    pos: <Key size={16} />,
    sales: <Key size={16} />,
    clients: <Key size={16} />,
    deliveries: <Key size={16} />,
  };
  return icons[resource] ?? <Key size={16} />;
};

const getResourceDisplayName = (resource: string): string => {
  return MODULE_DISPLAY_NAMES[resource] ?? resource.charAt(0).toUpperCase() + resource.slice(1);
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
  const [activeTab, setActiveTab] = useState<TabKey>('all');

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
      setActiveTab(inferDefaultTab(role.name));
    } else if (!open) {
      setPermissionsByResource({});
      setCheckedCodes(new Set());
    }
  }, [open, role, fetchCatalog]);

  const allPermissions = useMemo<PermissionItem[]>(() => {
    const items: PermissionItem[] = [];
    Object.values(permissionsByResource).forEach((codes) => {
      if (Array.isArray(codes)) {
        codes.forEach((code) => {
          items.push({
            code,
            name: formatPermissionName(code),
            context: getPermissionContext(code),
          });
        });
      }
    });
    return items;
  }, [permissionsByResource]);

  const filteredPermissions = useMemo(() => {
    let filtered = allPermissions;

    if (activeTab === 'store') {
      filtered = filtered.filter((p) => p.context === 'store');
    } else if (activeTab === 'admin') {
      filtered = filtered.filter((p) => p.context === 'admin');
    }

    return filtered;
  }, [allPermissions, activeTab]);

  const groupedPermissions = useMemo<PermissionGroup[]>(() => {
    const groups: Record<string, PermissionGroup> = {};

    filteredPermissions.forEach((permission) => {
      const prefix = permission.code.split('.')[0];
      if (!groups[prefix]) {
        groups[prefix] = {
          key: prefix,
          displayName: getResourceDisplayName(prefix),
          icon: getResourceIcon(prefix),
          permissions: [],
        };
      }
      groups[prefix].permissions.push(permission);
    });

    return Object.values(groups).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }, [filteredPermissions]);

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

  const tabItems = [
    {
      key: 'admin',
      label: 'Sistema',
      children: null,
    },
    {
      key: 'store',
      label: 'Tienda',
      children: null,
    },
    {
      key: 'all',
      label: 'Todos',
      children: null,
    },
  ];

  const renderPermissionItem = (permission: PermissionItem) => {
    const isChecked = checkedCodes.has(permission.code);
    const showContextTag = activeTab === 'all';

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
        {showContextTag && (
          <TagWrapper
            color={permission.context === 'store' ? 'cyan' : 'purple'}
            className="permissionContextTag"
          >
            {getPermissionContextLabel(permission.context)}
          </TagWrapper>
        )}
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
      title={`Permisos — ${role?.name ?? ''}`}
      width={600}
      loading={loading}
      destroyOnClose
    >
      {fetching ? (
        <div className="permissionDrawerLoading">
          <Spin />
        </div>
      ) : (
        <>
          <Tabs
            items={tabItems}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as TabKey)}
            className="permissionDrawerTabs"
          />

          <div className="permissionDrawerContent">
            {groupedPermissions.length === 0 ? (
              <div className="permissionDrawerEmpty">
                No hay permisos disponibles
              </div>
            ) : (
              <div className="permissionDrawerGroups">
                {groupedPermissions.map(renderGroup)}
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
