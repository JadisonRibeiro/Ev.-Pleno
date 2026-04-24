import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AmorDecision } from '@/types/api';
import { Field } from '@/components/Field';

const schema = z.object({
  nome: z.string().min(2, 'Nome muito curto'),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  decisao: z.string().optional(),
  decidiuNo: z.string().optional(),
  jaEmCelula: z.string().optional(),
  bairro: z.string().optional(),
  idade: z.string().optional(),
  opcaoCelula: z.string().optional(),
  tipoCelulaInteresse: z.string().optional(),
  convidadoPor: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  decision: AmorDecision | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (patch: Partial<AmorDecision>) => void;
  submitting: boolean;
}

export function AmorEditDialog({ decision, onOpenChange, onSubmit, submitting }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (decision) reset({
      nome: decision.nome,
      telefone: decision.telefone,
      endereco: decision.endereco,
      decisao: decision.decisao,
      decidiuNo: decision.decidiuNo,
      jaEmCelula: decision.jaEmCelula,
      bairro: decision.bairro,
      idade: decision.idade,
      opcaoCelula: decision.opcaoCelula,
      tipoCelulaInteresse: decision.tipoCelulaInteresse,
      convidadoPor: decision.convidadoPor,
    });
  }, [decision, reset]);

  return (
    <Dialog.Root open={!!decision} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl border border-border bg-surface p-6 shadow-2xl focus:outline-none">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-text">Editar decisão</Dialog.Title>
              <Dialog.Description className="text-xs text-text-muted">
                Só administradores podem editar. Alterações gravam na planilha.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text" aria-label="Fechar">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit((v) => onSubmit(v))} className="grid grid-cols-1 gap-3 md:grid-cols-2" noValidate>
            <Field label="Nome" error={errors.nome?.message} className="md:col-span-2">
              <input className="input" {...register('nome')} />
            </Field>
            <Field label="Telefone">
              <input className="input" {...register('telefone')} />
            </Field>
            <Field label="Idade">
              <input className="input" inputMode="numeric" {...register('idade')} />
            </Field>
            <Field label="Endereço" className="md:col-span-2">
              <input className="input" {...register('endereco')} />
            </Field>
            <Field label="Bairro">
              <input className="input" {...register('bairro')} />
            </Field>
            <Field label="Decisão">
              <input className="input" placeholder="Aceitou Jesus / Reconciliação" {...register('decisao')} />
            </Field>
            <Field label="Decidiu no" className="md:col-span-2">
              <input className="input" placeholder="Evento / culto / célula" {...register('decidiuNo')} />
            </Field>
            <Field label="Já em célula?">
              <select className="select" {...register('jaEmCelula')}>
                <option value="">—</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </Field>
            <Field label="Tipo de célula de interesse">
              <input className="input" {...register('tipoCelulaInteresse')} />
            </Field>
            <Field label="Opção de célula" className="md:col-span-2">
              <input className="input" {...register('opcaoCelula')} />
            </Field>
            <Field label="Convidado por" className="md:col-span-2">
              <input className="input" {...register('convidadoPor')} />
            </Field>

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
