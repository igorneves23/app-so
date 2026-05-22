import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ArrowDownToLine, ArrowUpToLine, Package, Search, Filter } from 'lucide-react';

export default function Historico() {
  const { isAdmin } = useAuth();
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  useEffect(() => {
    load(0);
    setPage(0);
  }, [tipoFilter]);

  async function load(offset = 0) {
    setLoading(true);
    try {
      const params = { limit, offset };
      if (tipoFilter) params.tipo = tipoFilter;
      const res = await api.get('/movimentacoes', { params });
      if (offset === 0) {
        setMovs(res.data);
      } else {
        setMovs((prev) => [...prev, ...res.data]);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage * limit);
  }

  function groupByDate(movs) {
    const groups = {};
    movs.forEach((m) => {
      const date = new Date(m.data_hora).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  }

  const grouped = groupByDate(movs);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {isAdmin ? 'Histórico Geral' : 'Meu Histórico'}
        </h1>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'retirada', 'devolucao'].map((t) => (
          <button
            key={t}
            onClick={() => setTipoFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tipoFilter === t
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === '' ? 'Todos' : t === 'retirada' ? 'Retiradas' : 'Devoluções'}
          </button>
        ))}
      </div>

      {loading && movs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : movs.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhuma movimentação registrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{date}</p>
              <div className="card divide-y divide-gray-50">
                {items.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      m.tipo === 'retirada' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {m.tipo === 'retirada'
                        ? <ArrowDownToLine size={14} className="text-red-600" />
                        : <ArrowUpToLine size={14} className="text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {m.equipamento_nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {m.tipo === 'retirada' ? 'Retirado' : 'Devolvido'} por{' '}
                        <span className="font-medium text-gray-700">{m.usuario_nome}</span>
                      </p>
                      {m.observacao && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">"{m.observacao}"</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">
                      {new Date(m.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {movs.length % limit === 0 && movs.length > 0 && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full btn-secondary"
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
