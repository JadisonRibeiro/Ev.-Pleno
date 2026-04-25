import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading,
  onConfirm,
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-2xl focus:outline-none">
          <div className="mb-3 flex items-start gap-3">
            {variant === 'danger' && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                <AlertTriangle size={18} />
              </div>
            )}
            <div>
              <Dialog.Title className="text-base font-semibold text-text">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-text-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close className="btn-secondary" type="button" disabled={loading}>
              {cancelLabel}
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                'btn',
                variant === 'danger'
                  ? 'bg-danger text-white hover:bg-danger/90'
                  : 'btn-primary',
              )}
            >
              {loading ? 'Processando…' : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
