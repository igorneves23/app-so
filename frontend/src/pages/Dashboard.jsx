import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  QrCode, Package, History, BarChart3, Users, AlertCircle,
  CheckCircle, Wrench, AlertTriangle, ArrowUpToLine, Clock,
  ChevronRight, MapPin
} from 'lucide-react';

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

function tempoDecorrido(dataStr) {
  const agora = new Date();
  const data = new Date(dataStr);
  const diffMs = agora - data;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH}h`;
  if (diffD === 1) return 'há 1 dia';
  return `há ${diffD} dias`;
}

function urgenciaCor(dataStr) {
  const diffH = (new Date() - new Date(dataStr)) / 3600000;
  if (diffH > 72) return 'text-red-600 bg-red-50 border-red-200';
  if (diffH > 24) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-amber-600 bg-amber-50 border-amber-200';
}

function PendingItem({ item }) {
  const cor = urgenciaCor(item.retirado_em);
  return (
    <Link
      to={`/equipamento/${item.id}`}
      className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all hover:shadow-sm active:scale-[0.98] ${cor}`}
    >
      {/* Foto ou ícone */}
      {item.foto ? (
        <img
          src={item.foto}
          alt={item.nome}
          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/60"
        />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
          <Package size={20} className="opacity-60" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight truncate">{item.nome}</p>
        {item.categoria && (
          <p className="text-xs opacity-70 truncate">{item.categoria}</p>
        )}
        <div className="flex items-center gap-1 mt-0.5">
          <Clock size={11} className="shrink-0 opacity-70" />
          <p className="text-xs opacity-80">{tempoDecorrido(item.retirado_em)}</p>
          {item.localizacao && (
            <>
              <span className="opacity-40 text-xs">·</span>
              <MapPin size={11} className="shrink-0 opacity-70" />
              <p className="text-xs opacity-70 truncate">{item.localizacao}</p>
            </>
          )}
        </div>
      </div>

      {/* Devolver CTA */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <ArrowUpToLine size={16} className="opacity-80" />
        <span className="text-xs font-medium opacity-80">Devolver</span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [myHistory, setMyHistory] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [loadingPendentes, setLoadingPendentes] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      api.get('/relatorios/resumo').then((r) => setStats(r.data)).catch(() => {});
    }
    api.get('/movimentacoes?limit=5').then((r) => setMyHistory(r.data)).catch(() => {});
    api.get('/movimentacoes/pendentes')
      .then((r) => setPendentes(r.data))
      .catch(() => {})
      .finally(() => setLoadingPendentes(false));
  }, [isAdmin]);

  // Para admin: agrupar pendentes por usuário
  const pendentesAgrupados = isAdmin
    ? pendentes.reduce((acc, item) => {
        const nome = item.usuario_nome;
        if (!acc[nome]) acc[nome] = [];
        acc[nome].push(item);
        return acc;
      }, {})
    : null;

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

      {/* ── PENDÊNCIAS ── */}
      {!loadingPendentes && !isAdmin && pendentes.length > 0 && (
        <section>
          {/* Cabeçalho alerta */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                Pendências de devolução
              </h2>
            </div>
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendentes.length}
            </span>
          </div>

          {/* Banner resumo */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Você tem <strong>{pendentes.length} {pendentes.length === 1 ? 'item' : 'itens'}</strong>{' '}
              que {pendentes.length === 1 ? 'precisa ser devolvido' : 'precisam ser devolvidos'}.
              Toque no item para registrar a devolução.
            </p>
          </div>

          {/* Lista de itens */}
          <div className="space-y-2">
            {pendentes.map((item) => (
              <PendingItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* ── PENDÊNCIAS (ADMIN) ── */}
      {!loadingPendentes && isAdmin && pendentes.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide flex-1">
              Itens retirados (pendentes)
            </h2>
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendentes.length}
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(pendentesAgrupados).map(([nomeUsuario, itens]) => (
              <div key={nomeUsuario} className="card overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                      <Users size={12} className="text-amber-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{nomeUsuario}</span>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                    {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  {itens.map((item) => (
                    <Link
                      key={item.id}
                      to={`/equipamento/${item.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-amber-50 transition-colors"
                    >
                      {item.foto ? (
                        <img src={item.foto} alt={item.nome} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                          <Package size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.nome}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={10} /> {tempoDecorrido(item.retirado_em)}
                          {item.categoria && <><span className="opacity-40">·</span>{item.categoria}</>}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sem pendências — mensagem positiva para usuário comum */}
      {!loadingPendentes && !isAdmin && pendentes.length === 0 && (
        <div className="card p-4 flex items-center gap-3 bg-green-50 border-green-100">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Tudo em dia!</p>
            <p className="text-xs text-green-600">Você não tem itens pendentes de devolução.</p>
          </div>
        </div>
      )}

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
