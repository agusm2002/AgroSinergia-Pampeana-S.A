import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from './database.service';

type ResourceName = 'fields' | 'campaigns' | 'tasks';

type SortOrder = 'ASC' | 'DESC';

type ListConfig = {
  select: string;
  from: string;
  sortMap: Record<string, string>;
  filterMap: Record<string, string>;
};

export type ListQueryDto = Record<string, string | string[] | undefined> & {
  _start?: string;
  _end?: string;
  _sort?: string;
  _order?: string;
};

type ListResult = {
  data: Record<string, unknown>[];
  total: number;
};

type PgError = Error & {
  code?: string;
  detail?: string;
};

const FIELD_STATUSES = [
  'Planificado',
  'En Siembra',
  'En Seguimiento',
  'Cosechado',
];
const CAMPAIGN_STATUSES = ['Preparacion', 'En Curso', 'Finalizada'];
const TASK_STATUSES = ['Pendiente', 'En Progreso', 'Completada'];
const TASK_PRIORITIES = ['Alta', 'Media', 'Baja'];

@Injectable()
export class AppService {
  constructor(private readonly db: DatabaseService) {}

  private readonly listConfig: Record<ResourceName, ListConfig> = {
    fields: {
      select:
        'SELECT f.id, f.name, f.zone, f.hectares, f.crop, f.status, f.soil_moisture, f.created_at, f.updated_at',
      from: 'FROM fields f',
      sortMap: {
        id: 'f.id',
        name: 'f.name',
        zone: 'f.zone',
        hectares: 'f.hectares',
        crop: 'f.crop',
        status: 'f.status',
        created_at: 'f.created_at',
      },
      filterMap: {
        id: 'f.id',
        name: 'f.name',
        zone: 'f.zone',
        crop: 'f.crop',
        status: 'f.status',
      },
    },
    campaigns: {
      select:
        'SELECT c.id, c.field_id, f.name AS field_name, c.season, c.budget_usd, c.expected_yield_tn, c.progress, c.status, c.start_date, c.end_date, c.created_at, c.updated_at',
      from: 'FROM campaigns c INNER JOIN fields f ON f.id = c.field_id',
      sortMap: {
        id: 'c.id',
        field_id: 'c.field_id',
        field_name: 'f.name',
        season: 'c.season',
        budget_usd: 'c.budget_usd',
        expected_yield_tn: 'c.expected_yield_tn',
        progress: 'c.progress',
        status: 'c.status',
        start_date: 'c.start_date',
      },
      filterMap: {
        id: 'c.id',
        field_id: 'c.field_id',
        season: 'c.season',
        status: 'c.status',
      },
    },
    tasks: {
      select:
        'SELECT t.id, t.campaign_id, c.season AS campaign_season, f.name AS field_name, t.title, t.assigned_to, t.due_date, t.priority, t.status, t.notes, t.created_at, t.updated_at',
      from: 'FROM tasks t INNER JOIN campaigns c ON c.id = t.campaign_id INNER JOIN fields f ON f.id = c.field_id',
      sortMap: {
        id: 't.id',
        campaign_id: 't.campaign_id',
        campaign_season: 'c.season',
        title: 't.title',
        assigned_to: 't.assigned_to',
        due_date: 't.due_date',
        priority: 't.priority',
        status: 't.status',
      },
      filterMap: {
        id: 't.id',
        campaign_id: 't.campaign_id',
        title: 't.title',
        assigned_to: 't.assigned_to',
        priority: 't.priority',
        status: 't.status',
      },
    },
  };

  getHealth() {
    return {
      ok: true,
      service: 'AgroSinergia API',
      timestamp: new Date().toISOString(),
    };
  }

  async getDashboardSummary() {
    const [summary] = await this.db.query<{
      total_fields: number;
      managed_hectares: number;
      active_campaigns: number;
      avg_progress: number;
      pending_tasks: number;
      expected_yield_tn: number;
    }>(
      `
      SELECT
        (SELECT COUNT(*)::int FROM fields) AS total_fields,
        (SELECT COALESCE(SUM(hectares), 0)::float FROM fields) AS managed_hectares,
        (SELECT COUNT(*)::int FROM campaigns WHERE status <> 'Finalizada') AS active_campaigns,
        (SELECT COALESCE(AVG(progress), 0)::float FROM campaigns) AS avg_progress,
        (SELECT COUNT(*)::int FROM tasks WHERE status <> 'Completada') AS pending_tasks,
        (SELECT COALESCE(SUM(expected_yield_tn), 0)::float FROM campaigns WHERE status <> 'Finalizada') AS expected_yield_tn
      `,
    );

    return {
      ...summary,
      generated_at: new Date().toISOString(),
    };
  }

  async getUpcomingTasks() {
    return this.db.query(
      `
      SELECT
        t.id,
        t.title,
        t.assigned_to,
        t.due_date,
        t.priority,
        t.status,
        c.season AS campaign_season,
        f.name AS field_name
      FROM tasks t
      INNER JOIN campaigns c ON c.id = t.campaign_id
      INNER JOIN fields f ON f.id = c.field_id
      WHERE t.status <> 'Completada'
      ORDER BY t.due_date ASC, t.id ASC
      LIMIT 8
      `,
    );
  }

  async listFields(query: ListQueryDto): Promise<ListResult> {
    return this.listResource('fields', query);
  }

  async getField(id: number) {
    const [field] = await this.db.query<Record<string, unknown>>(
      `
      SELECT
        f.id,
        f.name,
        f.zone,
        f.hectares,
        f.crop,
        f.status,
        f.soil_moisture,
        f.created_at,
        f.updated_at
      FROM fields f
      WHERE f.id = $1
      `,
      [id],
    );

    if (!field) {
      throw new NotFoundException('No existe el lote solicitado.');
    }

    return field;
  }

  async createField(payload: Record<string, unknown>) {
    const name = this.readText(payload.name, 'name');
    const zone = this.readText(payload.zone, 'zone');
    const hectares = this.readNumber(payload.hectares, 'hectares');
    const crop = this.readText(payload.crop, 'crop');
    const status = this.readEnum(payload.status, 'status', FIELD_STATUSES);
    const soilMoisture = this.readNumber(
      payload.soil_moisture,
      'soil_moisture',
      false,
      0,
    );

    const [created] = await this.db.query<Record<string, unknown>>(
      `
      INSERT INTO fields (name, zone, hectares, crop, status, soil_moisture)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, zone, hectares, crop, status, soil_moisture, created_at, updated_at
      `,
      [name, zone, hectares, crop, status, soilMoisture],
    );

    return created;
  }

  async updateField(id: number, payload: Record<string, unknown>) {
    await this.getField(id);

    const updates: string[] = [];
    const params: unknown[] = [];

    if (this.hasOwn(payload, 'name')) {
      params.push(this.readText(payload.name, 'name'));
      updates.push(`name = $${params.length}`);
    }
    if (this.hasOwn(payload, 'zone')) {
      params.push(this.readText(payload.zone, 'zone'));
      updates.push(`zone = $${params.length}`);
    }
    if (this.hasOwn(payload, 'hectares')) {
      params.push(this.readNumber(payload.hectares, 'hectares'));
      updates.push(`hectares = $${params.length}`);
    }
    if (this.hasOwn(payload, 'crop')) {
      params.push(this.readText(payload.crop, 'crop'));
      updates.push(`crop = $${params.length}`);
    }
    if (this.hasOwn(payload, 'status')) {
      params.push(this.readEnum(payload.status, 'status', FIELD_STATUSES));
      updates.push(`status = $${params.length}`);
    }
    if (this.hasOwn(payload, 'soil_moisture')) {
      params.push(
        this.readNumber(payload.soil_moisture, 'soil_moisture', false, 0),
      );
      updates.push(`soil_moisture = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.getField(id);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const [updated] = await this.db.query<Record<string, unknown>>(
      `
      UPDATE fields
      SET ${updates.join(', ')}
      WHERE id = $${params.length}
      RETURNING id, name, zone, hectares, crop, status, soil_moisture, created_at, updated_at
      `,
      params,
    );

    return updated;
  }

  async deleteField(id: number) {
    const [deleted] = await this.db.query<Record<string, unknown>>(
      `
      DELETE FROM fields
      WHERE id = $1
      RETURNING id, name, zone, hectares, crop, status, soil_moisture, created_at, updated_at
      `,
      [id],
    );

    if (!deleted) {
      throw new NotFoundException('No existe el lote solicitado.');
    }

    return deleted;
  }

  async listCampaigns(query: ListQueryDto): Promise<ListResult> {
    return this.listResource('campaigns', query);
  }

  async getCampaign(id: number) {
    const [campaign] = await this.db.query<Record<string, unknown>>(
      `
      SELECT
        c.id,
        c.field_id,
        f.name AS field_name,
        c.season,
        c.budget_usd,
        c.expected_yield_tn,
        c.progress,
        c.status,
        c.start_date,
        c.end_date,
        c.created_at,
        c.updated_at
      FROM campaigns c
      INNER JOIN fields f ON f.id = c.field_id
      WHERE c.id = $1
      `,
      [id],
    );

    if (!campaign) {
      throw new NotFoundException('No existe la campana solicitada.');
    }

    return campaign;
  }

  async createCampaign(payload: Record<string, unknown>) {
    const fieldId = this.readInteger(payload.field_id, 'field_id');
    const season = this.readText(payload.season, 'season');
    const budgetUsd = this.readNumber(
      payload.budget_usd,
      'budget_usd',
      false,
      0,
    );
    const expectedYield = this.readNumber(
      payload.expected_yield_tn,
      'expected_yield_tn',
      false,
      0,
    );
    const progress = this.readInteger(
      payload.progress,
      'progress',
      false,
      0,
      100,
    );
    const status = this.readEnum(payload.status, 'status', CAMPAIGN_STATUSES);
    const startDate = this.readDate(payload.start_date, 'start_date');
    const endDate = this.readDate(payload.end_date, 'end_date');

    try {
      const [created] = await this.db.query<Record<string, unknown>>(
        `
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, field_id, season, budget_usd, expected_yield_tn, progress, status, start_date, end_date, created_at, updated_at
        `,
        [
          fieldId,
          season,
          budgetUsd,
          expectedYield,
          progress,
          status,
          startDate,
          endDate,
        ],
      );

      return this.getCampaign(Number(created.id));
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async updateCampaign(id: number, payload: Record<string, unknown>) {
    await this.getCampaign(id);

    const updates: string[] = [];
    const params: unknown[] = [];

    if (this.hasOwn(payload, 'field_id')) {
      params.push(this.readInteger(payload.field_id, 'field_id'));
      updates.push(`field_id = $${params.length}`);
    }
    if (this.hasOwn(payload, 'season')) {
      params.push(this.readText(payload.season, 'season'));
      updates.push(`season = $${params.length}`);
    }
    if (this.hasOwn(payload, 'budget_usd')) {
      params.push(this.readNumber(payload.budget_usd, 'budget_usd', false, 0));
      updates.push(`budget_usd = $${params.length}`);
    }
    if (this.hasOwn(payload, 'expected_yield_tn')) {
      params.push(
        this.readNumber(
          payload.expected_yield_tn,
          'expected_yield_tn',
          false,
          0,
        ),
      );
      updates.push(`expected_yield_tn = $${params.length}`);
    }
    if (this.hasOwn(payload, 'progress')) {
      params.push(
        this.readInteger(payload.progress, 'progress', false, 0, 100),
      );
      updates.push(`progress = $${params.length}`);
    }
    if (this.hasOwn(payload, 'status')) {
      params.push(this.readEnum(payload.status, 'status', CAMPAIGN_STATUSES));
      updates.push(`status = $${params.length}`);
    }
    if (this.hasOwn(payload, 'start_date')) {
      params.push(this.readDate(payload.start_date, 'start_date'));
      updates.push(`start_date = $${params.length}`);
    }
    if (this.hasOwn(payload, 'end_date')) {
      params.push(this.readDate(payload.end_date, 'end_date'));
      updates.push(`end_date = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.getCampaign(id);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    try {
      const [updated] = await this.db.query<{ id: number }>(
        `
        UPDATE campaigns
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
        RETURNING id
        `,
        params,
      );

      return this.getCampaign(updated.id);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async deleteCampaign(id: number) {
    const [deleted] = await this.db.query<Record<string, unknown>>(
      `
      DELETE FROM campaigns
      WHERE id = $1
      RETURNING id, field_id, season, budget_usd, expected_yield_tn, progress, status, start_date, end_date, created_at, updated_at
      `,
      [id],
    );

    if (!deleted) {
      throw new NotFoundException('No existe la campana solicitada.');
    }

    return deleted;
  }

  async listTasks(query: ListQueryDto): Promise<ListResult> {
    return this.listResource('tasks', query);
  }

  async getTask(id: number) {
    const [task] = await this.db.query<Record<string, unknown>>(
      `
      SELECT
        t.id,
        t.campaign_id,
        c.season AS campaign_season,
        f.name AS field_name,
        t.title,
        t.assigned_to,
        t.due_date,
        t.priority,
        t.status,
        t.notes,
        t.created_at,
        t.updated_at
      FROM tasks t
      INNER JOIN campaigns c ON c.id = t.campaign_id
      INNER JOIN fields f ON f.id = c.field_id
      WHERE t.id = $1
      `,
      [id],
    );

    if (!task) {
      throw new NotFoundException('No existe la tarea solicitada.');
    }

    return task;
  }

  async createTask(payload: Record<string, unknown>) {
    const campaignId = this.readInteger(payload.campaign_id, 'campaign_id');
    const title = this.readText(payload.title, 'title');
    const assignedTo = this.readText(payload.assigned_to, 'assigned_to');
    const dueDate = this.readDate(payload.due_date, 'due_date');
    const priority = this.readEnum(
      payload.priority,
      'priority',
      TASK_PRIORITIES,
    );
    const status = this.readEnum(payload.status, 'status', TASK_STATUSES);
    const notes = this.readText(payload.notes, 'notes', false, '');

    try {
      const [created] = await this.db.query<{ id: number }>(
        `
        INSERT INTO tasks (campaign_id, title, assigned_to, due_date, priority, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        `,
        [campaignId, title, assignedTo, dueDate, priority, status, notes],
      );

      return this.getTask(created.id);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async updateTask(id: number, payload: Record<string, unknown>) {
    await this.getTask(id);

    const updates: string[] = [];
    const params: unknown[] = [];

    if (this.hasOwn(payload, 'campaign_id')) {
      params.push(this.readInteger(payload.campaign_id, 'campaign_id'));
      updates.push(`campaign_id = $${params.length}`);
    }
    if (this.hasOwn(payload, 'title')) {
      params.push(this.readText(payload.title, 'title'));
      updates.push(`title = $${params.length}`);
    }
    if (this.hasOwn(payload, 'assigned_to')) {
      params.push(this.readText(payload.assigned_to, 'assigned_to'));
      updates.push(`assigned_to = $${params.length}`);
    }
    if (this.hasOwn(payload, 'due_date')) {
      params.push(this.readDate(payload.due_date, 'due_date'));
      updates.push(`due_date = $${params.length}`);
    }
    if (this.hasOwn(payload, 'priority')) {
      params.push(this.readEnum(payload.priority, 'priority', TASK_PRIORITIES));
      updates.push(`priority = $${params.length}`);
    }
    if (this.hasOwn(payload, 'status')) {
      params.push(this.readEnum(payload.status, 'status', TASK_STATUSES));
      updates.push(`status = $${params.length}`);
    }
    if (this.hasOwn(payload, 'notes')) {
      params.push(this.readText(payload.notes, 'notes', false, ''));
      updates.push(`notes = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.getTask(id);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    try {
      const [updated] = await this.db.query<{ id: number }>(
        `
        UPDATE tasks
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
        RETURNING id
        `,
        params,
      );

      return this.getTask(updated.id);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async deleteTask(id: number) {
    const [deleted] = await this.db.query<Record<string, unknown>>(
      `
      DELETE FROM tasks
      WHERE id = $1
      RETURNING id, campaign_id, title, assigned_to, due_date, priority, status, notes, created_at, updated_at
      `,
      [id],
    );

    if (!deleted) {
      throw new NotFoundException('No existe la tarea solicitada.');
    }

    return deleted;
  }

  private async listResource(
    resource: ResourceName,
    query: ListQueryDto,
  ): Promise<ListResult> {
    const config = this.listConfig[resource];
    const { limit, offset } = this.parsePagination(query);
    const { sortColumn, sortOrder } = this.parseSort(query, config);
    const { whereClause, values } = this.parseFilters(query, config);

    const countRows = await this.db.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total ${config.from} ${whereClause}`,
      values,
    );

    const total = Number(countRows[0]?.total ?? 0);

    const listValues = [...values, limit, offset];
    const listRows = await this.db.query<Record<string, unknown>>(
      `${config.select} ${config.from} ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      listValues,
    );

    return {
      data: listRows,
      total,
    };
  }

  private parsePagination(query: ListQueryDto) {
    const start = Number.parseInt(String(query._start ?? '0'), 10);
    const end = Number.parseInt(String(query._end ?? String(start + 10)), 10);

    const safeStart = Number.isFinite(start) && start >= 0 ? start : 0;
    const safeEnd =
      Number.isFinite(end) && end > safeStart ? end : safeStart + 10;

    const limit = Math.min(safeEnd - safeStart, 100);
    const offset = safeStart;

    return { limit, offset };
  }

  private parseSort(query: ListQueryDto, config: ListConfig) {
    const sortKey = String(query._sort ?? 'id');
    const sortColumn = config.sortMap[sortKey] ?? config.sortMap.id;

    const orderRaw = String(query._order ?? 'ASC').toUpperCase();
    const sortOrder: SortOrder = orderRaw === 'DESC' ? 'DESC' : 'ASC';

    return { sortColumn, sortOrder };
  }

  private parseFilters(query: ListQueryDto, config: ListConfig) {
    const reserved = new Set(['_start', '_end', '_sort', '_order']);
    const filters: string[] = [];
    const values: unknown[] = [];

    for (const [rawKey, rawValue] of Object.entries(query)) {
      if (reserved.has(rawKey)) {
        continue;
      }

      const key = rawKey.trim();
      const value = this.normalizeQueryValue(rawValue);

      if (!key || value === undefined || value === '') {
        continue;
      }

      const isLike = key.endsWith('_like');
      const isGte = key.endsWith('_gte');
      const isLte = key.endsWith('_lte');

      const filterKey = key.replace(/_(like|gte|lte)$/u, '');
      const column = config.filterMap[filterKey];

      if (!column) {
        continue;
      }

      values.push(isLike ? `%${value}%` : value);
      const paramIndex = values.length;

      if (isLike) {
        filters.push(`${column} ILIKE $${paramIndex}`);
      } else if (isGte) {
        filters.push(`${column} >= $${paramIndex}`);
      } else if (isLte) {
        filters.push(`${column} <= $${paramIndex}`);
      } else {
        filters.push(`${column} = $${paramIndex}`);
      }
    }

    return {
      whereClause: filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '',
      values,
    };
  }

  private normalizeQueryValue(value: string | string[] | undefined) {
    if (value === undefined) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.at(-1);
    }
    return value;
  }

  private hasOwn(payload: Record<string, unknown>, key: string): boolean {
    return Object.hasOwn(payload, key);
  }

  private readText(
    value: unknown,
    field: string,
    required = true,
    fallback = '',
  ) {
    if (value === undefined || value === null || value === '') {
      if (!required) {
        return fallback;
      }
      throw new BadRequestException(`El campo ${field} es obligatorio.`);
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`El campo ${field} debe ser texto.`);
    }

    const trimmed = value.trim();

    if (!trimmed && required) {
      throw new BadRequestException(`El campo ${field} es obligatorio.`);
    }

    return trimmed || fallback;
  }

  private readNumber(
    value: unknown,
    field: string,
    required = true,
    min?: number,
    max?: number,
  ) {
    if (value === undefined || value === null || value === '') {
      if (!required) {
        return 0;
      }
      throw new BadRequestException(`El campo ${field} es obligatorio.`);
    }

    let parsed: number;

    if (typeof value === 'number') {
      parsed = value;
    } else if (typeof value === 'string') {
      parsed = Number.parseFloat(value.replace(',', '.'));
    } else {
      throw new BadRequestException(`El campo ${field} debe ser numerico.`);
    }

    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`El campo ${field} debe ser numerico.`);
    }

    if (min !== undefined && parsed < min) {
      throw new BadRequestException(
        `El campo ${field} debe ser mayor o igual a ${min}.`,
      );
    }

    if (max !== undefined && parsed > max) {
      throw new BadRequestException(
        `El campo ${field} debe ser menor o igual a ${max}.`,
      );
    }

    return parsed;
  }

  private readInteger(
    value: unknown,
    field: string,
    required = true,
    min?: number,
    max?: number,
  ) {
    if (value === undefined || value === null || value === '') {
      if (!required) {
        return 0;
      }
      throw new BadRequestException(`El campo ${field} es obligatorio.`);
    }

    let parsed: number;

    if (typeof value === 'number') {
      parsed = value;
    } else if (typeof value === 'string') {
      parsed = Number.parseInt(value, 10);
    } else {
      throw new BadRequestException(`El campo ${field} debe ser entero.`);
    }

    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`El campo ${field} debe ser entero.`);
    }

    if (min !== undefined && parsed < min) {
      throw new BadRequestException(
        `El campo ${field} debe ser mayor o igual a ${min}.`,
      );
    }

    if (max !== undefined && parsed > max) {
      throw new BadRequestException(
        `El campo ${field} debe ser menor o igual a ${max}.`,
      );
    }

    return parsed;
  }

  private readDate(value: unknown, field: string) {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`El campo ${field} es obligatorio.`);
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`El campo ${field} debe ser fecha.`);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`El campo ${field} debe ser fecha valida.`);
    }

    return date.toISOString().slice(0, 10);
  }

  private readEnum(value: unknown, field: string, options: string[]) {
    const raw = this.readText(value, field);

    if (!options.includes(raw)) {
      throw new BadRequestException(
        `El campo ${field} debe ser uno de: ${options.join(', ')}.`,
      );
    }

    return raw;
  }

  private handleDatabaseError(error: unknown): never {
    const pgError = error as PgError;

    if (pgError?.code === '23503') {
      throw new BadRequestException(
        'La relacion indicada no existe en la base de datos.',
      );
    }

    if (pgError?.code === '23514') {
      throw new BadRequestException(
        'Se recibio un valor fuera de las reglas de validacion.',
      );
    }

    if (pgError?.code === '22P02') {
      throw new BadRequestException('Formato de dato invalido.');
    }

    throw error;
  }
}
