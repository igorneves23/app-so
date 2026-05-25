import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ClipboardList, Plus, Pencil, Trash2, Globe, Tag, Package,
  ToggleLeft, ToggleRight, Loader2, Info,
} from 'lucide-react';

const TIPO_CONFIG = {
  global:      { label: 'Global',      color: 'bg-blue-100 text-blue-700',   icon: Globe  },
  categoria:   { label: 'Por Categoria', color: 'bg-purple-100 text-purple-700', icon: Tag    },
  equipamento: { label: 'Por Equipamento', color: 'bg-green-100 text-green-700', icon: Package },
};

export default function ChecklistTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [toggling, setToggling] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/checklists/templates');
      setTemplates(res.data);
    } catch {
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/checklists/templates/${id}`);
      toast.success('Template excluído');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir');
    }
  }

  async function toggleAtivo(tmpl) {
    setToggling(tmpl.id);
    try {
      await api.put(`/checklists/templates/${tmpl.id}`, { ativo: !tmpl.ativo });
      setTemplates((prev) =>
        prev.map((t) => (t.id === tmpl.id ? { ...t, ativo: !t.ativo } : t))
      );
    } catch {
      toast.error('Erro ao atualizar');
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Checklists</h1>
          <p className="text-xs text-gray-500 mt-0.5">Templates de verificação operacional</p>
        </div>
        <Link to="/checklist/templates/novo" className="btn-primary text-sm py-2 px-3">
          <Plus size={16} /> Novo
        </Link>
      </div>

      {/* Info card */}
      <div className="card p-3 bg-blue-50 border-blue-100 flex gap-3">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 space-y-0.5">
          <p><strong>Prioridade de aplicação:</strong> Equipamento específico → Por categoria → Global</p>
          <p>Templates inativos não são apresentados aos voluntários.</p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <ClipboardList size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-500 font-medium">Nenhum checklist cadastrado</p>
          <p className="text-xs text-gray-400">Crie um template para começar a verificar equipamentos</p>
          <Link to="/checklist/templates/novo" className="btn-primary mt-3 inline-flex text-sm">
            <Plus size={16} /> Criar primeiro checklist
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const cfg = TIPO_CONFIG[t.tipo] || TIPO_CONFIG.global;
            const TipoIcon = cfg.icon;
            return (
              <div key={t.id} className={`card p-4 transition-opacity ${!t.ativo ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <ClipboardList size={20} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 leading-tight">{t.nome}</h3>
                      <button
                        onClick={() => toggleAtivo(t)}
                        disabled={toggling === t.id}
                        className="shrink-0"
                        title={t.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {toggling === t.id ? (
                          <Loader2 size={18} className="animate-spin text-gray-400" />
                        ) : t.ativo ? (
                          <ToggleRight size={22} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={22} className="text-gray-400" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                        <TipoIcon size={11} />
                        {cfg.label}
                        {t.tipo === 'categoria' && t.categoria && `: ${t.categoria}`}
                        {t.tipo === 'equipamento' && t.equipamento_nome && `: ${t.equipamento_nome}`}
                      </span>
                      <span className="text-xs text-gray-400">{t.total_itens} {t.total_itens === 1 ? 'item' : 'itens'}</span>
                      {!t.ativo && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inativo</span>
                      )}
                    </div>

                    {t.descricao && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{t.descricao}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 ml-13">
                  <Link
                    to={`/checklist/templates/${t.id}/editar`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium transition-colors"
                  >
                    <Pencil size={13} /> Editar
                  </Link>
                  <button
                    onClick={() => setDeleteId(t.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 text-xs font-medium transition-colors"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de exclusão */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-600 mb-5">
              Excluir este template também remove todos os seus itens. O histórico de verificações não é afetado.
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
