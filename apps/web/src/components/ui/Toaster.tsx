import { create } from 'zustand';
import * as Toast from '@radix-ui/react-toast';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: Variant;
}

interface State {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => void;
  remove: (id: number) => void;
}

let _id = 0;
export const useToastStore = create<State>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++_id;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'success' }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'error' }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'info' }),
};

export function Toaster() {
  const items = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <Toast.Provider swipeDirection="right" duration={4000}>
      {items.map((t) => (
        <Toast.Root
          key={t.id}
          onOpenChange={(open) => !open && remove(t.id)}
          className={cn(
            'pointer-events-auto rounded-lg border bg-surface p-3 shadow-xl',
            'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-right-4',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out',
            t.variant === 'success' && 'border-border-strong',
            t.variant === 'error' && 'border-danger/50 bg-danger/10',
            t.variant === 'info' && 'border-border',
          )}
        >
          <div className="flex items-start gap-3">
            {t.variant === 'success' && (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-text" />
            )}
            {t.variant === 'error' && (
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" />
            )}
            <div className="min-w-0 flex-1">
              <Toast.Title className="text-sm font-medium text-text">{t.title}</Toast.Title>
              {t.description && (
                <Toast.Description className="mt-0.5 text-xs text-text-muted">
                  {t.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close
              className="rounded-md p-0.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              aria-label="Fechar"
            >
              <X size={14} />
            </Toast.Close>
          </div>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed right-4 top-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 outline-none" />
    </Toast.Provider>
  );
}
