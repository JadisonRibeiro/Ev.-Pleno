import { cn } from '@/utils/cn';

interface Props {
  variant?: 'branca' | 'preta';
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

/**
 * Logo "Evangelho Pleno — Uma Igreja Completa".
 * Use `branca` sobre fundo escuro e `preta` sobre fundo claro.
 */
export function Logo({ variant = 'branca', className, alt = 'Evangelho Pleno', style }: Props) {
  const src = variant === 'branca' ? '/logo-branca.png' : '/logo-preto.png';
  return (
    <img
      src={src}
      alt={alt}
      className={cn('select-none', className)}
      style={style}
      draggable={false}
    />
  );
}
