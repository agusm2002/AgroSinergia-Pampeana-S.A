import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  private readonly pool = new Pool({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? '5432'),
    user: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'agrosinergia',
  });

  async onModuleInit() {
    await this.pool.query('SELECT 1');
    await this.ensureSchema();
    await this.seedIfNeeded();
    this.logger.log('Database ready.');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ): Promise<T[]> {
    const result = await this.pool.query<T>(text, values);
    return result.rows;
  }

  private async ensureSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS fields (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        zone TEXT NOT NULL,
        hectares NUMERIC(10,2) NOT NULL CHECK (hectares > 0),
        crop TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('Planificado', 'En Siembra', 'En Seguimiento', 'Cosechado')),
        soil_moisture NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (soil_moisture >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        season TEXT NOT NULL,
        budget_usd NUMERIC(12,2) NOT NULL CHECK (budget_usd >= 0),
        expected_yield_tn NUMERIC(10,2) NOT NULL CHECK (expected_yield_tn >= 0),
        progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        status TEXT NOT NULL CHECK (status IN ('Preparacion', 'En Curso', 'Finalizada')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        assigned_to TEXT NOT NULL,
        due_date DATE NOT NULL,
        priority TEXT NOT NULL CHECK (priority IN ('Alta', 'Media', 'Baja')),
        status TEXT NOT NULL CHECK (status IN ('Pendiente', 'En Progreso', 'Completada')),
        notes TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  private async seedIfNeeded() {
    const [counter] = await this.query<{ total: number }>(
      'SELECT COUNT(*)::int AS total FROM fields',
    );

    if ((counter?.total ?? 0) > 0) {
      return;
    }

    await this.pool.query(`
      INSERT INTO fields (name, zone, hectares, crop, status, soil_moisture)
      VALUES
        ('Lote Norte', 'Pergamino', 85.5, 'Soja', 'En Seguimiento', 22.4),
        ('Lote Centro', 'Junin', 120.0, 'Maiz', 'En Siembra', 18.9),
        ('Lote Sur', 'Tandil', 64.2, 'Trigo', 'Planificado', 15.0),
        ('Lote Delta', 'San Nicolas', 92.7, 'Girasol', 'Cosechado', 27.3);

      INSERT INTO campaigns (
        field_id,
        season,
        budget_usd,
        expected_yield_tn,
        progress,
        status,
        start_date,
        end_date
      )
      VALUES
        (1, '2026/2027', 182000, 295.5, 58, 'En Curso', '2026-09-01', '2027-03-15'),
        (2, '2026/2027', 245000, 410.2, 34, 'En Curso', '2026-08-20', '2027-03-28'),
        (3, '2026/2027', 98000, 145.0, 12, 'Preparacion', '2026-10-10', '2027-01-30'),
        (4, '2025/2026', 134000, 210.7, 100, 'Finalizada', '2025-09-02', '2026-02-18');

      INSERT INTO tasks (
        campaign_id,
        title,
        assigned_to,
        due_date,
        priority,
        status,
        notes
      )
      VALUES
        (1, 'Calibrar sembradora sector A', 'Lucia Mendez', '2026-10-04', 'Alta', 'En Progreso', 'Validar dosis variable por ambiente.'),
        (1, 'Muestreo de suelo etapa V4', 'Santiago Perez', '2026-10-12', 'Media', 'Pendiente', 'Enviar reporte al equipo tecnico.'),
        (2, 'Relevamiento de malezas tardias', 'Marta Suarez', '2026-10-09', 'Alta', 'Pendiente', 'Coordinar con proveedor de fitosanitarios.'),
        (2, 'Control de humedad en silobolsa', 'Juan Acevedo', '2026-10-18', 'Media', 'Pendiente', 'Programar visita conjunta con logistica.'),
        (3, 'Definir estrategia de fertilizacion', 'Diego Ramos', '2026-10-22', 'Alta', 'Pendiente', 'Comparar escenarios de costo por hectarea.'),
        (4, 'Cerrar informe de campana', 'Florencia Navas', '2026-04-30', 'Baja', 'Completada', 'Consolidar KPIs para directorio.');
    `);

    this.logger.log('Sample data inserted into Postgres.');
  }
}
