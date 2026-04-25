import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Cell, Member } from '@/types/api';
import { Field } from '@/components/Field';
import { FormDrawer } from '@/components/ui/FormDrawer';

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
  celula: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  member: Member | null; // null = criação
  isAdmin: boolean;
  cells?: Cell[];
  defaultCell?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<Member>) => void;
  submitting: boolean;
}

const simOuNao = ['', 'Sim', 'Não'] as const;

export function MemberEditDialog({
  open,
  member,
  isAdmin,
  cells = [],
  defaultCell,
  onOpenChange,
  onSubmit,
  submitting,
}: Props) {
  const isCreate = member === null;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
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
        celula: member.celula,
      });
    } else {
      reset({
        nome: '',
        telefone: '',
        dataNascimento: '',
        endereco: '',
        bairro: '',
        abrigo: '',
        batismo: '',
        encontroDeus: '',
        escolaDiscipulos: '',
        celula: defaultCell ?? '',
      });
    }
  }, [open, member, defaultCell, reset]);

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isCreate ? 'Novo membro' : 'Editar membro'}
      description={
        isCreate
          ? 'Adiciona uma linha na planilha de membros.'
          : 'Alterações são gravadas diretamente na planilha.'
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="member-form"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Salvando…' : isCreate ? 'Criar membro' : 'Salvar'}
          </button>
        </>
      }
    >
      <form
        id="member-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
        noValidate
      >
        <Field label="Nome completo" error={errors.nome?.message} className="md:col-span-2">
          <input className="input" {...register('nome')} autoFocus />
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
        {isAdmin ? (
          <Field label="Célula">
            <select className="select" {...register('celula')}>
              <option value="">—</option>
              {cells.map((c) => (
                <option key={c.nome} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Célula" hint="Líder cria membros na própria célula">
            <input
              className="input"
              value={defaultCell ?? ''}
              readOnly
              {...register('celula')}
            />
          </Field>
        )}
        <Field label="Abrigo">
          <input className="input" {...register('abrigo')} />
        </Field>
        <Field label="Batismo nas águas">
          <select className="select" {...register('batismo')}>
            {simOuNao.map((v) => (
              <option key={v} value={v}>
                {v || '—'}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Encontro com Deus">
          <select className="select" {...register('encontroDeus')}>
            {simOuNao.map((v) => (
              <option key={v} value={v}>
                {v || '—'}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Escola de Discípulos" className="md:col-span-2">
          <select className="select" {...register('escolaDiscipulos')}>
            {simOuNao.map((v) => (
              <option key={v} value={v}>
                {v || '—'}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </FormDrawer>
  );
}
