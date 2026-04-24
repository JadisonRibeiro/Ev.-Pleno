import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
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
  Heart,
  Users,
  HandHeart,
  Search,
  Pencil,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import type { AmorDecision } from '@/types/api';
import { cn } from '@/utils/cn';
import { AmorEditDialog } from '@/components/AmorEditDialog';

const COLORS = ['#f5f5f5', '#c4c4c4', '#929292', '#6b6b6b', '#4a4a4a', '#2d2d2d'];

export default function AmorPage() {
  const user = useAuth((s) => s.user)!;
  const isAdmin = user.role === 'admin';
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AmorDecision | null>(null);

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ['amor'],
    queryFn: async () =>
      (await api.get<{ decisions: AmorDecision[] }>('/amor')).data.decisions,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AmorDecision> }) => {
      await api.patch(`/amor/${id}`, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amor'] });
      setEditing(null);
    },
  });

  const stats = useMemo(() => {
    const total = decisions.length;
    const aceitou = decisions.filter((d) =>
      d.decisao.toLowerCase().includes('aceit'),
    ).length;
    const reconciliou = decisions.filter((d) =>
      d.decisao.toLowerCase().includes('reconcilia'),
    ).length;
    const jaEmCelula = decisions.filter((d) =>
      d.jaEmCelula.toLowerCase().startsWith('sim'),
    ).length;
    return { total, aceitou, reconciliou, jaEmCelula };
  }, [decisions]);

  const byDecisao = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of decisions) {
      const k = d.decisao.trim() || 'Sem decisão';
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([name, total]) => ({ name, total }));
  }, [decisions]);

  const byMonth = useMemo(() => monthlyTimeline(decisions), [decisions]);
  const byBairro = useMemo(() => topValues(decisions.map((d) => d.bairro), 8), [decisions]);
  const byIdade = useMemo(() => ageBuckets(decisions), [decisions]);
  const topConvidadores = useMemo(
    () => topValues(decisions.map((d) => firstWord(d.convidadoPor)), 6),
    [decisions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return decisions;
    return decisions.filter(
      (d) =>
        d.nome.toLowerCase().includes(q) ||
        d.telefone.includes(q) ||
        d.bairro.toLowerCase().includes(q) ||
        d.opcaoCelula.toLowerCase().includes(q),
    );
  }, [decisions, query]);

  const pct = (n: number) => (stats.total === 0 ? 0 : Math.round((n / stats.total) * 100));

  return (
    <section className="animate-fade-up space-y-6">
      <header>
        <p className="kicker">Vidas alcançadas</p>
        <h1 className="page-title mt-1">Amor</h1>
        <p className="page-subtitle">
          {isAdmin
            ? 'Decisões registradas na igreja.'
            : `Pessoas que optaram pela célula ${user.celula} — follow-up pastoral.`}
        </p>
      </header>

      {isLoading ? (
        <div className="card text-text-muted">Carregando dados…</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPI icon={Heart} label="Total de decisões" value={stats.total} />
            <KPI icon={HandHeart} label="Aceitaram Jesus" value={stats.aceitou} hint={`${pct(stats.aceitou)}%`} />
            <KPI icon={Users} label="Reconciliações" value={stats.reconciliou} hint={`${pct(stats.reconciliou)}%`} />
            <KPI icon={Users} label="Já em célula" value={stats.jaEmCelula} hint={`${pct(stats.jaEmCelula)}%`} />
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Decisões por tipo" subtitle={`${byDecisao.length} categoria(s)`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byDecisao}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="var(--bg)"
                  >
                    {byDecisao.map((_, i) => (
                      <RCell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <LegendList items={byDecisao.map((d, i) => ({ label: d.name, value: d.total, color: COLORS[i % COLORS.length] ?? '#f5f5f5' }))} />
            </ChartCard>

            <ChartCard title="Decisões por mês" subtitle="Últimos 12 meses">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-muted)' }} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#f5f5f5" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Faixa etária" subtitle="Baseada na coluna IDADE">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byIdade} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-subtle)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-subtle)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-muted)' }} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#c4c4c4" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top bairros" subtitle={`${byBairro.length} bairros com decisões`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byBairro} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} width={120} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-muted)' }} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="#f5f5f5" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {topConvidadores.length > 0 && (
            <ChartCard title="Quem mais convidou" subtitle="Baseado na coluna 'Foi convidado por alguém?'">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topConvidadores} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} width={140} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-muted)' }} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="#c4c4c4" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Tabela */}
          <div>
            <div className="card mb-4 flex items-center gap-3 !py-2.5">
              <Search size={16} className="text-text-subtle" />
              <input
                type="search"
                className="w-full border-0 bg-transparent p-0 text-sm text-text outline-none placeholder:text-text-subtle focus:ring-0"
                placeholder="Buscar por nome, telefone, bairro ou célula…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs font-medium text-text-muted">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Decisão</th>
                      <th className="px-4 py-3">Bairro</th>
                      <th className="px-4 py-3">Opção de célula</th>
                      <th className="px-4 py-3">Em célula?</th>
                      {isAdmin && <th className="px-4 py-3 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isAdmin ? 6 : 5}
                          className="px-4 py-10 text-center text-text-muted"
                        >
                          Nenhuma decisão encontrada.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((d) => (
                        <tr
                          key={d.id}
                          className="border-b border-border last:border-0 transition-colors hover:bg-surface-2"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-text">{d.nome}</p>
                            {(d.telefone || d.dataCadastro) && (
                              <p className="text-xs text-text-muted">
                                {[d.telefone, d.dataCadastro].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-muted">
                            {d.decisao || '—'}
                            {d.decidiuNo && (
                              <p className="text-xs text-text-subtle">em {d.decidiuNo}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-muted">{d.bairro || '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{d.opcaoCelula || '—'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'badge',
                                d.jaEmCelula.toLowerCase().startsWith('sim')
                                  ? 'badge-success'
                                  : 'badge-neutral',
                              )}
                            >
                              <span className="badge-dot bg-current" />
                              {d.jaEmCelula || '—'}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setEditing(d)}
                                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                              >
                                <Pencil size={14} /> Editar
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {isAdmin && (
            <AmorEditDialog
              decision={editing}
              onOpenChange={(open) => !open && setEditing(null)}
              onSubmit={(patch) => editing && update.mutate({ id: editing.id, patch })}
              submitting={update.isPending}
            />
          )}
        </>
      )}
    </section>
  );
}

// ---------- Subcomponentes ----------

const tooltipStyle: React.CSSProperties = {
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

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-text">{title}</h2>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      </div>
      <div className="h-[240px]">{children}</div>
    </div>
  );
}

function LegendList({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  return (
    <ul className="mt-2 space-y-1 text-xs">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm" style={{ background: i.color }} />
          <span className="truncate text-text-muted">{i.label}</span>
          <span className="ml-auto tabular-nums text-text">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------- Helpers ----------

function monthlyTimeline(items: AmorDecision[]): Array<{ mes: string; total: number }> {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const now = new Date();
  const series = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), mes: meses[d.getMonth()] ?? '', total: 0 };
  });
  for (const it of items) {
    const d = parseBRDate(it.dataCadastro);
    if (!d) continue;
    const s = series.find((x) => x.year === d.getFullYear() && x.month === d.getMonth());
    if (s) s.total += 1;
  }
  return series.map(({ mes, total }) => ({ mes, total }));
}

function parseBRDate(raw: string): Date | null {
  if (!raw) return null;
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) {
    const d = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const iso = new Date(raw);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

function topValues(
  arr: string[],
  limit: number,
): Array<{ label: string; total: number }> {
  const m = new Map<string, number>();
  for (const v of arr) {
    const s = (v ?? '').trim();
    if (!s) continue;
    m.set(s, (m.get(s) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function firstWord(s: string): string {
  return (s ?? '').trim().split(/\s+/).slice(0, 2).join(' ');
}

function ageBuckets(items: AmorDecision[]): Array<{ label: string; total: number }> {
  const buckets = [
    { label: '< 18', min: 0, max: 17, total: 0 },
    { label: '18-24', min: 18, max: 24, total: 0 },
    { label: '25-34', min: 25, max: 34, total: 0 },
    { label: '35-49', min: 35, max: 49, total: 0 },
    { label: '50-64', min: 50, max: 64, total: 0 },
    { label: '65+', min: 65, max: 130, total: 0 },
  ];
  for (const it of items) {
    const idade = Number(it.idade);
    if (!Number.isFinite(idade)) continue;
    const b = buckets.find((x) => idade >= x.min && idade <= x.max);
    if (b) b.total += 1;
  }
  return buckets.map(({ label, total }) => ({ label, total }));
}
