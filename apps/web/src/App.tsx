import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/lib/auth-store';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import MembersPage from '@/pages/MembersPage';
import CellPage from '@/pages/CellPage';
import MapPage from '@/pages/MapPage';
import AmorPage from '@/pages/AmorPage';
import AbrigoPage from '@/pages/AbrigoPage';

function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/membros"
        element={
          <Protected>
            <MembersPage />
          </Protected>
        }
      />
      <Route
        path="/celula"
        element={
          <Protected>
            <CellPage />
          </Protected>
        }
      />
      <Route
        path="/mapa"
        element={
          <Protected>
            <MapPage />
          </Protected>
        }
      />
      <Route
        path="/amor"
        element={
          <Protected>
            <AmorPage />
          </Protected>
        }
      />
      <Route
        path="/abrigo"
        element={
          <Protected>
            <AbrigoPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
