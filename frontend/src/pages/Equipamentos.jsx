import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import { Plus, Search, Package, Pencil, Trash2, QrCode, ChevronRight, Filter } from 'lucide-react';

export default function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    api.get('/equipamentos/categorias').then((r) => setCategorias(r.data)).catch(() => {});
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoriaFilter) params.categoria = categoriaFilter;
      const res = await api.get('/equipamentos', { params });
      setEquipamentos(res.data);
    } catch {
      toast.error('Erro ao carregar equipamentos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [search, statusFilter, categoriaFilter]);

  async function handleDelete(id) {
    try {
      await api.delete(`/equipamentos/${id}`);
      toast.success('Equipamento excluído');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir');
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Equipamentos</h1>
        <Link to="/equipamentos/novo" className="btn-primary text-sm py-2 px-3">
          <Plus size={16} /> Novo
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-3 space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nome, código ou patrimônio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="input flex-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="disponivel">Disponível</option>
            <option value="retirado">Retirado</option>
            <option value="manutencao">Manutenção</option>
          </select>
          {categorias.length > 0 && (
            <select
              className="input flex-1 text-sm"
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : equipamentos.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum equipamento encontrado</p>
          <Link to="/equipamentos/novo" className="btn-primary mt-4 text-sm">
            <Plus size={16} /> Cadastrar primeiro equipamento
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {equipamentos.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              {e.foto ? (
                <img src={e.foto} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Package size={20} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-800 text-sm truncate">{e.nome}</p>
                  <StatusBadge status={e.status} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {[e.categoria, e.codigo ? `Cód: ${e.codigo}` : null].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link to={`/equipamento/${e.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Ver">
                  <ChevronRight size={16} />
                </Link>
                <Link to={`/equipamentos/${e.id}/editar`} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Editar">
                  <Pencil size={15} />
                </Link>
                <button
                  onClick={() => setDeleteId(e.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-600 mb-5">
              Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger flex-1">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
