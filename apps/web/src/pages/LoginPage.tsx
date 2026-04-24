import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import type { AuthUser } from '@/types/api';
import { CellSelect } from '@/components/CellSelect';
import { Field } from '@/components/Field';
import { Logo } from '@/components/Logo';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe sua senha'),
  celula: z.string().min(1, 'Selecione uma célula'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setSession } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>(
        '/auth/login',
        values,
      );
      setSession(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err: any) {
      setApiError(err?.response?.data?.error ?? 'Erro ao autenticar');
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_55%)]"
      />
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4"
        noValidate
      >
        <header className="mb-6 text-center">
          <Logo variant="branca" className="mx-auto mb-5 h-20 w-auto" />
          <h1 className="text-xl font-semibold text-text">Entrar na plataforma</h1>
          <p className="mt-1 text-sm text-text-muted">
            Acesso exclusivo para líderes e administradores.
          </p>
        </header>

        <Field label="E-mail" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            className="input"
            placeholder="seu@email.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Field label="Senha" error={errors.senha?.message}>
          <input
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            aria-invalid={!!errors.senha}
            {...register('senha')}
          />
        </Field>

        <Field label="Célula" error={errors.celula?.message}>
          <CellSelect error={!!errors.celula} {...register('celula')} />
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

        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : (
            <>
              Entrar <ArrowRight size={16} />
            </>
          )}
        </button>
      </motion.form>
    </div>
  );
}
