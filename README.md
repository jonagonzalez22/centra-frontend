# CENTRA Frontend

Aplicación web frontend para la plataforma CENTRA, desarrollada con Vite, React y TypeScript. Esta aplicación incluye el backoffice general para la gestión de comercios y el frontend para la operación del cliente (tiendas, ferreterías, etc.).

---

## Stack Tecnológico

- [Vite](https://vitejs.dev/) - Bundler y servidor de desarrollo ultrarrápido.
- [React](https://reactjs.org/) - Biblioteca para construir interfaces de usuario.
- [TypeScript](https://www.typescriptlang.org/) - Superset de JavaScript con tipado estático.
- [pnpm](https://pnpm.io/) - Gestor de paquetes eficiente y rápido.
- [Zustand](https://zustand-demo.pmnd.rs/) (pendiente) - Estado global ligero y sencillo.
- [Axios](https://axios-http.com/) (pendiente) - Cliente HTTP para consumir la API backend.

---

## Estructura de Carpetas

```
src/
├── api/           # Cliente Axios global e interceptores
├── components/    # Componentes UI reutilizables (botones, inputs, modales)
├── config/        # Variables de entorno y constantes globales
├── entities/      # Interfaces TypeScript globales (User, Product, Order, Store)
├── features/      # Módulos de negocio (auth, products, pos, admin, delivery)
│   ├── admin/     # Funcionalidades exclusivas del backoffice general
│   ├── store/     # Funcionalidades exclusivas del frontend del cliente
│   └── shared/    # Lógica y componentes compartidos entre ambos
├── layouts/       # Estructuras de página (AdminLayout, StoreLayout, AuthLayout)
├── pages/         # Rutas que orquestan las features (admin, store, auth)
├── store/         # Estado global con Zustand (auth, preferencias)
└── utils/         # Utilidades (formateadores, validadores, helpers)
```

---

## Scripts Disponibles

```bash
pnpm dev       # Levanta el servidor de desarrollo en modo hot-reload
pnpm build     # Genera la versión optimizada para producción
pnpm preview   # Sirve la build de producción localmente para pruebas
pnpm lint      # Ejecuta ESLint para análisis estático de código
pnpm format    # Formatea el código con Prettier
```

---

## Instalación y Ejecución

1. Clonar el repositorio:

```bash
git clone [URL_DEL_REPOSITORIO]
cd centra-frontend
```

2. Instalar dependencias:

```bash
pnpm install
```

3. Levantar el servidor de desarrollo:

```bash
pnpm dev
```

4. Abrir en el navegador:

```
http://localhost:5173
```

---

## Docker

Para levantar el entorno de desarrollo con Docker:

```
docker compose up          # Levanta el entorno con hot reload
docker compose down        # Detiene el entorno
docker compose up --build  # Reconstruye la imagen y levanta el entorno
```

---

## CI/CD

Este proyecto utiliza **GitHub Actions** para Integración Continua siguiendo el flujo **GitFlow**.

### Pipeline CI

El pipeline se ejecuta automáticamente en:

- Push a `main` o `develop`
- Pull Requests hacia `main` o `develop`

### Pasos del pipeline

| Paso                  | Comando                                        |
| --------------------- | ---------------------------------------------- |
| Checkout              | `actions/checkout@v4`                          |
| Setup Node.js         | `actions/setup-node@v4` (Node 20 + caché pnpm) |
| Instalar dependencias | `pnpm install --frozen-lockfile`               |
| Verificación de tipos | `pnpm tsc --noEmit`                            |
| Lint                  | `pnpm lint`                                    |
| Tests                 | `pnpm test`                                    |

### Protección de ramas

Para que el pipeline bloquee merges con errores, configurar en GitHub:
**Settings → Branches → Branch protection rules** sobre `main` y `develop`:

- ✅ Require status checks to pass before merging
- ✅ Seleccionar el job `Lint, Types & Tests`
- ✅ Require branches to be up to date before merging

---

## Notas

- Este proyecto utiliza alias configurados en `vite.config.ts` y `tsconfig.app.json` para facilitar las importaciones.
- El proyecto está preparado para trabajar con un backend Laravel que se desarrollará en paralelo.
- El manejo de estado global se realizará con Zustand para mantener la simplicidad y rendimiento.
- La estructura modular permite escalar fácilmente y mantener separados los dominios de negocio.

---

## Contribución

Por favor, sigan el flujo de trabajo establecido:

- Trabajar en ramas basadas en `dev` (`feature/`, `fix/`, etc.).
- Abrir Pull Requests hacia `dev`.
- Usar etiquetas (labels) para clasificar los PRs y Issues.

---

## Licencia

Este proyecto es privado y propiedad de los socios fundadores de CENTRA.

---

¡Gracias por ser parte de este proyecto!
