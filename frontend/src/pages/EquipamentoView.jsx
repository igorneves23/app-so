import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { QRCodeSVG } from 'qrcode.react';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import {
  Package, MapPin, Tag, Hash, ArrowDownToLine, ArrowUpToLine,
  Pencil, QrCode, Download, History, Loader2, ChevronLeft, ScanLine
} from 'lucide-react';

export default function EquipamentoView() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [equip, setEquip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [historico, setHistorico] = useState([]);

  const appUrl = window.location.origin;
  const equipUrl = `${appUrl}/equipamento/${id}`;

  useEffect(() => {
    loadEquip();
  }, [id]);

  async function loadEquip() {
    try {
      const res = await api.get(`/equipamentos/${id}`);
      setEquip(res.data);
      const hist = await api.get(`/equipamentos/${id}/historico?limit=10`);
      setHistorico(hist.data);
    } catch {
      toast.error('Equipamento não encontrado');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(tipo) {
    setActionLoading(true);
    try {
      await api.post(`/movimentacoes/${tipo}`, { equipamento_id: equip.id, observacao });
      toast.success(tipo === 'retirar' ? 'Retirada registrada!' : 'Devolução registrada!');
      setObservacao('');
      loadEquip();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao registrar');
    } finally {
      setActionLoading(false);
    }
  }

  async function loadQR() {
    if (qrData) { setShowQR(true); return; }
    try {
      const res = await api.get(`/equipamentos/${id}/qrcode`);
      setQrData(res.data);
      setShowQR(true);
    } catch {
      toast.error('Erro ao gerar QR Code');
    }
  }

  function downloadQR() {
    if (!qrData) return;
    const a = document.createElement('a');
    a.href = qrData.qr;
    a.download = `qrcode-${equip.nome.replace(/\s+/g, '-')}.png`;
    a.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!equip) return null;

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> Voltar
      </button>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          {equip.foto ? (
            <img
              src={equip.foto}
              alt={equip.nome}
              className="w-20 h-20 rounded-xl object-cover border border-gray-100 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Package size={32} className="text-blue-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{equip.nome}</h1>
              <StatusBadge status={equip.status} />
            </div>
            {equip.categoria && (
              <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {equip.categoria}
              </span>
            )}
            <div className="mt-2 space-y-1">
              {equip.codigo && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Tag size={12} /> Cód: {equip.codigo}
                </p>
              )}
              {equip.patrimonio && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Hash size={12} /> Patrimônio: {equip.patrimonio}
                </p>
              )}
              {equip.localizacao && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={12} /> {equip.localizacao}
                </p>
              )}
            </div>
          </div>
        </div>
        {equip.descricao && (
          <p className="mt-3 text-sm text-gray-600 border-t border-gray-100 pt-3">{equip.descricao}</p>
        )}
      </div>

      {/* Last movement info */}
      {equip.ultima_movimentacao && equip.status === 'retirado' && (
        <div className="card p-4 bg-red-50 border-red-100">
          <p className="text-sm text-red-700">
            <strong>Retirado por:</strong> {equip.ultima_movimentacao.usuario_nome}
          </p>
          <p className="text-xs text-red-500 mt-0.5">
            {new Date(equip.ultima_movimentacao.data_hora).toLocaleString('pt-BR')}
          </p>
        </div>
      )}

      {/* Action area */}
      {equip.status !== 'manutencao' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Registrar Movimentação</h2>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Observação (opcional)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
          <div className="flex gap-3">
            {equip.status === 'disponivel' && (
              <button
                onClick={() => handleAction('retirar')}
                disabled={actionLoading}
                className="btn-danger flex-1"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
                Retirar
              </button>
            )}
            {equip.status === 'retirado' && (
              <button
                onClick={() => handleAction('devolver')}
                disabled={actionLoading}
                className="btn-success flex-1"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpToLine size={16} />}
                Devolver
              </button>
            )}
          </div>
        </div>
      )}

      {equip.status === 'manutencao' && (
        <div className="card p-4 bg-amber-50 border-amber-100 text-center">
          <p className="text-amber-700 font-medium">Equipamento em manutenção</p>
          <p className="text-sm text-amber-600 mt-1">Não é possível realizar movimentações no momento.</p>
        </div>
      )}

      {/* Botão escanear próximo item */}
      <button
        onClick={() => navigate('/scanner')}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all font-medium text-sm"
      >
        <ScanLine size={20} />
        Escanear próximo item
      </button>

      {/* QR Code */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">QR Code</h2>
          <div className="flex gap-2">
            {showQR && (
              <button onClick={downloadQR} className="btn-secondary text-xs py-1.5 px-3">
                <Download size={14} /> Baixar
              </button>
            )}
            <button onClick={loadQR} className="btn-primary text-xs py-1.5 px-3">
              <QrCode size={14} /> {showQR ? 'Atualizar' : 'Ver QR'}
            </button>
          </div>
        </div>
        {showQR && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="p-3 bg-white border border-gray-200 rounded-xl">
              <QRCodeSVG value={equipUrl} size={180} level="H" />
            </div>
            <p className="text-xs text-gray-400 text-center break-all">{equipUrl}</p>
          </div>
        )}
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex gap-3">
          <Link to={`/equipamentos/${id}/editar`} className="btn-secondary flex-1 justify-center">
            <Pencil size={16} /> Editar
          </Link>
        </div>
      )}

      {/* History */}
      {historico.length > 0 && (
        <div className="card">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <History size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-800 text-sm">Histórico Recente</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {historico.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  m.tipo === 'retirada' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {m.tipo === 'retirada'
                    ? <ArrowDownToLine size={13} className="text-red-600" />
                    : <ArrowUpToLine size={13} className="text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{m.usuario_nome}</span>{' '}
                    <span className="text-gray-500">{m.tipo === 'retirada' ? 'retirou' : 'devolveu'}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(m.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
