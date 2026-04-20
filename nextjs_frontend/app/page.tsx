type DashboardSummary = {
  total_fields: number;
  managed_hectares: number;
  active_campaigns: number;
  avg_progress: number;
  pending_tasks: number;
  expected_yield_tn: number;
  generated_at: string;
};

type Campaign = {
  id: number;
  field_name: string;
  season: string;
  progress: number;
  status: string;
  budget_usd: number;
  expected_yield_tn: number;
};

type UpcomingTask = {
  id: number;
  title: string;
  assigned_to: string;
  due_date: string;
  priority: string;
  status: string;
  campaign_season: string;
  field_name: string;
};

type Field = {
  id: number;
  name: string;
  zone: string;
  crop: string;
  status: string;
  hectares: number;
  soil_moisture: number;
};

const API_URL = process.env.AGRO_API_URL ?? "http://localhost:3011";

const fallbackSummary: DashboardSummary = {
  total_fields: 0,
  managed_hectares: 0,
  active_campaigns: 0,
  avg_progress: 0,
  pending_tasks: 0,
  expected_yield_tn: 0,
  generated_at: new Date().toISOString(),
};

const usd = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 45 },
  });

  if (!response.ok) {
    throw new Error(`No se pudo obtener ${path}.`);
  }

  return (await response.json()) as T;
}

async function loadDashboardData() {
  try {
    const [summary, upcomingTasks, campaigns, fields] = await Promise.all([
      getJson<DashboardSummary>("/dashboard/summary"),
      getJson<UpcomingTask[]>("/dashboard/upcoming-tasks"),
      getJson<Campaign[]>("/campaigns?_start=0&_end=4&_sort=progress&_order=DESC"),
      getJson<Field[]>("/fields?_start=0&_end=4&_sort=hectares&_order=DESC"),
    ]);

    return {
      summary,
      upcomingTasks,
      campaigns,
      fields,
      degraded: false,
    };
  } catch {
    return {
      summary: fallbackSummary,
      upcomingTasks: [] as UpcomingTask[],
      campaigns: [] as Campaign[],
      fields: [] as Field[],
      degraded: true,
    };
  }
}

function progressTone(value: number) {
  if (value >= 75) {
    return "bg-emerald-600";
  }
  if (value >= 45) {
    return "bg-amber-500";
  }
  return "bg-orange-500";
}

export default async function Home() {
  const { summary, campaigns, fields, upcomingTasks, degraded } =
    await loadDashboardData();

  return (
    <div className="app-shell px-4 py-5 md:px-8 md:py-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:gap-6">
        <section className="glass-card reveal rounded-3xl p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="metric-chip">
              <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[var(--brand)]" />
              Plataforma operativa en linea
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3a5248]">
              AgroSinergia Pampeana S.A.
            </div>
          </div>

          <div className="hero-grid mt-5">
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-3xl leading-tight md:text-5xl">
                Inteligencia de campo para decidir con velocidad y rentabilidad.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[#2f4b40] md:text-base">
                Consolidamos lotes, campanas y operaciones en un tablero unico.
                El equipo tecnico visualiza desvio de avance, prioriza tareas y
                evita perdida de rendimiento en tiempo real.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href="http://localhost:3002"
                  className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
                >
                  Abrir panel admin
                </a>
                <a
                  href="http://localhost:3011/health"
                  className="rounded-full border border-[#305546] bg-white/80 px-5 py-2.5 text-sm font-bold text-[#1f4437] transition hover:bg-white"
                >
                  Estado de API
                </a>
              </div>
            </div>

            <div className="glass-card delay-1 reveal rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#486659]">
                Rendimiento estimado activo
              </p>
              <div className="mt-3 text-4xl font-bold text-[#213d33]">
                {decimal.format(summary.expected_yield_tn)} tn
              </div>
              <p className="mt-2 text-sm text-[#385247]">
                Promedio de avance de campana: {decimal.format(summary.avg_progress)}%
              </p>
              <div className="mt-5 rounded-xl bg-[#ecf3ee] p-3 text-xs text-[#355649]">
                Ultima sincronizacion: {new Date(summary.generated_at).toLocaleString("es-AR")}
              </div>
            </div>
          </div>
        </section>

        {degraded ? (
          <section className="glass-card delay-1 reveal rounded-2xl border border-amber-300 p-4 text-sm text-amber-900">
            No se pudo conectar con la API en este momento. El dashboard esta
            mostrando datos vacios hasta recuperar conectividad.
          </section>
        ) : null}

        <section className="delay-1 reveal grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <article className="glass-card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.13em] text-[#537266]">
              Lotes gestionados
            </p>
            <p className="mt-2 text-3xl font-bold">{summary.total_fields}</p>
            <p className="mt-1 text-xs text-[#4f6b61]">base productiva</p>
          </article>
          <article className="glass-card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.13em] text-[#537266]">
              Hectareas activas
            </p>
            <p className="mt-2 text-3xl font-bold">
              {decimal.format(summary.managed_hectares)}
            </p>
            <p className="mt-1 text-xs text-[#4f6b61]">ha bajo monitoreo</p>
          </article>
          <article className="glass-card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.13em] text-[#537266]">
              Campanas en curso
            </p>
            <p className="mt-2 text-3xl font-bold">{summary.active_campaigns}</p>
            <p className="mt-1 text-xs text-[#4f6b61]">plan anual vigente</p>
          </article>
          <article className="glass-card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.13em] text-[#537266]">
              Tareas pendientes
            </p>
            <p className="mt-2 text-3xl font-bold">{summary.pending_tasks}</p>
            <p className="mt-1 text-xs text-[#4f6b61]">operaciones por resolver</p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <article className="glass-card delay-2 reveal rounded-2xl p-4 md:p-5">
            <h2 className="text-xl">Campanas priorizadas</h2>
            <p className="mt-1 text-sm text-[#3f5a4f]">
              Seguimiento de presupuesto y avance operativo.
            </p>
            <div className="mt-4 space-y-3">
              {campaigns.length === 0 ? (
                <p className="text-sm text-[#4c685d]">No hay campanas para mostrar.</p>
              ) : (
                campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-xl border border-[#d4e0d9] bg-white/85 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[#213f34]">
                        {campaign.field_name} · {campaign.season}
                      </p>
                      <span className="text-sm font-bold text-[#2d5647]">
                        {campaign.progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#d6e3db]">
                      <div
                        className={`h-full ${progressTone(campaign.progress)}`}
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#486256]">
                      <span>Estado: {campaign.status}</span>
                      <span>Presupuesto: {usd.format(campaign.budget_usd)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="glass-card delay-3 reveal rounded-2xl p-4 md:p-5">
            <h2 className="text-xl">Top lotes</h2>
            <p className="mt-1 text-sm text-[#3f5a4f]">
              Superficie, cultivo y humedad de suelo.
            </p>
            <div className="mt-4 space-y-2">
              {fields.length === 0 ? (
                <p className="text-sm text-[#4c685d]">No hay lotes disponibles.</p>
              ) : (
                fields.map((field) => (
                  <div
                    key={field.id}
                    className="rounded-xl border border-[#d4e0d9] bg-white/85 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[#213f34]">{field.name}</p>
                      <span className="rounded-full bg-[#ebf5ef] px-2 py-1 text-xs font-semibold text-[#315847]">
                        {decimal.format(field.hectares)} ha
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#486256]">
                      {field.zone} · {field.crop} · {field.status}
                    </p>
                    <p className="mt-2 text-xs text-[#486256]">
                      Humedad de suelo: {decimal.format(field.soil_moisture)}%
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="glass-card delay-3 reveal rounded-2xl p-4 md:p-5">
          <h2 className="text-xl">Agenda de tareas criticas</h2>
          <p className="mt-1 text-sm text-[#3f5a4f]">
            Ordenado por vencimiento para coordinar equipos en campo.
          </p>

          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.11em] text-[#547366]">
                  <th className="px-3 py-2">Tarea</th>
                  <th className="px-3 py-2">Responsable</th>
                  <th className="px-3 py-2">Lote</th>
                  <th className="px-3 py-2">Vence</th>
                  <th className="px-3 py-2">Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {upcomingTasks.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-[#567469]" colSpan={5}>
                      No hay tareas pendientes para mostrar.
                    </td>
                  </tr>
                ) : (
                  upcomingTasks.map((task) => (
                    <tr key={task.id} className="rounded-xl bg-white/85 text-[#213f34]">
                      <td className="rounded-l-xl px-3 py-3 font-medium">
                        {task.title}
                        <div className="mt-1 text-xs font-normal text-[#526e63]">
                          Campana {task.campaign_season}
                        </div>
                      </td>
                      <td className="px-3 py-3">{task.assigned_to}</td>
                      <td className="px-3 py-3">{task.field_name}</td>
                      <td className="px-3 py-3">
                        {new Date(task.due_date).toLocaleDateString("es-AR")}
                      </td>
                      <td className="rounded-r-xl px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            task.priority === "Alta"
                              ? "bg-red-100 text-red-800"
                              : task.priority === "Media"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
