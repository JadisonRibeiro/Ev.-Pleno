import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Home as HomeIcon,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/utils/cn';
import { Logo } from '@/components/Logo';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

const nav = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/membros', label: 'Membros', icon: Users },
  { to: '/celula', label: 'Minha célula', icon: HomeIcon },
  { to: '/mapa', label: 'Mapa', icon: MapPin },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.nome
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col border-b border-border bg-surface lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:flex-col lg:items-stretch lg:gap-6 lg:py-6">
          <NavLink to="/" className="flex items-center justify-start lg:justify-center">
            <Logo variant="branca" className="h-10 w-auto lg:h-14" />
          </NavLink>

          <nav className="hidden lg:block">
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-surface-2 text-text'
                          : 'text-text-muted hover:bg-surface-2 hover:text-text',
                      )
                    }
                  >
                    <item.icon size={16} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* mobile nav */}
        <nav className="lg:hidden">
          <ul className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2">
            {nav.map((item) => (
              <li key={item.to} className="shrink-0">
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-xs',
                      isActive
                        ? 'bg-surface-2 text-text'
                        : 'text-text-muted hover:text-text',
                    )
                  }
                >
                  <item.icon size={14} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto hidden border-t border-border p-4 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-text">
              {initials || '–'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">{user?.nome}</p>
              <p className="truncate text-xs text-text-muted">
                {user?.role === 'admin' ? 'Administrador' : user?.celula}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            <button
              onClick={() => setPasswordOpen(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <KeyRound size={14} />
              Alterar senha
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-bg">
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10">{children}</div>
      </main>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  );
}
