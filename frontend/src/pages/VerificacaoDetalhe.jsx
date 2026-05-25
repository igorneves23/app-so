import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Loader2, Package, CheckCircle, AlertTriangle,
  XCircle, Check, X, Minus, MapPin, Hash, Tag, Calendar, User,
  ClipboardCheck, Camera, MessageSquare,
} from 'lucide-react';

const STATUS_CONFIG = {
  aprovado: {
    label: 'Aprovado',
    sublabel: 'Equipamento verificado e funcionando',
    Icon: CheckCircle,
    iconColor: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    ring: 'bg-green-100',
    headerColor: 'bg-green-600',
  },
  alerta: {
    label: 'Com Observações',
    sublabel: 'Equipamento funcionando com alertas',
    Icon: AlertTriangle,
    iconColor: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    ring: 'bg-amber-100',
    headerColor: 'bg-amber-500',
  },
  problema: {
    label: 'Problema Identificado',
    sublabel: 'Equipamento com falha — requer atenção',
    Icon: XCircle,
    iconColor: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    ring: 'bg-red-100',
    headerColor: 'bg-red-600',
  },
};

const RESPOSTA_CONFIG = {
  sim: { label: 'Sim',  Icon: Check, color: 'bg-green-100 text-green-700', rowBg: '' },
  nao: { label: 'Não',  Icon: X,     color: 'bg-red-100 text-red-700',     rowBg: 'bg-red-50/50' },
  na:  { label: 'N/A',  Icon: Minus, color: 'bg-gray-100 text-gray-500',   rowBg: '' },
};

export default function VerificacaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [verif, setVerif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const res = await api.get(`/verificacoes/${id}`);
      setVerif(res.data);
    } catch {
      toast.error('Verificação não encontrada');
      navigate('/verificacoes');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!verif) return null;

  const cfg = STATUS_CONFIG[verif.status] || STATUS_CONFIG.aprovado;
  const StatusIcon = cfg.Icon;

  const simCount = verif.respostas.filter((r) => r.resposta === 'sim').length;
  const naoCount = verif.respostas.filter((r) => r.resposta === 'nao').length;
  const naCount  = verif.respostas.filter((r) => r.resposta === 'na').length;

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4 pb-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> Voltar
      </button>

      {/* Status banner */}
      <div className={`card p-5 ${cfg.bg} border ${cfg.border}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full ${cfg.ring} flex items-center justify-center shrink-0`}>
            <StatusIcon size={32} className={cfg.iconColor} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{cfg.label}</h2>
            <p className="text-sm text-gray-600">{cfg.sublabel}</p>
          </div>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-green-100 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-700">{simCount}</p>
            <p className="text-xs text-green-600">Sim</p>
          </div>
          <div className="bg-red-100 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-red-700">{naoCount}</p>
            <p className="text-xs text-red-600">Não</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-gray-600">{naCount}</p>
            <p className="text-xs text-gray-500">N/A</p>
          </div>
        </div>
      </div>

      {/* Equipamento */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Equipamento</h3>
        <div className="flex items-center gap-3">
          {verif.equipamento_foto ? (
            <img src={verif.equipamento_foto} alt={verif.equipamento_nome} className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Package size={22} className="text-gray-400" />
            </div>
          )}
          <div>
            <Link
              to={`/equipamento/${verif.equip_id}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {verif.equipamento_nome}
            </Link>
            <div className="space-y-0.5 mt-1">
              {verif.equipamento_categoria && (
                <p className="text-xs text-gray-500 flex items-center gap-1"><Tag size={11} /> {verif.equipamento_categoria}</p>
              )}
              {verif.equipamento_codigo && (
                <p className="text-xs text-gray-500 flex items-center gap-1"><Hash size={11} /> {verif.equipamento_codigo}</p>
              )}
              {verif.equipamento_localizacao && (
                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={11} /> {verif.equipamento_localizacao}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div className="card p-4 space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Realizado por</h3>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User size={15} className="text-gray-400" />
          <span className="font-medium">{verif.usuario_nome}</span>
          <span className="text-gray-400 text-xs">{verif.usuario_email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar size={15} className="text-gray-400" />
          <span>{new Date(verif.data_hora).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</span>
        </div>
      </div>

      {/* Respostas */}
      {verif.respostas.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <ClipboardCheck size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Respostas do Checklist</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {verif.respostas.map((r, idx) => {
              const rcfg = RESPOSTA_CONFIG[r.resposta] || RESPOSTA_CONFIG.na;
              const RIcon = rcfg.Icon;
              return (
                <div key={r.id} className={`px-4 py-3 ${rcfg.rowBg}`}>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium">{r.pergunta}</p>
                      {r.observacao && (
                        <div className="mt-1.5 flex items-start gap-1.5">
                          <MessageSquare size={12} className="text-gray-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-600 italic">{r.observacao}</p>
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${rcfg.color}`}>
                      <RIcon size={11} /> {rcfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Observação geral */}
      {verif.observacao_geral && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Observação Geral</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{verif.observacao_geral}</p>
        </div>
      )}

      {/* Fotos */}
      {verif.fotos.length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Fotos ({verif.fotos.length})</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {verif.fotos.map((f) => (
              <button key={f.id} onClick={() => setFotoAmpliada(f.url)} className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                <img src={f.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Foto ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <img src={fotoAmpliada} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button
            onClick={() => setFotoAmpliada(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
