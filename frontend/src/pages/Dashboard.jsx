import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { QrCode, Package, History, BarChart3, Users, AlertCircle, CheckCircle, Wrench } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, desc, color }) {
  return (
    <Link to={to} className="card p-4 flex items-start gap-3 hover:shadow-md transition-shadow active:scale-[0.98]">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [myHistory, setMyHistory] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      api.get('/relatorios/resumo').then((r) => setStats(r.data)).catch(() => {});
    }
    api.get('/movimentacoes?limit=5').then((r) => setMyHistory(r.data)).catch(() => {});
  }, [isAdmin]);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Olá, {user?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Admin stats */}
      {isAdmin && stats && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumo Geral</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Equipamentos" value={stats.total_equipamentos} icon={Package} color="bg-blue-600" />
            <StatCard label="Disponíveis" value={stats.disponiveis} icon={CheckCircle} color="bg-green-500" />
            <StatCard label="Retirados" value={stats.retirados} icon={AlertCircle} color="bg-red-500" />
            <StatCard label="Manutenção" value={stats.manutencao} icon={Wrench} color="bg-amber-500" />
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-1 gap-3">
          <QuickAction
            to="/scanner"
            icon={QrCode}
            label="Escanear QR Code"
            desc="Registrar retirada ou devolução de equipamento"
            color="bg-blue-600"
          />
          {isAdmin && (
            <QuickAction
              to="/equipamentos/novo"
              icon={Package}
              label="Cadastrar Equipamento"
              desc="Adicionar novo equipamento ao sistema"
              color="bg-green-600"
            />
          )}
          {isAdmin && (
            <QuickAction
              to="/usuarios"
              icon={Users}
              label="Gerenciar Usuários"
              desc="Adicionar ou editar usuários do sistema"
              color="bg-purple-600"
            />
          )}
          {isAdmin && (
            <QuickAction
              to="/relatorios"
              icon={BarChart3}
              label="Relatórios"
              desc="Visualizar estatísticas e exportar dados"
              color="bg-indigo-600"
            />
          )}
          <QuickAction
            to="/historico"
            icon={History}
            label="Meu Histórico"
            desc="Ver suas movimentações recentes"
            color="bg-gray-600"
          />
        </div>
      </section>

      {/* Recent activity */}
      {myHistory.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Atividade Recente</h2>
            <Link to="/historico" className="text-xs text-blue-600 font-medium">Ver tudo</Link>
          </div>
          <div className="card divide-y divide-gray-100">
            {myHistory.map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.tipo === 'retirada' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <Package size={14} className={m.tipo === 'retirada' ? 'text-red-600' : 'text-green-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.equipamento_nome}</p>
                  <p className="text-xs text-gray-500">
                    {m.tipo === 'retirada' ? 'Retirado' : 'Devolvido'} ·{' '}
                    {new Date(m.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
