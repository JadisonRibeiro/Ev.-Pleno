import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Cell } from '@/types/api';
import { Field } from '@/components/Field';
import { FormDrawer } from '@/components/ui/FormDrawer';

const schema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da célula'),
  lider: z.string().optional(),
  status: z.string().optional(),
  cidade: z.string().optional(),
  bairro: z.string().optional(),
  endereco: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  tipo: z.string().optional(),
  cor: z.string().optional(),
  fotoPerfil: z.string().optional(),
});
export type CellFormValues = z.infer<typeof schema>;

interface Props {
  cell: Cell | null;
  creating?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CellFormValues) => void;
  submitting: boolean;
}

const EMPTY: CellFormValues = {
  nome: '',
  lider: '',
  status: 'Ativa',
  cidade: '',
  bairro: '',
  endereco: '',
  latitude: '',
  longitude: '',
  tipo: '',
  cor: '',
  fotoPerfil: '',
};

export function CellEditDialog({
  cell,
  creating = false,
  onOpenChange,
  onSubmit,
  submitting,
}: Props) {
  const isEdit = !!cell;
  const open = !!cell || creating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CellFormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (cell) {
      reset({
        nome: cell.nome,
        lider: cell.lider,
        status: cell.status,
        cidade: cell.cidade,
        bairro: cell.bairro,
        endereco: cell.endereco,
        latitude: cell.latitude,
        longitude: cell.longitude,
        tipo: cell.tipo,
        cor: cell.cor,
        fotoPerfil: cell.fotoPerfil,
      });
    } else if (creating) {
      reset(EMPTY);
    }
  }, [cell, creating, reset]);

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? cell!.nome || 'Editar célula' : 'Nova célula'}
      description={
        isEdit
          ? `Líder: ${cell!.lider || '—'}`
          : 'Cadastre uma nova célula da igreja.'
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
            form="cell-form"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar célula'}
          </button>
        </>
      }
    >
      <form
        id="cell-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
        noValidate
      >
        <Field
          label="Nome da célula"
          error={errors.nome?.message}
          className="md:col-span-2"
        >
          <input
            className="input"
            placeholder="Ex.: Célula da Paz"
            disabled={isEdit}
            {...register('nome')}
          />
          {isEdit && (
            <p className="mt-1 text-[11px] text-text-subtle">
              O nome é o identificador da célula e não pode ser alterado.
            </p>
          )}
        </Field>
        <Field label="Líder">
          <input className="input" placeholder="Nome do líder" {...register('lider')} />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select className="select" {...register('status')}>
            <option value="Ativa">Ativa</option>
            <option value="Desabilitada">Desabilitada</option>
          </select>
        </Field>
        <Field label="Tipo de célula">
          <input className="input" placeholder="Ex.: Mulheres, Jovens…" {...register('tipo')} />
        </Field>
        <Field label="Cor da rede">
          <input className="input" {...register('cor')} />
        </Field>
        <Field label="Cidade">
          <input className="input" {...register('cidade')} />
        </Field>
        <Field label="Bairro">
          <input className="input" {...register('bairro')} />
        </Field>
        <Field label="Endereço" className="md:col-span-2">
          <input className="input" {...register('endereco')} />
        </Field>
        <Field label="Latitude" hint="Ex.: -23.5505">
          <input className="input" inputMode="decimal" {...register('latitude')} />
        </Field>
        <Field label="Longitude" hint="Ex.: -46.6333">
          <input className="input" inputMode="decimal" {...register('longitude')} />
        </Field>
        <Field label="Foto de perfil (URL)" className="md:col-span-2">
          <input
            className="input"
            placeholder="https://…"
            {...register('fotoPerfil')}
          />
        </Field>
      </form>
    </FormDrawer>
  );
}
