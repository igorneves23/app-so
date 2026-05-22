import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Package, Upload, Loader2, ChevronLeft } from 'lucide-react';

export default function EquipamentoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    nome: '', categoria: '', codigo: '', patrimonio: '',
    localizacao: '', descricao: '', status: 'disponivel',
  });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      api.get(`/equipamentos/${id}`)
        .then((r) => {
          const { nome, categoria, codigo, patrimonio, localizacao, descricao, status, foto } = r.data;
          setForm({ nome: nome || '', categoria: categoria || '', codigo: codigo || '', patrimonio: patrimonio || '', localizacao: localizacao || '', descricao: descricao || '', status: status || 'disponivel' });
          if (foto) setFotoPreview(foto);
        })
        .catch(() => { toast.error('Equipamento não encontrado'); navigate('/equipamentos'); })
        .finally(() => setLoadingData(false));
    }
  }, [id]);

  function handleFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error('Nome é obrigatório');
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (foto) data.append('foto', foto);

      if (isEdit) {
        await api.put(`/equipamentos/${id}`, data);
        toast.success('Equipamento atualizado!');
      } else {
        const res = await api.post('/equipamentos', data);
        toast.success('Equipamento cadastrado!');
        navigate(`/equipamento/${res.data.id}`);
        return;
      }
      navigate(`/equipamento/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
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
        {isEdit ? 'Editar Equipamento' : 'Novo Equipamento'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Foto */}
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Equipamento</label>
          <div className="flex items-center gap-4">
            {fotoPreview ? (
              <img src={fotoPreview} alt="" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
                <Package size={28} className="text-gray-400" />
              </div>
            )}
            <label className="btn-secondary cursor-pointer text-sm">
              <Upload size={15} /> {fotoPreview ? 'Trocar foto' : 'Adicionar foto'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            </label>
          </div>
        </div>

        {/* Fields */}
        <div className="card p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Projetor Epson" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input className="input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Audiovisual" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="disponivel">Disponível</option>
                <option value="retirado">Retirado</option>
                <option value="manutencao">Manutenção</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno</label>
              <input className="input" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ex: EQ-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patrimônio</label>
              <input className="input" value={form.patrimonio} onChange={(e) => setForm({ ...form, patrimonio: e.target.value })} placeholder="Nº patrimônio" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
            <input className="input" value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} placeholder="Ex: Sala de Equipamentos" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea className="input resize-none" rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Observações sobre o equipamento..." />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : isEdit ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
        </button>
      </form>
    </div>
  );
}
