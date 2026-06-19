# Roles y Permisos

## Descripción

Gestión de roles y permisos dentro del Backoffice. Permite asignar permisos granulares a cada rol para controlar el acceso a funcionalidades del sistema.

## Estructura

```
src/features/admin/roles/
├── components/
│   ├── PermissionDrawer/
│   │   ├── PermissionDrawer.tsx    # Drawer de edición de permisos
│   │   ├── PermissionDrawer.css
│   │   ├── PermissionDrawer.test.tsx
│   │   └── index.ts
│   └── RolesTable/
│       ├── RolesTable.tsx
│       ├── RolesTable.css
│       ├── RolesTable.test.tsx
│       ├── RolesTable.stories.tsx
│       └── index.ts
├── services/
│   ├── role.service.ts            # API methods
│   └── role.service.test.ts
├── types/
│   └── role.types.ts              # TypeScript interfaces
└── README.md
```

## Clasificación de Permisos por Contexto

Los permisos se clasifican automáticamente en dos contextos principales:

### Contexto Tienda
Permisos relacionados con la operación diaria de la tienda.

| Prefijo | Módulo |
|---------|--------|
| `stores` | Tiendas |
| `categories` | Categorías |
| `products` | Productos |
| `stock` | Stock |
| `pos` | Punto de Venta |
| `sales` | Ventas |
| `clients` | Clientes |
| `deliveries` | Deliveries |

### Contexto Sistema
Permisos relacionados con la administración del sistema.

| Prefijo | Módulo |
|---------|--------|
| `plans` | Planes |
| `features` | Funcionalidades |
| `roles` | Roles |
| `permissions` | Permisos |
| `business-types` | Tipos de Negocio |
| `backoffice_users` | Usuarios Backoffice |
| `users` | Usuarios |
| `settings` | Configuraciones |

## Archivos de Configuración

### `src/config/permissions.config.ts`

Contiene la configuración heurística para clasificar permisos por contexto.

```typescript
export const PREFIX_TO_CONTEXT: Record<string, PermissionContext>
export const MODULE_DISPLAY_NAMES: Record<string, string>
export const getPermissionContext(permissionCode: string): PermissionContext
export const getPermissionContextLabel(context: PermissionContext): string
export const inferDefaultTab(roleName: string): 'store' | 'admin' | 'all'
```

## Agregar Nuevos Prefijos

Cuando se agreguen nuevos permisos con prefijos no reconocidos:

1. Abrir `src/config/permissions.config.ts`
2. Agregar el prefijo al mapa `PREFIX_TO_CONTEXT`:
   - `'nuevo_modulo': 'store'` si es de tienda
   - `'nuevo_modulo': 'admin'` si es de sistema
3. Agregar el nombre para mostrar en `MODULE_DISPLAY_NAMES`:
   - `'nuevo_modulo': 'Nombre Humanizado'`
4. Si el prefijo no matchea ningún contexto conocido, será clasificado como `'unknown'`

## Migración Futura a Backend

Esta implementación es **frontend-first** y puede ser reemplazada fácilmente por un endpoint agrupado del backend.

### Cambios necesarios para migrar:

1. Crear nuevo endpoint `GET /api/v1/admin/permissions/grouped` que devuelva permisos pre-agrupados con metadata de contexto
2. Modificar `RolesService.getPermissions()` para usar el nuevo endpoint
3. Eliminar o simplificar `permissions.config.ts` manteniendo backwards compatibility
4. Actualizar tests correspondientes

## Inferencia de Pestaña por Defecto

Al abrir el drawer de permisos, la pestaña activa se infiere del nombre del rol:

| Nombre del Rol | Pestaña por Defecto |
|----------------|---------------------|
| Roles que empiezan con `STORE_` | Tienda |
| `SUPER_ADMIN` | Sistema |
| `BACKOFFICE_USER` | Sistema |
| Cualquier otro rol | Todos |

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/v1/admin/roles` | Listar todos los roles |
| GET | `/v1/admin/roles/:id` | Obtener rol por ID |
| PUT | `/v1/admin/roles/:id` | Actualizar rol |
| GET | `/v1/admin/permissions` | Listar todos los permisos |
| POST | `/v1/admin/roles/:id/sync-permissions` | Sincronizar permisos del rol |

## Payload de SyncPermissions

```typescript
interface SyncPermissionsDto {
  permissions: string[]; // Array de códigos de permiso, ej: ['stores.view', 'categories.create']
}
```

## Notas de Implementación

- El drawer usa `destroyOnClose` para resetear el estado al cerrar
- Las selecciones de checkboxes persisten al cambiar entre pestañas
- La búsqueda filtra permisos en todas las pestañas
- El toggle "Mostrar permisos no clasificados" revela permisos con prefijos desconocidos
- En la pestaña "Todos", cada permiso muestra un tag con su contexto (Tienda/Sistema)
