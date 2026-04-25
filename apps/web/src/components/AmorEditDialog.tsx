import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AmorDecision, Cell } from '@/types/api';
import { Field } from '@/components/Field';
import { FormDrawer } from '@/components/ui/FormDrawer';

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
  responsavel: z.string().optional(),
  dataNascimento: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  decision: AmorDecision | null;
  isAdmin: boolean;
  cells?: Cell[];
  defaultCell?: string;
  defaultResponsavel?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<AmorDecision>) => void;
  submitting: boolean;
}

export function AmorEditDialog({
  open,
  decision,
  isAdmin,
  cells = [],
  defaultCell,
  defaultResponsavel,
  onOpenChange,
  onSubmit,
  submitting,
}: Props) {
  const isCreate = decision === null;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!open) return;
    if (decision) {
      reset({
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
        responsavel: decision.responsavel,
        dataNascimento: decision.dataNascimento,
      });
    } else {
      reset({
        nome: '',
        telefone: '',
        endereco: '',
        decisao: '',
        decidiuNo: '',
        jaEmCelula: '',
        bairro: '',
        idade: '',
        opcaoCelula: defaultCell ?? '',
        tipoCelulaInteresse: '',
        convidadoPor: '',
        responsavel: defaultResponsavel ?? '',
        dataNascimento: '',
      });
    }
  }, [open, decision, defaultCell, defaultResponsavel, reset]);

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isCreate ? 'Nova decisão' : 'Editar decisão'}
      description={
        isCreate
          ? 'Registra uma nova decisão pastoral.'
          : 'Alterações são gravadas direto na planilha.'
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
            form="amor-form"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Salvando…' : isCreate ? 'Registrar' : 'Salvar'}
          </button>
        </>
      }
    >
      <form
        id="amor-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
        noValidate
      >
        <Field label="Nome" error={errors.nome?.message} className="md:col-span-2">
          <input className="input" autoFocus {...register('nome')} />
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
        <Field label="Data de nascimento">
          <input type="date" className="input" {...register('dataNascimento')} />
        </Field>
        <Field label="Decisão">
          <select className="select" {...register('decisao')}>
            <option value="">—</option>
            <option value="Aceitou Jesus">Aceitou Jesus</option>
            <option value="Reconciliação">Reconciliação</option>
            <option value="Cura interior">Cura interior</option>
            <option value="Outro">Outro</option>
          </select>
        </Field>
        <Field label="Decidiu no" hint="Evento, culto, célula…">
          <input className="input" {...register('decidiuNo')} />
        </Field>
        <Field label="Já participou de célula?">
          <select className="select" {...register('jaEmCelula')}>
            <option value="">—</option>
            <option value="Sim">Sim</option>
            <option value="Não">Não</option>
          </select>
        </Field>
        <Field label="Tipo de célula de interesse">
          <input className="input" {...register('tipoCelulaInteresse')} />
        </Field>
        {isAdmin ? (
          <Field label="Opção de célula" className="md:col-span-2">
            <select className="select" {...register('opcaoCelula')}>
              <option value="">—</option>
              {cells.map((c) => (
                <option key={c.nome} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field
            label="Opção de célula"
            hint="Líder cria com sua célula"
            className="md:col-span-2"
          >
            <input className="input" readOnly {...register('opcaoCelula')} />
          </Field>
        )}
        <Field label="Convidado por" className="md:col-span-2">
          <input className="input" {...register('convidadoPor')} />
        </Field>
        <Field label="Responsável pelo preenchimento" className="md:col-span-2">
          <input className="input" {...register('responsavel')} />
        </Field>
      </form>
    </FormDrawer>
  );
}
