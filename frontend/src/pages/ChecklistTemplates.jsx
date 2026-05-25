import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  ClipboardList, Plus, Pencil, Trash2, Globe, Tag, Package,
  ToggleLeft, ToggleRight, Loader2, Info, Eye, Link2,
  Copy, Check, X, AlertCircle, RotateCcw, CheckSquare, Square,
} from 'lucide-react';

const TIPO_CONFIG = {
  global:      { label: 'Global',          color: 'bg-blue-100 text-blue-700',     icon: Globe   },
  categoria:   { label: 'Por Categoria',   color: 'bg-purple-100 text-purple-700', icon: Tag     },
  equipamento: { label: 'Por Equipamento', color: 'bg-green-100 text-green-700',   icon: Package },
};

// ── Modal base ──────────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {children}
      </div>
    </div>
  );
}

// ── Modal de Preview ────────────────────────────────────────────────────────
function PreviewModal({ template, onClose }) {
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    if (template?.itens) {
      setChecked(new Array(template.itens.length).fill(false));
    }
  }, [template]);

  if (!template) return null;

  const cfg = TIPO_CONFIG[template.tipo] || TIPO_CONFIG.global;
  const TipoIcon = cfg.icon;
  const total = template.itens?.length || 0;
  const checkedCount = checked.filter(Boolean).length;
  const allDone = total > 0 && checkedCount === total;

  function toggle(idx) {
    setChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  }

  function resetAll() {
    setChecked(new Array(total).fill(false));
  }

  function checkAll() {
    setChecked(new Array(total).fill(true));
  }

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="font-bold text-gray-900">{template.nome}</h2>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${cfg.color}`}>
            <TipoIcon size={11} /> {cfg.label}
            {template.tipo === 'categoria' && template.categoria && `: ${template.categoria}`}
          </span>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
          <X size={18} />
        </button>
      </div>

      {template.descricao && (
        <p className="px-5 py-3 text-sm text-gray-600 border-b border-gray-100 shrink-0 bg-gray-50">
          {template.descricao}
        </p>
      )}

      {/* Barra de progresso */}
      {total > 0 && (
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-semibold ${allDone ? 'text-green-600' : 'text-gray-600'}`}>
              {allDone ? '✓ Tudo verificado!' : `${checkedCount} de ${total} verificados`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={checkAll}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Marcar todos
              </button>
              <span className="text-gray-300">·</span>
              <button
                onClick={resetAll}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
              >
                <RotateCcw size={11} /> Limpar
              </button>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${allDone ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${total > 0 ? Math.round((checkedCount / total) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de itens com checkbox */}
      <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
        {total === 0 && (
          <p className="text-center text-gray-400 py-8">Nenhum item cadastrado</p>
        )}
        {template.itens?.map((item, idx) => {
          const isChecked = checked[idx] || false;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(idx)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                isChecked
                  ? 'bg-green-50 border-green-200 shadow-sm'
                  : 'bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-gray-100'
              }`}
            >
              {/* Checkbox */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isChecked ? 'bg-green-500' : 'bg-white border-2 border-gray-300'
              }`}>
                {isChecked && <Check size={13} className="text-white" strokeWidth={3} />}
              </div>

              {/* Número */}
              <span className={`w-6 h-6 text-xs font-bold rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isChecked ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {idx + 1}
              </span>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium transition-colors ${
                  isChecked ? 'line-through text-gray-400' : 'text-gray-800'
                }`}>
                  {item.pergunta}
                </p>
                {item.descricao && !isChecked && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.descricao}</p>
                )}
                {item.obs_obrigatoria_em_nao && !isChecked && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    <AlertCircle size={9} /> Obs. obrigatória em "Não"
                  </span>
                )}
              </div>

              {/* Check visual */}
              {isChecked && (
                <span className="text-xs font-semibold text-green-600 shrink-0">✓ OK</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 shrink-0">
        <p className="text-xs text-gray-400 text-center mb-3">
          {checkedCount}/{total} itens marcados
        </p>
        <button onClick={onClose} className="btn-secondary w-full justify-center">Fechar</button>
      </div>
    </Modal>
  );
}

// ── Modal de Link ────────────────────────────────────────────────────────────
function LinkModal({ template, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!template) return null;
  const url = `${window.location.origin}/checklist/fill/${template.id}`;

  function copyLink() {
    navigator.clipboard.writeText(url)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => toast.error('Não foi possível copiar'));
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <h2 className="font-bold text-gray-900">Link de Preenchimento</h2>
        <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
          <X size={18} />
        </button>
      </div>

      <div className="px-5 py-5 space-y-5 overflow-y-auto">
        {/* QR do link */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
            <QRCodeSVG value={url} size={180} level="H" />
          </div>
          <p className="text-xs text-gray-400 text-center">
            Escaneie para abrir o formulário diretamente
          </p>
        </div>

        {/* URL */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">URL do formulário</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-600 break-all select-all font-mono">
              {url}
            </div>
            <button
              onClick={copyLink}
              className={`shrink-0 px-3 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                copied
                  ? 'bg-green-50 border-green-400 text-green-600'
                  : 'border-blue-300 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            O voluntário precisa estar logado no sistema para acessar o link.
            Ao abrir, poderá selecionar o equipamento e preencher o checklist.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-100 shrink-0">
        <button onClick={copyLink} className="btn-primary w-full justify-center">
          {copied ? <><Check size={16} /> Link copiado!</> : <><Link2 size={16} /> Copiar link</>}
        </button>
      </div>
    </Modal>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function ChecklistTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [toggling, setToggling] = useState(null);

  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(null);
  const [linkModal, setLinkModal] = useState(null);

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

  async function openPreview(t) {
    setLoadingPreview(t.id);
    try {
      const res = await api.get(`/checklists/templates/${t.id}`);
      setPreview(res.data);
    } catch {
      toast.error('Erro ao carregar preview');
    } finally {
      setLoadingPreview(null);
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

      {/* Info */}
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
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{t.descricao}</p>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {/* Visualizar */}
                  <button
                    onClick={() => openPreview(t)}
                    disabled={loadingPreview === t.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium transition-colors"
                  >
                    {loadingPreview === t.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Eye size={13} />}
                    Visualizar
                  </button>

                  {/* Link */}
                  <button
                    onClick={() => setLinkModal(t)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 text-xs font-medium transition-colors"
                  >
                    <Link2 size={13} /> Link
                  </button>

                  {/* Editar */}
                  <Link
                    to={`/checklist/templates/${t.id}/editar`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium transition-colors"
                  >
                    <Pencil size={13} /> Editar
                  </Link>

                  {/* Excluir */}
                  <button
                    onClick={() => setDeleteId(t.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 text-xs font-medium transition-colors ml-auto"
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

      {/* Modal de Preview */}
      {preview && <PreviewModal template={preview} onClose={() => setPreview(null)} />}

      {/* Modal de Link */}
      {linkModal && <LinkModal template={linkModal} onClose={() => setLinkModal(null)} />}
    </div>
  );
}
