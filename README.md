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
- Host postgres publicado: `POSTGRES_HOST_PORT` (default `5432`)
- Host backend publicado: `BACKEND_HOST_PORT` (default `3011`)
- Host frontend publicado: `FRONTEND_HOST_PORT` (default `3000`)
- Host admin publicado: `REFINE_HOST_PORT` (default `3002`)
- Frontend: `AGRO_API_URL=http://backend:3001`
- Refine cliente: `NEXT_PUBLIC_API_URL=/api`
- Refine proxy interno: `INTERNAL_API_URL=http://backend:3001`

## Notas

- Este compose usa proyecto `agrosinergia_production`, red `agrosinergia_prod_network` y volumen `agrosinergia_prod_postgres_data`.
- El backend escucha en `0.0.0.0:3001` dentro del contenedor y se publica en el host como `3011`.
- El panel admin consume `/api` en el mismo origen; Next.js proxyea internamente hacia `backend:3001`.
- Si `3001` esta ocupado por Uptime Kuma (u otro servicio), no hay conflicto: este stack usa `3011` por defecto.
- Para cambiar puertos: `POSTGRES_HOST_PORT=55432 BACKEND_HOST_PORT=3021 FRONTEND_HOST_PORT=3100 REFINE_HOST_PORT=3102 docker compose up -d`.

## Estrategia de ramas (Git Flow)

Este repositorio usa Git Flow para separar desarrollo diario, estabilizacion de versiones y correcciones urgentes.

- `main`: rama estable de produccion. Solo recibe cambios listos para publicar.
- `develop`: rama de integracion. Recibe funcionalidades terminadas antes de una release.
- `feature/*`: ramas temporales para trabajo funcional. Nacen desde `develop`, vuelven a `develop` y se eliminan al cerrar su ciclo.
- `release/*`: ramas temporales para preparar una version. Se usan para QA, ajustes finales y versionado antes de fusionar en `main` (y sincronizar en `develop`).
- `hotfix/*`: ramas temporales para incidentes criticos en produccion. Nacen desde `main`, se fusionan a `main` y `develop`, y luego se eliminan.
- `support/*`: ramas de mantenimiento para una linea mayor en paralelo cuando se necesita soporte extendido.

### Convencion de nombres

- `feature/<tema-corto>`
- `release/<semver>`
- `hotfix/<semver>-<motivo-corto>`
- `support/<major>.x`

## CI/CD (GitHub Actions)

Workflows activos:

- `.github/workflows/pull_request.yml`
  - trigger: PR hacia `develop` o `main`
  - ejecuta: `lint`, `tests`, `build`
  - publica imagenes en DockerHub
  - despliega con `docker compose` en `self-hosted` segun rama destino:
  - PR a `develop` -> `staging` (`self-hosted`, `linux`, `staging`)
  - PR a `main` -> `production` (`self-hosted`, `linux`, `production`)

- `.github/workflows/develop.yml`
  - trigger: `push` a `develop`
  - ejecuta: build/push de imagenes DockerHub
  - despliega `staging` en runner `self-hosted`

- `.github/workflows/main.yml`
  - trigger: `push` a `main`
  - ejecuta: tests + build release + push DockerHub (`latest`, `version`, `production-<sha>`)
  - despliega `production` en runner `self-hosted`

Secrets requeridos en GitHub:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `DOCKERHUB_NAMESPACE` (opcional; si no existe, usa `DOCKERHUB_USERNAME`)
- `STAGING_POSTGRES_PASSWORD` (opcional; fallback local: `agrosinergia_staging`)
- `PRODUCTION_POSTGRES_PASSWORD` (opcional; fallback local: `agrosinergia`)

Notas operativas:

- El deploy usa `docker compose pull` + `docker compose up -d --no-build --remove-orphans`.
- La separacion de staging/production se hace por variables de compose (nombre de proyecto, prefijo de contenedores, red, volumen y puertos).
- Los PR desde forks no despliegan (restriccion por uso de secrets).
