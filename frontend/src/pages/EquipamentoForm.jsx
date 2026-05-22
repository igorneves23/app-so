import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  Package, Upload, Loader2, ChevronLeft,
  Download, QrCode, CheckCircle, Plus, Eye
} from 'lucide-react';

// ── Tela de sucesso após cadastro ──────────────────────────────────────────
function SuccessScreen({ equip, qrData, onDownload, onNovo }) {
  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      {/* Banner de sucesso */}
      <div className="card p-5 bg-green-50 border-green-100 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={30} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-green-800">Equipamento cadastrado!</h2>
          <p className="text-sm text-green-600 mt-0.5">{equip.nome}</p>
        </div>
      </div>

      {/* QR Code */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <QrCode size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">QR Code do Equipamento</h3>
        </div>

        {qrData ? (
          <div className="flex flex-col items-center gap-4">
            {/* QR Code visual */}
            <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm" id="qr-print-area">
              <QRCodeSVG value={qrData.url} size={200} level="H" />
              <p className="text-center text-xs text-gray-500 mt-2 font-medium">{equip.nome}</p>
              {equip.codigo && (
                <p className="text-center text-xs text-gray-400">Cód: {equip.codigo}</p>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center break-all px-2">{qrData.url}</p>

            {/* Botão de download */}
            <button
              onClick={onDownload}
              className="btn-primary w-full text-base py-3"
            >
              <Download size={18} />
              Baixar QR Code (PNG)
            </button>
            <p className="text-xs text-gray-400 text-center">
              Baixe e imprima para fixar no equipamento
            </p>
          </div>
        ) : (
          <div className="flex justify-center py-6">
            <Loader2 size={24} className="animate-spin text-blue-400" />
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-3">
        <Link to={`/equipamento/${equip.id}`} className="btn-secondary justify-center">
          <Eye size={16} /> Ver Equipamento
        </Link>
        <button onClick={onNovo} className="btn-primary justify-center">
          <Plus size={16} /> Cadastrar Outro
        </button>
      </div>

      <Link to="/equipamentos" className="btn-secondary w-full justify-center">
        Voltar para a lista
      </Link>
    </div>
  );
}

// ── Formulário principal ───────────────────────────────────────────────────
export default function EquipamentoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const emptyForm = {
    nome: '', categoria: '', codigo: '', patrimonio: '',
    localizacao: '', descricao: '', status: 'disponivel',
  };

  const [form, setForm] = useState(emptyForm);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoAtual, setFotoAtual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [created, setCreated] = useState(null);   // { equip, qrData }
  const [loadingQR, setLoadingQR] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/equipamentos/${id}`)
        .then((r) => {
          const { nome, categoria, codigo, patrimonio, localizacao, descricao, status, foto } = r.data;
          setForm({
            nome: nome || '', categoria: categoria || '', codigo: codigo || '',
            patrimonio: patrimonio || '', localizacao: localizacao || '',
            descricao: descricao || '', status: status || 'disponivel',
          });
          if (foto) { setFotoAtual(foto); setFotoPreview(foto); }
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

  function handleDownloadQR(qrData, equipNome) {
    if (!qrData) return;
    const a = document.createElement('a');
    a.href = qrData.qr;
    a.download = `qrcode-${equipNome.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
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
        navigate(`/equipamento/${id}`);
        return;
      }

      // CADASTRO NOVO → gera QR Code automaticamente
      const res = await api.post('/equipamentos', data);
      const novoEquip = res.data;

      setLoadingQR(true);
      try {
        const qrRes = await api.get(`/equipamentos/${novoEquip.id}/qrcode`);
        setCreated({ equip: novoEquip, qrData: qrRes.data });
      } catch {
        setCreated({ equip: novoEquip, qrData: null });
      } finally {
        setLoadingQR(false);
      }

    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  // Tela de sucesso após cadastro
  if (created) {
    return (
      <SuccessScreen
        equip={created.equip}
        qrData={created.qrData}
        onDownload={() => handleDownloadQR(created.qrData, created.equip.nome)}
        onNovo={() => {
          setCreated(null);
          setForm(emptyForm);
          setFoto(null);
          setFotoPreview(null);
        }}
      />
    );
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

      {!isEdit && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
          <QrCode size={16} className="shrink-0" />
          O QR Code será gerado automaticamente após o cadastro.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Foto */}
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Equipamento</label>
          <div className="flex items-center gap-4">
            {fotoPreview ? (
              <div className="relative">
                <img
                  src={fotoPreview}
                  alt=""
                  className="w-24 h-24 rounded-xl object-cover border border-gray-200"
                />
                {isEdit && foto && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Nova
                  </span>
                )}
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
                <Package size={28} className="text-gray-400" />
              </div>
            )}
            <div className="space-y-2">
              <label className="btn-secondary cursor-pointer text-sm">
                <Upload size={15} />
                {fotoPreview ? 'Trocar foto' : 'Adicionar foto'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              </label>
              {isEdit && fotoPreview && (
                <p className="text-xs text-gray-400">
                  {foto ? 'Nova foto selecionada' : 'Foto atual'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Campos */}
        <div className="card p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              className="input"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Projetor Epson"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input
                className="input"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="Ex: Audiovisual"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="disponivel">Disponível</option>
                <option value="retirado">Retirado</option>
                <option value="manutencao">Manutenção</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno</label>
              <input
                className="input"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="Ex: EQ-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patrimônio</label>
              <input
                className="input"
                value={form.patrimonio}
                onChange={(e) => setForm({ ...form, patrimonio: e.target.value })}
                placeholder="Nº patrimônio"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
            <input
              className="input"
              value={form.localizacao}
              onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
              placeholder="Ex: Sala de Equipamentos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Observações sobre o equipamento..."
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> {isEdit ? 'Salvando...' : 'Cadastrando...'}</>
          ) : isEdit ? (
            'Salvar Alterações'
          ) : (
            <><QrCode size={16} /> Cadastrar e Gerar QR Code</>
          )}
        </button>
      </form>
    </div>
  );
}
