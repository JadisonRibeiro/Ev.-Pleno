import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Conteúdo do formulário. */
  children: React.ReactNode;
  /** Footer fixo (botões de ação). */
  footer?: React.ReactNode;
  /** Largura máxima. */
  width?: 'md' | 'lg' | 'xl';
}

const widthClass = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
};

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = 'lg',
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-surface shadow-2xl focus:outline-none',
            'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
            widthClass[width],
          )}
        >
          <header className="flex items-start justify-between border-b border-border px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-base font-semibold text-text">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-0.5 truncate text-xs text-text-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              aria-label="Fechar"
            >
              <X size={18} />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

          {footer && (
            <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
