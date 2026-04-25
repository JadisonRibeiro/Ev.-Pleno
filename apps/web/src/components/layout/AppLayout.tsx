import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Users,
  Home as HomeIcon,
  LogOut,
  KeyRound,
  Heart,
  BookOpen,
  HandCoins,
  ChevronDown,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/utils/cn';
import { Logo } from '@/components/Logo';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const MIRROR_SURFACE =
  'linear-gradient(180deg, #1c1c22 0%, #101015 55%, #050506 100%)';

/**
 * Backgrounds são ancorados em 100vh para que o header (em cima) e a sidebar
 * (lateral) mostrem fatias contínuas do MESMO degradê — visualmente parecem
 * uma única superfície em "L".
 */
const MIRROR_SURFACE_PROPS = {
  background: MIRROR_SURFACE,
  backgroundSize: '100% 100vh',
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: '0 0',
};

const navGroups: NavGroup[] = [
  {
    label: 'Gestão',
    items: [
      { to: '/membros', label: 'Membros', icon: Users },
      { to: '/celulas', label: 'Células', icon: HomeIcon, adminOnly: true },
      { to: '/celula', label: 'Minha célula', icon: HomeIcon },
      { to: '/amor', label: 'AMAR', icon: Heart },
      { to: '/abrigo', label: 'Abrigo', icon: BookOpen },
    ],
  },
  {
    label: 'Contribuição',
    items: [
      { to: '/ofertas', label: 'Dízimos e Ofertas', icon: HandCoins },
    ],
  },
];

function resolveSectionLabel(pathname: string): string {
  for (const g of navGroups) {
    for (const it of g.items) {
      if (it.end ? pathname === it.to : pathname === it.to || pathname.startsWith(it.to + '/')) {
        return it.label;
      }
    }
  }
  return 'Membros';
}

function MirrorOverlay({ orientation = 'horizontal' }: { orientation?: 'horizontal' | 'vertical' }) {
  if (orientation === 'vertical') {
    return (
      <>
        {/* Top reflection (highlight) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
          }}
        />
        {/* Right edge polish */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-px"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
          }}
        />
      </>
    );
  }
  return (
    <>
      {/* Top highlight (mirror) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 100%)',
        }}
      />
      {/* Bottom hairline reflection */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
        }}
      />
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const sectionLabel = resolveSectionLabel(location.pathname);

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

  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        if (it.adminOnly && !isAdmin) return false;
        if (it.to === '/celula' && isAdmin) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      {/* Sidebar desktop */}
      <aside
        className="relative hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r lg:flex"
        style={{
          ...MIRROR_SURFACE_PROPS,
          borderColor: 'rgba(255,255,255,0.08)',
          color: 'var(--sidebar-text)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <MirrorOverlay orientation="vertical" />
        <div
          className="relative flex h-20 items-center justify-center border-b px-5"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <Logo
            variant="branca"
            className="h-12 w-auto"
            style={{ filter: 'drop-shadow(0 4px 18px rgba(255,255,255,0.18))' }}
          />
        </div>
        <div className="relative flex-1 min-h-0">
          <SidebarNav groups={visibleGroups} />
        </div>
      </aside>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          ...MIRROR_SURFACE_PROPS,
          borderColor: 'rgba(255,255,255,0.08)',
          color: 'var(--sidebar-text)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <MirrorOverlay orientation="vertical" />
        <div
          className="relative flex h-20 items-center justify-between border-b px-5"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <Logo
            variant="branca"
            className="h-12 w-auto"
            style={{ filter: 'drop-shadow(0 4px 18px rgba(255,255,255,0.18))' }}
          />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1 text-sidebar-text-muted hover:bg-white/5 hover:text-sidebar-text"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative flex-1 min-h-0">
          <SidebarNav groups={visibleGroups} onItemClick={() => setMobileOpen(false)} />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="relative z-30 flex h-16 shrink-0 items-center justify-between overflow-hidden border-b px-4 backdrop-blur-md lg:px-6"
          style={{
            ...MIRROR_SURFACE_PROPS,
            borderColor: 'rgba(255,255,255,0.08)',
            color: '#fff',
            boxShadow:
              '0 2px 18px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <MirrorOverlay orientation="horizontal" />

          <div className="relative flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
            <div className="lg:hidden">
              <Logo variant="branca" className="h-7 w-auto" />
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <div className="flex flex-col leading-tight">
                <span className="text-[9px] font-medium uppercase tracking-[0.34em] text-white/45">
                  Evangelho Pleno
                </span>
                <span
                  key={sectionLabel}
                  className="max-w-[420px] truncate bg-clip-text text-base font-bold uppercase tracking-[0.18em] text-transparent"
                  style={{
                    backgroundImage:
                      'linear-gradient(110deg, #f5f5f5 18%, #ffffff 32%, #b8b8b8 50%, #ffffff 68%, #f5f5f5 82%)',
                    backgroundSize: '220% 100%',
                    animation: 'header-shimmer 7s ease-in-out infinite',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  Painel {sectionLabel}
                </span>
              </div>
              {!isAdmin && user?.celula && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-sm font-medium text-white/80">{user.celula}</span>
                </>
              )}
            </div>
          </div>

          <div className="relative flex items-center gap-3 sm:gap-5">
            <Clock />
            <UserDropdown
              user={user}
              initials={initials}
              isAdmin={isAdmin}
              onLogout={handleLogout}
              onChangePassword={() => setPasswordOpen(true)}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />

      <style>{`
        @keyframes header-shimmer {
          0%, 100% { background-position: 220% 50%; }
          50% { background-position: -120% 50%; }
        }
        @keyframes header-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.18); }
        }
      `}</style>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateStr = now
    .toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
    .replace('.', '')
    .replace(',', ' ·');
  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className="hidden items-center gap-2.5 rounded-xl border px-3 py-1.5 sm:flex"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
      title="Data e hora atual"
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: '#22c55e',
          boxShadow: '0 0 8px rgba(34,197,94,0.85)',
          animation: 'header-pulse 2.4s ease-in-out infinite',
        }}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/55">
          {dateStr}
        </span>
        <span className="text-sm font-semibold tabular-nums text-white">
          {timeStr}
        </span>
      </div>
    </div>
  );
}

function SidebarNav({
  groups,
  onItemClick,
}: {
  groups: NavGroup[];
  onItemClick?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label} className="mb-5 last:mb-0">
          <p
            className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.15em]"
            style={{ color: 'var(--sidebar-text-muted)' }}
          >
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onItemClick}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background: 'var(--sidebar-active-bg)',
                          color: 'var(--sidebar-active-text)',
                          borderLeft: '3px solid var(--primary)',
                          paddingLeft: 'calc(0.75rem - 3px)',
                        }
                      : {
                          color: 'var(--sidebar-text-muted)',
                        }
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

interface UserMenuProps {
  user: ReturnType<typeof useAuth.getState>['user'];
  initials: string | undefined;
  isAdmin: boolean;
  onLogout: () => void;
  onChangePassword: () => void;
}

function UserDropdown({ user, initials, isAdmin, onLogout, onChangePassword }: UserMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-white/10"
          style={{ color: '#fff' }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, #7f1d2b 0%, #b0304a 100%)',
              color: '#fff',
              boxShadow: '0 2px 10px rgba(127,29,43,0.45), inset 0 0 0 1px rgba(255,255,255,0.18)',
            }}
          >
            {initials || '–'}
          </div>
          <div className="hidden text-left sm:block">
            <p className="max-w-[170px] truncate text-xs font-semibold text-white">{user?.nome}</p>
            <p className="text-[10px] text-white/55">
              {isAdmin ? 'Administrador' : user?.celula}
            </p>
          </div>
          <ChevronDown size={14} className="text-white/55" />
        </button>
      </DropdownMenu.Trigger>
      <UserDropdownMenu
        user={user}
        onChangePassword={onChangePassword}
        onLogout={onLogout}
        align="end"
      />
    </DropdownMenu.Root>
  );
}

function UserDropdownMenu({
  user,
  onChangePassword,
  onLogout,
  align,
}: {
  user: ReturnType<typeof useAuth.getState>['user'];
  onChangePassword: () => void;
  onLogout: () => void;
  align: 'start' | 'end';
}) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={6}
        className="z-50 min-w-[220px] rounded-lg border border-border bg-surface p-1 shadow-high"
      >
        <div className="px-2 py-1.5 text-xs text-text-muted">
          <p className="truncate font-medium text-text">{user?.nome}</p>
          <p className="truncate">{user?.sub}</p>
        </div>
        <DropdownMenu.Separator className="my-1 h-px bg-border" />
        <DropdownMenu.Item
          onSelect={onChangePassword}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text outline-none transition-colors hover:bg-surface-2 data-[highlighted]:bg-surface-2"
        >
          <KeyRound size={14} /> Alterar senha
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={onLogout}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-danger outline-none transition-colors hover:bg-danger/10 data-[highlighted]:bg-danger/10"
        >
          <LogOut size={14} /> Sair
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}
