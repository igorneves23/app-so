import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ClipboardCheck, CheckCircle, AlertTriangle, XCircle,
  Package, ChevronRight, Loader2, Settings, Filter,
} from 'lucide-react';

const STATUS_CONFIG = {
  aprovado: { label: 'Aprovado',    Icon: CheckCircle,  color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  alerta:   { label: 'Com Alerta',  Icon: AlertTriangle, color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  problema: { label: 'Problema',    Icon: XCircle,       color: 'bg-red-100 text-red-700',     dot: 'bg-red-500'   },
};

function StatusBadgeVerif({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.aprovado;
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

export default function Verificacoes() {
  const { isAdmin } = useAuth();
  const [verificacoes, setVerificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => { load(); }, [statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/verificacoes', { params });
      setVerificacoes(res.data);
    } catch {
      toast.error('Erro ao carregar verificações');
    } finally {
      setLoading(false);
    }
  }

  const counts = {
    total:    verificacoes.length,
    aprovado: verificacoes.filter((v) => v.status === 'aprovado').length,
    alerta:   verificacoes.filter((v) => v.status === 'alerta').length,
    problema: verificacoes.filter((v) => v.status === 'problema').length,
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verificações</h1>
          <p className="text-xs text-gray-500 mt-0.5">Histórico de checklists realizados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-2 rounded-xl border transition-colors ${showFilter ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-500'}`}
          >
            <Filter size={18} />
          </button>
          {isAdmin && (
            <Link to="/checklist/templates" className="btn-secondary text-sm py-2 px-3">
              <Settings size={15} /> Checklists
            </Link>
          )}
        </div>
      </div>

      {/* Filtro */}
      {showFilter && (
        <div className="card p-3">
          <p className="text-xs font-medium text-gray-600 mb-2">Filtrar por status</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { val: '', label: 'Todos' },
              { val: 'aprovado', label: 'Aprovado' },
              { val: 'alerta',   label: 'Com Alerta' },
              { val: 'problema', label: 'Problema' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === val
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resumo */}
      {!loading && verificacoes.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', val: counts.total, color: 'bg-gray-100 text-gray-700' },
            { label: 'OK', val: counts.aprovado, color: 'bg-green-100 text-green-700' },
            { label: 'Alerta', val: counts.alerta, color: 'bg-amber-100 text-amber-700' },
            { label: 'Prob.', val: counts.problema, color: 'bg-red-100 text-red-700' },
          ].map(({ label, val, color }) => (
            <div key={label} className={`card p-2 text-center rounded-xl ${color}`}>
              <p className="text-lg font-bold">{val}</p>
              <p className="text-xs">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : verificacoes.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <ClipboardCheck size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-500 font-medium">Nenhuma verificação registrada</p>
          <p className="text-xs text-gray-400">
            Escaneie o QR Code de um equipamento e toque em "Verificar"
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 overflow-hidden">
          {verificacoes.map((v) => (
            <Link
              key={v.id}
              to={`/verificacoes/${v.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              {/* Foto ou ícone */}
              {v.equipamento_foto ? (
                <img
                  src={v.equipamento_foto}
                  alt=""
                  className="w-11 h-11 rounded-lg object-cover shrink-0 border border-gray-100"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-gray-400" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{v.equipamento_nome}</p>
                <p className="text-xs text-gray-500 truncate">
                  {v.usuario_nome} ·{' '}
                  {new Date(v.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
                <div className="mt-1">
                  <StatusBadgeVerif status={v.status} />
                  {v.total_itens > 0 && (
                    <span className="ml-1.5 text-xs text-gray-400">{v.total_itens} itens</span>
                  )}
                </div>
              </div>

              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
