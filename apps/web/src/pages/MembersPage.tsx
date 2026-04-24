import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import type { Member } from '@/types/api';
import { MemberEditDialog } from '@/components/MemberEditDialog';
import { cn } from '@/utils/cn';

export default function MembersPage() {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Member | null>(null);
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get<{ members: Member[] }>('/members')).data.members,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Member> }) => {
      await api.patch(`/members/${id}`, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      setEditing(null);
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.nome.toLowerCase().includes(q) ||
        m.telefone?.includes(q) ||
        m.bairro.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <section className="animate-fade-up">
      <header className="mb-6">
        <p className="kicker">Gestão</p>
        <h1 className="page-title mt-1">Membros</h1>
        <p className="page-subtitle">
          Edite informações dos membros da sua célula. Alterações salvam direto na planilha.
        </p>
      </header>

      <div className="card mb-4 flex items-center gap-3 !py-2.5">
        <Search size={16} className="text-text-subtle" />
        <input
          type="search"
          className="w-full border-0 bg-transparent p-0 text-sm text-text outline-none placeholder:text-text-subtle focus:ring-0"
          placeholder="Buscar por nome, telefone ou bairro…"
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
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Célula</th>
                <th className="px-4 py-3">Discipulado</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                    Carregando membros…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                    Nenhum membro encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface-2"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-text">{m.nome}</p>
                      {(m.endereco || m.bairro) && (
                        <p className="text-xs text-text-muted">
                          {[m.endereco, m.bairro].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {m.telefone || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{m.celula}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Tag label="Batismo" value={m.batismo} />
                        <Tag label="Encontro" value={m.encontroDeus} />
                        <Tag label="Escola" value={m.escolaDiscipulos} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(m)}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                        aria-label={`Editar ${m.nome}`}
                      >
                        <Pencil size={14} /> Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MemberEditDialog
        member={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(patch) => editing && update.mutate({ id: editing.id, patch })}
        submitting={update.isPending}
      />
    </section>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  const v = (value || '').toLowerCase();
  const done = v === 'sim';
  return (
    <span
      className={cn(
        'badge',
        done ? 'badge-success' : 'badge-neutral',
      )}
      title={`${label}: ${value || '—'}`}
    >
      <span className={cn('badge-dot', done ? 'bg-current' : 'bg-text-subtle')} />
      {label}
    </span>
  );
}
