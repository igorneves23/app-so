import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, BarChart3, Package, AlertCircle, CheckCircle, Wrench, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = { disponivel: '#22c55e', retirado: '#ef4444', manutencao: '#f59e0b' };
const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Relatorios() {
  const [resumo, setResumo] = useState(null);
  const [maisUsados, setMaisUsados] = useState([]);
  const [fora, setFora] = useState([]);
  const [porUsuario, setPorUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [r, m, f, u] = await Promise.all([
        api.get('/relatorios/resumo'),
        api.get('/relatorios/mais-usados'),
        api.get('/relatorios/equipamentos-fora'),
        api.get('/relatorios/por-usuario'),
      ]);
      setResumo(r.data);
      setMaisUsados(m.data.map((d) => ({ name: d.nome.substring(0, 20), total: parseInt(d.total_movimentacoes) })));
      setFora(f.data);
      setPorUsuario(u.data.filter((u) => parseInt(u.total) > 0));
    } catch {
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const params = {};
      if (inicio) params.inicio = inicio;
      if (fim) params.fim = fim;
      const res = await api.get('/relatorios/export-csv', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar');
    } finally {
      setExportLoading(false);
    }
  }

  const pieData = resumo
    ? [
        { name: 'Disponíveis', value: resumo.disponiveis },
        { name: 'Retirados', value: resumo.retirados },
        { name: 'Manutenção', value: resumo.manutencao },
      ].filter((d) => d.value > 0)
    : [];

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Carregando relatórios...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>

      {/* Summary cards */}
      {resumo && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Visão Geral</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Equipamentos" value={resumo.total_equipamentos} icon={Package} color="bg-blue-600" />
            <StatCard label="Disponíveis" value={resumo.disponiveis} icon={CheckCircle} color="bg-green-500" />
            <StatCard label="Retirados" value={resumo.retirados} icon={AlertCircle} color="bg-red-500" />
            <StatCard label="Movim. no Mês" value={resumo.movimentacoes_mes} icon={BarChart3} color="bg-indigo-500" />
          </div>
        </section>
      )}

      {/* Status pie */}
      {pieData.length > 0 && (
        <section className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-4">Status dos Equipamentos</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Most used */}
      {maisUsados.length > 0 && (
        <section className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-4">Equipamentos Mais Utilizados</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={maisUsados.slice(0, 8)} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Currently out */}
      {fora.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Equipamentos Fora ({fora.length})
          </h2>
          <div className="card divide-y divide-gray-100">
            {fora.map((e) => (
              <div key={e.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-gray-800">{e.nome}</p>
                  <span className="badge bg-red-100 text-red-700">Retirado</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  por <strong>{e.retirado_por}</strong> ·{' '}
                  {new Date(e.retirado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Usage by user */}
      {porUsuario.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Uso por Usuário</h2>
          <div className="card divide-y divide-gray-100">
            {porUsuario.slice(0, 10).map((u) => (
              <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-bold text-xs">{u.nome.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.nome}</p>
                  <p className="text-xs text-gray-400">{u.retiradas} retiradas · {u.devolucoes} devoluções</p>
                </div>
                <span className="text-sm font-bold text-gray-700">{u.total}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Export */}
      <section className="card p-4 space-y-3">
        <h2 className="font-semibold text-gray-800">Exportar Histórico</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data início</label>
            <input type="date" className="input text-sm" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data fim</label>
            <input type="date" className="input text-sm" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
        </div>
        <button onClick={handleExport} disabled={exportLoading} className="btn-primary w-full">
          <Download size={16} />
          {exportLoading ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </section>
    </div>
  );
}
