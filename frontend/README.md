# Frontend (Next.js + Auth con Mock API)

Este proyecto implementa un flujo de autenticación en Next.js 13+ (App Router) utilizando JWT (simulado) y consumiendo un API Gateway mockeado con MSW (Mock Service Worker).

## Requerimientos Funcionales Implementados
# archivo de coleccion postman \frontend\postman_collection.json

### Login (`/login`)
- Formulario con email y password.
- Validación de campos en frontend.
- Envío de credenciales a `POST /users/login` (mockeado).
- Manejo de expiración y refresco de tokens con `POST /users/refresh` (mockeado).

Email: test@example.com
Password: password123

### Páginas Protegidas (`/dashboard`, `/me`)
- Acceso restringido a usuarios autenticados.

### Página de Perfil (`/me`)
- Consume `GET /users/me` (mock).
- Muestra nombre, email y fecha de creación del usuario.
- Permite editar el nombre con `PUT /users/me` (mock).

### Protección de Rutas
- Implementado un middleware básico para redirigir a `/login` si no hay un token de acceso (aunque los tokens se manejan en `localStorage` en el cliente, la redirección principal se gestiona en los componentes protegidos).

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx         # Página de login
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Página protegida del dashboard
│   │   ├── me/
│   │   │   └── page.tsx             # Página de perfil protegida
│   │   ├── globals.css
│   │   ├── layout.tsx               # Layout principal con AuthProvider y MSWProvider
│   │   └── page.tsx                 # Página de inicio (redirecciona a login si no autenticado)
│   ├── components/
│   │   └── MSWProvider.tsx          # Componente para inicializar MSW
│   ├── context/
│   │   └── AuthContext.tsx          # Contexto de autenticación
│   └── mocks/
│       ├── browser.ts               # Configuración de MSW para el navegador
│       └── handlers.ts              # Definición de los endpoints mockeados
├── public/
├── .gitignore
├── eslint.config.mjs
├── middleware.ts                    # Middleware de Next.js para protección de rutas
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md                        # Este archivo
└── tsconfig.json
```

## Mock API

La API mockeada se implementa utilizando [MSW (Mock Service Worker)](https://mswjs.io/). Los handlers están definidos en `frontend/src/mocks/handlers.ts`.

**Endpoints Mockeados:**
- `POST /users/login`: Simula el inicio de sesión y devuelve `accessToken` y `refreshToken`.
- `POST /users/refresh`: Simula el refresco de tokens.
- `GET /users/me`: Devuelve la información del usuario autenticado.
- `PUT /users/me`: Actualiza el nombre del usuario autenticado.

**Credenciales de Prueba:**
- Email: `test@example.com`
- Password: `password123`

## Instrucciones de Ejecución

1.  **Navegar al directorio `frontend`:**
    ```bash
    cd frontend
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

4.  **Acceder a la aplicación:**
    Abre tu navegador y ve a `http://localhost:3000`. Serás redirigido automáticamente a la página de login.

## Notas Importantes

-   **Tokens:** Los tokens de acceso y refresco se almacenan en `localStorage` del navegador para simplificar el mock. En una aplicación real, se recomienda usar `HttpOnly cookies` para mayor seguridad.
-   **Middleware:** El `middleware.ts` intenta proteger las rutas, pero debido a que los tokens se guardan en `localStorage` (cliente), el middleware (servidor) no tiene acceso directo a ellos. La protección principal se realiza en los componentes de página (`/dashboard`, `/me`) usando `useEffect` y `useRouter` para redirigir si el usuario no está autenticado.
