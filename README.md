# AgroSinergia Pampeana S.A. - Plataforma Full Stack

Proyecto integral con cuatro contenedores conectados en una misma red Docker:

- `frontend` (Next.js): landing y dashboard operativo
- `backend` (NestJS): API REST con logica de negocio
- `refine` (Refine + Next.js): panel administrador CRUD
- `postgres` (PostgreSQL): base de datos persistente

## Arquitectura funcional

La plataforma gestiona tres recursos principales del negocio agricola:

- `fields`: lotes (zona, cultivo, estado, hectareas, humedad)
- `campaigns`: campanas productivas (presupuesto, avance, rinde estimado)
- `tasks`: tareas operativas (responsable, prioridad, vencimiento)

Ademas, el backend expone un resumen ejecutivo para el frontend:

- `GET /dashboard/summary`
- `GET /dashboard/upcoming-tasks`

## Levantar todo con Docker

Desde la raiz del proyecto:

```bash
docker compose up --build
```

## Datos de base

Al iniciar por primera vez, el backend crea las tablas y carga datos de ejemplo automaticamente.

## Variables clave

Definidas en `docker-compose.yaml`:

- Base de datos: `POSTGRES_*`
- Backend: conexion a `postgres`
- Host backend publicado: `BACKEND_HOST_PORT` (default `3011`)
- Frontend: `AGRO_API_URL=http://backend:3001`
- Refine cliente: `NEXT_PUBLIC_API_URL=/api`
- Refine proxy interno: `INTERNAL_API_URL=http://backend:3001`

## Notas

- El backend escucha en `0.0.0.0:3001` dentro del contenedor y se publica en el host como `3011`.
- El panel admin consume `/api` en el mismo origen; Next.js proxyea internamente hacia `backend:3001`.
- Si `3001` esta ocupado por Uptime Kuma (u otro servicio), no hay conflicto: este stack usa `3011` por defecto.
- Para cambiarlo: `BACKEND_HOST_PORT=3021 docker compose up -d`.
# AgroSinergia Pampeana S.A.
