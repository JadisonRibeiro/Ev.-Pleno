import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ABRIGO_TOTAL_LICOES, type AbrigoAluno } from '@/types/api';
import { Field } from '@/components/Field';

const schema = z.object({
  totalLicoes: z.coerce.number().int().min(0).max(ABRIGO_TOTAL_LICOES),
  aulasFeitas: z.string().optional(),
  licoesFaltando: z.coerce.number().int().min(0).max(ABRIGO_TOTAL_LICOES).optional(),
  aulasFaltando: z.string().optional(),
  statusConclusao: z.string().optional(),
  progresso: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  aluno: AbrigoAluno | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (patch: Partial<AbrigoAluno>) => void;
  submitting: boolean;
}

export function AbrigoEditDialog({ aluno, onOpenChange, onSubmit, submitting }: Props) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (aluno) reset({
      totalLicoes: aluno.totalLicoes,
      aulasFeitas: aluno.aulasFeitas,
      licoesFaltando: aluno.licoesFaltando,
      aulasFaltando: aluno.aulasFaltando,
      statusConclusao: aluno.statusConclusao,
      progresso: aluno.progresso,
    });
  }, [aluno, reset]);

  const total = Number(watch('totalLicoes') ?? 0);

  return (
    <Dialog.Root open={!!aluno} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(540px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl border border-border bg-surface p-6 shadow-2xl focus:outline-none">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-text">
                Editar progresso — {aluno?.nome}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-text-muted">
                Célula: {aluno?.celula || '—'}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text" aria-label="Fechar">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div
            className="mb-4 flex gap-2 rounded-md border px-3 py-2 text-xs"
            style={{
              borderColor: 'var(--warning)',
              background: 'var(--warning-soft)',
              color: 'var(--text)',
            }}
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              Atenção: se essas colunas têm fórmulas na aba <code>Abrigo_Total</code>,
              salvar aqui substitui a fórmula por valor estático.
            </span>
          </div>

          <form onSubmit={handleSubmit((v) => onSubmit({ ...v, concluido: v.totalLicoes >= ABRIGO_TOTAL_LICOES }))} className="grid grid-cols-1 gap-3 md:grid-cols-2" noValidate>
            <Field
              label={`Total de lições feitas (0–${ABRIGO_TOTAL_LICOES})`}
              error={errors.totalLicoes?.message}
            >
              <input
                type="number"
                min={0}
                max={ABRIGO_TOTAL_LICOES}
                className="input"
                {...register('totalLicoes')}
              />
            </Field>

            <Field label="Lições faltando">
              <input
                type="number"
                min={0}
                max={ABRIGO_TOTAL_LICOES}
                className="input"
                {...register('licoesFaltando')}
              />
            </Field>

            <Field label="Aulas feitas (lista)" className="md:col-span-2">
              <input className="input" placeholder="Ex.: 1, 2, 3, 5" {...register('aulasFeitas')} />
            </Field>

            <Field label="Aulas faltando (lista)" className="md:col-span-2">
              <input className="input" placeholder="Ex.: 4, 6, 7, 8, 9, 10" {...register('aulasFaltando')} />
            </Field>

            <Field label="Status de conclusão">
              <select className="select" {...register('statusConclusao')}>
                <option value="">—</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluído">Concluído</option>
                <option value="Desistente">Desistente</option>
              </select>
            </Field>

            <Field label="Progresso (texto)">
              <input className="input" placeholder="Ex.: 70%" {...register('progresso')} />
            </Field>

            <div className="md:col-span-2">
              <p className="text-xs text-text-muted">
                {total >= ABRIGO_TOTAL_LICOES
                  ? '🎓 Com esse valor o aluno é considerado CONCLUÍDO.'
                  : `Faltam ${ABRIGO_TOTAL_LICOES - total} lição(ões) para concluir.`}
              </p>
            </div>

            <div className="mt-2 flex justify-end gap-2 md:col-span-2">
              <Dialog.Close className="btn-secondary" type="button">Cancelar</Dialog.Close>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
