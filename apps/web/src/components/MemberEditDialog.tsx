import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Member } from '@/types/api';
import { Field } from '@/components/Field';

const schema = z.object({
  nome: z.string().min(2, 'Nome muito curto'),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  abrigo: z.string().optional(),
  batismo: z.string().optional(),
  encontroDeus: z.string().optional(),
  escolaDiscipulos: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  member: Member | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (patch: Partial<Member>) => void;
  submitting: boolean;
}

const simOuNao = ['', 'Sim', 'Não'] as const;

export function MemberEditDialog({ member, onOpenChange, onSubmit, submitting }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (member) {
      reset({
        nome: member.nome,
        telefone: member.telefone,
        dataNascimento: member.dataNascimento,
        endereco: member.endereco,
        bairro: member.bairro,
        abrigo: member.abrigo,
        batismo: member.batismo,
        encontroDeus: member.encontroDeus,
        escolaDiscipulos: member.escolaDiscipulos,
      });
    }
  }, [member, reset]);

  return (
    <Dialog.Root open={!!member} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(640px,calc(100vw-2rem))] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl border border-border bg-surface p-6 shadow-2xl focus:outline-none">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-text">
                Editar membro
              </Dialog.Title>
              <Dialog.Description className="text-xs text-text-muted">
                Alterações são gravadas diretamente na planilha.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              aria-label="Fechar"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleSubmit((v) => onSubmit(v))}
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
            noValidate
          >
            <Field label="Nome completo" error={errors.nome?.message} className="md:col-span-2">
              <input className="input" {...register('nome')} />
            </Field>
            <Field label="Telefone">
              <input className="input" {...register('telefone')} />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" className="input" {...register('dataNascimento')} />
            </Field>
            <Field label="Endereço" className="md:col-span-2">
              <input className="input" {...register('endereco')} />
            </Field>
            <Field label="Bairro">
              <input className="input" {...register('bairro')} />
            </Field>
            <Field label="Abrigo">
              <input className="input" {...register('abrigo')} />
            </Field>
            <Field label="Batismo nas águas">
              <select className="select" {...register('batismo')}>
                {simOuNao.map((v) => <option key={v} value={v}>{v || '—'}</option>)}
              </select>
            </Field>
            <Field label="Encontro com Deus">
              <select className="select" {...register('encontroDeus')}>
                {simOuNao.map((v) => <option key={v} value={v}>{v || '—'}</option>)}
              </select>
            </Field>
            <Field label="Escola de Discípulos" className="md:col-span-2">
              <select className="select" {...register('escolaDiscipulos')}>
                {simOuNao.map((v) => <option key={v} value={v}>{v || '—'}</option>)}
              </select>
            </Field>

            <div className="mt-2 flex justify-end gap-2 md:col-span-2">
              <Dialog.Close className="btn-secondary" type="button">
                Cancelar
              </Dialog.Close>
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
