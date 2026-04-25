import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Clock3,
  GraduationCap,
  Hourglass,
  Pencil,
  Search,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import {
  ABRIGO_TOTAL_LICOES,
  type AbrigoAluno,
  type AbrigoAula,
} from '@/types/api';
import { cn } from '@/utils/cn';
import { useDebounced } from '@/hooks/useDebounced';
import { apiError } from '@/lib/error';
import { formatNumber, formatPct } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  FilterBar,
  FilterSelect,
  SearchInput,
  SegmentedControl,
} from '@/components/ui/FilterBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs';
import { Empty } from '@/components/ui/Empty';
import { toast } from '@/components/ui/Toaster';
import { AbrigoEditDialog } from '@/components/AbrigoEditDialog';

type StatusFilter = 'todos' | 'concluidos' | 'andamento' | 'parados';

export default function AbrigoPage() {
  const user = useAuth((s) => s.user)!;
  const isAdmin = user.role === 'admin';
  const qc = useQueryClient();

  const [tab, setTab] = useState<
    'alunos' | 'aulas' | 'formandos' | 'formacao'
  >('alunos');

  const alunosQ = useQuery({
    queryKey: ['abrigo'],
    queryFn: async () =>
      (await api.get<{ alunos: AbrigoAluno[] }>('/abrigo')).data.alunos,
  });
  const aulasQ = useQuery({
    queryKey: ['abrigo-aulas'],
    queryFn: async () =>
      (await api.get<{ aulas: AbrigoAula[] }>('/abrigo/aulas')).data.aulas,
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<AbrigoAluno>;
    }) => {
      await api.patch(`/abrigo/${id}`, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['abrigo'] });
      toast.success('Progresso atualizado');
    },
    onError: (err) => toast.error('Erro ao salvar', apiError(err)),
  });

  const alunos = alunosQ.data ?? [];
  const aulas = aulasQ.data ?? [];

  const stats = useMemo(() => {
    const total = alunos.length;
    const concluidos = alunos.filter((a) => a.concluido).length;
    const emFormacao = alunos.filter((a) => a.totalLicoes === 9).length;
    const andamento = alunos.filter(
      (a) => a.totalLicoes > 0 && !a.concluido,
    ).length;
    const parados = alunos.filter((a) => a.totalLicoes === 0).length;
    return { total, concluidos, emFormacao, andamento, parados };
  }, [alunos]);

  return (
    <section className="animate-fade-up">
      <PageHeader
        kicker="Escola de fé"
        title="Abrigo"
        subtitle={
          isAdmin
            ? `Programa de ${ABRIGO_TOTAL_LICOES} lições · ${formatNumber(stats.total)} alunos`
            : `Alunos da célula ${user.celula}`
        }
      />

      {/* KPIs no topo */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Users}
          label="Alunos no programa"
          value={stats.total}
          hint={`${aulas.length} aulas no total`}
        />
        <Kpi
          icon={GraduationCap}
          label="Formandos"
          value={stats.concluidos}
          hint={`${formatPct(pct(stats.concluidos, stats.total))} dos alunos`}
          tone="success"
        />
        <Kpi
          icon={Hourglass}
          label="Em formação"
          value={stats.emFormacao}
          hint="Falta apenas 1 aula"
          tone="primary"
        />
        <Kpi
          icon={Clock3}
          label="Em andamento"
          value={stats.andamento}
          hint={`${formatPct(pct(stats.andamento, stats.total))} dos alunos`}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabList className="mb-5">
          <Tab value="alunos">
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} /> Alunos
            </span>
          </Tab>
          <Tab value="aulas">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={14} /> Aulas
            </span>
          </Tab>
          <Tab value="formacao">
            <span className="inline-flex items-center gap-1.5">
              <Hourglass size={14} /> Em formação
            </span>
          </Tab>
          <Tab value="formandos">
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap size={14} /> Formandos
            </span>
          </Tab>
        </TabList>

        <TabPanel value="alunos">
          <AlunosPanel
            alunos={alunos}
            isLoading={alunosQ.isLoading}
            isAdmin={isAdmin}
            onEdit={(a, patch) => update.mutate({ id: a.id, patch })}
            saving={update.isPending}
          />
        </TabPanel>
        <TabPanel value="aulas">
          <AulasPanel aulas={aulas} isLoading={aulasQ.isLoading} />
        </TabPanel>
        <TabPanel value="formacao">
          <EmFormacaoPanel
            alunos={alunos}
            aulas={aulas}
            isLoading={alunosQ.isLoading}
          />
        </TabPanel>
        <TabPanel value="formandos">
          <FormandosPanel alunos={alunos} isLoading={alunosQ.isLoading} />
        </TabPanel>
      </Tabs>
    </section>
  );
}

// ============== ALUNOS ==============

function AlunosPanel({
  alunos,
  isLoading,
  isAdmin,
  onEdit,
  saving,
}: {
  alunos: AbrigoAluno[];
  isLoading: boolean;
  isAdmin: boolean;
  onEdit: (a: AbrigoAluno, patch: Partial<AbrigoAluno>) => void;
  saving: boolean;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todos');
  const [celula, setCelula] = useState('');
  const [editing, setEditing] = useState<AbrigoAluno | null>(null);
  const debounced = useDebounced(query, 200);

  const celulaOptions = useMemo(
    () => uniqueOptions(alunos.map((a) => a.celula)),
    [alunos],
  );

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return alunos.filter((a) => {
      if (q && !a.nome.toLowerCase().includes(q) && !a.celula.toLowerCase().includes(q))
        return false;
      if (celula && a.celula !== celula) return false;
      if (status === 'concluidos' && !a.concluido) return false;
      if (status === 'andamento' && (a.concluido || a.totalLicoes === 0)) return false;
      if (status === 'parados' && a.totalLicoes > 0) return false;
      return true;
    });
  }, [alunos, debounced, status, celula]);

  const columns: Column<AbrigoAluno>[] = [
    {
      key: 'nome',
      header: 'Aluno',
      sortValue: (a) => a.nome.toLowerCase(),
      cell: (a) => (
        <div className="min-w-[180px]">
          <p className="font-medium text-text">{a.nome}</p>
          {a.aulasFeitas && (
            <p
              className="truncate text-xs text-text-muted"
              title={a.aulasFeitas}
            >
              Feitas: {a.aulasFeitas}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'celula',
      header: 'Célula',
      sortValue: (a) => a.celula.toLowerCase(),
      cell: (a) => <span className="text-text-muted">{a.celula || '—'}</span>,
      hideOn: 'sm',
    },
    {
      key: 'licoes',
      header: 'Lições',
      align: 'right',
      sortValue: (a) => a.totalLicoes,
      cell: (a) => (
        <span className="whitespace-nowrap tabular-nums">
          <span className="font-semibold text-text">{a.totalLicoes}</span>
          <span className="text-text-subtle"> / {ABRIGO_TOTAL_LICOES}</span>
        </span>
      ),
      width: '110px',
    },
    {
      key: 'progress',
      header: 'Progresso',
      sortValue: (a) => a.totalLicoes,
      cell: (a) => <ProgressBar value={a.totalLicoes} max={ABRIGO_TOTAL_LICOES} />,
      width: '180px',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (a) => (
        <span
          className={cn(
            'badge whitespace-nowrap',
            a.concluido
              ? 'badge-success'
              : a.totalLicoes === 0
                ? 'badge-neutral'
                : a.totalLicoes === 9
                  ? 'badge-primary'
                  : 'badge-warning',
          )}
        >
          <span className="badge-dot bg-current" />
          {a.concluido
            ? 'Concluído'
            : a.totalLicoes === 0
              ? 'Não iniciou'
              : a.totalLicoes === 9
                ? 'Em formação'
                : 'Em andamento'}
        </span>
      ),
      width: '150px',
    },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nome ou célula…"
        />
        <SegmentedControl
          value={status}
          onChange={setStatus}
          options={[
            { label: 'Todos', value: 'todos' },
            { label: 'Concluídos', value: 'concluidos' },
            { label: 'Andamento', value: 'andamento' },
            { label: 'Parados', value: 'parados' },
          ]}
        />
        {celulaOptions.length > 0 && (
          <FilterSelect
            label="Célula"
            value={celula}
            onChange={setCelula}
            options={[{ label: 'Todas', value: '' }, ...celulaOptions]}
          />
        )}
      </FilterBar>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        emptyTitle="Nenhum aluno encontrado"
        emptyDescription={
          query || celula || status !== 'todos'
            ? 'Tente ajustar os filtros.'
            : 'A planilha Abrigo_Total ainda não tem alunos.'
        }
        onRowClick={isAdmin ? (a) => setEditing(a) : undefined}
        actions={
          isAdmin
            ? (a) => (
                <IconButton label="Editar" onClick={() => setEditing(a)}>
                  <Pencil size={14} />
                </IconButton>
              )
            : undefined
        }
      />

      {isAdmin && (
        <AbrigoEditDialog
          aluno={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSubmit={(patch) => {
            if (!editing) return;
            onEdit(editing, patch);
            setEditing(null);
          }}
          submitting={saving}
        />
      )}
    </>
  );
}

// ============== AULAS ==============

function AulasPanel({
  aulas,
  isLoading,
}: {
  aulas: AbrigoAula[];
  isLoading: boolean;
}) {
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query, 150);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return aulas;
    return aulas.filter(
      (a) =>
        a.titulo.toLowerCase().includes(q) || a.numero.toLowerCase().includes(q),
    );
  }, [aulas, debounced]);

  if (!isLoading && aulas.length === 0) {
    return (
      <div className="card">
        <Empty
          icon={BookOpen}
          title="Nenhuma aula cadastrada"
          description="A aba 'DADOS ' (com espaço) da planilha de Abrigo está vazia ou não foi encontrada."
        />
      </div>
    );
  }

  return (
    <>
      <FilterBar>
        <div className="flex min-w-[180px] flex-1 items-center gap-2">
          <Search size={15} className="text-text-subtle" />
          <input
            type="search"
            className="w-full border-0 bg-transparent p-0 text-sm text-text outline-none placeholder:text-text-subtle focus:ring-0"
            placeholder="Buscar aula por número ou título…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </FilterBar>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="card text-text-muted sm:col-span-2 lg:col-span-3">
            Carregando aulas…
          </div>
        ) : (
          filtered.map((a) => (
            <div
              key={`${a.numero}-${a.titulo}`}
              className="card card-hover flex items-start gap-3"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
              >
                {a.numero || '–'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-text">{a.titulo}</p>
                <p className="mt-0.5 text-xs text-text-subtle">
                  Lição do programa Abrigo
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ============== EM FORMAÇÃO (9 de 10 lições) ==============

function EmFormacaoPanel({
  alunos,
  aulas,
  isLoading,
}: {
  alunos: AbrigoAluno[];
  aulas: AbrigoAula[];
  isLoading: boolean;
}) {
  const emFormacao = useMemo(
    () => alunos.filter((a) => a.totalLicoes === 9 && !a.concluido),
    [alunos],
  );

  const [query, setQuery] = useState('');
  const [aulaFaltando, setAulaFaltando] = useState('');
  const [mes, setMes] = useState('');
  const debounced = useDebounced(query, 200);

  const aulaOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of emFormacao) {
      const num = extractFirstNumber(a.aulasFaltando);
      if (num) set.add(num);
    }
    return [...set].sort((a, b) => Number(a) - Number(b)).map((num) => {
      const aula = aulas.find((x) => x.numero === num);
      return {
        label: aula ? `${num} · ${aula.titulo}` : `Aula ${num}`,
        value: num,
      };
    });
  }, [emFormacao, aulas]);

  const mesOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of emFormacao) {
      const k = monthKey(a.dataCadastro);
      if (k) set.add(k);
    }
    return [...set]
      .sort()
      .reverse()
      .map((k) => ({ label: monthLabel(k), value: k }));
  }, [emFormacao]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return emFormacao.filter((a) => {
      if (q && !a.nome.toLowerCase().includes(q) && !a.celula.toLowerCase().includes(q))
        return false;
      if (aulaFaltando) {
        const n = extractFirstNumber(a.aulasFaltando);
        if (n !== aulaFaltando) return false;
      }
      if (mes) {
        if (monthKey(a.dataCadastro) !== mes) return false;
      }
      return true;
    });
  }, [emFormacao, debounced, aulaFaltando, mes]);

  const columns: Column<AbrigoAluno>[] = [
    {
      key: 'nome',
      header: 'Aluno',
      sortValue: (a) => a.nome.toLowerCase(),
      cell: (a) => (
        <div>
          <p className="font-medium text-text">{a.nome}</p>
          <p className="text-xs text-text-muted">{a.celula || '—'}</p>
        </div>
      ),
    },
    {
      key: 'falta',
      header: 'Aula que falta',
      cell: (a) => {
        const num = extractFirstNumber(a.aulasFaltando);
        const aula = num ? aulas.find((x) => x.numero === num) : null;
        return (
          <div className="min-w-[160px]">
            {num ? (
              <>
                <p className="font-medium text-text">Aula {num}</p>
                {aula && (
                  <p className="truncate text-xs text-text-muted" title={aula.titulo}>
                    {aula.titulo}
                  </p>
                )}
              </>
            ) : (
              <span className="text-text-muted">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'progresso',
      header: 'Progresso',
      cell: () => <ProgressBar value={9} max={ABRIGO_TOTAL_LICOES} />,
      width: '180px',
    },
    {
      key: 'cadastro',
      header: 'Cadastro',
      sortValue: (a) => a.dataCadastro || '',
      cell: (a) => (
        <span className="text-xs text-text-subtle">
          {a.dataCadastro || '—'}
        </span>
      ),
      hideOn: 'md',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-text-muted">Quase formandos</p>
          <p
            className="mt-1 text-3xl font-semibold tabular-nums"
            style={{ color: 'var(--primary)' }}
          >
            {formatNumber(emFormacao.length)}
          </p>
          <p className="mt-1 text-xs text-text-subtle">
            Precisam apenas da última lição
          </p>
        </div>
        <div className="card sm:col-span-2">
          <p className="mb-2 text-xs text-text-muted">Aulas pendentes mais frequentes</p>
          {aulaOptions.length === 0 ? (
            <p className="text-sm text-text-subtle">Nada pendente.</p>
          ) : (
            <ul className="space-y-1.5">
              {aulaOptions.slice(0, 5).map((o) => {
                const total = emFormacao.filter(
                  (a) => extractFirstNumber(a.aulasFaltando) === o.value,
                ).length;
                return (
                  <li
                    key={o.value}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="truncate text-text-muted">{o.label}</span>
                    <span className="tabular-nums text-text">
                      {formatNumber(total)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <FilterBar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar aluno ou célula…"
        />
        {aulaOptions.length > 0 && (
          <FilterSelect
            label="Aula faltando"
            value={aulaFaltando}
            onChange={setAulaFaltando}
            options={[{ label: 'Todas', value: '' }, ...aulaOptions]}
          />
        )}
        {mesOptions.length > 0 && (
          <FilterSelect
            label="Período de cadastro"
            value={mes}
            onChange={setMes}
            options={[{ label: 'Todos', value: '' }, ...mesOptions]}
          />
        )}
      </FilterBar>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        emptyTitle="Ninguém em formação no momento"
        emptyDescription="Quando um aluno completar 9 lições, ele aparece aqui até concluir a última."
      />
    </div>
  );
}

// ============== FORMANDOS ==============

function FormandosPanel({
  alunos,
  isLoading,
}: {
  alunos: AbrigoAluno[];
  isLoading: boolean;
}) {
  const formandos = useMemo(
    () =>
      alunos
        .filter((a) => a.concluido)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [alunos],
  );

  const byCell = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of formandos) {
      const k = f.celula || 'Sem célula';
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);
  }, [formandos]);

  const columns: Column<AbrigoAluno>[] = [
    {
      key: 'nome',
      header: 'Formando',
      sortValue: (a) => a.nome.toLowerCase(),
      cell: (a) => <p className="font-medium text-text">{a.nome}</p>,
    },
    {
      key: 'celula',
      header: 'Célula',
      sortValue: (a) => a.celula.toLowerCase(),
      cell: (a) => <span className="text-text-muted">{a.celula || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: () => (
        <span className="badge badge-success">
          <span className="badge-dot bg-current" /> Concluído
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-text-muted">Total de formandos</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-text">
            {formatNumber(formandos.length)}
          </p>
        </div>
        <div className="card sm:col-span-2">
          <p className="mb-2 text-xs text-text-muted">Formandos por célula</p>
          {byCell.length === 0 ? (
            <p className="text-sm text-text-subtle">Ainda sem formandos.</p>
          ) : (
            <ul className="space-y-1.5">
              {byCell.slice(0, 6).map((c) => (
                <li
                  key={c.nome}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="truncate text-text-muted">{c.nome}</span>
                  <span className="tabular-nums text-text">
                    {formatNumber(c.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <DataTable
        data={formandos}
        columns={columns}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        emptyTitle="Ainda sem formandos"
        emptyDescription="Os alunos aparecem aqui ao concluir as 10 lições."
      />
    </div>
  );
}

// ============== Helpers ==============

function ProgressBar({ value, max }: { value: number; max: number }) {
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  const done = value >= max;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 w-full max-w-[140px] overflow-hidden rounded-full bg-surface-2">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${p}%`,
            background: done ? 'var(--success)' : 'var(--primary)',
          }}
        />
      </div>
      <span className="text-xs tabular-nums text-text-muted">
        {Math.round(p)}%
      </span>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint?: string;
  tone?: 'neutral' | 'primary' | 'success';
}) {
  const tint =
    tone === 'primary'
      ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
      : tone === 'success'
        ? { background: 'var(--success-soft)', color: 'var(--success)' }
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

function uniqueOptions(values: string[]): Array<{ label: string; value: string }> {
  const set = new Set<string>();
  for (const v of values) {
    const t = (v ?? '').trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((v) => ({
    label: v,
    value: v,
  }));
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : (n / total) * 100;
}

function extractFirstNumber(s: string): string | null {
  const m = (s ?? '').match(/(\d+)/);
  return m ? m[1] ?? null : null;
}

/** Extrai "YYYY-MM" de data BR (dd/mm/yyyy) ou ISO. */
function monthKey(raw?: string): string | null {
  if (!raw) return null;
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) {
    const mm = (br[2] ?? '').padStart(2, '0');
    return `${br[3]}-${mm}`;
  }
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }
  return null;
}

function monthLabel(k: string): string {
  const [y, m] = k.split('-');
  const names = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  const i = Number(m) - 1;
  return `${names[i] ?? m}/${y}`;
}
