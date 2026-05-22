import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Equipamentos from './pages/Equipamentos';
import EquipamentoForm from './pages/EquipamentoForm';
import EquipamentoView from './pages/EquipamentoView';
import Usuarios from './pages/Usuarios';
import Historico from './pages/Historico';
import Relatorios from './pages/Relatorios';

function AppLayout({ children, adminOnly = false }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
      <Route path="/scanner" element={<AppLayout><Scanner /></AppLayout>} />
      <Route path="/equipamento/:id" element={<AppLayout><EquipamentoView /></AppLayout>} />
      <Route path="/equipamentos" element={<AppLayout adminOnly><Equipamentos /></AppLayout>} />
      <Route path="/equipamentos/novo" element={<AppLayout adminOnly><EquipamentoForm /></AppLayout>} />
      <Route path="/equipamentos/:id/editar" element={<AppLayout adminOnly><EquipamentoForm /></AppLayout>} />
      <Route path="/usuarios" element={<AppLayout adminOnly><Usuarios /></AppLayout>} />
      <Route path="/historico" element={<AppLayout><Historico /></AppLayout>} />
      <Route path="/relatorios" element={<AppLayout adminOnly><Relatorios /></AppLayout>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
