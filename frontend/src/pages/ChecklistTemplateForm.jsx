import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Plus, Trash2, Loader2, GripVertical,
  ArrowUp, ArrowDown, Globe, Tag, Package, AlertCircle,
} from 'lucide-react';

let tempId = 0;
function newItem() {
  return { _id: ++tempId, pergunta: '', descricao: '', obs_obrigatoria_em_nao: true };
}

export default function ChecklistTemplateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ nome: '', descricao: '', tipo: 'global', categoria: '', equipamento_id: '' });
  const [itens, setItens] = useState([newItem()]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Carregar categorias e equipamentos para os selects
    api.get('/equipamentos/categorias').then((r) => setCategorias(r.data)).catch(() => {});
    api.get('/equipamentos').then((r) => setEquipamentos(r.data)).catch(() => {});

    if (isEdit) {
      api.get(`/checklists/templates/${id}`)
        .then((r) => {
          const { nome, descricao, tipo, categoria, equipamento_id } = r.data;
          setForm({
            nome: nome || '',
            descricao: descricao || '',
            tipo: tipo || 'global',
            categoria: categoria || '',
            equipamento_id: equipamento_id || '',
          });
          setItens(
            r.data.itens.length > 0
              ? r.data.itens.map((i) => ({
                  _id: ++tempId,
                  pergunta: i.pergunta,
                  descricao: i.descricao || '',
                  obs_obrigatoria_em_nao: i.obs_obrigatoria_em_nao,
                }))
              : [newItem()]
          );
        })
        .catch(() => { toast.error('Template não encontrado'); navigate('/checklist/templates'); })
        .finally(() => setLoading(false));
    }
  }, [id]);

  function addItem() { setItens((p) => [...p, newItem()]); }
  function removeItem(idx) { setItens((p) => p.filter((_, i) => i !== idx)); }

  function moveItem(idx, dir) {
    setItens((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function updateItem(idx, campo, valor) {
    setItens((p) => p.map((item, i) => (i === idx ? { ...item, [campo]: valor } : item)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error('Nome do checklist é obrigatório');
    if (form.tipo === 'categoria' && !form.categoria.trim()) return toast.error('Selecione uma categoria');
    if (form.tipo === 'equipamento' && !form.equipamento_id) return toast.error('Selecione um equipamento');
    const itensValidos = itens.filter((i) => i.pergunta.trim());
    if (itensValidos.length === 0) return toast.error('Adicione pelo menos um item ao checklist');

    setSaving(true);
    try {
      const payload = {
        ...form,
        equipamento_id: form.tipo === 'equipamento' ? form.equipamento_id || null : null,
        categoria: form.tipo === 'categoria' ? form.categoria || null : null,
        itens: itensValidos.map((i) => ({
          pergunta: i.pergunta.trim(),
          descricao: i.descricao?.trim() || null,
          obs_obrigatoria_em_nao: i.obs_obrigatoria_em_nao,
        })),
      };
      if (isEdit) {
        await api.put(`/checklists/templates/${id}`, payload);
        toast.success('Checklist atualizado!');
      } else {
        await api.post('/checklists/templates', payload);
        toast.success('Checklist criado!');
      }
      navigate('/checklist/templates');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> Voltar
      </button>
      <h1 className="text-xl font-bold text-gray-900">
        {isEdit ? 'Editar Checklist' : 'Novo Checklist'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informações básicas */}
        <div className="card p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Checklist *</label>
            <input
              className="input"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Verificação de Câmera"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descreva quando este checklist deve ser usado..."
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aplicar a</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'global',      label: 'Todos',      Icon: Globe,    desc: 'Qualquer equipamento' },
                { val: 'categoria',   label: 'Categoria',  Icon: Tag,      desc: 'Uma categoria específica' },
                { val: 'equipamento', label: 'Equipamento', Icon: Package, desc: 'Um item específico' },
              ].map(({ val, label, Icon, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, tipo: val })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${
                    form.tipo === val
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-[10px] leading-tight opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categoria select */}
          {form.tipo === 'categoria' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              {categorias.length > 0 ? (
                <select
                  className="input"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input
                  className="input"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ex: Câmeras, Áudio, Iluminação..."
                />
              )}
            </div>
          )}

          {/* Equipamento select */}
          {form.tipo === 'equipamento' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento *</label>
              <select
                className="input"
                value={form.equipamento_id}
                onChange={(e) => setForm({ ...form, equipamento_id: e.target.value })}
              >
                <option value="">Selecione o equipamento...</option>
                {equipamentos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}{e.categoria ? ` (${e.categoria})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Itens do checklist */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Itens do Checklist</h2>
            <span className="text-xs text-gray-400">{itens.filter((i) => i.pergunta.trim()).length} itens</span>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Quando a resposta for "Não", a observação pode ser obrigatória. Ative abaixo por item.
            </p>
          </div>

          {itens.map((item, idx) => (
            <div key={item._id} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  className="input flex-1 bg-white"
                  value={item.pergunta}
                  onChange={(e) => updateItem(idx, 'pergunta', e.target.value)}
                  placeholder="Pergunta de verificação *"
                />
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === itens.length - 1}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={itens.length === 1}
                    className="p-1 rounded text-gray-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <input
                className="input bg-white text-sm"
                value={item.descricao}
                onChange={(e) => updateItem(idx, 'descricao', e.target.value)}
                placeholder="Descrição/dica (opcional)"
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.obs_obrigatoria_em_nao}
                  onChange={(e) => updateItem(idx, 'obs_obrigatoria_em_nao', e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <span className="text-xs text-gray-600">Obs. obrigatória quando resposta for "Não"</span>
              </label>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="w-full py-2.5 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 text-sm font-medium hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Adicionar item
          </button>
        </div>

        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={saving}>
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Salvando...</>
          ) : isEdit ? 'Salvar Alterações' : 'Criar Checklist'}
        </button>
      </form>
    </div>
  );
}
