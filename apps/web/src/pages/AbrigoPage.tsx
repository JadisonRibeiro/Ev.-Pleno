import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Search,
  Pencil,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { ABRIGO_TOTAL_LICOES, type AbrigoAluno } from '@/types/api';
import { cn } from '@/utils/cn';
import { AbrigoEditDialog } from '@/components/AbrigoEditDialog';

export default function AbrigoPage() {
  const user = useAuth((s) => s.user)!;
  const isAdmin = user.role === 'admin';
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'todos' | 'concluidos' | 'andamento' | 'parados'>('todos');
  const [editing, setEditing] = useState<AbrigoAluno | null>(null);

  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ['abrigo'],
    queryFn: async () => (await api.get<{ alunos: AbrigoAluno[] }>('/abrigo')).data.alunos,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AbrigoAluno> }) => {
      await api.patch(`/abrigo/${id}`, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['abrigo'] });
      setEditing(null);
    },
  });

  const stats = useMemo(() => {
    const total = alunos.length;
    const concluidos = alunos.filter((a) => a.concluido).length;
    const andamento = alunos.filter((a) => a.totalLicoes > 0 && !a.concluido).length;
    const parados = alunos.filter((a) => a.totalLicoes === 0).length;
    const mediaLicoes = total === 0 ? 0 : alunos.reduce((s, a) => s + a.totalLicoes, 0) / total;
    return { total, concluidos, andamento, parados, mediaLicoes };
  }, [alunos]);

  const distLicoes = useMemo(() => {
    const buckets = Array.from({ length: ABRIGO_TOTAL_LICOES + 1 }, (_, i) => ({
      label: `${i}`,
      total: 0,
    }));
    for (const a of alunos) {
      const i = Math.max(0, Math.min(ABRIGO_TOTAL_LICOES, Math.round(a.totalLicoes)));
      const bucket = buckets[i];
      if (bucket) bucket.total += 1;
    }
    return buckets;
  }, [alunos]);

  const byCell = useMemo(() => {
    const m = new Map<string, { total: number; concluidos: number }>();
    for (const a of alunos) {
      const k = a.celula || 'Sem célula';
      const cur = m.get(k) ?? { total: 0, concluidos: 0 };
      cur.total += 1;
      if (a.concluido) cur.concluidos += 1;
      m.set(k, cur);
    }
    return [...m.entries()]
      .map(([label, v]) => ({
        label,
        total: v.total,
        concluidos: v.concluidos,
        pct: v.total === 0 ? 0 : Math.round((v.concluidos / v.total) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [alunos]);

  const filtered = useMemo(() => {
    let list = alunos;
    if (filter === 'concluidos') list = list.filter((a) => a.concluido);
    else if (filter === 'andamento') list = list.filter((a) => a.totalLicoes > 0 && !a.concluido);
    else if (filter === 'parados') list = list.filter((a) => a.totalLicoes === 0);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) => a.nome.toLowerCase().includes(q) || a.celula.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.totalLicoes - a.totalLicoes);
  }, [alunos, query, filter]);

  const pct = (n: number) => (stats.total === 0 ? 0 : Math.round((n / stats.total) * 100));

  return (
    <section className="animate-fade-up space-y-6">
      <header>
        <p className="kicker">Escola de fé</p>
        <h1 className="page-title mt-1">Abrigo</h1>
        <p className="page-subtitle">
          {isAdmin
            ? `Programa de ${ABRIGO_TOTAL_LICOES} lições para conclusão.`
            : `Alunos da célula ${user.celula}. Programa de ${ABRIGO_TOTAL_LICOES} lições.`}
        </p>
      </header>

      {isLoading ? (
        <div className="card text-text-muted">Carregando alunos…</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPI icon={BookOpen} label="Total de alunos" value={stats.total} />
            <KPI
              icon={CheckCircle2}
              label="Concluíram (10/10)"
              value={stats.concluidos}
              hint={`${pct(stats.concluidos)}%`}
            />
            <KPI
              icon={Clock}
              label="Em andamento"
              value={stats.andamento}
              hint={`${pct(stats.andamento)}%`}
            />
            <KPI
              icon={AlertCircle}
              label="Não iniciaram"
              value={stats.parados}
              hint={`${pct(stats.parados)}%`}
            />
          </div>

          {/* Médias + gráfico de distribuição */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">
                  Distribuição por quantidade de lições feitas
                </h2>
                <p className="text-xs text-text-muted">
                  Quantos alunos estão em cada estágio (0 a {ABRIGO_TOTAL_LICOES})
                </p>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distLicoes} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-muted)' }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#f5f5f5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">Média de lições</h2>
                <p className="text-xs text-text-muted">Por aluno</p>
              </div>
              <div className="flex h-[calc(100%-56px)] flex-col items-center justify-center">
                <p className="text-5xl font-semibold tabular-nums text-text">
                  {stats.mediaLicoes.toFixed(1)}
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  de {ABRIGO_TOTAL_LICOES} possíveis
                </p>
              </div>
            </div>
          </div>

          {/* Ranking por célula (só admin) */}
          {isAdmin && byCell.length > 0 && (
            <div className="card">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-text">Top células (por alunos)</h2>
                <p className="text-xs text-text-muted">% mostra quantos já concluíram</p>
              </div>
              <div className="space-y-2">
                {byCell.map((c) => (
                  <div key={c.label} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-xs text-text-muted">{c.label}</span>
                    <div className="relative flex-1">
                      <div className="h-6 rounded-md bg-surface-2" />
                      <div
                        className="absolute inset-y-0 left-0 rounded-md bg-text/90"
                        style={{ width: `${Math.min(100, (c.total / Math.max(...byCell.map(x => x.total))) * 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                        <span className="font-medium text-black mix-blend-difference">
                          {c.total} aluno{c.total === 1 ? '' : 's'}
                        </span>
                        <span className="text-text-muted">{c.pct}% concluídos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtros + tabela de alunos */}
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="card flex flex-1 items-center gap-3 !py-2.5">
                <Search size={16} className="text-text-subtle" />
                <input
                  type="search"
                  className="w-full border-0 bg-transparent p-0 text-sm text-text outline-none placeholder:text-text-subtle focus:ring-0"
                  placeholder="Buscar por nome ou célula…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-1 rounded-md bg-surface-2 p-1">
                {([
                  { v: 'todos', l: 'Todos' },
                  { v: 'concluidos', l: 'Concluídos' },
                  { v: 'andamento', l: 'Em andamento' },
                  { v: 'parados', l: 'Não iniciaram' },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setFilter(opt.v)}
                    className={cn(
                      'rounded px-3 py-1.5 text-xs transition-colors',
                      filter === opt.v
                        ? 'bg-surface text-text'
                        : 'text-text-muted hover:text-text',
                    )}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs font-medium text-text-muted">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3">Aluno</th>
                      <th className="px-4 py-3">Célula</th>
                      <th className="px-4 py-3 text-right">Lições</th>
                      <th className="px-4 py-3">Progresso</th>
                      <th className="px-4 py-3">Status</th>
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
                          Nenhum aluno encontrado.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b border-border last:border-0 transition-colors hover:bg-surface-2"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-text">{a.nome}</p>
                            {a.aulasFeitas && (
                              <p className="truncate text-xs text-text-muted" title={a.aulasFeitas}>
                                Feitas: {a.aulasFeitas}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-muted">{a.celula || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="tabular-nums text-text">
                              {a.totalLicoes}
                            </span>
                            <span className="text-text-subtle"> / {ABRIGO_TOTAL_LICOES}</span>
                          </td>
                          <td className="px-4 py-3">
                            <ProgressBar value={a.totalLicoes} max={ABRIGO_TOTAL_LICOES} />
                          </td>
                          <td className="px-4 py-3">
                            {a.concluido ? (
                              <span className="badge badge-success">
                                <span className="badge-dot bg-current" /> Concluído
                              </span>
                            ) : a.totalLicoes === 0 ? (
                              <span className="badge badge-neutral">
                                <span className="badge-dot bg-current" /> Não iniciou
                              </span>
                            ) : (
                              <span className="badge badge-warning">
                                <span className="badge-dot bg-current" /> Em andamento
                              </span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setEditing(a)}
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
            <AbrigoEditDialog
              aluno={editing}
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

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="relative h-2 w-32 overflow-hidden rounded-full bg-surface-2">
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full transition-all',
          value >= max ? 'bg-text' : 'bg-text/60',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// unused (kept for clarity)
void GraduationCap;
