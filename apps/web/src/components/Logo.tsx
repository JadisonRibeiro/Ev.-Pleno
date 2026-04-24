import { cn } from '@/utils/cn';

interface Props {
  variant?: 'branca' | 'preta';
  className?: string;
  alt?: string;
}

/**
 * Logo "Evangelho Pleno — Uma Igreja Completa".
 * Use `branca` sobre fundo escuro e `preta` sobre fundo claro.
 */
export function Logo({ variant = 'branca', className, alt = 'Evangelho Pleno' }: Props) {
  const src = variant === 'branca' ? '/logo-branca.png' : '/logo-preto.png';
  return <img src={src} alt={alt} className={cn('select-none', className)} draggable={false} />;
}
