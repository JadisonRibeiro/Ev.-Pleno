import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell as RCell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Users,
  Droplets,
  HeartHandshake,
  GraduationCap,
  Home,
  CheckCircle2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import type { Cell, Member } from '@/types/api';
import {
  ageBuckets,
  cellsByStatus,
  discipleshipStats,
  growthSeries,
  isActiveCell,
  pendentes,
  topBairros,
  YES,
} from '@/lib/analytics';

const COLORS = ['#f5f5f5', '#c4c4c4', '#929292', '#6b6b6b', '#4a4a4a', '#2d2d2d'];

export default function DashboardPage() {
  const user = useAuth((s) => s.user)!;
  const isAdmin = user.role === 'admin';

  const membersQ = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get<{ members: Member[] }>('/members')).data.members,
  });
  const cellsQ = useQuery({
    queryKey: ['cells'],
    queryFn: async () => (await api.get<{ cells: Cell[] }>('/cells')).data.cells,
  });

  const members = membersQ.data ?? [];
  const cells = cellsQ.data ?? [];

  const disc = useMemo(() => discipleshipStats(members), [members]);
  const pend = useMemo(() => pendentes(members), [members]);
  const ages = useMemo(() => ageBuckets(members), [members]);
  const growth = useMemo(() => growthSeries(members), [members]);
  const bairros = useMemo(() => topBairros(members, 6), [members]);
  const cellStatus = useMemo(() => cellsByStatus(cells), [cells]);

  const ativas = cells.filter(isActiveCell).length;
  const inativas = cells.length - ativas;

  const pct = (n: number) => (disc.total === 0 ? 0 : Math.round((n / disc.total) * 100));

  const loading = membersQ.isLoading || cellsQ.isLoading;

  return (
    <section className="animate-fade-up space-y-6">
      <header>
        <p className="kicker">Painel</p>
        <h1 className="page-title mt-1">Olá, {user.nome.split(' ')[0]}</h1>
        <p className="page-subtitle">
          {isAdmin
            ? 'Visão geral da comunidade.'
            : `Célula · ${user.celula} · ${disc.total} membro${disc.total === 1 ? '' : 's'}`}
        </p>
      </header>

      {loading ? (
        <div className="card text-text-muted">Carregando dados…</div>
      ) : (
        <>
          {/* KPIs principais */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPI icon={Users} label="Total de membros" value={disc.total} />
            <KPI
              icon={Droplets}
              label="Batizados nas águas"
              value={disc.batismo}
              hint={`${pct(disc.batismo)}% dos membros`}
            />
            <KPI
              icon={HeartHandshake}
              label="Encontro com Deus"
              value={disc.encontro}
              hint={`${pct(disc.encontro)}% dos membros`}
            />
            <KPI
              icon={GraduationCap}
              label="Escola de Discípulos"
              value={disc.escola}
              hint={`${pct(disc.escola)}% dos membros`}
            />
          </div>

          {/* Funil de discipulado */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">Funil de discipulado</h2>
                <p className="text-xs text-text-muted">
                  Progresso dos membros pelas etapas do discipulado
                </p>
              </div>
              <Funnel total={disc.total} disc={disc} />
            </div>

            <div className="card">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">Discipulado completo</h2>
                <p className="text-xs text-text-muted">Fez batismo + encontro + escola</p>
              </div>
              <div className="flex h-[calc(100%-56px)] flex-col items-center justify-center">
                <p className="text-5xl font-semibold tabular-nums text-text">
                  {pct(disc.completo)}%
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  {disc.completo} de {disc.total} membros
                </p>
              </div>
            </div>
          </div>

          {/* Quem falta */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-text">Quem falta</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <PendentesCard
                label="Falta batismo"
                list={pend.semBatismo}
                total={disc.total}
                icon={Droplets}
              />
              <PendentesCard
                label="Falta Encontro com Deus"
                list={pend.semEncontro}
                total={disc.total}
                icon={HeartHandshake}
              />
              <PendentesCard
                label="Falta Escola de Discípulos"
                list={pend.semEscola}
                total={disc.total}
                icon={GraduationCap}
              />
            </div>
          </div>

          {/* Faixa etária + crescimento */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">Faixa etária</h2>
                <p className="text-xs text-text-muted">
                  {ages.semData > 0
                    ? `${ages.semData} membro(s) sem data de nascimento registrada`
                    : 'Baseado em data de nascimento dos membros'}
                </p>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ages.buckets} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="var(--text-subtle)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tickFormatter={(v) => v.split(' ')[0]}
                    />
                    <YAxis
                      stroke="var(--text-subtle)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={chartTooltipStyle}
                      labelStyle={{ color: 'var(--text-muted)' }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#f5f5f5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">Crescimento acumulado</h2>
                <p className="text-xs text-text-muted">Últimos 12 meses</p>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={growth}
                    margin={{ top: 8, right: 12, bottom: 0, left: -18 }}
                  >
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f5f5f5" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#f5f5f5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="mes" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--text-muted)' }} />
                    <Area type="monotone" dataKey="total" stroke="#f5f5f5" strokeWidth={1.75} fill="url(#areaFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top bairros */}
          {bairros.length > 0 && (
            <div className="card">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">Distribuição por bairro</h2>
                <p className="text-xs text-text-muted">Top {bairros.length}</p>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bairros}
                    layout="vertical"
                    margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="bairro" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} width={120} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--text-muted)' }} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="#c4c4c4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Admin: Células por status */}
          {isAdmin && cells.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="card lg:col-span-2">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-text">Células por status</h2>
                  <p className="text-xs text-text-muted">
                    {ativas} ativa(s) · {inativas} inativa(s) · {cells.length} total
                  </p>
                </div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cellStatus} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                      <CartesianGrid stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="status" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--text-muted)' }} />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {cellStatus.map((_, i) => (
                          <RCell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-text">Proporção</h2>
                  <p className="text-xs text-text-muted">Ativas vs demais</p>
                </div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cellStatus}
                        dataKey="total"
                        nameKey="status"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        stroke="var(--bg)"
                      >
                        {cellStatus.map((_, i) => (
                          <RCell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-1 text-xs">
                  {cellStatus.map((s, i) => (
                    <li key={s.status} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-sm"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-text-muted">{s.status}</span>
                      <span className="ml-auto tabular-nums text-text">{s.total}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Admin: top células por tamanho */}
          {isAdmin && cells.length > 0 && (
            <TopCells members={members} cells={cells} />
          )}
        </>
      )}
    </section>
  );
}

// ---------------- Subcomponentes ----------------

const chartTooltipStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text)',
};

function KPI({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="card card-hover">
      <div className="mb-3 flex items-center gap-2 text-text-muted">
        <Icon size={15} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-3xl font-semibold tabular-nums text-text">{value}</p>
      {hint && <p className="mt-1 text-xs text-text-subtle">{hint}</p>}
    </div>
  );
}

function Funnel({
  total,
  disc,
}: {
  total: number;
  disc: { batismo: number; encontro: number; escola: number };
}) {
  const steps = [
    { label: 'Total de membros', value: total },
    { label: 'Batismo nas águas', value: disc.batismo },
    { label: 'Encontro com Deus', value: disc.encontro },
    { label: 'Escola de Discípulos', value: disc.escola },
  ];
  const max = steps[0]?.value ?? 0;

  return (
    <ul className="space-y-2">
      {steps.map((s, i) => {
        const pct = max === 0 ? 0 : Math.round((s.value / max) * 100);
        return (
          <li key={s.label} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-xs text-text-muted">{s.label}</span>
            <div className="relative flex-1">
              <div className="h-7 rounded-md bg-surface-2" />
              <div
                className="absolute inset-y-0 left-0 rounded-md transition-all"
                style={{
                  width: `${pct}%`,
                  background: COLORS[i] ?? COLORS[0],
                }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                <span className="font-medium text-black mix-blend-difference">
                  {s.value}
                </span>
                <span className="text-text-muted">{pct}%</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PendentesCard({
  label,
  list,
  total,
  icon: Icon,
}: {
  label: string;
  list: Member[];
  total: number;
  icon: LucideIcon;
}) {
  const pct = total === 0 ? 0 : Math.round((list.length / total) * 100);
  const preview = list.slice(0, 3);

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-muted">
          <Icon size={15} />
          <span className="text-xs">{label}</span>
        </div>
        {list.length > 0 ? (
          <AlertCircle size={14} className="text-warning" />
        ) : (
          <CheckCircle2 size={14} className="text-text" />
        )}
      </div>
      <p className="text-3xl font-semibold tabular-nums text-text">{list.length}</p>
      <p className="mt-1 text-xs text-text-subtle">{pct}% dos membros</p>
      {preview.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-3">
          {preview.map((m) => (
            <li key={m.id} className="truncate text-xs text-text-muted">
              {m.nome}
            </li>
          ))}
          {list.length > preview.length && (
            <li className="text-xs text-text-subtle">
              + {list.length - preview.length} pessoa(s)
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function TopCells({ members, cells }: { members: Member[]; cells: Cell[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, Member[]>();
    for (const m of members) {
      const k = m.celula.trim();
      if (!k) continue;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    return [...map.entries()]
      .map(([nome, ms]) => {
        const cell = cells.find((c) => c.nome.trim().toLowerCase() === nome.toLowerCase());
        const total = ms.length;
        const done = ms.filter(
          (m) => YES(m.batismo) && YES(m.encontroDeus) && YES(m.escolaDiscipulos),
        ).length;
        const pctCompleto = total === 0 ? 0 : Math.round((done / total) * 100);
        return {
          nome,
          lider: cell?.lider ?? '—',
          status: cell?.status ?? '—',
          ativa: cell ? isActiveCell(cell) : false,
          total,
          pctCompleto,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [members, cells]);

  if (rows.length === 0) return null;

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Home size={15} className="text-text-muted" />
        <h2 className="text-sm font-semibold text-text">Top 10 células por membros</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-medium text-text-muted">
            <tr className="border-b border-border">
              <th className="px-4 py-2">Célula</th>
              <th className="px-4 py-2">Líder</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Membros</th>
              <th className="px-4 py-2 text-right">Discipulado completo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.nome} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="px-4 py-2 font-medium text-text">{r.nome}</td>
                <td className="px-4 py-2 text-text-muted">{r.lider}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${r.ativa ? 'badge-success' : 'badge-neutral'}`}>
                    <span className="badge-dot bg-current" /> {r.status || '—'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-text">{r.total}</td>
                <td className="px-4 py-2 text-right tabular-nums text-text-muted">
                  {r.pctCompleto}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
