import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/lib/auth-store';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import MembersPage from '@/pages/MembersPage';
import CellPage from '@/pages/CellPage';
import CellsPage from '@/pages/CellsPage';
import AmorPage from '@/pages/AmorPage';
import AbrigoPage from '@/pages/AbrigoPage';
import OfertasPage from '@/pages/OfertasPage';

function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/membros" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function HomeRedirect() {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/membros" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/painel" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/membros" element={<Protected><MembersPage /></Protected>} />
      <Route path="/celulas" element={<AdminOnly><CellsPage /></AdminOnly>} />
      <Route path="/celula" element={<Protected><CellPage /></Protected>} />
      <Route path="/amor" element={<Protected><AmorPage /></Protected>} />
      <Route path="/abrigo" element={<Protected><AbrigoPage /></Protected>} />
      <Route path="/ofertas" element={<Protected><OfertasPage /></Protected>} />
      <Route path="*" element={<Navigate to="/membros" replace />} />
    </Routes>
  );
}
