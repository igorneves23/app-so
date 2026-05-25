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
import ChecklistVerificacao from './pages/ChecklistVerificacao';
import ChecklistTemplates from './pages/ChecklistTemplates';
import ChecklistTemplateForm from './pages/ChecklistTemplateForm';
import Verificacoes from './pages/Verificacoes';
import VerificacaoDetalhe from './pages/VerificacaoDetalhe';

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

      {/* Equipamentos */}
      <Route path="/equipamento/:id/verificar" element={<AppLayout><ChecklistVerificacao /></AppLayout>} />
      <Route path="/equipamento/:id" element={<AppLayout><EquipamentoView /></AppLayout>} />
      <Route path="/equipamentos" element={<AppLayout adminOnly><Equipamentos /></AppLayout>} />
      <Route path="/equipamentos/novo" element={<AppLayout adminOnly><EquipamentoForm /></AppLayout>} />
      <Route path="/equipamentos/:id/editar" element={<AppLayout adminOnly><EquipamentoForm /></AppLayout>} />

      {/* Verificações */}
      <Route path="/verificacoes" element={<AppLayout><Verificacoes /></AppLayout>} />
      <Route path="/verificacoes/:id" element={<AppLayout><VerificacaoDetalhe /></AppLayout>} />

      {/* Checklists (admin) */}
      <Route path="/checklist/templates" element={<AppLayout adminOnly><ChecklistTemplates /></AppLayout>} />
      <Route path="/checklist/templates/novo" element={<AppLayout adminOnly><ChecklistTemplateForm /></AppLayout>} />
      <Route path="/checklist/templates/:id/editar" element={<AppLayout adminOnly><ChecklistTemplateForm /></AppLayout>} />

      {/* Outros */}
      <Route path="/usuarios" element={<AppLayout adminOnly><Usuarios /></AppLayout>} />
      <Route path="/historico" element={<AppLayout><Historico /></AppLayout>} />
      <Route path="/relatorios" element={<AppLayout adminOnly><Relatorios /></AppLayout>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
