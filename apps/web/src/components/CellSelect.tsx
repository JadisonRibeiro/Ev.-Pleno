import { forwardRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PublicCell {
  nome: string;
}

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const CellSelect = forwardRef<HTMLSelectElement, Props>(function CellSelect(
  { error, ...props },
  ref,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public', 'cells'],
    queryFn: async () =>
      (await api.get<{ cells: PublicCell[] }>('/public/cells')).data.cells,
    staleTime: 5 * 60_000,
  });

  return (
    <select
      ref={ref}
      className="select"
      aria-invalid={error ? 'true' : undefined}
      disabled={props.disabled || isLoading}
      {...props}
    >
      <option value="">
        {isLoading
          ? 'Carregando células…'
          : isError
            ? 'Não foi possível carregar'
            : 'Selecione uma célula'}
      </option>
      {data?.map((c) => (
        <option key={c.nome} value={c.nome}>
          {c.nome}
        </option>
      ))}
    </select>
  );
});
