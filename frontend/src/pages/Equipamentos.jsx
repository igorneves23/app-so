import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import {
  Plus, Search, Package, Pencil, Trash2, ChevronDown, ChevronRight, FolderOpen, Eye
} from 'lucide-react';

export default function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [openCategories, setOpenCategories] = useState({});

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/equipamentos', { params });
      setEquipamentos(res.data);

      // Abre todas as categorias por padrão
      const cats = {};
      res.data.forEach(e => { cats[e.categoria || 'Sem Categoria'] = true; });
      setOpenCategories(cats);
    } catch {
      toast.error('Erro ao carregar equipamentos');
    } finally {
      setLoading(false);
    }
  }

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

  // Agrupar por categoria
  const grouped = equipamentos.reduce((acc, e) => {
    const cat = e.categoria || 'Sem Categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === 'Sem Categoria') return 1;
    if (b === 'Sem Categoria') return -1;
    return a.localeCompare(b);
  });

  function toggleCategory(cat) {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Equipamentos</h1>
        <Link to="/equipamentos/novo" className="btn-primary text-sm py-2 px-3">
          <Plus size={16} /> Novo
        </Link>
      </div>

      {/* Filtros */}
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
        <select
          className="input text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="disponivel">Disponível</option>
          <option value="retirado">Retirado</option>
          <option value="manutencao">Manutenção</option>
        </select>
      </div>

      {/* Resumo */}
      {!loading && equipamentos.length > 0 && (
        <div className="flex gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded-full">{equipamentos.length} equipamentos</span>
          <span className="bg-gray-100 px-2 py-1 rounded-full">{sortedCategories.length} categorias</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {equipamentos.filter(e => e.status === 'disponivel').length} disponíveis
          </span>
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">
            {equipamentos.filter(e => e.status === 'retirado').length} retirados
          </span>
        </div>
      )}

      {/* Lista por categoria */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : equipamentos.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum equipamento encontrado</p>
          <Link to="/equipamentos/novo" className="btn-primary mt-4 text-sm inline-flex">
            <Plus size={16} /> Cadastrar primeiro equipamento
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCategories.map((cat) => (
            <div key={cat} className="card overflow-hidden">
              {/* Header da categoria */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen size={16} className="text-blue-600" />
                  <span className="font-semibold text-gray-800 text-sm">{cat}</span>
                  <span className="badge bg-blue-100 text-blue-700">{grouped[cat].length}</span>
                </div>
                {openCategories[cat]
                  ? <ChevronDown size={16} className="text-gray-400" />
                  : <ChevronRight size={16} className="text-gray-400" />}
              </button>

              {/* Itens da categoria */}
              {openCategories[cat] && (
                <div className="divide-y divide-gray-100">
                  {grouped[cat].map((e) => (
                    <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      {/* Foto */}
                      {e.foto ? (
                        <img
                          src={e.foto}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Package size={20} className="text-gray-400" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-800 text-sm">{e.nome}</p>
                          <StatusBadge status={e.status} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[
                            e.codigo ? `Cód: ${e.codigo}` : null,
                            e.patrimonio ? `Pat: ${e.patrimonio}` : null,
                            e.localizacao,
                          ].filter(Boolean).join(' · ')}
                        </p>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          to={`/equipamento/${e.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-medium"
                          title="Visualizar"
                        >
                          <Eye size={13} /> Ver
                        </Link>
                        <Link
                          to={`/equipamentos/${e.id}/editar`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium"
                          title="Editar"
                        >
                          <Pencil size={13} /> Editar
                        </Link>
                        <button
                          onClick={() => setDeleteId(e.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de exclusão */}
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
