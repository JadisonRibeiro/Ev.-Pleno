import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, KeyRound, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Field } from '@/components/Field';

const schema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual'),
    senhaNova: z.string().min(8, 'Mínimo de 8 caracteres'),
    confirmar: z.string(),
  })
  .refine((v) => v.senhaNova === v.confirmar, {
    message: 'As senhas não conferem',
    path: ['confirmar'],
  })
  .refine((v) => v.senhaAtual !== v.senhaNova, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['senhaNova'],
  });
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      await api.post('/auth/change-password', {
        senhaAtual: values.senhaAtual,
        senhaNova: values.senhaNova,
      });
      setSuccess(true);
      reset();
    } catch (err: any) {
      setApiError(err?.response?.data?.error ?? 'Erro ao alterar senha');
    }
  }

  function handleClose(next: boolean) {
    if (!next) {
      reset();
      setSuccess(false);
      setApiError(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-2xl focus:outline-none">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-2 text-text">
                <KeyRound size={16} />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-text">
                  Alterar senha
                </Dialog.Title>
                <Dialog.Description className="text-xs text-text-muted">
                  A nova senha será gravada na planilha em formato criptografado.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              aria-label="Fechar"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          {success ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-2 text-text">
                <CheckCircle2 size={22} />
              </div>
              <p className="text-sm text-text">Senha alterada com sucesso.</p>
              <button onClick={() => handleClose(false)} className="btn-primary mt-5 w-full">
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
              <Field label="Senha atual" error={errors.senhaAtual?.message}>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="input"
                  aria-invalid={!!errors.senhaAtual}
                  {...register('senhaAtual')}
                />
              </Field>
              <Field label="Nova senha" error={errors.senhaNova?.message}>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  aria-invalid={!!errors.senhaNova}
                  {...register('senhaNova')}
                />
              </Field>
              <Field label="Confirmar nova senha" error={errors.confirmar?.message}>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  aria-invalid={!!errors.confirmar}
                  {...register('confirmar')}
                />
              </Field>

              {apiError && (
                <div
                  role="alert"
                  className="rounded-md border px-3 py-2 text-xs"
                  style={{
                    borderColor: 'var(--danger)',
                    background: 'var(--danger-soft)',
                    color: 'var(--danger)',
                  }}
                >
                  {apiError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Dialog.Close className="btn-secondary flex-1" type="button">
                  Cancelar
                </Dialog.Close>
                <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando…' : 'Alterar senha'}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
