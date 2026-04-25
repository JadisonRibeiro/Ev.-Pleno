import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Droplets,
  GraduationCap,
  HeartHandshake,
  Home,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import type { Cell, Member } from '@/types/api';
import {
  ageBuckets,
  discipleshipStats,
  growthSeries,
  isActiveCell,
  topBairros,
} from '@/lib/analytics';
import { formatNumber, formatPct } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';

export default function DashboardPage() {
  const user = useAuth((s) => s.user)!;
  const isAdmin = user.role === 'admin';

  const membersQ = useQuery({
    queryKey: ['members'],
    queryFn: async () =>
      (await api.get<{ members: Member[] }>('/members')).data.members,
  });
  const cellsQ = useQuery({
    queryKey: ['cells'],
    queryFn: async () => (await api.get<{ cells: Cell[] }>('/cells')).data.cells,
  });

  const members = membersQ.data ?? [];
  const cells = cellsQ.data ?? [];

  const disc = useMemo(() => discipleshipStats(members), [members]);
  const ages = useMemo(() => ageBuckets(members), [members]);
  const growth = useMemo(() => growthSeries(members), [members]);
  const bairros = useMemo(() => topBairros(members, 6), [members]);
  const ativas = cells.filter(isActiveCell).length;

  const growthChange = useMemo(() => {
    if (growth.length < 2) return null;
    const last = growth[growth.length - 1]?.total ?? 0;
    const prev = growth[growth.length - 2]?.total ?? 0;
    if (prev === 0) return null;
    return ((last - prev) / prev) * 100;
  }, [growth]);

  const loading = membersQ.isLoading || cellsQ.isLoading;
  const pct = (n: number) => (disc.total === 0 ? 0 : (n / disc.total) * 100);

  return (
    <section className="animate-fade-up space-y-6">
      <PageHeader
        kicker="Análise"
        title="Painel"
        subtitle={
          isAdmin
            ? 'Visão geral da comunidade — indicadores e comparações essenciais.'
            : `Célula ${user.celula}`
        }
      />

      {loading ? (
        <div className="card text-text-muted">Carregando dados…</div>
      ) : (
        <>
          {/* KPIs principais */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={Users} label="Total de membros" value={disc.total} />
            <Kpi
              icon={Droplets}
              label="Batizados nas águas"
              value={disc.batismo}
              hint={formatPct(pct(disc.batismo))}
              tone="primary"
            />
            <Kpi
              icon={HeartHandshake}
              label="Encontro com Deus"
              value={disc.encontro}
              hint={formatPct(pct(disc.encontro))}
            />
            <Kpi
              icon={GraduationCap}
              label="Escola de Discípulos"
              value={disc.escola}
              hint={formatPct(pct(disc.escola))}
            />
          </div>

          {isAdmin && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi
                icon={Home}
                label="Células ativas"
                value={ativas}
                hint={`${formatNumber(cells.length)} no total`}
              />
              <Kpi
                icon={GraduationCap}
                label="Discipulado completo"
                value={disc.completo}
                hint={`${formatPct(pct(disc.completo))} dos membros`}
                tone="primary"
              />
              <Kpi
                icon={TrendingUp}
                label="Crescimento (mês)"
                value={(growth[growth.length - 1]?.total ?? 0)}
                hint={
                  growthChange === null
                    ? 'Acumulado no mês corrente'
                    : `${growthChange >= 0 ? '+' : ''}${growthChange.toFixed(1)}% vs. mês anterior`
                }
              />
              <Kpi
                icon={Users}
                label="Jovens (18-29)"
                value={ages.buckets.find((b) => b.label.startsWith('Jovens'))?.total ?? 0}
                hint="faixa etária principal"
              />
            </div>
          )}

          {/* Funil + porcentagem geral */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">
                  Funil de discipulado
                </h2>
                <p className="text-xs text-text-muted">
                  Progresso pelas etapas
                </p>
              </div>
              <Funnel total={disc.total} disc={disc} />
            </div>

            <div className="card flex flex-col justify-center">
              <div className="mb-2">
                <h2 className="text-sm font-semibold text-text">Completaram</h2>
                <p className="text-xs text-text-muted">
                  Batismo + Encontro + Escola
                </p>
              </div>
              <div className="flex items-end gap-2">
                <p
                  className="text-5xl font-semibold tabular-nums"
                  style={{ color: 'var(--primary)' }}
                >
                  {Math.round(pct(disc.completo))}%
                </p>
                <p className="mb-1.5 text-xs text-text-muted">
                  {formatNumber(disc.completo)} de {formatNumber(disc.total)}
                </p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct(disc.completo)}%`,
                    background: 'var(--primary)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Faixa etária + Crescimento */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">Faixa etária</h2>
                <p className="text-xs text-text-muted">
                  {ages.semData > 0
                    ? `${formatNumber(ages.semData)} membro(s) sem data de nascimento`
                    : 'Com base na data de nascimento'}
                </p>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ages.buckets}
                    margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
                  >
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
                      cursor={{ fill: 'rgba(127,29,43,0.04)' }}
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: 'var(--text-muted)' }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="var(--primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">
                  Crescimento acumulado
                </h2>
                <p className="text-xs text-text-muted">Últimos 12 meses</p>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={growth}
                    margin={{ top: 8, right: 12, bottom: 0, left: -18 }}
                  >
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="mes"
                      stroke="var(--text-subtle)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--text-subtle)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: 'var(--text-muted)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#areaFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top bairros */}
          {bairros.length > 0 && (
            <div className="card">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">
                  Distribuição por bairro
                </h2>
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
                    <XAxis
                      type="number"
                      stroke="var(--text-subtle)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="bairro"
                      stroke="var(--text-subtle)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(127,29,43,0.04)' }}
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: 'var(--text-muted)' }}
                    />
                    <Bar
                      dataKey="total"
                      radius={[0, 6, 6, 0]}
                      fill="var(--accent)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text)',
  boxShadow: 'var(--shadow-md)',
};

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint?: string;
  tone?: 'neutral' | 'primary';
}) {
  const tint =
    tone === 'primary'
      ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
      : { background: 'var(--surface-2)', color: 'var(--text-muted)' };
  return (
    <div className="card card-hover">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={tint}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-muted">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-text">
            {formatNumber(value)}
          </p>
          {hint && <p className="mt-0.5 text-xs text-text-subtle">{hint}</p>}
        </div>
      </div>
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
    { label: 'Total de membros', value: total, tone: 'neutral' as const },
    { label: 'Batismo nas águas', value: disc.batismo, tone: 'primary' as const },
    { label: 'Encontro com Deus', value: disc.encontro, tone: 'primary' as const },
    { label: 'Escola de Discípulos', value: disc.escola, tone: 'primary' as const },
  ];
  const max = steps[0]?.value ?? 0;

  return (
    <ul className="space-y-2.5">
      {steps.map((s) => {
        const p = max === 0 ? 0 : Math.round((s.value / max) * 100);
        return (
          <li key={s.label} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-xs text-text-muted">{s.label}</span>
            <div className="relative flex-1">
              <div className="h-8 rounded-lg bg-surface-2" />
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all"
                style={{
                  width: `${p}%`,
                  background:
                    s.tone === 'primary' ? 'var(--primary)' : 'var(--text-muted)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                <span className="font-semibold text-white mix-blend-difference">
                  {formatNumber(s.value)}
                </span>
                <span className="text-text-muted">{p}%</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
