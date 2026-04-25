import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import type { Cell } from '@/types/api';
import { apiError } from '@/lib/error';
import { Field } from '@/components/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from '@/components/ui/Toaster';

const schema = z.object({
  status: z.string().optional(),
  cidade: z.string().optional(),
  bairro: z.string().optional(),
  endereco: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  tipo: z.string().optional(),
  cor: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CellPage() {
  const user = useAuth((s) => s.user)!;
  const isAdmin = user.role === 'admin';
  const qc = useQueryClient();

  const { data: cell, isLoading } = useQuery({
    queryKey: ['cell', user.celula],
    queryFn: async () =>
      (await api.get<{ cell: Cell }>(`/cells/${encodeURIComponent(user.celula)}`)).data.cell,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (cell) {
      reset({
        status: cell.status,
        cidade: cell.cidade,
        bairro: cell.bairro,
        endereco: cell.endereco,
        latitude: cell.latitude,
        longitude: cell.longitude,
        tipo: cell.tipo,
        cor: cell.cor,
      });
    }
  }, [cell, reset]);

  const save = useMutation({
    mutationFn: async (patch: FormValues) => {
      await api.patch(`/cells/${encodeURIComponent(user.celula)}`, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cell'] });
      qc.invalidateQueries({ queryKey: ['cells'] });
      toast.success('Célula atualizada');
    },
    onError: (err) => toast.error('Erro ao salvar', apiError(err)),
  });

  if (isLoading)
    return <p className="text-text-muted">Carregando célula…</p>;
  if (!cell)
    return <p className="text-text-muted">Célula não encontrada.</p>;

  return (
    <section className="animate-fade-up">
      <PageHeader
        kicker="Minha célula"
        title={cell.nome}
        subtitle={`Líder: ${cell.lider || '—'}`}
      />

      <form
        onSubmit={handleSubmit((v) => save.mutate(v))}
        className="card space-y-4"
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Status" error={errors.status?.message}>
            <select
              className="select"
              {...register('status')}
              disabled={!isAdmin}
            >
              <option value="">—</option>
              <option value="Ativa">Ativa</option>
              <option value="Pausada">Pausada</option>
              <option value="Encerrada">Encerrada</option>
            </select>
          </Field>
          <Field label="Tipo de célula">
            <input className="input" placeholder="Ex.: Mulheres, Jovens…" {...register('tipo')} />
          </Field>
          <Field label="Cor da rede">
            <input className="input" {...register('cor')} />
          </Field>
        </div>

        <Field label="Endereço">
          <input className="input" {...register('endereco')} />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Bairro">
            <input className="input" {...register('bairro')} />
          </Field>
          <Field label="Cidade">
            <input className="input" {...register('cidade')} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Latitude" hint="Ex.: -23.5505">
            <input className="input" inputMode="decimal" {...register('latitude')} />
          </Field>
          <Field label="Longitude" hint="Ex.: -46.6333">
            <input className="input" inputMode="decimal" {...register('longitude')} />
          </Field>
        </div>

        <div className="divider" />

        <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-xs text-text-muted">
            <MapPin size={14} />
            As coordenadas alimentam o mapa de células.
          </p>
          <button
            type="submit"
            className="btn-primary"
            disabled={!isDirty || save.isPending}
          >
            <Save size={16} />
            {save.isPending ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </section>
  );
}
