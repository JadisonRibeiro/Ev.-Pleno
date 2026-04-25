import { AxiosError } from 'axios';

export function apiError(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return data?.error || data?.message || err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Ocorreu um erro inesperado';
}
